import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { MEDIA_ASSETS } from '../data/seedData';

interface NavbarProps {
  variant?: 'transparent' | 'solid';
}

export function Navbar({ variant = 'solid' }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const headerClasses =
    variant === 'transparent'
      ? 'sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 text-[#0F1F17]'
      : 'sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 text-[#0F1F17]';

  const navItems = [
    { label: 'Gerakan', to: '/#movement' },
    { label: 'Kegiatan', to: '/events' },
    { label: 'Katalog Pohon', to: '/plants' },
    { label: 'Relawan', to: '/#volunteer' },
  ];

  const isActive = (path: string) => {
    if (path.startsWith('/#')) {
      return location.pathname === '/' && location.hash === path.slice(1);
    }
    return location.pathname === path;
  };

  return (
    <header className={`${headerClasses} no-print`}>
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Logo + Single-line Wordmark */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="inline-flex items-center gap-2.5 text-base sm:text-lg font-semibold tracking-tight text-[#0F1F17] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#166534]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <img
            src={MEDIA_ASSETS.brandLogo}
            alt="Logo Sobat Bumi Indonesia Universitas Jambi"
            className="h-10 w-auto object-contain shrink-0"
          />
          <span>Aksi Sobat Bumi</span>
        </Link>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-7"
        >
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`text-sm font-medium transition-colors whitespace-nowrap shrink-0 underline-offset-4 hover:text-[#166534] hover:underline ${
                isActive(item.to)
                  ? 'text-[#166534] font-semibold'
                  : 'text-[#3F5147]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Zone 3: Primary Action + Mobile Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/my-plant"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
          >
            Pindai / Pohonku
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-zinc-200 text-[#0F1F17] hover:bg-zinc-50 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-6 py-5 space-y-3 text-[#0F1F17]">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="py-2.5 text-base font-medium border-b border-zinc-100 hover:text-[#166534]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="pt-2">
            <Link
              to="/my-plant"
              onClick={() => setMobileOpen(false)}
              className="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534]"
            >
              Pindai QR / Cari Pohonku
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
