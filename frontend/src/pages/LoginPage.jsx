// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom'; // Импортируем Link

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, error, user } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        login(username, password);
    };

    // Если пользователь уже авторизован, перенаправляем на дашборд
    if (user) {
        // Перенаправляем на основе роли
        if (user.role === 'diagnostician') {
            return <Navigate to="/diagnostician" replace />;
        }
        if (user.role === 'admin') {
            return <Navigate to="/admin" replace />;
        }
        if (user.role === 'clinician') {
            return <Navigate to="/clinician" replace />;
        }
    }

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <h2>Вход в Систему Диагностики</h2>
                {error && <p style={styles.error}>{error}</p>}

                <input
                    type="text"
                    placeholder="Логин (например, admin)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={styles.input}
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={styles.input}
                />
                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Загрузка...' : 'Войти'}
                </button>

                {/* НОВАЯ ССЫЛКА НА РЕГИСТРАЦИЮ */}
                <p style={styles.linkText}>
                    Нет аккаунта? <Link to="/register" style={styles.link}>Зарегистрироваться</Link>
                </p>
            </form>
        </div>
    );
};

// Простые стили для примера
const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f4f4f9',
    },
    form: {
        padding: '30px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        width: '300px',
    },
    input: {
        padding: '10px',
        marginBottom: '15px',
        borderRadius: '4px',
        border: '1px solid #ccc',
    },
    button: {
        padding: '10px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    error: {
        color: 'red',
        marginBottom: '15px',
        textAlign: 'center',
    },
    linkText: {
        marginTop: '15px',
        textAlign: 'center',
    },
    link: {
        color: '#007bff',
        textDecoration: 'none',
    }
};

export default LoginPage;