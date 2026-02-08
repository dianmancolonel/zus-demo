<template>
  <div class="building-viewer">
    <div ref="containerRef" class="three-container"></div>
    <div class="viewer-controls">
      <button @click="toggleWireframe" class="control-btn">
        {{ wireframeMode ? '实体模式' : '线框模式' }}
      </button>
      <button @click="loadSingleModelFromBackend" class="control-btn">
        加载单个模型
      </button>
      <button @click="loadComponentsFromBackend" class="control-btn">
        加载组件组合
      </button>
      <button @click="loadTestModel" class="control-btn">
        加载测试模型
      </button>
    </div>
    <div class="lighting-controls">
      <h4>光照控制</h4>
      <div class="control-group">
        <label>环境光强度: {{ lightingControls.ambientIntensity.toFixed(2) }}</label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1" 
          v-model.number="lightingControls.ambientIntensity"
          @input="updateLighting"
        >
      </div>
      <div class="control-group">
        <label>方向光强度: {{ lightingControls.directionalIntensity.toFixed(2) }}</label>
        <input 
          type="range" 
          min="0" 
          max="2" 
          step="0.1" 
          v-model.number="lightingControls.directionalIntensity"
          @input="updateLighting"
        >
      </div>
      <div class="control-group">
        <label>方向光 X: {{ lightingControls.directionalX }}</label>
        <input 
          type="range" 
          min="-50" 
          max="50" 
          step="1" 
          v-model.number="lightingControls.directionalX"
          @input="updateLighting"
        >
      </div>
      <div class="control-group">
        <label>方向光 Y: {{ lightingControls.directionalY }}</label>
        <input 
          type="range" 
          min="0" 
          max="50" 
          step="1" 
          v-model.number="lightingControls.directionalY"
          @input="updateLighting"
        >
      </div>
      <div class="control-group">
        <label>方向光 Z: {{ lightingControls.directionalZ }}</label>
        <input 
          type="range" 
          min="-50" 
          max="50" 
          step="1" 
          v-model.number="lightingControls.directionalZ"
          @input="updateLighting"
        >
      </div>
      <div class="control-group">
        <label>启用阴影: {{ lightingControls.shadowsEnabled ? '是' : '否' }}</label>
        <input 
          type="checkbox" 
          v-model="lightingControls.shadowsEnabled"
          @change="updateShadows"
        >
      </div>
    </div>
    <div v-if="selectedComponent" class="component-info">
      <h3>{{ selectedComponent.name }}</h3>
      <p>{{ selectedComponent.description }}</p>
      <img v-if="selectedComponent.image_paths && selectedComponent.image_paths.length" :src="apiService.getStaticUrl(selectedComponent.image_paths[0])" alt="组件图片">
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import apiService from '../services/apiService';

// Refs
const containerRef = ref(null);
const wireframeMode = ref(false);
const selectedComponent = ref(null);

// Lighting controls
const lightingControls = reactive({
  ambientIntensity: 0.5,
  directionalIntensity: 0.8,
  directionalX: 10,
  directionalY: 20,
  directionalZ: 15,
  shadowsEnabled: true
});

// Three.js objects
let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let buildingGroup = null;
let animationId = null;
let raycaster = null;
let mouse = null;
let model = null;
let ambientLight = null;
let directionalLight = null;

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
  ambientLight = new THREE.AmbientLight(0xffffff, lightingControls.ambientIntensity);
  scene.add(ambientLight);
  
  directionalLight = new THREE.DirectionalLight(0xffffff, lightingControls.directionalIntensity);
  directionalLight.position.set(
    lightingControls.directionalX,
    lightingControls.directionalY,
    lightingControls.directionalZ
  );
  directionalLight.castShadow = lightingControls.shadowsEnabled;
  directionalLight.shadow.mapSize.width = 4096;
  directionalLight.shadow.mapSize.height = 4096;
  // Configure shadow camera to cover the entire scene
  directionalLight.shadow.camera.left = -50;
  directionalLight.shadow.camera.right = 50;
  directionalLight.shadow.camera.top = 50;
  directionalLight.shadow.camera.bottom = -50;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 150;
  // Add shadow bias to prevent shadow acne (stripes)
  directionalLight.shadow.bias = -0.0001;
  // Add shadow radius for softer shadows
  directionalLight.shadow.radius = 2;
  scene.add(directionalLight);

  const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
  // Ensure helper doesn't cast shadows
  directionalLightHelper.castShadow = false;
  directionalLightHelper.receiveShadow = false;
  scene.add(directionalLightHelper);
  
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
  
  // Initialize raycaster and mouse for component selection
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  
  // Handle window resize
  window.addEventListener('resize', handleResize);
  
  // Add mouse click event for component selection
  window.addEventListener('click', handleMouseClick);
  
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
  const platformHeight = 1;
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

// 3D 模型物体名称与后端组件 ID 的映射关系
const objectComponentMap = {
  'roof': 'roof_wudian',
  'pillar': 'pillar_jinsinan',
  'door': 'door_royal',
  'wall': 'wall_brick',
  'platform': 'platform_stone'
};

// 获取物体的有效名称（递归查找父对象）
const getObjectName = (object) => {
  if (object.name && object.name.trim() !== '') {
    return object.name;
  }
  if (object.parent && object.parent !== scene) {
    return getObjectName(object.parent);
  }
  return null;
};

// Handle mouse click for component selection
const handleMouseClick = (event) => {
  if (!containerRef.value) return;
  
  // Calculate mouse position in normalized device coordinates
  const rect = containerRef.value.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  console.log('Mouse position:', mouse);
  
  // Update the ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);
  
  // Calculate objects intersecting the ray
  const intersects = raycaster.intersectObjects(scene.children, true);
  
  console.log('Number of intersects:', intersects.length);
  
  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    console.log('Clicked raw object:', clickedObject);
    console.log('Clicked object name:', clickedObject.name);
    console.log('Clicked object type:', clickedObject.type);
    console.log('Clicked object parent:', clickedObject.parent ? clickedObject.parent.name : 'null');
    
    // 获取物体的有效名称
    const objectName = getObjectName(clickedObject);
    console.log('Resolved object name:', objectName);
    
    // 调试：打印整个相交对象数组
    console.log('All intersects:', intersects.map(i => ({
      name: i.object.name,
      type: i.object.type,
      parent: i.object.parent ? i.object.parent.name : 'null',
      distance: i.distance
    })));
    
    // 根据物体名称获取组件 ID
    let componentId = 'roof'; // 默认组件
    
    if (objectName) {
      // 尝试直接映射
      if (objectComponentMap[objectName]) {
        console.log('Direct mapping found for object name:', objectName);
        componentId = objectComponentMap[objectName];
      } else {
          console.log('No mapping found for object name:', objectName);
        }
    }
    console.log('Selected component ID:', componentId);
    // 加载对应的组件信息
    loadComponentInfo(componentId);
  } else {
    console.log('No objects intersected');
    console.log('Scene children count:', scene.children.length);
    console.log('Scene children:', scene.children.map(child => ({
      name: child.name,
      type: child.type,
      children: child.children ? child.children.length : 0
    })));
  }
};

// Load component info from backend
const loadComponentInfo = async (componentId) => {
  try {
    const component = await apiService.getComponentById(componentId);
    if (component) {
      selectedComponent.value = component;
      console.log('Loaded component info:', component);
    }
  } catch (error) {
    console.error('Error loading component info:', error);
  }
};

// Load test model from public/objtest folder
const loadTestModel = async () => {
  try {
    console.log('Loading test model from public/objtest...');
    
    // Clear existing building
    clearBuilding();
    
    // Test model path (from public folder)
    const modelUrl = '/objtest/p123.glb';
    console.log(`Loading test model: ${modelUrl}`);
    
    // Determine loader based on file extension
    const extension = modelUrl.split('.').pop().toLowerCase();
    let loader;
    
    if (extension === 'glb' || extension === 'gltf') {
      loader = new GLTFLoader();
    } else if (extension === 'fbx') {
      loader = new FBXLoader();
    } else if (extension === 'obj') {
      loader = new OBJLoader();
    } else {
      console.error('Unsupported model format:', extension);
      return;
    }
    
    loader.load(
      modelUrl,
      (model) => {
        console.log('Test model loaded successfully');
        
        // Handle different loader results
        let modelObject;
        if (model.scene) {
          // GLTFLoader returns an object with scene property
          modelObject = model.scene;
        } else {
          // FBXLoader and OBJLoader return the object directly
          modelObject = model;
        }
        
        // Adjust model to respond to lighting
        modelObject.traverse((child) => {
          if (child.isMesh) {
            // Ensure mesh uses MeshStandardMaterial for proper lighting response
            if (!(child.material instanceof THREE.MeshStandardMaterial)) {
              // Convert to MeshStandardMaterial
              const newMaterial = new THREE.MeshStandardMaterial({
                color: child.material.color || 0xaaaaaa,
                map: child.material.map,
                roughness: 0.5,
                metalness: 0.2
              });
              child.material = newMaterial;
            }
            // Enable shadow casting and receiving
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        // Scale and position the model appropriately
        modelObject.scale.set(0.5, 0.5, 0.5); // Adjust scale as needed
        modelObject.position.set(0, 1.0, 0); // Center at origin
        
        buildingGroup.add(modelObject);
        console.log('Test model added to scene');
      },
      (xhr) => {
        console.log(`Loading test model: ${Math.round((xhr.loaded / xhr.total) * 100)}%`);
      },
      (error) => {
        console.error('Error loading test model:', error);
      }
    );
  } catch (error) {
    console.error('Error loading test model:', error);
  }
};

// Load model from backend (single model)
const loadSingleModelFromBackend = async () => {
  try {
    // Get buildings from backend
    const buildings = await apiService.getBuildings();
    if (buildings && buildings.length > 0) {
      const building = buildings[0];
      console.log('Loading model for building:', building.name);
      
      // Get model URL
      const modelUrl = apiService.getStaticUrl(building.model_path);
      console.log('Model URL:', modelUrl);
      
      // Determine loader based on file extension
      const extension = modelUrl.split('.').pop().toLowerCase();
      let loader;
      
      if (extension === 'glb' || extension === 'gltf') {
        loader = new GLTFLoader();
      } else if (extension === 'fbx') {
        loader = new FBXLoader();
      } else if (extension === 'obj') {
        loader = new OBJLoader();
      } else {
        console.error('Unsupported model format:', extension);
        return;
      }
      
      loader.load(
        modelUrl,
        (loadedModel) => {
          console.log('Model loaded successfully:', loadedModel);
          
          // Clear existing building
          clearBuilding();
          
          // Handle different loader results
          let modelObject;
          if (loadedModel.scene) {
            // GLTFLoader returns an object with scene property
            modelObject = loadedModel.scene;
          } else {
            // FBXLoader and OBJLoader return the object directly
            modelObject = loadedModel;
          }
          
          // Adjust model to respond to lighting
          modelObject.traverse((child) => {
            if (child.isMesh) {
              // Ensure mesh uses MeshStandardMaterial for proper lighting response
              if (!(child.material instanceof THREE.MeshStandardMaterial)) {
                // Convert to MeshStandardMaterial
                const newMaterial = new THREE.MeshStandardMaterial({
                  color: child.material.color || 0xaaaaaa,
                  map: child.material.map,
                  roughness: 0.5,
                  metalness: 0.2
                });
                child.material = newMaterial;
              }
              // Enable shadow casting and receiving
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          // Add loaded model to scene
          model = modelObject;
          model.position.set(0, 0, 0);
          model.scale.set(1, 1, 1);
          buildingGroup.add(model);
          
          console.log('Model added to scene');
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
          console.error('Error loading model:', error);
        }
      );
    }
  } catch (error) {
    console.error('Error loading model from backend:', error);
  }
};

// Load components from backend and assemble building
const loadComponentsFromBackend = async () => {
  try {
    console.log('Loading components from backend...');
    
    // Get buildings from backend
    const buildings = await apiService.getBuildings();
    if (!buildings || buildings.length === 0) {
      console.error('No buildings found');
      return;
    }
    
    const building = buildings[0];
    console.log('Loading components for building:', building.name);
    
    // Clear existing building
    clearBuilding();
    
    // Get components for this building
    const components = await apiService.getComponents(building.id);
    console.log('Found components:', components.map(c => c.name));
    
    if (!components || components.length === 0) {
      console.error('No components found for this building');
      return;
    }
    
    // Load each component model
    let loadedComponents = 0;
    const totalComponents = components.length;
    
    components.forEach((component) => {
      if (component.model_path) {
        const modelUrl = apiService.getStaticUrl(component.model_path);
        console.log(`Loading component model: ${component.name} (${modelUrl})`);
        
        // Determine loader based on file extension
        const extension = modelUrl.split('.').pop().toLowerCase();
        let loader;
        
        if (extension === 'glb' || extension === 'gltf') {
          loader = new GLTFLoader();
        } else if (extension === 'fbx') {
          loader = new FBXLoader();
        } else if (extension === 'obj') {
          loader = new OBJLoader();
        } else {
          console.error('Unsupported model format:', extension);
          loadedComponents++;
          return;
        }
        
        loader.load(
          modelUrl,
          (loadedModel) => {
            console.log(`Component ${component.name} loaded successfully`);
            
            // Handle different loader results
            let componentModel;
            if (loadedModel.scene) {
              // GLTFLoader returns an object with scene property
              componentModel = loadedModel.scene;
            } else {
              // FBXLoader and OBJLoader return the object directly
              componentModel = loadedModel;
            }
            
            // Set position
            if (component.position) {
              componentModel.position.set(
                component.position.x || 0,
                component.position.y || 0,
                component.position.z || 0
              );
            } else {
              componentModel.position.set(0, 0, 0);
            }
            
            // Set rotation
            if (component.rotation) {
              componentModel.rotation.set(
                component.rotation.x || 0,
                component.rotation.y || 0,
                component.rotation.z || 0
              );
            }
            
            // Set scale
            if (component.scale) {
              componentModel.scale.set(
                component.scale.x || 1,
                component.scale.y || 1,
                component.scale.z || 1
              );
            }
            
            // Adjust model to respond to lighting
            componentModel.traverse((child) => {
              if (child.isMesh) {
                // Ensure mesh uses MeshStandardMaterial for proper lighting response
                if (!(child.material instanceof THREE.MeshStandardMaterial)) {
                  // Convert to MeshStandardMaterial
                  const newMaterial = new THREE.MeshStandardMaterial({
                    color: child.material.color || 0xaaaaaa,
                    map: child.material.map,
                    roughness: 0.5,
                    metalness: 0.2
                  });
                  child.material = newMaterial;
                }
                // Enable shadow casting and receiving
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            
            // Add to building group
            buildingGroup.add(componentModel);
            
            // Track loading progress
            loadedComponents++;
            console.log(`Loaded ${loadedComponents}/${totalComponents} components`);
            
            if (loadedComponents === totalComponents) {
              console.log('All components loaded successfully');
            }
          },
          (xhr) => {
            console.log(`${component.name}: ${(xhr.loaded / xhr.total * 100)}% loaded`);
          },
          (error) => {
            console.error(`Error loading component ${component.name}:`, error);
            loadedComponents++;
          }
        );
      } else {
        console.warn(`Component ${component.name} has no model_path`);
        loadedComponents++;
      }
    });
    
  } catch (error) {
    console.error('Error loading components from backend:', error);
  }
};

// Cleanup
const cleanup = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('click', handleMouseClick);
  
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

// Reset view to initial state
const resetView = () => {
  if (camera) {
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);
  }
  if (controls) {
    controls.reset();
  }
};

// Update lighting based on controls
const updateLighting = () => {
  if (ambientLight) {
    ambientLight.intensity = lightingControls.ambientIntensity;
  }
  if (directionalLight) {
    directionalLight.intensity = lightingControls.directionalIntensity;
    directionalLight.position.set(
      lightingControls.directionalX,
      lightingControls.directionalY,
      lightingControls.directionalZ
    );
    // Ensure directional light always points to origin
    directionalLight.target.position.set(0, 0, 0);
    directionalLight.target.updateMatrixWorld();
  }
};

// Update shadows based on controls
const updateShadows = () => {
  if (renderer) {
    renderer.shadowMap.enabled = lightingControls.shadowsEnabled;
  }
  if (directionalLight) {
    directionalLight.castShadow = lightingControls.shadowsEnabled;
  }
  // Update all objects in the scene
  if (scene) {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = lightingControls.shadowsEnabled;
        child.receiveShadow = lightingControls.shadowsEnabled;
      }
    });
  }
};

// Expose methods to parent component
defineExpose({
  loadSingleModelFromBackend,
  loadComponentsFromBackend,
  loadTestModel,
  clearBuilding,
  resetView
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

/* Component info panel */
.component-info {
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 300px;
  max-width: 80%;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.component-info h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #2c3e50;
  font-size: 16px;
}

.component-info p {
  margin: 0 0 15px 0;
  color: #34495e;
  font-size: 14px;
  line-height: 1.4;
}

.component-info img {
  width: 100%;
  max-height: 150px;
  object-fit: cover;
  border-radius: 4px;
  margin-top: 10px;
}

/* Lighting controls panel */
.lighting-controls {
  position: absolute;
  top: 80px;
  right: 20px;
  width: 300px;
  max-width: 80%;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.lighting-controls h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #2c3e50;
  font-size: 16px;
}

.control-group {
  margin-bottom: 12px;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #34495e;
}

.control-group input[type="range"] {
  width: 100%;
  margin: 0;
  accent-color: #3498db;
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
  
  .component-info {
    width: 90%;
    max-width: none;
    left: 5%;
    bottom: 10px;
    padding: 12px;
  }
  
  .component-info h3 {
    font-size: 14px;
  }
  
  .component-info p {
    font-size: 13px;
  }
}
</style>