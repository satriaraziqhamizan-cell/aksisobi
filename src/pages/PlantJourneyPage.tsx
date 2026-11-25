import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
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
import { signInWithGooglePopup } from '../firebase';
import { usePlantData } from '../context/PlantDataContext';
import {
  addGrowthUpdateInFirestore,
  subscribeGrowthUpdates,
  subscribeJourneyByCodeFromFirestore,
  updateJourneyDetailsInFirestore,
  updateJourneyPhotoInFirestore,
} from '../services/firestoreSync';
import {
  compressImageFile,
  DEFAULT_PERSONAL_MESSAGE,
} from '../services/plantJourneyService';
import type { EnrichedPlantJourney, GrowthUpdate } from '../types/plantJourney';
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
  const {
    user,
    isAdmin,
    plants,
    events,
    firestoreReady,
    catalogLoaded,
    getJourneyByCode,
    resolveJourneyByCode,
  } = usePlantData();

  const adminJourney = isAdmin ? getJourneyByCode(plantId) : undefined;
  const [singleJourney, setSingleJourney] =
    useState<EnrichedPlantJourney | null>(null);
  const [loadingJourney, setLoadingJourney] = useState(true);
  const [liveUpdates, setLiveUpdates] = useState<GrowthUpdate[] | null>(null);

  const [editingMessage, setEditingMessage] = useState(false);
  const [messageDraft, setMessageDraft] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [growthDayLabel, setGrowthDayLabel] = useState('Hari ke-1');
  const [growthDate, setGrowthDate] = useState('2026-12-14');
  const [growthTitle, setGrowthTitle] = useState('');
  const [growthDesc, setGrowthDesc] = useState('');
  const [growthPhoto, setGrowthPhoto] = useState('');
  const [growthError, setGrowthError] = useState('');
  const [savingGrowth, setSavingGrowth] = useState(false);
  const growthFileRef = useRef<HTMLInputElement>(null);

  const [showCardSection, setShowCardSection] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setEditingMessage(false);
    setShowGrowthForm(false);
    setActionNotice('');
    setLiveUpdates(null);
    setSingleJourney(null);
    setLoadingJourney(true);
  }, [plantId]);

  useEffect(() => {
    if (!catalogLoaded) return;
    if (isAdmin && adminJourney) {
      setSingleJourney(adminJourney);
      setLoadingJourney(false);
      return;
    }

    let active = true;
    const unsub = subscribeJourneyByCodeFromFirestore(
      plantId,
      plants,
      events,
      (docJourney) => {
        if (!active) return;
        if (docJourney) {
          setSingleJourney(docJourney);
          setLoadingJourney(false);
        } else if (!firestoreReady) {
          void resolveJourneyByCode(plantId).then((fallback) => {
            if (!active) return;
            setSingleJourney(fallback);
            setLoadingJourney(false);
          });
        } else {
          setSingleJourney(null);
          setLoadingJourney(false);
        }
      }
    );

    return () => {
      active = false;
      unsub();
    };
  }, [
    plantId,
    catalogLoaded,
    firestoreReady,
    isAdmin,
    adminJourney,
    plants,
    events,
    resolveJourneyByCode,
  ]);

  const journey = adminJourney || singleJourney;

  useEffect(() => {
    if (!journey || !firestoreReady) return;
    const unsub = subscribeGrowthUpdates(
      journey.record.plantIdCode,
      (updates) => setLiveUpdates(updates)
    );
    return unsub;
  }, [journey?.record.plantIdCode, firestoreReady]);

  if (loadingJourney && !journey) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F6F8F6] text-[#0F1F17]">
        <Navbar variant="solid" />
        <main className="flex-1 flex items-center justify-center px-6 py-24">
          <p className="text-sm font-mono uppercase tracking-widest text-[#4E6156]">
            Memuat Halaman Pohon...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F6F8F6] text-[#0F1F17]">
        <Navbar variant="solid" />
        <main className="flex-1 flex items-center justify-center px-6 py-24">
          <div className="max-w-lg text-center space-y-6">
            <p className="text-sm font-medium text-[#166534]">
              ID Pohon Tidak Ditemukan
            </p>
            <h1 className="text-4xl font-semibold">
              Halaman Tanaman Belum Tersedia
            </h1>
            <p className="text-base text-[#4E6156] leading-relaxed">
              Kami tidak menemukan ID Pohon (
              <span className="font-mono">{plantId}</span>). Silakan periksa
              kembali kode unik pada kartu Anda, pindai ulang QR Code, atau
              telusuri katalog jenis pohon yang tersedia.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/my-plant"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Pindai QR / Cari ID Pohon
              </Link>
              <Link
                to="/plants"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
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

  const { record, participant, plant, event } = journey;
  const growthUpdates =
    liveUpdates !== null ? liveUpdates : journey.growthUpdates;

  const enrichedWithUpdates = {
    ...journey,
    growthUpdates,
  };

  const rawMessage = participant.personalMessage?.trim() || '';
  const displayMessage =
    rawMessage.length === 0 ||
    rawMessage === 'One small action can grow into something meaningful.'
      ? DEFAULT_PERSONAL_MESSAGE
      : rawMessage;

  const localizedBeginningTitle =
    record.beginningTitle === 'Everything Starts With a Seed.'
      ? 'Semua Berawal dari Satu Benih.'
      : record.beginningTitle;

  const needsGoogleSignIn = !user || !user.emailVerified;

  const ensureVerifiedGoogleUser = async (): Promise<boolean> => {
    if (user && user.emailVerified) return true;
    const cred = await signInWithGooglePopup();
    return Boolean(cred.user && cred.user.emailVerified);
  };

  const handlePhotoSlotUpload = async (
    slot: 'participantPlantPhoto' | 'plantPhoto',
    dataUrl: string
  ) => {
    await updateJourneyPhotoInFirestore(record.plantIdCode, slot, dataUrl);
    setActionNotice('Foto Hari H berhasil tersimpan di halaman perjalanan Anda.');
  };

  const handleSaveMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (needsGoogleSignIn) {
      await ensureVerifiedGoogleUser();
    }
    await updateJourneyDetailsInFirestore(record.plantIdCode, {
      personalMessage: messageDraft.trim(),
    });
    setEditingMessage(false);
    setActionNotice('Pesan personal berhasil diperbarui.');
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

  const handleAddGrowthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!growthTitle.trim()) {
      setGrowthError('Mohon isi judul perkembangan tanaman.');
      return;
    }
    if (!growthDesc.trim()) {
      setGrowthError('Mohon isi catatan singkat perkembangan.');
      return;
    }

    setSavingGrowth(true);
    try {
      let activeUid = user?.uid || '';
      if (needsGoogleSignIn) {
        const cred = await signInWithGooglePopup();
        activeUid = cred.user.uid;
      }
      await addGrowthUpdateInFirestore(
        record.plantIdCode,
        {
          dayLabel: growthDayLabel,
          updateDate: growthDate,
          title: growthTitle,
          description: growthDesc,
          photo: growthPhoto || plant.mainImage,
        },
        activeUid
      );
      setGrowthTitle('');
      setGrowthDesc('');
      setGrowthPhoto('');
      setGrowthError('');
      setShowGrowthForm(false);
      setActionNotice('Catatan pertumbuhan berhasil ditambahkan.');
    } catch (err) {
      setGrowthError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan dokumentasi pertumbuhan.'
      );
    } finally {
      setSavingGrowth(false);
    }
  };

  const hasMissingDayHPhotos =
    !record.participantPlantPhoto || !record.plantPhoto;

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0F1F17]">
      <Navbar variant="solid" />

      <main className="flex-1">
        {/* PERSONAL HERO */}
        <section className="relative bg-[#0F2419] text-white py-12 sm:py-20 overflow-hidden no-print">
          <ResilientImage
            src={MEDIA_ASSETS.heroForest}
            alt={`Latar alam perjalanan tanaman ${plant.plantName}`}
            fallbackTitle={participant.fullName}
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#0F2419] via-[#0F2419]/80 to-[#0F2419]/65"
          />

          <div className="relative z-10 max-w-[1200px] mx-auto px-6 space-y-10">
            <div>
              <BackButton
                fallbackTo="/my-plant"
                label="Kembali"
                variant="light"
              />
            </div>

            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#A3E635]">
                <span>Jejak Pohonku</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{record.plantIdCode}</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-semibold leading-[1.08] tracking-tight">
                {participant.fullName}
              </h1>

              {participant.studyProgram && (
                <p className="text-sm sm:text-base font-medium text-[#A3E635]">
                  Program Studi: {participant.studyProgram}
                </p>
              )}

              <p className="text-base sm:text-xl text-white/85">
                Satu langkah kecil hari ini, bumi yang lebih hijau esok hari.
              </p>

              <p className="text-sm text-white/75">
                {plant.plantName} (
                <span className="italic">{plant.scientificName}</span>) ·{' '}
                {record.plantingDate}
              </p>

              {hasMissingDayHPhotos && (
                <div className="pt-3 space-y-2">
                  <a
                    href="#meet-my-plant"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-[#A3E635] text-[#0F1F17] hover:bg-[#bef264] transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Isi Foto Hari-H di Slot Kosong Sekarang
                  </a>
                  <p className="text-xs text-white/75">
                    Halaman QR ini baru aktif — slot foto Hari-H sengaja masih
                    kosong untuk diisi saat penanaman.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs text-white/75">
              <a
                href="#meet-my-plant"
                className="inline-flex items-center gap-2 font-medium text-[#A3E635] hover:underline"
              >
                <span>Lihat Detail Pohonku</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </section>

        {actionNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-[#0F1F17] text-xs font-medium py-3 px-6 text-center no-print">
            {actionNotice}
          </div>
        )}

        {/* ME & MY PLANT */}
        <section id="meet-my-plant" className="bg-[#F6F8F6] py-20 sm:py-24 no-print">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
              <div className="lg:col-span-6 flex flex-col">
                <ImageUploadSlot
                  src={record.participantPlantPhoto}
                  alt={`${participant.fullName} bersama bibit pohon ${plant.plantName}`}
                  emptyTitle="Unggah Foto Bersama Bibit (Hari H)"
                  emptyDescription="Bagian ini masih kosong untuk peserta baru. Ketuk kotak ini saat hari penanaman untuk mengunggah foto Anda bersama pohon."
                  buttonLabel="Unggah Foto Bersama Tanaman"
                  aspectClass="flex-1 min-h-[420px]"
                  needsAuth={needsGoogleSignIn}
                  onRequestAuth={ensureVerifiedGoogleUser}
                  onUpload={(dataUrl) =>
                    handlePhotoSlotUpload('participantPlantPhoto', dataUrl)
                  }
                />
                <p className="text-xs text-[#4E6156] mt-3">
                  Dokumentasi {participant.fullName} bersama bibit{' '}
                  {plant.plantName} pada Hari-H penanaman.
                </p>
              </div>

              <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-[#166534]">
                    Kenali Pohonku
                  </p>
                  <h2 className="text-4xl sm:text-5xl font-semibold text-[#0F1F17]">
                    {plant.plantName}
                  </h2>
                  <p className="italic text-lg text-[#4E6156]">
                    {plant.scientificName}
                  </p>
                </div>

                <dl className="divide-y divide-zinc-200 border-y border-zinc-200 text-sm sm:text-base">
                  <div className="py-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <dt className="text-xs font-semibold text-[#4E6156]">
                      Penanam
                    </dt>
                    <dd className="font-medium text-[#0F1F17]">
                      {participant.fullName}
                    </dd>
                  </div>
                  {participant.studyProgram && (
                    <div className="py-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                      <dt className="text-xs font-semibold text-[#4E6156]">
                        Program Studi
                      </dt>
                      <dd className="font-medium text-[#0F1F17]">
                        {participant.studyProgram}
                      </dd>
                    </div>
                  )}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <dt className="text-xs font-semibold text-[#4E6156]">
                      ID Pohon
                    </dt>
                    <dd className="font-mono font-semibold text-[#166534] tabular-nums">
                      {record.plantIdCode}
                    </dd>
                  </div>
                  <div className="py-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                    <dt className="text-xs font-semibold text-[#4E6156]">
                      Tanggal Tanam
                    </dt>
                    <dd className="text-[#0F1F17] tabular-nums">
                      {record.plantingDate}
                    </dd>
                  </div>
                  <div className="py-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-6">
                    <dt className="text-xs font-semibold text-[#4E6156] shrink-0">
                      Lokasi
                    </dt>
                    <dd className="text-[#0F1F17] sm:text-right">
                      {record.location}
                    </dd>
                  </div>
                  <div className="py-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-6">
                    <dt className="text-xs font-semibold text-[#4E6156] shrink-0">
                      Kegiatan
                    </dt>
                    <dd className="text-[#0F1F17] sm:text-right">
                      {event.eventName}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* BEGINNING OF JOURNEY */}
        <section className="bg-white py-20 sm:py-24 border-t border-zinc-200/80 no-print">
          <div className="max-w-[1200px] mx-auto px-6 space-y-10">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-medium text-[#166534]">
                Awal Penanaman Pohon
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold text-[#0F1F17]">
                {localizedBeginningTitle}
              </h2>
              <p className="text-base text-[#4E6156] leading-relaxed">
                {record.beginningDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <ImageUploadSlot
                  src={record.plantPhoto}
                  alt={`Dokumentasi awal penanaman ${plant.plantName} (${record.plantIdCode})`}
                  emptyTitle="Unggah Foto Bibit di Tanah (Hari-H)"
                  emptyDescription="Kosong saat kartu baru dibuat. Ketuk di sini untuk menambahkan foto kondisi bibit pohon setelah tertanam."
                  buttonLabel="Unggah Foto Penanaman Awal"
                  aspectClass="aspect-[16/10]"
                  needsAuth={needsGoogleSignIn}
                  onRequestAuth={ensureVerifiedGoogleUser}
                  onUpload={(dataUrl) =>
                    handlePhotoSlotUpload('plantPhoto', dataUrl)
                  }
                />
              </div>

              <div className="lg:col-span-4 space-y-6 lg:pl-4">
                <div className="space-y-1.5 border-b border-zinc-200 pb-5">
                  <p className="text-xs font-semibold text-[#166534]">
                    Hari Penanaman
                  </p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {record.plantingDate}
                  </p>
                  <p className="text-sm text-[#4E6156]">{record.location}</p>
                </div>

                <blockquote className="text-lg sm:text-xl font-medium text-[#0F1F17] leading-relaxed">
                  &ldquo;Setiap perjalanan besar selalu dimulai dari langkah
                  kecil.&rdquo;
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* PERKEMBANGAN POHONKU */}
        <section className="bg-[#F6F8F6] py-20 sm:py-24 border-t border-zinc-200 no-print">
          <div className="max-w-[1200px] mx-auto px-6 space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="max-w-2xl space-y-2.5">
                <p className="text-sm font-medium text-[#166534]">
                  Perkembangan Pohonku
                </p>
                <h2 className="text-3xl sm:text-4xl font-semibold text-[#0F1F17]">
                  Bertumbuh Seiring Waktu
                </h2>
                <p className="text-base text-[#4E6156] leading-relaxed">
                  Catatan perkembangan pohon {plant.plantName} yang diurutkan
                  secara berurutan sejak hari pertama penanaman.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowGrowthForm((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                {showGrowthForm
                  ? 'Tutup Formulir'
                  : 'Tambah Dokumentasi Pertumbuhan'}
              </button>
            </div>

            {showGrowthForm && (
              <form
                onSubmit={(e) => void handleAddGrowthSubmit(e)}
                className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 space-y-5 max-w-2xl"
              >
                <h3 className="text-2xl font-semibold">
                  Catat Perkembangan Terbaru
                </h3>

                {growthError && (
                  <p role="alert" className="text-xs font-medium text-red-700">
                    {growthError}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="growth-day"
                      className="block text-xs font-semibold text-[#4E6156] mb-1.5"
                    >
                      Keterangan Hari (mis. Hari ke-1, Hari ke-30)
                    </label>
                    <input
                      id="growth-day"
                      type="text"
                      value={growthDayLabel}
                      onChange={(e) => setGrowthDayLabel(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="growth-date"
                      className="block text-xs font-semibold text-[#4E6156] mb-1.5"
                    >
                      Tanggal Dokumentasi
                    </label>
                    <input
                      id="growth-date"
                      type="date"
                      value={growthDate}
                      onChange={(e) => setGrowthDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="growth-title"
                    className="block text-xs font-semibold text-[#4E6156] mb-1.5"
                  >
                    Judul Perkembangan
                  </label>
                  <input
                    id="growth-title"
                    type="text"
                    value={growthTitle}
                    onChange={(e) => setGrowthTitle(e.target.value)}
                    placeholder="Contoh: Daun Baru Mulai Bertumbuh"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-300 rounded-lg"
                  />
                </div>

                <div>
                  <label
                    htmlFor="growth-desc"
                    className="block text-xs font-semibold text-[#4E6156] mb-1.5"
                  >
                    Catatan Pengamatan
                  </label>
                  <textarea
                    id="growth-desc"
                    rows={3}
                    value={growthDesc}
                    onChange={(e) => setGrowthDesc(e.target.value)}
                    placeholder="Tuliskan tinggi bibit atau kondisi daun saat ini..."
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-zinc-300 rounded-lg"
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
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {growthPhoto
                        ? 'Foto Dipilih (Ganti)'
                        : 'Pilih Foto Perkembangan'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={savingGrowth}
                    className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534] disabled:opacity-60"
                  >
                    {savingGrowth
                      ? 'Menyimpan...'
                      : needsGoogleSignIn
                      ? 'Masuk Google & Simpan'
                      : 'Simpan Dokumentasi'}
                  </button>
                </div>
              </form>
            )}

            <GrowthTimeline
              updates={growthUpdates}
              plantName={plant.plantName}
            />
          </div>
        </section>

        {/* BOTANICAL PROFILE */}
        <section className="bg-white py-20 sm:py-24 border-t border-zinc-200/80 no-print">
          <div className="max-w-[1200px] mx-auto px-6 space-y-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-5">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100">
                  <ResilientImage
                    src={plant.mainImage}
                    alt={`Foto botani ${plant.plantName} (${plant.scientificName})`}
                    fallbackTitle={plant.plantName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-[#4E6156] mt-3">
                  Profil botani {plant.plantName} ({plant.scientificName}).
                </p>
              </div>

              <div className="lg:col-span-7 space-y-10">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-[#166534]">
                    Mengenal Jenis Pohonku · {plant.plantCode}
                  </p>
                  <h2 className="text-4xl sm:text-5xl font-semibold text-[#0F1F17]">
                    {plant.plantName}
                  </h2>
                  <p className="italic text-lg text-[#4E6156]">
                    {plant.scientificName} · {plant.category}
                  </p>
                  <p className="text-base text-[#4E6156] leading-relaxed pt-2">
                    {plant.overview}
                  </p>
                </div>

                {/* Ciri-Ciri Pohon */}
                <div className="space-y-4 pt-6 border-t border-zinc-200">
                  <h3 className="text-2xl font-semibold">Ciri-Ciri Pohon</h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                    <div>
                      <dt className="text-xs font-semibold text-[#166534]">
                        Jenis Pohon
                      </dt>
                      <dd className="text-[#4E6156] mt-1 leading-relaxed">
                        {plant.characteristics.treeType}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-[#166534]">
                        Bentuk Daun
                      </dt>
                      <dd className="text-[#4E6156] mt-1 leading-relaxed">
                        {plant.characteristics.leafShape}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-[#166534]">
                        Ciri Khas
                      </dt>
                      <dd className="text-[#4E6156] mt-1 leading-relaxed">
                        {plant.characteristics.distinctiveTrait}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-[#166534]">
                        Habitat
                      </dt>
                      <dd className="text-[#4E6156] mt-1 leading-relaxed">
                        {plant.characteristics.habitat}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Manfaat Pohon Ini */}
                <div className="space-y-4 pt-6 border-t border-zinc-200">
                  <h3 className="text-2xl font-semibold">
                    Mengapa Pohon Ini Bermanfaat
                  </h3>
                  <ul className="space-y-3">
                    {plant.benefits.map((benefit, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm sm:text-base text-[#4E6156] leading-relaxed"
                      >
                        <Check className="w-4 h-4 text-[#166534] shrink-0 mt-1" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Panduan Perawatan Pohon */}
                <div className="space-y-4 pt-6 border-t border-zinc-200">
                  <h3 className="text-2xl font-semibold">
                    Panduan Perawatan Pohon
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 rounded-xl bg-[#F6F8F6] border border-zinc-200/80 space-y-1">
                      <p className="font-semibold text-[#0F1F17]">
                        Kebutuhan Air
                      </p>
                      <p className="text-[#4E6156] leading-relaxed">
                        {plant.careGuide.watering}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#F6F8F6] border border-zinc-200/80 space-y-1">
                      <p className="font-semibold text-[#0F1F17]">
                        Cahaya Matahari
                      </p>
                      <p className="text-[#4E6156] leading-relaxed">
                        {plant.careGuide.sunlight}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#F6F8F6] border border-zinc-200/80 space-y-1">
                      <p className="font-semibold text-[#0F1F17]">
                        Kondisi Tanah
                      </p>
                      <p className="text-[#4E6156] leading-relaxed">
                        {plant.careGuide.soil}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#F6F8F6] border border-zinc-200/80 space-y-1">
                      <p className="font-semibold text-[#0F1F17]">
                        Perawatan &amp; Tumbuh
                      </p>
                      <p className="text-[#4E6156] leading-relaxed">
                        {plant.careGuide.maintenance}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MY PLANT CARD */}
        <section className="bg-[#F6F8F6] py-20 sm:py-24 border-t border-zinc-200">
          <div className="max-w-[1200px] mx-auto px-6 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 no-print">
              <div className="space-y-3 max-w-2xl">
                <p className="text-sm font-medium text-[#166534]">
                  Kartu Identitas &amp; Kode QR
                </p>
                <h2 className="text-3xl sm:text-4xl font-semibold text-[#0F1F17]">
                  Cocard Volunteer Aksi Sobat Bumi
                </h2>
                <p className="text-base text-[#4E6156] leading-relaxed">
                  Kartu dua sisi berukuran 9.5 × 13.5 cm (full bleed) yang
                  terhubung dengan halaman unik{' '}
                  <span className="font-mono font-medium text-[#0F1F17]">
                    {record.plantIdCode}
                  </span>
                  . Dapat langsung diunduh dalam format PNG atau ZIP siap cetak.
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCardSection((s) => !s)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
                >
                  {showCardSection
                    ? 'Sembunyikan Kartu'
                    : 'Tampilkan Kartu Cocard'}
                </button>
                <QRDisplay
                  plantIdCode={record.plantIdCode}
                  size={88}
                  showDownload
                />
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-y border-zinc-200 no-print">
              <div>
                <dt className="text-xs text-[#4E6156] mb-1">Spesies Pohon</dt>
                <dd className="text-2xl font-semibold text-[#0F1F17]">
                  {plant.plantName}
                </dd>
                <p className="text-xs text-[#166534] mt-0.5 italic">
                  {plant.scientificName}
                </p>
              </div>
              <div>
                <dt className="text-xs text-[#4E6156] mb-1">
                  Identitas Personal
                </dt>
                <dd className="text-2xl font-semibold text-[#0F1F17] tabular-nums">
                  1 Kode QR
                </dd>
                <p className="text-xs text-[#166534] mt-0.5">
                  Terhubung ke halaman unik {record.plantIdCode}
                </p>
              </div>
              <div>
                <dt className="text-xs text-[#4E6156] mb-1">Kartu Cocard</dt>
                <dd className="text-2xl font-semibold text-[#0F1F17] tabular-nums">
                  9.5 × 13.5 cm
                </dd>
                <p className="text-xs text-[#166534] mt-0.5">
                  Depan &amp; Belakang siap unduh
                </p>
              </div>
            </dl>

            {showCardSection && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-10">
                <PlantCard
                  key={record.id}
                  journey={enrichedWithUpdates}
                  allowTemplateSwitch
                  showPrintButton
                />
              </div>
            )}
          </div>
        </section>

        {/* PERSONAL MESSAGE */}
        <section className="bg-white py-20 sm:py-24 border-t border-zinc-200/80 no-print">
          <div className="max-w-[820px] mx-auto px-6 text-center space-y-6">
            <p className="text-sm font-medium text-[#166534]">
              Pesan &amp; Harapan Penanam
            </p>

            {editingMessage ? (
              <form
                onSubmit={(e) => void handleSaveMessage(e)}
                className="py-8 border-y border-zinc-200 space-y-4 text-left"
              >
                <label
                  htmlFor="personal-msg-input"
                  className="block text-xs font-semibold text-[#4E6156]"
                >
                  Tulis Harapan atau Pesan untuk Pohon Ini
                </label>
                <textarea
                  id="personal-msg-input"
                  rows={3}
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  placeholder="Tuliskan pesan personal Anda..."
                  className="w-full px-4 py-3 text-base bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-[#166534]"
                />
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingMessage(false)}
                    className="px-4 py-2 text-xs font-medium text-[#4E6156] hover:text-[#0F1F17]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534]"
                  >
                    {needsGoogleSignIn
                      ? 'Masuk Google & Simpan Pesan'
                      : 'Simpan Pesan'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-10 border-y border-zinc-200 space-y-5">
                <blockquote className="text-2xl sm:text-4xl font-medium leading-snug text-[#0F1F17]">
                  &ldquo;{displayMessage}&rdquo;
                </blockquote>
                <button
                  type="button"
                  onClick={() => {
                    setMessageDraft(participant.personalMessage || '');
                    setEditingMessage(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#166534] hover:underline"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {participant.personalMessage
                    ? 'Ubah Pesan Personal'
                    : 'Tulis Pesan Personal Anda'}
                </button>
              </div>
            )}

            <p className="text-sm text-[#4E6156]">
              — {participant.fullName} · {plant.plantName} ({record.plantIdCode}
              )
            </p>
          </div>
        </section>

        {/* CLOSING CAMPAIGN */}
        <section className="bg-[#0F2419] text-white py-20 sm:py-24 no-print">
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <p className="text-sm font-medium text-[#A3E635]">
                Aksi Sobat Bumi
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold">
                Terima kasih sudah menjadi bagian dari perjalanan hijau ini.
              </h2>
              <p className="text-sm sm:text-base text-white/80">
                Terhubung bersama kami melalui{' '}
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#A3E635] hover:text-white"
                >
                  Instagram {INSTAGRAM_HANDLE}
                </a>{' '}
                atau{' '}
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#A3E635] hover:text-white tabular-nums"
                >
                  WhatsApp {WHATSAPP_DISPLAY}
                </a>
                .
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/my-plant"
                className="px-5 py-3 text-sm font-semibold rounded-lg bg-[#A3E635] text-[#0F1F17] hover:bg-[#bef264] transition-colors whitespace-nowrap shrink-0"
              >
                Pindai / Cari ID Pohon Lain
              </Link>
              <Link
                to="/"
                className="px-5 py-3 text-sm font-medium rounded-lg border border-white/25 text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
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
