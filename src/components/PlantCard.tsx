import { useState } from 'react';
import { RotateCw, Printer } from 'lucide-react';
import type { CardTemplateId, EnrichedPlantJourney } from '../types/plantJourney';
import { QRDisplay } from './QRDisplay';
import { ResilientImage } from './ResilientImage';

interface PlantCardProps {
  journey: EnrichedPlantJourney;
  templateId?: CardTemplateId;
  allowTemplateSwitch?: boolean;
  showPrintButton?: boolean;
  defaultShowBothSides?: boolean;
}

const TEMPLATE_STYLES: Record<
  CardTemplateId,
  {
    frontBg: string;
    frontText: string;
    frontMuted: string;
    frontAccent: string;
    frontBorder: string;
    backBg: string;
    backText: string;
    backMuted: string;
    backBorder: string;
  }
> = {
  forest: {
    frontBg: 'bg-[#14271B]',
    frontText: 'text-[#FAF9F4]',
    frontMuted: 'text-[#FAF9F4]/70',
    frontAccent: 'text-[#B4D36C]',
    frontBorder: 'border-[#284B34]',
    backBg: 'bg-[#1b3424]',
    backText: 'text-[#FAF9F4]',
    backMuted: 'text-[#FAF9F4]/70',
    backBorder: 'border-[#B4D36C]/30',
  },
  botanical: {
    frontBg: 'bg-[#F4F0E4]',
    frontText: 'text-[#14271B]',
    frontMuted: 'text-[#14271B]/65',
    frontAccent: 'text-[#284B34]',
    frontBorder: 'border-[#647C45]/35',
    backBg: 'bg-[#FAF9F4]',
    backText: 'text-[#14271B]',
    backMuted: 'text-[#14271B]/65',
    backBorder: 'border-[#647C45]/35',
  },
  earth: {
    frontBg: 'bg-[#765A3A]',
    frontText: 'text-[#FAF9F4]',
    frontMuted: 'text-[#FAF9F4]/75',
    frontAccent: 'text-[#F4F0E4]',
    frontBorder: 'border-[#FAF9F4]/25',
    backBg: 'bg-[#5c452b]',
    backText: 'text-[#FAF9F4]',
    backMuted: 'text-[#FAF9F4]/75',
    backBorder: 'border-[#FAF9F4]/25',
  },
};

export function PlantCard({
  journey,
  templateId: initialTemplateId,
  allowTemplateSwitch = false,
  showPrintButton = false,
  defaultShowBothSides = false,
}: PlantCardProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplateId>(
    initialTemplateId || journey.record.templateId || 'forest'
  );
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState<'flip' | 'both'>(
    defaultShowBothSides ? 'both' : 'flip'
  );
  const [useRegistrationPhoto, setUseRegistrationPhoto] = useState<boolean>(
    Boolean(journey.record.cardFrontPhoto)
  );

  const theme = TEMPLATE_STYLES[selectedTemplate];
  const year = journey.record.plantingDate.split(' ').pop() || '2026';

  const frontVisual =
    useRegistrationPhoto && journey.record.cardFrontPhoto
      ? journey.record.cardFrontPhoto
      : journey.plant.mainImage;

  const frontVisualAlt =
    useRegistrationPhoto && journey.record.cardFrontPhoto
      ? `${journey.participant.fullName} — Foto Kartu Depan`
      : journey.plant.plantName;

  const FrontCardFace = (
    <div
      className={`w-full aspect-[54/85.6] rounded-xl border ${theme.frontBg} ${theme.frontText} ${theme.frontBorder} p-5 flex flex-col justify-between overflow-hidden relative shadow-sm`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-2 border-b border-current/12">
        <div className="min-w-0">
          <p className={`text-[10px] font-mono uppercase tracking-[0.2em] ${theme.frontAccent}`}>
            Aksi Sobat Bumi
          </p>
          <p className={`text-[10px] truncate mt-0.5 ${theme.frontMuted}`}>
            My Plant Card
          </p>
        </div>
        <span className={`font-mono text-[11px] tabular-nums shrink-0 ${theme.frontAccent}`}>
          {year}
        </span>
      </div>

      {/* Portrait Visual */}
      <div className="my-3 flex-1 min-h-0 rounded-lg overflow-hidden border border-current/15 bg-[#284B34]/20">
        <ResilientImage
          src={frontVisual}
          alt={frontVisualAlt}
          fallbackTitle={journey.plant.plantName}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Plant & Participant Info */}
      <div className="space-y-2">
        <div>
          <h3 className="font-editorial text-2xl font-semibold leading-tight truncate">
            {journey.plant.plantName}
          </h3>
          <p className={`text-[11px] italic truncate ${theme.frontMuted}`}>
            {journey.plant.scientificName}
          </p>
        </div>

        <div className="pt-2 border-t border-current/15 flex items-baseline justify-between gap-2 text-[11px]">
          <span className="truncate font-medium">{journey.participant.fullName}</span>
          <span className={`font-mono tracking-wider tabular-nums font-semibold shrink-0 ${theme.frontAccent}`}>
            {journey.record.plantIdCode}
          </span>
        </div>
      </div>
    </div>
  );

  const BackCardFace = (
    <div
      className={`w-full aspect-[54/85.6] rounded-xl border ${theme.backBg} ${theme.backText} ${theme.backBorder} p-5 flex flex-col justify-between items-center text-center overflow-hidden shadow-sm`}
    >
      <div className="w-full pb-2 border-b border-current/12 space-y-0.5">
        <p className={`text-[10px] font-mono uppercase tracking-[0.2em] ${theme.backMuted}`}>
          Aksi Sobat Bumi
        </p>
        <p className="font-editorial text-xl font-semibold truncate">
          {journey.plant.plantName}
        </p>
      </div>

      <div className="my-auto py-2 flex flex-col items-center gap-2.5">
        <QRDisplay
          plantIdCode={journey.record.plantIdCode}
          size={132}
          darkColor="#14271B"
          lightColor="#FFFFFF"
        />
        <p className={`text-[10px] font-mono uppercase tracking-[0.16em] ${theme.backMuted}`}>
          Scan to discover my plant
        </p>
      </div>

      <dl className="w-full space-y-1.5 text-[11px] pt-3 border-t border-current/15 text-left">
        <div className="flex items-baseline justify-between gap-2">
          <dt className={theme.backMuted}>Plant ID</dt>
          <dd className="font-mono font-semibold tabular-nums">
            {journey.record.plantIdCode}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className={theme.backMuted}>Penanam</dt>
          <dd className="truncate font-medium">{journey.participant.fullName}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className={theme.backMuted}>Tanggal</dt>
          <dd className="tabular-nums truncate">{journey.record.plantingDate}</dd>
        </div>
      </dl>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2">
          {allowTemplateSwitch && (
            <div
              role="group"
              aria-label="Pilih template kartu"
              className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#F4F0E4] border border-[#14271B]/10"
            >
              {(['forest', 'botanical', 'earth'] as CardTemplateId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedTemplate(id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize whitespace-nowrap shrink-0 ${
                    selectedTemplate === id
                      ? 'bg-[#14271B] text-[#FAF9F4]'
                      : 'text-[#14271B]/70 hover:text-[#14271B]'
                  }`}
                >
                  {id === 'forest'
                    ? 'Forest'
                    : id === 'botanical'
                    ? 'Botanical'
                    : 'Earth'}
                </button>
              ))}
            </div>
          )}

          {journey.record.cardFrontPhoto && (
            <button
              type="button"
              onClick={() => setUseRegistrationPhoto((v) => !v)}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#14271B]/15 bg-[#FAF9F4] text-[#14271B] hover:bg-[#F4F0E4] transition-colors whitespace-nowrap shrink-0"
            >
              {useRegistrationPhoto
                ? 'Tampilkan Foto Pohon di Kartu'
                : 'Tampilkan Foto Peserta (Form)'}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === 'flip' ? 'both' : 'flip'))}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#14271B]/15 bg-[#FAF9F4] text-[#14271B] hover:bg-[#F4F0E4] transition-colors whitespace-nowrap shrink-0"
          >
            {viewMode === 'flip' ? 'Tampilkan Depan & Belakang' : 'Mode Flip Kartu'}
          </button>

          {viewMode === 'flip' && (
            <button
              type="button"
              onClick={() => setIsFlipped((f) => !f)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[#284B34] text-[#FAF9F4] hover:bg-[#14271B] transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCw className="w-3.5 h-3.5" />
              {isFlipped ? 'Lihat Sisi Depan' : 'Balik Kartu (QR)'}
            </button>
          )}

          {showPrintButton && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[#B4D36C] text-[#14271B] hover:bg-[#c3df82] transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Portrait (54 × 85.6 mm)
            </button>
          )}
        </div>
      </div>

      {/* Card Canvas */}
      {viewMode === 'both' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-[680px] mx-auto print-only-card">
          <div className="space-y-2 max-w-[300px] w-full mx-auto">
            <p className="text-xs font-mono text-[#14271B]/60 uppercase tracking-widest text-center">
              Sisi Depan · 54 × 85.6 mm
            </p>
            {FrontCardFace}
          </div>
          <div className="space-y-2 max-w-[300px] w-full mx-auto">
            <p className="text-xs font-mono text-[#14271B]/60 uppercase tracking-widest text-center">
              Sisi Belakang · QR Code
            </p>
            {BackCardFace}
          </div>
        </div>
      ) : (
        <div className="max-w-[300px] mx-auto perspective-1000">
          <div
            role="button"
            tabIndex={0}
            aria-label="Klik untuk membalik kartu tanaman"
            onClick={() => setIsFlipped((f) => !f)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsFlipped((f) => !f);
              }
            }}
            className={`relative w-full aspect-[54/85.6] transition-transform duration-500 transform-style-3d cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#284B34] rounded-xl ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            <div className="absolute inset-0 backface-hidden">{FrontCardFace}</div>
            <div className="absolute inset-0 backface-hidden rotate-y-180">
              {BackCardFace}
            </div>
          </div>
          <p className="text-center text-xs text-[#14271B]/60 mt-3 no-print">
            Klik kartu portrait untuk membalik antara sisi depan dan QR Code belakang.
          </p>
        </div>
      )}
    </div>
  );
}
