export function getPublicAppOrigin(): string {
  if (typeof window === 'undefined') {
    return 'https://aksisobatbumi.id';
  }

  const { protocol, host } = window.location;
  // Di AI Studio, URL preview pengembang menggunakan awalan "ais-dev-",
  // sedangkan URL yang dapat dibuka langsung oleh peserta/kamera HP adalah "ais-pre-".
  if (host.startsWith('ais-dev-')) {
    return `${protocol}//${host.replace(/^ais-dev-/, 'ais-pre-')}`;
  }

  return `${protocol}//${host}`;
}

export function getPlantDirectUrl(plantIdCode: string): string {
  const cleanCode = plantIdCode.trim().toUpperCase();
  return `${getPublicAppOrigin()}/plant/${encodeURIComponent(cleanCode)}`;
}

export function extractPlantIdFromScan(rawValue: string): string | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  // 1. Jika QR berisi URL lengkap atau path (/plant/SB26-0001 atau ?plant=SB26-0001)
  try {
    const url = trimmed.startsWith('http')
      ? new URL(trimmed)
      : new URL(trimmed, 'https://aksisobatbumi.id');

    const queryCode =
      url.searchParams.get('plant') ||
      url.searchParams.get('id') ||
      url.searchParams.get('code');
    if (queryCode && /^[A-Z0-9_-]{3,24}$/i.test(queryCode.trim())) {
      return queryCode.trim().toUpperCase();
    }

    const pathToCheck = `${url.pathname} ${url.hash}`;
    const plantPathMatch = pathToCheck.match(/\/plant\/([A-Z0-9_-]{3,24})/i);
    if (plantPathMatch) {
      return decodeURIComponent(plantPathMatch[1]).trim().toUpperCase();
    }
  } catch {
    // Lanjutkan ke pencocokan pola kode langsung
  }

  // 2. Pencocokan kode standar seperti SB26-0001
  const codeMatch = trimmed.match(/\b(SB\d{2}-[A-Z0-9]{2,12})\b/i);
  if (codeMatch) {
    return codeMatch[1].toUpperCase();
  }

  // 3. Jika QR hanya berisi kode ID mentah tanpa URL
  if (/^[A-Z0-9_-]{3,24}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return null;
}
