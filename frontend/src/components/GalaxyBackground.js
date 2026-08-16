import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Optimized Galaxy Background
const GalaxyBackground = ({ activeField }) => {
  const mountRef = useRef(null);
  
  // Store scene references to access them in the animation loop
  const sceneRef = useRef({
    camera: null,
    targetPosition: { x: 3, y: 3, z: 3 },
    material: null, // Store material to animate size/color if needed
    clock: new THREE.Clock()
  });

  useEffect(() => {
    const currentMount = mountRef.current;
    
    // --- OPTIMIZATION 1: Disabling Antialias & Alpha ---
    // 'powerPreference: "high-performance"' tells the browser to prioritize fps
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: false, // HUGE performance boost
      powerPreference: "high-performance"
    });
    
    // --- OPTIMIZATION 2: Cap Resolution ---
    // Render at 1x resolution even on Retina screens to save GPU
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1)); 
    
    currentMount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(3, 3, 3);
    sceneRef.current.camera = camera;

    // --- Galaxy Generation ---
    const parameters = {
      count: 5000, // --- OPTIMIZATION 3: Reduced from 50k to 5k ---
      size: 0.02,  // Made slightly bigger to compensate for lower count
      radius: 5,
      branches: 3,
      spin: 1,
      randomness: 0.2,
      randomnessPower: 3,
      insideColor: '#ff6030',
      outsideColor: '#0949f0',
    };

    let geometry = null;
    let material = null;
    let points = null;

    const generateGalaxy = () => {
      // Cleanup old geometry if it exists
      if(points !== null) {
          geometry.dispose();
          material.dispose();
          scene.remove(points);
      }

      geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(parameters.count * 3);
      const colors = new Float32Array(parameters.count * 3);
      const colorInside = new THREE.Color(parameters.insideColor);
      const colorOutside = new THREE.Color(parameters.outsideColor);

      for (let i = 0; i < parameters.count; i++) {
        const i3 = i * 3;
        const radius = Math.random() * parameters.radius;
        const spinAngle = radius * parameters.spin;
        const branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);

        positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

        const mixedColor = colorInside.clone();
        mixedColor.lerp(colorOutside, radius / parameters.radius);

        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      material = new THREE.PointsMaterial({
        size: parameters.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
      });

      points = new THREE.Points(geometry, material);
      scene.add(points);
      sceneRef.current.material = material;
    };

    generateGalaxy();

    // --- Animation Loop ---
    const animate = () => {
      const elapsedTime = sceneRef.current.clock.getElapsedTime();
      const target = sceneRef.current.targetPosition;
      
      // Smooth Camera Movement (Lerp)
      if(camera) {
        camera.position.x += (target.x - camera.position.x) * 0.05;
        camera.position.y += (target.y - camera.position.y) * 0.05;
        camera.position.z += (target.z - camera.position.z) * 0.05;

        // Gentle idling rotation
        camera.position.x += Math.cos(elapsedTime * 0.1) * 0.01; 
        camera.position.z += Math.sin(elapsedTime * 0.1) * 0.01;
        
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // --- Cleanup ---
    const handleResize = () => {
      if(camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      // IMPORTANT: Dispose of WebGL resources to prevent memory leaks
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []); // Run only once on mount

  // --- React to Prop Changes ---
 useEffect(() => {
    const positions = {
      // Default: A nice standard 3/4 view
      default: { x: 3, y: 3, z: 3 },

      // Full Name: WARP SPEED inside the core (Kept as requested)
      name: { x: 0.2, y: 0.1, z: 0.2 }, 
      email: { x: 7, y: 0, z: 1 },
      password: { x: -4, y: -2, z: -4 },
      userType: { x: 0, y: 8, z: 0 },
    };

    sceneRef.current.targetPosition = positions[activeField] || positions.default;
    
  }, [activeField]);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        zIndex: -1, background: 'var(--bg-black)' 
      }} 
    />
  );
};

// --- OPTIMIZATION 4: React.memo ---
// This prevents the galaxy from re-rendering every time you type a letter in the form.
// It only updates when 'activeField' changes.
export default React.memo(GalaxyBackground);