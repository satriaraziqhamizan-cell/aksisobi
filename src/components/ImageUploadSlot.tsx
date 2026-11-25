import { useRef, useState, type ChangeEvent } from 'react';
import { Camera, Upload } from 'lucide-react';
import { compressImageFile } from '../services/plantJourneyService';
import { ResilientImage } from './ResilientImage';

interface ImageUploadSlotProps {
  src?: string;
  alt: string;
  emptyTitle: string;
  emptyDescription: string;
  buttonLabel?: string;
  aspectClass?: string;
  needsAuth?: boolean;
  onRequestAuth?: () => Promise<boolean>;
  onUpload: (dataUrl: string) => Promise<void> | void;
}

export function ImageUploadSlot({
  src,
  alt,
  emptyTitle,
  emptyDescription,
  buttonLabel = 'Unggah Foto Hari H',
  aspectClass = 'min-h-[380px]',
  needsAuth = false,
  onRequestAuth,
  onUpload,
}: ImageUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);
    try {
      const dataUrl = await compressImageFile(file);
      await onUpload(dataUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memproses foto yang dipilih.'
      );
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const triggerPick = async () => {
    setError('');
    if (needsAuth && onRequestAuth) {
      setUploading(true);
      try {
        const ok = await onRequestAuth();
        if (!ok) {
          setUploading(false);
          return;
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Gagal verifikasi Google. Coba lagi.'
        );
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label={buttonLabel}
      />

      {src ? (
        <div
          className={`relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 group ${aspectClass}`}
        >
          <ResilientImage
            src={src}
            alt={alt}
            fallbackTitle={alt}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 right-3 no-print">
            <button
              type="button"
              onClick={() => void triggerPick()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0F1F17]/85 text-white hover:bg-[#0F1F17] backdrop-blur-sm border border-white/20 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              {uploading ? 'Menyimpan...' : 'Ganti Foto'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void triggerPick()}
          disabled={uploading}
          className={`w-full rounded-2xl border-2 border-dashed border-zinc-300 bg-[#F6F8F6] hover:bg-white hover:border-[#166534] transition-colors p-8 flex flex-col items-center justify-center text-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#166534] ${aspectClass}`}
        >
          <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-[#166534] mb-4">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-[#166534] mb-1">
            Slot Foto Masih Kosong
          </p>
          <p className="text-xl sm:text-2xl font-semibold text-[#0F1F17]">
            {uploading ? 'Memproses & Menyimpan...' : emptyTitle}
          </p>
          <p className="text-sm text-[#4E6156] max-w-sm mt-2 leading-relaxed">
            {emptyDescription}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[#14532D] text-white">
            <Camera className="w-3.5 h-3.5" />
            {needsAuth ? 'Masuk Google & Unggah Foto' : buttonLabel}
          </span>
        </button>
      )}

      {error && (
        <p role="alert" className="text-xs text-[#991b1b] font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
