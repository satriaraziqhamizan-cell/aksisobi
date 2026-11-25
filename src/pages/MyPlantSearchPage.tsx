import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, QrCode, Search, AlertCircle } from 'lucide-react';
import { usePlantData } from '../context/PlantDataContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ResilientImage } from '../components/ResilientImage';
import { BackButton } from '../components/BackButton';
import { QrScannerPanel } from '../components/QrScannerPanel';

export function MyPlantSearchPage() {
  const navigate = useNavigate();
  const { journeys: sampleJourneys, getJourneyByCode } = usePlantData();
  const [mode, setMode] = useState<'scan' | 'type'>('scan');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCodeDetected = (plantIdCode: string): boolean => {
    const found = getJourneyByCode(plantIdCode);
    if (!found) return false;
    navigate(`/plant/${encodeURIComponent(found.record.plantIdCode)}`);
    return true;
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = query.trim().toUpperCase();

    if (!cleaned) {
      setError('Silakan masukkan ID Pohon Anda terlebih dahulu (contoh: SB26-0001).');
      return;
    }

    setError('');
    setLoading(true);

    window.setTimeout(() => {
      const found = getJourneyByCode(cleaned);
      setLoading(false);

      if (found) {
        navigate(`/plant/${encodeURIComponent(found.record.plantIdCode)}`);
      } else {
        setError(
          'ID Pohon tidak ditemukan. Periksa kembali kode pada kartu Anda atau pindai QR Code-nya.'
        );
      }
    }, 180);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F6] text-[#0F1F17]">
      <Navbar variant="solid" />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-[1040px] mx-auto px-6 space-y-14">
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
              Pindai QR Code pada kartu tanaman langsung dari kamera, atau
              masukkan ID Pohon Anda untuk membuka halaman perjalanan pribadi.
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
                <form onSubmit={handleSearch} className="space-y-4">
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
                        placeholder="SB26-0001"
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
          </section>

          {/* Registered Plant Journeys Quick Access */}
          <section className="pt-10 border-t border-zinc-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#166534]">
                  Daftar Pohon Terdaftar
                </p>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0F1F17] mt-1">
                  Pilih Nama atau ID Pohon
                </h2>
              </div>
              <Link
                to="/plants"
                className="text-sm font-semibold text-[#166534] hover:text-[#0F1F17] whitespace-nowrap shrink-0"
              >
                Lihat Katalog Pohon →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sampleJourneys.map((item) => {
                const isDayHEmpty =
                  !item.record.participantPlantPhoto || !item.record.plantPhoto;

                return (
                  <Link
                    key={item.record.id}
                    to={`/plant/${item.record.plantIdCode}`}
                    className="group border border-zinc-200 bg-white hover:border-[#166534] rounded-2xl p-5 flex items-center gap-5 transition-colors"
                  >
                    <div className="w-24 h-28 rounded-xl overflow-hidden shrink-0 border border-zinc-200 bg-zinc-100">
                      <ResilientImage
                        src={item.plant.mainImage}
                        alt={item.plant.plantName}
                        fallbackTitle={item.plant.plantName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="font-mono text-xs font-medium text-[#166534] tabular-nums">
                        {item.record.plantIdCode} ·{' '}
                        {isDayHEmpty ? 'Slot Hari-H Kosong' : 'Sudah Lengkap'}
                      </p>
                      <h3 className="text-xl font-semibold text-[#0F1F17] truncate">
                        {item.plant.plantName}
                      </h3>
                      <p className="text-xs italic text-[#4E6156] truncate">
                        {item.plant.scientificName}
                      </p>
                      <p className="text-xs text-[#0F1F17]/80 pt-1 truncate">
                        Peserta: {item.participant.fullName}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#166534] shrink-0 group-hover:translate-x-1 transition-transform" />
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
