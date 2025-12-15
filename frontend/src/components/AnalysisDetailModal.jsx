// src/components/AnalysisDetailModal.jsx
import React, { useState } from 'react';

const API_BASE_URL = "http://127.0.0.1:8000";

const AnalysisDetailModal = ({ analysis, onClose, onConfirm }) => {
    const [conclusion, setConclusion] = useState(analysis.results.diagnostician_conclusion || '');
    const [isCorrect, setIsCorrect] = useState(analysis.results.feedback_correct === 1 ? true : false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isConfirmed = analysis.results.is_confirmed;

    // В реальной жизни пути к файлам должны быть настроены через статические маршруты FastAPI
    const originalImageUrl = `${API_BASE_URL}/${analysis.image_path}`;
    const segmentationImageUrl = `${API_BASE_URL}/${analysis.results.system_segmentation_path}`;

    const handleConfirm = async () => {
        if (!conclusion.trim()) {
            alert("Заключение не может быть пустым.");
            return;
        }
        setIsSubmitting(true);
        // Вызываем функцию, переданную с дашборда
        await onConfirm(analysis.id, conclusion, isCorrect);
        setIsSubmitting(false);
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <button onClick={onClose} style={styles.closeButton}>&times;</button>
                <h2>Детали Анализа #{analysis.id}</h2>
                <p>Пациент: **{analysis.patient.last_name}** ({analysis.patient.medical_record_number})</p>
                <hr />

                {/* --- 1. Просмотр Изображений --- */}
                <div style={styles.imageContainer}>
                    <div style={styles.imageBox}>
                        <h4>Оригинальный Снимок</h4>
                        {/* ⚠️ Примечание: Для работы этого тега бэкенд должен отдавать статические файлы! */}
                        <img src={originalImageUrl} alt="Оригинальный снимок" style={styles.image} />
                    </div>
                    <div style={styles.imageBox}>
                        <h4>Сегментация CV (Аномалии)</h4>
                        {/* ⚠️ Заглушечный путь к маске, замените на реальную маску */}
                        <img src={segmentationImageUrl} alt="Маска сегментации" style={styles.image} />
                    </div>
                </div>

                {/* --- 2. Результаты Системы --- */}
                <h4 style={styles.sectionTitle}>Результат Компьютерного Зрения</h4>
                <p style={styles.systemDiagnosis}>**{analysis.results.system_diagnosis}**</p>

                {/* --- 3. Форма Подтверждения и Корректировки --- */}
                <h4 style={styles.sectionTitle}>{isConfirmed ? 'Окончательное Заключение (Подтверждено)' : 'Ввод Заключения'}</h4>

                <textarea
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    placeholder="Введите окончательный диагноз и заключение..."
                    rows="4"
                    disabled={isConfirmed}
                    style={styles.textarea}
                />

                {/* Обратная связь */}
                {!isConfirmed && (
                    <div style={styles.feedbackSection}>
                        <label>
                            <input
                                type="checkbox"
                                checked={isCorrect}
                                onChange={(e) => setIsCorrect(e.target.checked)}
                            />
                            &nbsp; **Вывод системы корректен (Обратная связь для обучения)**
                        </label>
                    </div>
                )}

                {/* Кнопка действия */}
                <button
                    onClick={handleConfirm}
                    disabled={isSubmitting || isConfirmed}
                    style={styles.confirmButton}
                >
                    {isConfirmed ? 'Заключение Подтверждено' : (isSubmitting ? 'Отправка...' : 'Подтвердить и Сохранить')}
                </button>
            </div>
        </div>
    );
};

// Стили для модального окна
const styles = {
    modalOverlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1000
    },
    modalContent: {
        backgroundColor: 'white', padding: '30px', borderRadius: '8px',
        width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto',
        position: 'relative'
    },
    closeButton: {
        position: 'absolute', top: '10px', right: '15px',
        fontSize: '24px', cursor: 'pointer', background: 'none', border: 'none'
    },
    imageContainer: {
        display: 'flex', gap: '20px', margin: '20px 0'
    },
    imageBox: {
        flex: 1, textAlign: 'center'
    },
    image: {
        width: '100%', height: 'auto', border: '1px solid #ccc'
    },
    systemDiagnosis: {
        fontSize: '1.1em', fontWeight: 'bold', color: '#007bff'
    },
    sectionTitle: {
        marginTop: '20px', borderBottom: '1px solid #eee', paddingBottom: '5px'
    },
    textarea: {
        width: '100%', padding: '10px', boxSizing: 'border-box',
        borderRadius: '4px', border: '1px solid #ccc', marginTop: '10px'
    },
    feedbackSection: {
        margin: '15px 0', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '4px'
    },
    confirmButton: {
        padding: '10px 20px', backgroundColor: '#28a745', color: 'white',
        border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px'
    }
};

export default AnalysisDetailModal;