import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { VOLUNTEER_FORM_URL } from '../data/seedData';
import { getAllEvents, getEventBySlug } from '../services/plantJourneyService';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ResilientImage } from '../components/ResilientImage';
import { BackButton } from '../components/BackButton';

export function EventsPage() {
  const { slug } = useParams<{ slug?: string }>();

  if (slug) {
    const event = getEventBySlug(slug);
    if (!event) {
      return (
        <div className="min-h-screen flex flex-col bg-[#FAF9F4] text-[#14271B]">
          <Navbar variant="solid" />
          <main className="flex-1 flex items-center justify-center px-6 py-24">
            <div className="text-center space-y-4 max-w-md">
              <h1 className="font-editorial text-3xl font-medium">
                Kegiatan Tidak Ditemukan
              </h1>
              <p className="text-sm text-[#14271B]/70">
                Halaman event yang Anda cari belum tersedia atau telah dipindahkan.
              </p>
              <Link
                to="/events"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md bg-[#14271B] text-[#FAF9F4]"
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
      <div className="min-h-screen flex flex-col bg-[#FAF9F4] text-[#14271B]">
        <Navbar variant="solid" />
        <main className="flex-1 py-10 sm:py-16">
          <div className="max-w-[1000px] mx-auto px-6 space-y-8">
            <div>
              <BackButton fallbackTo="/events" label="Kembali" />
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#647C45] font-medium">
                <span>{event.status}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{event.eventDate}</span>
                <span aria-hidden="true">·</span>
                <span>{event.eventLocation}</span>
              </div>
              <h1 className="font-editorial text-4xl sm:text-5xl font-medium leading-tight">
                {event.eventName}
              </h1>
            </div>

            <div className="aspect-[16/9] rounded-xl overflow-hidden border border-[#14271B]/12 bg-[#F4F0E4]">
              <ResilientImage
                src={event.coverImage}
                alt={event.eventName}
                fallbackTitle={event.eventName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pt-2">
              <div className="md:col-span-8 space-y-4">
                <h2 className="font-editorial text-2xl font-medium">
                  Ringkasan Kegiatan
                </h2>
                <p className="text-base text-[#14271B]/80 leading-relaxed">
                  {event.fullStory}
                </p>
              </div>
              <div className="md:col-span-4 space-y-5 p-6 rounded-xl bg-[#F4F0E4] border border-[#14271B]/10 h-fit">
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-[#14271B]/10 pb-2">
                    <dt className="text-[#14271B]/60">Target Pohon</dt>
                    <dd className="font-mono font-semibold tabular-nums">
                      {event.treesPlantedTarget} bibit
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-[#14271B]/10 pb-2">
                    <dt className="text-[#14271B]/60">Relawan</dt>
                    <dd className="font-mono font-semibold tabular-nums">
                      {event.volunteerCount} orang
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#14271B]/60">Status</dt>
                    <dd className="font-medium">{event.status}</dd>
                  </div>
                </dl>

                <a
                  href={VOLUNTEER_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold rounded-md bg-[#14271B] text-[#FAF9F4] hover:bg-[#284B34] transition-colors"
                >
                  Daftar Sebagai Volunteer
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

  const events = getAllEvents();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F4] text-[#14271B]">
      <Navbar variant="solid" />
      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-6 space-y-10">
          <div>
            <BackButton fallbackTo="/" label="Kembali ke Beranda" />
          </div>

          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#647C45]">
              Our Activities
            </p>
            <h1 className="font-editorial text-4xl sm:text-5xl font-medium">
              Green Action Aksi Sobat Bumi
            </h1>
            <p className="text-base text-[#14271B]/75 leading-relaxed">
              Program penanaman dan pemantauan pohon bersama relawan di berbagai
              kawasan resapan serta pesisir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((evt) => (
              <article
                key={evt.id}
                className="border border-[#14271B]/12 bg-white rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[16/9] overflow-hidden bg-[#F4F0E4]">
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
                    <h2 className="font-editorial text-2xl font-medium">
                      {evt.eventName}
                    </h2>
                    <p className="text-sm text-[#14271B]/75 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>
                </div>
                <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 border-t border-[#14271B]/8 flex items-center justify-between">
                  <span className="text-xs font-mono text-[#14271B]/60 tabular-nums">
                    {evt.treesPlantedTarget} pohon · {evt.volunteerCount} relawan
                  </span>
                  <Link
                    to={`/events/${evt.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#284B34] hover:text-[#14271B]"
                  >
                    Explore Event
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
