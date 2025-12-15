// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Настройка базового URL для Axios
const API_URL = "http://127.0.0.1:8000/v1/auth";
axios.defaults.baseURL = "http://127.0.0.1:8000";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Получение токена и пользователя из локального хранилища при загрузке
    const [token, setToken] = useState(localStorage.getItem('access_token') || null);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Установка заголовка авторизации по умолчанию для Axios
    useEffect(() => {
        if (token) {
            // Устанавливаем заголовок при загрузке токена из хранилища
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    const login = async (username, password) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Получение токена
            const response = await axios.post(
                `${API_URL}/token`, // Предположим, API_URL = http://127.0.0.1:8000/v1/auth
                new URLSearchParams({
                    username: username,
                    password: password
                }),
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
            );

            const accessToken = response.data.access_token;
            setToken(accessToken); // Асинхронное обновление состояния
            localStorage.setItem('access_token', accessToken);

            // 2. !!! ИСПРАВЛЕНИЕ: МГНОВЕННОЕ ОБНОВЛЕНИЕ AXIOS !!!
            // Установите заголовок перед следующим запросом, чтобы гарантировать его наличие
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            // 3. Получаем информацию о пользователе (role)
            const userResponse = await axios.get('/v1/auth/me'); // Теперь этот запрос должен сработать
            const userData = userResponse.data;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));

        } catch (err) {
            console.error("Login failed:", err);
            setError("Ошибка авторизации. Проверьте логин и пароль.");
            setToken(null);
            setUser(null);
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ token, user, loading, error, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};