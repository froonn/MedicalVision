// src/App.jsx (ФИНАЛЬНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DiagnosticianDashboard from './pages/DiagnosticianDashboard';
import ClinicianDashboard from './pages/ClinicianDashboard';
import AdminDashboard from './pages/AdminDashboard';


// --- 1. Компонент для защиты маршрутов (PrivateRoute) ---
const PrivateRoute = ({ allowedRoles, children }) => {
    const { user, token } = useAuth();

    // Если токена нет, или пользователь не загружен, перенаправляем на логин
    if (!token) {
        return <Navigate to="/" replace />;
    }

    // Если данные пользователя загружаются, можно показать заглушку (опционально)
    if (!user) {
        return <div>Загрузка данных пользователя...</div>;
    }

    // Проверка роли
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};


// --- 2. Логика Перенаправления после Входа (HomeRedirect) ---
const HomeRedirect = () => {
    const { user, token } = useAuth();

    // Если токен есть, но user еще не загружен (кратковременное состояние), ждем
    if (token && !user) {
        return <div>Загрузка данных...</div>;
    }

    // Если пользователь загружен, перенаправляем на нужный дашборд
    if (user) {
        switch (user.role) {
            case 'admin':
                return <Navigate to="/admin" replace />;
            case 'diagnostician':
                return <Navigate to="/diagnostician" replace />;
            case 'clinician':
                return <Navigate to="/clinician" replace />;
            default:
                return <div>Доступ для вашей роли не настроен.</div>;
        }
    }

    // Если ни токена, ни пользователя нет, ведем на страницу логина
    return <LoginPage />;
};


// --- 3. Основной Компонент Приложения ---
const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/unauthorized" element={<h1>403: Доступ запрещен</h1>} />

                    {/* Redirect route (проверяет авторизацию и перенаправляет) */}
                    <Route path="/home" element={<HomeRedirect />} />

                    {/* Private/Protected routes */}
                    <Route
                        path="/diagnostician"
                        element={
                            <PrivateRoute allowedRoles={['diagnostician']}>
                                <DiagnosticianDashboard />
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/clinician"
                        element={
                            <PrivateRoute allowedRoles={['clinician']}>
                                <ClinicianDashboard />
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/admin"
                        element={
                            <PrivateRoute allowedRoles={['admin']}>
                                <AdminDashboard />
                            </PrivateRoute>
                        }
                    />

                    {/* Fallback route */}
                    <Route path="*" element={<h1>404 Страница не найдена</h1>} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;