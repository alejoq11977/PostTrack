import { useState, useEffect } from 'react';
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

  const handleImageUpload = (index: number, file: File) => {
    const newImages = [...images];
    newImages[index] = file;
    setImages(newImages);
  };

  const removeImage = (index: number) => {
    const newImages =[...images];
    newImages[index] = null;
    setImages(newImages);
  };

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

      const riskResult: RiskEvaluationResult = await patientsService.evaluateRisk(answersForEvaluation);

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
    generalAnswers, setGeneralAnswers,
    customAnswers, setCustomAnswers,
    medicalNotes, setMedicalNotes,
    images, handleImageUpload, removeImage,
    expandedInfo, setExpandedInfo,
    isSubmitting, isSuccess,
    isStep1Complete, isStep2Complete,
    handleSubmit, navigate
  };
};