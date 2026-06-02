'use client';

import { useForm } from 'react-hook-form';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { SliderInput } from '@/components/ui/SliderInput';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import type { Step1Data } from '@/types/quote';

const PROPERTY_TYPES = [
  { value: 'studio', label: 'Studio' },
  { value: 't2', label: 'T2' },
  { value: 't3', label: 'T3' },
  { value: 't4plus', label: 'T4+' },
  { value: 'maison', label: 'Maison' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'cave', label: 'Cave / Grenier' },
];

const FLOORS = [
  { value: 'rdc', label: 'Rez-de-chaussée' },
  { value: '1-2', label: '1er – 2e' },
  { value: '3-4', label: '3e – 4e' },
  { value: '5+', label: '5e et au-dessus' },
];

const NO_FLOOR_TYPES = ['maison', 'cave'];

interface Props {
  defaultValues: Step1Data;
  onNext: (data: Step1Data) => void;
}

function Field({ label, note, children, error }: { label: string; note?: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">{label}</span>
        {note && <span className="text-xs text-gray-400 italic">{note}</span>}
      </div>
      {children}
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

export function Step1Property({ defaultValues, onNext }: Props) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Step1Data>({
    defaultValues,
  });

  const propertyType = watch('propertyType');
  const floor = watch('floor');
  const surface = watch('surface') ?? 50;

  const showFloor = !NO_FLOOR_TYPES.includes(propertyType);
  const showElevator = showFloor && floor && floor !== 'rdc';

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <div className="space-y-10">
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-1">Le bien à débarrasser</h2>
          <p className="text-sm text-gray-400">Étape 1 sur 4</p>
        </div>

        {/* Address */}
        <Field label="Adresse" note="Nous intervenons uniquement en France Métropolitaine">
          <AddressAutocomplete
            value={watch('address') ?? ''}
            onChange={({ label, lat, lon }) => {
              setValue('address', label, { shouldValidate: true });
              setValue('addressLat', lat);
              setValue('addressLon', lon);
            }}
            error={errors.address?.message}
          />
          <input type="hidden" {...register('address', { required: "L'adresse est requise" })} />
        </Field>

        {/* Property type */}
        <Field label="Type de bien">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PROPERTY_TYPES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue('propertyType', opt.value as any)}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  propertyType === opt.value
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Surface */}
        <Field label="Superficie">
          <SliderInput value={surface} min={10} max={300} unit="m²" label="" onChange={(v) => setValue('surface', v)} />
        </Field>

        {/* Floor */}
        {showFloor && (
          <RadioGroup
            label="Étage"
            options={FLOORS}
            value={floor ?? 'rdc'}
            onChange={(v) => setValue('floor', v as any)}
            cols={2}
          />
        )}

        {/* Elevator */}
        {showElevator && (
          <Field label="Ascenseur disponible">
            <div className="flex gap-2">
              {[{ label: 'Oui', v: true }, { label: 'Non', v: false }].map(({ label, v }) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setValue('elevator', v)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                    watch('elevator') === v
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
        )}

        <button
          type="submit"
          className="w-full bg-gray-900 text-white py-4 rounded-xl font-medium text-sm tracking-wide hover:bg-gray-800 transition-colors"
        >
          Continuer
        </button>
      </div>
    </form>
  );
}
