export function extractDriveFileIdFromSrc(rawSrc: string): string | null {
  const trimmed = rawSrc.trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return null;
  }

  try {
    const base =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://localhost';
    const parsed = new URL(trimmed, base);
    const host = parsed.hostname.toLowerCase();
    const isProxyPath = parsed.pathname === '/api/drive-photo';
    const isGoogleDriveHost =
      host === 'drive.google.com' ||
      host === 'docs.google.com' ||
      host.endsWith('.googleusercontent.com');

    if (!isProxyPath && !isGoogleDriveHost) {
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
    const fallback = trimmed.match(/(?:[?&]id=|\/d\/)([a-zA-Z0-9_-]{10,100})/);
    return fallback ? fallback[1] : null;
  }

  return null;
}

export function getPhotoFallbackCandidates(rawSrc: string): string[] {
  const trimmed = rawSrc.trim();
  if (!trimmed) return [];

  const fileId = extractDriveFileIdFromSrc(trimmed);
  if (!fileId) {
    return [trimmed];
  }

  const proxyUrl = `/api/drive-photo?id=${encodeURIComponent(fileId)}`;
  const candidates = [
    trimmed.startsWith('/api/drive-photo') ? trimmed : proxyUrl,
    `https://lh3.googleusercontent.com/d/${fileId}=w1000`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
  ];

  return Array.from(new Set(candidates));
}
