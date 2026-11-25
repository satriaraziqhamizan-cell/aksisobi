import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  MEDIA_ASSETS,
  SEED_EVENTS,
  SEED_GROWTH_UPDATES,
  SEED_PARTICIPANTS,
  SEED_PLANTS,
  SEED_PLANT_RECORDS,
  VOLUNTEER_FORM_URL,
} from '../data/seedData';
import type {
  CardTemplateId,
  EnrichedPlantJourney,
  EventItem,
  EventStatus,
  GrowthUpdate,
  PlantSpecies,
} from '../types/plantJourney';

export interface FormSubmissionRow {
  queueId: string;
  submittedAt: string;
  fullName: string;
  studyProgram?: string;
  plantName: string;
  eventName: string;
  location: string;
  photoUrl: string;
  personalMessage: string;
  fingerprint: string;
}

export interface IntegrationSettings {
  sheetUrl: string;
  defaultPlantId: string;
  defaultEventId: string;
  defaultPlantingDate: string;
  defaultLocation: string;
  defaultTemplateId: CardTemplateId;
  autoSyncEnabled: boolean;
  lastSyncedAt: string;
}

export interface RawPlantJourneyDoc {
  plantIdCode: string;
  participantCode: string;
  fullName: string;
  studyProgram?: string;
  plantId: string;
  eventId: string;
  plantingDate: string;
  location: string;
  cardFrontPhoto: string;
  plantPhoto: string;
  participantPlantPhoto: string;
  personalMessage: string;
  beginningTitle: string;
  beginningDescription: string;
  templateId: CardTemplateId;
  status: 'Published' | 'Draft';
  sourceFingerprint: string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

function timestampToIso(val: Timestamp | string | undefined): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (typeof val.toDate === 'function') {
    return val.toDate().toISOString();
  }
  return new Date().toISOString();
}

export function getNextPlantIdCodeFromExisting(
  journeys: EnrichedPlantJourney[]
): string {
  let maxNum = 0;
  for (const item of journeys) {
    const match = item.record.plantIdCode.match(/SB26-(\d+)/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `SB26-${String(maxNum + 1).padStart(4, '0')}`;
}

export function enrichJourneyDoc(
  docData: RawPlantJourneyDoc,
  plants: PlantSpecies[],
  events: EventItem[],
  growthUpdates: GrowthUpdate[]
): EnrichedPlantJourney | null {
  const plant =
    plants.find((p) => p.id === docData.plantId) || plants[0];
  const event =
    events.find((e) => e.id === docData.eventId) || events[0];
  if (!plant || !event) return null;

  const createdIso = timestampToIso(docData.createdAt);

  return {
    record: {
      id: `rec-${docData.plantIdCode.toLowerCase()}`,
      participantId: `part-${docData.plantIdCode.toLowerCase()}`,
      plantId: docData.plantId,
      plantIdCode: docData.plantIdCode,
      plantingDate: docData.plantingDate,
      location: docData.location,
      cardFrontPhoto: docData.cardFrontPhoto || '',
      plantPhoto: docData.plantPhoto || '',
      participantPlantPhoto: docData.participantPlantPhoto || '',
      beginningTitle: docData.beginningTitle,
      beginningDescription: docData.beginningDescription,
      templateId: docData.templateId,
      status: docData.status,
      createdAt: createdIso,
    },
    participant: {
      id: `part-${docData.plantIdCode.toLowerCase()}`,
      participantCode: docData.participantCode,
      fullName: docData.fullName,
      studyProgram: docData.studyProgram || '',
      photo: docData.cardFrontPhoto || '',
      eventId: docData.eventId,
      personalMessage: docData.personalMessage || '',
      createdAt: createdIso,
    },
    plant,
    event,
    growthUpdates: [...growthUpdates].sort((a, b) =>
      a.updateDate.localeCompare(b.updateDate)
    ),
  };
}

export async function seedInitialCatalogAndSamples(): Promise<void> {
  // 1. Seed plants if empty
  try {
    const plantsSnap = await getDocs(collection(db, 'plants'));
    if (plantsSnap.empty) {
      for (const plant of SEED_PLANTS) {
        await setDoc(doc(db, 'plants', plant.id), {
          id: plant.id,
          plantCode: plant.plantCode,
          plantName: plant.plantName,
          scientificName: plant.scientificName,
          category: plant.category,
          mainImage: plant.mainImage,
          overview: plant.overview,
          characteristics: plant.characteristics,
          benefits: plant.benefits,
          careGuide: plant.careGuide,
          createdAt: plant.createdAt,
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'plants');
  }

  // 2. Seed events if empty
  try {
    const eventsSnap = await getDocs(collection(db, 'events'));
    if (eventsSnap.empty) {
      for (const evt of SEED_EVENTS) {
        await setDoc(doc(db, 'events', evt.id), {
          id: evt.id,
          slug: evt.slug,
          eventName: evt.eventName,
          eventDate: evt.eventDate,
          eventLocation: evt.eventLocation,
          description: evt.description,
          fullStory: evt.fullStory,
          coverImage: evt.coverImage,
          registrationUrl: evt.registrationUrl,
          status: evt.status,
          treesPlantedTarget: evt.treesPlantedTarget,
          volunteerCount: evt.volunteerCount,
          createdAt: evt.createdAt,
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'events');
  }

  // 3. Seed sample plant journeys if empty (must run AFTER plants & events exist)
  try {
    const journeysSnap = await getDocs(collection(db, 'plantJourneys'));
    if (journeysSnap.empty) {
      for (const rec of SEED_PLANT_RECORDS) {
        const participant = SEED_PARTICIPANTS.find(
          (p) => p.id === rec.participantId
        );
        if (!participant) continue;

        await setDoc(doc(db, 'plantJourneys', rec.plantIdCode), {
          plantIdCode: rec.plantIdCode,
          participantCode: participant.participantCode,
          fullName: participant.fullName,
          studyProgram: participant.studyProgram || '',
          plantId: rec.plantId,
          eventId: participant.eventId,
          plantingDate: rec.plantingDate,
          location: rec.location,
          cardFrontPhoto: rec.cardFrontPhoto || '',
          plantPhoto: rec.plantPhoto || '',
          participantPlantPhoto: rec.participantPlantPhoto || '',
          personalMessage: participant.personalMessage || '',
          beginningTitle: rec.beginningTitle,
          beginningDescription: rec.beginningDescription,
          templateId: rec.templateId,
          status: rec.status,
          sourceFingerprint: `seed-${rec.plantIdCode}`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const matchingUpdates = SEED_GROWTH_UPDATES.filter(
          (u) => u.plantRecordId === rec.id
        );
        for (const upd of matchingUpdates) {
          await setDoc(
            doc(db, 'plantJourneys', rec.plantIdCode, 'growthUpdates', upd.id),
            {
              id: upd.id,
              plantRecordCode: rec.plantIdCode,
              dayLabel: upd.dayLabel,
              updateDate: upd.updateDate,
              photo: upd.photo,
              title: upd.title,
              description: upd.description,
              status: 'Published',
              authorUid: 'seed-admin',
              createdAt: serverTimestamp(),
            }
          );
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'plantJourneys');
  }
}

export async function createJourneyInFirestore(input: {
  plantIdCode: string;
  fullName: string;
  studyProgram?: string;
  plantId: string;
  eventId: string;
  plantingDate: string;
  location: string;
  templateId: CardTemplateId;
  cardFrontPhoto?: string;
  personalMessage?: string;
  sourceFingerprint?: string;
}): Promise<void> {
  const code = input.plantIdCode.trim().toUpperCase();
  const path = `plantJourneys/${code}`;
  try {
    await setDoc(doc(db, 'plantJourneys', code), {
      plantIdCode: code,
      participantCode: `PT-${code.slice(-4)}`,
      fullName: input.fullName.trim().slice(0, 120),
      studyProgram: (input.studyProgram || '').trim().slice(0, 120),
      plantId: input.plantId,
      eventId: input.eventId,
      plantingDate: (input.plantingDate.trim() || '14 Desember 2026').slice(0, 60),
      location: (
        input.location.trim() || 'Lokasi Penanaman Aksi Sobat Bumi'
      ).slice(0, 200),
      cardFrontPhoto: (input.cardFrontPhoto || '').slice(0, 220000),
      // Keep Day-H upload slots completely empty so participants aren't confused
      plantPhoto: '',
      participantPlantPhoto: '',
      personalMessage: (input.personalMessage || '').trim().slice(0, 600),
      beginningTitle: 'Semua Berawal dari Satu Benih.',
      beginningDescription:
        'Halaman perjalanan tanaman dan QR Code sudah aktif. Bagian foto Hari H masih kosong agar peserta atau admin dapat mengunggah dokumentasi langsung saat penanaman.',
      templateId: input.templateId,
      status: 'Published',
      sourceFingerprint: (input.sourceFingerprint || `manual-${code}`).slice(0, 160),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export interface ExistingFingerprintEntry {
  plantIdCode: string;
  cardFrontPhoto: string;
  studyProgram: string;
}

export async function importFormRowsToFirestore(
  rows: FormSubmissionRow[],
  defaults: {
    defaultPlantId: string;
    eventId: string;
    plantingDate: string;
    location: string;
    templateId: CardTemplateId;
  },
  existingFingerprints: Set<string>,
  existingJourneys: EnrichedPlantJourney[],
  plants: PlantSpecies[],
  events: EventItem[],
  options?: {
    existingByFingerprint?: Map<string, ExistingFingerprintEntry>;
    refreshSheetPhotos?: boolean;
  }
): Promise<{
  createdCodes: string[];
  updatedCodes: string[];
  skippedCount: number;
}> {
  let maxCounter = 0;
  for (const item of existingJourneys) {
    const match = item.record.plantIdCode.match(/SB26-(\d+)/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxCounter) maxCounter = n;
    }
  }

  const createdCodes: string[] = [];
  const updatedCodes: string[] = [];
  let skippedCount = 0;
  const existingByFp = options?.existingByFingerprint;
  const refreshSheetPhotos = options?.refreshSheetPhotos ?? true;

  for (const row of rows) {
    const nameClean = row.fullName.trim();
    if (!nameClean) continue;

    if (existingFingerprints.has(row.fingerprint)) {
      const existing = existingByFp?.get(row.fingerprint);
      if (existing) {
        const isManualUpload =
          existing.cardFrontPhoto.startsWith('data:image/');
        const shouldUpdatePhoto =
          !isManualUpload &&
          row.photoUrl !== existing.cardFrontPhoto &&
          (Boolean(row.photoUrl) ||
            (refreshSheetPhotos && row.queueId.startsWith('sheet-row-')));
        const shouldUpdateProdi =
          !existing.studyProgram && Boolean(row.studyProgram?.trim());

        if (shouldUpdatePhoto || shouldUpdateProdi) {
          const patch: Record<string, unknown> = {
            updatedAt: serverTimestamp(),
          };
          if (shouldUpdatePhoto) {
            patch.cardFrontPhoto = row.photoUrl.slice(0, 220000);
          }
          if (shouldUpdateProdi && row.studyProgram) {
            patch.studyProgram = row.studyProgram.trim().slice(0, 120);
          }
          try {
            await updateDoc(
              doc(db, 'plantJourneys', existing.plantIdCode),
              patch
            );
            updatedCodes.push(existing.plantIdCode);
          } catch (error) {
            handleFirestoreError(
              error,
              OperationType.UPDATE,
              `plantJourneys/${existing.plantIdCode}`
            );
          }
          continue;
        }
      }
      skippedCount += 1;
      continue;
    }

    maxCounter += 1;
    const code = `SB26-${String(maxCounter).padStart(4, '0')}`;

    const matchedPlant =
      plants.find(
        (pl) =>
          row.plantName &&
          (row.plantName.toLowerCase().includes(pl.plantName.toLowerCase()) ||
            row.plantName.toLowerCase() === pl.plantCode.toLowerCase())
      )?.id || defaults.defaultPlantId;

    const matchedEvent =
      events.find(
        (ev) =>
          row.eventName &&
          ev.eventName.toLowerCase().includes(row.eventName.toLowerCase())
      )?.id || defaults.eventId;

    await createJourneyInFirestore({
      plantIdCode: code,
      fullName: nameClean,
      studyProgram: row.studyProgram || '',
      plantId: matchedPlant,
      eventId: matchedEvent,
      plantingDate: defaults.plantingDate,
      location: row.location || defaults.location,
      templateId: defaults.templateId,
      cardFrontPhoto: row.photoUrl || '',
      personalMessage: row.personalMessage || '',
      sourceFingerprint: row.fingerprint,
    });

    existingFingerprints.add(row.fingerprint);
    createdCodes.push(code);
  }

  return { createdCodes, updatedCodes, skippedCount };
}

export async function updateJourneyPhotoInFirestore(
  plantIdCode: string,
  slot: 'participantPlantPhoto' | 'plantPhoto' | 'cardFrontPhoto',
  dataUrl: string
): Promise<void> {
  const code = plantIdCode.trim().toUpperCase();
  const path = `plantJourneys/${code}`;
  try {
    await updateDoc(doc(db, 'plantJourneys', code), {
      [slot]: dataUrl.slice(0, 220000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateJourneyDetailsInFirestore(
  plantIdCode: string,
  updates: {
    fullName?: string;
    studyProgram?: string;
    plantId?: string;
    eventId?: string;
    plantingDate?: string;
    location?: string;
    templateId?: CardTemplateId;
    personalMessage?: string;
  }
): Promise<void> {
  const code = plantIdCode.trim().toUpperCase();
  const path = `plantJourneys/${code}`;
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.fullName !== undefined)
    payload.fullName = updates.fullName.trim().slice(0, 120);
  if (updates.studyProgram !== undefined)
    payload.studyProgram = updates.studyProgram.trim().slice(0, 120);
  if (updates.plantId !== undefined) payload.plantId = updates.plantId;
  if (updates.eventId !== undefined) payload.eventId = updates.eventId;
  if (updates.plantingDate !== undefined)
    payload.plantingDate = updates.plantingDate.trim().slice(0, 60);
  if (updates.location !== undefined)
    payload.location = updates.location.trim().slice(0, 200);
  if (updates.templateId !== undefined)
    payload.templateId = updates.templateId;
  if (updates.personalMessage !== undefined)
    payload.personalMessage = updates.personalMessage.trim().slice(0, 600);

  try {
    await updateDoc(doc(db, 'plantJourneys', code), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteJourneyInFirestore(
  plantIdCode: string
): Promise<void> {
  const code = plantIdCode.trim().toUpperCase();
  const path = `plantJourneys/${code}`;
  try {
    const subSnap = await getDocs(
      collection(db, 'plantJourneys', code, 'growthUpdates')
    );
    for (const subDoc of subSnap.docs) {
      await deleteDoc(subDoc.ref);
    }
    await deleteDoc(doc(db, 'plantJourneys', code));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function addGrowthUpdateInFirestore(
  plantIdCode: string,
  input: {
    dayLabel: string;
    updateDate: string;
    title: string;
    description: string;
    photo: string;
  },
  authorUid: string
): Promise<void> {
  const code = plantIdCode.trim().toUpperCase();
  const updateId = `upd-${Date.now()}`;
  const path = `plantJourneys/${code}/growthUpdates/${updateId}`;
  try {
    await setDoc(doc(db, 'plantJourneys', code, 'growthUpdates', updateId), {
      id: updateId,
      plantRecordCode: code,
      dayLabel: (input.dayLabel.trim() || 'Pembaruan').slice(0, 40),
      updateDate: input.updateDate.slice(0, 40),
      photo: (input.photo || '').slice(0, 220000),
      title: input.title.trim().slice(0, 140),
      description: input.description.trim().slice(0, 600),
      status: 'Published',
      authorUid,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeGrowthUpdates(
  plantIdCode: string,
  onData: (updates: GrowthUpdate[]) => void
): () => void {
  const code = plantIdCode.trim().toUpperCase();
  const path = `plantJourneys/${code}/growthUpdates`;
  const q = query(
    collection(db, 'plantJourneys', code, 'growthUpdates'),
    where('status', '==', 'Published')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: GrowthUpdate[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id || d.id),
          plantRecordId: `rec-${code.toLowerCase()}`,
          dayLabel: String(data.dayLabel || ''),
          updateDate: String(data.updateDate || ''),
          photo: String(data.photo || ''),
          title: String(data.title || ''),
          description: String(data.description || ''),
          createdAt: timestampToIso(data.createdAt),
        };
      });
      list.sort((a, b) => a.updateDate.localeCompare(b.updateDate));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/* ============================
   GREEN ACTION EVENTS & SPECIES FIRESTORE CRUD
   ============================ */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export async function createEventInFirestore(
  input: {
    eventName: string;
    eventDate: string;
    eventLocation: string;
    description: string;
    fullStory?: string;
    status: EventStatus;
    treesPlantedTarget: number;
    volunteerCount: number;
    coverImage?: string;
  },
  existingEvents: EventItem[]
): Promise<void> {
  const id = `evt-${Date.now()}`;
  const baseSlug = slugify(input.eventName) || id;
  const uniqueSlug = existingEvents.some((e) => e.slug === baseSlug)
    ? `${baseSlug}-${Date.now().toString().slice(-4)}`
    : baseSlug;

  try {
    await setDoc(doc(db, 'events', id), {
      id,
      slug: uniqueSlug.slice(0, 120),
      eventName: input.eventName.trim().slice(0, 160),
      eventDate: input.eventDate.trim().slice(0, 60),
      eventLocation: input.eventLocation.trim().slice(0, 200),
      description: input.description.trim().slice(0, 600),
      fullStory: (input.fullStory || input.description).trim().slice(0, 1600),
      coverImage: (input.coverImage || MEDIA_ASSETS.aboutCommunity).slice(0, 220000),
      registrationUrl: VOLUNTEER_FORM_URL,
      status: input.status,
      treesPlantedTarget: Number(input.treesPlantedTarget) || 0,
      volunteerCount: Number(input.volunteerCount) || 0,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `events/${id}`);
  }
}

export async function updateEventInFirestore(
  existingEvent: EventItem,
  updates: Partial<Omit<EventItem, 'id' | 'slug' | 'createdAt'>>
): Promise<void> {
  const merged = { ...existingEvent, ...updates };
  try {
    await setDoc(doc(db, 'events', existingEvent.id), {
      id: merged.id,
      slug: merged.slug.slice(0, 120),
      eventName: merged.eventName.trim().slice(0, 160),
      eventDate: merged.eventDate.trim().slice(0, 60),
      eventLocation: merged.eventLocation.trim().slice(0, 200),
      description: merged.description.trim().slice(0, 600),
      fullStory: merged.fullStory.trim().slice(0, 1600),
      coverImage: merged.coverImage.slice(0, 220000),
      registrationUrl: merged.registrationUrl.slice(0, 400),
      status: merged.status,
      treesPlantedTarget: Number(merged.treesPlantedTarget) || 0,
      volunteerCount: Number(merged.volunteerCount) || 0,
      createdAt: merged.createdAt,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `events/${existingEvent.id}`);
  }
}

export async function deleteEventInFirestore(eventId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `events/${eventId}`);
  }
}

export async function createPlantSpeciesInFirestore(
  input: {
    plantName: string;
    scientificName: string;
    category: string;
    overview: string;
    mainImage?: string;
    habitat: string;
    watering: string;
    sunlight: string;
  },
  existingCount: number
): Promise<void> {
  const id = `plant-${Date.now()}`;
  const nextNum = String(existingCount + 1).padStart(3, '0');
  try {
    await setDoc(doc(db, 'plants', id), {
      id,
      plantCode: `PL-${nextNum}`,
      plantName: input.plantName.trim().slice(0, 100),
      scientificName: input.scientificName.trim().slice(0, 140),
      category: (input.category.trim() || 'Pohon Peneduh & Konservasi').slice(0, 100),
      mainImage: (input.mainImage || MEDIA_ASSETS.ketapangMain).slice(0, 220000),
      overview: input.overview.trim().slice(0, 1200),
      characteristics: {
        treeType: 'Pohon berkayu peneduh dan konservasi lahan',
        leafShape: 'Daun hijau rimbun beradaptasi dengan iklim tropis',
        distinctiveTrait: 'Tajuk peneduh alami dan akar penahan erosi',
        habitat: input.habitat.trim() || 'Dataran rendah hingga perbukitan tropis',
      },
      benefits: [
        'Menyerap karbon dioksida dan memperbaiki kualitas udara sekitar.',
        'Menjaga kelembapan tanah serta menjadi habitat satwa lokal.',
      ],
      careGuide: {
        watering:
          input.watering.trim() ||
          'Siram rutin 2–3 kali seminggu pada 6 bulan awal.',
        sunlight:
          input.sunlight.trim() || 'Sinar matahari penuh minimal 6 jam per hari.',
        soil: 'Tanah gembur dengan kompos organik dan drainase baik.',
        maintenance:
          'Lakukan pemantauan rutin dan bersihkan gulma di sekitar batang.',
        growthNotes: 'Tercatat berkala melalui fitur My Plant Growth.',
      },
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `plants/${id}`);
  }
}

export async function saveIntegrationSettingsInFirestore(
  settings: IntegrationSettings
): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'gform'), {
      sheetUrl: settings.sheetUrl.trim().slice(0, 500),
      defaultPlantId: settings.defaultPlantId.slice(0, 80),
      defaultEventId: settings.defaultEventId.slice(0, 80),
      defaultPlantingDate: settings.defaultPlantingDate.trim().slice(0, 60),
      defaultLocation: settings.defaultLocation.trim().slice(0, 200),
      defaultTemplateId: settings.defaultTemplateId,
      autoSyncEnabled: Boolean(settings.autoSyncEnabled),
      lastSyncedAt: settings.lastSyncedAt.slice(0, 60),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/gform');
  }
}

/* ============================
   BACKEND GOOGLE SHEET / WEBHOOK API CALLS
   ============================ */

export async function fetchGoogleSheetRows(
  sheetUrl: string,
  idToken: string
): Promise<{
  headers: string[];
  detectedPhotoHeaders: string[];
  rows: FormSubmissionRow[];
}> {
  const res = await fetch(
    `/api/google-sheet?sheetUrl=${encodeURIComponent(sheetUrl)}`,
    {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );
  const data = (await res.json()) as {
    headers?: string[];
    detectedPhotoHeaders?: string[];
    rows?: FormSubmissionRow[];
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || 'Gagal membaca Google Sheet.');
  }
  return {
    headers: data.headers || [],
    detectedPhotoHeaders: data.detectedPhotoHeaders || [],
    rows: data.rows || [],
  };
}

export async function fetchWebhookInbox(
  idToken: string
): Promise<FormSubmissionRow[]> {
  const res = await fetch('/api/gform-inbox', {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: FormSubmissionRow[] };
  return data.items || [];
}

export async function ackWebhookInbox(
  fingerprints: string[],
  idToken: string
): Promise<void> {
  if (fingerprints.length === 0) return;
  await fetch('/api/gform-inbox/ack', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ fingerprints }),
  });
}

export async function fetchWebhookConfig(
  idToken: string
): Promise<{ webhookUrl: string; webhookSecret: string } | null> {
  const res = await fetch('/api/webhook-config', {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!res.ok) return null;
  return (await res.json()) as { webhookUrl: string; webhookSecret: string };
}
