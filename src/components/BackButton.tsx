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
      ? 'text-[#FAF9F4]/85 hover:text-[#B4D36C] border-[#FAF9F4]/20 bg-[#14271B]/50'
      : 'text-[#14271B]/80 hover:text-[#14271B] border-[#14271B]/15 bg-[#FAF9F4] hover:bg-white';

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 no-print ${styleClasses}`}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}
