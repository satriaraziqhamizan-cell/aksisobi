import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F0E4] text-[#14271B]">
      <Navbar variant="solid" />
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-md text-center space-y-5">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#647C45]">
            Halaman Tidak Ditemukan
          </p>
          <h1 className="font-editorial text-4xl font-medium">404</h1>
          <p className="text-base text-[#14271B]/75">
            Tautan yang Anda buka tidak tersedia. Anda dapat kembali ke beranda
            atau mencari perjalanan tanaman menggunakan Plant ID.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to="/"
              className="px-5 py-2.5 text-sm font-semibold rounded-md bg-[#14271B] text-[#FAF9F4]"
            >
              Ke Beranda
            </Link>
            <Link
              to="/my-plant"
              className="px-5 py-2.5 text-sm font-medium rounded-md border border-[#14271B]/20"
            >
              Cari Plant ID
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
