import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, QrCode, Search, AlertCircle, Lock } from 'lucide-react';
import { usePlantData } from '../context/PlantDataContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { BackButton } from '../components/BackButton';
import { QrScannerPanel } from '../components/QrScannerPanel';

export function MyPlantSearchPage() {
  const navigate = useNavigate();
  const { resolveJourneyByCode } = usePlantData();
  const [mode, setMode] = useState<'scan' | 'type'>('scan');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCodeDetected = async (plantIdCode: string): Promise<boolean> => {
    const found = await resolveJourneyByCode(plantIdCode);
    if (!found) return false;
    navigate(`/plant/${encodeURIComponent(found.record.plantIdCode)}`);
    return true;
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    const cleaned = query.trim().toUpperCase();

    if (!cleaned) {
      setError('Silakan masukkan ID Pohon Anda terlebih dahulu (contoh: SB26-0001).');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const found = await resolveJourneyByCode(cleaned);
      if (found) {
        navigate(`/plant/${encodeURIComponent(found.record.plantIdCode)}`);
      } else {
        setError(
          'ID Pohon tidak ditemukan. Periksa kembali kode pada kartu Anda atau pindai QR Code-nya.'
        );
      }
    } catch {
      setError('Terjadi kendala saat memeriksa ID Pohon. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F6] text-[#0F1F17]">
      <Navbar variant="solid" />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-[1040px] mx-auto px-6 space-y-12">
          <div>
            <BackButton fallbackTo="/" label="Kembali ke Beranda" />
          </div>

          {/* Search & Scan Panel */}
          <section className="max-w-xl mx-auto text-center space-y-5">
            <p className="text-sm font-medium text-[#166534]">
              Jejak Pohonku
            </p>
            <h1 className="text-3xl sm:text-5xl font-semibold leading-tight text-[#0F1F17]">
              Pindai QR atau Cari Pohonmu
            </h1>
            <p className="text-base text-[#4E6156] leading-relaxed">
              Pindai QR Code pada kartu Cocard langsung dari kamera, atau
              masukkan ID Pohon pribadi Anda untuk membuka halaman perjalanan.
            </p>

            <div className="mt-8 bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 text-left space-y-6">
              {/* Segmented Switch: Scan QR | Ketik ID */}
              <div
                role="tablist"
                aria-label="Pilih cara membuka halaman pohon"
                className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F6F8F6] border border-zinc-200"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'scan'}
                  onClick={() => {
                    setMode('scan');
                    setError('');
                  }}
                  className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    mode === 'scan'
                      ? 'bg-[#14532D] text-white'
                      : 'text-[#4E6156] hover:text-[#0F1F17]'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  Pindai QR Kamera
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'type'}
                  onClick={() => {
                    setMode('type');
                    setError('');
                  }}
                  className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    mode === 'type'
                      ? 'bg-[#14532D] text-white'
                      : 'text-[#4E6156] hover:text-[#0F1F17]'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Ketik ID Pohon
                </button>
              </div>

              {mode === 'scan' ? (
                <QrScannerPanel onCodeDetected={handleCodeDetected} />
              ) : (
                <form onSubmit={(e) => void handleSearch(e)} className="space-y-4">
                  <div>
                    <label
                      htmlFor="plant-id-input"
                      className="block text-xs font-semibold text-[#4E6156] mb-2"
                    >
                      ID Pohon Anda
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-[#4E6156] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="plant-id-input"
                        type="text"
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="Masukkan kode ID pada kartu Anda"
                        autoComplete="off"
                        className="w-full pl-10 pr-4 py-3.5 font-mono text-sm uppercase tracking-wider bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-[#166534]"
                      />
                    </div>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs leading-relaxed"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534] disabled:opacity-60 transition-colors"
                  >
                    {loading ? 'Mencari ID Pohon...' : 'Buka Halaman Pohon'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>
              )}
            </div>

            <div className="bg-white/80 border border-zinc-200/80 rounded-xl p-4 text-left flex items-start gap-3">
              <Lock className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
              <div className="text-xs text-[#4E6156] leading-relaxed space-y-1">
                <p className="font-semibold text-[#0F1F17]">
                  Akses Khusus Pemilik Kartu
                </p>
                <p>
                  Demi menjaga keamanan dan privasi peserta, daftar kartu tidak
                  ditampilkan secara terbuka. Halaman pohon hanya dapat dibuka
                  jika Anda memindai QR Code pada kartu Cocard atau memasukkan ID
                  Pohon yang sesuai.{' '}
                  <Link
                    to="/plants"
                    className="font-semibold text-[#166534] hover:underline"
                  >
                    Lihat Katalog Pohon →
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
