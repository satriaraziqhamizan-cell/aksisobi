import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Edit3,
  Plus,
} from 'lucide-react';
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  MEDIA_ASSETS,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from '../data/seedData';
import {
  DEFAULT_PERSONAL_MESSAGE,
  addGrowthUpdateToRecord,
  compressImageFile,
  findJourneyByPlantCode,
  getAllPublishedJourneys,
  updateRecordDetails,
  updateRecordPhoto,
} from '../services/plantJourneyService';
import type { EnrichedPlantJourney } from '../types/plantJourney';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ResilientImage } from '../components/ResilientImage';
import { GrowthTimeline } from '../components/GrowthTimeline';
import { PlantCard } from '../components/PlantCard';
import { QRDisplay } from '../components/QRDisplay';
import { ImageUploadSlot } from '../components/ImageUploadSlot';
import { BackButton } from '../components/BackButton';

export function PlantJourneyPage() {
  const { plantId = '' } = useParams<{ plantId: string }>();
  const [journey, setJourney] = useState<EnrichedPlantJourney | null>(() =>
    findJourneyByPlantCode(plantId)
  );
  const [allJourneys, setAllJourneys] = useState<EnrichedPlantJourney[]>(() =>
    getAllPublishedJourneys()
  );

  // Inline Message Editor state
  const [editingMessage, setEditingMessage] = useState(false);
  const [messageDraft, setMessageDraft] = useState('');

  // Inline Growth Update Form state
  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [growthDayLabel, setGrowthDayLabel] = useState('Day 01');
  const [growthDate, setGrowthDate] = useState('2026-12-14');
  const [growthTitle, setGrowthTitle] = useState('');
  const [growthDesc, setGrowthDesc] = useState('');
  const [growthPhoto, setGrowthPhoto] = useState('');
  const [growthError, setGrowthError] = useState('');
  const growthFileRef = useRef<HTMLInputElement>(null);

  // Optional Card Section visibility
  const [showCardSection, setShowCardSection] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    const loaded = findJourneyByPlantCode(plantId);
    setJourney(loaded);
    setAllJourneys(getAllPublishedJourneys());
    setEditingMessage(false);
    setShowGrowthForm(false);
  }, [plantId]);

  if (!journey) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F4F0E4] text-[#14271B]">
        <Navbar variant="solid" />
        <main className="flex-1 flex items-center justify-center px-6 py-24">
          <div className="max-w-lg text-center space-y-6">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#765A3A]">
              Plant ID Tidak Ditemukan
            </p>
            <h1 className="font-editorial text-4xl font-medium">
              Perjalanan Tanaman Belum Tersedia
            </h1>
            <p className="text-base text-[#14271B]/75 leading-relaxed">
              We couldn&apos;t find your Plant ID (<span className="font-mono">{plantId}</span>).
              Silakan periksa kembali kode unik pada kartu Anda atau telusuri
              katalog jenis pohon yang tersedia.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/my-plant"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-md bg-[#14271B] text-[#FAF9F4] hover:bg-[#284B34] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Cari Ulang Plant ID
              </Link>
              <Link
                to="/plants"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-md border border-[#14271B]/20 hover:bg-white transition-colors"
              >
                Lihat Katalog Pohon
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { record, participant, plant, event, growthUpdates } = journey;
  const displayMessage =
    participant.personalMessage && participant.personalMessage.trim().length > 0
      ? participant.personalMessage
      : DEFAULT_PERSONAL_MESSAGE;

  const otherJourney = allJourneys.find(
    (item) => item.record.plantIdCode !== record.plantIdCode
  );

  const handlePhotoSlotUpload = (
    slot: 'participantPlantPhoto' | 'plantPhoto',
    dataUrl: string
  ) => {
    const updated = updateRecordPhoto(record.plantIdCode, slot, dataUrl);
    if (updated) {
      setJourney(updated);
      setAllJourneys(getAllPublishedJourneys());
    }
  };

  const handleSaveMessage = (e: FormEvent) => {
    e.preventDefault();
    const updated = updateRecordDetails(record.plantIdCode, {
      personalMessage: messageDraft.trim(),
    });
    if (updated) {
      setJourney(updated);
      setEditingMessage(false);
    }
  };

  const handleGrowthFilePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setGrowthPhoto(compressed);
      setGrowthError('');
    } catch (err) {
      setGrowthError(
        err instanceof Error ? err.message : 'Gagal membaca foto perkembangan.'
      );
    }
  };

  const handleAddGrowthSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!growthTitle.trim()) {
      setGrowthError('Mohon isi judul perkembangan tanaman.');
      return;
    }
    if (!growthDesc.trim()) {
      setGrowthError('Mohon isi catatan singkat perkembangan.');
      return;
    }
    const updated = addGrowthUpdateToRecord(record.plantIdCode, {
      dayLabel: growthDayLabel,
      updateDate: growthDate,
      title: growthTitle,
      description: growthDesc,
      photo: growthPhoto || plant.mainImage,
    });
    if (updated) {
      setJourney(updated);
      setGrowthTitle('');
      setGrowthDesc('');
      setGrowthPhoto('');
      setGrowthError('');
      setShowGrowthForm(false);
    }
  };

  const hasMissingDayHPhotos =
    !record.participantPlantPhoto || !record.plantPhoto;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F4] text-[#14271B]">
      <Navbar variant="transparent" />

      <main className="flex-1">
        {/* SECTION 01 — PERSONAL HERO */}
        <section className="relative min-h-[86vh] flex flex-col justify-between pt-24 pb-16 sm:pb-24 bg-[#14271B] text-[#FAF9F4] overflow-hidden no-print">
          <ResilientImage
            src={MEDIA_ASSETS.heroForest}
            alt={`Latar alam perjalanan tanaman ${plant.plantName}`}
            fallbackTitle={participant.fullName}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#14271B] via-[#14271B]/70 to-[#14271B]/55"
          />

          <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6">
            <BackButton
              fallbackTo="/my-plant"
              label="Kembali"
              variant="light"
            />
          </div>

          <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 pt-12">
            <div className="max-w-3xl space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-[0.22em] text-[#B4D36C]">
                <span>My Plant Journey</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{record.plantIdCode}</span>
              </div>

              <h1 className="font-editorial text-4xl sm:text-6xl lg:text-[4rem] font-medium leading-[1.08] tracking-tight">
                {participant.fullName}
              </h1>

              <p className="text-base sm:text-xl text-[#FAF9F4]/85 font-serif italic">
                A little action today, a greener tomorrow.
              </p>

              <p className="text-sm text-[#FAF9F4]/75 pt-1">
                {plant.plantName} (<span className="italic">{plant.scientificName}</span>) ·{' '}
                {record.plantingDate}
              </p>

              {hasMissingDayHPhotos && (
                <div className="pt-2">
                  <a
                    href="#meet-my-plant"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-md bg-[#B4D36C] text-[#14271B] hover:bg-[#c3df82] transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Lengkapi Foto Hari H Sekarang
                  </a>
                </div>
              )}
            </div>

            <div className="mt-14 pt-6 border-t border-[#FAF9F4]/15 flex flex-wrap items-center justify-between gap-4 text-xs text-[#FAF9F4]/75">
              <a
                href="#meet-my-plant"
                className="inline-flex items-center gap-2 font-medium text-[#B4D36C] hover:underline"
              >
                <span>Discover My Journey</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </a>

              {otherJourney && (
                <Link
                  to={`/plant/${otherJourney.record.plantIdCode}`}
                  className="inline-flex items-center gap-1.5 text-[#FAF9F4]/80 hover:text-[#B4D36C] transition-colors"
                >
                  <span>
                    Lihat Tanaman Lain: {otherJourney.plant.plantName} ({otherJourney.record.plantIdCode})
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 02 — ME & MY PLANT (CLICKABLE UPLOAD SLOT FOR DAY-H PHOTO) */}
        <section id="meet-my-plant" className="bg-[#F4F0E4] py-20 sm:py-28 no-print">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
              <div className="lg:col-span-6 flex flex-col">
                <ImageUploadSlot
                  src={record.participantPlantPhoto}
                  alt={`${participant.fullName} bersama bibit pohon ${plant.plantName}`}
                  emptyTitle="Slot Foto Hari H (Peserta & Tanaman)"
                  emptyDescription="Saat ID baru terbit, bagian ini masih kosong. Peserta atau admin dapat menekan area ini untuk mengunggah foto momen menanam di Hari H."
                  buttonLabel="Unggah Foto Bersama Tanaman"
                  aspectClass="flex-1 min-h-[420px]"
                  onUpload={(dataUrl) =>
                    handlePhotoSlotUpload('participantPlantPhoto', dataUrl)
                  }
                />
                <p className="text-xs font-serif italic text-[#14271B]/65 mt-3">
                  Fig. 1 — {participant.fullName} bersama bibit {plant.plantName} pada Hari H penanaman.
                </p>
              </div>

              <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#647C45]">
                    01 · Meet My Plant
                  </p>
                  <h2 className="font-editorial text-4xl sm:text-5xl font-medium text-[#14271B]">
                    {plant.plantName}
                  </h2>
                  <p className="font-serif italic text-lg text-[#14271B]/70">
                    {plant.scientificName}
                  </p>
                </div>

                <dl className="divide-y divide-[#14271B]/12 border-y border-[#14271B]/12 text-sm sm:text-base">
                  <div className="py-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <dt className="text-xs font-mono uppercase tracking-wider text-[#14271B]/55">
                      Penanam
                    </dt>
                    <dd className="font-medium text-[#14271B]">
                      {participant.fullName}
                    </dd>
                  </div>
                  <div className="py-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <dt className="text-xs font-mono uppercase tracking-wider text-[#14271B]/55">
                      Plant ID
                    </dt>
                    <dd className="font-mono font-semibold text-[#284B34] tabular-nums">
                      {record.plantIdCode}
                    </dd>
                  </div>
                  <div className="py-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <dt className="text-xs font-mono uppercase tracking-wider text-[#14271B]/55">
                      Tanggal Tanam
                    </dt>
                    <dd className="text-[#14271B] tabular-nums">
                      {record.plantingDate}
                    </dd>
                  </div>
                  <div className="py-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-6">
                    <dt className="text-xs font-mono uppercase tracking-wider text-[#14271B]/55 shrink-0">
                      Lokasi
                    </dt>
                    <dd className="text-[#14271B] sm:text-right">
                      {record.location}
                    </dd>
                  </div>
                  <div className="py-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-6">
                    <dt className="text-xs font-mono uppercase tracking-wider text-[#14271B]/55 shrink-0">
                      Kegiatan
                    </dt>
                    <dd className="text-[#14271B] sm:text-right">
                      {event.eventName}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 03 — THE BEGINNING OF MY JOURNEY */}
        <section className="bg-[#FAF9F4] py-20 sm:py-28 border-t border-[#14271B]/10 no-print">
          <div className="max-w-[1200px] mx-auto px-6 space-y-10">
            <div className="max-w-2xl space-y-4">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#647C45]">
                02 · The Beginning of My Journey
              </p>
              <h2 className="font-editorial text-3xl sm:text-5xl font-medium text-[#14271B]">
                {record.beginningTitle}
              </h2>
              <p className="text-base text-[#14271B]/75 leading-relaxed">
                {record.beginningDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <ImageUploadSlot
                  src={record.plantPhoto}
                  alt={`Dokumentasi awal penanaman ${plant.plantName} (${record.plantIdCode})`}
                  emptyTitle="Slot Foto Bibit Saat Ditanam (Hari H)"
                  emptyDescription="Klik untuk mengunggah foto bibit pohon yang baru saja ditanam ke tanah di lokasi kegiatan."
                  buttonLabel="Unggah Foto Penanaman Awal"
                  aspectClass="aspect-[16/10]"
                  onUpload={(dataUrl) =>
                    handlePhotoSlotUpload('plantPhoto', dataUrl)
                  }
                />
              </div>

              <div className="lg:col-span-4 space-y-6 lg:pl-4">
                <div className="space-y-2 border-b border-[#14271B]/12 pb-5">
                  <p className="text-xs font-mono uppercase tracking-wider text-[#647C45]">
                    Planting Day
                  </p>
                  <p className="font-editorial text-2xl font-medium tabular-nums">
                    {record.plantingDate}
                  </p>
                  <p className="text-sm text-[#14271B]/75">{record.location}</p>
                </div>

                <blockquote className="font-serif italic text-xl text-[#14271B]/85 leading-relaxed">
                  &ldquo;Every great journey begins with a small beginning.&rdquo;
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 04 — MY PLANT GROWTH */}
        <section className="bg-[#F4F0E4] py-20 sm:py-28 border-t border-[#14271B]/10 no-print">
          <div className="max-w-[1200px] mx-auto px-6 space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="max-w-2xl space-y-3">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#647C45]">
                  03 · My Plant Growth
                </p>
                <h2 className="font-editorial text-3xl sm:text-5xl font-medium text-[#14271B]">
                  Growing Through Time
                </h2>
                <p className="text-base text-[#14271B]/75 leading-relaxed">
                  Catatan perkembangan pohon {plant.plantName} yang diurutkan secara
                  kronologis dari hari pertama penanaman.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowGrowthForm((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-md bg-[#14271B] text-[#FAF9F4] hover:bg-[#284B34] transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                {showGrowthForm ? 'Tutup Form Update' : 'Tambah Dokumentasi Pertumbuhan'}
              </button>
            </div>

            {showGrowthForm && (
              <form
                onSubmit={handleAddGrowthSubmit}
                className="bg-[#FAF9F4] border border-[#14271B]/15 rounded-xl p-6 sm:p-8 space-y-5 max-w-2xl"
              >
                <h3 className="font-editorial text-2xl font-medium">
                  Catat Perkembangan Terbaru
                </h3>

                {growthError && (
                  <p role="alert" className="text-xs font-medium text-[#991b1b]">
                    {growthError}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="growth-day"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/70 mb-1.5"
                    >
                      Label Hari (mis. Day 01, Day 30)
                    </label>
                    <input
                      id="growth-day"
                      type="text"
                      value={growthDayLabel}
                      onChange={(e) => setGrowthDayLabel(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="growth-date"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/70 mb-1.5"
                    >
                      Tanggal Dokumentasi
                    </label>
                    <input
                      id="growth-date"
                      type="date"
                      value={growthDate}
                      onChange={(e) => setGrowthDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="growth-title"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/70 mb-1.5"
                  >
                    Judul Perkembangan
                  </label>
                  <input
                    id="growth-title"
                    type="text"
                    value={growthTitle}
                    onChange={(e) => setGrowthTitle(e.target.value)}
                    placeholder="Contoh: Daun Baru Mulai Bertumbuh"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                  />
                </div>

                <div>
                  <label
                    htmlFor="growth-desc"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/70 mb-1.5"
                  >
                    Catatan Pengamatan
                  </label>
                  <textarea
                    id="growth-desc"
                    rows={3}
                    value={growthDesc}
                    onChange={(e) => setGrowthDesc(e.target.value)}
                    placeholder="Tuliskan tinggi bibit atau kondisi daun saat ini..."
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#14271B]/20 rounded-md"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      ref={growthFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleGrowthFilePick}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => growthFileRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md border border-[#14271B]/20 bg-white hover:bg-[#F4F0E4]"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {growthPhoto ? 'Foto Dipilih (Ganti)' : 'Pilih Foto Perkembangan'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold rounded-md bg-[#B4D36C] text-[#14271B] hover:bg-[#c3df82]"
                  >
                    Simpan Dokumentasi
                  </button>
                </div>
              </form>
            )}

            <GrowthTimeline updates={growthUpdates} plantName={plant.plantName} />
          </div>
        </section>

        {/* SECTION 05 — GET TO KNOW MY PLANT */}
        <section className="bg-[#FAF9F4] py-20 sm:py-28 border-t border-[#14271B]/10 no-print">
          <div className="max-w-[1200px] mx-auto px-6 space-y-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-5">
                <div className="aspect-[3/4] rounded-xl overflow-hidden border border-[#14271B]/12 bg-[#F4F0E4]">
                  <ResilientImage
                    src={plant.mainImage}
                    alt={`Foto botani ${plant.plantName} (${plant.scientificName})`}
                    fallbackTitle={plant.plantName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs font-serif italic text-[#14271B]/65 mt-3">
                  Fig. 2 — Profil botani {plant.plantName} ({plant.scientificName}).
                </p>
              </div>

              <div className="lg:col-span-7 space-y-10">
                <div className="space-y-3">
                  <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#647C45]">
                    04 · Get to Know My Plant · {plant.plantCode}
                  </p>
                  <h2 className="font-editorial text-4xl sm:text-5xl font-medium text-[#14271B]">
                    {plant.plantName}
                  </h2>
                  <p className="font-serif italic text-lg text-[#14271B]/70">
                    {plant.scientificName} · {plant.category}
                  </p>
                  <p className="text-base text-[#14271B]/80 leading-relaxed pt-2">
                    {plant.overview}
                  </p>
                </div>

                {/* Plant Characteristics */}
                <div className="space-y-4 pt-6 border-t border-[#14271B]/12">
                  <h3 className="font-editorial text-2xl font-medium">
                    Plant Characteristics
                  </h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                    <div>
                      <dt className="text-xs font-mono uppercase tracking-wider text-[#647C45]">
                        Jenis Pohon
                      </dt>
                      <dd className="text-[#14271B]/85 mt-1 leading-relaxed">
                        {plant.characteristics.treeType}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-mono uppercase tracking-wider text-[#647C45]">
                        Bentuk Daun
                      </dt>
                      <dd className="text-[#14271B]/85 mt-1 leading-relaxed">
                        {plant.characteristics.leafShape}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-mono uppercase tracking-wider text-[#647C45]">
                        Ciri Khas
                      </dt>
                      <dd className="text-[#14271B]/85 mt-1 leading-relaxed">
                        {plant.characteristics.distinctiveTrait}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-mono uppercase tracking-wider text-[#647C45]">
                        Habitat
                      </dt>
                      <dd className="text-[#14271B]/85 mt-1 leading-relaxed">
                        {plant.characteristics.habitat}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Why This Plant Matters */}
                <div className="space-y-4 pt-6 border-t border-[#14271B]/12">
                  <h3 className="font-editorial text-2xl font-medium">
                    Why This Plant Matters
                  </h3>
                  <ul className="space-y-3">
                    {plant.benefits.map((benefit, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm sm:text-base text-[#14271B]/80 leading-relaxed"
                      >
                        <Check className="w-4 h-4 text-[#284B34] shrink-0 mt-1" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Plant Care Guide */}
                <div className="space-y-4 pt-6 border-t border-[#14271B]/12">
                  <h3 className="font-editorial text-2xl font-medium">
                    Plant Care Guide
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                    <div className="p-4 rounded-lg bg-[#F4F0E4] space-y-1">
                      <p className="font-semibold text-[#14271B]">Kebutuhan Air</p>
                      <p className="text-[#14271B]/75 leading-relaxed">
                        {plant.careGuide.watering}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#F4F0E4] space-y-1">
                      <p className="font-semibold text-[#14271B]">Cahaya Matahari</p>
                      <p className="text-[#14271B]/75 leading-relaxed">
                        {plant.careGuide.sunlight}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#F4F0E4] space-y-1">
                      <p className="font-semibold text-[#14271B]">Kondisi Tanah</p>
                      <p className="text-[#14271B]/75 leading-relaxed">
                        {plant.careGuide.soil}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#F4F0E4] space-y-1">
                      <p className="font-semibold text-[#14271B]">Perawatan &amp; Tumbuh</p>
                      <p className="text-[#14271B]/75 leading-relaxed">
                        {plant.careGuide.maintenance}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 06 — MY PLANT CARD (IDENTITAS PERSONAL, QR & KARTU PORTRAIT MUNCUL DI DALAM PLANT ID) */}
        <section className="bg-[#F4F0E4] py-20 sm:py-28 border-t border-[#14271B]/10">
          <div className="max-w-[1200px] mx-auto px-6 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 no-print">
              <div className="space-y-3 max-w-2xl">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#647C45]">
                  05 · My Plant Card &amp; QR Code
                </p>
                <h2 className="font-editorial text-3xl sm:text-5xl font-medium text-[#14271B]">
                  Kartu Identitas Portrait
                </h2>
                <p className="text-base text-[#14271B]/75 leading-relaxed">
                  Kartu dua sisi berukuran 54 × 85.6 mm yang terhubung dengan
                  halaman unik <span className="font-mono font-medium">{record.plantIdCode}</span>.
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCardSection((s) => !s)}
                  className="px-4 py-2 text-xs font-medium rounded-md border border-[#14271B]/20 bg-[#FAF9F4] hover:bg-white transition-colors whitespace-nowrap shrink-0"
                >
                  {showCardSection ? 'Sembunyikan Kartu' : 'Tampilkan Kartu Portrait'}
                </button>
                <QRDisplay plantIdCode={record.plantIdCode} size={88} showDownload />
              </div>
            </div>

            {/* Technical Card & QR Summary inside Plant ID view only */}
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-y border-[#14271B]/12 no-print">
              <div>
                <dt className="text-xs text-[#14271B]/60 mb-1">Spesies Pohon</dt>
                <dd className="font-editorial text-2xl font-medium text-[#14271B]">
                  {plant.plantName}
                </dd>
                <p className="text-xs text-[#647C45] mt-0.5 italic">
                  {plant.scientificName}
                </p>
              </div>
              <div>
                <dt className="text-xs text-[#14271B]/60 mb-1">
                  Identitas Personal
                </dt>
                <dd className="font-editorial text-2xl font-medium text-[#14271B] tabular-nums">
                  1 Kode QR
                </dd>
                <p className="text-xs text-[#647C45] mt-0.5">
                  Terhubung ke halaman unik {record.plantIdCode}
                </p>
              </div>
              <div>
                <dt className="text-xs text-[#14271B]/60 mb-1">
                  Kartu Portrait
                </dt>
                <dd className="font-editorial text-2xl font-medium text-[#14271B] tabular-nums">
                  54 × 85.6 mm
                </dd>
                <p className="text-xs text-[#647C45] mt-0.5">
                  Depan &amp; Belakang siap cetak
                </p>
              </div>
            </dl>

            {showCardSection && (
              <div className="bg-white border border-[#14271B]/12 rounded-xl p-6 sm:p-10">
                <PlantCard
                  key={record.id}
                  journey={journey}
                  allowTemplateSwitch
                  showPrintButton
                />
              </div>
            )}
          </div>
        </section>

        {/* SECTION 07 — PERSONAL MESSAGE */}
        <section className="bg-[#FAF9F4] py-20 sm:py-28 border-t border-[#14271B]/10 no-print">
          <div className="max-w-[820px] mx-auto px-6 text-center space-y-6">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#647C45]">
              06 · Personal Message
            </p>

            {editingMessage ? (
              <form
                onSubmit={handleSaveMessage}
                className="py-8 border-y border-[#14271B]/15 space-y-4 text-left"
              >
                <label
                  htmlFor="personal-msg-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/70"
                >
                  Tulis Harapan atau Pesan untuk Pohon Ini
                </label>
                <textarea
                  id="personal-msg-input"
                  rows={3}
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  placeholder="Tuliskan pesan personal Anda..."
                  className="w-full px-4 py-3 text-base font-serif bg-white border border-[#14271B]/20 rounded-md focus:outline-none focus:border-[#284B34]"
                />
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingMessage(false)}
                    className="px-4 py-2 text-xs font-medium text-[#14271B]/70 hover:text-[#14271B]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold rounded-md bg-[#14271B] text-[#FAF9F4] hover:bg-[#284B34]"
                  >
                    Simpan Pesan
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-10 border-y border-[#14271B]/15 space-y-5">
                <blockquote className="font-editorial italic text-2xl sm:text-4xl leading-snug text-[#14271B]">
                  &ldquo;{displayMessage}&rdquo;
                </blockquote>
                <button
                  type="button"
                  onClick={() => {
                    setMessageDraft(participant.personalMessage || '');
                    setEditingMessage(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#284B34] hover:underline"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {participant.personalMessage ? 'Ubah Pesan Personal' : 'Tulis Pesan Personal Anda'}
                </button>
              </div>
            )}

            <p className="text-sm text-[#14271B]/70">
              — {participant.fullName} · {plant.plantName} ({record.plantIdCode})
            </p>
          </div>
        </section>

        {/* SECTION 08 — CLOSING CAMPAIGN */}
        <section className="bg-[#284B34] text-[#FAF9F4] py-20 sm:py-24 no-print">
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#B4D36C]">
                Aksi Sobat Bumi
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl font-medium">
                Thank you for being part of this journey.
              </h2>
              <p className="text-sm sm:text-base text-[#FAF9F4]/80">
                Terhubung bersama kami melalui{' '}
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#B4D36C] hover:text-white"
                >
                  Instagram {INSTAGRAM_HANDLE}
                </a>{' '}
                atau{' '}
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#B4D36C] hover:text-white tabular-nums"
                >
                  WhatsApp {WHATSAPP_DISPLAY}
                </a>
                .
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/my-plant"
                className="px-5 py-3 text-sm font-semibold rounded-md bg-[#B4D36C] text-[#14271B] hover:bg-[#c3df82] transition-colors whitespace-nowrap shrink-0"
              >
                Cari Plant ID Lain
              </Link>
              <Link
                to="/"
                className="px-5 py-3 text-sm font-medium rounded-md border border-[#FAF9F4]/30 text-[#FAF9F4] hover:bg-[#FAF9F4]/10 transition-colors whitespace-nowrap shrink-0"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
