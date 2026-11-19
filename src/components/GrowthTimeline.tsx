import { Sprout } from 'lucide-react';
import type { GrowthUpdate } from '../types/plantJourney';
import { formatIndonesianDate } from '../services/plantJourneyService';
import { ResilientImage } from './ResilientImage';

interface GrowthTimelineProps {
  updates: GrowthUpdate[];
  plantName: string;
}

export function GrowthTimeline({ updates, plantName }: GrowthTimelineProps) {
  if (updates.length === 0) {
    return (
      <div className="border border-[#14271B]/12 bg-[#FAF9F4] rounded-xl p-10 sm:p-14 text-center max-w-2xl mx-auto">
        <Sprout
          className="w-8 h-8 text-[#647C45] mx-auto mb-4"
          strokeWidth={1.5}
        />
        <p className="font-editorial text-2xl sm:text-3xl text-[#14271B] mb-3">
          Every journey takes time.
        </p>
        <p className="text-base text-[#14271B]/70 leading-relaxed max-w-md mx-auto">
          This plant&apos;s growth story has just begun. Dokumentasi perkembangan
          berkala akan ditambahkan seiring pertumbuhan pohon {plantName}.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {updates.map((item) => (
        <article
          key={item.id}
          className="border border-[#14271B]/12 bg-[#FAF9F4] rounded-xl overflow-hidden flex flex-col"
        >
          <div className="aspect-[4/3] w-full overflow-hidden bg-[#F4F0E4]">
            <ResilientImage
              src={item.photo}
              alt={`${item.title} - ${plantName}`}
              fallbackTitle={item.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[#647C45] uppercase tracking-wider tabular-nums">
                <span>{item.dayLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{formatIndonesianDate(item.updateDate)}</span>
              </div>
              <h3 className="font-editorial text-2xl font-medium text-[#14271B]">
                {item.title}
              </h3>
              <p className="text-sm sm:text-base text-[#14271B]/75 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
