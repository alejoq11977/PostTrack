import { CheckCircle2, AlertTriangle, XCircle, Home } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RiskEvaluationResult } from '@/features/patients/api/patients.service';

const RECOMMENDATIONS = {
  LOW: {
    icon: CheckCircle2,
    bgColor: 'bg-green-50 border-green-100',
    iconColor: 'text-green-500',
    title: 'Reporte enviado exitosamente',
    message: 'Su reporte ha sido recibido exitosamente. El equipo veterinario lo revisará y se comunicará con usted si hay alguna novedad. En caso de dudas, puede contactarnos.'
  },
  MEDIUM: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 border-yellow-100',
    iconColor: 'text-yellow-500',
    title: 'Reporte enviado',
    message: 'Su reporte ha sido enviado. Le recomendamos estar atento a cualquier cambio y contactarnos si nota algo fuera de lo normal. El equipo veterinario evaluará la información y se pondrá en contacto con usted si es necesario.'
  },
  HIGH: {
    icon: AlertTriangle,
    bgColor: 'bg-orange-50 border-orange-100',
    iconColor: 'text-orange-500',
    title: 'Reporte recibido',
    message: 'Su reporte ha sido recibido. Dada la información proporcionada, le recomendamos contactar a la clínica a la brevedad para discutir los próximos pasos. Nuestro equipo está disponible para atenderle.'
  }
};

export const FormResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as { result: RiskEvaluationResult } | null;
  const result = state?.result;

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-500 mb-4">No se encontró información del resultado.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-brand-400 text-white font-semibold rounded-lg hover:bg-brand-500 transition-colors"
        >
          Volver a mis mascotas
        </button>
      </div>
    );
  }

  const config = RECOMMENDATIONS[result.level];
  const Icon = config.icon;

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`rounded-2xl border-2 ${config.bgColor} p-8 text-center mb-6`}>
        <div className={`w-20 h-20 rounded-full bg-white border-4 ${config.iconColor} flex items-center justify-center mx-auto mb-4`}>
          <Icon size={40} className={config.iconColor} />
        </div>
        <h2 className="font-display text-3xl text-slate-800 mb-2">{config.title}</h2>
        <p className="text-slate-600 leading-relaxed text-[15px]">{config.message}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
        <p className="text-sm text-slate-500">
          Puede consultar el historial de sus reportes en cualquier momento para ver el estado de su reporte.
        </p>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-400 text-white font-semibold rounded-lg hover:bg-brand-500 transition-colors"
        >
          <Home size={18} />
          Volver a mis mascotas
        </button>
      </div>
    </div>
  );
};