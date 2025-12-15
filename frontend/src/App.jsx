// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import DiagnosticianDashboard from './pages/DiagnosticianDashboard';
import RegisterPage from './pages/RegisterPage'; // Импортируем новую страницу
// import ClinicianDashboard from './pages/ClinicianDashboard';
// import AdminDashboard from './pages/AdminDashboard';


// Приватный маршрут для защиты страниц
const PrivateRoute = ({ allowedRoles, children }) => {
    const { user, token } = useAuth();

    if (!token || !user) {
        // Если нет токена или пользователя, перенаправляем на логин
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Если роль не разрешена, перенаправляем на другую страницу (например, 403 или главную)
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} /> {/* НОВЫЙ МАРШРУТ */}

            {/* Защищенные маршруты */}
            <Route
                path="/diagnostician"
                element={
                    <PrivateRoute allowedRoles={['diagnostician']}>
                        <DiagnosticianDashboard />
                    </PrivateRoute>
                }
            />
            {/* Добавьте маршруты для других ролей */}
            <Route path="*" element={<h1>404 Страница не найдена</h1>} />
        </Routes>
    );
};


const App = () => {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
};

export default App;