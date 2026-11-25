import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, QrCode } from 'lucide-react';
import {
  MEDIA_ASSETS,
  SDG_PILLARS,
  VOLUNTEER_FORM_URL,
} from '../data/seedData';
import { usePlantData } from '../context/PlantDataContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ResilientImage } from '../components/ResilientImage';

export function HomePage() {
  const { events, plants, movementStats: stats } = usePlantData();
  const [sdgView, setSdgView] = useState<'focus' | 'all'>('focus');

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0F1F17]">
      <Navbar variant="solid" />

      <main className="flex-1">
        {/* HERO — Clean Modern Split */}
        <section className="bg-white pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-zinc-200/80">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-between space-y-10 py-2">
                <div className="space-y-6">
                  <p className="text-sm font-medium text-[#166534]">
                    Sobat Bumi Indonesia · Universitas Jambi
                  </p>
                  <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-semibold leading-[1.08] tracking-tight text-[#0F1F17]">
                    Satu Pohon, Satu Cerita untuk Masa Depan Lebih Hijau.
                  </h1>
                  <p className="text-base sm:text-lg text-[#4E6156] max-w-xl leading-relaxed">
                    Setiap bibit yang Anda tanam tercatat dengan identitas
                    digital dan QR Code pribadi. Pindai kartu Anda untuk
                    mendokumentasikan hari penanaman hingga pertumbuhan pohon
                    dari waktu ke waktu.
                  </p>

                  <div className="flex flex-wrap items-center gap-3.5 pt-2">
                    <Link
                      to="/my-plant"
                      className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0"
                    >
                      <QrCode className="w-4 h-4" />
                      Pindai QR / Cari Pohonku
                    </Link>
                    <a
                      href={VOLUNTEER_FORM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-medium rounded-lg border border-zinc-200 text-[#0F1F17] bg-white hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
                    >
                      Daftar Relawan
                      <ArrowUpRight className="w-4 h-4 text-[#4E6156]" />
                    </a>
                  </div>
                </div>

                {/* Inline Proof Strip */}
                <dl className="grid grid-cols-3 gap-6 pt-8 border-t border-zinc-200">
                  <div>
                    <dt className="text-xs text-[#4E6156] mb-1">Pohon Ditanam</dt>
                    <dd className="text-2xl sm:text-3xl font-semibold text-[#0F1F17] tabular-nums">
                      {stats.totalTreesPlanted}+
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#4E6156] mb-1">Jenis Pohon</dt>
                    <dd className="text-2xl sm:text-3xl font-semibold text-[#0F1F17] tabular-nums">
                      {stats.totalSpecies}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#4E6156] mb-1">Relawan</dt>
                    <dd className="text-2xl sm:text-3xl font-semibold text-[#0F1F17] tabular-nums">
                      {stats.totalVolunteers}+
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="lg:col-span-5 flex flex-col">
                <div className="relative flex-1 min-h-[360px] lg:min-h-[480px] rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100">
                  <ResilientImage
                    src={MEDIA_ASSETS.heroForest}
                    alt="Relawan Aksi Sobat Bumi menanam bibit pohon di kawasan hijau"
                    fallbackTitle="Aksi Sobat Bumi"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-6 text-white">
                    <p className="text-xs font-medium text-white/80">
                      Dokumentasi Lapangan
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      Penanaman &amp; pelacakan pertumbuhan berbasis QR Code
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT MOVEMENT & SDG / TPB ALIGNMENT */}
        <section id="movement" className="bg-[#F6F8F6] py-20 sm:py-28">
          <div className="max-w-[1200px] mx-auto px-6 space-y-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
              <div className="lg:col-span-6 flex flex-col order-2 lg:order-1">
                <div className="flex-1 min-h-[340px] rounded-2xl overflow-hidden border border-zinc-200 bg-white">
                  <ResilientImage
                    src={MEDIA_ASSETS.aboutCommunity}
                    alt="Para relawan Aksi Sobat Bumi merawat bibit pohon muda bersama"
                    fallbackTitle="Kegiatan Relawan Aksi Sobat Bumi"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-[#4E6156] mt-3">
                  Kolaborasi relawan dalam penanaman dan pemantauan bibit pohon
                  berkelanjutan.
                </p>
              </div>

              <div className="lg:col-span-6 flex flex-col justify-between space-y-8 order-1 lg:order-2">
                <div className="space-y-5">
                  <h2 className="text-3xl sm:text-4xl font-semibold leading-tight text-[#0F1F17]">
                    Setiap Aksi Nyata Membawa Perubahan Berkelanjutan.
                  </h2>
                  <p className="text-base text-[#4E6156] leading-relaxed max-w-xl">
                    Aksi Sobat Bumi mengajak mahasiswa, relawan, dan masyarakat
                    untuk menjaga kelestarian lingkungan melalui penanaman pohon
                    yang terukur. Setiap pohon terhubung ke halaman digital unik
                    sehingga riwayat pertumbuhannya tetap terjaga.
                  </p>
                </div>

                <div className="divide-y divide-zinc-200 border-y border-zinc-200 text-sm">
                  <div className="py-4 flex items-baseline justify-between gap-4">
                    <span className="font-medium text-[#0F1F17]">
                      Identitas Digital Unik
                    </span>
                    <span className="text-[#4E6156] text-right">
                      1 kartu portrait · 1 halaman perjalanan pohon
                    </span>
                  </div>
                  <div className="py-4 flex items-baseline justify-between gap-4">
                    <span className="font-medium text-[#0F1F17]">
                      Dokumentasi Hari Penanaman
                    </span>
                    <span className="text-[#4E6156] text-right">
                      Foto dapat diunggah langsung saat aksi berlangsung
                    </span>
                  </div>
                  <div className="py-4 flex items-baseline justify-between gap-4">
                    <span className="font-medium text-[#0F1F17]">
                      Jenis Tanaman Unggulan
                    </span>
                    <span className="text-[#4E6156] text-right">
                      {stats.speciesNamesSummary}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BERSINERGI & BERKELANJUTAN — SDG / TPB SHOWCASE */}
            <div
              id="sdg"
              className="pt-16 border-t border-zinc-200 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
            >
              <div className="lg:col-span-5 space-y-4">
                <div className="py-2">
                  <ResilientImage
                    src={MEDIA_ASSETS.pfEcosystemVisual}
                    alt="Ekosistem keberlanjutan Pertamina Foundation: penanaman pohon, energi surya, akses air bersih, dan pemberdayaan masyarakat"
                    fallbackTitle="Ekosistem Keberlanjutan Pertamina Foundation"
                    className="w-full h-auto object-contain mix-blend-multiply"
                  />
                </div>
                <p className="text-xs text-[#4E6156] leading-relaxed border-t border-zinc-200/80 pt-3">
                  Sinergi pelestarian lingkungan, energi bersih, air bersih, dan
                  pemberdayaan masyarakat dalam ekosistem Pertamina Foundation.
                </p>
              </div>

              <div className="lg:col-span-7 space-y-5">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-[#166534]">
                    Bersinergi &amp; Berkelanjutan · TPB / SDG
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-semibold leading-tight text-[#0F1F17] max-w-2xl">
                    Kontribusi pada Tujuan Pembangunan Berkelanjutan.
                  </h2>
                  <p className="text-base text-[#4E6156] leading-relaxed">
                    Strategi keberlanjutan Pertamina Foundation mengintegrasikan
                    program Tanggung Jawab Sosial dan Lingkungan (TJSL) ke dalam
                    inisiatif nyata—termasuk gerakan Aksi Sobat Bumi Universitas
                    Jambi—untuk berkontribusi langsung pada pencapaian Tujuan
                    Pembangunan Berkelanjutan (TPB/SDG).
                  </p>
                </div>

                <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                  <div
                    role="tablist"
                    aria-label="Tampilan peta SDG"
                    className="inline-flex items-center gap-1 p-1 bg-white border border-zinc-200 rounded-lg"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={sdgView === 'focus'}
                      onClick={() => setSdgView('focus')}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        sdgView === 'focus'
                          ? 'bg-[#14532D] text-white'
                          : 'text-[#4E6156] hover:text-[#0F1F17]'
                      }`}
                    >
                      Fokus SDG 4 · 7 · 13
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={sdgView === 'all'}
                      onClick={() => setSdgView('all')}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        sdgView === 'all'
                          ? 'bg-[#14532D] text-white'
                          : 'text-[#4E6156] hover:text-[#0F1F17]'
                      }`}
                    >
                      17 Peta TPB Lengkap
                    </button>
                  </div>
                </div>

                {sdgView === 'focus' ? (
                  <div className="space-y-6">
                    <div className="aspect-[1980/254] rounded-xl overflow-hidden border border-zinc-200 bg-white">
                      <ResilientImage
                        src={MEDIA_ASSETS.sdgFocusBanner}
                        alt="Tiga pilar SDG utama: 4 Pendidikan Berkualitas, 7 Energi Bersih dan Terjangkau, 13 Penanganan Perubahan Iklim"
                        fallbackTitle="SDG 4, SDG 7, dan SDG 13"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
                      {SDG_PILLARS.map((pillar) => (
                        <div
                          key={pillar.code}
                          className="pt-4 border-t border-zinc-300/80 space-y-2"
                        >
                          <p className="font-mono text-xs font-semibold text-[#166534] tabular-nums">
                            {pillar.code}
                          </p>
                          <h3 className="text-base font-semibold text-[#0F1F17]">
                            {pillar.title}
                          </h3>
                          <p className="text-xs text-[#4E6156] leading-relaxed">
                            {pillar.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl overflow-hidden border border-zinc-200 bg-white">
                      <ResilientImage
                        src={MEDIA_ASSETS.sdgFullGrid}
                        alt="17 Tujuan Pembangunan Berkelanjutan (TPB) Indonesia yang menjadi acuan program Pertamina Foundation"
                        fallbackTitle="17 Tujuan Pembangunan Berkelanjutan (TPB)"
                        className="w-full h-auto object-contain block"
                      />
                    </div>
                    <p className="text-xs text-[#4E6156] leading-relaxed">
                      Seluruh portofolio program Pertamina Foundation—mulai dari{' '}
                      <span className="font-medium text-[#0F1F17]">
                        PF-Lestari, Aksi Sobat Bumi, PF-Muda, hingga PF-Preneur
                      </span>
                      —dipetakan untuk mendukung 17 Tujuan Pembangunan
                      Berkelanjutan secara terukur.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ACTIVITIES / AKSI HIJAU */}
        <section className="bg-white py-20 sm:py-28 border-t border-zinc-200/80">
          <div className="max-w-[1200px] mx-auto px-6 space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <p className="text-sm font-medium text-[#166534]">
                  Kegiatan &amp; Aksi Hijau
                </p>
                <h2 className="text-3xl sm:text-4xl font-semibold text-[#0F1F17]">
                  Aksi Penanaman di Lapangan
                </h2>
              </div>
              <Link
                to="/events"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#166534] hover:text-[#0F1F17] transition-colors whitespace-nowrap shrink-0"
              >
                Lihat Semua Kegiatan
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {events.map((evt) => (
                <article
                  key={evt.id}
                  className="border border-zinc-200 bg-white rounded-2xl overflow-hidden flex flex-col justify-between hover:border-zinc-300 transition-colors"
                >
                  <div>
                    <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-100">
                      <ResilientImage
                        src={evt.coverImage}
                        alt={evt.eventName}
                        fallbackTitle={evt.eventName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 sm:p-8 space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#4E6156] font-medium">
                        <span className="text-[#166534]">
                          {evt.status === 'Completed' ? 'Selesai' : 'Akan Datang'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{evt.eventDate}</span>
                        <span aria-hidden="true">·</span>
                        <span>{evt.eventLocation}</span>
                      </div>
                      <h3 className="text-2xl font-semibold text-[#0F1F17]">
                        {evt.eventName}
                      </h3>
                      <p className="text-sm sm:text-base text-[#4E6156] leading-relaxed">
                        {evt.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 sm:px-8 pb-6 sm:pb-7 pt-4 flex items-center justify-between border-t border-zinc-100">
                    <span className="text-xs font-mono text-[#4E6156] tabular-nums">
                      Target {evt.treesPlantedTarget} pohon · {evt.volunteerCount}{' '}
                      relawan
                    </span>
                    <Link
                      to={`/events/${evt.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#166534] hover:text-[#0F1F17] whitespace-nowrap shrink-0"
                    >
                      Lihat Detail
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* VOLUNTEER CTA BANNER */}
        <section id="volunteer" className="bg-[#0F2419] text-white py-20 sm:py-24">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-8 space-y-4">
                <p className="text-sm font-medium text-[#A3E635]">
                  Pendaftaran Relawan Terbuka
                </p>
                <h2 className="text-3xl sm:text-4xl font-semibold leading-tight">
                  Jadilah Bagian dari Perubahan Hijau.
                </h2>
                <p className="text-base text-white/80 leading-relaxed max-w-2xl">
                  Aksi kecil menjadi bermakna ketika dilakukan bersama. Isi
                  formulir pendaftaran resmi untuk bergabung sebagai relawan
                  Aksi Sobat Bumi dan dapatkan kartu pohon pribadi Anda.
                </p>
              </div>
              <div className="lg:col-span-4 flex lg:justify-end">
                <a
                  href={VOLUNTEER_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold rounded-lg bg-[#A3E635] text-[#0F1F17] hover:bg-[#bef264] transition-colors whitespace-nowrap shrink-0"
                >
                  Daftar Sebagai Relawan
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* JEJAK POHONKU SPOTLIGHT */}
        <section className="bg-white py-20 sm:py-28">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-6">
                <p className="text-sm font-medium text-[#166534]">
                  Jejak Pohonku
                </p>
                <h2 className="text-3xl sm:text-4xl font-semibold leading-tight text-[#0F1F17]">
                  Setiap Pohon Memiliki Kisah Pertumbuhan.
                </h2>
                <p className="text-base text-[#4E6156] leading-relaxed">
                  Pindai QR Code pada kartu pohon atau masukkan ID Pohon Anda
                  untuk membuka halaman pribadi, mengunggah foto saat
                  penanaman, dan memantau perkembangan pohon.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    to="/my-plant"
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0"
                  >
                    Pindai QR / Cari Pohonku
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/plants"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#166534] hover:text-[#0F1F17] transition-colors whitespace-nowrap shrink-0"
                  >
                    Katalog Jenis Pohon
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {plants.slice(0, 2).map((plant) => (
                  <Link
                    key={plant.id}
                    to="/plants"
                    className="group rounded-2xl overflow-hidden border border-zinc-200 bg-white hover:border-[#166534] transition-colors flex flex-col"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-100">
                      <ResilientImage
                        src={plant.mainImage}
                        alt={plant.plantName}
                        fallbackTitle={plant.plantName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5 sm:p-6 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-[#4E6156]">
                        <span className="font-mono font-medium text-[#166534] tabular-nums">
                          {plant.plantCode}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{plant.category}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-[#0F1F17]">
                        {plant.plantName}
                      </h3>
                      <p className="text-xs italic text-[#4E6156] truncate">
                        {plant.scientificName}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
