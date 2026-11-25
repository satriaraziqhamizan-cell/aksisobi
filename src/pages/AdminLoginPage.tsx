import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, LogOut, ShieldCheck } from 'lucide-react';
import { ADMIN_EMAIL, signInWithGooglePopup, signOutFirebase } from '../firebase';
import { usePlantData } from '../context/PlantDataContext';
import { MEDIA_ASSETS } from '../data/seedData';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { BackButton } from '../components/BackButton';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { authReady, user, isAdmin } = usePlantData();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (authReady && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleGoogleSignIn = async () => {
    setError('');
    setSubmitting(true);
    try {
      const cred = await signInWithGooglePopup();
      const signedEmail = cred.user.email?.toLowerCase() || '';
      if (signedEmail === ADMIN_EMAIL.toLowerCase() && cred.user.emailVerified) {
        navigate('/admin', { replace: true });
      } else {
        setError(
          `Akun Google ${cred.user.email || ''} belum terdaftar sebagai Admin panitia (${ADMIN_EMAIL}).`
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal masuk dengan Google. Pastikan pop-up browser tidak diblokir.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwitchAccount = async () => {
    setError('');
    await signOutFirebase();
    await handleGoogleSignIn();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F6] text-[#0F1F17]">
      <Navbar variant="solid" />

      <main className="flex-1 py-12 sm:py-20">
        <div className="max-w-[540px] mx-auto px-6 space-y-8">
          <div>
            <BackButton fallbackTo="/" label="Kembali ke Beranda" />
          </div>

          <section className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-10 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 mb-2">
                <img
                  src={MEDIA_ASSETS.brandLogo}
                  alt="Logo Sobat Bumi Indonesia Universitas Jambi"
                  className="h-14 w-auto object-contain"
                />
                <div className="w-10 h-10 rounded-xl bg-[#14532D] text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm font-medium text-[#166534]">
                Aksi Sobat Bumi · Portal Admin
              </p>
              <h1 className="text-3xl font-semibold text-[#0F1F17]">
                Masuk Panitia dengan Google
              </h1>
              <p className="text-sm text-[#4E6156] leading-relaxed">
                Masuk menggunakan akun Google admin untuk menyinkronkan Google
                Form secara otomatis, mengelola peserta, mencetak kartu QR
                portrait, dan mengatur kegiatan Aksi Hijau.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3.5 text-xs font-medium bg-red-50 border border-red-200 text-red-900 rounded-xl"
              >
                {error}
              </div>
            )}

            {!authReady ? (
              <p className="text-sm text-[#4E6156] py-4">
                Memeriksa sesi akun Google...
              </p>
            ) : user && !isAdmin ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#F6F8F6] border border-zinc-200 text-xs space-y-1">
                  <p className="font-semibold text-[#0F1F17]">
                    Saat ini masuk sebagai: {user.email}
                  </p>
                  <p className="text-[#4E6156]">
                    Akses Admin terhubung ke akun panitia terdaftar (
                    <span className="font-mono">{ADMIN_EMAIL}</span>).
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534] disabled:opacity-60 transition-colors"
                  >
                    <span>Pilih Akun Google Admin</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void signOutFirebase()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-medium rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Keluar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 text-sm font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534] disabled:opacity-60 transition-colors"
              >
                <span>
                  {submitting
                    ? 'Membuka Google Sign-In...'
                    : 'Masuk dengan Akun Google Admin'}
                </span>
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </button>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
