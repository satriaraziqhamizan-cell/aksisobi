import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import jsQR from 'jsqr';
import { AlertCircle, Camera, ImageUp, VideoOff } from 'lucide-react';
import { extractPlantIdFromScan } from '../utils/qrLinks';

interface QrScannerPanelProps {
  onCodeDetected: (plantIdCode: string, rawText: string) => boolean;
}

export function QrScannerPanel({ onCodeDetected }: QrScannerPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanAtRef = useRef<number>(0);

  const [cameraActive, setCameraActive] = useState(false);
  const [startingCamera, setStartingCamera] = useState(false);
  const [error, setError] = useState('');
  const [statusText, setStatusText] = useState(
    'Ketuk tombol di bawah untuk mengaktifkan kamera dan memindai QR Code pada kartu pohon.'
  );

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setStartingCamera(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleDecodedRaw = useCallback(
    (rawValue: string): boolean => {
      const code = extractPlantIdFromScan(rawValue);
      if (!code) {
        setError(
          'QR Code terbaca, tetapi bukan kode kartu pohon Aksi Sobat Bumi.'
        );
        return false;
      }

      const matched = onCodeDetected(code, rawValue);
      if (matched) {
        stopCamera();
        return true;
      }

      setError(
        `Kode "${code}" terbaca dari QR, tetapi ID Pohon tersebut belum terdaftar atau belum dipublikasikan.`
      );
      return false;
    },
    [onCodeDetected, stopCamera]
  );

  const scanFrameLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    const now = performance.now();
    if (
      now - lastScanAtRef.current >= 140 &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      video.videoWidth > 0 &&
      video.videoHeight > 0
    ) {
      lastScanAtRef.current = now;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (result && result.data) {
          const navigated = handleDecodedRaw(result.data);
          if (navigated) return;
        }
      }
    }

    rafRef.current = window.requestAnimationFrame(scanFrameLoop);
  }, [handleDecodedRaw]);

  const startCamera = async () => {
    setError('');
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setError(
        'Akses kamera memerlukan koneksi aman (HTTPS). Gunakan tombol "Foto QR (Kamera)" atau "Unggah Foto QR".'
      );
      return;
    }

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setError(
        'Browser ini tidak mendukung live kamera. Gunakan tombol "Foto QR (Kamera)" atau "Unggah Foto QR" di bawah ini.'
      );
      return;
    }

    setStartingCamera(true);
    setStatusText('Meminta izin akses kamera perangkat...');

    const tryGetStream = async (): Promise<MediaStream> => {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (firstErr) {
        const errName = firstErr instanceof Error ? firstErr.name : '';
        // Jika kamera belakang tidak ditemukan / constraint tidak cocok, fallback ke kamera apa saja
        if (
          errName === 'OverconstrainedError' ||
          errName === 'ConstraintNotSatisfiedError' ||
          errName === 'NotFoundError'
        ) {
          return await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
        throw firstErr;
      }
    };

    try {
      const stream = await tryGetStream();
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.muted = true;
        try {
          await video.play();
        } catch {
          // Sebagian browser mobile memicu autoplay otomatis setelah loadedmetadata
        }
      }

      setCameraActive(true);
      setStartingCamera(false);
      setStatusText(
        'Arahkan kamera ke QR Code pada kartu tanaman. Halaman peserta akan terbuka otomatis.'
      );
      rafRef.current = window.requestAnimationFrame(scanFrameLoop);
    } catch (err) {
      stopCamera();
      const errName = err instanceof Error ? err.name : '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setError(
          'Izin kamera ditolak oleh browser atau pembungkus pratinjau. Izinkan kamera di pengaturan browser, atau gunakan tombol "Foto QR (Kamera)" di bawah untuk langsung memotret kartu.'
        );
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setError(
          'Perangkat kamera tidak ditemukan. Anda tetap dapat mengunggah foto QR Code dari galeri.'
        );
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setError(
          'Kamera sedang dipakai aplikasi lain atau tidak dapat diakses. Tutup aplikasi kamera lain lalu coba lagi.'
        );
      } else {
        setError(
          'Live kamera tidak dapat dibuka di browser ini. Gunakan tombol "Foto QR (Kamera)" atau "Unggah Foto QR" di bawah ini.'
        );
      }
      setStatusText('Kamera belum aktif.');
    }
  };

  const handleImageQrUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Gagal membaca file gambar QR.'));
        reader.readAsDataURL(file);
      });

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Format gambar tidak dapat dibaca.'));
        el.src = dataUrl;
      });

      const canvas = document.createElement('canvas');
      const maxDim = 1200;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Gagal memproses gambar QR Code.');
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (!decoded || !decoded.data) {
        setError(
          'QR Code tidak terlihat jelas di foto tersebut. Pastikan kotak QR tampak penuh dan tidak buram.'
        );
        return;
      }

      handleDecodedRaw(decoded.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal membaca gambar QR Code.'
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (captureInputRef.current) {
        captureInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden bg-[#0F2419] border border-zinc-200 aspect-[4/3] sm:aspect-[16/10] flex items-center justify-center">
        {/* Tetap render video tanpa display:none agar video.play() & dimensi frame bekerja di iOS Safari/Android */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
            cameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {cameraActive ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-[#A3E635] rounded-2xl shadow-[0_0_0_9999px_rgba(15,31,23,0.48)]" />
          </div>
        ) : (
          <div className="relative z-10 p-6 text-center space-y-3 text-white max-w-sm">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto text-[#A3E635]">
              <Camera className="w-5 h-5" />
            </div>
            <p className="text-sm leading-relaxed text-white/85">
              {statusText}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs leading-relaxed text-left"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
        {cameraActive ? (
          <button
            type="button"
            onClick={stopCamera}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg border border-zinc-200 bg-white text-[#0F1F17] hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
          >
            <VideoOff className="w-4 h-4" />
            Matikan Kamera
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void startCamera()}
            disabled={startingCamera}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
          >
            <Camera className="w-4 h-4" />
            {startingCamera ? 'Mengaktifkan Kamera...' : 'Buka Kamera Pindai QR'}
          </button>
        )}

        <input
          ref={captureInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => void handleImageQrUpload(e)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => captureInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border border-zinc-200 bg-white text-[#0F1F17] hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
        >
          <Camera className="w-4 h-4" />
          Foto QR (Kamera HP)
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => void handleImageQrUpload(e)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border border-zinc-200 bg-white text-[#0F1F17] hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
        >
          <ImageUp className="w-4 h-4" />
          Unggah Foto QR
        </button>
      </div>
    </div>
  );
}
