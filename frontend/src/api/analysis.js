// src/api/analysis.js
import axios from 'axios';

/**
 * Загружает изображение и запускает CV анализ на бэкенде.
 * @param {File} file - Загружаемое изображение.
 * @param {string} patientMrn - Медицинский номер записи пациента (MRN).
 * @returns {Promise<object>} Результаты анализа.
 */
export const uploadAnalysis = async (file, patientMrn) => {
    // FastAPI ожидает данные в формате FormData для обработки файлов и полей Form(...)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_mrn', patientMrn);

    // Axios автоматически установит Content-Type: multipart/form-data
    const response = await axios.post(
        '/v1/analyses/upload_analysis',
        formData
    );

    return response.data;
};

// --- Функция для получения списка анализов (для истории) ---
/**
 * Получает историю анализов для текущего диагноста.
 * (Этот маршрут мы еще не реализовали на FastAPI, но готовим функцию)
 */
export const fetchAnalysisHistory = async () => {
    // Предполагаемый маршрут
    const response = await axios.get('/v1/analyses/my_history');
    return response.data;
};


/**
 * Получает полный анализ по ID.
 */
export const fetchAnalysisDetails = async (analysisId) => {
    const response = await axios.get(`/v1/analyses/${analysisId}`);
    return response.data;
};

/**
 * Отправляет окончательное заключение и обратную связь.
 * @param {number} analysisId
 * @param {string} conclusion - Окончательное заключение врача.
 * @param {boolean} isCorrect - Обратная связь: true, если диагноз системы корректен.
 */
export const confirmDiagnosis = async (analysisId, conclusion, isCorrect) => {
    const response = await axios.post(`/v1/analyses/${analysisId}/confirm`, {
        conclusion: conclusion,
        is_correct: isCorrect,
    });
    return response.data;
};


/**
 * Получает полную историю анализов пациента по MRN.
 */
export const fetchPatientHistory = async (mrn) => {
    // Используем новый маршрут /v1/patients/
    const response = await axios.get(`/v1/patients/${mrn}/history`);
    return response.data; // Возвращает объект { patient: {...}, analyses: [...] }
};

/**
 * Отправляет план лечения для конкретного анализа.
 */
export const prescribeTreatment = async (analysisId, treatmentPlan) => {
    // Используем новый маршрут /v1/patients/analyses/
    const response = await axios.post(`/v1/patients/analyses/${analysisId}/prescribe`, {
        treatment_plan: treatmentPlan,
    });
    return response.data;
};