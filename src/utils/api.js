// zus/src/utils/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const STATIC_BASE_URL = import.meta.env.VITE_STATIC_BASE_URL || 'http://localhost:8000';

export { API_BASE_URL, STATIC_BASE_URL };