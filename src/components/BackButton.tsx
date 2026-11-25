import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fallbackTo?: string;
  label?: string;
  variant?: 'dark' | 'light';
}

export function BackButton({
  fallbackTo = '/',
  label = 'Kembali',
  variant = 'dark',
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackTo);
    }
  };

  const styleClasses =
    variant === 'light'
      ? 'text-white/90 hover:text-white border-white/25 bg-black/25 hover:bg-black/40'
      : 'text-[#3F5147] hover:text-[#0F1F17] border-zinc-200 bg-white hover:bg-zinc-50';

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 no-print ${styleClasses}`}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}
