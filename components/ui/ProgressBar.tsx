'use client';

const STEPS = [
  { number: 1, label: 'Le bien' },
  { number: 2, label: 'Conditions' },
  { number: 3, label: 'Devis' },
  { number: 4, label: 'Envoi' },
];

export function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-12">
      {/* Bar */}
      <div className="relative h-0.5 bg-gray-200 mb-6">
        <div
          className="absolute inset-y-0 left-0 bg-gray-900 transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
      {/* Labels */}
      <div className="flex justify-between">
        {STEPS.map((step) => {
          const done = step.number < currentStep;
          const active = step.number === currentStep;
          return (
            <div key={step.number} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  done
                    ? 'bg-gray-900 text-white'
                    : active
                    ? 'bg-gray-900 text-white ring-4 ring-gray-900/10'
                    : 'bg-white border border-gray-300 text-gray-400'
                }`}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span className={`text-xs tracking-wide ${active ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
