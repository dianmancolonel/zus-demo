import { shallowRef, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function useThreeScene(containerRef) {
  // Scene setup - using shallowRef to prevent Vue from making Three.js objects reactive
  const scene = shallowRef(null);
  const camera = shallowRef(null);
  const renderer = shallowRef(null);
  const controls = shallowRef(null);
  const buildingGroup = shallowRef(null);

  // Initialize scene
  const initScene = () => {
    // Create scene
    scene.value = new THREE.Scene();
    scene.value.background = new THREE.Color(0xf0f8ff); // Light blue background
    
    // Create camera
    camera.value = new THREE.PerspectiveCamera(
      75,
      containerRef.value.clientWidth / containerRef.value.clientHeight,
      0.1,
      1000
    );
    camera.value.position.set(10, 8, 15);
    camera.value.lookAt(0, 3, 0);
    
    // Create renderer
    renderer.value = new THREE.WebGLRenderer({ antialias: true });
    renderer.value.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
    renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.value.shadowMap.enabled = true;
    containerRef.value.appendChild(renderer.value.domElement);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.value.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.value.add(directionalLight);
    
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
    scene.value.add(ground);
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(40, 40, 0x888888, 0x444444);
    scene.value.add(gridHelper);
    
    // Add axis helper
    const axesHelper = new THREE.AxesHelper(5);
    scene.value.add(axesHelper);
    
    // Add orbit controls
    controls.value = new OrbitControls(camera.value, renderer.value.domElement);
    controls.value.enableDamping = true;
    controls.value.dampingFactor = 0.05;
    controls.value.screenSpacePanning = false;
    controls.value.minDistance = 5;
    controls.value.maxDistance = 50;
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    
    // Start animation loop
    animate();
  };
  
  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);
    
    if (controls.value) {
      controls.value.update();
    }
    
    if (renderer.value && scene.value && camera.value) {
      renderer.value.render(scene.value, camera.value);
    }
  };
  
  // Handle window resize
  const handleResize = () => {
    if (camera.value && renderer.value && containerRef.value) {
      camera.value.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight;
      camera.value.updateProjectionMatrix();
      renderer.value.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
    }
  };
  
  // Clear existing building
  const clearBuilding = () => {
    if (buildingGroup.value) {
      scene.value.remove(buildingGroup.value);
      // Dispose geometries and materials to prevent memory leaks
      buildingGroup.value.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material?.dispose());
            } else {
              child.material?.dispose();
            }
          }
        }
      });
    }
    
    buildingGroup.value = new THREE.Group();
    scene.value.add(buildingGroup.value);
  };
  
  // Generate building based on parameters
  const generateBuilding = (params) => {
    clearBuilding();
    
    if (!params) return;
    
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
    buildingGroup.value.add(platform);
    
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
    scene.value.add(buildingGroup.value);
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
    column.position.set(x, height / 2 + platform_height, z); // +platform_height to account for platform
    column.castShadow = true;
    column.receiveShadow = true;
    buildingGroup.value.add(column);
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
    buildingGroup.value.add(frontWall);
    
    // Back wall
    const backWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
    backWall.position.set(0, wallHeight / 2 + platformHeight, -platformZ / 2 + wallThickness / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    buildingGroup.value.add(backWall);
    
    // Side walls if bay count allows for depth
    if (bayCount > 2) {
      const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, platformZ - 0.5);
      const sideWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
      sideWall.position.set(platformX / 2 - wallThickness / 2, wallHeight / 2 + platformHeight, 0);
      sideWall.castShadow = true;
      sideWall.receiveShadow = true;
      buildingGroup.value.add(sideWall);
      
      const sideWall2 = new THREE.Mesh(sideWallGeometry, wallMaterial);
      sideWall2.position.set(-platformX / 2 + wallThickness / 2, wallHeight / 2 + platformHeight, 0);
      sideWall2.castShadow = true;
      sideWall2.receiveShadow = true;
      buildingGroup.value.add(sideWall2);
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
      roofGeometry = new THREE.ConeGeometry(width * 0.8, roofHeight, 4);
      roofMaterial = new THREE.MeshStandardMaterial({ 
        color: roofColor,
        roughness: 0.5,
        metalness: 0.1
      });
    } else if (type === 'pyramidal') {
      // Pyramidal roof - pointed top
      const roofHeight = height * 0.8;
      roofGeometry = new THREE.ConeGeometry(0.1, roofHeight, 4);
      roofMaterial = new THREE.MeshStandardMaterial({ 
        color: roofColor,
        roughness: 0.5,
        metalness: 0.1
      });
    } else if (type === 'arch') {
      // Arch roof for bridges
      const roofHeight = height * 0.4;
      roofGeometry = new THREE.CapsuleGeometry(width * 0.4, depth * 0.6, 4, 8);
      roofMaterial = new THREE.MeshStandardMaterial({ 
        color: roofColor,
        roughness: 0.6,
        metalness: 0.2
      });
    } else {
      // Default gable roof (two sloping sides)
      const roofHeight = height * 0.5;
      // Create a triangular prism for gable roof
      const shape = new THREE.Shape();
      const x = width * 0.5;
      const y = roofHeight;
      shape.moveTo(-x, -y/2);
      shape.lineTo(0, y/2);
      shape.lineTo(x, -y/2);
      shape.lineTo(-x, -y/2);
      
      const extrudeSettings = {
        steps: 1,
        depth: depth * 0.9,
        bevelEnabled: false
      };
      
      roofGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      roofMaterial = new THREE.MeshStandardMaterial({ 
        color: roofColor,
        roughness: 0.5,
        metalness: 0.1
      });
    }
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = height + platform_height + (type === 'arch' ? height * 0.2 : height * 0.3);
    
    // Rotate for proper orientation if needed
    if (type !== 'arch') {
      roof.rotation.x = Math.PI / 2; // Rotate for proper roof orientation
    }
    
    roof.castShadow = true;
    roof.receiveShadow = true;
    buildingGroup.value.add(roof);
  };
  
  // Toggle wireframe mode
  const toggleWireframe = (wireframeMode) => {
    if (buildingGroup.value) {
      buildingGroup.value.traverse((child) => {
        if (child.isMesh) {
          child.material.wireframe = wireframeMode;
        }
      });
    }
  };
  
  // Clean up
  const dispose = () => {
    window.removeEventListener('resize', handleResize);
    
    if (renderer.value) {
      renderer.value.dispose();
    }
    
    if (controls.value) {
      controls.value.dispose();
    }
    
    if (scene.value) {
      scene.value.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material?.dispose());
            } else {
              child.material?.dispose();
            }
          }
        }
      });
    }
  };
  
  onUnmounted(() => {
    dispose();
  });
  
  return {
    initScene,
    generateBuilding,
    toggleWireframe,
    clearBuilding
  };
}