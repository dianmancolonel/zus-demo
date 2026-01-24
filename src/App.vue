<template>
  <div class="app">
    <div class="main-container">
      <!-- Left Control Panel -->
      <div class="left-panel">
        <ControlPanel @building-generated="handleBuildingGenerated" />
      </div>
      
      <!-- Right Three.js Viewer -->
      <div class="right-panel">
        <BuildingViewer ref="buildingViewerRef" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ControlPanel from './components/ControlPanel.vue';
import BuildingViewer from './components/BuildingViewer.vue';

const buildingViewerRef = ref(null);

// Handle building generation event
const handleBuildingGenerated = (data) => {
  if (buildingViewerRef.value) {
    buildingViewerRef.value.generateBuilding(data.params);
  }
};
</script>

<style>
/* Reset all browser defaults */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Main container */
.app {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 1;
  padding: 20px;
  box-sizing: border-box;
}

/* Main content container */
.main-container {
  width: 100%;
  max-width: 90vw;
  height: 95vh;
  display: flex;
  flex-direction: row;
  background: #ffffff;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-sizing: border-box;
}

/* Left Control Panel */
.left-panel {
  width: 30%;
  min-width: 280px;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  flex-shrink: 0;
  position: relative;
  /* Add custom scrollbar styles */
  scrollbar-width: thin;
  scrollbar-color: #3498db #ecf0f1;
  /* Ensure content can overflow */
  display: flex;
  flex-direction: column;
  /* Force scrollbar to show */
  overflow-y: scroll;
}

/* Custom scrollbar for WebKit browsers */
.left-panel::-webkit-scrollbar {
  width: 6px;
}

.left-panel::-webkit-scrollbar-track {
  background: #ecf0f1;
  border-radius: 3px;
}

.left-panel::-webkit-scrollbar-thumb {
  background: #3498db;
  border-radius: 3px;
}

.left-panel::-webkit-scrollbar-thumb:hover {
  background: #2980b9;
}

/* Right Three.js Viewer */
.right-panel {
  width: 70%;
  min-width: 300px;
  height: 100%;
  background: #1a202c;
  position: relative;
  flex-grow: 1;
  overflow: hidden;
}

/* Responsive Design for Tablets */
@media (max-width: 1200px) {
  .app {
    padding: 15px;
  }
  
  .main-container {
    height: 95%;
    max-width: 95vw;
  }
  
  .left-panel {
    width: 35%;
    min-width: 250px;
  }
  
  .right-panel {
    width: 65%;
    min-width: 450px;
  }
}

/* Responsive Design for Mobile Devices */
@media (max-width: 768px) {
  .app {
    padding: 10px;
  }
  
  .main-container {
    height: 98%;
    max-width: 98vw;
    flex-direction: column;
  }
  
  .left-panel {
    width: 100%;
    height: 35%;
    min-height: 280px;
    max-width: none;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .right-panel {
    width: 100%;
    height: 65%;
    min-width: none;
  }
}

/* Extra Small Devices */
@media (max-width: 480px) {
  .app {
    padding: 5px;
  }
  
  .main-container {
    height: 99%;
    max-width: 99vw;
  }
  
  .left-panel {
    height: 40%;
    min-height: 250px;
  }
  
  .right-panel {
    height: 60%;
  }
}

/* Ensure consistent behavior across browsers */
@-moz-document url-prefix() {
  .app {
    padding: 20px;
  }
  
  .main-container {
    height: 95%;
  }
}

/* Handle scrollbar width in WebKit browsers */
@media screen and (-webkit-min-device-pixel-ratio:0) {
  .app {
    padding: 20px;
  }
  
  .main-container {
    height: 95%;
  }
}
</style>