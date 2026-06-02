'use client';

interface BadgeProps {
  label: string;
  variant: 'dark' | 'red' | 'orange' | 'blue';
}

const VARIANTS = {
  dark: 'bg-[#0EA5E9] text-white',
  red: 'bg-red-50 text-red-600 border border-red-200',
  orange: 'bg-amber-50 text-amber-700 border border-amber-200',
  blue: 'bg-blue-50 text-blue-600 border border-blue-200',
};

export function Badge({ label, variant }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${VARIANTS[variant]}`}>
      {label}
    </span>
  );
}
