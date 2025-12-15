// src/components/TreatmentForm.jsx (НОВЫЙ ФАЙЛ)
import React, { useState } from 'react';

const TreatmentForm = ({ analysis, onPrescribe }) => {
    // Инициализируем текущим планом, если он уже есть
    const [treatmentPlan, setTreatmentPlan] = useState(analysis.results?.treatment_plan || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Проверяем, назначен ли план лечения
    const isPrescribed = !!analysis.results?.treatment_plan;

    // План лечения назначается только, если есть окончательное заключение диагноста
    const isReadyForPrescription = !!analysis.results?.diagnostician_conclusion;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!treatmentPlan.trim()) {
            alert("План лечения не может быть пустым.");
            return;
        }

        setIsSubmitting(true);
        await onPrescribe(analysis.id, treatmentPlan);
        setIsSubmitting(false);
    };

    // Условие для кнопки
    let buttonText = 'Назначить Лечение';
    let buttonColor = '#28a745';

    if (isPrescribed) {
        buttonText = 'Лечение Назначено';
        buttonColor = '#6c757d'; // Серый
    } else if (!isReadyForPrescription) {
        buttonText = 'Ожидание Заключения Диагноста';
        buttonColor = '#ffc107'; // Желтый
    } else if (isSubmitting) {
        buttonText = 'Отправка...';
    }

    return (
        <div style={styles.formContainer}>
            <h4 style={styles.title}>План Лечения</h4>

            <form onSubmit={handleSubmit}>
                <textarea
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    placeholder="Введите план лечения (назначенные препараты, процедуры, рекомендации)..."
                    rows="3"
                    disabled={isPrescribed || !isReadyForPrescription || isSubmitting}
                    style={styles.textarea}
                />

                <button
                    type="submit"
                    disabled={isSubmitting || isPrescribed || !isReadyForPrescription}
                    style={{ ...styles.button, backgroundColor: buttonColor }}
                >
                    {buttonText}
                </button>
            </form>
        </div>
    );
};

const styles = {
    formContainer: {
        marginTop: '15px',
        padding: '10px',
        borderTop: '1px solid #ccc'
    },
    title: {
        marginBottom: '10px'
    },
    textarea: {
        width: '100%',
        padding: '8px',
        boxSizing: 'border-box',
        borderRadius: '4px',
        border: '1px solid #ddd',
        marginBottom: '10px'
    },
    button: {
        padding: '8px 15px',
        borderRadius: '4px',
        cursor: 'pointer',
        border: 'none',
        color: 'white',
        fontWeight: 'bold',
        float: 'right'
    }
};

export default TreatmentForm;