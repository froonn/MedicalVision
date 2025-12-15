// src/pages/ClinicianDashboard.jsx (НОВЫЙ ФАЙЛ)
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchPatientHistory, prescribeTreatment } from '../api/analysis';

// Новый компонент для ввода лечения
import TreatmentForm from '../components/TreatmentForm';

const ClinicianDashboard = () => {
    const { user, logout } = useAuth();
    const [mrn, setMrn] = useState('');
    const [patientData, setPatientData] = useState(null); // { patient, analyses }
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- 1. Обработка Поиска ---
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!mrn.trim()) return;

        setIsLoading(true);
        setError(null);
        setPatientData(null);

        try {
            const data = await fetchPatientHistory(mrn.trim());
            setPatientData(data);
        } catch (e) {
            console.error("Ошибка поиска пациента:", e.response?.data || e);
            setError(`Пациент с MRN ${mrn} не найден.`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- 2. Обработка Назначения Лечения (передается в TreatmentForm) ---
    const handlePrescribe = async (analysisId, treatmentPlan) => {
        try {
            await prescribeTreatment(analysisId, treatmentPlan);
            alert("План лечения успешно назначен!");

            // После успешного назначения, перезагружаем историю, чтобы обновить данные
            const data = await fetchPatientHistory(mrn.trim());
            setPatientData(data);

        } catch (e) {
            alert("Ошибка при назначении лечения.");
            console.error(e.response?.data || e);
        }
    };

    return (
        <div style={styles.dashboardContainer}>
            <div style={styles.header}>
                <h1>🩺 Дашборд Врача-клинициста</h1>
                <div style={styles.userInfo}>
                    <p>Добро пожаловать, **{user.username}**</p>
                    <button onClick={logout} style={{ ...styles.button, backgroundColor: 'red' }}>Выйти</button>
                </div>
            </div>

            {/* Форма поиска */}
            <form onSubmit={handleSearch} style={styles.searchForm}>
                <input
                    type="text"
                    value={mrn}
                    onChange={(e) => setMrn(e.target.value)}
                    placeholder="Введите MRN пациента (Medical Record Number)"
                    style={styles.input}
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading} style={styles.searchButton}>
                    {isLoading ? 'Поиск...' : 'Найти ЭМК'}
                </button>
            </form>

            {error && <p style={styles.errorText}>{error}</p>}

            {/* Отображение Истории Пациента */}
            {patientData && (
                <div style={styles.historySection}>
                    <h2>Электронная Медицинская Карта</h2>
                    <p>ФИО: **{patientData.patient.last_name} {patientData.patient.first_name}**</p>
                    <p>MRN: **{patientData.patient.medical_record_number}**</p>
                    <hr />

                    {patientData.analyses.map((analysis) => (
                        <div key={analysis.id} style={styles.analysisCard}>
                            <h3>Анализ от {new Date(analysis.date_of_analysis).toLocaleDateString()} (ID: {analysis.id})</h3>

                            <p>Диагноз системы: <span style={styles.diagnosisText}>{analysis.results?.system_diagnosis || 'Нет данных'}</span></p>
                            <p>
                                Окончательное заключение диагноста:
                                <span style={{ fontWeight: 'bold', color: '#007bff' }}>
                                    {analysis.results?.diagnostician_conclusion || 'Не подтверждено'}
                                </span>
                            </p>
                            {analysis.diagnostician && (
                                <p>Подтверждено диагностом: **{analysis.diagnostician.username}**</p>
                            )}

                            {/* Форма для назначения лечения */}
                            <TreatmentForm
                                analysis={analysis}
                                onPrescribe={handlePrescribe}
                            />
                        </div>
                    ))}

                    {patientData.analyses.length === 0 && <p>У пациента нет зарегистрированных анализов.</p>}
                </div>
            )}
        </div>
    );
};

const styles = {
    dashboardContainer: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '20px' },
    button: { padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', border: 'none', color: 'white', fontWeight: 'bold' },
    searchForm: { display: 'flex', gap: '10px', marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' },
    input: { padding: '10px', flexGrow: 1, borderRadius: '4px', border: '1px solid #ddd' },
    searchButton: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    errorText: { color: 'red', marginTop: '10px' },
    historySection: { marginTop: '20px', border: '2px solid #007bff', padding: '20px', borderRadius: '8px' },
    analysisCard: { border: '1px solid #eee', padding: '15px', borderRadius: '5px', marginTop: '15px', backgroundColor: '#f9f9f9' },
    diagnosisText: { fontStyle: 'italic', color: '#555' }
};

export default ClinicianDashboard;