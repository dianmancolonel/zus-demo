<template>
  <div class="building-viewer">
    <div ref="containerRef" class="three-container"></div>
    <div class="viewer-controls">
      <button @click="toggleWireframe" class="control-btn">
        {{ wireframeMode ? '实体模式' : '线框模式' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Refs
const containerRef = ref(null);
const wireframeMode = ref(false);

// Three.js objects
let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let buildingGroup = null;
let animationId = null;

// Initialize Three.js scene
const initScene = () => {
  if (!containerRef.value) {
    console.error('Container ref is null');
    return;
  }
  
  console.log('Initializing Three.js scene...');
  
  // Force container to have size
  containerRef.value.style.width = '100%';
  containerRef.value.style.height = '100%';
  containerRef.value.style.position = 'relative';
  
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f8ff); // Light blue background
  
  // Create camera
  const width = containerRef.value.clientWidth || 800;
  const height = containerRef.value.clientHeight || 600;
  
  console.log('Container size:', width, 'x', height);
  
  camera = new THREE.PerspectiveCamera(
    75,
    width / height,
    0.1,
    1000
  );
  camera.position.set(10, 8, 15);
  camera.lookAt(0, 3, 0);
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  
  // Clear container and add renderer
  containerRef.value.innerHTML = '';
  containerRef.value.appendChild(renderer.domElement);
  
  // Ensure renderer DOM element has correct size
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  
  console.log('Renderer added to DOM');
  console.log('Renderer DOM element:', renderer.domElement);
  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 15);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);
  
  // Add ground
  const groundGeometry = new THREE.PlaneGeometry(50, 50);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x90EE90,
    roughness: 0.8,
    metalness: 0.2
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Add grid helper
  const gridHelper = new THREE.GridHelper(40, 40, 0x888888, 0x444444);
  scene.add(gridHelper);
  
  // Add axis helper
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);
  
  // Add orbit controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 5;
  controls.maxDistance = 50;
  
  // Handle window resize
  window.addEventListener('resize', handleResize);
  
  // Add resize observer for container changes
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.value);
  }
  
  // Start animation loop
  animate();
  
  console.log('Three.js scene initialized successfully');
};

// Animation loop
const animate = () => {
  animationId = requestAnimationFrame(animate);
  
  if (controls) {
    controls.update();
  }
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
};

// Handle window resize
const handleResize = () => {
  if (camera && renderer && containerRef.value) {
    const width = containerRef.value.clientWidth;
    const height = containerRef.value.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
};

// Clear existing building
const clearBuilding = () => {
  if (buildingGroup) {
    scene.remove(buildingGroup);
    // Dispose geometries and materials
    buildingGroup.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }
  
  buildingGroup = new THREE.Group();
  scene.add(buildingGroup);
};

// Generate building based on parameters
const generateBuilding = (params) => {
  clearBuilding();
  
  if (!params) return;
  
  console.log('Generating building with params:', params);
  
  // Extract parameters
  const {
    bay_count = 3,
    roof_type = 'gable',
    roof_level = 'common',
    color_scheme = 'red_black',
    symmetry = false,
    platform_height = 1,
    platform_size_x = 8,
    platform_size_z = 6,
    column_height = 4,
    column_radius = 0.3
  } = params;
  
  // Create platform/base
  const platformGeometry = new THREE.BoxGeometry(platform_size_x, platform_height, platform_size_z);
  const platformMaterial = new THREE.MeshStandardMaterial({ 
    color: getPlatformColor(color_scheme),
    roughness: 0.7,
    metalness: 0.3
  });
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.y = platform_height / 2;
  platform.castShadow = true;
  platform.receiveShadow = true;
  buildingGroup.add(platform);
  
  // Calculate spacing
  const spacingX = platform_size_x / (bay_count + 1);
  
  // Create columns based on bay_count
  // Front row columns
  for (let i = 0; i < bay_count; i++) {
    const xPos = -(platform_size_x / 2) + (i + 1) * spacingX;
    createColumn(xPos, platform_size_z / 2, column_height, column_radius, color_scheme);
  }
  
  // Back row columns
  for (let i = 0; i < bay_count; i++) {
    const xPos = -(platform_size_x / 2) + (i + 1) * spacingX;
    createColumn(xPos, -platform_size_z / 2, column_height, column_radius, color_scheme);
  }
  
  // Side columns if needed (for deeper structures)
  if (bay_count > 3) {
    for (let i = 1; i < bay_count - 1; i++) {
      const zPos = -(platform_size_z / 2) + i * (platform_size_z / (bay_count - 1));
      createColumn(-(platform_size_x / 2) + spacingX, zPos, column_height, column_radius, color_scheme);
      createColumn((platform_size_x / 2) - spacingX, zPos, column_height, column_radius, color_scheme);
    }
  }
  
  // Create walls between columns
  createWalls(bay_count, platform_size_x, platform_size_z, column_height, platform_height, color_scheme);
  
  // Create roof based on type
  createRoof(roof_type, platform_size_x, platform_size_z, column_height, roof_level, color_scheme);
  
  // Add to scene
  scene.add(buildingGroup);
};

// Helper to get platform color based on scheme
const getPlatformColor = (scheme) => {
  switch(scheme) {
    case 'gray_black': return 0x808080;
    case 'stone_gray': return 0xA9A9A9;
    case 'red_yellow': return 0x8B4513;
    case 'yellow_blue': return 0xCD853F;
    default: return 0x8B4513; // Brown
  }
};

// Helper to get column color based on scheme
const getColumnColor = (scheme) => {
  switch(scheme) {
    case 'gray_black': return 0xD2B48C;
    case 'stone_gray': return 0xDEB887;
    case 'red_yellow': return 0xF5DEB3;
    case 'yellow_blue': return 0xF4A460;
    default: return 0xDEB887; // Tan
  }
};

// Helper to get roof color based on level and scheme
const getRoofColor = (level, scheme) => {
  if (level === 'imperial') {
    switch(scheme) {
      case 'yellow_blue': return 0xFFD700; // Gold
      case 'red_yellow': return 0xFF6347; // Tomato red
      default: return 0xFFD700; // Gold
    }
  } else if (level === 'noble') {
    switch(scheme) {
      case 'red_yellow': return 0xDC143C; // Crimson
      case 'yellow_blue': return 0xB8860B; // Dark goldenrod
      default: return 0xCC6600; // Orange
    }
  } else {
    switch(scheme) {
      case 'gray_black': return 0x2F4F4F; // Dark slate gray
      case 'stone_gray': return 0x696969; // Dim gray
      case 'red_yellow': return 0x8B0000; // Dark red
      case 'yellow_blue': return 0x4169E1; // Royal blue
      default: return 0x8B0000; // Dark red
    }
  }
};

// Helper to create a column
const createColumn = (x, z, height, radius, scheme) => {
  const columnGeometry = new THREE.CylinderGeometry(radius, radius, height, 16);
  const columnMaterial = new THREE.MeshStandardMaterial({ 
    color: getColumnColor(scheme),
    roughness: 0.6,
    metalness: 0.2
  });
  const column = new THREE.Mesh(columnGeometry, columnMaterial);
  column.position.set(x, height / 2 + 1, z); // +1 for platform height
  column.castShadow = true;
  column.receiveShadow = true;
  buildingGroup.add(column);
};

// Helper to create walls between columns
const createWalls = (bayCount, platformX, platformZ, columnHeight, platformHeight, scheme) => {
  const wallHeight = columnHeight * 0.7; // Walls are shorter than columns
  const wallThickness = 0.2;
  
  // Front wall
  const frontWallGeometry = new THREE.BoxGeometry(platformX - 0.5, wallHeight, wallThickness);
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: getColumnColor(scheme),
    roughness: 0.7,
    metalness: 0.1
  });
  const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
  frontWall.position.set(0, wallHeight / 2 + platformHeight, platformZ / 2 - wallThickness / 2);
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  buildingGroup.add(frontWall);
  
  // Back wall
  const backWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
  backWall.position.set(0, wallHeight / 2 + platformHeight, -platformZ / 2 + wallThickness / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  buildingGroup.add(backWall);
  
  // Side walls if bay count allows for depth
  if (bayCount > 2) {
    const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, platformZ - 0.5);
    const sideWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    sideWall.position.set(platformX / 2 - wallThickness / 2, wallHeight / 2 + platformHeight, 0);
    sideWall.castShadow = true;
    sideWall.receiveShadow = true;
    buildingGroup.add(sideWall);
    
    const sideWall2 = new THREE.Mesh(sideWallGeometry, wallMaterial);
    sideWall2.position.set(-platformX / 2 + wallThickness / 2, wallHeight / 2 + platformHeight, 0);
    sideWall2.castShadow = true;
    sideWall2.receiveShadow = true;
    buildingGroup.add(sideWall2);
  }
};

// Helper to create roof
const createRoof = (type, width, depth, height, level, scheme) => {
  let roofGeometry, roofMaterial;
  
  // Determine roof color based on level and scheme
  const roofColor = getRoofColor(level, scheme);
  
  // Create appropriate roof based on type
  if (type === 'hipped') {
    // Hipped roof - four sloping sides
    const roofHeight = height * 0.6;
    // Create a proper hipped roof with correct dimensions
    const roofBaseSize = Math.max(width, depth) * 0.9;
    roofGeometry = new THREE.ConeGeometry(roofBaseSize / 2, roofHeight, 4);
    roofMaterial = new THREE.MeshStandardMaterial({ 
      color: roofColor,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide // Ensure both sides are rendered
    });
  } else if (type === 'pyramidal') {
    // Pyramidal roof - pointed top
    const roofHeight = height * 0.8;
    const roofBaseSize = Math.max(width, depth) * 0.9;
    roofGeometry = new THREE.ConeGeometry(roofBaseSize / 2, roofHeight, 4);
    roofMaterial = new THREE.MeshStandardMaterial({ 
      color: roofColor,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
  } else if (type === 'arch') {
    // Arch roof for bridges
    const roofHeight = height * 0.4;
    roofGeometry = new THREE.CapsuleGeometry(width * 0.4, depth * 0.6, 4, 8);
    roofMaterial = new THREE.MeshStandardMaterial({ 
      color: roofColor,
      roughness: 0.6,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
  } else {
    // Default gable roof (two sloping sides)
    const roofHeight = height * 0.5;
    // Create a triangular prism for gable roof
    const shape = new THREE.Shape();
    const x = width * 0.5;
    const y = roofHeight;
    shape.moveTo(-x, 0);
    shape.lineTo(0, y);
    shape.lineTo(x, 0);
    shape.lineTo(-x, 0);
    
    const extrudeSettings = {
      steps: 1,
      depth: depth * 0.9,
      bevelEnabled: false
    };
    
    roofGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    roofMaterial = new THREE.MeshStandardMaterial({ 
      color: roofColor,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
  }
  
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  
  // Calculate roof position based on type
  const platformHeight = 1; // Same as platform height in generateBuilding
  const roofYPosition = height + platformHeight + (type === 'arch' ? height * 0.2 : height * 0.3);
  roof.position.y = roofYPosition;
  
  // Adjust rotation and position for different roof types
  if (type === 'hipped' || type === 'pyramidal') {
    // For cone-based roofs, rotate to lay flat and adjust position
    roof.rotation.x = Math.PI / 2;
    // For pyramidal roof, adjust position to center
    if (type === 'pyramidal') {
      // No additional position adjustment needed for centered pyramidal roof
    }
  } else if (type === 'arch') {
    // For arch roof, no rotation needed
    // Adjust position to match bridge structure
    roof.position.y = height + platformHeight + height * 0.2;
  } else {
    // For gable roof, no rotation needed as we created it in the correct orientation
    // Adjust position to center the roof
    roof.position.z = -depth * 0.05; // Adjust to center the roof over the building
  }
  
  // Ensure roof is properly scaled and positioned over the building
  if (type === 'hipped' || type === 'pyramidal') {
    // Scale the roof to match the building dimensions
    const scaleX = width / (Math.max(width, depth) * 0.9);
    const scaleZ = depth / (Math.max(width, depth) * 0.9);
    roof.scale.set(scaleX, 1, scaleZ);
  }
  
  roof.castShadow = true;
  roof.receiveShadow = true;
  buildingGroup.add(roof);
};

// Toggle wireframe mode
const toggleWireframe = () => {
  wireframeMode.value = !wireframeMode.value;
  
  if (buildingGroup) {
    buildingGroup.traverse((child) => {
      if (child.isMesh) {
        child.material.wireframe = wireframeMode.value;
      }
    });
  }
};

// Cleanup
const cleanup = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  window.removeEventListener('resize', handleResize);
  
  if (controls) {
    controls.dispose();
  }
  
  if (renderer) {
    renderer.dispose();
  }
  
  if (scene) {
    scene.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }
};

// Expose methods to parent component
defineExpose({
  generateBuilding,
  clearBuilding
});

onMounted(() => {
  console.log('BuildingViewer mounted');
  // Wait for DOM to fully render before initializing
  setTimeout(() => {
    initScene();
  }, 100);
});

onUnmounted(() => {
  console.log('BuildingViewer unmounted');
  cleanup();
});
</script>

<style scoped>
.building-viewer {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.three-container {
  width: 100%;
  height: 100%;
  flex-grow: 1;
  position: relative;
}

.viewer-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  display: flex;
  gap: 10px;
}

.control-btn {
  padding: 8px 15px;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  color: #2c3e50;
}

.control-btn:hover {
  background-color: rgba(255, 255, 255, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .viewer-controls {
    top: 10px;
    right: 10px;
  }
  
  .control-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>