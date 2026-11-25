import { Link } from 'react-router-dom';
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  MEDIA_ASSETS,
  VOLUNTEER_FORM_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from '../data/seedData';

export function Footer() {
  return (
    <footer className="bg-[#F6F8F6] text-[#0F1F17] border-t border-zinc-200 no-print">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-zinc-200">
          <div className="md:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-3.5">
              <img
                src={MEDIA_ASSETS.brandLogo}
                alt="Logo Sobat Bumi Indonesia Universitas Jambi"
                className="h-14 w-auto object-contain shrink-0"
              />
              <div>
                <p className="text-sm font-semibold text-[#0F1F17]">
                  Aksi Sobat Bumi
                </p>
                <p className="text-xs text-[#4E6156] mt-0.5">
                  Sobat Bumi Indonesia · Universitas Jambi
                </p>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold leading-tight text-[#0F1F17]">
              Satu Pohon. Satu Aksi. Masa Depan Lebih Baik.
            </h2>
            <p className="text-sm text-[#4E6156] max-w-md leading-relaxed">
              Gerakan kolaboratif penanaman pohon dan dokumentasi pertumbuhan
              tanaman personal untuk membangun kesadaran ekologis berkelanjutan.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-semibold text-[#4E6156]">
              Menu Utama
            </p>
            <ul className="space-y-2.5 text-sm text-[#0F1F17]/85">
              <li>
                <Link to="/" className="hover:text-[#166534] transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  to="/my-plant"
                  className="hover:text-[#166534] transition-colors"
                >
                  Pindai QR &amp; Cari ID Pohon
                </Link>
              </li>
              <li>
                <Link
                  to="/plants"
                  className="hover:text-[#166534] transition-colors"
                >
                  Katalog Pohon
                </Link>
              </li>
              <li>
                <Link
                  to="/events"
                  className="hover:text-[#166534] transition-colors"
                >
                  Aksi Hijau &amp; Kegiatan
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <p className="text-xs font-semibold text-[#4E6156]">
              Kontak &amp; Komunitas
            </p>
            <ul className="space-y-2.5 text-sm text-[#0F1F17]/85">
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#166534] transition-colors inline-flex items-center gap-2"
                >
                  <span>WhatsApp:</span>
                  <span className="font-mono tabular-nums">
                    {WHATSAPP_DISPLAY}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#166534] transition-colors inline-flex items-center gap-2"
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
                  className="hover:text-[#166534] transition-colors"
                >
                  Pendaftaran Relawan (Google Form)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#4E6156]">
          <div className="flex items-center gap-4">
            <p>Aksi Sobat Bumi — Jejak Pohonku</p>
            <span aria-hidden="true">·</span>
            <Link
              to="/admin/login"
              className="hover:text-[#166534] transition-colors"
            >
              Portal Admin
            </Link>
          </div>
          <p className="tabular-nums">
            Satu Pohon · Satu Cerita · Masa Depan Lebih Hijau
          </p>
        </div>
      </div>
    </footer>
  );
}
