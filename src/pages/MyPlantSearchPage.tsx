import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, AlertCircle } from 'lucide-react';
import {
  findJourneyByPlantCode,
  getAllPublishedJourneys,
} from '../services/plantJourneyService';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ResilientImage } from '../components/ResilientImage';
import { BackButton } from '../components/BackButton';

export function MyPlantSearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sampleJourneys = getAllPublishedJourneys();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = query.trim().toUpperCase();

    if (!cleaned) {
      setError('Silakan masukkan Plant ID Anda terlebih dahulu (contoh: SB26-0001).');
      return;
    }

    setError('');
    setLoading(true);

    window.setTimeout(() => {
      const found = findJourneyByPlantCode(cleaned);
      setLoading(false);

      if (found) {
        navigate(`/plant/${encodeURIComponent(found.record.plantIdCode)}`);
      } else {
        setError(
          "We couldn't find your Plant ID. Please check your code and try again."
        );
      }
    }, 220);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F0E4] text-[#14271B]">
      <Navbar variant="solid" />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-[1000px] mx-auto px-6 space-y-12">
          <div>
            <BackButton fallbackTo="/" label="Kembali ke Beranda" />
          </div>

          {/* Search Card */}
          <section className="max-w-xl mx-auto text-center space-y-6">
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-[#647C45]">
              My Plant Journey
            </p>
            <h1 className="font-editorial text-4xl sm:text-5xl font-medium leading-tight text-[#14271B]">
              Find Your Plant Journey
            </h1>
            <p className="text-base text-[#14271B]/75 leading-relaxed">
              Enter your plant ID and discover the story behind your planting
              journey—atau unggah foto Hari H penanaman Anda.
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-8 bg-[#FAF9F4] border border-[#14271B]/12 rounded-xl p-6 sm:p-8 text-left space-y-4"
            >
              <div>
                <label
                  htmlFor="plant-id-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#14271B]/75 mb-2"
                >
                  Your Plant ID
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-[#14271B]/45 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    className="w-full pl-10 pr-4 py-3.5 font-mono text-sm uppercase tracking-wider bg-white border border-[#14271B]/20 rounded-md focus:outline-none focus:border-[#284B34]"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3.5 rounded-md bg-[#fee2e2] border border-[#fca5a5] text-[#7f1d1d] text-xs leading-relaxed"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-md bg-[#14271B] text-[#FAF9F4] hover:bg-[#284B34] disabled:opacity-60 transition-colors"
              >
                {loading ? 'Mencari Plant ID...' : 'Find My Plant'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </section>

          {/* Registered Plant Journeys Quick Access */}
          <section className="pt-10 border-t border-[#14271B]/12 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#647C45]">
                  Daftar Tanaman Terdaftar
                </p>
                <h2 className="font-editorial text-2xl sm:text-3xl font-medium text-[#14271B] mt-1">
                  Pilih Plant ID untuk Membuka Halaman
                </h2>
              </div>
              <Link
                to="/admin"
                className="text-sm font-medium text-[#284B34] hover:underline whitespace-nowrap shrink-0"
              >
                Kelola Data di Admin Panel →
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
                    className="group border border-[#14271B]/12 bg-[#FAF9F4] hover:bg-white rounded-xl p-5 flex items-center gap-5 transition-colors"
                  >
                    <div className="w-24 h-28 rounded-lg overflow-hidden shrink-0 border border-[#14271B]/10">
                      <ResilientImage
                        src={item.plant.mainImage}
                        alt={item.plant.plantName}
                        fallbackTitle={item.plant.plantName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="font-mono text-xs font-medium text-[#647C45] tabular-nums">
                        {item.record.plantIdCode} ·{' '}
                        {isDayHEmpty ? 'Slot Hari H Kosong' : 'Lengkap'}
                      </p>
                      <h3 className="font-editorial text-xl font-medium text-[#14271B] truncate">
                        {item.plant.plantName}
                      </h3>
                      <p className="text-xs italic text-[#14271B]/65 truncate">
                        {item.plant.scientificName}
                      </p>
                      <p className="text-xs text-[#14271B]/80 pt-1 truncate">
                        Peserta: {item.participant.fullName}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#284B34] shrink-0 group-hover:translate-x-1 transition-transform" />
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
