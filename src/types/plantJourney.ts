export type PlantRecordStatus = 'Draft' | 'Published' | 'Archived';
export type EventStatus = 'Upcoming' | 'Ongoing' | 'Completed';
export type CardTemplateId = 'forest' | 'botanical' | 'earth';

export interface PlantSpecies {
  id: string;
  plantCode: string;
  plantName: string;
  scientificName: string;
  category: string;
  mainImage: string;
  overview: string;
  characteristics: {
    treeType: string;
    leafShape: string;
    distinctiveTrait: string;
    habitat: string;
  };
  benefits: string[];
  careGuide: {
    watering: string;
    sunlight: string;
    soil: string;
    maintenance: string;
    growthNotes: string;
  };
  createdAt: string;
}

export interface EventItem {
  id: string;
  slug: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  description: string;
  fullStory: string;
  coverImage: string;
  registrationUrl: string;
  status: EventStatus;
  treesPlantedTarget: number;
  volunteerCount: number;
  createdAt: string;
}

export interface Participant {
  id: string;
  participantCode: string;
  fullName: string;
  photo: string;
  eventId: string;
  personalMessage?: string;
  createdAt: string;
}

export interface PlantRecord {
  id: string;
  participantId: string;
  plantId: string;
  plantIdCode: string;
  plantingDate: string;
  location: string;
  /** Foto opsional peserta dari form pendaftaran volunteer untuk sisi depan kartu */
  cardFrontPhoto?: string;
  /** Foto Hari H saat bibit ditanam (Section 03) - boleh kosong saat ID baru terbit */
  plantPhoto: string;
  /** Foto Hari H peserta bersama tanaman (Section 02) - boleh kosong saat ID baru terbit */
  participantPlantPhoto: string;
  beginningTitle: string;
  beginningDescription: string;
  templateId: CardTemplateId;
  status: PlantRecordStatus;
  createdAt: string;
}

export interface GrowthUpdate {
  id: string;
  plantRecordId: string;
  dayLabel: string;
  updateDate: string;
  photo: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface CardTemplateOption {
  id: CardTemplateId;
  name: string;
  subtitle: string;
  description: string;
}

export interface EnrichedPlantJourney {
  record: PlantRecord;
  participant: Participant;
  plant: PlantSpecies;
  event: EventItem;
  growthUpdates: GrowthUpdate[];
}
