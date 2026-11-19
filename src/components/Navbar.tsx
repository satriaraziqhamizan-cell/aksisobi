import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  variant?: 'transparent' | 'solid';
}

export function Navbar({ variant = 'solid' }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isTransparent = variant === 'transparent';

  const headerClasses = isTransparent
    ? 'fixed top-0 left-0 right-0 z-40 bg-[#14271B]/80 backdrop-blur-md border-b border-[#FAF9F4]/10 text-[#FAF9F4]'
    : 'sticky top-0 z-40 bg-[#FAF9F4]/95 backdrop-blur-md border-b border-[#14271B]/10 text-[#14271B]';

  const linkBase =
    'text-sm font-medium transition-colors whitespace-nowrap shrink-0 underline-offset-4 hover:underline';

  const navItems = [
    { label: 'Movement', to: '/#movement' },
    { label: 'Activities', to: '/events' },
    { label: 'Plant Catalog', to: '/plants' },
    { label: 'Volunteer', to: '/#volunteer' },
    { label: 'Admin', to: '/admin' },
  ];

  const isActive = (path: string) => {
    if (path.startsWith('/#')) return location.pathname === '/' && location.hash === path.slice(1);
    return location.pathname === path;
  };

  return (
    <header className={`${headerClasses} no-print`}>
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="font-editorial text-xl font-semibold tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B4D36C]"
        >
          Aksi Sobat Bumi
        </Link>

        {/* Zone 2: 5 concise single-line nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6"
        >
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`${linkBase} ${
                isTransparent
                  ? 'text-[#FAF9F4]/85 hover:text-[#FAF9F4]'
                  : 'text-[#14271B]/75 hover:text-[#14271B]'
              } ${isActive(item.to) ? 'underline font-semibold' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/my-plant"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold tracking-wide rounded-md bg-[#B4D36C] text-[#14271B] hover:bg-[#c3df82] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
          >
            My Plant Journey
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md border border-current/15 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className={`md:hidden border-t px-6 py-5 space-y-3 ${
            isTransparent
              ? 'bg-[#14271B] border-[#FAF9F4]/10 text-[#FAF9F4]'
              : 'bg-[#FAF9F4] border-[#14271B]/10 text-[#14271B]'
          }`}
        >
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="py-2.5 text-base font-medium border-b border-current/10"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="pt-2">
            <Link
              to="/my-plant"
              onClick={() => setMobileOpen(false)}
              className="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-md bg-[#B4D36C] text-[#14271B]"
            >
              My Plant Journey
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
