import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Calendar,
  Camera,
  CheckCircle2,
  Edit3,
  Plus,
  RotateCcw,
  Sprout,
  Trash2,
  Users,
} from 'lucide-react';
import {
  compressImageFile,
  createGreenActionEvent,
  createParticipantTemplateRecord,
  createPlantSpecies,
  deleteGreenActionEvent,
  getAllEvents,
  getAllPlants,
  getAllPublishedJourneys,
  getNextPlantIdCode,
  resetToSeedData,
  updateGreenActionEvent,
  updateRecordPhoto,
} from '../services/plantJourneyService';
import type {
  CardTemplateId,
  EnrichedPlantJourney,
  EventItem,
  EventStatus,
  PlantSpecies,
} from '../types/plantJourney';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PlantCard } from '../components/PlantCard';
import { BackButton } from '../components/BackButton';

type AdminTab = 'participants' | 'green-action' | 'plants';

export function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('participants');

  const [plants, setPlants] = useState<PlantSpecies[]>(() => getAllPlants());
  const [events, setEvents] = useState<EventItem[]>(() => getAllEvents());
  const [journeys, setJourneys] = useState<EnrichedPlantJourney[]>(() =>
    getAllPublishedJourneys()
  );
  const [selectedJourneyCode, setSelectedJourneyCode] = useState<string>(
    () => getAllPublishedJourneys()[0]?.record.plantIdCode || 'SB26-0001'
  );

  // Participant Form State
  const [fullName, setFullName] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState(
    () => getAllPlants()[0]?.id || ''
  );
  const [selectedEventId, setSelectedEventId] = useState(
    () => getAllEvents()[1]?.id || getAllEvents()[0]?.id || ''
  );
  const [plantingDate, setPlantingDate] = useState('14 Desember 2026');
  const [location, setLocation] = useState('Pesisir Marunda, Jakarta Utara');
  const [templateId, setTemplateId] = useState<CardTemplateId>('forest');
  const [cardFrontPhoto, setCardFrontPhoto] = useState('');
  const [participantNotice, setParticipantNotice] = useState('');
  const [participantError, setParticipantError] = useState('');

  // Green Action Form State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [evtName, setEvtName] = useState('');
  const [evtDate, setEvtDate] = useState('');
  const [evtLocation, setEvtLocation] = useState('');
  const [evtDescription, setEvtDescription] = useState('');
  const [evtStatus, setEvtStatus] = useState<EventStatus>('Upcoming');
  const [evtTrees, setEvtTrees] = useState('150');
  const [evtVolunteers, setEvtVolunteers] = useState('50');
  const [evtCoverImage, setEvtCoverImage] = useState('');
  const [evtNotice, setEvtNotice] = useState('');
  const [evtError, setEvtError] = useState('');

  // Plant Species Form State
  const [spName, setSpName] = useState('');
  const [spScientific, setSpScientific] = useState('');
  const [spCategory, setSpCategory] = useState('Pohon Peneduh & Konservasi');
  const [spOverview, setSpOverview] = useState('');
  const [spHabitat, setSpHabitat] = useState('');
  const [spWatering, setSpWatering] = useState('');
  const [spSunlight, setSpSunlight] = useState('');
  const [spImage, setSpImage] = useState('');
  const [spNotice, setSpNotice] = useState('');
  const [spError, setSpError] = useState('');

  const cardPhotoInputRef = useRef<HTMLInputElement>(null);
  const dayHPhotoInputRef = useRef<HTMLInputElement>(null);
  const evtCoverInputRef = useRef<HTMLInputElement>(null);
  const spImageInputRef = useRef<HTMLInputElement>(null);

  const [activeUploadTarget, setActiveUploadTarget] = useState<{
    code: string;
    slot: 'participantPlantPhoto' | 'plantPhoto' | 'cardFrontPhoto';
  } | null>(null);

  const refreshAll = () => {
    setPlants(getAllPlants());
    setEvents(getAllEvents());
    setJourneys(getAllPublishedJourneys());
  };

  /* Participant handlers */
  const handleCardPhotoPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setCardFrontPhoto(dataUrl);
      setParticipantError('');
    } catch (err) {
      setParticipantError(
        err instanceof Error ? err.message : 'Gagal membaca foto kartu depan.'
      );
    }
  };

  const handleCreateTemplate = (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setParticipantError('Nama peserta wajib diisi.');
      return;
    }

    const created = createParticipantTemplateRecord({
      fullName,
      plantId: selectedPlantId,
      eventId: selectedEventId,
      plantingDate,
      location,
      templateId,
      cardFrontPhoto,
    });

    if (created) {
      refreshAll();
      setSelectedJourneyCode(created.record.plantIdCode);
      setParticipantNotice(
        `Plant ID ${created.record.plantIdCode} untuk ${created.participant.fullName} berhasil dibuat. Slot foto Hari H siap diisi.`
      );
      setFullName('');
      setCardFrontPhoto('');
      setParticipantError('');
    }
  };

  const handleDirectSlotUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadTarget) return;
    try {
      const dataUrl = await compressImageFile(file);
      updateRecordPhoto(
        activeUploadTarget.code,
        activeUploadTarget.slot,
        dataUrl
      );
      refreshAll();
    } catch {
      // Ignore error silently
    } finally {
      setActiveUploadTarget(null);
      if (dayHPhotoInputRef.current) dayHPhotoInputRef.current.value = '';
    }
  };

  const triggerAdminPhotoUpload = (
    code: string,
    slot: 'participantPlantPhoto' | 'plantPhoto' | 'cardFrontPhoto'
  ) => {
    setActiveUploadTarget({ code, slot });
    dayHPhotoInputRef.current?.click();
  };

  /* Green Action Event handlers */
  const handleEventCoverPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setEvtCoverImage(dataUrl);
      setEvtError('');
    } catch (err) {
      setEvtError(
        err instanceof Error ? err.message : 'Gagal membaca foto kegiatan.'
      );
    }
  };

  const startEditEvent = (ev: EventItem) => {
    setEditingEventId(ev.id);
    setEvtName(ev.eventName);
    setEvtDate(ev.eventDate);
    setEvtLocation(ev.eventLocation);
    setEvtDescription(ev.description);
    setEvtStatus(ev.status);
    setEvtTrees(String(ev.treesPlantedTarget));
    setEvtVolunteers(String(ev.volunteerCount));
    setEvtCoverImage(ev.coverImage);
    setEvtNotice('');
    setEvtError('');
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setEvtName('');
    setEvtDate('');
    setEvtLocation('');
    setEvtDescription('');
    setEvtStatus('Upcoming');
    setEvtTrees('150');
    setEvtVolunteers('50');
    setEvtCoverImage('');
    setEvtError('');
  };

  const handleSaveGreenAction = (e: FormEvent) => {
    e.preventDefault();
    if (!evtName.trim() || !evtDate.trim() || !evtLocation.trim()) {
      setEvtError('Nama kegiatan, tanggal, dan lokasi wajib diisi.');
      return;
    }

    if (editingEventId) {
      updateGreenActionEvent(editingEventId, {
        eventName: evtName.trim(),
        eventDate: evtDate.trim(),
        eventLocation: evtLocation.trim(),
        description: evtDescription.trim(),
        fullStory: evtDescription.trim(),
        status: evtStatus,
        treesPlantedTarget: Number(evtTrees) || 0,
        volunteerCount: Number(evtVolunteers) || 0,
        ...(evtCoverImage ? { coverImage: evtCoverImage } : {}),
      });
      setEvtNotice(`Kegiatan "${evtName}" berhasil diperbarui dan tampil di halaman utama.`);
    } else {
      createGreenActionEvent({
        eventName: evtName,
        eventDate: evtDate,
        eventLocation: evtLocation,
        description: evtDescription || `Kegiatan penanaman pohon di ${evtLocation}.`,
        status: evtStatus,
        treesPlantedTarget: Number(evtTrees) || 150,
        volunteerCount: Number(evtVolunteers) || 50,
        coverImage: evtCoverImage || undefined,
      });
      setEvtNotice(`Green Action baru "${evtName}" berhasil ditambahkan ke website.`);
    }

    refreshAll();
    resetEventForm();
  };

  const handleDeleteEvent = (id: string) => {
    deleteGreenActionEvent(id);
    refreshAll();
    setEvtNotice('Kegiatan telah dihapus.');
    if (editingEventId === id) resetEventForm();
  };

  /* Plant Species handlers */
  const handleSpeciesImagePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setSpImage(dataUrl);
      setSpError('');
    } catch (err) {
      setSpError(
        err instanceof Error ? err.message : 'Gagal membaca foto pohon.'
      );
    }
  };

  const handleCreateSpecies = (e: FormEvent) => {
    e.preventDefault();
    if (!spName.trim() || !spScientific.trim()) {
      setSpError('Nama pohon dan nama ilmiah wajib diisi.');
      return;
    }

    const created = createPlantSpecies({
      plantName: spName,
      scientificName: spScientific,
      category: spCategory,
      overview:
        spOverview ||
        `${spName} (${spScientific}) merupakan jenis pohon peneduh dan konservasi yang ditanam dalam aksi Sobat Bumi.`,
      habitat: spHabitat,
      watering: spWatering,
      sunlight: spSunlight,
      mainImage: spImage || undefined,
    });

    refreshAll();
    setSelectedPlantId(created.id);
    setSpNotice(`Jenis pohon "${created.plantName}" (${created.plantCode}) berhasil ditambahkan.`);
    setSpName('');
    setSpScientific('');
    setSpOverview('');
    setSpHabitat('');
    setSpWatering('');
    setSpSunlight('');
    setSpImage('');
    setSpError('');
  };

  const handleResetAll = () => {
    resetToSeedData();
    refreshAll();
    setSelectedJourneyCode('SB26-0001');
    setParticipantNotice('Data dikembalikan ke data awal.');
  };

  const selectedJourney =
    journeys.find((j) => j.record.plantIdCode === selectedJourneyCode) ||
    journeys[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F4] text-[#14271B]">
      <Navbar variant="solid" />

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto">
        {/* Sidebar Navigation (240px desktop, top strip mobile) */}
        <aside className="lg:w-64 shrink-0 bg-[#F4F0E4] border-b lg:border-b-0 lg:border-r border-[#14271B]/12 p-5 sm:p-6 space-y-6 no-print">
          <div className="space-y-4">
            <BackButton fallbackTo="/" label="Kembali" />
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#647C45]">
                Aksi Sobat Bumi
              </p>
              <h1 className="font-editorial text-2xl font-medium mt-1">
                Admin Panel
              </h1>
            </div>
          </div>

          <nav
            aria-label="Menu Admin Panel"
            className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0"
          >
            <button
              type="button"
              onClick={() => setActiveTab('participants')}
              className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 text-left ${
                activeTab === 'participants'
                  ? 'bg-[#14271B] text-[#FAF9F4]'
                  : 'text-[#14271B]/75 hover:bg-white/70'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Peserta &amp; Plant ID</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('green-action')}
              className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 text-left ${
                activeTab === 'green-action'
                  ? 'bg-[#14271B] text-[#FAF9F4]'
                  : 'text-[#14271B]/75 hover:bg-white/70'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Green Action</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('plants')}
              className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 text-left ${
                activeTab === 'plants'
                  ? 'bg-[#14271B] text-[#FAF9F4]'
                  : 'text-[#14271B]/75 hover:bg-white/70'
              }`}
            >
              <Sprout className="w-4 h-4 shrink-0" />
              <span>Katalog Pohon</span>
            </button>
          </nav>

          <div className="pt-4 border-t border-[#14271B]/12 space-y-2 text-xs text-[#14271B]/70">
            <div className="flex justify-between tabular-nums">
              <span>Peserta / ID</span>
              <span className="font-mono font-semibold text-[#14271B]">
                {journeys.length}
              </span>
            </div>
            <div className="flex justify-between tabular-nums">
              <span>Green Action</span>
              <span className="font-mono font-semibold text-[#14271B]">
                {events.length}
              </span>
            </div>
            <div className="flex justify-between tabular-nums">
              <span>Jenis Pohon</span>
              <span className="font-mono font-semibold text-[#14271B]">
                {plants.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleResetAll}
              className="w-full mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border border-[#14271B]/20 bg-white hover:bg-[#FAF9F4] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Data Awal
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 p-6 sm:p-10 space-y-10 min-w-0">
          <input
            ref={dayHPhotoInputRef}
            type="file"
            accept="image/*"
            onChange={handleDirectSlotUpload}
            className="hidden"
          />

          {/* TAB 1: PARTICIPANTS & PLANT ID */}
          {activeTab === 'participants' && (
            <div className="space-y-10">
              <div className="border-b border-[#14271B]/12 pb-6">
                <h2 className="font-editorial text-3xl font-medium">
                  Peserta &amp; Plant ID
                </h2>
                <p className="text-sm text-[#14271B]/70 mt-1">
                  Terbitkan Plant ID unik per peserta sebelum acara. Foto Hari H
                  dibiarkan kosong agar bisa diisi oleh peserta maupun admin.
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Form Create Participant */}
                <section className="xl:col-span-5 bg-[#F4F0E4] border border-[#14271B]/12 rounded-xl p-6 space-y-5 no-print">
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-[#647C45] uppercase tracking-wider">
                      ID Berikutnya: {getNextPlantIdCode()}
                    </p>
                    <h3 className="font-editorial text-2xl font-medium">
                      Tambah Peserta Baru
                    </h3>
                  </div>

                  {participantError && (
                    <div
                      role="alert"
                      className="p-3 text-xs font-medium bg-[#fee2e2] border border-[#fca5a5] text-[#7f1d1d] rounded-md"
                    >
                      {participantError}
                    </div>
                  )}

                  {participantNotice && (
                    <div className="p-3.5 text-xs bg-[#ecfdf5] border border-[#86efac] text-[#14532d] rounded-md flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{participantNotice}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateTemplate} className="space-y-4">
                    <div>
                      <label
                        htmlFor="admin-fullname"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                      >
                        Nama Peserta
                      </label>
                      <input
                        id="admin-fullname"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Contoh: Raka Pratama"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="admin-plant"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                        >
                          Jenis Pohon
                        </label>
                        <select
                          id="admin-plant"
                          value={selectedPlantId}
                          onChange={(e) => setSelectedPlantId(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                        >
                          {plants.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.plantName} ({p.plantCode})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="admin-card-style"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                        >
                          Desain Kartu Portrait
                        </label>
                        <select
                          id="admin-card-style"
                          value={templateId}
                          onChange={(e) =>
                            setTemplateId(e.target.value as CardTemplateId)
                          }
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                        >
                          <option value="forest">Forest Edition</option>
                          <option value="botanical">Botanical Cream</option>
                          <option value="earth">Earth Archive</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="admin-event"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                      >
                        Green Action / Event
                      </label>
                      <select
                        id="admin-event"
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                      >
                        {events.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.eventName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="admin-date"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                        >
                          Tanggal Tanam
                        </label>
                        <input
                          id="admin-date"
                          type="text"
                          value={plantingDate}
                          onChange={(e) => setPlantingDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="admin-location"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                        >
                          Lokasi Penanaman
                        </label>
                        <input
                          id="admin-location"
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="pt-1 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#14271B]/75">
                        Foto Kartu Depan dari Google Form (Opsional)
                      </p>
                      <input
                        ref={cardPhotoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCardPhotoPick}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => cardPhotoInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md border border-[#14271B]/20 bg-white hover:bg-[#FAF9F4]"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {cardFrontPhoto
                          ? 'Foto Kartu Depan Dipilih (Ganti)'
                          : 'Unggah Foto Kartu Depan (Opsional)'}
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-md bg-[#14271B] text-[#FAF9F4] hover:bg-[#284B34] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Buat Plant ID &amp; Halaman Personal
                    </button>
                  </form>
                </section>

                {/* Registered Records & Card Preview */}
                <section className="xl:col-span-7 space-y-8">
                  <div className="border border-[#14271B]/12 bg-white rounded-xl overflow-hidden no-print">
                    <div className="p-5 border-b border-[#14271B]/10">
                      <h3 className="font-editorial text-2xl font-medium">
                        Daftar Plant ID ({journeys.length})
                      </h3>
                    </div>

                    <div className="divide-y divide-[#14271B]/10">
                      {journeys.map((j) => {
                        const isSelected =
                          selectedJourney?.record.plantIdCode ===
                          j.record.plantIdCode;
                        const dayHComplete =
                          Boolean(j.record.participantPlantPhoto) &&
                          Boolean(j.record.plantPhoto);

                        return (
                          <div
                            key={j.record.id}
                            className={`p-5 transition-colors ${
                              isSelected ? 'bg-[#F4F0E4]/70' : 'hover:bg-[#FAF9F4]'
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 text-xs font-mono">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedJourneyCode(j.record.plantIdCode)
                                    }
                                    className="font-semibold text-[#284B34] hover:underline tabular-nums"
                                  >
                                    {j.record.plantIdCode}
                                  </button>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-sans font-medium text-[#14271B]">
                                    {j.plant.plantName}
                                  </span>
                                </div>
                                <p className="font-medium text-base text-[#14271B]">
                                  {j.participant.fullName}
                                </p>
                                <p className="text-xs text-[#14271B]/65">
                                  Foto Hari H:{' '}
                                  <span
                                    className={
                                      dayHComplete
                                        ? 'text-[#284B34] font-semibold'
                                        : 'text-[#765A3A] font-semibold'
                                    }
                                  >
                                    {dayHComplete
                                      ? 'Lengkap'
                                      : 'Menunggu Foto Hari H'}
                                  </span>
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    triggerAdminPhotoUpload(
                                      j.record.plantIdCode,
                                      'participantPlantPhoto'
                                    )
                                  }
                                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#14271B]/15 bg-white hover:bg-[#F4F0E4] whitespace-nowrap"
                                >
                                  {j.record.participantPlantPhoto
                                    ? 'Ganti Foto Peserta'
                                    : '+ Foto Peserta Hari H'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    triggerAdminPhotoUpload(
                                      j.record.plantIdCode,
                                      'plantPhoto'
                                    )
                                  }
                                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#14271B]/15 bg-white hover:bg-[#F4F0E4] whitespace-nowrap"
                                >
                                  {j.record.plantPhoto
                                    ? 'Ganti Foto Bibit'
                                    : '+ Foto Bibit Hari H'}
                                </button>
                                <Link
                                  to={`/plant/${j.record.plantIdCode}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-[#B4D36C] text-[#14271B] hover:bg-[#c3df82] whitespace-nowrap"
                                >
                                  Buka Halaman
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedJourney && (
                    <div className="border border-[#14271B]/12 bg-white rounded-xl p-6 sm:p-8 space-y-4">
                      <div className="border-b border-[#14271B]/10 pb-4 no-print">
                        <p className="text-xs font-mono uppercase tracking-wider text-[#647C45]">
                          Kartu Portrait · {selectedJourney.record.plantIdCode}
                        </p>
                        <h3 className="font-editorial text-2xl font-medium">
                          {selectedJourney.participant.fullName} —{' '}
                          {selectedJourney.plant.plantName}
                        </h3>
                      </div>

                      <PlantCard
                        key={selectedJourney.record.id}
                        journey={selectedJourney}
                        allowTemplateSwitch
                        showPrintButton
                        defaultShowBothSides
                      />
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: GREEN ACTION / ACTIVITIES MANAGEMENT */}
          {activeTab === 'green-action' && (
            <div className="space-y-10">
              <div className="border-b border-[#14271B]/12 pb-6">
                <h2 className="font-editorial text-3xl font-medium">
                  Kelola Green Action &amp; Kegiatan
                </h2>
                <p className="text-sm text-[#14271B]/70 mt-1">
                  Tambah, ubah, atau perbarui status kegiatan Green Action. Setiap
                  perubahan langsung tampil di halaman utama dan halaman kegiatan.
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <section className="xl:col-span-5 bg-[#F4F0E4] border border-[#14271B]/12 rounded-xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-editorial text-2xl font-medium">
                      {editingEventId ? 'Edit Green Action' : 'Tambah Green Action Baru'}
                    </h3>
                    {editingEventId && (
                      <button
                        type="button"
                        onClick={resetEventForm}
                        className="text-xs font-medium text-[#284B34] hover:underline"
                      >
                        Batal Edit
                      </button>
                    )}
                  </div>

                  {evtError && (
                    <div
                      role="alert"
                      className="p-3 text-xs font-medium bg-[#fee2e2] border border-[#fca5a5] text-[#7f1d1d] rounded-md"
                    >
                      {evtError}
                    </div>
                  )}

                  {evtNotice && (
                    <div className="p-3.5 text-xs bg-[#ecfdf5] border border-[#86efac] text-[#14532d] rounded-md flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{evtNotice}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveGreenAction} className="space-y-4">
                    <div>
                      <label
                        htmlFor="evt-name"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                      >
                        Nama Kegiatan / Green Action
                      </label>
                      <input
                        id="evt-name"
                        type="text"
                        value={evtName}
                        onChange={(e) => setEvtName(e.target.value)}
                        placeholder="Contoh: Green Action — Hutan Kota Jambi"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="evt-date"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                        >
                          Tanggal
                        </label>
                        <input
                          id="evt-date"
                          type="text"
                          value={evtDate}
                          onChange={(e) => setEvtDate(e.target.value)}
                          placeholder="20 Januari 2027"
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="evt-status"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                        >
                          Status Kegiatan
                        </label>
                        <select
                          id="evt-status"
                          value={evtStatus}
                          onChange={(e) =>
                            setEvtStatus(e.target.value as EventStatus)
                          }
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                        >
                          <option value="Upcoming">Upcoming</option>
                          <option value="Ongoing">Ongoing</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="evt-location"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                      >
                        Lokasi
                      </label>
                      <input
                        id="evt-location"
                        type="text"
                        value={evtLocation}
                        onChange={(e) => setEvtLocation(e.target.value)}
                        placeholder="Kota / Kawasan Konservasi"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="evt-trees"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                        >
                          Jumlah Pohon
                        </label>
                        <input
                          id="evt-trees"
                          type="number"
                          min="0"
                          value={evtTrees}
                          onChange={(e) => setEvtTrees(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md tabular-nums"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="evt-volunteers"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                        >
                          Jumlah Relawan
                        </label>
                        <input
                          id="evt-volunteers"
                          type="number"
                          min="0"
                          value={evtVolunteers}
                          onChange={(e) => setEvtVolunteers(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md tabular-nums"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="evt-desc"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                      >
                        Deskripsi Kegiatan
                      </label>
                      <textarea
                        id="evt-desc"
                        rows={3}
                        value={evtDescription}
                        onChange={(e) => setEvtDescription(e.target.value)}
                        placeholder="Jelaskan fokus kegiatan dan tujuan penanaman..."
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                      />
                    </div>

                    <div>
                      <input
                        ref={evtCoverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleEventCoverPick}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => evtCoverInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md border border-[#14271B]/20 bg-white hover:bg-[#FAF9F4]"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {evtCoverImage ? 'Foto Cover Dipilih (Ganti)' : 'Unggah Foto Cover Kegiatan'}
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-md bg-[#14271B] text-[#FAF9F4] hover:bg-[#284B34] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {editingEventId ? 'Simpan Perubahan Kegiatan' : 'Publikasikan Green Action'}
                    </button>
                  </form>
                </section>

                <section className="xl:col-span-7 border border-[#14271B]/12 bg-white rounded-xl overflow-hidden">
                  <div className="p-5 border-b border-[#14271B]/10">
                    <h3 className="font-editorial text-2xl font-medium">
                      Daftar Green Action ({events.length})
                    </h3>
                  </div>

                  <div className="divide-y divide-[#14271B]/10">
                    {events.map((ev) => (
                      <div key={ev.id} className="p-5 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#647C45] font-medium">
                              <span>{ev.status}</span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">{ev.eventDate}</span>
                              <span aria-hidden="true">·</span>
                              <span>{ev.eventLocation}</span>
                            </div>
                            <h4 className="font-editorial text-xl font-medium">
                              {ev.eventName}
                            </h4>
                            <p className="text-xs text-[#14271B]/70 max-w-xl">
                              {ev.description}
                            </p>
                            <p className="text-xs font-mono text-[#14271B]/60 tabular-nums pt-1">
                              {ev.treesPlantedTarget} pohon · {ev.volunteerCount} relawan
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditEvent(ev)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[#14271B]/15 bg-white hover:bg-[#F4F0E4]"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            {events.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteEvent(ev.id)}
                                aria-label={`Hapus ${ev.eventName}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[#fca5a5] text-[#991b1b] hover:bg-[#fee2e2]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* TAB 3: PLANT SPECIES DATABASE */}
          {activeTab === 'plants' && (
            <div className="space-y-10">
              <div className="border-b border-[#14271B]/12 pb-6">
                <h2 className="font-editorial text-3xl font-medium">
                  Katalog Jenis Pohon
                </h2>
                <p className="text-sm text-[#14271B]/70 mt-1">
                  Tambahkan spesies pohon baru agar dapat dipilih saat membuat
                  halaman peserta.
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <section className="xl:col-span-5 bg-[#F4F0E4] border border-[#14271B]/12 rounded-xl p-6 space-y-5">
                  <h3 className="font-editorial text-2xl font-medium">
                    Tambah Jenis Pohon Baru
                  </h3>

                  {spError && (
                    <div
                      role="alert"
                      className="p-3 text-xs font-medium bg-[#fee2e2] border border-[#fca5a5] text-[#7f1d1d] rounded-md"
                    >
                      {spError}
                    </div>
                  )}

                  {spNotice && (
                    <div className="p-3.5 text-xs bg-[#ecfdf5] border border-[#86efac] text-[#14532d] rounded-md flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{spNotice}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateSpecies} className="space-y-4">
                    <div>
                      <label
                        htmlFor="sp-name"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                      >
                        Nama Pohon
                      </label>
                      <input
                        id="sp-name"
                        type="text"
                        value={spName}
                        onChange={(e) => setSpName(e.target.value)}
                        placeholder="Contoh: Trembesi"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="sp-sci"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                      >
                        Nama Ilmiah
                      </label>
                      <input
                        id="sp-sci"
                        type="text"
                        value={spScientific}
                        onChange={(e) => setSpScientific(e.target.value)}
                        placeholder="Contoh: Samanea saman"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md italic"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="sp-cat"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                      >
                        Kategori
                      </label>
                      <input
                        id="sp-cat"
                        type="text"
                        value={spCategory}
                        onChange={(e) => setSpCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="sp-overview"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                      >
                        Deskripsi Umum
                      </label>
                      <textarea
                        id="sp-overview"
                        rows={3}
                        value={spOverview}
                        onChange={(e) => setSpOverview(e.target.value)}
                        placeholder="Jelaskan karakter umum pohon..."
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="sp-hab"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                        >
                          Habitat
                        </label>
                        <input
                          id="sp-hab"
                          type="text"
                          value={spHabitat}
                          onChange={(e) => setSpHabitat(e.target.value)}
                          placeholder="Dataran rendah tropis"
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="sp-water"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-1.5"
                        >
                          Penyiraman
                        </label>
                        <input
                          id="sp-water"
                          type="text"
                          value={spWatering}
                          onChange={(e) => setSpWatering(e.target.value)}
                          placeholder="2-3x seminggu"
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <input
                        ref={spImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleSpeciesImagePick}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => spImageInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md border border-[#14271B]/20 bg-white hover:bg-[#FAF9F4]"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {spImage ? 'Foto Pohon Dipilih (Ganti)' : 'Unggah Foto Pohon'}
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-md bg-[#14271B] text-[#FAF9F4] hover:bg-[#284B34] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Simpan Jenis Pohon
                    </button>
                  </form>
                </section>

                <section className="xl:col-span-7 border border-[#14271B]/12 bg-white rounded-xl overflow-hidden">
                  <div className="p-5 border-b border-[#14271B]/10 flex items-center justify-between">
                    <h3 className="font-editorial text-2xl font-medium">
                      Spesies Terdaftar ({plants.length})
                    </h3>
                    <Link
                      to="/plants"
                      className="text-xs font-semibold text-[#284B34] hover:underline"
                    >
                      Lihat Katalog Publik →
                    </Link>
                  </div>

                  <div className="divide-y divide-[#14271B]/10">
                    {plants.map((p) => (
                      <div key={p.id} className="p-5 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-mono text-[#647C45]">
                          <span>{p.plantCode}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-sans">{p.category}</span>
                        </div>
                        <h4 className="font-editorial text-xl font-medium">
                          {p.plantName}{' '}
                          <span className="italic font-normal text-base text-[#14271B]/70">
                            ({p.scientificName})
                          </span>
                        </h4>
                        <p className="text-xs text-[#14271B]/75 leading-relaxed">
                          {p.overview}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
