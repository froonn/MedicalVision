// src/pages/DiagnosticianDashboard.jsx (Обновлено)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import UploadForm from '../components/UploadForm';
import { fetchAnalysisHistory, fetchAnalysisDetails, confirmDiagnosis } from '../api/analysis';

// Новый компонент для деталей
import AnalysisDetailModal from '../components/AnalysisDetailModal';

const DiagnosticianDashboard = () => {
    const { user, logout } = useAuth();
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [selectedAnalysis, setSelectedAnalysis] = useState(null); // Анализ, который просматривается в модальном окне

    // --- Загрузка истории ---
    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const data = await fetchAnalysisHistory();
            setHistory(data);
        } catch (e) {
            console.error("Ошибка загрузки истории:", e);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleUploadSuccess = () => {
        // При успешной загрузке, перезагружаем историю
        loadHistory();
    };

    // --- Просмотр деталей ---
    const handleViewDetails = async (analysisId) => {
        try {
            const details = await fetchAnalysisDetails(analysisId);
            setSelectedAnalysis(details);
        } catch (e) {
            alert("Не удалось загрузить детали анализа.");
            console.error(e);
        }
    };

    // --- Обработка подтверждения (передается в модальное окно) ---
    const handleConfirmDiagnosis = async (analysisId, conclusion, isCorrect) => {
        try {
            await confirmDiagnosis(analysisId, conclusion, isCorrect);
            alert("Заключение и обратная связь успешно отправлены!");
            setSelectedAnalysis(null); // Закрыть модальное окно
            loadHistory(); // Обновить историю
        } catch (e) {
            alert("Ошибка при подтверждении заключения.");
            console.error(e);
        }
    };

    return (
        <div style={styles.dashboardContainer}>
            <div style={styles.header}>
                <h1>🔬 Дашборд Врача-диагноста</h1>
                <div style={styles.userInfo}>
                    <p>Добро пожаловать, **{user.username}**</p>
                    <button onClick={logout} style={{ ...styles.button, backgroundColor: 'red' }}>Выйти</button>
                </div>
            </div>

            <h2 style={styles.sectionTitle}>Загрузка Нового Снимка</h2>
            <UploadForm onUploadSuccess={handleUploadSuccess} />

            <h2 style={styles.sectionTitle}>История Анализов</h2>
            {historyLoading ? (
                <p>Загрузка истории...</p>
            ) : (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Пациент (MRN)</th>
                            <th style={styles.th}>Дата</th>
                            <th style={styles.th}>Диагноз системы</th>
                            <th style={styles.th}>Статус</th>
                            <th style={styles.th}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((item, index) => (
                            <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                <td style={styles.td}>{item.id}</td>
                                <td style={styles.td}>{item.patient.medical_record_number}</td>
                                <td style={styles.td}>{new Date(item.date_of_analysis).toLocaleDateString()}</td>
                                <td style={styles.td}>{item.results?.system_diagnosis || '—'}</td>
                                <td style={styles.td}>
                                    {item.results?.is_confirmed ? 'Подтвержден' : 'Требует проверки'}
                                </td>
                                <td style={styles.td}>
                                    <button
                                        style={styles.actionButton}
                                        onClick={() => handleViewDetails(item.id)}
                                    >
                                        Просмотреть
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Модальное окно деталей анализа */}
            {selectedAnalysis && (
                <AnalysisDetailModal
                    analysis={selectedAnalysis}
                    onClose={() => setSelectedAnalysis(null)}
                    onConfirm={handleConfirmDiagnosis}
                />
            )}
        </div>
    );
};

// ... (стили)
const styles = {
    dashboardContainer: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '20px' },
    sectionTitle: { borderBottom: '2px solid #eee', paddingBottom: '10px', marginTop: '30px' },
    button: { padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', border: 'none', color: 'white', fontWeight: 'bold' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
    th: { border: '1px solid #ddd', padding: '12px', backgroundColor: '#f2f2f2', textAlign: 'left' },
    td: { border: '1px solid #ddd', padding: '12px' },
    actionButton: { padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }
};

export default DiagnosticianDashboard;