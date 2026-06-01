'use client';

import { useForm } from 'react-hook-form';
import { RadioGroup } from '@/components/ui/RadioGroup';
import type { Step2Data } from '@/types/quote';

const PARKING_OPTIONS = [
  { value: 'direct', label: 'Accès direct' },
  { value: 'limite', label: 'Limité' },
  { value: 'impossible', label: 'Impossible' },
];

const DEADLINE_OPTIONS = [
  { value: 'flexible', label: 'Flexible' },
  { value: '10j', label: 'Sous 10 jours' },
  { value: '5j', label: 'Sous 5 jours' },
  { value: '48h', label: 'Urgence 48h' },
];

const SPECIAL_TREATMENT_OPTIONS = [
  { value: 'amiante', label: 'Amiante' },
  { value: 'electromenager', label: 'Électroménager' },
  { value: 'peintures', label: 'Peintures & solvants' },
  { value: 'batteries', label: 'Batteries' },
  { value: 'medicaments', label: 'Médicaments' },
];

function Field({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">{label}</span>
        {note && <span className="text-xs text-gray-400">{note}</span>}
      </div>
      {children}
    </div>
  );
}

interface Props {
  defaultValues: Step2Data;
  onNext: (data: Step2Data) => void;
  onBack: () => void;
}

export function Step2Conditions({ defaultValues, onNext, onBack }: Props) {
  const { handleSubmit, watch, setValue } = useForm<Step2Data>({ defaultValues });

  const specialTreatments = watch('specialTreatments') ?? [];
  const insalubrite = watch('insalubrite') ?? false;

  const toggleTreatment = (val: string) => {
    if (specialTreatments.includes(val)) {
      setValue('specialTreatments', specialTreatments.filter((v) => v !== val));
    } else {
      setValue('specialTreatments', [...specialTreatments, val]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <div className="space-y-10">
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-1">Conditions du chantier</h2>
          <p className="text-sm text-gray-400">Étape 2 sur 4</p>
        </div>

        <RadioGroup
          label="Stationnement du camion"
          options={PARKING_OPTIONS}
          value={watch('parking')}
          onChange={(v) => setValue('parking', v as any)}
          cols={0}
        />

        <Field label="Zone piétonne ou ZFE">
          <div className="flex gap-2">
            {[{ label: 'Oui', v: true }, { label: 'Non', v: false }].map(({ label, v }) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setValue('zfe', v)}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                  watch('zfe') === v
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        <RadioGroup
          label="Délai souhaité"
          options={DEADLINE_OPTIONS}
          value={watch('deadline')}
          onChange={(v) => setValue('deadline', v as any)}
          cols={2}
        />

        <Field label="Date souhaitée" note="Optionnel">
          <input
            type="text"
            value={watch('preferredDate') ?? ''}
            onChange={(e) => setValue('preferredDate', e.target.value)}
            placeholder="ex. semaine du 15 juin, ou à partir du 20/06…"
            className="w-full border border-gray-200 rounded-xl px-4 py-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 transition-colors bg-white"
          />
        </Field>

        {/* Special treatments */}
        <Field label="Éléments particuliers" note="Cochez tout ce qui s'applique">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SPECIAL_TREATMENT_OPTIONS.map((opt) => {
              const checked = specialTreatments.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleTreatment(opt.value)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                    checked
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                    checked ? 'bg-white border-white' : 'border-gray-300'
                  }`}>
                    {checked && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Insalubrité — séparé, bloquant */}
        <Field label="Insalubrité ou nuisibles">
          <button
            type="button"
            onClick={() => setValue('insalubrite', !insalubrite)}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border text-sm font-medium transition-all text-left ${
              insalubrite
                ? 'border-amber-400 bg-amber-50 text-amber-800'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
            }`}
          >
            <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
              insalubrite ? 'bg-amber-500 border-amber-500' : 'border-gray-300'
            }`}>
              {insalubrite && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            Le lieu présente des signes d'insalubrité ou de nuisibles
          </button>

          {insalubrite && (
            <div className="mt-3 px-4 py-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-sm font-medium text-amber-800 mb-1">Intervention non prise en charge</p>
              <p className="text-sm text-amber-700">
                Nous n'intervenons pas sur des chantiers présentant des problèmes d'insalubrité ou de nuisibles.
                Nous vous invitons à contacter une entreprise spécialisée en décontamination avant de faire appel à nos services.
              </p>
            </div>
          )}
        </Field>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 border border-gray-200 text-gray-600 py-4 rounded-xl font-medium text-sm hover:border-gray-400 transition-colors"
          >
            Retour
          </button>
          <button
            type="submit"
            disabled={insalubrite}
            className="flex-1 bg-gray-900 text-white py-4 rounded-xl font-medium text-sm tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Voir le devis
          </button>
        </div>
      </div>
    </form>
  );
}
