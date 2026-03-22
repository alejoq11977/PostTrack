import { Check } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface ReportStepperProps {
  currentStep: number;
}

export const ReportStepper = ({ currentStep }: ReportStepperProps) => {
  return (
    <div className="flex items-center mb-8">
      {[1, 2, 3].map((num) => (
        <div key={num} className={cn("flex items-center relative", num !== 3 && "flex-1")}>
          
          <div className={cn(
            "w-8 h-8 rounded-full border-2 flex items-center justify-center text-[12px] font-bold shrink-0 z-10 transition-colors",
            currentStep > num ? "bg-brand-100 border-brand-400 text-brand-600" :
            currentStep === num ? "bg-brand-400 border-brand-400 text-white shadow-[0_0_0_4px_rgba(42,170,138,0.15)]" :
            "bg-white border-slate-200 text-slate-400"
          )}>
            {currentStep > num ? <Check size={14} strokeWidth={3} /> : num}
          </div>
          
          {num !== 3 && (
            <div className={cn(
              "h-[2px] w-full mx-2 transition-colors",
              currentStep > num ? "bg-brand-200" : "bg-slate-200"
            )}></div>
          )}
          
        </div>
      ))}
    </div>
  );
};