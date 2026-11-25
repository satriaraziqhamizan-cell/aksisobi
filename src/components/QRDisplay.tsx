import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download } from 'lucide-react';
import { getPlantDirectUrl } from '../utils/qrLinks';

interface QRDisplayProps {
  plantIdCode: string;
  size?: number;
  showDownload?: boolean;
  showDirectLink?: boolean;
  darkColor?: string;
  lightColor?: string;
}

export function QRDisplay({
  plantIdCode,
  size = 136,
  showDownload = false,
  showDirectLink = false,
  darkColor = '#14271B',
  lightColor = '#FFFFFF',
}: QRDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const targetUrl = getPlantDirectUrl(plantIdCode);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(targetUrl, {
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: darkColor,
        light: lightColor,
      },
    })
      .then((url) => {
        if (active) {
          setDataUrl(url);
          setError('');
        }
      })
      .catch(() => {
        if (active) {
          setError('Gagal membuat QR Code');
        }
      });

    return () => {
      active = false;
    };
  }, [targetUrl, size, darkColor, lightColor]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qr-${plantIdCode.toLowerCase()}.png`;
    link.click();
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Abaikan jika clipboard diblokir browser
    }
  };

  if (error) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center border border-zinc-200 bg-[#F6F8F6] text-xs text-[#4E6156] text-center p-2 rounded-xl"
      >
        {error}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div
        style={{ width: size, height: size }}
        className="bg-white p-1.5 rounded-xl border border-zinc-200 flex items-center justify-center"
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR Code untuk ${plantIdCode}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full bg-zinc-100 animate-pulse rounded" />
        )}
      </div>

      {(showDownload || showDirectLink) && dataUrl && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {showDownload && (
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F1F17] bg-[#F6F8F6] hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh QR
            </button>
          )}
          {showDirectLink && (
            <button
              type="button"
              onClick={() => void handleCopyUrl()}
              title={targetUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F1F17] bg-white hover:bg-[#F6F8F6] border border-zinc-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#166534]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? 'Tautan Tersalin' : 'Salin Link QR'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
