import JSZip from 'jszip';
import QRCode from 'qrcode';
import { MEDIA_ASSETS } from '../data/seedData';
import type { EnrichedPlantJourney } from '../types/plantJourney';
import { getPlantDirectUrl } from './qrLinks';
import { getPhotoFallbackCandidates } from './drivePhoto';

export const COCARD_WIDTH = 1122;
export const COCARD_HEIGHT = 1594;

// Koordinat tepat pada gambar Cocard_Aksi_Sobi_9.5x13.5cm_full_bleed (1122 x 1594 px)
export const COCARD_LAYOUT = {
  front: {
    photoX: 260,
    photoY: 567,
    photoW: 601,
    photoH: 709,
    photoRadius: 60,
    labelX: 185,
    labelW: 502,
    nameY: 1124,
    nameH: 60,
    prodiY: 1184,
    prodiH: 44,
    borderW: 3.5,
  },
  back: {
    boxX: 145,
    boxY: 512,
    boxW: 832,
    boxH: 625,
    qrSize: 548,
    qrY: 522,
    codeY: 1104,
  },
} as const;

const imageCache = new Map<string, HTMLImageElement>();

function loadSingleImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  const cached = imageCache.get(src);
  if (cached) return Promise.resolve(cached);

  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('/')) {
      img.crossOrigin = 'anonymous';
    }
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  const candidates = getPhotoFallbackCandidates(src);
  for (const candidate of candidates) {
    const loaded = await loadSingleImage(candidate);
    if (loaded) {
      imageCache.set(src, loaded);
      return loaded;
    }
  }
  return null;
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fitTextSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  weight: string,
  family: string
): number {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) {
      return size;
    }
    size -= 1;
  }
  return minSize;
}

function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  centerY: number,
  maxWidth: number,
  startSize: number,
  minSize: number,
  weight: string,
  family: string,
  color: string
): void {
  const size = fitTextSize(ctx, text, maxWidth, startSize, minSize, weight, family);
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let output = text;
  if (ctx.measureText(output).width > maxWidth) {
    while (output.length > 3 && ctx.measureText(`${output}...`).width > maxWidth) {
      output = output.slice(0, -1);
    }
    output = `${output}...`;
  }
  ctx.fillText(output, centerX, centerY);
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Gagal menghasilkan gambar PNG kartu.'));
      }
    }, 'image/png');
  });
}

function slugifyFilePart(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'peserta'
  );
}

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function renderCocardFrontBlob(
  journey: EnrichedPlantJourney
): Promise<Blob> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Lanjutkan meski font belum selesai dimuat
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = COCARD_WIDTH;
  canvas.height = COCARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak tersedia.');

  const templateImg = await loadImageSafe(MEDIA_ASSETS.cardFrontTemplate);
  if (templateImg) {
    ctx.drawImage(templateImg, 0, 0, COCARD_WIDTH, COCARD_HEIGHT);
  } else {
    ctx.fillStyle = '#14532D';
    ctx.fillRect(0, 0, COCARD_WIDTH, COCARD_HEIGHT);
  }

  const {
    photoX,
    photoY,
    photoW,
    photoH,
    photoRadius,
    labelX,
    labelW,
    nameY,
    nameH,
    prodiY,
    prodiH,
    borderW,
  } = COCARD_LAYOUT.front;

  // 1. Tempel HANYA Foto Mandiri peserta (JPG/PNG) ke kotak tengah yang kosong
  const photoSrc = journey.record.cardFrontPhoto?.trim() || '';
  const photoImg = photoSrc ? await loadImageSafe(photoSrc) : null;

  ctx.save();
  drawRoundedRectPath(ctx, photoX, photoY, photoW, photoH, photoRadius);
  ctx.clip();

  if (photoImg && photoImg.naturalWidth > 0 && photoImg.naturalHeight > 0) {
    // Pastikan latar belakang putih rapi jika foto adalah PNG transparan
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(photoX, photoY, photoW, photoH);

    const imgRatio = photoImg.naturalWidth / photoImg.naturalHeight;
    const boxRatio = photoW / photoH;
    let drawW = photoW;
    let drawH = photoH;
    let drawX = photoX;
    let drawY = photoY;

    if (imgRatio > boxRatio) {
      drawH = photoH;
      drawW = photoH * imgRatio;
      drawX = photoX - (drawW - photoW) / 2;
    } else {
      drawW = photoW;
      drawH = photoW / imgRatio;
      // Sedikit bias ke atas (25%) agar kepala pada foto potret tidak terpotong
      drawY = photoY - (drawH - photoH) * 0.25;
    }
    ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);
  } else {
    // Jika belum ada foto mandiri, biarkan kotak foto bersih dan kosong
    ctx.fillStyle = '#F6F8F6';
    ctx.fillRect(photoX, photoY, photoW, photoH);
  }
  ctx.restore();

  // 2. Tempel Kotak Nama & Prodi (menutup placeholder NAMA & [PROGRAM STUDI])
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(labelX, nameY, labelW, nameH + prodiH);

  const nameGrad = ctx.createLinearGradient(labelX, nameY, labelX, nameY + nameH);
  nameGrad.addColorStop(0, '#447E46');
  nameGrad.addColorStop(1, '#3A7435');
  ctx.fillStyle = nameGrad;
  ctx.fillRect(
    labelX + borderW,
    nameY + borderW,
    labelW - borderW * 2,
    nameH - borderW * 1.5
  );

  ctx.fillStyle = '#CDDAA7';
  ctx.fillRect(
    labelX + borderW,
    prodiY + borderW * 0.5,
    labelW - borderW * 2,
    prodiH - borderW * 1.5
  );
  ctx.restore();

  const displayName = journey.participant.fullName.trim().toUpperCase();
  const displayProdi = (
    journey.participant.studyProgram?.trim() || 'RELAWAN SOBAT BUMI'
  ).toUpperCase();

  drawFittedText(
    ctx,
    displayName,
    labelX + labelW / 2,
    nameY + nameH / 2 + 1,
    labelW - 36,
    27,
    15,
    '700',
    '"Plus Jakarta Sans", "Outfit", Arial, sans-serif',
    '#FFFFFF'
  );

  drawFittedText(
    ctx,
    displayProdi,
    labelX + labelW / 2,
    prodiY + prodiH / 2 + 1,
    labelW - 32,
    18,
    11,
    '600',
    '"Plus Jakarta Sans", Arial, sans-serif',
    '#1F3A1E'
  );

  return canvasToPngBlob(canvas);
}

export async function renderCocardBackBlob(
  journey: EnrichedPlantJourney
): Promise<Blob> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Lanjutkan
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = COCARD_WIDTH;
  canvas.height = COCARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak tersedia.');

  const templateImg = await loadImageSafe(MEDIA_ASSETS.cardBackTemplate);
  if (templateImg) {
    ctx.drawImage(templateImg, 0, 0, COCARD_WIDTH, COCARD_HEIGHT);
  } else {
    ctx.fillStyle = '#14532D';
    ctx.fillRect(0, 0, COCARD_WIDTH, COCARD_HEIGHT);
  }

  const { boxX, boxW, qrSize, qrY, codeY } = COCARD_LAYOUT.back;
  const centerX = boxX + boxW / 2;

  // margin: 0 agar modul QR mengisi penuh kotak putih secara maksimal
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, getPlantDirectUrl(journey.record.plantIdCode), {
    width: qrSize,
    margin: 0,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0F1F17',
      light: '#FFFFFF',
    },
  });

  ctx.drawImage(qrCanvas, centerX - qrSize / 2, qrY, qrSize, qrSize);

  drawFittedText(
    ctx,
    journey.record.plantIdCode,
    centerX,
    codeY,
    boxW - 60,
    38,
    24,
    '800',
    '"JetBrains Mono", monospace',
    '#14532D'
  );

  return canvasToPngBlob(canvas);
}

export async function downloadSingleCocardSide(
  journey: EnrichedPlantJourney,
  side: 'front' | 'back'
): Promise<void> {
  const slug = slugifyFilePart(journey.participant.fullName);
  const code = journey.record.plantIdCode.toUpperCase();
  const blob =
    side === 'front'
      ? await renderCocardFrontBlob(journey)
      : await renderCocardBackBlob(journey);

  triggerBlobDownload(
    blob,
    `Cocard_${code}_${slug}_${side === 'front' ? 'Depan' : 'Belakang'}.png`
  );
}

export async function downloadParticipantCocardZip(
  journey: EnrichedPlantJourney
): Promise<void> {
  const zip = new JSZip();
  const slug = slugifyFilePart(journey.participant.fullName);
  const code = journey.record.plantIdCode.toUpperCase();

  const [frontBlob, backBlob] = await Promise.all([
    renderCocardFrontBlob(journey),
    renderCocardBackBlob(journey),
  ]);

  zip.file(`${code}_${slug}_1_Depan.png`, frontBlob);
  zip.file(`${code}_${slug}_2_Belakang_QR.png`, backBlob);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(zipBlob, `Cocard_${code}_${slug}.zip`);
}

export async function downloadAllCocardsZip(
  journeys: EnrichedPlantJourney[],
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const total = journeys.length;

  for (let i = 0; i < total; i++) {
    const item = journeys[i];
    const slug = slugifyFilePart(item.participant.fullName);
    const code = item.record.plantIdCode.toUpperCase();
    const folderName = `${code}_${slug}`;

    const [frontBlob, backBlob] = await Promise.all([
      renderCocardFrontBlob(item),
      renderCocardBackBlob(item),
    ]);

    const folder = zip.folder(folderName);
    if (folder) {
      folder.file(`${code}_${slug}_1_Depan.png`, frontBlob);
      folder.file(`${code}_${slug}_2_Belakang_QR.png`, backBlob);
    } else {
      zip.file(`${code}_${slug}_1_Depan.png`, frontBlob);
      zip.file(`${code}_${slug}_2_Belakang_QR.png`, backBlob);
    }

    onProgress?.(i + 1, total);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const dateStamp = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(zipBlob, `Semua_Cocard_Aksi_Sobat_Bumi_${dateStamp}.zip`);
}
