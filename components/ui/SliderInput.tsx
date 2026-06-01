'use client';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function SliderInput({ label, value, min, max, unit = '', onChange }: SliderInputProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">{label}</span>
        <span className="text-3xl font-light text-gray-900 tabular-nums">
          {value}<span className="text-base ml-1 text-gray-400">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{
          background: `linear-gradient(to right, #111 ${pct}%, #e5e7eb ${pct}%)`,
        }}
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}
