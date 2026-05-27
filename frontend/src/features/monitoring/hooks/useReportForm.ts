import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsService } from '@/features/patients/api/patients.service';
import { MonitoringForm } from '@/features/patients/types/patient.model';
import { RiskEvaluationResult } from '@/features/patients/api/patients.service';

export const useReportForm = (monitoringId: string | undefined) => {
  const navigate = useNavigate();
  
  const[formData, setFormData] = useState<MonitoringForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [step, setStep] = useState(1);
  const [generalAnswers, setGeneralAnswers] = useState<Record<number, 'yes' | 'no'>>({});
  const [customAnswers, setCustomAnswers] = useState<Record<number, string>>({});
  const [medicalNotes, setMedicalNotes] = useState('');
  const[images, setImages] = useState<(File | null)[]>([null, null, null, null]);
  
  const [expandedInfo, setExpandedInfo] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!monitoringId) return;

    const fetchForm = async () => {
      try {
        const data = await patientsService.getMonitoringForm(Number(monitoringId));
        setFormData(data);
      } catch (error) {
        console.error("Error cargando formulario:", error);
        navigate('/'); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchForm();
  }, [monitoringId, navigate]);

  // Callbacks estables: permiten memoizar las filas de preguntas y las miniaturas
  // para que un cambio solo re-renderice el elemento afectado, no todo el formulario.
  const setGeneralAnswer = useCallback((id: number, value: 'yes' | 'no') => {
    setGeneralAnswers(prev => ({ ...prev, [id]: value }));
  }, []);

  const setCustomAnswer = useCallback((id: number, value: string) => {
    setCustomAnswers(prev => ({ ...prev, [id]: value }));
  }, []);

  const toggleExpandedInfo = useCallback((id: number) => {
    setExpandedInfo(prev => (prev === id ? null : id));
  }, []);

  const handleImageUpload = useCallback((index: number, file: File) => {
    setImages(prev => {
      const newImages = [...prev];
      newImages[index] = file;
      return newImages;
    });
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      newImages[index] = null;
      return newImages;
    });
  }, []);

  const isStep1Complete = formData?.general_questions.every(q => generalAnswers[q.id]) ?? false;
  const isStep2Complete = formData?.monitoring.custom_questions.every(
    cq => customAnswers[cq.id] && customAnswers[cq.id].trim() !== ''
  ) ?? true;

  const handleSubmit = async () => {
    if (!monitoringId) return;
    setIsSubmitting(true);
    
    try {
      await patientsService.submitReport({
        monitoringId: Number(monitoringId),
        generalAnswers,
        customAnswers,
        medicalNotes,
        images,
      });

      const answersForEvaluation = Object.entries(generalAnswers).map(([qId, answer]) => ({
        question_id: parseInt(qId),
        answer: answer === 'yes'
      }));

      const riskResult: RiskEvaluationResult = await patientsService.evaluateRisk(
        answersForEvaluation,
        Number(monitoringId)
      );

      setIsSuccess(true);
      navigate('/form-result', { state: { result: riskResult } });
    } catch (error) {
      console.error("Error al enviar el reporte:", error);
      alert("Ocurrió un error al enviar el reporte. Por favor, revise su conexión e intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData, isLoading, step, setStep,
    generalAnswers, setGeneralAnswers, setGeneralAnswer,
    customAnswers, setCustomAnswers, setCustomAnswer,
    medicalNotes, setMedicalNotes,
    images, handleImageUpload, removeImage,
    expandedInfo, setExpandedInfo, toggleExpandedInfo,
    isSubmitting, isSuccess,
    isStep1Complete, isStep2Complete,
    handleSubmit, navigate
  };
};