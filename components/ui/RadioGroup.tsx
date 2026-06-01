'use client';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  cols?: number;
}

export function RadioGroup({ label, options, value, onChange, cols = 0 }: RadioGroupProps) {
  const gridClass = cols === 2
    ? 'grid grid-cols-2 gap-2'
    : cols === 4
    ? 'grid grid-cols-2 sm:grid-cols-4 gap-2'
    : 'flex flex-wrap gap-2';

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">{label}</span>
      <div className={gridClass}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`px-5 py-3 rounded-xl border text-sm font-medium transition-all duration-200 text-left ${
                active
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
              }`}
            >
              <span className="block">{opt.label}</span>
              {opt.description && (
                <span className={`block text-xs mt-0.5 font-normal ${active ? 'text-gray-300' : 'text-gray-400'}`}>
                  {opt.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
