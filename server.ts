import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const HOST = '0.0.0.0';
const ADMIN_EMAIL = 'satriaraziq07@gmail.com';
const QUEUE_FILE = '/tmp/asb_gform_inbox_v1.json';

interface FirebaseConfigFile {
  projectId: string;
}

function loadFirebaseProjectId(): string {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as FirebaseConfigFile;
    return parsed.projectId || '';
  } catch {
    return '';
  }
}

const FIREBASE_PROJECT_ID = loadFirebaseProjectId();

// Ephemeral fallback webhook secret when GFORM_WEBHOOK_SECRET is not set in Secrets
const RUNTIME_WEBHOOK_SECRET =
  process.env.GFORM_WEBHOOK_SECRET?.trim() ||
  crypto.randomBytes(24).toString('hex');

/* ============================
   FIREBASE ID TOKEN VERIFIER (NO ADMIN SDK NEEDED)
   ============================ */

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

interface VerifiedFirebaseToken {
  uid: string;
  email: string;
  email_verified: boolean;
}

async function verifyFirebaseIdToken(
  token: string
): Promise<VerifiedFirebaseToken | null> {
  if (!FIREBASE_PROJECT_ID) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

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
      iat?: number;
      email?: string;
      email_verified?: boolean;
    };

    if (header.alg !== 'RS256' || !header.kid) return null;
    if (payload.aud !== FIREBASE_PROJECT_ID) return null;
    if (
      payload.iss !==
      `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`
    ) {
      return null;
    }
    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp <= nowSec) return null;
    if (!payload.sub || typeof payload.sub !== 'string') return null;

    const certs = await getFirebasePublicCerts();
    const cert = certs[header.kid];
    if (!cert) return null;

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${parts[0]}.${parts[1]}`);
    verifier.end();
    const signature = base64UrlDecode(parts[2]);
    if (!verifier.verify(cert, signature)) return null;

    return {
      uid: payload.sub,
      email: (payload.email || '').toLowerCase(),
      email_verified: Boolean(payload.email_verified),
    };
  } catch {
    return null;
  }
}

async function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const decoded = await verifyFirebaseIdToken(match[1].trim());
  if (
    !decoded ||
    !decoded.email_verified ||
    decoded.email !== ADMIN_EMAIL.toLowerCase()
  ) {
    res.status(403).json({ error: 'Admin privileges required.' });
    return;
  }

  next();
}

/* ============================
   GOOGLE DRIVE PHOTO & SHEET CSV HELPERS
   ============================ */

export function extractGoogleDriveFileId(rawUrl: string): string | null {
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
    if (pathMatch) {
      return pathMatch[1];
    }
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
      // Try next candidate
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

export interface ParsedFormSubmission {
  queueId: string;
  submittedAt: string;
  fullName: string;
  studyProgram: string;
  plantName: string;
  eventName: string;
  location: string;
  photoUrl: string;
  personalMessage: string;
  fingerprint: string;
}

function buildFingerprint(name: string, submittedAt: string, index: number): string {
  const base = `${name.toLowerCase().trim()}|${submittedAt.trim() || String(index)}`;
  return crypto.createHash('sha256').update(base).digest('hex').slice(0, 24);
}

function mapCsvToSubmissions(csvText: string): {
  headers: string[];
  detectedPhotoHeaders: string[];
  rows: ParsedFormSubmission[];
} {
  const matrix = parseCsvMatrix(csvText);
  if (matrix.length === 0) {
    return { headers: [], detectedPhotoHeaders: [], rows: [] };
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

  const findPhotoCandidateCols = (): number[] => {
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

    const rankedCols: number[] = [];
    for (const group of priorityGroups) {
      lowerHeaders.forEach((h, idx) => {
        if (rankedCols.includes(idx)) return;
        if (excluded.some((ex) => h.includes(ex))) return;
        if (group.some((kw) => h.includes(kw))) {
          rankedCols.push(idx);
        }
      });
    }
    return rankedCols;
  };

  const photoCandidateCols = findPhotoCandidateCols();
  const detectedPhotoHeaders = photoCandidateCols.map((idx) => headers[idx]);
  const msgIdx = findCol(['pesan', 'harapan', 'message', 'komitmen', 'catatan']);

  const rows: ParsedFormSubmission[] = [];

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

/* ============================
   WEBHOOK QUEUE PERSISTENCE (/tmp)
   ============================ */

function readWebhookQueue(): ParsedFormSubmission[] {
  try {
    if (!fs.existsSync(QUEUE_FILE)) return [];
    const raw = fs.readFileSync(QUEUE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeWebhookQueue(items: ParsedFormSubmission[]): void {
  try {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(items), 'utf-8');
  } catch {
    // Ignore disk errors in read-only environments
  }
}

/* ============================
   EXPRESS APP
   ============================ */

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '512kb' }));

  // 1. Admin webhook config (returns live URL & secret only to authenticated Admin)
  app.get('/api/webhook-config', requireAdminAuth, (req: Request, res: Response) => {
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl =
      process.env.APP_URL?.replace(/\/+$/, '') || `${proto}://${host}`;
    res.json({
      webhookUrl: `${baseUrl}/api/gform-webhook`,
      webhookSecret: RUNTIME_WEBHOOK_SECRET,
    });
  });

  // 2. Receive real-time Google Form submission via Apps Script onFormSubmit
  app.post('/api/gform-webhook', (req: Request, res: Response) => {
    const headerSecret = String(req.headers['x-webhook-secret'] || '');
    const bodySecret = String(req.body?.secret || '');
    const provided = headerSecret || bodySecret;

    if (
      !provided ||
      provided.length !== RUNTIME_WEBHOOK_SECRET.length ||
      !crypto.timingSafeEqual(
        Buffer.from(provided),
        Buffer.from(RUNTIME_WEBHOOK_SECRET)
      )
    ) {
      res.status(401).json({ error: 'Invalid webhook secret.' });
      return;
    }

    const fullName = String(req.body?.fullName || '').trim().slice(0, 120);
    if (!fullName) {
      res.status(400).json({ error: 'fullName is required.' });
      return;
    }

    const submittedAt = String(
      req.body?.submittedAt || new Date().toISOString()
    )
      .trim()
      .slice(0, 60);
    const studyProgram = String(
      req.body?.studyProgram || req.body?.prodi || ''
    )
      .trim()
      .slice(0, 120);
    const plantName = String(req.body?.plantName || '').trim().slice(0, 80);
    const eventName = String(req.body?.eventName || '').trim().slice(0, 120);
    const location = String(req.body?.location || '').trim().slice(0, 160);
    const rawPhoto = String(req.body?.photoUrl || '').trim().slice(0, 500);
    const personalMessage = String(req.body?.personalMessage || '')
      .trim()
      .slice(0, 500);

    const queue = readWebhookQueue();
    const fingerprint = buildFingerprint(fullName, submittedAt, queue.length + 1);

    if (!queue.some((item) => item.fingerprint === fingerprint)) {
      queue.push({
        queueId: `wh-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        submittedAt,
        fullName,
        studyProgram,
        plantName,
        eventName,
        location,
        photoUrl: normalizePhotoUrl(rawPhoto),
        personalMessage,
        fingerprint,
      });
      writeWebhookQueue(queue);
    }

    res.status(201).json({ ok: true, fingerprint });
  });

  // 3. Admin reads & acknowledges queued webhook submissions
  app.get('/api/gform-inbox', requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ items: readWebhookQueue() });
  });

  app.post(
    '/api/gform-inbox/ack',
    requireAdminAuth,
    (req: Request, res: Response) => {
      const fingerprints = Array.isArray(req.body?.fingerprints)
        ? req.body.fingerprints.map((f: unknown) => String(f))
        : [];
      const fpSet = new Set(fingerprints);
      const remaining = readWebhookQueue().filter(
        (item) => !fpSet.has(item.fingerprint)
      );
      writeWebhookQueue(remaining);
      res.json({ ok: true, remainingCount: remaining.length });
    }
  );

  // 4. Direct Google Sheet live fetch (Strict SSRF allowlist: docs.google.com only)
  app.get(
    '/api/google-sheet',
    requireAdminAuth,
    async (req: Request, res: Response) => {
      const rawUrl = String(req.query.sheetUrl || '').trim();
      if (!rawUrl) {
        res.status(400).json({ error: 'sheetUrl query parameter is required.' });
        return;
      }

      let parsed: URL;
      try {
        parsed = new URL(rawUrl);
      } catch {
        res.status(400).json({ error: 'Format tautan Google Sheets tidak valid.' });
        return;
      }

      if (parsed.protocol !== 'https:' || parsed.hostname !== 'docs.google.com') {
        res.status(400).json({
          error: 'Tautan harus berasal dari https://docs.google.com/spreadsheets/...',
        });
        return;
      }

      const idMatch = parsed.pathname.match(
        /\/spreadsheets\/d\/([a-zA-Z0-9_-]{15,120})/
      );
      if (!idMatch) {
        res.status(400).json({
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
          headers: { Accept: 'text/csv,text/plain' },
        });
        if (!sheetRes.ok) {
          res.status(422).json({
            error:
              'Google Sheet tidak dapat diakses. Pastikan setelan berbagi Google Sheet diubah menjadi "Anyone with the link -> Viewer".',
          });
          return;
        }
        const contentType = sheetRes.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          res.status(422).json({
            error:
              'Google Sheet masih privat. Ubah akses Google Sheet menjadi "Siapa saja yang memiliki link dapat melihat (Viewer)".',
          });
          return;
        }
        const csvText = await sheetRes.text();
        const parsedSheet = mapCsvToSubmissions(csvText);
        res.json(parsedSheet);
      } catch {
        res.status(502).json({
          error: 'Gagal menghubungi Google Sheets. Silakan coba beberapa saat lagi.',
        });
      }
    }
  );

  // 5. Safe Google Drive Image Proxy for card front photos uploaded via Google Form
  app.get('/api/drive-photo', async (req: Request, res: Response) => {
    const fileId = String(req.query.id || '').trim();
    if (!/^[a-zA-Z0-9_-]{10,100}$/.test(fileId)) {
      res.status(400).send('Invalid file id');
      return;
    }

    const sniffImageMime = (buf: Buffer): string | null => {
      if (buf.byteLength < 12) return null;
      if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
        return 'image/jpeg';
      }
      if (
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47
      ) {
        return 'image/png';
      }
      if (
        buf[0] === 0x52 &&
        buf[1] === 0x49 &&
        buf[2] === 0x46 &&
        buf[3] === 0x46 &&
        buf[8] === 0x57 &&
        buf[9] === 0x45 &&
        buf[10] === 0x42 &&
        buf[11] === 0x50
      ) {
        return 'image/webp';
      }
      return null;
    };

    const candidates = [
      `https://lh3.googleusercontent.com/d/${fileId}=w1000`,
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`,
      `https://drive.google.com/uc?export=view&id=${fileId}`,
      `https://drive.google.com/uc?export=download&id=${fileId}`,
    ];

    for (const targetUrl of candidates) {
      try {
        const imgRes = await fetch(targetUrl);
        if (!imgRes.ok) continue;

        const rawType = (imgRes.headers.get('content-type') || '').toLowerCase();
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        if (buffer.byteLength > 6 * 1024 * 1024) {
          res.status(413).send('Image too large');
          return;
        }

        const resolvedMime = rawType.startsWith('image/')
          ? rawType
          : sniffImageMime(buffer);
        if (!resolvedMime) continue;

        res.setHeader('Content-Type', resolvedMime);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(buffer);
        return;
      } catch {
        // Try next candidate
      }
    }

    res.status(404).send('Drive image unavailable');
  });

  // Mount Vite middleware in dev or serve built assets in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Aksi Sobat Bumi server listening on http://${HOST}:${PORT}`);
  });
}

startServer();
