import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { VOLUNTEER_FORM_URL } from '../data/seedData';
import { usePlantData } from '../context/PlantDataContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ResilientImage } from '../components/ResilientImage';
import { BackButton } from '../components/BackButton';

export function EventsPage() {
  const { slug } = useParams<{ slug?: string }>();
  const { events, getEventBySlug } = usePlantData();

  if (slug) {
    const event = getEventBySlug(slug);
    if (!event) {
      return (
        <div className="min-h-screen flex flex-col bg-white text-[#0F1F17]">
          <Navbar variant="solid" />
          <main className="flex-1 flex items-center justify-center px-6 py-24">
            <div className="text-center space-y-4 max-w-md">
              <h1 className="text-3xl font-semibold">
                Kegiatan Tidak Ditemukan
              </h1>
              <p className="text-sm text-[#4E6156]">
                Halaman kegiatan yang Anda cari belum tersedia atau telah
                dipindahkan.
              </p>
              <Link
                to="/events"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#14532D] text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Semua Kegiatan
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col bg-white text-[#0F1F17]">
        <Navbar variant="solid" />
        <main className="flex-1 py-10 sm:py-16">
          <div className="max-w-[1000px] mx-auto px-6 space-y-8">
            <div>
              <BackButton fallbackTo="/events" label="Kembali" />
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#4E6156] font-medium">
                <span className="text-[#166534]">
                  {event.status === 'Completed' ? 'Selesai' : 'Akan Datang'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{event.eventDate}</span>
                <span aria-hidden="true">·</span>
                <span>{event.eventLocation}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-semibold leading-tight text-[#0F1F17]">
                {event.eventName}
              </h1>
            </div>

            <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100">
              <ResilientImage
                src={event.coverImage}
                alt={event.eventName}
                fallbackTitle={event.eventName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pt-2">
              <div className="md:col-span-8 space-y-4">
                <h2 className="text-2xl font-semibold text-[#0F1F17]">
                  Ringkasan Kegiatan
                </h2>
                <p className="text-base text-[#4E6156] leading-relaxed">
                  {event.fullStory}
                </p>
              </div>
              <div className="md:col-span-4 space-y-5 p-6 rounded-2xl bg-[#F6F8F6] border border-zinc-200 h-fit">
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-zinc-200 pb-2.5">
                    <dt className="text-[#4E6156]">Target Pohon</dt>
                    <dd className="font-mono font-semibold tabular-nums">
                      {event.treesPlantedTarget} bibit
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-zinc-200 pb-2.5">
                    <dt className="text-[#4E6156]">Relawan</dt>
                    <dd className="font-mono font-semibold tabular-nums">
                      {event.volunteerCount} orang
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#4E6156]">Status</dt>
                    <dd className="font-semibold text-[#166534]">
                      {event.status === 'Completed' ? 'Selesai' : 'Akan Datang'}
                    </dd>
                  </div>
                </dl>

                <a
                  href={VOLUNTEER_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534] transition-colors"
                >
                  Daftar Sebagai Relawan
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0F1F17]">
      <Navbar variant="solid" />
      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-6 space-y-10">
          <div>
            <BackButton fallbackTo="/" label="Kembali ke Beranda" />
          </div>

          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium text-[#166534]">
              Kegiatan Kami
            </p>
            <h1 className="text-4xl sm:text-5xl font-semibold text-[#0F1F17]">
              Aksi Hijau Sobat Bumi
            </h1>
            <p className="text-base text-[#4E6156] leading-relaxed">
              Program penanaman dan pemantauan pohon bersama relawan di berbagai
              kawasan resapan serta pesisir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((evt) => (
              <article
                key={evt.id}
                className="border border-zinc-200 bg-white rounded-2xl overflow-hidden flex flex-col justify-between hover:border-zinc-300 transition-colors"
              >
                <div>
                  <div className="aspect-[16/9] overflow-hidden bg-zinc-100">
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
                    <h2 className="text-2xl font-semibold text-[#0F1F17]">
                      {evt.eventName}
                    </h2>
                    <p className="text-sm sm:text-base text-[#4E6156] leading-relaxed">
                      {evt.description}
                    </p>
                  </div>
                </div>
                <div className="px-6 sm:px-8 pb-6 sm:pb-7 pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-xs font-mono text-[#4E6156] tabular-nums">
                    {evt.treesPlantedTarget} pohon · {evt.volunteerCount} relawan
                  </span>
                  <Link
                    to={`/events/${evt.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#166534] hover:text-[#0F1F17]"
                  >
                    Lihat Detail
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
