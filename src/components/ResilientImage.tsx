import { useEffect, useMemo, useState } from 'react';
import { Sprout } from 'lucide-react';
import { getPhotoFallbackCandidates } from '../utils/drivePhoto';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: ResilientImageProps) {
  const candidates = useMemo(() => getPhotoFallbackCandidates(src), [src]);
  const [attemptIndex, setAttemptIndex] = useState(0);

  useEffect(() => {
    setAttemptIndex(0);
  }, [src]);

  const activeSrc = candidates[attemptIndex] || '';

  if (!activeSrc) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#14532D] to-[#0F2419] text-white p-6 text-center ${className}`}
      >
        <Sprout className="w-8 h-8 text-[#A3E635] mb-2 opacity-90" strokeWidth={1.5} />
        <span className="text-sm font-medium tracking-wide">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={activeSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setAttemptIndex((prev) => prev + 1)}
      className={className}
    />
  );
}
