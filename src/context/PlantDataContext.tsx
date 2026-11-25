import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import {
  ADMIN_EMAIL,
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  SEED_EVENTS,
  SEED_GROWTH_UPDATES,
  SEED_PARTICIPANTS,
  SEED_PLANTS,
  SEED_PLANT_RECORDS,
} from '../data/seedData';
import type {
  EnrichedPlantJourney,
  EventItem,
  PlantSpecies,
} from '../types/plantJourney';
import {
  ackWebhookInbox,
  enrichJourneyDoc,
  fetchGoogleSheetRows,
  fetchJourneyByCodeFromFirestore,
  fetchWebhookInbox,
  importFormRowsToFirestore,
  saveIntegrationSettingsInFirestore,
  seedInitialCatalogAndSamples,
  type ExistingFingerprintEntry,
  type IntegrationSettings,
  type RawPlantJourneyDoc,
} from '../services/firestoreSync';

interface PlantDataContextValue {
  authReady: boolean;
  user: User | null;
  isAdmin: boolean;
  firestoreReady: boolean;
  catalogLoaded: boolean;
  plants: PlantSpecies[];
  events: EventItem[];
  journeys: EnrichedPlantJourney[];
  fingerprints: Set<string>;
  integrationSettings: IntegrationSettings;
  lastAutoSyncNotice: string;
  syncingGForm: boolean;
  syncGoogleSheetNow: (
    overrideSettings?: IntegrationSettings
  ) => Promise<{
    createdCodes: string[];
    updatedCodes: string[];
    skippedCount: number;
    detectedPhotoHeaders: string[];
  }>;
  getJourneyByCode: (code: string) => EnrichedPlantJourney | undefined;
  resolveJourneyByCode: (code: string) => Promise<EnrichedPlantJourney | null>;
  getPlantByIdOrCode: (id: string) => PlantSpecies | undefined;
  getEventBySlug: (slug: string) => EventItem | undefined;
  movementStats: {
    totalTreesPlanted: number;
    totalSpecies: number;
    totalVolunteers: number;
    speciesNamesSummary: string;
  };
}

const DEFAULT_SETTINGS: IntegrationSettings = {
  sheetUrl: '',
  defaultPlantId: SEED_PLANTS[0].id,
  defaultEventId: SEED_EVENTS[1]?.id || SEED_EVENTS[0].id,
  defaultPlantingDate: '14 Desember 2026',
  defaultLocation: 'Pesisir Marunda, Jakarta Utara',
  defaultTemplateId: 'forest',
  autoSyncEnabled: true,
  lastSyncedAt: '',
};

const SEED_ENRICHED_JOURNEYS: EnrichedPlantJourney[] = SEED_PLANT_RECORDS.map(
  (rec) => {
    const participant = SEED_PARTICIPANTS.find((p) => p.id === rec.participantId)!;
    const plant = SEED_PLANTS.find((pl) => pl.id === rec.plantId)!;
    const event =
      SEED_EVENTS.find((ev) => ev.id === participant.eventId) || SEED_EVENTS[0];
    const growthUpdates = SEED_GROWTH_UPDATES.filter(
      (u) => u.plantRecordId === rec.id
    );
    return {
      record: rec,
      participant,
      plant,
      event,
      growthUpdates,
    };
  }
);

const PlantDataContext = createContext<PlantDataContextValue | null>(null);

export function PlantDataProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [rawPlants, setRawPlants] = useState<PlantSpecies[] | null>(null);
  const [rawEvents, setRawEvents] = useState<EventItem[] | null>(null);
  const [plantsLoaded, setPlantsLoaded] = useState(false);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [rawJourneys, setRawJourneys] = useState<RawPlantJourneyDoc[] | null>(
    null
  );
  const [journeysLoaded, setJourneysLoaded] = useState(false);
  const [integrationSettings, setIntegrationSettings] =
    useState<IntegrationSettings>(DEFAULT_SETTINGS);
  const [syncingGForm, setSyncingGForm] = useState(false);
  const [lastAutoSyncNotice, setLastAutoSyncNotice] = useState('');

  const seededRef = useRef(false);
  const syncingRef = useRef(false);

  const isAdmin = Boolean(
    user &&
      user.emailVerified &&
      user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  // 1. Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  // 2. Seed Firestore once when Admin signs in
  useEffect(() => {
    if (!isAdmin || seededRef.current) return;
    seededRef.current = true;
    void seedInitialCatalogAndSamples();
  }, [isAdmin]);

  // 3. Real-time Firestore listeners (public catalogs only; plantJourneys list is Admin-only)
  useEffect(() => {
    const unsubPlants = onSnapshot(
      collection(db, 'plants'),
      (snap) => {
        setPlantsLoaded(true);
        if (snap.empty) {
          setRawPlants(null);
        } else {
          const list = snap.docs.map((d) => d.data() as PlantSpecies);
          list.sort((a, b) => a.plantCode.localeCompare(b.plantCode));
          setRawPlants(list);
        }
      },
      (err) => {
        setPlantsLoaded(true);
        handleFirestoreError(err, OperationType.LIST, 'plants');
      }
    );

    const unsubEvents = onSnapshot(
      collection(db, 'events'),
      (snap) => {
        setEventsLoaded(true);
        if (snap.empty) {
          setRawEvents(null);
        } else {
          const list = snap.docs.map((d) => d.data() as EventItem);
          list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setRawEvents(list);
        }
      },
      (err) => {
        setEventsLoaded(true);
        handleFirestoreError(err, OperationType.LIST, 'events');
      }
    );

    return () => {
      unsubPlants();
      unsubEvents();
    };
  }, []);

  // 3b. Admin-only listener for full plantJourneys collection (prevents public scraping)
  useEffect(() => {
    if (!isAdmin) {
      setRawJourneys(null);
      setJourneysLoaded(false);
      return;
    }

    const unsubJourneys = onSnapshot(
      collection(db, 'plantJourneys'),
      (snap) => {
        setJourneysLoaded(true);
        if (snap.empty) {
          setRawJourneys(null);
        } else {
          const docs = snap.docs.map((d) => d.data() as RawPlantJourneyDoc);
          docs.sort((a, b) => a.plantIdCode.localeCompare(b.plantIdCode));
          setRawJourneys(docs);
        }
      },
      (err) => {
        setJourneysLoaded(true);
        handleFirestoreError(err, OperationType.LIST, 'plantJourneys');
      }
    );

    return unsubJourneys;
  }, [isAdmin]);

  // 4. Admin-only Integration Settings listener
  useEffect(() => {
    if (!isAdmin) {
      setIntegrationSettings(DEFAULT_SETTINGS);
      return;
    }

    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'gform'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as Partial<IntegrationSettings>;
          setIntegrationSettings({
            sheetUrl: d.sheetUrl || '',
            defaultPlantId: d.defaultPlantId || SEED_PLANTS[0].id,
            defaultEventId:
              d.defaultEventId || SEED_EVENTS[1]?.id || SEED_EVENTS[0].id,
            defaultPlantingDate: d.defaultPlantingDate || '14 Desember 2026',
            defaultLocation:
              d.defaultLocation || 'Pesisir Marunda, Jakarta Utara',
            defaultTemplateId: d.defaultTemplateId || 'forest',
            autoSyncEnabled:
              typeof d.autoSyncEnabled === 'boolean' ? d.autoSyncEnabled : true,
            lastSyncedAt: d.lastSyncedAt || '',
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'settings/gform')
    );

    return unsubSettings;
  }, [isAdmin]);

  const plants = useMemo(
    () => (rawPlants && rawPlants.length > 0 ? rawPlants : SEED_PLANTS),
    [rawPlants]
  );

  const events = useMemo(
    () => (rawEvents && rawEvents.length > 0 ? rawEvents : SEED_EVENTS),
    [rawEvents]
  );

  const journeys = useMemo(() => {
    if (!isAdmin) return [];
    if (!rawJourneys || rawJourneys.length === 0) {
      return SEED_ENRICHED_JOURNEYS;
    }
    return rawJourneys
      .map((docData) => enrichJourneyDoc(docData, plants, events, []))
      .filter((item): item is EnrichedPlantJourney => item !== null);
  }, [isAdmin, rawJourneys, plants, events]);

  const fingerprints = useMemo(() => {
    const set = new Set<string>();
    if (rawJourneys) {
      for (const item of rawJourneys) {
        if (item.sourceFingerprint) set.add(item.sourceFingerprint);
      }
    }
    return set;
  }, [rawJourneys]);

  const existingByFingerprint = useMemo(() => {
    const map = new Map<string, ExistingFingerprintEntry>();
    if (rawJourneys) {
      for (const item of rawJourneys) {
        if (item.sourceFingerprint) {
          map.set(item.sourceFingerprint, {
            plantIdCode: item.plantIdCode,
            cardFrontPhoto: item.cardFrontPhoto || '',
            studyProgram: item.studyProgram || '',
          });
        }
      }
    }
    return map;
  }, [rawJourneys]);

  const catalogLoaded = plantsLoaded && eventsLoaded;
  const firestoreReady = Boolean(rawPlants && rawEvents);

  // 5. Google Form Sync (both Sheet CSV auto-fetch & Apps Script Webhook inbox)
  const syncGoogleSheetNow = useCallback(
    async (overrideSettings?: IntegrationSettings) => {
      if (!user || !isAdmin) {
        throw new Error('Login Admin diperlukan untuk sinkronisasi.');
      }
      if (syncingRef.current) {
        return {
          createdCodes: [],
          updatedCodes: [],
          skippedCount: 0,
          detectedPhotoHeaders: [],
        };
      }

      syncingRef.current = true;
      setSyncingGForm(true);
      try {
        const activeSettings = overrideSettings || integrationSettings;
        const idToken = await user.getIdToken();

        // Check queued webhook submissions first
        const webhookRows = await fetchWebhookInbox(idToken);
        let sheetRows = [] as typeof webhookRows;
        let detectedPhotoHeaders: string[] = [];

        if (activeSettings.sheetUrl.trim()) {
          const res = await fetchGoogleSheetRows(
            activeSettings.sheetUrl.trim(),
            idToken
          );
          sheetRows = res.rows;
          detectedPhotoHeaders = res.detectedPhotoHeaders;
        }

        const combined = [...webhookRows, ...sheetRows];
        const fpSet = new Set(fingerprints);
        const result = await importFormRowsToFirestore(
          combined,
          {
            defaultPlantId: activeSettings.defaultPlantId || plants[0].id,
            eventId: activeSettings.defaultEventId || events[0].id,
            plantingDate: activeSettings.defaultPlantingDate,
            location: activeSettings.defaultLocation,
            templateId: activeSettings.defaultTemplateId,
          },
          fpSet,
          journeys,
          plants,
          events,
          {
            existingByFingerprint,
            refreshSheetPhotos: true,
          }
        );

        if (webhookRows.length > 0) {
          await ackWebhookInbox(
            webhookRows.map((w) => w.fingerprint),
            idToken
          );
        }

        const nowLabel = new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        });

        await saveIntegrationSettingsInFirestore({
          ...activeSettings,
          lastSyncedAt: nowLabel,
        });

        if (result.createdCodes.length > 0 || result.updatedCodes.length > 0) {
          const parts: string[] = [];
          if (result.createdCodes.length > 0) {
            parts.push(
              `${result.createdCodes.length} peserta baru (${result.createdCodes[0]} – ${result.createdCodes[result.createdCodes.length - 1]})`
            );
          }
          if (result.updatedCodes.length > 0) {
            parts.push(
              `${result.updatedCodes.length} foto pribadi/biodata peserta diperbarui`
            );
          }
          setLastAutoSyncNotice(
            `${parts.join(' & ')} pukul ${nowLabel}.`
          );
        }

        return {
          ...result,
          detectedPhotoHeaders,
        };
      } finally {
        syncingRef.current = false;
        setSyncingGForm(false);
      }
    },
    [
      user,
      isAdmin,
      integrationSettings,
      fingerprints,
      existingByFingerprint,
      journeys,
      plants,
      events,
    ]
  );

  // Automatic background polling when Admin is logged in & Firestore seeded
  useEffect(() => {
    if (!isAdmin || !firestoreReady || !journeysLoaded) return;

    const runSilentAutoSync = async () => {
      if (syncingRef.current || !user) return;
      try {
        const idToken = await user.getIdToken();
        const webhookRows = await fetchWebhookInbox(idToken);
        let sheetRows: typeof webhookRows = [];

        if (
          integrationSettings.autoSyncEnabled &&
          integrationSettings.sheetUrl.trim()
        ) {
          const res = await fetchGoogleSheetRows(
            integrationSettings.sheetUrl.trim(),
            idToken
          );
          sheetRows = res.rows;
        }

        const combined = [...webhookRows, ...sheetRows];
        if (combined.length === 0) return;

        const fpSet = new Set(fingerprints);
        const result = await importFormRowsToFirestore(
          combined,
          {
            defaultPlantId: integrationSettings.defaultPlantId || plants[0].id,
            eventId: integrationSettings.defaultEventId || events[0].id,
            plantingDate: integrationSettings.defaultPlantingDate,
            location: integrationSettings.defaultLocation,
            templateId: integrationSettings.defaultTemplateId,
          },
          fpSet,
          journeys,
          plants,
          events,
          {
            existingByFingerprint,
            refreshSheetPhotos: true,
          }
        );

        if (webhookRows.length > 0) {
          await ackWebhookInbox(
            webhookRows.map((w) => w.fingerprint),
            idToken
          );
        }

        if (result.createdCodes.length > 0 || result.updatedCodes.length > 0) {
          const nowLabel = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const parts: string[] = [];
          if (result.createdCodes.length > 0) {
            parts.push(
              `${result.createdCodes.length} peserta baru (${result.createdCodes.join(', ')})`
            );
          }
          if (result.updatedCodes.length > 0) {
            parts.push(
              `${result.updatedCodes.length} foto pribadi diperbarui`
            );
          }
          setLastAutoSyncNotice(
            `${parts.join(' & ')} otomatis pukul ${nowLabel}.`
          );
        }
      } catch {
        // Silent background retry next interval
      }
    };

    const initialTimer = window.setTimeout(() => {
      void runSilentAutoSync();
    }, 1500);

    const interval = window.setInterval(() => {
      void runSilentAutoSync();
    }, 15000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [
    isAdmin,
    firestoreReady,
    journeysLoaded,
    user,
    integrationSettings,
    fingerprints,
    existingByFingerprint,
    journeys,
    plants,
    events,
  ]);

  const getJourneyByCode = useCallback(
    (code: string) => {
      const normalized = code.trim().toUpperCase();
      return journeys.find(
        (j) => j.record.plantIdCode.toUpperCase() === normalized
      );
    },
    [journeys]
  );

  const resolveJourneyByCode = useCallback(
    async (code: string): Promise<EnrichedPlantJourney | null> => {
      const normalized = code.trim().toUpperCase();
      if (!normalized) return null;

      if (isAdmin) {
        const localMatch = journeys.find(
          (j) => j.record.plantIdCode.toUpperCase() === normalized
        );
        if (localMatch) return localMatch;
      }

      const remote = await fetchJourneyByCodeFromFirestore(
        normalized,
        plants,
        events
      );
      if (remote) return remote;

      // Fallback only when database has not been seeded yet
      if (!rawPlants) {
        return (
          SEED_ENRICHED_JOURNEYS.find(
            (j) => j.record.plantIdCode.toUpperCase() === normalized
          ) || null
        );
      }

      return null;
    },
    [isAdmin, journeys, plants, events, rawPlants]
  );

  const getPlantByIdOrCode = useCallback(
    (id: string) =>
      plants.find(
        (p) => p.id === id || p.plantCode.toLowerCase() === id.toLowerCase()
      ),
    [plants]
  );

  const getEventBySlug = useCallback(
    (slug: string) => events.find((e) => e.slug === slug),
    [events]
  );

  const movementStats = useMemo(() => {
    const completedTrees = events
      .filter((e) => e.status === 'Completed')
      .reduce((sum, e) => sum + e.treesPlantedTarget, 0);

    const totalTreesPlanted =
      completedTrees > 0
        ? completedTrees
        : events.reduce((sum, e) => sum + e.treesPlantedTarget, 0);

    const totalVolunteers = Math.max(
      events.reduce((sum, e) => sum + e.volunteerCount, 0),
      journeys.length
    );

    const speciesNamesSummary = plants
      .map((p) => p.plantName)
      .slice(0, 3)
      .join(', ');

    return {
      totalTreesPlanted,
      totalSpecies: plants.length,
      totalVolunteers,
      speciesNamesSummary,
    };
  }, [events, plants, journeys.length]);

  const value: PlantDataContextValue = {
    authReady,
    user,
    isAdmin,
    firestoreReady,
    catalogLoaded,
    plants,
    events,
    journeys,
    fingerprints,
    integrationSettings,
    lastAutoSyncNotice,
    syncingGForm,
    syncGoogleSheetNow,
    getJourneyByCode,
    resolveJourneyByCode,
    getPlantByIdOrCode,
    getEventBySlug,
    movementStats,
  };

  return (
    <PlantDataContext.Provider value={value}>
      {children}
    </PlantDataContext.Provider>
  );
}

export function usePlantData(): PlantDataContextValue {
  const ctx = useContext(PlantDataContext);
  if (!ctx) {
    throw new Error('usePlantData must be used inside PlantDataProvider');
  }
  return ctx;
}
