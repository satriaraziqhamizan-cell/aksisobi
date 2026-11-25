import crypto from 'node:crypto';
import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';

const ADMIN_EMAIL = 'satriaraziq07@gmail.com';

function loadFirebaseProjectId(): string {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as { projectId?: string };
    return parsed.projectId || '';
  } catch {
    return '';
  }
}

const FIREBASE_PROJECT_ID = loadFirebaseProjectId();

let cachedCerts: Record<string, string> = {};
let certCacheExpiresAt = 0;

async function getFirebasePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (now < certCacheExpiresAt && Object.keys(cachedCerts).length > 0) {
    return cachedCerts;
  }

  const res = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!res.ok) {
    throw new Error('Failed to fetch Firebase public certificates.');
  }

  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSec = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;
  certCacheExpiresAt = now + maxAgeSec * 1000;
  cachedCerts = (await res.json()) as Record<string, string>;
  return cachedCerts;
}

function base64UrlDecode(segment: string): Buffer {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
  return Buffer.from(padded, 'base64');
}

async function verifyAdminBearerToken(authHeader: string): Promise<boolean> {
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match || !FIREBASE_PROJECT_ID) return false;
  const token = match[1].trim();
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    const header = JSON.parse(base64UrlDecode(parts[0]).toString('utf-8')) as {
      alg?: string;
      kid?: string;
    };
    const payload = JSON.parse(base64UrlDecode(parts[1]).toString('utf-8')) as {
      aud?: string;
      iss?: string;
      sub?: string;
      exp?: number;
      email?: string;
      email_verified?: boolean;
    };

    if (header.alg !== 'RS256' || !header.kid) return false;
    if (payload.aud !== FIREBASE_PROJECT_ID) return false;
    if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) {
      return false;
    }
    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp <= nowSec) return false;
    if (!payload.sub || typeof payload.sub !== 'string') return false;

    const certs = await getFirebasePublicCerts();
    const cert = certs[header.kid];
    if (!cert) return false;

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${parts[0]}.${parts[1]}`);
    verifier.end();
    const signature = base64UrlDecode(parts[2]);
    if (!verifier.verify(cert, signature)) return false;

    return (
      Boolean(payload.email_verified) &&
      (payload.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase()
    );
  } catch {
    return false;
  }
}

function extractGoogleDriveFileId(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (
      host !== 'drive.google.com' &&
      host !== 'docs.google.com' &&
      !host.endsWith('.googleusercontent.com')
    ) {
      return null;
    }
    const qId = parsed.searchParams.get('id');
    if (qId && /^[a-zA-Z0-9_-]{10,100}$/.test(qId)) {
      return qId;
    }
    const pathMatch = parsed.pathname.match(/\/d\/([a-zA-Z0-9_-]{10,100})/);
    if (pathMatch) return pathMatch[1];
  } catch {
    return null;
  }
  return null;
}

function extractDriveIdFromCandidate(candidate: string): string | null {
  const fromUrl = extractGoogleDriveFileId(candidate);
  if (fromUrl) return fromUrl;
  const fallbackMatch = candidate.match(/(?:[?&]id=|\/d\/)([a-zA-Z0-9_-]{10,100})/);
  return fallbackMatch ? fallbackMatch[1] : null;
}

function normalizePhotoUrl(rawValue: string): string {
  const trimmed = rawValue.trim();
  if (!trimmed) return '';

  const candidates = trimmed
    .split(/[\n,;]+/)
    .map((c) => c.trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    const driveId = extractDriveIdFromCandidate(candidate);
    if (driveId) {
      return `/api/drive-photo?id=${encodeURIComponent(driveId)}`;
    }
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol === 'https:') {
        return candidate.slice(0, 500);
      }
    } catch {
      // Try next
    }
  }
  return '';
}

function parseCsvMatrix(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
      i += 1;
    } else if (ch === '\n' || ch === '\r') {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.length > 0));
}

function buildFingerprint(name: string, submittedAt: string, index: number): string {
  const base = `${name.toLowerCase().trim()}|${submittedAt.trim() || String(index)}`;
  return crypto.createHash('sha256').update(base).digest('hex').slice(0, 24);
}

function mapCsvToSubmissions(csvText: string) {
  const matrix = parseCsvMatrix(csvText);
  if (matrix.length === 0) {
    return { headers: [] as string[], detectedPhotoHeaders: [] as string[], rows: [] };
  }

  const headers = matrix[0];
  const lowerHeaders = headers.map((h) => h.toLowerCase());
  const findCol = (keywords: string[], fallback = -1): number => {
    const idx = lowerHeaders.findIndex((h) =>
      keywords.some((kw) => h.includes(kw))
    );
    return idx !== -1 ? idx : fallback;
  };

  const tsIdx = findCol(['timestamp', 'waktu', 'tanggal isi'], 0);
  const nameIdx = findCol(
    ['nama lengkap', 'nama peserta', 'nama', 'full name', 'name'],
    lowerHeaders.length > 1 ? 1 : 0
  );
  const prodiIdx = findCol([
    'program studi',
    'prodi',
    'jurusan',
    'fakultas',
    'study program',
    'major',
  ]);
  const plantIdx = findCol([
    'jenis pohon',
    'jenis tanaman',
    'pohon',
    'tanaman',
    'spesies',
    'plant',
    'species',
  ]);
  const eventIdx = findCol(['kegiatan', 'event', 'program aksi', 'nama event']);
  const locationIdx = findCol(['lokasi', 'location', 'tempat']);

  const excluded = [
    'twibbon',
    'twibon',
    'twibun',
    'bingkai',
    'frame',
    'poster',
    'story',
    'feeds',
    'bukti',
    'screenshot',
    'bayar',
    'pembayaran',
    'transfer',
    'rekening',
    'konfirmasi',
    'follow',
    'subscribe',
    'instagram',
    'tiktok',
    'sosmed',
    'kampanye',
    'campaign',
    'share',
    'repost',
  ];
  const priorityGroups = [
    [
      'foto pribadi',
      'foto mandiri',
      'pas foto',
      'foto diri',
      'foto sendiri',
      'foto formal',
      'foto cocard',
      'foto peserta',
      'portrait',
    ],
    ['swafoto', 'selfie'],
    ['upload foto', 'unggah foto', 'foto', 'photo', 'gambar', 'image'],
  ];

  const photoCandidateCols: number[] = [];
  for (const group of priorityGroups) {
    lowerHeaders.forEach((h, idx) => {
      if (photoCandidateCols.includes(idx)) return;
      if (excluded.some((ex) => h.includes(ex))) return;
      if (group.some((kw) => h.includes(kw))) {
        photoCandidateCols.push(idx);
      }
    });
  }

  const detectedPhotoHeaders = photoCandidateCols.map((idx) => headers[idx]);
  const msgIdx = findCol(['pesan', 'harapan', 'message', 'komitmen', 'catatan']);

  const rows = [];
  for (let r = 1; r < matrix.length; r++) {
    const cols = matrix[r];
    const fullName = (cols[nameIdx] || '').trim().slice(0, 120);
    if (!fullName) continue;

    const submittedAt = (cols[tsIdx] || '').trim().slice(0, 60);
    const studyProgram =
      prodiIdx >= 0 ? (cols[prodiIdx] || '').trim().slice(0, 120) : '';
    const plantName = plantIdx >= 0 ? (cols[plantIdx] || '').trim().slice(0, 80) : '';
    const eventName = eventIdx >= 0 ? (cols[eventIdx] || '').trim().slice(0, 120) : '';
    const location =
      locationIdx >= 0 ? (cols[locationIdx] || '').trim().slice(0, 160) : '';

    let resolvedPhotoUrl = '';
    for (const colIdx of photoCandidateCols) {
      const normalized = normalizePhotoUrl(cols[colIdx] || '');
      if (normalized) {
        resolvedPhotoUrl = normalized;
        break;
      }
    }

    const personalMessage =
      msgIdx >= 0 ? (cols[msgIdx] || '').trim().slice(0, 500) : '';

    rows.push({
      queueId: `sheet-row-${r}`,
      submittedAt,
      fullName,
      studyProgram,
      plantName,
      eventName,
      location,
      photoUrl: resolvedPhotoUrl,
      personalMessage,
      fingerprint: buildFingerprint(fullName, submittedAt, r),
    });
  }

  return { headers, detectedPhotoHeaders, rows };
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const authHeader = String(req.headers.authorization || '');
  const isAuthorized = await verifyAdminBearerToken(authHeader);
  if (!isAuthorized) {
    sendJson(res, 403, { error: 'Akses ditolak. Silakan masuk sebagai Admin.' });
    return;
  }

  const reqUrl = new URL(req.url || '/', 'http://localhost');
  const rawUrl = (reqUrl.searchParams.get('sheetUrl') || '').trim();
  if (!rawUrl) {
    sendJson(res, 400, { error: 'sheetUrl query parameter is required.' });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    sendJson(res, 400, { error: 'Format tautan Google Sheets tidak valid.' });
    return;
  }

  if (parsed.protocol !== 'https:' || parsed.hostname !== 'docs.google.com') {
    sendJson(res, 400, {
      error: 'Tautan harus berasal dari https://docs.google.com/spreadsheets/...',
    });
    return;
  }

  const idMatch = parsed.pathname.match(
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]{15,120})/
  );
  if (!idMatch) {
    sendJson(res, 400, {
      error: 'Spreadsheet ID tidak ditemukan pada tautan Google Sheets.',
    });
    return;
  }

  const sheetId = idMatch[1];
  const rawGid =
    parsed.searchParams.get('gid') ||
    (parsed.hash.match(/gid=(\d+)/)?.[1] ?? '0');
  const gid = /^\d+$/.test(rawGid) ? rawGid : '0';

  const csvEndpoint = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;

  try {
    const sheetRes = await fetch(csvEndpoint, {
      redirect: 'follow',
      headers: { Accept: 'text/csv,text/plain' },
    });
    if (!sheetRes.ok) {
      sendJson(res, 422, {
        error:
          'Google Sheet tidak dapat diakses. Pastikan setelan berbagi Google Sheet diubah menjadi "Anyone with the link -> Viewer".',
      });
      return;
    }
    const contentType = sheetRes.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      sendJson(res, 422, {
        error:
          'Google Sheet masih privat. Ubah akses Google Sheet menjadi "Siapa saja yang memiliki link dapat melihat (Viewer)".',
      });
      return;
    }
    const csvText = await sheetRes.text();
    const parsedSheet = mapCsvToSubmissions(csvText);
    sendJson(res, 200, parsedSheet);
  } catch {
    sendJson(res, 502, {
      error: 'Gagal menghubungi Google Sheets. Silakan coba beberapa saat lagi.',
    });
  }
}
