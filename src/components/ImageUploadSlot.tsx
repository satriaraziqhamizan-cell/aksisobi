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
  onUpload: (dataUrl: string) => void;
}

export function ImageUploadSlot({
  src,
  alt,
  emptyTitle,
  emptyDescription,
  buttonLabel = 'Unggah Foto Hari H',
  aspectClass = 'min-h-[380px]',
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
      onUpload(dataUrl);
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

  const triggerPick = () => {
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
          className={`relative rounded-xl overflow-hidden border border-[#14271B]/12 bg-[#284B34]/10 group ${aspectClass}`}
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
              onClick={triggerPick}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-[#14271B]/85 text-[#FAF9F4] hover:bg-[#14271B] backdrop-blur-sm border border-[#FAF9F4]/20 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              {uploading ? 'Memproses...' : 'Ganti Foto'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={triggerPick}
          disabled={uploading}
          className={`w-full rounded-xl border-2 border-dashed border-[#647C45]/50 bg-[#FAF9F4] hover:bg-white hover:border-[#284B34] transition-colors p-8 flex flex-col items-center justify-center text-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#284B34] ${aspectClass}`}
        >
          <div className="w-12 h-12 rounded-full bg-[#F4F0E4] border border-[#14271B]/10 flex items-center justify-center text-[#284B34] mb-4">
            <Upload className="w-5 h-5" />
          </div>
          <p className="font-editorial text-xl sm:text-2xl font-medium text-[#14271B]">
            {uploading ? 'Mengompresi & Menyimpan Foto...' : emptyTitle}
          </p>
          <p className="text-sm text-[#14271B]/70 max-w-sm mt-2 leading-relaxed">
            {emptyDescription}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-md bg-[#B4D36C] text-[#14271B]">
            <Camera className="w-3.5 h-3.5" />
            {buttonLabel}
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
