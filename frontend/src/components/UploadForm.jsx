// src/components/UploadForm.jsx
import React, { useState } from 'react';
import { uploadAnalysis } from '../api/analysis';

const UploadForm = ({ onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [patientMrn, setPatientMrn] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file || !patientMrn) {
            setError('Пожалуйста, выберите файл и введите MRN пациента.');
            return;
        }

        setLoading(true);
        setMessage('');
        setError(null);

        try {
            const result = await uploadAnalysis(file, patientMrn);

            setMessage(`✅ Анализ успешно запущен! ID: ${result.analysis_id}. Диагноз системы: ${result.system_diagnosis}`);

            // Сброс формы
            setFile(null);
            setPatientMrn('');

            // Уведомление родительского компонента об успехе (для обновления истории)
            if (onUploadSuccess) {
                onUploadSuccess();
            }

        } catch (err) {
            console.error("Upload error:", err.response ? err.response.data : err);
            const detail = err.response?.data?.detail || 'Неизвестная ошибка при загрузке.';
            setError(`❌ Ошибка загрузки: ${detail}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={styles.form}>
            {/* MRN Пациента */}
            <label style={styles.label}>Медицинский номер записи (MRN):</label>
            <input
                type="text"
                value={patientMrn}
                onChange={(e) => setPatientMrn(e.target.value)}
                placeholder="Введите MRN пациента"
                required
                style={styles.input}
            />

            {/* Выбор Файла */}
            <label style={styles.label}>Выберите медицинский снимок (JPEG/PNG):</label>
            <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files[0])}
                required
                style={styles.fileInput}
            />

            {/* Информация о выбранном файле */}
            {file && <p style={styles.fileInfo}>Выбран файл: **{file.name}** ({Math.round(file.size / 1024)} KB)</p>}

            {/* Сообщения */}
            {error && <p style={styles.error}>{error}</p>}
            {message && <p style={styles.success}>{message}</p>}

            {/* Кнопка */}
            <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Запуск анализа...' : 'Загрузить и Анализировать'}
            </button>
        </form>
    );
};

// Простые стили
const styles = {
    form: {
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        marginBottom: '30px',
        backgroundColor: '#fff',
    },
    label: {
        display: 'block',
        marginTop: '10px',
        fontWeight: 'bold',
        marginBottom: '5px',
    },
    input: {
        width: '100%',
        padding: '8px',
        marginBottom: '10px',
        boxSizing: 'border-box',
        borderRadius: '4px',
        border: '1px solid #ccc',
    },
    fileInput: {
        padding: '10px 0',
        marginBottom: '10px',
    },
    fileInfo: {
        fontSize: '0.9em',
        color: '#555',
        marginBottom: '15px',
    },
    button: {
        padding: '10px 15px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    error: {
        color: 'red',
        fontWeight: 'bold',
    },
    success: {
        color: 'green',
        fontWeight: 'bold',
    }
};

export default UploadForm;