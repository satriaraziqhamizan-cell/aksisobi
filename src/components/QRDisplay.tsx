import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';

interface QRDisplayProps {
  plantIdCode: string;
  size?: number;
  showDownload?: boolean;
  darkColor?: string;
  lightColor?: string;
}

export function QRDisplay({
  plantIdCode,
  size = 136,
  showDownload = false,
  darkColor = '#14271B',
  lightColor = '#FFFFFF',
}: QRDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  const targetUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/plant/${encodeURIComponent(plantIdCode)}`
      : `https://aksisobatbumi.id/plant/${encodeURIComponent(plantIdCode)}`;

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

  if (error) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center border border-[#14271B]/20 bg-[#F4F0E4] text-xs text-[#765A3A] text-center p-2"
      >
        {error}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div
        style={{ width: size, height: size }}
        className="bg-white p-1.5 rounded-md border border-[#14271B]/10 flex items-center justify-center"
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR Code untuk ${plantIdCode}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full bg-[#F4F0E4] animate-pulse rounded" />
        )}
      </div>

      {showDownload && dataUrl && (
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#14271B] bg-[#F4F0E4] hover:bg-[#e7e1cf] border border-[#14271B]/15 rounded-md transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Unduh QR PNG
        </button>
      )}
    </div>
  );
}
