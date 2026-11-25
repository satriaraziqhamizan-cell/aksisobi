import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ExternalLink,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  ADMIN_EMAIL,
  checkDomainAuthorizedInFirebase,
  signInWithGooglePopup,
  signOutFirebase,
} from '../firebase';
import { usePlantData } from '../context/PlantDataContext';
import { MEDIA_ASSETS } from '../data/seedData';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { BackButton } from '../components/BackButton';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { authReady, user, isAdmin } = usePlantData();
  const [error, setError] = useState('');
  const [unauthorizedHost, setUnauthorizedHost] = useState('');
  const [domainCheckStatus, setDomainCheckStatus] = useState<
    'idle' | 'checking' | 'authorized' | 'unauthorized' | 'unknown'
  >('idle');
  const [submitting, setSubmitting] = useState(false);

  if (authReady && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleGoogleSignIn = async () => {
    setError('');
    setUnauthorizedHost('');
    setDomainCheckStatus('idle');
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
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code || '')
          : '';
      const msg = err instanceof Error ? err.message : '';

      if (
        code === 'auth/unauthorized-domain' ||
        msg.includes('unauthorized-domain')
      ) {
        const host =
          typeof window !== 'undefined' ? window.location.hostname : '';
        setUnauthorizedHost(host);
        setDomainCheckStatus('checking');
        const liveStatus = await checkDomainAuthorizedInFirebase(host);
        setDomainCheckStatus(liveStatus);
        if (liveStatus === 'authorized') {
          setError(
            `Domain "${host}" sebenarnya sudah terdaftar di Firebase, tetapi tab browser ini masih menyimpan cache validasi login sebelumnya.`
          );
        } else {
          setError(
            `Domain "${host}" belum didaftarkan atau belum selesai tersinkron di Authorized Domains Firebase Authentication.`
          );
        }
      } else if (
        code === 'auth/popup-blocked' ||
        msg.includes('popup-blocked')
      ) {
        setError(
          'Jendela login Google diblokir oleh browser. Izinkan pop-up untuk situs ini lalu coba lagi.'
        );
      } else if (
        code === 'auth/popup-closed-by-user' ||
        msg.includes('popup-closed-by-user')
      ) {
        setError('Proses masuk dengan Google dibatalkan sebelum selesai.');
      } else {
        setError(
          msg ||
            'Gagal masuk dengan Google. Pastikan pop-up browser tidak diblokir.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwitchAccount = async () => {
    setError('');
    setUnauthorizedHost('');
    setDomainCheckStatus('idle');
    await signOutFirebase();
    await handleGoogleSignIn();
  };

  const handleHardReload = () => {
    window.location.reload();
  };

  const firebaseAuthSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

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
                className="p-4 text-xs bg-red-50 border border-red-200 text-red-900 rounded-xl space-y-2.5 leading-relaxed"
              >
                <p className="font-semibold">{error}</p>
                {unauthorizedHost && domainCheckStatus === 'checking' && (
                  <p className="text-red-800">
                    Sedang mengecek status domain di server Firebase...
                  </p>
                )}
                {unauthorizedHost && domainCheckStatus === 'authorized' && (
                  <div className="space-y-2.5 pt-2 border-t border-red-200/80 text-red-900/90">
                    <p>
                      Firebase SDK di tab browser yang sama menyimpan hasil gagal
                      sebelumnya sampai halaman dimuat ulang. Klik tombol di
                      bawah untuk memuat ulang halaman (atau tekan{' '}
                      <span className="font-mono font-semibold bg-white px-1.5 py-0.5 rounded border border-red-200">
                        Ctrl+Shift+R
                      </span>{' '}
                      / coba di jendela Incognito).
                    </p>
                    <button
                      type="button"
                      onClick={handleHardReload}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#14532D] text-white font-semibold hover:bg-[#166534] transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Muat Ulang Halaman &amp; Coba Login
                    </button>
                  </div>
                )}
                {unauthorizedHost &&
                  domainCheckStatus !== 'checking' &&
                  domainCheckStatus !== 'authorized' && (
                    <div className="space-y-2 pt-1 border-t border-red-200/80 text-red-900/90">
                      <p>Cara mengizinkan domain ini agar bisa login Google:</p>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>
                          Buka{' '}
                          <strong>
                            Firebase Console ({firebaseConfig.projectId}) →
                            Authentication → Settings → Authorized domains
                          </strong>
                          .
                        </li>
                        <li>
                          Klik <strong>Add domain</strong>, lalu masukkan{' '}
                          <span className="font-mono font-semibold bg-white px-1.5 py-0.5 rounded border border-red-200">
                            {unauthorizedHost}
                          </span>
                          .
                        </li>
                        <li>
                          Simpan, tunggu ±1 menit, lalu muat ulang halaman ini
                          sebelum mencoba masuk lagi.
                        </li>
                      </ol>
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={handleHardReload}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14532D] text-white font-semibold hover:bg-[#166534] transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Muat Ulang Halaman
                        </button>
                        <a
                          href={firebaseAuthSettingsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-semibold text-[#14532D] underline hover:text-[#166534]"
                        >
                          Buka Pengaturan Authorized Domains Firebase
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
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
