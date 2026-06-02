'use client';

import { useState } from 'react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Step1Contact } from '@/components/steps/Step1Contact';
import { Step1Property } from '@/components/steps/Step1Property';
import { Step2Conditions } from '@/components/steps/Step2Conditions';
import { Step3Quote } from '@/components/steps/Step3Quote';
import type { ContactData, Step1Data, Step2Data, QuoteFormData } from '@/types/quote';

const DEFAULT_CONTACT: ContactData = {
  clientName: '',
  clientEmail: '',
  phoneNumber: '',
  dialCode: '+33',
  whatsapp: false,
};

const DEFAULT_STEP1: Step1Data = {
  address: '',
  propertyType: 't2',
  surface: 50,
  floor: 'rdc',
  elevator: false,
};

const DEFAULT_STEP2: Step2Data = {
  parking: 'direct',
  zfe: false,
  deadline: 'flexible',
  specialTreatments: [],
  insalubrite: false,
};

export default function Home() {
  const [step, setStep] = useState(1);
  const [contactData, setContactData] = useState<ContactData>(DEFAULT_CONTACT);
  const [step1Data, setStep1Data] = useState<Step1Data>(DEFAULT_STEP1);
  const [step2Data, setStep2Data] = useState<Step2Data>(DEFAULT_STEP2);

  const formData: QuoteFormData = { ...step1Data, ...step2Data };

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Top nav */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="font-medium text-gray-900 text-sm tracking-wide">NETTORIA</span>
          </div>
          <span className="text-xs text-gray-400">Spécialiste du débarras</span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-xl mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-8 py-10 sm:px-10 sm:py-12">
          <ProgressBar currentStep={step} />

          <div key={step} className="animate-slide-up">
            {step === 1 && (
              <Step1Contact
                defaultValues={contactData}
                onNext={(data) => { setContactData(data); setStep(2); }}
              />
            )}
            {step === 2 && (
              <Step1Property
                defaultValues={step1Data}
                onNext={(data) => { setStep1Data(data); setStep(3); }}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <Step2Conditions
                defaultValues={step2Data}
                onNext={(data) => { setStep2Data(data); setStep(4); }}
                onBack={() => setStep(2)}
              />
            )}
            {step === 4 && (
              <Step3Quote
                formData={formData}
                contactData={contactData}
                onBack={() => setStep(3)}
              />
            )}
          </div>
        </div>
      </main>

      <footer className="max-w-xl mx-auto px-6 pb-8">
        <p className="text-xs text-gray-400 text-center">
          Devis sans engagement · Valable 10 jours · project.nettoria@gmail.com
        </p>
      </footer>
    </div>
  );
}
