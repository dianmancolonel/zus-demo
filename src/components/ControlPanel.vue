<template>
  <div class="control-panel">
    <h2>中国古代建筑参数化生成系统</h2>
    
    <!-- Building Type Selection -->
    <div class="control-group">
      <label for="building-type">建筑类型</label>
      <select 
        id="building-type" 
        v-model="selectedType" 
        class="control-input"
      >
        <option value="民居">民居</option>
        <option value="官府">官府</option>
        <option value="皇宫">皇宫</option>
        <option value="桥梁">桥梁</option>
      </select>
    </div>
    
    <!-- Dynasty Selection -->
    <div class="control-group">
      <label for="dynasty">朝代</label>
      <select 
        id="dynasty" 
        v-model="selectedDynasty" 
        class="control-input"
      >
        <option value="汉">汉</option>
        <option value="唐">唐</option>
        <option value="宋">宋</option>
        <option value="明">明</option>
        <option value="清">清</option>
      </select>
    </div>
    
    <!-- AI Generation Button -->
    <button 
      @click="generateBuilding" 
      :disabled="isGenerating" 
      class="generate-btn"
    >
      {{ isGenerating ? '生成中...' : 'AI 生成建筑方案' }}
    </button>
    
    <!-- Loading indicator -->
    <div v-if="isGenerating" class="loading">
      <div class="spinner"></div>
      <p>AI 正在分析建筑制度参数...</p>
    </div>
    
    <!-- Building Parameters Display -->
    <div v-if="buildingParams" class="params-display">
      <h3>建筑参数</h3>
      <div class="params-grid">
        <div class="param-item">
          <span class="param-label">开间数:</span>
          <span class="param-value">{{ buildingParams.bay_count }}</span>
        </div>
        <div class="param-item">
          <span class="param-label">屋顶类型:</span>
          <span class="param-value">{{ roofTypeText[buildingParams.roof_type] || buildingParams.roof_type }}</span>
        </div>
        <div class="param-item">
          <span class="param-label">屋顶等级:</span>
          <span class="param-value">{{ roofLevelText[buildingParams.roof_level] || buildingParams.roof_level }}</span>
        </div>
        <div class="param-item">
          <span class="param-label">色彩方案:</span>
          <span class="param-value">{{ colorSchemeText[buildingParams.color_scheme] || buildingParams.color_scheme }}</span>
        </div>
        <div class="param-item">
          <span class="param-label">中轴对称:</span>
          <span class="param-value">{{ buildingParams.symmetry ? '是' : '否' }}</span>
        </div>
        <div class="param-item">
          <span class="param-label">台基高度:</span>
          <span class="param-value">{{ buildingParams.platform_height }}</span>
        </div>
        <div class="param-item">
          <span class="param-label">柱子高度:</span>
          <span class="param-value">{{ buildingParams.column_height }}</span>
        </div>
        <div class="param-item">
          <span class="param-label">柱子半径:</span>
          <span class="param-value">{{ buildingParams.column_radius }}</span>
        </div>
      </div>
    </div>
    
    <!-- Cultural Explanation -->
    <div v-if="culturalExplanation" class="explanation-section">
      <h3>文化制度解释</h3>
      <p class="explanation-text">{{ culturalExplanation }}</p>
    </div>
    
    <!-- Test content to ensure scrollbar appears -->
    <div class="test-content">
      <h3>测试内容</h3>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
      <p>这是测试内容，用于确保滚动条能够正常显示。</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { generateBuildingParams, getSampleBuildingParams } from '../api/buildingApi';

// Reactive variables
const selectedType = ref('民居');
const selectedDynasty = ref('唐');
const isGenerating = ref(false);
const buildingParams = ref(null);
const culturalExplanation = ref('');

// Text mappings for better display
const roofTypeText = {
  'gable': '悬山/歇山',
  'hipped': '庑殿/歇山', 
  'pyramidal': '攒尖',
  'arch': '拱券'
};

const roofLevelText = {
  'common': '普通',
  'noble': '贵族',
  'imperial': '皇家'
};

const colorSchemeText = {
  'red_black': '红黑',
  'red_yellow': '红黄',
  'yellow_blue': '黄蓝',
  'gray_black': '灰黑',
  'stone_gray': '青石'
};

// Function to generate building parameters
const generateBuilding = async () => {
  isGenerating.value = true;
  
  try {
    // Using sample data for now, but would connect to actual API
    const result = getSampleBuildingParams(selectedType.value, selectedDynasty.value);
    buildingParams.value = result.params;
    culturalExplanation.value = result.explanation;
    
    // Emit event to notify parent component
    emit('building-generated', {
      params: result.params,
      explanation: result.explanation
    });
  } catch (error) {
    console.error('Error generating building:', error);
    alert('生成建筑方案时出现错误，请稍后再试。');
  } finally {
    isGenerating.value = false;
  }
};

// Define emits
const emit = defineEmits(['building-generated']);
</script>

<style scoped>
.control-panel {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
}

.control-panel h2 {
  margin-top: 0;
  margin-bottom: 25px;
  color: #2c3e50;
  text-align: center;
  font-weight: 600;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
}

.control-group {
  margin-bottom: 20px;
}

.control-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #34495e;
}

.control-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  box-sizing: border-box;
  color: #2c3e50; /* 设置文本颜色为深灰色，确保可读性 */
}

.generate-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.generate-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9 0%, #2573a7 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.generate-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading {
  text-align: center;
  padding: 20px 0;
  color: #7f8c8d;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.params-display {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.params-display h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #2c3e50;
  border-bottom: 1px solid #ecf0f1;
  padding-bottom: 8px;
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.param-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #f1f2f6;
}

.param-label {
  font-weight: 500;
  color: #34495e;
}

.param-value {
  color: #2c3e50;
  font-weight: 500;
}

.explanation-section {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  margin-bottom: 20px; /* Add bottom margin to ensure content is not cut off */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.explanation-section h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #2c3e50;
  border-bottom: 1px solid #ecf0f1;
  padding-bottom: 8px;
}

.explanation-text {
  color: #34495e;
  line-height: 1.6;
  margin: 0;
  text-align: justify;
}

.test-content {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.test-content h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #2c3e50;
  border-bottom: 1px solid #ecf0f1;
  padding-bottom: 8px;
}

.test-content p {
  color: #34495e;
  line-height: 1.4;
  margin: 8px 0;
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .control-panel {
    padding: 15px;
  }
  
  .control-panel h2 {
    font-size: 1.4rem;
    margin-bottom: 20px;
  }
  
  .params-grid {
    grid-template-columns: 1fr; /* Stack params in single column on mobile */
    gap: 8px;
  }
  
  .generate-btn {
    padding: 10px;
    font-size: 15px;
  }
  
  .control-input {
    padding: 8px;
    font-size: 14px;
  }
}
</style>