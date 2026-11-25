import {
  CARD_TEMPLATES,
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
  CardTemplateOption,
  EnrichedPlantJourney,
  EventItem,
  EventStatus,
  GrowthUpdate,
  Participant,
  PlantRecord,
  PlantSpecies,
} from '../types/plantJourney';

export const DEFAULT_PERSONAL_MESSAGE =
  'Satu aksi kecil dapat tumbuh menjadi sesuatu yang berarti.';

const STORAGE_KEY = 'asb_plant_journey_store_v4';
const ADMIN_CRED_KEY = 'asb_admin_credentials_v1';
const ADMIN_SESSION_KEY = 'asb_admin_session_active';

interface StoreState {
  plants: PlantSpecies[];
  events: EventItem[];
  participants: Participant[];
  records: PlantRecord[];
  growthUpdates: GrowthUpdate[];
}

function getInitialStore(): StoreState {
  if (typeof window === 'undefined') {
    return {
      plants: SEED_PLANTS,
      events: SEED_EVENTS,
      participants: SEED_PARTICIPANTS,
      records: SEED_PLANT_RECORDS,
      growthUpdates: SEED_GROWTH_UPDATES,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreState;
      if (
        Array.isArray(parsed.plants) &&
        Array.isArray(parsed.events) &&
        Array.isArray(parsed.participants) &&
        Array.isArray(parsed.records) &&
        Array.isArray(parsed.growthUpdates)
      ) {
        return parsed;
      }
    }
  } catch {
    // Fallback to seed data if localStorage unavailable or corrupted
  }

  return {
    plants: [...SEED_PLANTS],
    events: [...SEED_EVENTS],
    participants: [...SEED_PARTICIPANTS],
    records: [...SEED_PLANT_RECORDS],
    growthUpdates: [...SEED_GROWTH_UPDATES],
  };
}

function saveStore(state: StoreState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors silently
  }
}

export function resetToSeedData(): void {
  saveStore({
    plants: [...SEED_PLANTS],
    events: [...SEED_EVENTS],
    participants: [...SEED_PARTICIPANTS],
    records: [...SEED_PLANT_RECORDS],
    growthUpdates: [...SEED_GROWTH_UPDATES],
  });
}

/* ============================
   ADMIN AUTHENTICATION (LOCAL HASHED BEFORE FIREBASE AUTH)
   ============================ */

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hasConfiguredAdminAccount(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.localStorage.getItem(ADMIN_CRED_KEY));
}

export function getConfiguredAdminEmail(): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = window.localStorage.getItem(ADMIN_CRED_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { email: string; hash: string };
    return parsed.email || '';
  } catch {
    return '';
  }
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

export async function setupAdminAccount(
  email: string,
  passcode: string
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const hash = await sha256Hex(`${cleanEmail}:${passcode}`);
  window.localStorage.setItem(
    ADMIN_CRED_KEY,
    JSON.stringify({ email: cleanEmail, hash })
  );
  window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
}

export async function loginAdminAccount(
  email: string,
  passcode: string
): Promise<boolean> {
  const raw = window.localStorage.getItem(ADMIN_CRED_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as { email: string; hash: string };
    const cleanEmail = email.trim().toLowerCase();
    const candidateHash = await sha256Hex(`${cleanEmail}:${passcode}`);
    if (cleanEmail === parsed.email && candidateHash === parsed.hash) {
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function logoutAdminAccount(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export function resetAdminAccount(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ADMIN_CRED_KEY);
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

/* ============================
   QUERIES
   ============================ */

export function getCardTemplates(): CardTemplateOption[] {
  return CARD_TEMPLATES;
}

export function getAllPlants(): PlantSpecies[] {
  return getInitialStore().plants;
}

export function getPlantById(id: string): PlantSpecies | undefined {
  return getInitialStore().plants.find(
    (p) => p.id === id || p.plantCode.toLowerCase() === id.toLowerCase()
  );
}

export function getAllEvents(): EventItem[] {
  return getInitialStore().events;
}

export function getEventBySlug(slug: string): EventItem | undefined {
  return getInitialStore().events.find((e) => e.slug === slug);
}

export function getMovementStats(): {
  totalTreesPlanted: number;
  totalSpecies: number;
  totalVolunteers: number;
  speciesNamesSummary: string;
} {
  const store = getInitialStore();
  const completedTrees = store.events
    .filter((e) => e.status === 'Completed')
    .reduce((sum, e) => sum + e.treesPlantedTarget, 0);

  const totalTreesPlanted =
    completedTrees > 0
      ? completedTrees
      : store.events.reduce((sum, e) => sum + e.treesPlantedTarget, 0);

  const totalVolunteers = store.events.reduce(
    (sum, e) => sum + e.volunteerCount,
    0
  );

  const speciesNamesSummary = store.plants
    .map((p) => p.plantName)
    .slice(0, 3)
    .join(', ');

  return {
    totalTreesPlanted,
    totalSpecies: store.plants.length,
    totalVolunteers,
    speciesNamesSummary,
  };
}

function enrichRecordFromStore(
  recordId: string,
  store: StoreState
): EnrichedPlantJourney | null {
  const record = store.records.find((r) => r.id === recordId);
  if (!record) return null;

  const participant = store.participants.find(
    (p) => p.id === record.participantId
  );
  const plant = store.plants.find((pl) => pl.id === record.plantId);
  if (!participant || !plant) return null;

  const event =
    store.events.find((e) => e.id === participant.eventId) || store.events[0];

  const growthUpdates = store.growthUpdates
    .filter((u) => u.plantRecordId === record.id)
    .sort((a, b) => a.updateDate.localeCompare(b.updateDate));

  return {
    record,
    participant,
    plant,
    event,
    growthUpdates,
  };
}

export function getAllPublishedJourneys(): EnrichedPlantJourney[] {
  const store = getInitialStore();
  return store.records
    .filter((rec) => rec.status === 'Published')
    .map((record) => enrichRecordFromStore(record.id, store))
    .filter((item): item is EnrichedPlantJourney => item !== null);
}

export function findJourneyByPlantCode(
  plantIdCode: string
): EnrichedPlantJourney | null {
  const normalized = plantIdCode.trim().toUpperCase();
  if (!normalized) return null;

  const store = getInitialStore();
  const record = store.records.find(
    (rec) =>
      rec.plantIdCode.toUpperCase() === normalized && rec.status === 'Published'
  );
  if (!record) return null;

  return enrichRecordFromStore(record.id, store);
}

/* ============================
   PARTICIPANT & RECORD MUTATIONS
   ============================ */

export function updateRecordPhoto(
  plantIdCode: string,
  slot: 'participantPlantPhoto' | 'plantPhoto' | 'cardFrontPhoto',
  dataUrl: string
): EnrichedPlantJourney | null {
  const store = getInitialStore();
  const idx = store.records.findIndex(
    (r) => r.plantIdCode.toUpperCase() === plantIdCode.trim().toUpperCase()
  );
  if (idx === -1) return null;

  const updatedRecord: PlantRecord = {
    ...store.records[idx],
    [slot]: dataUrl,
  };
  store.records[idx] = updatedRecord;
  saveStore(store);

  return enrichRecordFromStore(updatedRecord.id, store);
}

export function updateRecordDetails(
  plantIdCode: string,
  updates: {
    fullName?: string;
    plantId?: string;
    eventId?: string;
    plantingDate?: string;
    templateId?: CardTemplateId;
    personalMessage?: string;
    beginningDescription?: string;
    location?: string;
  }
): EnrichedPlantJourney | null {
  const store = getInitialStore();
  const recIdx = store.records.findIndex(
    (r) => r.plantIdCode.toUpperCase() === plantIdCode.trim().toUpperCase()
  );
  if (recIdx === -1) return null;

  const record = store.records[recIdx];
  store.records[recIdx] = {
    ...record,
    plantId: updates.plantId ?? record.plantId,
    plantingDate: updates.plantingDate ?? record.plantingDate,
    templateId: updates.templateId ?? record.templateId,
    beginningDescription:
      updates.beginningDescription ?? record.beginningDescription,
    location: updates.location ?? record.location,
  };

  const pIdx = store.participants.findIndex(
    (p) => p.id === record.participantId
  );
  if (pIdx !== -1) {
    store.participants[pIdx] = {
      ...store.participants[pIdx],
      fullName: updates.fullName ?? store.participants[pIdx].fullName,
      eventId: updates.eventId ?? store.participants[pIdx].eventId,
      personalMessage:
        updates.personalMessage ?? store.participants[pIdx].personalMessage,
    };
  }

  saveStore(store);
  return enrichRecordFromStore(record.id, store);
}

export function deleteParticipantRecord(plantIdCode: string): boolean {
  const store = getInitialStore();
  const record = store.records.find(
    (r) => r.plantIdCode.toUpperCase() === plantIdCode.trim().toUpperCase()
  );
  if (!record) return false;

  store.records = store.records.filter((r) => r.id !== record.id);
  store.participants = store.participants.filter(
    (p) => p.id !== record.participantId
  );
  store.growthUpdates = store.growthUpdates.filter(
    (u) => u.plantRecordId !== record.id
  );
  saveStore(store);
  return true;
}

export function addGrowthUpdateToRecord(
  plantIdCode: string,
  input: {
    dayLabel: string;
    updateDate: string;
    title: string;
    description: string;
    photo: string;
  }
): EnrichedPlantJourney | null {
  const store = getInitialStore();
  const record = store.records.find(
    (r) => r.plantIdCode.toUpperCase() === plantIdCode.trim().toUpperCase()
  );
  if (!record) return null;

  const newUpdate: GrowthUpdate = {
    id: `upd-${Date.now()}`,
    plantRecordId: record.id,
    dayLabel: input.dayLabel.trim() || 'Pembaruan',
    updateDate: input.updateDate,
    photo: input.photo,
    title: input.title.trim(),
    description: input.description.trim(),
    createdAt: new Date().toISOString(),
  };

  store.growthUpdates.push(newUpdate);
  saveStore(store);

  return enrichRecordFromStore(record.id, store);
}

function getNextNumericPlantCounter(records: PlantRecord[]): number {
  let maxNum = 0;
  for (const r of records) {
    const match = r.plantIdCode.match(/SB26-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return maxNum + 1;
}

export function getNextPlantIdCode(): string {
  const store = getInitialStore();
  const next = getNextNumericPlantCounter(store.records);
  return `SB26-${String(next).padStart(4, '0')}`;
}

export function createParticipantTemplateRecord(input: {
  fullName: string;
  plantId: string;
  eventId: string;
  plantingDate: string;
  location: string;
  templateId: CardTemplateId;
  cardFrontPhoto?: string;
}): EnrichedPlantJourney | null {
  const store = getInitialStore();
  const plantIdCode = `SB26-${String(getNextNumericPlantCounter(store.records)).padStart(4, '0')}`;
  const timestamp = Date.now();

  const participantId = `part-${timestamp}`;
  const newParticipant: Participant = {
    id: participantId,
    participantCode: `PT-${timestamp.toString().slice(-4)}`,
    fullName: input.fullName.trim(),
    photo: input.cardFrontPhoto || '',
    eventId: input.eventId,
    personalMessage: '',
    createdAt: new Date().toISOString(),
  };

  const recordId = `rec-${plantIdCode.toLowerCase()}`;
  const newRecord: PlantRecord = {
    id: recordId,
    participantId,
    plantId: input.plantId,
    plantIdCode,
    plantingDate: input.plantingDate.trim() || '14 Desember 2026',
    location: input.location.trim() || 'Lokasi Penanaman Aksi Sobat Bumi',
    cardFrontPhoto: input.cardFrontPhoto || '',
    plantPhoto: '',
    participantPlantPhoto: '',
    beginningTitle: 'Semua Berawal dari Satu Benih.',
    beginningDescription:
      'Perjalanan tanaman ini telah aktif. Dokumentasi foto Hari H dapat langsung diisi oleh peserta atau admin.',
    templateId: input.templateId,
    status: 'Published',
    createdAt: new Date().toISOString(),
  };

  store.participants.push(newParticipant);
  store.records.push(newRecord);
  saveStore(store);

  return enrichRecordFromStore(recordId, store);
}

export function batchCreateParticipantsFromText(
  rawText: string,
  defaults: {
    defaultPlantId: string;
    eventId: string;
    plantingDate: string;
    location: string;
    templateId: CardTemplateId;
  }
): EnrichedPlantJourney[] {
  const store = getInitialStore();
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  let counter = getNextNumericPlantCounter(store.records);
  const createdIds: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    // Skip obvious CSV/header lines
    const lower = rawLine.toLowerCase();
    if (
      i === 0 &&
      (lower.includes('nama lengkap') ||
        lower === 'nama' ||
        lower.startsWith('timestamp'))
    ) {
      continue;
    }

    // Split by tab, comma, or semicolon
    const parts = rawLine
      .split(/\t|,|;|\|/)
      .map((p) => p.trim().replace(/^"|"$/g, ''))
      .filter((p) => p.length > 0);

    if (parts.length === 0) continue;

    // Remove leading index like "1. " or "1) "
    let nameCandidate = parts[0].replace(/^\d+[.)]\s*/, '').trim();
    // If first column looks like a timestamp from Google Forms (contains / or : and digits), try second column
    if (
      parts.length > 1 &&
      /\d{1,4}[/-]\d{1,2}[/-]\d{2,4}/.test(nameCandidate)
    ) {
      nameCandidate = parts[1].replace(/^\d+[.)]\s*/, '').trim();
    }

    if (!nameCandidate) continue;

    // Try matching plant species from remaining columns
    let resolvedPlantId = defaults.defaultPlantId;
    for (const part of parts.slice(1)) {
      const foundPlant = store.plants.find(
        (pl) =>
          part.toLowerCase().includes(pl.plantName.toLowerCase()) ||
          part.toLowerCase() === pl.plantCode.toLowerCase()
      );
      if (foundPlant) {
        resolvedPlantId = foundPlant.id;
        break;
      }
    }

    const plantIdCode = `SB26-${String(counter).padStart(4, '0')}`;
    counter += 1;

    const uid = `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
    const participantId = `part-${uid}`;
    const recordId = `rec-${plantIdCode.toLowerCase()}`;

    store.participants.push({
      id: participantId,
      participantCode: `PT-${plantIdCode.slice(-4)}`,
      fullName: nameCandidate,
      photo: '',
      eventId: defaults.eventId,
      personalMessage: '',
      createdAt: new Date().toISOString(),
    });

    store.records.push({
      id: recordId,
      participantId,
      plantId: resolvedPlantId,
      plantIdCode,
      plantingDate: defaults.plantingDate.trim() || '14 Desember 2026',
      location: defaults.location.trim() || 'Lokasi Penanaman Aksi Sobat Bumi',
      cardFrontPhoto: '',
      plantPhoto: '',
      participantPlantPhoto: '',
      beginningTitle: 'Semua Berawal dari Satu Benih.',
      beginningDescription:
        'Halaman perjalanan tanaman dibuat otomatis untuk peserta. Foto Hari H dapat langsung diisi oleh peserta atau admin.',
      templateId: defaults.templateId,
      status: 'Published',
      createdAt: new Date().toISOString(),
    });

    createdIds.push(recordId);
  }

  saveStore(store);

  return createdIds
    .map((id) => enrichRecordFromStore(id, store))
    .filter((item): item is EnrichedPlantJourney => item !== null);
}

/* ============================
   GREEN ACTION / EVENT CRUD
   ============================ */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function createGreenActionEvent(input: {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  description: string;
  fullStory?: string;
  status: EventStatus;
  treesPlantedTarget: number;
  volunteerCount: number;
  coverImage?: string;
}): EventItem {
  const store = getInitialStore();
  const id = `evt-${Date.now()}`;
  const baseSlug = slugify(input.eventName) || id;
  const uniqueSlug = store.events.some((e) => e.slug === baseSlug)
    ? `${baseSlug}-${Date.now().toString().slice(-4)}`
    : baseSlug;

  const newEvent: EventItem = {
    id,
    slug: uniqueSlug,
    eventName: input.eventName.trim(),
    eventDate: input.eventDate.trim(),
    eventLocation: input.eventLocation.trim(),
    description: input.description.trim(),
    fullStory: (input.fullStory || input.description).trim(),
    coverImage: input.coverImage || MEDIA_ASSETS.aboutCommunity,
    registrationUrl: VOLUNTEER_FORM_URL,
    status: input.status,
    treesPlantedTarget: Number(input.treesPlantedTarget) || 0,
    volunteerCount: Number(input.volunteerCount) || 0,
    createdAt: new Date().toISOString(),
  };

  store.events.unshift(newEvent);
  saveStore(store);
  return newEvent;
}

export function updateGreenActionEvent(
  eventId: string,
  updates: Partial<Omit<EventItem, 'id' | 'slug' | 'createdAt'>>
): EventItem | null {
  const store = getInitialStore();
  const idx = store.events.findIndex((e) => e.id === eventId);
  if (idx === -1) return null;

  store.events[idx] = {
    ...store.events[idx],
    ...updates,
  };
  saveStore(store);
  return store.events[idx];
}

export function deleteGreenActionEvent(eventId: string): void {
  const store = getInitialStore();
  if (store.events.length <= 1) return;
  store.events = store.events.filter((e) => e.id !== eventId);
  saveStore(store);
}

/* ============================
   PLANT SPECIES CRUD
   ============================ */

export function createPlantSpecies(input: {
  plantName: string;
  scientificName: string;
  category: string;
  overview: string;
  mainImage?: string;
  habitat: string;
  watering: string;
  sunlight: string;
}): PlantSpecies {
  const store = getInitialStore();
  const nextNum = String(store.plants.length + 1).padStart(3, '0');
  const newPlant: PlantSpecies = {
    id: `plant-${Date.now()}`,
    plantCode: `PL-${nextNum}`,
    plantName: input.plantName.trim(),
    scientificName: input.scientificName.trim(),
    category: input.category.trim() || 'Pohon Peneduh & Konservasi',
    mainImage: input.mainImage || MEDIA_ASSETS.ketapangMain,
    overview: input.overview.trim(),
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
      watering: input.watering.trim() || 'Siram rutin 2–3 kali seminggu pada 6 bulan awal.',
      sunlight: input.sunlight.trim() || 'Sinar matahari penuh minimal 6 jam per hari.',
      soil: 'Tanah gembur dengan kompos organik dan drainase baik.',
      maintenance: 'Lakukan pemantauan rutin dan bersihkan gulma di sekitar batang.',
      growthNotes: 'Tercatat berkala melalui fitur My Plant Growth.',
    },
    createdAt: new Date().toISOString(),
  };

  store.plants.push(newPlant);
  saveStore(store);
  return newPlant;
}

export function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File harus berupa gambar (JPG, PNG, atau WebP).'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Ukuran gambar maksimal 10 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 760;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.78;
        let result = canvas.toDataURL('image/jpeg', quality);
        while (result.length > 180000 && quality > 0.35) {
          quality -= 0.12;
          result = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(result);
      };
      img.onerror = () => reject(new Error('Gagal membaca file gambar.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal memproses file gambar.'));
    reader.readAsDataURL(file);
  });
}

export function formatIndonesianDate(isoOrLabel: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoOrLabel)) {
    return isoOrLabel;
  }
  const date = new Date(`${isoOrLabel}T00:00:00`);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
