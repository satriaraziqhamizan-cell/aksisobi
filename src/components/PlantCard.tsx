import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Camera,
  Download,
  FileArchive,
  Loader2,
  Printer,
  RotateCw,
} from 'lucide-react';
import type { CardTemplateId, EnrichedPlantJourney } from '../types/plantJourney';
import { MEDIA_ASSETS } from '../data/seedData';
import { ResilientImage } from './ResilientImage';
import { getPlantDirectUrl } from '../utils/qrLinks';
import {
  downloadParticipantCocardZip,
  downloadSingleCocardSide,
} from '../utils/cocardExporter';

interface PlantCardProps {
  journey: EnrichedPlantJourney;
  templateId?: CardTemplateId;
  allowTemplateSwitch?: boolean;
  showPrintButton?: boolean;
  defaultShowBothSides?: boolean;
}

export function PlantCard({
  journey,
  showPrintButton = false,
  defaultShowBothSides = false,
}: PlantCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState<'flip' | 'both'>(
    defaultShowBothSides ? 'both' : 'flip'
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [downloadingAction, setDownloadingAction] = useState<
    null | 'front' | 'back' | 'zip'
  >(null);
  const [downloadError, setDownloadError] = useState('');

  const targetUrl = getPlantDirectUrl(journey.record.plantIdCode);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(targetUrl, {
      width: 600,
      margin: 0,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0F1F17',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [targetUrl]);

  const standalonePhoto = journey.record.cardFrontPhoto?.trim() || '';
  const displayName = journey.participant.fullName.trim().toUpperCase();
  const displayProdi = (
    journey.participant.studyProgram?.trim() || 'RELAWAN SOBAT BUMI'
  ).toUpperCase();

  const handleDownload = async (action: 'front' | 'back' | 'zip') => {
    setDownloadError('');
    setDownloadingAction(action);
    try {
      if (action === 'zip') {
        await downloadParticipantCocardZip(journey);
      } else {
        await downloadSingleCocardSide(journey, action);
      }
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : 'Gagal mengunduh file kartu.'
      );
    } finally {
      setDownloadingAction(null);
    }
  };

  const FrontCardFace = (
    <div className="@container relative w-full aspect-[1122/1594] rounded-xl overflow-hidden shadow-md border border-zinc-200 bg-[#14532D] select-none">
      {/* Desain asli template depan (tanpa diubah) */}
      <img
        src={MEDIA_ASSETS.cardFrontTemplate}
        alt="Desain Cocard Depan Aksi Sobat Bumi 2026"
        className="w-full h-full object-cover block"
      />

      {/* Tempel HANYA foto mandiri JPG/PNG ke dalam bingkai putih yang kosong */}
      <div
        style={{
          left: '23.173%',
          top: '35.571%',
          width: '53.565%',
          height: '44.479%',
          borderRadius: '10% / 8.5%',
        }}
        className="absolute overflow-hidden bg-[#F6F8F6] flex items-center justify-center"
      >
        {standalonePhoto ? (
          <ResilientImage
            src={standalonePhoto}
            alt={`${journey.participant.fullName} — Foto Mandiri`}
            fallbackTitle={journey.participant.fullName}
            className="w-full h-full object-cover object-[center_25%] bg-white"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center px-3 text-[#4E6156] gap-1.5">
            <Camera className="w-6 h-6 opacity-50" />
            <span className="text-[2.8cqw] font-medium leading-tight">
              Foto Mandiri (JPG / PNG)
            </span>
          </div>
        )}
      </div>

      {/* Tempel Nama & Program Studi menutupi kotak placeholder pada desain asli */}
      <div
        style={{
          left: '16.488%',
          top: '70.514%',
          width: '44.742%',
          height: '6.524%',
        }}
        className="absolute flex flex-col border-[1.5px] sm:border-[2px] border-white shadow-sm overflow-hidden"
      >
        <div className="h-[57.7%] w-full bg-gradient-to-b from-[#447E46] to-[#3A7435] border-b-[1.5px] border-white flex items-center justify-center px-1.5">
          <span className="text-white font-bold uppercase tracking-wide truncate text-center leading-none text-[3.8cqw]">
            {displayName}
          </span>
        </div>
        <div className="h-[42.3%] w-full bg-[#CDDAA7] flex items-center justify-center px-1.5">
          <span className="text-[#1F3A1E] font-semibold uppercase tracking-wider truncate text-center leading-none text-[2.55cqw]">
            {displayProdi}
          </span>
        </div>
      </div>
    </div>
  );

  const BackCardFace = (
    <div className="@container relative w-full aspect-[1122/1594] rounded-xl overflow-hidden shadow-md border border-zinc-200 bg-[#14532D] select-none">
      {/* Desain asli template belakang (tanpa diubah) */}
      <img
        src={MEDIA_ASSETS.cardBackTemplate}
        alt="Desain Cocard Belakang Aksi Sobat Bumi 2026"
        className="w-full h-full object-cover block"
      />

      {/* QR Code + ID Pohon diperbesar memenuhi kotak putih tengah */}
      <div
        style={{
          left: '12.923%',
          top: '32.12%',
          width: '74.153%',
          height: '39.209%',
        }}
        className="absolute flex flex-col items-center justify-center px-2 py-[1.6%] text-center"
      >
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR Code ${journey.record.plantIdCode}`}
            className="h-[86%] aspect-square object-contain"
          />
        ) : (
          <div className="h-[86%] aspect-square bg-zinc-100 animate-pulse rounded" />
        )}
        <p className="font-mono font-extrabold text-[#14532D] leading-none mt-[1.8%] text-[5.2cqw] tracking-wide tabular-nums">
          {journey.record.plantIdCode}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Bar Kontrol & Unduh Kartu */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 no-print">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={downloadingAction !== null}
            onClick={() => void handleDownload('front')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
          >
            {downloadingAction === 'front' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Unduh Depan (PNG)
          </button>

          <button
            type="button"
            disabled={downloadingAction !== null}
            onClick={() => void handleDownload('back')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#14532D] text-[#14532D] bg-white hover:bg-[#F6F8F6] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
          >
            {downloadingAction === 'back' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Unduh Belakang QR (PNG)
          </button>

          <button
            type="button"
            disabled={downloadingAction !== null}
            onClick={() => void handleDownload('zip')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#A3E635] text-[#0F1F17] hover:bg-[#bef264] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
          >
            {downloadingAction === 'zip' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileArchive className="w-3.5 h-3.5" />
            )}
            Unduh Lengkap (.ZIP)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === 'flip' ? 'both' : 'flip'))}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 bg-white text-[#0F1F17] hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
          >
            {viewMode === 'flip' ? 'Tampilkan Depan & Belakang' : 'Mode Balik Kartu'}
          </button>

          {viewMode === 'flip' && (
            <button
              type="button"
              onClick={() => setIsFlipped((f) => !f)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#0F1F17] text-white hover:bg-[#14532D] transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCw className="w-3.5 h-3.5" />
              {isFlipped ? 'Lihat Sisi Depan' : 'Balik Kartu (QR)'}
            </button>
          )}

          {showPrintButton && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 bg-white text-[#0F1F17] hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak (9.5 × 13.5 cm)
            </button>
          )}
        </div>
      </div>

      {downloadError && (
        <p role="alert" className="text-xs font-medium text-red-700 no-print">
          {downloadError}
        </p>
      )}

      {/* Tampilan Kartu Cocard */}
      {viewMode === 'both' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-[700px] mx-auto print-only-card">
          <div className="space-y-2 max-w-[320px] w-full mx-auto">
            <p className="text-xs font-medium text-[#4E6156] text-center">
              Sisi Depan · 9.5 × 13.5 cm
            </p>
            {FrontCardFace}
          </div>
          <div className="space-y-2 max-w-[320px] w-full mx-auto">
            <p className="text-xs font-medium text-[#4E6156] text-center">
              Sisi Belakang · QR Code
            </p>
            {BackCardFace}
          </div>
        </div>
      ) : (
        <div className="max-w-[320px] mx-auto perspective-1000">
          <div
            role="button"
            tabIndex={0}
            aria-label="Klik untuk membalik kartu cocard"
            onClick={() => setIsFlipped((f) => !f)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsFlipped((f) => !f);
              }
            }}
            className={`relative w-full aspect-[1122/1594] transition-transform duration-500 transform-style-3d cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#166534] rounded-xl ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            <div className="absolute inset-0 backface-hidden">{FrontCardFace}</div>
            <div className="absolute inset-0 backface-hidden rotate-y-180">
              {BackCardFace}
            </div>
          </div>
          <p className="text-center text-xs text-[#4E6156] mt-3 no-print">
            Klik kartu Cocard untuk membalik antara sisi depan dan QR Code belakang.
          </p>
        </div>
      )}
    </div>
  );
}
