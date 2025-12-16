// src/pages/AdminDashboard.jsx (ФИНАЛЬНАЯ ВЕРСИЯ - С ИСПРАВЛЕННОЙ ЛОГИКОЙ ЗАГРУЗКИ)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAllUsers, updateRole, fetchAllAnalyses, fetchModelMetrics } from '../api/admin';

const AdminDashboard = () => {
    const { user, logout, token } = useAuth(); // Добавляем 'token' для защищенной загрузки

    // Передаем статус загрузки в useAuth, чтобы ждать инициализации контекста
    const [users, setUsers] = useState([]);
    const [analyses, setAnalyses] = useState([]);
    const [metrics, setMetrics] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Состояние для обработки ошибок
    const [activeTab, setActiveTab] = useState('users');


    // --- 1. ЗАЩИТА ПРИ ЗАГРУЗКЕ И ПРОВЕРКА РОЛИ ---
    useEffect(() => {
        // Условие:
        // - Если пользователь еще не загружен или контекст инициализируется, ждем.
        // - Если пользователь загружен, но его роль НЕ 'admin', делаем logout или показываем ошибку.
        if (!user || !token) {
            setLoading(true); // Продолжаем ждать или показывать спиннер
            return;
        }

        if (user.role !== 'admin') {
            // Если пользователь каким-то образом попал сюда без прав администратора
            setError("У вас нет прав администратора для просмотра этой страницы.");
            setLoading(false);
            // Можно добавить автоматический logout: logout();
            return;
        }

        // Если все проверки пройдены, загружаем данные
        loadData();
    }, [user, token]); // Запускаем при инициализации пользователя и токена

    // --- Функция загрузки всех данных ---
    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Выполняем все запросы одновременно
            const [usersData, analysesData, metricsData] = await Promise.all([
                fetchAllUsers(),
                fetchAllAnalyses(),
                fetchModelMetrics()
            ]);

            setUsers(usersData);
            setAnalyses(analysesData);
            setMetrics(metricsData);
        } catch (e) {
            console.error("Ошибка загрузки данных администратора:", e);
            // Улучшенная обработка ошибок (например, 401/403)
            if (e.response && (e.response.status === 401 || e.response.status === 403)) {
                setError("Ошибка авторизации. Проверьте ваш статус.");
                // Автоматический выход, если токен недействителен или нет прав
                logout();
            } else {
                setError("Не удалось загрузить все данные. Попробуйте перезагрузить страницу.");
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Обработчик изменения роли ---
    const handleRoleChange = async (userId, newRole) => {
        // Защита: не даем админу менять свою роль
        if (userId === user.id && newRole !== 'admin') {
             alert("Вы не можете понизить свою собственную роль.");
             return;
        }

        try {
            await updateRole(userId, newRole);
            alert(`Роль пользователя ID ${userId} изменена на ${newRole}`);
            loadData(); // Перезагружаем данные
        } catch (e) {
            alert(`Ошибка изменения роли: ${e.response?.data?.detail || 'Неизвестная ошибка'}`);
        }
    };

    // --- Рендеринг: Управление Пользователями ---
    const renderUserManagement = () => (
        <table style={styles.table}>
            <thead>
                <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Логин</th>
                    <th style={styles.th}>Текущая Роль</th>
                    <th style={styles.th}>Действия</th>
                </tr>
            </thead>
            <tbody>
                {users.map((u) => (
                    <tr key={u.id}>
                        <td style={styles.td}>{u.id}</td>
                        <td style={styles.td}>{u.username}</td>
                        <td style={styles.td}>**{u.role}**</td>
                        <td style={styles.td}>
                            {/* Кнопки активны, только если это не текущий пользователь-админ */}
                            {u.id !== user.id && (
                                <>
                                    {u.role !== 'diagnostician' && (
                                        <button onClick={() => handleRoleChange(u.id, 'diagnostician')} style={{ ...styles.actionButton, backgroundColor: '#007bff' }}>
                                            Сделать Диагностом
                                        </button>
                                    )}
                                    {u.role !== 'clinician' && (
                                        <button onClick={() => handleRoleChange(u.id, 'clinician')} style={{ ...styles.actionButton, backgroundColor: '#ffc107', marginLeft: '5px' }}>
                                            Сделать Клиницистом
                                        </button>
                                    )}
                                    {/* Возможность сделать админом, только если это не админ */}
                                    {u.role !== 'admin' && (
                                        <button onClick={() => handleRoleChange(u.id, 'admin')} style={{ ...styles.actionButton, backgroundColor: '#dc3545', marginLeft: '5px' }}>
                                            Сделать Админом
                                        </button>
                                    )}
                                </>
                            )}
                            {u.id === user.id && <span style={{ color: '#6c757d' }}>Текущий пользователь (Вы)</span>}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    // --- Рендеринг: Обзор Анализов ---
    const renderAnalysisList = () => (
        <table style={styles.table}>
            <thead>
                <tr>
                    <th style={styles.th}>ID Анализа</th>
                    <th style={styles.th}>Дата</th>
                    <th style={styles.th}>MRN Пациента</th>
                    <th style={styles.th}>Диагноз Системы</th>
                    <th style={styles.th}>Заключение Диагноста</th>
                    <th style={styles.th}>План Лечения</th>
                    <th style={styles.th}>Подтвердил</th>
                </tr>
            </thead>
            <tbody>
                {analyses.map((a) => (
                    <tr key={a.id}>
                        <td style={styles.td}>{a.id}</td>
                        <td style={styles.td}>{new Date(a.date_of_analysis).toLocaleDateString()}</td>
                        <td style={styles.td}>**{a.patient?.medical_record_number || 'N/A'}**</td> {/* Добавлена доп. защита */}
                        <td style={styles.td}>{a.results?.system_diagnosis || '—'}</td>
                        <td style={styles.td}>{a.results?.diagnostician_conclusion || '—'}</td>
                        <td style={styles.td}>{a.results?.treatment_plan || '—'}</td>
                        <td style={styles.td}>{a.diagnostician?.username || '—'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    // --- Рендеринг: Мониторинг Модели ---
    const renderModelMonitoring = () => {
        if (!metrics) return <p>Метрики недоступны.</p>;

        const { total_confirmed, correct_predictions, accuracy_percentage } = metrics;

        return (
            <div style={styles.metricsContainer}>
                <h2>📊 Мониторинг Точности Модели (на основе Обратной Связи)</h2>
                <p>Этот дашборд показывает, насколько заключения системы совпадают с окончательными заключениями врачей.</p>

                {/* Визуальное представление цикла MLOps */}
                <div style={styles.mlopsLoop}>
                    <p>
                        Данные, собранные через поле **"Вывод системы корректен"** от врачей-диагностов, используются для автоматической маркировки и агрегации.
                        При падении процента точности ниже порогового значения, это является сигналом для ML-инженера о необходимости **повторного обучения (retrain)** модели, используя эти новые, вручную подтвержденные, образцы данных.
                    </p>
                    {/*  */}
                </div>

                <div style={styles.metricCardGroup}>
                    <div style={styles.metricCard}>
                        <h3>{total_confirmed}</h3>
                        <p>Всего подтвержденных заключений</p>
                    </div>
                    <div style={styles.metricCard}>
                        <h3>{correct_predictions}</h3>
                        <p>Совпадений с врачебным заключением</p>
                    </div>
                    <div style={{...styles.metricCard, backgroundColor: accuracy_percentage > 85 ? '#d4edda' : '#fff3cd'}}>
                        <h3>{accuracy_percentage.toFixed(2)}%</h3> {/* Форматируем до двух знаков */}
                        <p>Процент фактической точности (Accuracy)</p>
                    </div>
                </div>
            </div>
        );
    };

    // --- Главный рендеринг ---
    if (!user || loading) {
        return <div style={{...styles.dashboardContainer, textAlign: 'center'}}><p>Загрузка данных...</p></div>;
    }

    if (error) {
         return <div style={{...styles.dashboardContainer, textAlign: 'center', color: 'red'}}><p>Ошибка: {error}</p><button onClick={logout} style={styles.button}>Вернуться на вход</button></div>;
    }

    // Если пользователь загружен и это Админ, показываем дашборд
    return (
        <div style={styles.dashboardContainer}>
            <div style={styles.header}>
                <h1>⚙️ Дашборд Администратора</h1>
                <div style={styles.userInfo}>
                    <p>Вы вошли как: **{user.username}**</p>
                    <button onClick={logout} style={{ ...styles.button, backgroundColor: 'red' }}>Выйти</button>
                </div>
            </div>

            <div style={styles.tabs}>
                <button
                    style={activeTab === 'users' ? styles.activeTabButton : styles.tabButton}
                    onClick={() => setActiveTab('users')}
                >
                    Управление Пользователями ({users.length})
                </button>
                <button
                    style={activeTab === 'analyses' ? styles.activeTabButton : styles.tabButton}
                    onClick={() => setActiveTab('analyses')}
                >
                    Обзор Анализов ({analyses.length})
                </button>
                <button
                    style={activeTab === 'monitoring' ? styles.activeTabButton : styles.tabButton}
                    onClick={() => setActiveTab('monitoring')}
                >
                    Мониторинг Модели
                </button>
            </div>

            <div style={styles.content}>
                {activeTab === 'users' && renderUserManagement()}
                {activeTab === 'analyses' && renderAnalysisList()}
                {activeTab === 'monitoring' && renderModelMonitoring()}
            </div>
        </div>
    );
};

// --- Стили (без изменений) ---
const styles = {
    dashboardContainer: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '20px' },
    button: { padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', border: 'none', color: 'white', fontWeight: 'bold', backgroundColor: '#007bff' },
    tabs: { marginBottom: '20px', borderBottom: '2px solid #ddd' },
    tabButton: { padding: '10px 15px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 'normal' },
    activeTabButton: { padding: '10px 15px', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderBottom: '3px solid #007bff', backgroundColor: '#f0f0f0' },
    content: { marginTop: '20px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
    th: { border: '1px solid #ddd', padding: '12px', backgroundColor: '#f2f2f2', textAlign: 'left' },
    td: { border: '1px solid #ddd', padding: '12px' },
    actionButton: { padding: '5px 8px', borderRadius: '3px', cursor: 'pointer', border: 'none', color: 'white' },
    metricCardGroup: {
        display: 'flex', gap: '20px', marginTop: '20px'
    },
    metricCard: {
        flex: 1, padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px',
        textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }
};

export default AdminDashboard;