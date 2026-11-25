import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Terjadi kesalahan sistem.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught app error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F6F8F6] text-[#0F1F17] px-6">
          <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl p-8 space-y-4 text-center">
            <p className="text-sm font-medium text-[#166534]">
              Aksi Sobat Bumi
            </p>
            <h1 className="text-2xl font-semibold">
              Terjadi Kendala Koneksi atau Izin Data
            </h1>
            <p className="text-sm text-[#4E6156] leading-relaxed">
              Silakan muat ulang halaman ini. Jika kendala terus muncul saat
              mengakses data, pastikan Anda sudah masuk dengan akun yang sesuai.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-[#14532D] text-white hover:bg-[#166534]"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
