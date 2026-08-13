import Link from 'next/link';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export function Logo({ className = '', variant = 'light' }: LogoProps) {
  const isDark = variant === 'dark';
  
  return (
    <Link 
      href="/" 
      className={`group flex items-center gap-2 tracking-tight ${isDark ? 'text-white' : 'text-foreground'} ${className}`}
    >
      <span className="text-2xl transition-transform group-hover:scale-105" aria-hidden="true">🎓</span>
      <span className="flex items-baseline">
        <span className={`font-display text-lg ${isDark ? 'font-extrabold' : 'font-semibold'}`}>ScholarHub</span>
        <span className={`hidden font-mono text-[10px] uppercase tracking-widest sm:inline ml-1.5 ${isDark ? 'text-[#14b8a6] opacity-90' : 'text-muted-foreground opacity-70'}`}>
          / Africa
        </span>
      </span>
    </Link>
  );
}
