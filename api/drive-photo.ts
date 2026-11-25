import type { IncomingMessage, ServerResponse } from 'node:http';

function sniffImageMime(buf: Buffer): string | null {
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
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const reqUrl = new URL(req.url || '/', 'http://localhost');
  const fileId = (reqUrl.searchParams.get('id') || '').trim();
  if (!/^[a-zA-Z0-9_-]{10,100}$/.test(fileId)) {
    res.statusCode = 400;
    res.end('Invalid file id');
    return;
  }

  const candidates = [
    `https://lh3.googleusercontent.com/d/${fileId}=w1000`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    `https://drive.google.com/uc?export=download&id=${fileId}`,
  ];

  for (const targetUrl of candidates) {
    try {
      const imgRes = await fetch(targetUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });
      if (!imgRes.ok) continue;

      const rawType = (imgRes.headers.get('content-type') || '').toLowerCase();
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      if (buffer.byteLength > 6 * 1024 * 1024) {
        res.statusCode = 413;
        res.end('Image too large');
        return;
      }

      const resolvedMime = rawType.startsWith('image/')
        ? rawType
        : sniffImageMime(buffer);
      if (!resolvedMime) continue;

      res.statusCode = 200;
      res.setHeader('Content-Type', resolvedMime);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.end(buffer);
      return;
    } catch {
      // Try next candidate
    }
  }

  res.statusCode = 404;
  res.end('Drive image unavailable');
}
