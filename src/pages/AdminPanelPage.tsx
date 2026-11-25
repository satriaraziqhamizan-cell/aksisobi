import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Calendar,
  Camera,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  FileArchive,
  FileSpreadsheet,
  Link2,
  Loader2,
  LogOut,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Sprout,
  Trash2,
  Users,
} from 'lucide-react';
import { signOutFirebase } from '../firebase';
import { usePlantData } from '../context/PlantDataContext';
import {
  createEventInFirestore,
  createJourneyInFirestore,
  createPlantSpeciesInFirestore,
  deleteEventInFirestore,
  deleteJourneyInFirestore,
  fetchWebhookConfig,
  getNextPlantIdCodeFromExisting,
  importFormRowsToFirestore,
  saveIntegrationSettingsInFirestore,
  updateEventInFirestore,
  updateJourneyDetailsInFirestore,
  updateJourneyPhotoInFirestore,
  type FormSubmissionRow,
} from '../services/firestoreSync';
import { compressImageFile } from '../services/plantJourneyService';
import type {
  CardTemplateId,
  EventStatus,
} from '../types/plantJourney';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PlantCard } from '../components/PlantCard';
import { BackButton } from '../components/BackButton';
import { QRDisplay } from '../components/QRDisplay';
import { ResilientImage } from '../components/ResilientImage';
import { getPlantDirectUrl } from '../utils/qrLinks';
import {
  downloadAllCocardsZip,
  downloadParticipantCocardZip,
  downloadSingleCocardSide,
} from '../utils/cocardExporter';

type AdminTab = 'participants' | 'green-action' | 'plants' | 'gform-sync';
type ParticipantCreateMode = 'gform' | 'single' | 'csv';

function parseQuickCsvRows(rawText: string): FormSubmissionRow[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const rows: FormSubmissionRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    if (
      i === 0 &&
      (lower.includes('nama lengkap') ||
        lower === 'nama' ||
        lower.startsWith('timestamp'))
    ) {
      continue;
    }

    const cols = line
      .split(/\t|,|;|\|/)
      .map((c) => c.trim().replace(/^"|"$/g, ''))
      .filter((c) => c.length > 0);
    if (cols.length === 0) continue;

    let nameCandidate = cols[0].replace(/^\d+[.)]\s*/, '').trim();
    if (cols.length > 1 && /\d{1,4}[/-]\d{1,2}[/-]\d{2,4}/.test(nameCandidate)) {
      nameCandidate = cols[1].replace(/^\d+[.)]\s*/, '').trim();
    }
    if (!nameCandidate) continue;

    const plantCol = cols.find(
      (c, idx) =>
        idx > 0 &&
        !c.startsWith('http') &&
        (c.toLowerCase().includes('tabebuya') ||
          c.toLowerCase().includes('ketapang') ||
          c.toLowerCase().startsWith('pl-'))
    );
    const photoCol = cols.find((c) => c.startsWith('http')) || '';
    const prodiCol =
      cols.find(
        (c, idx) =>
          idx > 0 &&
          c !== plantCol &&
          !c.startsWith('http') &&
          !/^\d{4}-\d{2}/.test(c)
      ) || '';

    rows.push({
      queueId: `csv-${i}`,
      submittedAt: new Date().toISOString(),
      fullName: nameCandidate,
      studyProgram: prodiCol,
      plantName: plantCol || '',
      eventName: '',
      location: '',
      photoUrl: photoCol,
      personalMessage: '',
      fingerprint: `csv-${nameCandidate.toLowerCase()}-${i}`,
    });
  }

  return rows;
}

export function AdminPanelPage() {
  const navigate = useNavigate();
  const {
    authReady,
    user,
    isAdmin,
    plants,
    events,
    journeys,
    fingerprints,
    integrationSettings,
    lastAutoSyncNotice,
    syncingGForm,
    syncGoogleSheetNow,
  } = usePlantData();

  const [activeTab, setActiveTab] = useState<AdminTab>('participants');
  const [createMode, setCreateMode] = useState<ParticipantCreateMode>('gform');

  const [selectedJourneyCode, setSelectedJourneyCode] = useState<string>(
    () => journeys[0]?.record.plantIdCode || 'SB26-0001'
  );

  // Sync Settings draft
  const [sheetUrlDraft, setSheetUrlDraft] = useState(
    () => integrationSettings.sheetUrl
  );
  const [autoSyncDraft, setAutoSyncDraft] = useState(
    () => integrationSettings.autoSyncEnabled
  );

  useEffect(() => {
    setSheetUrlDraft(integrationSettings.sheetUrl);
    setAutoSyncDraft(integrationSettings.autoSyncEnabled);
  }, [integrationSettings.sheetUrl, integrationSettings.autoSyncEnabled]);

  // Live webhook config for authenticated Admin
  const [webhookConfig, setWebhookConfig] = useState<{
    webhookUrl: string;
    webhookSecret: string;
  } | null>(null);

  useEffect(() => {
    if (!isAdmin || !user) return;
    let active = true;
    void user.getIdToken().then((token) =>
      fetchWebhookConfig(token).then((cfg) => {
        if (active && cfg) setWebhookConfig(cfg);
      })
    );
    return () => {
      active = false;
    };
  }, [isAdmin, user]);

  // Filter, Selection, Bulk ZIP & Batch Print state
  const [searchTerm, setSearchTerm] = useState('');
  const [showBatchPrint, setShowBatchPrint] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [zipProgress, setZipProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [rowDownloadingKey, setRowDownloadingKey] = useState<string | null>(null);
  const [confirmDeleteCode, setConfirmDeleteCode] = useState<string | null>(null);
  const [editingRecordCode, setEditingRecordCode] = useState<string | null>(null);
  const [editNameDraft, setEditNameDraft] = useState('');
  const [editProdiDraft, setEditProdiDraft] = useState('');
  const [editPlantIdDraft, setEditPlantIdDraft] = useState('');
  const [editLocationDraft, setEditLocationDraft] = useState('');

  // Single Participant Form State
  const [fullName, setFullName] = useState('');
  const [studyProgram, setStudyProgram] = useState('');
  const [selectedPlantId, setSelectedPlantId] = useState(
    () => plants[0]?.id || 'plant-tabebuya'
  );
  const [selectedEventId, setSelectedEventId] = useState(
    () => events[1]?.id || events[0]?.id || 'evt-coastal-canopy'
  );
  const [plantingDate, setPlantingDate] = useState('14 Desember 2026');
  const [location, setLocation] = useState('Pesisir Marunda, Jakarta Utara');
  const [templateId, setTemplateId] = useState<CardTemplateId>('forest');
  const [cardFrontPhoto, setCardFrontPhoto] = useState('');
  const [participantNotice, setParticipantNotice] = useState('');
  const [participantError, setParticipantError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Manual CSV Fallback
  const [batchText, setBatchText] = useState('');

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
  const [copiedScript, setCopiedScript] = useState(false);

  const cardPhotoInputRef = useRef<HTMLInputElement>(null);
  const csvUploadInputRef = useRef<HTMLInputElement>(null);
  const dayHPhotoInputRef = useRef<HTMLInputElement>(null);
  const evtCoverInputRef = useRef<HTMLInputElement>(null);
  const spImageInputRef = useRef<HTMLInputElement>(null);
  const cardPreviewSectionRef = useRef<HTMLDivElement>(null);

  const [activeUploadTarget, setActiveUploadTarget] = useState<{
    code: string;
    slot: 'participantPlantPhoto' | 'plantPhoto' | 'cardFrontPhoto';
  } | null>(null);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFFF] text-[#0F1F17]">
        <p className="text-sm font-mono uppercase tracking-widest">
          Memuat Portal Admin...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    await signOutFirebase();
    navigate('/admin/login', { replace: true });
  };

  /* Google Form / Sheet Direct Sync */
  const handleSaveAndSyncSheet = async (e: FormEvent) => {
    e.preventDefault();
    setParticipantError('');
    setParticipantNotice('');

    if (!sheetUrlDraft.trim()) {
      setParticipantError(
        'Tempel tautan Google Sheets hasil Google Form Anda terlebih dahulu.'
      );
      return;
    }

    const updatedSettings = {
      sheetUrl: sheetUrlDraft.trim(),
      defaultPlantId: selectedPlantId,
      defaultEventId: selectedEventId,
      defaultPlantingDate: plantingDate,
      defaultLocation: location,
      defaultTemplateId: templateId,
      autoSyncEnabled: autoSyncDraft,
      lastSyncedAt: integrationSettings.lastSyncedAt,
    };

    try {
      await saveIntegrationSettingsInFirestore(updatedSettings);
      const res = await syncGoogleSheetNow(updatedSettings);
      const colInfo =
        res.detectedPhotoHeaders.length > 0
          ? ` Kolom foto yang dipakai: "${res.detectedPhotoHeaders.join('" → "')}".`
          : '';
      if (res.createdCodes.length > 0 && res.updatedCodes.length > 0) {
        setSelectedJourneyCode(res.createdCodes[0]);
        setParticipantNotice(
          `Berhasil menarik ${res.createdCodes.length} pendaftar baru (${res.createdCodes[0]} – ${res.createdCodes[res.createdCodes.length - 1]}) dan memperbarui ${res.updatedCodes.length} foto pribadi dari Google Form.${colInfo}`
        );
      } else if (res.createdCodes.length > 0) {
        setSelectedJourneyCode(res.createdCodes[0]);
        setParticipantNotice(
          `Berhasil menarik ${res.createdCodes.length} pendaftar baru langsung dari Google Form (${res.createdCodes[0]} – ${res.createdCodes[res.createdCodes.length - 1]}) dengan foto pribadi saja (slot foto Hari H tetap kosong).${colInfo}`
        );
      } else if (res.updatedCodes.length > 0) {
        setSelectedJourneyCode(res.updatedCodes[0]);
        setParticipantNotice(
          `Berhasil memperbarui foto pribadi / prodi untuk ${res.updatedCodes.length} peserta (${res.updatedCodes.slice(0, 5).join(', ')}${res.updatedCodes.length > 5 ? ', ...' : ''}).${colInfo}`
        );
      } else {
        setParticipantNotice(
          `Sinkronisasi selesai (${res.skippedCount} pendaftar sudah up-to-date).${colInfo}`
        );
      }
    } catch (err) {
      setParticipantError(
        err instanceof Error
          ? err.message
          : 'Gagal membaca Google Sheet. Pastikan link Google Sheet dapat diakses (Viewer).'
      );
    }
  };

  /* Single Participant */
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

  const handleCreateTemplate = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setParticipantError('Nama peserta wajib diisi.');
      return;
    }

    setSubmitting(true);
    setParticipantError('');
    try {
      const code = getNextPlantIdCodeFromExisting(journeys);
      await createJourneyInFirestore({
        plantIdCode: code,
        fullName,
        studyProgram,
        plantId: selectedPlantId,
        eventId: selectedEventId,
        plantingDate,
        location,
        templateId,
        cardFrontPhoto,
      });
      setSelectedJourneyCode(code);
      setParticipantNotice(
        `Plant ID ${code} untuk ${fullName} berhasil dibuat di Firestore (QR & Cocard aktif, slot foto Hari H kosong).`
      );
      setFullName('');
      setStudyProgram('');
      setCardFrontPhoto('');
    } catch (err) {
      setParticipantError(
        err instanceof Error ? err.message : 'Gagal menyimpan peserta baru.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* CSV Manual Fallback */
  const handleBatchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!batchText.trim()) {
      setParticipantError('Tempel daftar peserta atau unggah file CSV terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    setParticipantError('');
    try {
      const parsedRows = parseQuickCsvRows(batchText);
      const res = await importFormRowsToFirestore(
        parsedRows,
        {
          defaultPlantId: selectedPlantId,
          eventId: selectedEventId,
          plantingDate,
          location,
          templateId,
        },
        new Set(fingerprints),
        journeys,
        plants,
        events
      );
      if (res.createdCodes.length === 0) {
        setParticipantError('Tidak ada peserta baru yang dapat ditambahkan.');
      } else {
        setSelectedJourneyCode(res.createdCodes[0]);
        setParticipantNotice(
          `Berhasil menerbitkan ${res.createdCodes.length} Plant ID (${res.createdCodes[0]} – ${res.createdCodes[res.createdCodes.length - 1]}) dengan slot Hari H kosong.`
        );
        setBatchText('');
      }
    } catch (err) {
      setParticipantError(
        err instanceof Error ? err.message : 'Gagal memproses import CSV.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCsvFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      setBatchText(content);
      setParticipantError('');
    };
    reader.readAsText(file);
    if (csvUploadInputRef.current) csvUploadInputRef.current.value = '';
  };

  const startEditRecord = (code: string) => {
    const found = journeys.find((j) => j.record.plantIdCode === code);
    if (!found) return;
    setEditingRecordCode(code);
    setEditNameDraft(found.participant.fullName);
    setEditProdiDraft(found.participant.studyProgram || '');
    setEditPlantIdDraft(found.plant.id);
    setEditLocationDraft(found.record.location);
  };

  const handleSaveRecordEdit = async (code: string) => {
    if (!editNameDraft.trim()) return;
    await updateJourneyDetailsInFirestore(code, {
      fullName: editNameDraft.trim(),
      studyProgram: editProdiDraft.trim(),
      plantId: editPlantIdDraft,
      location: editLocationDraft.trim(),
    });
    setEditingRecordCode(null);
    setParticipantNotice(`Biodata & Cocard ${code} berhasil diperbarui.`);
  };

  const handleConfirmDeleteRecord = async (code: string) => {
    await deleteJourneyInFirestore(code);
    setConfirmDeleteCode(null);
    setParticipantNotice(`Data peserta ${code} telah dihapus.`);
  };

  const triggerRowPhotoUpload = (
    code: string,
    slot: 'participantPlantPhoto' | 'plantPhoto' | 'cardFrontPhoto'
  ) => {
    setActiveUploadTarget({ code, slot });
    dayHPhotoInputRef.current?.click();
  };

  const handleRowPhotoPicked = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadTarget) return;
    try {
      const compressed = await compressImageFile(file);
      await updateJourneyPhotoInFirestore(
        activeUploadTarget.code,
        activeUploadTarget.slot,
        compressed
      );
      setParticipantNotice(
        `Foto untuk ${activeUploadTarget.code} berhasil diperbarui.`
      );
    } catch (err) {
      setParticipantError(
        err instanceof Error ? err.message : 'Gagal mengunggah foto.'
      );
    } finally {
      setActiveUploadTarget(null);
      if (dayHPhotoInputRef.current) dayHPhotoInputRef.current.value = '';
    }
  };

  const handleFocusCardPrint = (code: string) => {
    setSelectedJourneyCode(code);
    setShowBatchPrint(false);
    window.setTimeout(() => {
      cardPreviewSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const handleRowCardDownload = async (
    code: string,
    mode: 'front' | 'back' | 'zip'
  ) => {
    const target = journeys.find((j) => j.record.plantIdCode === code);
    if (!target) return;
    setParticipantError('');
    setRowDownloadingKey(`${code}:${mode}`);
    try {
      if (mode === 'zip') {
        await downloadParticipantCocardZip(target);
      } else {
        await downloadSingleCocardSide(target, mode);
      }
    } catch (err) {
      setParticipantError(
        err instanceof Error ? err.message : 'Gagal mengunduh kartu peserta.'
      );
    } finally {
      setRowDownloadingKey(null);
    }
  };

  const handleBulkZipDownload = async (itemsToExport: typeof filteredJourneys) => {
    if (itemsToExport.length === 0) {
      setParticipantError('Belum ada ID Card peserta yang dapat diunduh.');
      return;
    }
    setParticipantError('');
    setZipProgress({ done: 0, total: itemsToExport.length });
    try {
      await downloadAllCocardsZip(itemsToExport, (done, total) => {
        setZipProgress({ done, total });
      });
      setParticipantNotice(
        `Berhasil mengunduh ${itemsToExport.length} Cocard (Depan & Belakang QR) dalam 1 file .ZIP.`
      );
    } catch (err) {
      setParticipantError(
        err instanceof Error ? err.message : 'Gagal membuat file ZIP Cocard.'
      );
    } finally {
      setZipProgress(null);
    }
  };

  const toggleRowSelection = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  /* Green Action Event handlers */
  const handleEvtCoverPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setEvtCoverImage(compressed);
      setEvtError('');
    } catch (err) {
      setEvtError(err instanceof Error ? err.message : 'Gagal membaca foto event.');
    }
  };

  const startEditEvent = (eventId: string) => {
    const evt = events.find((item) => item.id === eventId);
    if (!evt) return;
    setEditingEventId(evt.id);
    setEvtName(evt.eventName);
    setEvtDate(evt.eventDate);
    setEvtLocation(evt.eventLocation);
    setEvtDescription(evt.description);
    setEvtStatus(evt.status);
    setEvtTrees(String(evt.treesPlantedTarget));
    setEvtVolunteers(String(evt.volunteerCount));
    setEvtCoverImage(evt.coverImage);
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
  };

  const handleEventSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!evtName.trim() || !evtDate.trim() || !evtLocation.trim() || !evtDescription.trim()) {
      setEvtError('Mohon lengkapi nama kegiatan, tanggal, lokasi, dan deskripsi.');
      return;
    }

    if (editingEventId) {
      const existingEvt = events.find((ev) => ev.id === editingEventId);
      if (existingEvt) {
        await updateEventInFirestore(existingEvt, {
          eventName: evtName,
          eventDate: evtDate,
          eventLocation: evtLocation,
          description: evtDescription,
          fullStory: evtDescription,
          status: evtStatus,
          treesPlantedTarget: Number(evtTrees) || 0,
          volunteerCount: Number(evtVolunteers) || 0,
          coverImage: evtCoverImage || existingEvt.coverImage,
        });
      }
      setEvtNotice(`Green Action "${evtName}" berhasil diperbarui.`);
    } else {
      await createEventInFirestore(
        {
          eventName: evtName,
          eventDate: evtDate,
          eventLocation: evtLocation,
          description: evtDescription,
          status: evtStatus,
          treesPlantedTarget: Number(evtTrees) || 0,
          volunteerCount: Number(evtVolunteers) || 0,
          coverImage: evtCoverImage,
        },
        events
      );
      setEvtNotice(`Green Action "${evtName}" berhasil ditambahkan.`);
    }
    resetEventForm();
    setEvtError('');
  };

  /* Species handler */
  const handleSpeciesImgPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setSpImage(compressed);
      setSpError('');
    } catch (err) {
      setSpError(err instanceof Error ? err.message : 'Gagal membaca foto pohon.');
    }
  };

  const handleSpeciesSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!spName.trim() || !spScientific.trim() || !spOverview.trim()) {
      setSpError('Nama pohon, nama ilmiah, dan deskripsi wajib diisi.');
      return;
    }
    await createPlantSpeciesInFirestore(
      {
        plantName: spName,
        scientificName: spScientific,
        category: spCategory,
        overview: spOverview,
        mainImage: spImage,
        habitat: spHabitat,
        watering: spWatering,
        sunlight: spSunlight,
      },
      plants.length
    );
    setSpNotice(`Jenis pohon "${spName}" berhasil ditambahkan ke Katalog Pohon.`);
    setSpName('');
    setSpScientific('');
    setSpOverview('');
    setSpHabitat('');
    setSpWatering('');
    setSpSunlight('');
    setSpImage('');
    setSpError('');
  };

  const appsScriptSnippet = `// Tempel di Google Sheets (Extensions -> Apps Script) pada Sheet hasil Google Form
// Trigger: From spreadsheet -> On form submit
function onFormSubmit(e) {
  var row = e.namedValues || {};
  var pick = function(keys) {
    for (var i = 0; i < keys.length; i++) {
      if (row[keys[i]] && row[keys[i]][0]) return row[keys[i]][0];
    }
    return "";
  };
  var pickStandalonePhoto = function() {
    var headers = Object.keys(row);
    var excluded = ["twibbon", "twibon", "twibun", "bingkai", "frame", "poster", "story", "feeds", "bukti", "screenshot", "bayar", "pembayaran", "transfer", "rekening", "konfirmasi", "follow", "instagram", "tiktok", "sosmed", "kampanye", "share", "repost"];
    var priority = ["foto pribadi", "foto mandiri", "pas foto", "foto diri", "foto sendiri", "foto formal", "foto cocard", "foto peserta", "swafoto", "selfie", "foto", "photo"];
    for (var p = 0; p < priority.length; p++) {
      for (var h = 0; h < headers.length; h++) {
        var low = headers[h].toLowerCase();
        var isExcluded = excluded.some(function(ex) { return low.indexOf(ex) !== -1; });
        if (!isExcluded && low.indexOf(priority[p]) !== -1 && row[headers[h]] && row[headers[h]][0]) {
          return row[headers[h]][0];
        }
      }
    }
    return "";
  };

  var payload = {
    fullName: pick(["Nama Lengkap", "Nama", "Full Name"]),
    studyProgram: pick(["Program Studi", "Prodi", "Jurusan", "Fakultas", "Study Program"]),
    plantName: pick(["Jenis Pohon", "Pohon", "Tanaman"]),
    eventName: pick(["Kegiatan", "Event"]),
    location: pick(["Lokasi", "Location"]),
    photoUrl: pickStandalonePhoto(),
    personalMessage: pick(["Pesan", "Harapan", "Message"]),
    submittedAt: new Date().toISOString()
  };

  UrlFetchApp.fetch("${webhookConfig?.webhookUrl || window.location.origin + '/api/gform-webhook'}", {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-webhook-secret": "${webhookConfig?.webhookSecret || 'MEMUAT_SECRET'}"
    },
    payload: JSON.stringify(payload)
  });
}`;

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(appsScriptSnippet);
      setCopiedScript(true);
      window.setTimeout(() => setCopiedScript(false), 2500);
    } catch {
      // Ignore clipboard error
    }
  };

  const nextIdPreview = getNextPlantIdCodeFromExisting(journeys);
  const filteredJourneys = journeys.filter((item) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      item.participant.fullName.toLowerCase().includes(q) ||
      (item.participant.studyProgram || '').toLowerCase().includes(q) ||
      item.record.plantIdCode.toLowerCase().includes(q) ||
      item.plant.plantName.toLowerCase().includes(q)
    );
  });

  const selectedFilteredJourneys = filteredJourneys.filter((item) =>
    selectedCodes.includes(item.record.plantIdCode)
  );
  const exportTargetJourneys =
    selectedFilteredJourneys.length > 0
      ? selectedFilteredJourneys
      : filteredJourneys;
  const allFilteredSelected =
    filteredJourneys.length > 0 &&
    filteredJourneys.every((item) =>
      selectedCodes.includes(item.record.plantIdCode)
    );

  const activeJourney =
    journeys.find((j) => j.record.plantIdCode === selectedJourneyCode) ||
    journeys[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#0F1F17]">
      <Navbar variant="solid" />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0 bg-[#0F1F17] text-[#FFFFFF] p-6 flex flex-col justify-between gap-6 no-print">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#A3E635]">
                Panel Admin
              </p>
              <h1 className="font-editorial text-2xl font-medium mt-1">
                Aksi Sobat Bumi
              </h1>
              {user?.email && (
                <p className="text-[11px] font-mono text-[#FFFFFF]/60 mt-1 truncate">
                  {user.email}
                </p>
              )}
            </div>

            <nav className="space-y-1.5" aria-label="Menu admin">
              <button
                type="button"
                onClick={() => setActiveTab('participants')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors text-left ${
                  activeTab === 'participants'
                    ? 'bg-[#166534] text-[#A3E635]'
                    : 'text-[#FFFFFF]/80 hover:bg-[#FFFFFF]/10'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Peserta &amp; Kartu QR</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('green-action')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors text-left ${
                  activeTab === 'green-action'
                    ? 'bg-[#166534] text-[#A3E635]'
                    : 'text-[#FFFFFF]/80 hover:bg-[#FFFFFF]/10'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Aksi Hijau</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('plants')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors text-left ${
                  activeTab === 'plants'
                    ? 'bg-[#166534] text-[#A3E635]'
                    : 'text-[#FFFFFF]/80 hover:bg-[#FFFFFF]/10'
                }`}
              >
                <Sprout className="w-4 h-4 shrink-0" />
                <span>Katalog Pohon</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('gform-sync')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors text-left ${
                  activeTab === 'gform-sync'
                    ? 'bg-[#166534] text-[#A3E635]'
                    : 'text-[#FFFFFF]/80 hover:bg-[#FFFFFF]/10'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span>Alur Google Form</span>
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-[#FFFFFF]/15 space-y-2.5">
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-medium rounded-md border border-[#FFFFFF]/25 text-[#FFFFFF] hover:bg-[#FFFFFF]/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar Admin
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 sm:p-10 space-y-10 max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4 no-print">
            <BackButton fallbackTo="/" label="Kembali ke Beranda" />
            <div className="flex items-center gap-4 text-xs font-mono text-[#4E6156] tabular-nums">
              <span>{journeys.length} Plant ID</span>
              <span>·</span>
              <span>{events.length} Kegiatan</span>
              <span>·</span>
              <span>{plants.length} Spesies</span>
            </div>
          </div>

          {lastAutoSyncNotice && (
            <div className="p-4 rounded-lg bg-[#e8f5e9] border border-[#81c784] text-[#0F1F17] text-xs font-medium flex items-center gap-2.5 no-print">
              <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
              <span>{lastAutoSyncNotice}</span>
            </div>
          )}

          {/* TAB 1: PARTICIPANTS, DIRECT GFORM SYNC & CARDS */}
          {activeTab === 'participants' && (
            <div className="space-y-10">
              <section className="bg-[#F6F8F6] border border-[#0F1F17]/12 rounded-xl p-6 sm:p-8 space-y-6 no-print">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="font-editorial text-2xl sm:text-3xl font-medium">
                      Terbitkan Plant ID, Halaman QR &amp; Kartu Portrait
                    </h2>
                    <p className="text-sm text-[#0F1F17]/75 max-w-2xl">
                      Sambungkan Google Form / Google Sheets secara langsung
                      agar setiap pendaftar baru (beserta foto di awal kartu)
                      otomatis masuk tanpa copy-paste. Bagian upload foto Hari H
                      selalu dibiarkan kosong.
                    </p>
                  </div>

                  {/* Mode Switcher */}
                  <div className="inline-flex flex-wrap p-1 rounded-lg bg-white border border-[#0F1F17]/15">
                    <button
                      type="button"
                      onClick={() => setCreateMode('gform')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                        createMode === 'gform'
                          ? 'bg-[#0F1F17] text-[#FFFFFF]'
                          : 'text-[#0F1F17]/70 hover:text-[#0F1F17]'
                      }`}
                    >
                      Otomatis Google Form
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateMode('single')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                        createMode === 'single'
                          ? 'bg-[#0F1F17] text-[#FFFFFF]'
                          : 'text-[#0F1F17]/70 hover:text-[#0F1F17]'
                      }`}
                    >
                      + Tambah 1 Peserta
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateMode('csv')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                        createMode === 'csv'
                          ? 'bg-[#0F1F17] text-[#FFFFFF]'
                          : 'text-[#0F1F17]/70 hover:text-[#0F1F17]'
                      }`}
                    >
                      Import CSV Manual
                    </button>
                  </div>
                </div>

                {participantNotice && (
                  <div className="p-3.5 text-xs font-medium bg-[#e8f5e9] border border-[#81c784] text-[#0F1F17] rounded-md flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
                    <span>{participantNotice}</span>
                  </div>
                )}

                {participantError && (
                  <div
                    role="alert"
                    className="p-3.5 text-xs font-medium bg-[#fee2e2] border border-[#fca5a5] text-[#7f1d1d] rounded-md"
                  >
                    {participantError}
                  </div>
                )}

                {/* Shared Defaults Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#0F1F17]/10">
                  <div>
                    <label
                      htmlFor="adm-plant"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                    >
                      Jenis Pohon Default
                    </label>
                    <select
                      id="adm-plant"
                      value={selectedPlantId}
                      onChange={(e) => setSelectedPlantId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                    >
                      {plants.map((pl) => (
                        <option key={pl.id} value={pl.id}>
                          {pl.plantName} ({pl.plantCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="adm-event"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                    >
                      Kegiatan Aksi Hijau
                    </label>
                    <select
                      id="adm-event"
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                    >
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.eventName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="adm-template"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                    >
                      Desain Cocard Resmi
                    </label>
                    <input
                      id="adm-template"
                      type="text"
                      readOnly
                      value="Cocard Aksi Sobi 2026 (9.5 × 13.5 cm)"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md text-[#0F1F17]/80"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="adm-date"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                    >
                      Tanggal Tanam
                    </label>
                    <input
                      id="adm-date"
                      type="text"
                      value={plantingDate}
                      onChange={(e) => setPlantingDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="adm-loc"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                    >
                      Lokasi Penanaman
                    </label>
                    <input
                      id="adm-loc"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                    />
                  </div>
                </div>

                {createMode === 'gform' && (
                  <form
                    onSubmit={(e) => void handleSaveAndSyncSheet(e)}
                    className="space-y-4 pt-3 border-t border-[#0F1F17]/10"
                  >
                    <div className="bg-white border border-[#0F1F17]/12 rounded-lg p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-[#166534]" />
                          <h3 className="font-semibold text-sm">
                            Sambungkan Google Sheet Jawaban Google Form (Tanpa
                            Copy-Paste)
                          </h3>
                        </div>
                        {integrationSettings.lastSyncedAt && (
                          <span className="text-[11px] font-mono text-[#4E6156]">
                            Terakhir sinkron: {integrationSettings.lastSyncedAt}
                          </span>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="gform-sheet-url"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                        >
                          Link Google Sheets (Jawaban Form)
                        </label>
                        <input
                          id="gform-sheet-url"
                          type="url"
                          value={sheetUrlDraft}
                          onChange={(e) => setSheetUrlDraft(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          className="w-full px-3.5 py-2.5 text-sm bg-[#FFFFFF] border border-[#0F1F17]/20 rounded-md"
                        />
                        <p className="text-[11px] text-[#0F1F17]/65 mt-1.5">
                          Di Google Sheets hasil Form Anda, klik{' '}
                          <strong>Bagikan (Share) → Siapa saja yang memiliki link (Viewer)</strong>.
                          Kolom <em>Nama</em>, <em>Program Studi / Prodi</em>,{' '}
                          <em>Jenis Pohon</em>, dan <strong>Foto Mandiri (JPG/PNG)</strong>{' '}
                          masuk otomatis ke kotak Cocard (kolom Twibbon otomatis diabaikan).
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <label className="inline-flex items-center gap-2 text-xs text-[#0F1F17]/80 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoSyncDraft}
                            onChange={(e) => setAutoSyncDraft(e.target.checked)}
                            className="rounded border-[#0F1F17]/30"
                          />
                          <span>
                            Tarik pendaftar baru otomatis setiap 15 detik saat
                            halaman Admin dibuka
                          </span>
                        </label>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('gform-sync')}
                            className="px-3.5 py-2.5 text-xs font-medium rounded-md border border-[#0F1F17]/20 hover:bg-[#F6F8F6]"
                          >
                            Atur Webhook Real-Time
                          </button>
                          <button
                            type="submit"
                            disabled={syncingGForm}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-md bg-[#0F1F17] text-[#FFFFFF] hover:bg-[#166534] disabled:opacity-60 transition-colors"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${
                                syncingGForm ? 'animate-spin' : ''
                              }`}
                            />
                            {syncingGForm
                              ? 'Menyinkronkan...'
                              : 'Simpan & Tarik Data Google Form'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                {createMode === 'single' && (
                  <form
                    onSubmit={(e) => void handleCreateTemplate(e)}
                    className="space-y-4 pt-2"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label
                          htmlFor="adm-name"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                        >
                          Nama Lengkap Peserta
                        </label>
                        <input
                          id="adm-name"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Contoh: Raka Pratama"
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="adm-prodi"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                        >
                          Program Studi (Prodi)
                        </label>
                        <input
                          id="adm-prodi"
                          type="text"
                          value={studyProgram}
                          onChange={(e) => setStudyProgram(e.target.value)}
                          placeholder="Contoh: Kehutanan / Teknik Lingkungan"
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                        />
                      </div>
                      <div className="flex items-end gap-3">
                        <input
                          ref={cardPhotoInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                          onChange={handleCardPhotoPick}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => cardPhotoInputRef.current?.click()}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium rounded-md border border-[#0F1F17]/20 bg-white hover:bg-[#FFFFFF]"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          {cardFrontPhoto
                            ? 'Foto Mandiri Dipilih (Ganti)'
                            : 'Unggah Foto Mandiri (JPG / PNG)'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <p className="text-xs text-[#0F1F17]/65">
                        ID Berikutnya:{' '}
                        <span className="font-mono font-semibold text-[#166534]">
                          {nextIdPreview}
                        </span>{' '}
                        · Slot Foto Hari H Kosong
                      </p>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-md bg-[#0F1F17] text-[#FFFFFF] hover:bg-[#166534] disabled:opacity-60 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {submitting
                          ? 'Menyimpan...'
                          : `Terbitkan ID ${nextIdPreview}`}
                      </button>
                    </div>
                  </form>
                )}

                {createMode === 'csv' && (
                  <form
                    onSubmit={(e) => void handleBatchSubmit(e)}
                    className="space-y-4 pt-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label
                        htmlFor="batch-names-input"
                        className="text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70"
                      >
                        Import CSV / Daftar Nama Manual (1 Baris = 1 Peserta)
                      </label>
                      <div>
                        <input
                          ref={csvUploadInputRef}
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleCsvFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => csvUploadInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[#0F1F17]/20 bg-white hover:bg-[#FFFFFF]"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          Unggah File .CSV
                        </button>
                      </div>
                    </div>

                    <textarea
                      id="batch-names-input"
                      rows={5}
                      value={batchText}
                      onChange={(e) => setBatchText(e.target.value)}
                      placeholder={
                        'Contoh:\nAhmad Fauzan, Kehutanan, Tabebuya, https://drive.google.com/open?id=...\nSiti Nurhaliza, Ilmu Lingkungan, Ketapang'
                      }
                      className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-[#0F1F17]/20 rounded-md"
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-md bg-[#0F1F17] text-[#FFFFFF] hover:bg-[#166534] disabled:opacity-60 transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        Terbitkan ID &amp; Kartu QR
                      </button>
                    </div>
                  </form>
                )}
              </section>

              {/* Participant & Collected ID Cards Table */}
              <section className="space-y-4 no-print">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-editorial text-2xl font-medium">
                      Daftar ID Card Terkumpul ({filteredJourneys.length})
                    </h2>
                    <p className="text-xs text-[#4E6156] mt-0.5">
                      Unduh kartu Cocard (Depan + Belakang QR) satu per satu
                      atau unduh sekaligus dalam 1 file ZIP siap cetak.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#0F1F17]/45 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari nama, prodi, atau SB26-..."
                        className="pl-8 pr-3 py-2 text-xs bg-white border border-[#0F1F17]/20 rounded-md w-56"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={zipProgress !== null || exportTargetJourneys.length === 0}
                      onClick={() => void handleBulkZipDownload(exportTargetJourneys)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-[#14532D] text-white hover:bg-[#166534] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
                    >
                      {zipProgress ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileArchive className="w-3.5 h-3.5" />
                      )}
                      {zipProgress
                        ? `Membuat ZIP (${zipProgress.done}/${zipProgress.total})...`
                        : selectedFilteredJourneys.length > 0
                        ? `Unduh ${selectedFilteredJourneys.length} Terpilih (.ZIP)`
                        : `Unduh Semua ID Card (${filteredJourneys.length}) (.ZIP)`}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowBatchPrint(true);
                        window.setTimeout(() => window.print(), 180);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-[#A3E635] text-[#0F1F17] hover:bg-[#c3df82] transition-colors whitespace-nowrap shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Cetak Semua
                    </button>
                  </div>
                </div>

                <input
                  ref={dayHPhotoInputRef}
                  type="file"
                  accept={
                    activeUploadTarget?.slot === 'cardFrontPhoto'
                      ? '.jpg,.jpeg,.png,image/jpeg,image/png'
                      : 'image/*'
                  }
                  onChange={(e) => void handleRowPhotoPicked(e)}
                  className="hidden"
                />

                <div className="overflow-x-auto border border-[#0F1F17]/12 rounded-xl bg-white">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#0F1F17]/12 bg-[#F6F8F6] text-xs font-mono uppercase text-[#0F1F17]/70">
                        <th className="py-3.5 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            aria-label="Pilih semua ID card"
                            checked={allFilteredSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCodes(
                                  filteredJourneys.map((j) => j.record.plantIdCode)
                                );
                              } else {
                                setSelectedCodes([]);
                              }
                            }}
                            className="rounded border-[#0F1F17]/30"
                          />
                        </th>
                        <th className="py-3.5 px-4">ID &amp; Foto</th>
                        <th className="py-3.5 px-4">Peserta &amp; Prodi</th>
                        <th className="py-3.5 px-4">Pohon</th>
                        <th className="py-3.5 px-4">Status Foto</th>
                        <th className="py-3.5 px-4">Unduh Cocard</th>
                        <th className="py-3.5 px-4 text-right">Kelola</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0F1F17]/10">
                      {filteredJourneys.map((item) => {
                        const code = item.record.plantIdCode;
                        const isEditing = editingRecordCode === code;
                        const isConfirmDelete = confirmDeleteCode === code;
                        const isChecked = selectedCodes.includes(code);
                        const isDayHComplete =
                          Boolean(item.record.participantPlantPhoto) &&
                          Boolean(item.record.plantPhoto);
                        const hasStandalonePhoto = Boolean(
                          item.record.cardFrontPhoto?.trim()
                        );

                        return (
                          <tr
                            key={item.record.id}
                            className={`hover:bg-[#F6F8F6]/60 ${
                              selectedJourneyCode === code ? 'bg-[#F6F8F6]' : ''
                            }`}
                          >
                            <td className="py-3.5 px-3 text-center">
                              <input
                                type="checkbox"
                                aria-label={`Pilih ${code}`}
                                checked={isChecked}
                                onChange={() => toggleRowSelection(code)}
                                className="rounded border-[#0F1F17]/30"
                              />
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-12 rounded-md overflow-hidden border border-zinc-200 bg-[#F6F8F6] shrink-0 flex items-center justify-center">
                                  {hasStandalonePhoto ? (
                                    <ResilientImage
                                      src={item.record.cardFrontPhoto!}
                                      alt={item.participant.fullName}
                                      fallbackTitle={item.participant.fullName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Camera className="w-4 h-4 text-[#4E6156]/55" />
                                  )}
                                </div>
                                <span className="font-mono font-semibold text-[#166534] tabular-nums">
                                  {code}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              {isEditing ? (
                                <div className="space-y-1.5 min-w-[180px]">
                                  <input
                                    type="text"
                                    value={editNameDraft}
                                    onChange={(e) =>
                                      setEditNameDraft(e.target.value)
                                    }
                                    placeholder="Nama Lengkap"
                                    className="w-full px-2.5 py-1 text-xs border border-[#0F1F17]/25 rounded"
                                  />
                                  <input
                                    type="text"
                                    value={editProdiDraft}
                                    onChange={(e) =>
                                      setEditProdiDraft(e.target.value)
                                    }
                                    placeholder="Program Studi (Prodi)"
                                    className="w-full px-2.5 py-1 text-xs border border-[#0F1F17]/25 rounded"
                                  />
                                  <input
                                    type="text"
                                    value={editLocationDraft}
                                    onChange={(e) =>
                                      setEditLocationDraft(e.target.value)
                                    }
                                    placeholder="Lokasi"
                                    className="w-full px-2.5 py-1 text-xs border border-[#0F1F17]/25 rounded"
                                  />
                                </div>
                              ) : (
                                <>
                                  <p className="font-medium text-[#0F1F17]">
                                    {item.participant.fullName}
                                  </p>
                                  <p className="text-xs font-medium text-[#166534]">
                                    {item.participant.studyProgram ||
                                      'Prodi belum diisi'}
                                  </p>
                                  <p className="text-[11px] text-[#0F1F17]/55">
                                    {item.record.location}
                                  </p>
                                </>
                              )}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {isEditing ? (
                                <select
                                  value={editPlantIdDraft}
                                  onChange={(e) =>
                                    setEditPlantIdDraft(e.target.value)
                                  }
                                  className="px-2 py-1 text-xs border border-[#0F1F17]/25 rounded bg-white"
                                >
                                  {plants.map((pl) => (
                                    <option key={pl.id} value={pl.id}>
                                      {pl.plantName}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                item.plant.plantName
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1 text-xs">
                                <span
                                  className={
                                    item.record.cardFrontPhoto
                                      ? 'text-[#166534] font-medium'
                                      : 'text-[#765A3A] font-medium'
                                  }
                                >
                                  Foto Mandiri:{' '}
                                  {item.record.cardFrontPhoto
                                    ? 'Ada (JPG/PNG)'
                                    : 'Kosong'}
                                </span>
                                <span
                                  className={
                                    isDayHComplete
                                      ? 'text-[#166534] font-medium'
                                      : 'text-[#765A3A] font-medium'
                                  }
                                >
                                  Hari H:{' '}
                                  {isDayHComplete ? 'Lengkap' : 'Kosong'}
                                </span>
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      triggerRowPhotoUpload(code, 'cardFrontPhoto')
                                    }
                                    className="px-2 py-0.5 text-[11px] rounded border border-[#0F1F17]/20 hover:bg-[#F6F8F6]"
                                  >
                                    + Foto Mandiri
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      triggerRowPhotoUpload(
                                        code,
                                        'participantPlantPhoto'
                                      )
                                    }
                                    className="px-2 py-0.5 text-[11px] rounded border border-[#0F1F17]/20 hover:bg-[#F6F8F6]"
                                  >
                                    + Hari H
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="inline-flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={rowDownloadingKey !== null}
                                  onClick={() =>
                                    void handleRowCardDownload(code, 'front')
                                  }
                                  title="Unduh sisi depan Cocard (PNG)"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-[#14532D] text-white hover:bg-[#166534] disabled:opacity-60"
                                >
                                  {rowDownloadingKey === `${code}:front` ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Download className="w-3 h-3" />
                                  )}
                                  Depan
                                </button>
                                <button
                                  type="button"
                                  disabled={rowDownloadingKey !== null}
                                  onClick={() =>
                                    void handleRowCardDownload(code, 'back')
                                  }
                                  title="Unduh sisi belakang QR Cocard (PNG)"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded border border-[#14532D] text-[#14532D] bg-white hover:bg-[#F6F8F6] disabled:opacity-60"
                                >
                                  {rowDownloadingKey === `${code}:back` ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Download className="w-3 h-3" />
                                  )}
                                  Belakang
                                </button>
                                <button
                                  type="button"
                                  disabled={rowDownloadingKey !== null}
                                  onClick={() =>
                                    void handleRowCardDownload(code, 'zip')
                                  }
                                  title="Unduh Depan + Belakang sekaligus (.ZIP)"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-[#A3E635] text-[#0F1F17] hover:bg-[#bef264] disabled:opacity-60"
                                >
                                  {rowDownloadingKey === `${code}:zip` ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <FileArchive className="w-3 h-3" />
                                  )}
                                  ZIP
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              {isEditing ? (
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void handleSaveRecordEdit(code)}
                                    className="px-2.5 py-1 text-xs font-semibold rounded bg-[#0F1F17] text-[#FFFFFF]"
                                  >
                                    Simpan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingRecordCode(null)}
                                    className="px-2.5 py-1 text-xs rounded border border-[#0F1F17]/20"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : isConfirmDelete ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleConfirmDeleteRecord(code)
                                    }
                                    className="px-2.5 py-1 text-xs font-semibold rounded bg-[#991b1b] text-white"
                                  >
                                    Ya, Hapus
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteCode(null)}
                                    className="px-2 py-1 text-xs rounded border border-[#0F1F17]/20"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleFocusCardPrint(code)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-[#0F1F17]/20 hover:bg-[#F6F8F6]"
                                  >
                                    Lihat
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => startEditRecord(code)}
                                    aria-label={`Edit ${code}`}
                                    className="p-1.5 rounded border border-[#0F1F17]/15 hover:bg-[#F6F8F6]"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteCode(code)}
                                    aria-label={`Hapus ${code}`}
                                    className="p-1.5 rounded border border-[#991b1b]/25 text-[#991b1b] hover:bg-[#fee2e2]"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  <Link
                                    to={`/plant/${code}`}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#166534] hover:underline ml-1"
                                  >
                                    Profil
                                    <ArrowUpRight className="w-3 h-3" />
                                  </Link>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Single Card Preview & Print */}
              {activeJourney && !showBatchPrint && (
                <section
                  ref={cardPreviewSectionRef}
                  className="bg-white border border-[#0F1F17]/12 rounded-xl p-6 sm:p-8 space-y-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 no-print">
                    <div className="space-y-1">
                      <p className="text-xs font-mono uppercase tracking-wider text-[#4E6156]">
                        Pratinjau &amp; Cetak Kartu Per Nama
                      </p>
                      <h3 className="font-editorial text-2xl font-medium">
                        {activeJourney.participant.fullName} (
                        {activeJourney.record.plantIdCode})
                      </h3>
                      <p className="text-xs text-[#0F1F17]/65">
                        Tujuan QR langsung ke halaman peserta:{' '}
                        <span className="font-mono text-[#166534] break-all">
                          {getPlantDirectUrl(activeJourney.record.plantIdCode)}
                        </span>
                      </p>
                    </div>
                    <QRDisplay
                      plantIdCode={activeJourney.record.plantIdCode}
                      size={80}
                      showDownload
                      showDirectLink
                    />
                  </div>
                  <PlantCard
                    key={activeJourney.record.id}
                    journey={activeJourney}
                    allowTemplateSwitch
                    showPrintButton
                    defaultShowBothSides
                  />
                </section>
              )}

              {/* Batch Print Sheet */}
              {showBatchPrint && (
                <section className="space-y-8">
                  <div className="flex flex-wrap items-center justify-between gap-4 no-print bg-[#F6F8F6] p-4 rounded-xl border border-[#0F1F17]/12">
                    <div>
                      <h3 className="font-editorial text-xl font-medium">
                        Mode Cetak Massal ({filteredJourneys.length} Kartu
                        Portrait)
                      </h3>
                      <p className="text-xs text-[#0F1F17]/70">
                        Siap dicetak (Depan &amp; QR Belakang per peserta).
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-[#0F1F17] text-[#FFFFFF]"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Cetak Sekarang
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBatchPrint(false)}
                        className="px-3.5 py-2 text-xs rounded-md border border-[#0F1F17]/20 bg-white"
                      >
                        Tutup Mode Cetak
                      </button>
                    </div>
                  </div>

                  <div className="space-y-12">
                    {filteredJourneys.map((item) => (
                      <div
                        key={item.record.id}
                        className="p-6 border border-[#0F1F17]/15 rounded-xl bg-white break-inside-avoid"
                      >
                        <p className="text-xs font-mono text-[#4E6156] mb-4 no-print">
                          {item.record.plantIdCode} — {item.participant.fullName}
                        </p>
                        <PlantCard
                          journey={item}
                          defaultShowBothSides
                          showPrintButton={false}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* TAB 2: GREEN ACTION / EVENTS MANAGEMENT */}
          {activeTab === 'green-action' && (
            <div className="space-y-10 no-print">
              <section className="bg-[#F6F8F6] border border-[#0F1F17]/12 rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="font-editorial text-2xl sm:text-3xl font-medium">
                      {editingEventId
                        ? 'Edit Kegiatan Aksi Hijau'
                        : 'Tambah Kegiatan Aksi Hijau Baru'}
                    </h2>
                    <p className="text-sm text-[#0F1F17]/75">
                      Kelola daftar aksi penanaman pohon yang tampil di Beranda
                      dan halaman Kegiatan.
                    </p>
                  </div>
                  {editingEventId && (
                    <button
                      type="button"
                      onClick={resetEventForm}
                      className="px-3.5 py-1.5 text-xs font-medium rounded-md border border-[#0F1F17]/20 bg-white"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                {evtNotice && (
                  <p className="p-3.5 text-xs font-medium bg-[#e8f5e9] border border-[#81c784] text-[#0F1F17] rounded-md">
                    {evtNotice}
                  </p>
                )}
                {evtError && (
                  <p
                    role="alert"
                    className="p-3.5 text-xs font-medium bg-[#fee2e2] border border-[#fca5a5] text-[#7f1d1d] rounded-md"
                  >
                    {evtError}
                  </p>
                )}

                <form
                  onSubmit={(e) => void handleEventSubmit(e)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label
                      htmlFor="evt-name"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                    >
                      Nama Kegiatan
                    </label>
                    <input
                      id="evt-name"
                      type="text"
                      value={evtName}
                      onChange={(e) => setEvtName(e.target.value)}
                      placeholder="Contoh: Green Campus Unja Planting"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="evt-date"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                    >
                      Tanggal Kegiatan
                    </label>
                    <input
                      id="evt-date"
                      type="text"
                      value={evtDate}
                      onChange={(e) => setEvtDate(e.target.value)}
                      placeholder="Contoh: 20 Januari 2027"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="evt-loc"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                    >
                      Lokasi
                    </label>
                    <input
                      id="evt-loc"
                      type="text"
                      value={evtLocation}
                      onChange={(e) => setEvtLocation(e.target.value)}
                      placeholder="Contoh: Kampus Mendalo, Jambi"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label
                        htmlFor="evt-status"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                      >
                        Status
                      </label>
                      <select
                        id="evt-status"
                        value={evtStatus}
                        onChange={(e) =>
                          setEvtStatus(e.target.value as EventStatus)
                        }
                        className="w-full px-2.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                      >
                        <option value="Upcoming">Akan Datang</option>
                        <option value="Completed">Selesai</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="evt-trees"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                      >
                        Target Pohon
                      </label>
                      <input
                        id="evt-trees"
                        type="number"
                        value={evtTrees}
                        onChange={(e) => setEvtTrees(e.target.value)}
                        className="w-full px-2.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="evt-vol"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                      >
                        Relawan
                      </label>
                      <input
                        id="evt-vol"
                        type="number"
                        value={evtVolunteers}
                        onChange={(e) => setEvtVolunteers(e.target.value)}
                        className="w-full px-2.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="evt-desc"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                    >
                      Deskripsi Kegiatan
                    </label>
                    <textarea
                      id="evt-desc"
                      rows={3}
                      value={evtDescription}
                      onChange={(e) => setEvtDescription(e.target.value)}
                      placeholder="Tuliskan ringkasan agenda dan tujuan penanaman..."
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <input
                        ref={evtCoverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => void handleEvtCoverPick(e)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => evtCoverInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md border border-[#0F1F17]/20 bg-white hover:bg-[#FFFFFF]"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {evtCoverImage ? 'Foto Cover Dipilih' : 'Pilih Foto Cover'}
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-xs font-semibold rounded-md bg-[#0F1F17] text-[#FFFFFF] hover:bg-[#166534]"
                    >
                      {editingEventId ? 'Simpan Perubahan' : 'Terbitkan Green Action'}
                    </button>
                  </div>
                </form>
              </section>

              <section className="space-y-4">
                <h3 className="font-editorial text-2xl font-medium">
                  Daftar Kegiatan ({events.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.map((evt) => (
                    <div
                      key={evt.id}
                      className="border border-[#0F1F17]/12 bg-white rounded-xl overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-[16/9] bg-[#F6F8F6]">
                          <ResilientImage
                            src={evt.coverImage}
                            alt={evt.eventName}
                            fallbackTitle={evt.eventName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-5 space-y-2">
                          <p className="text-xs font-mono text-[#4E6156]">
                            {evt.status === 'Completed' ? 'Selesai' : 'Akan Datang'} · {evt.eventDate}
                          </p>
                          <h4 className="font-editorial text-xl font-medium">
                            {evt.eventName}
                          </h4>
                          <p className="text-xs text-[#0F1F17]/70">
                            {evt.eventLocation}
                          </p>
                          <p className="text-sm text-[#0F1F17]/80">
                            {evt.description}
                          </p>
                        </div>
                      </div>
                      <div className="px-5 py-3.5 border-t border-[#0F1F17]/10 flex items-center justify-between text-xs">
                        <span className="font-mono text-[#0F1F17]/60 tabular-nums">
                          {evt.treesPlantedTarget} pohon · {evt.volunteerCount}{' '}
                          relawan
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditEvent(evt.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#0F1F17]/20 hover:bg-[#F6F8F6]"
                          >
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>
                          {events.length > 1 && (
                            <button
                              type="button"
                              onClick={() => void deleteEventInFirestore(evt.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#991b1b]/30 text-[#991b1b] hover:bg-[#fee2e2]"
                            >
                              <Trash2 className="w-3 h-3" />
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
          )}

          {/* TAB 3: PLANT CATALOG */}
          {activeTab === 'plants' && (
            <div className="space-y-8 no-print">
              <section className="bg-[#F6F8F6] border border-[#0F1F17]/12 rounded-xl p-6 sm:p-8 space-y-6">
                <h2 className="font-editorial text-2xl sm:text-3xl font-medium">
                  Tambah Spesies Pohon Baru
                </h2>

                {spNotice && (
                  <p className="p-3.5 text-xs font-medium bg-[#e8f5e9] border border-[#81c784] text-[#0F1F17] rounded-md">
                    {spNotice}
                  </p>
                )}
                {spError && (
                  <p
                    role="alert"
                    className="p-3.5 text-xs font-medium bg-[#fee2e2] border border-[#fca5a5] text-[#7f1d1d] rounded-md"
                  >
                    {spError}
                  </p>
                )}

                <form
                  onSubmit={(e) => void handleSpeciesSubmit(e)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label
                      htmlFor="sp-name"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                    >
                      Nama Pohon
                    </label>
                    <input
                      id="sp-name"
                      type="text"
                      value={spName}
                      onChange={(e) => setSpName(e.target.value)}
                      placeholder="Contoh: Trembesi"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="sp-sci"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                    >
                      Nama Ilmiah
                    </label>
                    <input
                      id="sp-sci"
                      type="text"
                      value={spScientific}
                      onChange={(e) => setSpScientific(e.target.value)}
                      placeholder="Contoh: Samanea saman"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="sp-cat"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                    >
                      Kategori
                    </label>
                    <input
                      id="sp-cat"
                      type="text"
                      value={spCategory}
                      onChange={(e) => setSpCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="sp-hab"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                    >
                      Habitat Utama
                    </label>
                    <input
                      id="sp-hab"
                      type="text"
                      value={spHabitat}
                      onChange={(e) => setSpHabitat(e.target.value)}
                      placeholder="Dataran rendah & taman terbuka"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="sp-over"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#0F1F17]/70 mb-1.5"
                    >
                      Ringkasan Botani
                    </label>
                    <textarea
                      id="sp-over"
                      rows={3}
                      value={spOverview}
                      onChange={(e) => setSpOverview(e.target.value)}
                      placeholder="Jelaskan karakter dan peran ekologis pohon..."
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#0F1F17]/20 rounded-md"
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <input
                        ref={spImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => void handleSpeciesImgPick(e)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => spImageInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-md border border-[#0F1F17]/20 bg-white hover:bg-[#FFFFFF]"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {spImage ? 'Foto Spesies Dipilih' : 'Pilih Foto Pohon'}
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 text-xs font-semibold rounded-md bg-[#0F1F17] text-[#FFFFFF] hover:bg-[#166534]"
                    >
                      Tambah ke Katalog
                    </button>
                  </div>
                </form>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plants.map((pl) => (
                  <div
                    key={pl.id}
                    className="border border-[#0F1F17]/12 bg-white rounded-xl p-5 flex gap-4 items-start"
                  >
                    <div className="w-24 h-28 rounded-lg overflow-hidden shrink-0 bg-[#F6F8F6]">
                      <ResilientImage
                        src={pl.mainImage}
                        alt={pl.plantName}
                        fallbackTitle={pl.plantName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-mono text-[#4E6156]">
                        {pl.plantCode}
                      </p>
                      <h3 className="font-editorial text-xl font-medium">
                        {pl.plantName}
                      </h3>
                      <p className="text-xs italic text-[#0F1F17]/65">
                        {pl.scientificName}
                      </p>
                      <p className="text-xs text-[#0F1F17]/75 line-clamp-3 pt-1">
                        {pl.overview}
                      </p>
                    </div>
                  </div>
                ))}
              </section>
            </div>
          )}

          {/* TAB 4: GOOGLE FORM REAL-TIME WEBHOOK GUIDE */}
          {activeTab === 'gform-sync' && (
            <div className="space-y-8 no-print">
              <section className="bg-[#F6F8F6] border border-[#0F1F17]/12 rounded-xl p-6 sm:p-8 space-y-5">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#4E6156]">
                  Alur Otomatis Google Form → Kartu QR &amp; Halaman Kosong Hari H
                </p>
                <h2 className="font-editorial text-2xl sm:text-3xl font-medium">
                  Pendaftar Masuk Seketika Saat Submit Google Form
                </h2>
                <p className="text-sm text-[#0F1F17]/80 leading-relaxed max-w-3xl">
                  Anda punya dua cara tanpa perlu salin-tempel manual:
                  <br />
                  <strong>1. Via Link Google Sheet</strong> (di tab Peserta →
                  Otomatis Google Form) — cukup tempel link Google Sheet 1 kali.
                  <br />
                  <strong>2. Via Webhook Apps Script</strong> di bawah ini —
                  langsung mengirim jawaban &amp; foto Google Drive seketika
                  begitu peserta menekan tombol <em>Kirim / Submit</em> di
                  Google Form, meskipun Google Sheet tetap privat!
                </p>

                <ol className="space-y-3 text-sm text-[#0F1F17]/85 list-decimal list-inside pt-2">
                  <li>
                    Pastikan di Google Form ada pertanyaan{' '}
                    <strong>Nama Lengkap</strong>,{' '}
                    <strong>Program Studi / Prodi</strong>,{' '}
                    <strong>Jenis Pohon</strong>, dan{' '}
                    <strong>Foto Mandiri (file JPG / PNG langsung, bukan Twibbon)</strong>.
                    Sistem otomatis mengabaikan kolom Twibbon dan hanya memasukkan
                    foto mandiri ke kotak kosong pada Cocard. Pastikan folder upload
                    Google Drive disetel <em>Viewer (Anyone with link)</em>.
                  </li>
                  <li>
                    Buka <strong>Google Sheets</strong> hasil form → klik menu{' '}
                    <strong>Extensions → Apps Script</strong>, lalu tempel
                    skrip siap pakai di bawah ini (sudah terisi Webhook URL &amp;
                    Secret aktif aplikasi Anda).
                  </li>
                  <li>
                    Tambahkan <strong>Trigger → Event: From spreadsheet → On form submit</strong>.
                    Setiap volunteer mendaftar, ID &amp; Kartu Portrait + foto
                    depan otomatis terbit, sementara{' '}
                    <strong>slot foto Hari H tetap kosong</strong> agar peserta
                    tidak bingung.
                  </li>
                </ol>

                <div className="space-y-2 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#4E6156]">
                      Google Apps Script Siap Pakai (Live Webhook)
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleCopyScript()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-[#0F1F17] text-[#FFFFFF] hover:bg-[#166534]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedScript ? 'Tersalin!' : 'Salin Skrip'}
                    </button>
                  </div>
                  <pre className="p-4 rounded-lg bg-[#0F1F17] text-[#FFFFFF] text-xs font-mono overflow-x-auto leading-relaxed">
                    {appsScriptSnippet}
                  </pre>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
