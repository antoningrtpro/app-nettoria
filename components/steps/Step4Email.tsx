'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { generateQuotePDF } from '@/lib/pdf-generator';
import type { PricingBreakdown, QuoteFormData } from '@/types/quote';

const COUNTRY_CODES = [
  { code: '+33', flag: '🇫🇷', label: 'FR' },
  { code: '+32', flag: '🇧🇪', label: 'BE' },
  { code: '+41', flag: '🇨🇭', label: 'CH' },
  { code: '+352', flag: '🇱🇺', label: 'LU' },
  { code: '+212', flag: '🇲🇦', label: 'MA' },
  { code: '+213', flag: '🇩🇿', label: 'DZ' },
  { code: '+216', flag: '🇹🇳', label: 'TN' },
  { code: '+44', flag: '🇬🇧', label: 'GB' },
  { code: '+1', flag: '🇺🇸', label: 'US/CA' },
];

interface EmailFormData {
  clientName: string;
  clientEmail: string;
  phoneNumber: string;
  whatsapp: boolean;
}

interface Props {
  formData: QuoteFormData;
  breakdown: PricingBreakdown;
  onBack: () => void;
}

export function Step4Email({ formData, breakdown, onBack }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [dialCode, setDialCode] = useState('+33');
  const [showDialPicker, setShowDialPicker] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<EmailFormData>({
    defaultValues: { whatsapp: false },
  });

  const whatsapp = watch('whatsapp');
  const fullPhone = `${dialCode} ${watch('phoneNumber') ?? ''}`.trim();

  const onSubmit = async (data: EmailFormData) => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const phone = `${dialCode} ${data.phoneNumber}`.trim();
      const pdfBase64 = await generateQuotePDF(formData, breakdown, data.clientName, data.clientEmail);

      // Send email + webhook in parallel
      const [emailRes] = await Promise.all([
        fetch('/api/send-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: data.clientName,
            clientEmail: data.clientEmail,
            clientPhone: phone,
            whatsapp: data.whatsapp,
            address: formData.address,
            pdfBase64,
            formData,
            breakdown,
          }),
        }),
      ]);

      if (!emailRes.ok) throw new Error('Erreur envoi');
      setStatus('success');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || 'Une erreur est survenue');
    }
  };

  if (status === 'success') {
    return (
      <div className="animate-slide-up py-8 text-center space-y-6">
        <div className="w-16 h-16 bg-[#0EA5E9] rounded-full flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-2">Demande envoyée</h2>
          <p className="text-sm text-gray-500">Nous avons bien reçu votre demande et vous recontacterons très prochainement.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5 text-left space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-widest">Récapitulatif</p>
          <p className="text-sm text-gray-600">{formData.address}</p>
          <p className="text-2xl font-light text-gray-900 tabular-nums pt-1">
            {breakdown.totalHT.toFixed(2)} € <span className="text-sm font-normal text-gray-400">HT</span>
          </p>
          <p className="text-xs text-gray-400">Devis valable 10 jours</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="border border-gray-200 text-gray-600 px-8 py-3 rounded-xl text-sm font-medium hover:border-gray-400 transition-colors"
        >
          Nouveau devis
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-10">
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-1">Recevoir le devis</h2>
          <p className="text-sm text-gray-400">
            Total estimé :{' '}
            <span className="text-gray-900 font-medium">{breakdown.totalHT.toFixed(2)} € HT</span>
          </p>
        </div>

        <div className="space-y-4">
          {/* Nom */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500 uppercase tracking-widest">Votre nom</label>
            <input
              {...register('clientName', { required: 'Requis' })}
              placeholder="Jean Dupont"
              className="w-full border border-gray-200 rounded-xl px-4 py-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0EA5E9] transition-colors bg-white"
            />
            {errors.clientName && <p className="text-red-500 text-xs">{errors.clientName.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500 uppercase tracking-widest">Adresse e-mail</label>
            <input
              {...register('clientEmail', {
                required: 'Requis',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'E-mail invalide' },
              })}
              type="email"
              placeholder="jean@exemple.fr"
              className="w-full border border-gray-200 rounded-xl px-4 py-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0EA5E9] transition-colors bg-white"
            />
            {errors.clientEmail && <p className="text-red-500 text-xs">{errors.clientEmail.message}</p>}
          </div>

          {/* Téléphone avec indicatif */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500 uppercase tracking-widest">Téléphone</label>
            <div className="flex gap-2">
              {/* Sélecteur indicatif */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDialPicker((v) => !v)}
                  className="h-full flex items-center gap-1.5 px-3 py-4 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors whitespace-nowrap"
                >
                  <span>{COUNTRY_CODES.find((c) => c.code === dialCode)?.flag}</span>
                  <span className="tabular-nums">{dialCode}</span>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-gray-400">
                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {showDialPicker && (
                  <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden w-44">
                    {COUNTRY_CODES.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => { setDialCode(c.code); setShowDialPicker(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${dialCode === c.code ? 'bg-gray-50 font-medium' : ''}`}
                      >
                        <span>{c.flag}</span>
                        <span className="text-gray-500 text-xs">{c.label}</span>
                        <span className="ml-auto tabular-nums text-gray-700">{c.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Numéro */}
              <input
                {...register('phoneNumber', {
                  required: 'Requis',
                  pattern: { value: /^[0-9\s\-().]{6,15}$/, message: 'Numéro invalide' },
                })}
                type="tel"
                placeholder="6 12 34 56 78"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0EA5E9] transition-colors bg-white"
              />
            </div>
            {errors.phoneNumber && <p className="text-red-500 text-xs">{errors.phoneNumber.message}</p>}
          </div>

          {/* WhatsApp */}
          <label className={`flex items-center gap-4 px-4 py-4 rounded-xl border cursor-pointer transition-all ${
            whatsapp ? 'border-[#25D366] bg-[#25D366]/5' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}>
            <input type="checkbox" {...register('whatsapp')} className="sr-only" />
            <span className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
              whatsapp ? 'bg-[#25D366] border-[#25D366]' : 'border-gray-300'
            }`}>
              {whatsapp && (
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1.5 5.5l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            <div className="text-left flex-1">
              <span className={`text-sm font-medium block ${whatsapp ? 'text-[#128C7E]' : 'text-gray-700'}`}>
                Recevoir mon devis sur WhatsApp
              </span>
              <span className="text-xs text-gray-400">Nous vous enverrons le PDF sur ce numéro</span>
            </div>
            <svg className="flex-shrink-0" width="22" height="22" viewBox="0 0 24 24" fill={whatsapp ? '#25D366' : '#d1d5db'}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </label>
        </div>

        {status === 'error' && (
          <p className="text-sm text-red-500">{errorMsg || 'Une erreur est survenue. Réessayez.'}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={status === 'loading'}
            className="flex-1 border border-gray-200 text-gray-600 py-4 rounded-xl font-medium text-sm hover:border-gray-400 transition-colors disabled:opacity-50"
          >
            Retour
          </button>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="flex-1 bg-[#0EA5E9] text-white py-4 rounded-xl font-medium text-sm tracking-wide hover:bg-[#0284C7] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Envoi…
              </>
            ) : (
              'Envoyer le devis'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
