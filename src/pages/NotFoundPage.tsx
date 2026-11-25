import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F6] text-[#0F1F17]">
      <Navbar variant="solid" />
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-md text-center space-y-5">
          <p className="text-sm font-medium text-[#166534]">
            Halaman Tidak Ditemukan
          </p>
          <h1 className="text-5xl font-semibold">404</h1>
          <p className="text-base text-[#4E6156]">
            Tautan yang Anda buka tidak tersedia. Anda dapat kembali ke beranda
            atau memindai QR Code pada kartu pohon Anda.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to="/"
              className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534]"
            >
              Ke Beranda
            </Link>
            <Link
              to="/my-plant"
              className="px-5 py-2.5 text-sm font-medium rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50"
            >
              Pindai QR / Cari ID Pohon
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
