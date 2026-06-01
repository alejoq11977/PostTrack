import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface ReportStepperProps {
  currentStep: number;
}

const STEPS = [
  { num: 1, label: 'Señales' },
  { num: 2, label: 'Detalles' },
  { num: 3, label: 'Fotos' },
];

export const ReportStepper = ({ currentStep }: ReportStepperProps) => {
  return (
    <div className="flex items-start mb-8">
      {STEPS.map((step, i) => (
        <Fragment key={step.num}>
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className={cn(
              "w-8 h-8 rounded-full border-2 flex items-center justify-center text-[12px] font-bold z-10 transition-colors",
              currentStep > step.num ? "bg-brand-100 border-brand-400 text-brand-600" :
              currentStep === step.num ? "bg-brand-400 border-brand-400 text-white shadow-[0_0_0_4px_rgba(42,170,138,0.15)]" :
              "bg-white border-slate-200 text-slate-400"
            )}>
              {currentStep > step.num ? <Check size={14} strokeWidth={3} /> : step.num}
            </div>
            <span className={cn(
              "text-[11px] font-medium transition-colors",
              currentStep >= step.num ? "text-brand-600" : "text-slate-400"
            )}>
              {step.label}
            </span>
          </div>

          {i !== STEPS.length - 1 && (
            <div className={cn(
              "flex-1 h-[2px] mx-2 mt-4 rounded-full transition-colors",
              currentStep > step.num ? "bg-brand-300" : "bg-slate-200"
            )} />
          )}
        </Fragment>
      ))}
    </div>
  );
};
