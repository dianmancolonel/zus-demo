// API module for communicating with the backend AI service
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * Generate building parameters using AI service
 * @param {Object} params - Building parameters
 * @param {string} params.type - Building type (民居, 官府, 皇宫, 桥梁)
 * @param {string} params.dynasty - Dynasty (汉, 唐, 宋, 明, 清)
 * @returns {Promise<Object>} Building parameters and cultural explanation
 */
export async function generateBuildingParams(type, dynasty) {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-building`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        dynasty
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating building parameters:', error);
    throw error;
  }
}

/**
 * Get sample building parameters for demonstration
 * This is used when the backend API is not available
 */
export function getSampleBuildingParams(type, dynasty) {
  // Sample parameters based on building type and dynasty
  const baseParams = {
    bay_count: 3,
    roof_type: 'gable',
    roof_level: 'common',
    color_scheme: 'red_black',
    symmetry: true,
    platform_height: 1,
    platform_size_x: 8,
    platform_size_z: 6,
    column_height: 4,
    column_radius: 0.3
  };

  // Adjust parameters based on type and dynasty
  switch (type) {
    case '民居':
      baseParams.bay_count = 3;
      baseParams.roof_type = 'gable';
      baseParams.roof_level = 'common';
      baseParams.color_scheme = 'gray_black';
      break;
    case '官府':
      baseParams.bay_count = 5;
      baseParams.roof_type = 'hipped';
      baseParams.roof_level = 'noble';
      baseParams.color_scheme = 'red_yellow';
      break;
    case '皇宫':
      baseParams.bay_count = 7;
      baseParams.roof_type = 'pyramidal';
      baseParams.roof_level = 'imperial';
      baseParams.color_scheme = 'yellow_blue';
      break;
    case '桥梁':
      baseParams.bay_count = 1;
      baseParams.roof_type = 'arch';
      baseParams.roof_level = 'common';
      baseParams.color_scheme = 'stone_gray';
      baseParams.platform_size_x = 12;
      baseParams.platform_size_z = 3;
      break;
  }

  // Adjust based on dynasty
  switch (dynasty) {
    case '汉':
      baseParams.column_height = 3.5;
      baseParams.platform_height = 0.8;
      break;
    case '唐':
      baseParams.column_height = 4.2;
      baseParams.platform_height = 1.2;
      baseParams.roof_type = 'hipped';
      break;
    case '宋':
      baseParams.column_height = 4.0;
      baseParams.platform_height = 1.0;
      break;
    case '明':
      baseParams.column_height = 4.5;
      baseParams.platform_height = 1.3;
      baseParams.roof_level = type === '皇宫' ? 'imperial' : baseParams.roof_level;
      break;
    case '清':
      baseParams.column_height = 4.3;
      baseParams.platform_height = 1.4;
      baseParams.roof_level = type === '皇宫' ? 'imperial' : baseParams.roof_level;
      break;
  }

  // Cultural explanation based on type and dynasty
  let culturalExplanation = '';
  if (type === '民居' && dynasty === '唐') {
    culturalExplanation = '唐代民居多采用三间布局，体现平民阶层的简朴实用原则，屋顶采用悬山式，符合当时的社会等级制度。';
  } else if (type === '官府' && dynasty === '明') {
    culturalExplanation = '明代官署建筑采用五间进深，单檐歇山顶，黄色琉璃瓦，体现严格的等级秩序，彰显政府威严而不僭越皇权。';
  } else if (type === '皇宫' && dynasty === '清') {
    culturalExplanation = '清代皇宫建筑采用七间布局，重檐庑殿顶，黄色琉璃瓦配蓝色剪边，体现至高无上的皇权威仪，严格遵循《工程做法则例》规制。';
  } else if (type === '桥梁' && dynasty === '宋') {
    culturalExplanation = '宋代石桥多采用单孔拱券结构，桥面平缓便于通行，体现了当时先进的工程技术与实用主义设计理念。';
  } else {
    culturalExplanation = `${dynasty}${type}遵循${dynasty}时期的建筑制度，${type === '皇宫' ? '体现皇家威仪' : type === '官府' ? '彰显政府威严' : type === '民居' ? '注重实用简朴' : '结构稳固'}，严格遵守当时的等级规范。`;
  }

  return {
    params: baseParams,
    explanation: culturalExplanation
  };
}