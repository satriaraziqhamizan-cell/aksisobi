import { Link } from 'react-router-dom';
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  VOLUNTEER_FORM_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from '../data/seedData';

export function Footer() {
  return (
    <footer className="bg-[#14271B] text-[#FAF9F4] border-t border-[#FAF9F4]/10 no-print">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#FAF9F4]/15">
          <div className="md:col-span-5 space-y-4">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#B4D36C]">
              Aksi Sobat Bumi
            </p>
            <h2 className="font-editorial text-3xl sm:text-4xl font-medium leading-tight text-[#FAF9F4]">
              One Tree. One Action. One Better Future.
            </h2>
            <p className="text-sm text-[#FAF9F4]/75 max-w-md leading-relaxed">
              Gerakan kolaboratif penanaman pohon dan dokumentasi pertumbuhan
              tanaman personal untuk membangun kesadaran ekologis berkelanjutan.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FAF9F4]/50">
              Platform
            </p>
            <ul className="space-y-2.5 text-sm text-[#FAF9F4]/85">
              <li>
                <Link to="/" className="hover:text-[#B4D36C] transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/my-plant" className="hover:text-[#B4D36C] transition-colors">
                  Cari Plant ID
                </Link>
              </li>
              <li>
                <Link to="/plants" className="hover:text-[#B4D36C] transition-colors">
                  Katalog Pohon
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-[#B4D36C] transition-colors">
                  Green Action &amp; Event
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-[#B4D36C] transition-colors">
                  Admin Panel
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FAF9F4]/50">
              Kontak &amp; Komunitas
            </p>
            <ul className="space-y-2.5 text-sm text-[#FAF9F4]/85">
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#B4D36C] transition-colors inline-flex items-center gap-2"
                >
                  <span>WhatsApp:</span>
                  <span className="font-mono tabular-nums">{WHATSAPP_DISPLAY}</span>
                </a>
              </li>
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#B4D36C] transition-colors inline-flex items-center gap-2"
                >
                  <span>Instagram:</span>
                  <span>{INSTAGRAM_HANDLE}</span>
                </a>
              </li>
              <li>
                <a
                  href={VOLUNTEER_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#B4D36C] transition-colors"
                >
                  Pendaftaran Volunteer (Google Form)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#FAF9F4]/60">
          <p>
            Aksi Sobat Bumi — My Plant Journey
          </p>
          <p className="font-mono tabular-nums">
            One Plant · One Story · One Greener Future
          </p>
        </div>
      </div>
    </footer>
  );
}
