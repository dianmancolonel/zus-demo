// zus/src/services/apiService.js
import axios from 'axios';
import { API_BASE_URL, STATIC_BASE_URL } from '../utils/api';

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API 调用函数
const apiService = {
  // 获取所有建筑
  getBuildings: async () => {
    try {
      const response = await api.get('/buildings');
      return response.data.buildings;
    } catch (error) {
      console.error('获取建筑列表失败:', error);
      return [];
    }
  },

  // 获取建筑详情
  getBuildingById: async (id) => {
    try {
      const response = await api.get(`/buildings/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取建筑 ${id} 失败:`, error);
      return null;
    }
  },

  // 获取组件列表（支持按建筑和分类过滤）
  getComponents: async (buildingId = null, category = null) => {
    try {
      const params = {};
      if (buildingId) {
        params.building_id = buildingId;
      }
      if (category) {
        params.category = category;
      }
      const response = await api.get('/components', { params });
      return response.data.components;
    } catch (error) {
      console.error('获取组件列表失败:', error);
      return [];
    }
  },

  // 获取组件详情
  getComponentById: async (id) => {
    try {
      const response = await api.get(`/components/${id}`);
      return response.data;
    } catch (error) {
      console.error(`获取组件 ${id} 失败:`, error);
      return null;
    }
  },

  // 获取建筑结构关系
  getStructure: async (buildingId) => {
    try {
      const response = await api.get(`/structures/${buildingId}`);
      return response.data;
    } catch (error) {
      console.error(`获取建筑 ${buildingId} 结构失败:`, error);
      return null;
    }
  },

  // 获取静态资源完整 URL
  getStaticUrl: (path) => {
    return `${STATIC_BASE_URL}${path}`;
  },
};

export default apiService;