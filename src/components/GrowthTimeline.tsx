import { Sprout } from 'lucide-react';
import type { GrowthUpdate } from '../types/plantJourney';
import { formatIndonesianDate } from '../services/plantJourneyService';
import { ResilientImage } from './ResilientImage';

interface GrowthTimelineProps {
  updates: GrowthUpdate[];
  plantName: string;
}

function localizeDayLabel(raw: string): string {
  const m = raw.trim().match(/^Day\s*0*(\d+)$/i);
  if (m) return `Hari ke-${m[1]}`;
  if (raw.trim().toLowerCase() === 'update') return 'Pembaruan';
  return raw;
}

function localizeGrowthTitle(raw: string): string {
  if (raw === 'The Beginning — Penanaman Perdana') {
    return 'Awal Tanam — Penanaman Perdana';
  }
  if (raw === 'First Growth — Tunas Daun Baru Muncul') {
    return 'Pertumbuhan Pertama — Tunas Daun Baru Muncul';
  }
  return raw;
}

export function GrowthTimeline({ updates, plantName }: GrowthTimelineProps) {
  if (updates.length === 0) {
    return (
      <div className="border border-zinc-200 bg-white rounded-2xl p-10 sm:p-14 text-center max-w-2xl mx-auto">
        <Sprout
          className="w-8 h-8 text-[#166534] mx-auto mb-4"
          strokeWidth={1.5}
        />
        <p className="text-xl sm:text-2xl font-semibold text-[#0F1F17] mb-2.5">
          Setiap pertumbuhan butuh waktu.
        </p>
        <p className="text-sm sm:text-base text-[#4E6156] leading-relaxed max-w-md mx-auto">
          Kisah pertumbuhan pohon ini baru saja dimulai. Dokumentasi
          perkembangan berkala akan ditambahkan seiring tumbuhnya pohon{' '}
          {plantName}.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {updates.map((item) => (
        <article
          key={item.id}
          className="border border-zinc-200 bg-white rounded-2xl overflow-hidden flex flex-col"
        >
          <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-100">
            <ResilientImage
              src={item.photo}
              alt={`${localizeGrowthTitle(item.title)} - ${plantName}`}
              fallbackTitle={localizeGrowthTitle(item.title)}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-[#166534] tabular-nums">
                <span>{localizeDayLabel(item.dayLabel)}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#4E6156]">
                  {formatIndonesianDate(item.updateDate)}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-[#0F1F17]">
                {localizeGrowthTitle(item.title)}
              </h3>
              <p className="text-sm sm:text-base text-[#4E6156] leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
