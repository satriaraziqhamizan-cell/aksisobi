import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react';
import { MEDIA_ASSETS, VOLUNTEER_FORM_URL } from '../data/seedData';
import {
  getAllEvents,
  getAllPublishedJourneys,
  getMovementStats,
} from '../services/plantJourneyService';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ResilientImage } from '../components/ResilientImage';

export function HomePage() {
  const events = getAllEvents();
  const journeys = getAllPublishedJourneys();
  const stats = getMovementStats();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F4] text-[#14271B]">
      <Navbar variant="transparent" />

      {/* SECTION A — HERO */}
      <section className="relative min-h-[92vh] flex items-end pt-24 pb-16 sm:pb-24 overflow-hidden bg-[#14271B] text-[#FAF9F4]">
        <ResilientImage
          src={MEDIA_ASSETS.heroForest}
          alt="Relawan Aksi Sobat Bumi menanam bibit pohon di hutan tropis pada pagi hari"
          fallbackTitle="Aksi Sobat Bumi"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#14271B] via-[#14271B]/65 to-[#14271B]/50"
        />

        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6">
          <div className="max-w-3xl space-y-6">
            <p className="text-xs font-mono uppercase tracking-[0.24em] text-[#B4D36C]">
              Aksi Sobat Bumi · My Plant Journey
            </p>
            <h1 className="font-editorial text-4xl sm:text-6xl lg:text-[4.25rem] font-medium leading-[1.08] tracking-tight text-[#FAF9F4]">
              Small Actions, Greener Future.
            </h1>
            <p className="text-base sm:text-lg text-[#FAF9F4]/85 max-w-xl leading-relaxed">
              Bersama bergerak, bertumbuh, dan menciptakan aksi nyata untuk bumi
              yang lebih baik. Setiap pohon yang ditanam membawa satu kisah yang
              terus hidup.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/my-plant"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-md bg-[#B4D36C] text-[#14271B] hover:bg-[#c3df82] transition-colors whitespace-nowrap shrink-0"
              >
                My Plant Journey
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#movement"
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-medium rounded-md border border-[#FAF9F4]/30 text-[#FAF9F4] hover:bg-[#FAF9F4]/10 transition-colors whitespace-nowrap shrink-0"
              >
                Join Our Movement
              </a>
            </div>
          </div>

          <div className="mt-14 pt-6 border-t border-[#FAF9F4]/15 flex items-center justify-between text-xs text-[#FAF9F4]/70">
            <span>One Plant · One Story · One Greener Future</span>
            <a
              href="#movement"
              className="inline-flex items-center gap-1.5 hover:text-[#B4D36C] transition-colors"
            >
              <span>Jelajahi Gerakan</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* SECTION B — ABOUT OUR MOVEMENT */}
      <section id="movement" className="bg-[#F4F0E4] py-20 sm:py-28">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between space-y-10">
              <div className="space-y-5">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#647C45]">
                  01 · About Our Movement
                </p>
                <h2 className="font-editorial text-3xl sm:text-5xl font-medium leading-tight text-[#14271B]">
                  We Believe Every Action Matters.
                </h2>
                <p className="text-base text-[#14271B]/80 leading-relaxed max-w-xl">
                  Aksi Sobat Bumi mengajak individu dan komunitas mengambil peran
                  nyata dalam menjaga lingkungan melalui kegiatan penanaman pohon
                  yang berkelanjutan. Setiap bibit yang ditanam menjadi bagian
                  dari upaya bersama memulihkan ruang hijau dan kesadaran ekologis.
                </p>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-[#14271B]/15">
                <div>
                  <dt className="text-xs text-[#14271B]/60 mb-1">
                    Pohon Ditanam
                  </dt>
                  <dd className="font-editorial text-3xl font-semibold text-[#14271B] tabular-nums">
                    {stats.totalTreesPlanted}+ Pohon
                  </dd>
                  <p className="text-xs text-[#647C45] mt-1">
                    Tercatat dalam aksi lapangan
                  </p>
                </div>
                <div>
                  <dt className="text-xs text-[#14271B]/60 mb-1">
                    Jenis Pohon
                  </dt>
                  <dd className="font-editorial text-3xl font-semibold text-[#14271B] tabular-nums">
                    {stats.totalSpecies} Jenis
                  </dd>
                  <p className="text-xs text-[#647C45] mt-1">
                    {stats.speciesNamesSummary}
                  </p>
                </div>
                <div>
                  <dt className="text-xs text-[#14271B]/60 mb-1">
                    Relawan Bergerak
                  </dt>
                  <dd className="font-editorial text-3xl font-semibold text-[#14271B] tabular-nums">
                    {stats.totalVolunteers}+ Orang
                  </dd>
                  <p className="text-xs text-[#647C45] mt-1">
                    Lintas komunitas &amp; kota
                  </p>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-6 flex flex-col">
              <div className="flex-1 min-h-[340px] rounded-xl overflow-hidden border border-[#14271B]/10">
                <ResilientImage
                  src={MEDIA_ASSETS.aboutCommunity}
                  alt="Para relawan Aksi Sobat Bumi merawat bibit pohon muda di lereng perbukitan hijau"
                  fallbackTitle="Kegiatan Relawan Aksi Sobat Bumi"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs font-serif italic text-[#14271B]/65 mt-3">
                Fig. 1 — Dokumentasi lapangan penanaman dan perawatan bibit pohon
                oleh relawan Aksi Sobat Bumi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C — OUR ACTIVITIES (GREEN ACTION) */}
      <section className="bg-[#FAF9F4] py-20 sm:py-28 border-t border-[#14271B]/10">
        <div className="max-w-[1200px] mx-auto px-6 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#647C45]">
                02 · Green Action &amp; Activities
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl font-medium text-[#14271B]">
                Green Action di Lapangan
              </h2>
            </div>
            <Link
              to="/events"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#284B34] hover:text-[#14271B] underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Lihat Semua Kegiatan
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((evt) => (
              <article
                key={evt.id}
                className="border border-[#14271B]/12 bg-white rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[16/9] w-full overflow-hidden bg-[#F4F0E4]">
                    <ResilientImage
                      src={evt.coverImage}
                      alt={evt.eventName}
                      fallbackTitle={evt.eventName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 sm:p-8 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#647C45] font-medium">
                      <span>{evt.status}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{evt.eventDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>{evt.eventLocation}</span>
                    </div>
                    <h3 className="font-editorial text-2xl font-medium text-[#14271B]">
                      {evt.eventName}
                    </h3>
                    <p className="text-sm sm:text-base text-[#14271B]/75 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>
                </div>

                <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 flex items-center justify-between border-t border-[#14271B]/8">
                  <span className="text-xs font-mono text-[#14271B]/60 tabular-nums">
                    Target {evt.treesPlantedTarget} pohon · {evt.volunteerCount} relawan
                  </span>
                  <Link
                    to={`/events/${evt.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#284B34] hover:text-[#14271B] whitespace-nowrap shrink-0"
                  >
                    Explore Event
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION D — OPEN RECRUITMENT VOLUNTEER (DIRECT GOOGLE FORM) */}
      <section id="volunteer" className="bg-[#284B34] text-[#FAF9F4] py-20 sm:py-24">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8 space-y-4">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#B4D36C]">
                03 · Open Recruitment Volunteer
              </p>
              <h2 className="font-editorial text-3xl sm:text-5xl font-medium leading-tight">
                Be Part of the Change.
              </h2>
              <p className="text-base text-[#FAF9F4]/85 leading-relaxed max-w-2xl">
                Small actions become meaningful when we grow and move together.
                Daftar melalui formulir resmi untuk bergabung sebagai relawan
                Aksi Sobat Bumi pada kegiatan penanaman berikutnya.
              </p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <a
                href={VOLUNTEER_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold rounded-md bg-[#B4D36C] text-[#14271B] hover:bg-[#c3df82] transition-colors whitespace-nowrap shrink-0"
              >
                Join as Volunteer
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION E — MY PLANT JOURNEY SPOTLIGHT */}
      <section className="bg-[#14271B] text-[#FAF9F4] py-20 sm:py-28 border-t border-[#FAF9F4]/10">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#B4D36C]">
                04 · My Plant Journey
              </p>
              <h2 className="font-editorial text-3xl sm:text-5xl font-medium leading-tight">
                Every Plant Has a Story.
              </h2>
              <p className="text-base text-[#FAF9F4]/80 leading-relaxed max-w-xl">
                A living reminder of your contribution to a greener future.
                Masukkan Plant ID Anda untuk melihat halaman perjalanan tanaman,
                mengunggah foto Hari H saat menanam, memantau pertumbuhan pohon,
                serta mengunduh kartu QR personal Anda.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/my-plant"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-md bg-[#B4D36C] text-[#14271B] hover:bg-[#c3df82] transition-colors whitespace-nowrap shrink-0"
                >
                  Discover Your Plant
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/plants"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#FAF9F4] hover:text-[#B4D36C] underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                >
                  Lihat Katalog Jenis Pohon
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {journeys.slice(0, 2).map((item) => (
                <Link
                  key={item.record.id}
                  to={`/plant/${item.record.plantIdCode}`}
                  className="group rounded-xl overflow-hidden border border-[#FAF9F4]/15 bg-[#1b3424] hover:border-[#B4D36C]/50 transition-colors flex flex-col"
                >
                  <div className="aspect-[3/4] w-full overflow-hidden bg-[#284B34]/40">
                    <ResilientImage
                      src={item.plant.mainImage}
                      alt={item.plant.plantName}
                      fallbackTitle={item.plant.plantName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5 space-y-1">
                    <p className="font-mono text-xs text-[#B4D36C] tabular-nums">
                      {item.record.plantIdCode}
                    </p>
                    <h3 className="font-editorial text-2xl font-medium text-[#FAF9F4]">
                      {item.plant.plantName}
                    </h3>
                    <p className="text-xs text-[#FAF9F4]/70 truncate">
                      {item.participant.fullName}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
