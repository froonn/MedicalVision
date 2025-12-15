// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Пароли не совпадают.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Отправляем запрос на регистрацию
            await axios.post('/v1/auth/register', {
                username: username,
                password: password,
                // Роль отправляется, но будет перезаписана на бэкенде
                role: 'diagnostician'
            });

            setSuccess(true);
            // Опционально: автоматический переход на страницу входа через 2 секунды
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (err) {
            console.error("Registration failed:", err.response?.data);
            const detail = err.response?.data?.detail || 'Неизвестная ошибка регистрации.';
            setError(`Ошибка: ${detail}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <h2>Регистрация нового врача</h2>

                {error && <p style={styles.error}>{error}</p>}
                {success && <p style={styles.success}>✅ Успешно! Вы будете перенаправлены на страницу входа.</p>}

                <input
                    type="text"
                    placeholder="Логин (имя пользователя)"
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
                <input
                    type="password"
                    placeholder="Повторите пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={styles.input}
                />
                <button type="submit" disabled={loading || success} style={styles.button}>
                    {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>

                <p style={styles.linkText}>
                    Уже есть аккаунт? <Link to="/" style={styles.link}>Войти</Link>
                </p>
            </form>
        </div>
    );
};

// ... (используйте стили из LoginPage или обновите их)
const styles = {
    // ... (стили container, form, input, button)
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
    success: {
        color: 'green',
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

export default RegisterPage;