// src/api/admin.js (НОВЫЙ ФАЙЛ)
import axios from 'axios';

export const fetchAllUsers = async () => {
    const response = await axios.get('/v1/admin/users');
    return response.data;
};

export const updateRole = async (userId, newRole) => {
    const response = await axios.patch(`/v1/admin/users/${userId}/role`, {
        role: newRole
    });
    return response.data;
};

export const fetchAllAnalyses = async () => {
    const response = await axios.get('/v1/admin/analyses/all');
    return response.data;
};

export const fetchModelMetrics = async () => {
    const response = await axios.get('/v1/admin/model/feedback_metrics');
    return response.data;
};