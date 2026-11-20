/**
 * UK RentServe - Lightweight 3D Hero Scene
 * Three.js floating low-poly house with gold/crimson facets, location-pin motif, and orbiting particles
 * Optimized for 60fps, low memory footprint, and prefers-reduced-motion compliance
 */

(function () {
  'use strict';

  const container = document.getElementById('hero-canvas-container');
  if (!container) return;

  // 1. Accessibility & Device Checks
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;

  function hasWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (!hasWebGL()) {
    container.classList.add('fallback-active');
    return;
  }

  // Ensure Three.js is loaded from CDN
  if (typeof THREE === 'undefined') {
    container.classList.add('fallback-active');
    return;
  }

  // 2. Scene Setup
  const scene = new THREE.Scene();

  const width = container.clientWidth || 500;
  const height = container.clientHeight || 500;

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 1.2, 7.5);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: !isMobile,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = false; // Disabled for ultra-high FPS
  container.appendChild(renderer.domElement);

  // 3. Materials (Brand: Crimson #A80F2E, Gold #F5B400, Navy #232B3A, Cream #FFF8E8)
  const crimsonMat = new THREE.MeshStandardMaterial({
    color: 0xA80F2E,
    roughness: 0.35,
    metalness: 0.25,
    flatShading: true
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xF5B400,
    roughness: 0.2,
    metalness: 0.85,
    flatShading: true
  });

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xFFF8E8,
    roughness: 0.4,
    metalness: 0.1
  });

  const darkNavyMat = new THREE.MeshStandardMaterial({
    color: 0x232B3A,
    roughness: 0.5,
    metalness: 0.3,
    flatShading: true
  });

  const glowingPinMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    emissive: 0xF5B400,
    emissiveIntensity: 0.45,
    roughness: 0.15,
    metalness: 0.9
  });

  // 4. Construct Floating House & Pin Group
  const houseGroup = new THREE.Group();

  // House Body (Crimson block)
  const bodyGeo = new THREE.BoxGeometry(2.2, 1.6, 2.0);
  const houseBody = new THREE.Mesh(bodyGeo, crimsonMat);
  houseBody.position.y = 0;
  houseGroup.add(houseBody);

  // Roof (Gold Pyramid)
  const roofGeo = new THREE.ConeGeometry(1.95, 1.3, 4);
  const roof = new THREE.Mesh(roofGeo, goldMat);
  roof.position.y = 1.45;
  roof.rotation.y = Math.PI / 4;
  houseGroup.add(roof);

  // Chimney (Navy with gold rim)
  const chimneyGeo = new THREE.BoxGeometry(0.35, 0.9, 0.35);
  const chimney = new THREE.Mesh(chimneyGeo, darkNavyMat);
  chimney.position.set(0.65, 1.65, -0.4);
  houseGroup.add(chimney);

  // Door (Cream)
  const doorGeo = new THREE.BoxGeometry(0.5, 0.9, 0.08);
  const door = new THREE.Mesh(doorGeo, creamMat);
  door.position.set(0, -0.35, 1.02);
  houseGroup.add(door);

  // Windows (Gold/Cream accents)
  const winGeo = new THREE.BoxGeometry(0.42, 0.42, 0.08);
  const winLeft = new THREE.Mesh(winGeo, goldMat);
  winLeft.position.set(-0.65, 0.15, 1.02);
  houseGroup.add(winLeft);

  const winRight = new THREE.Mesh(winGeo, goldMat);
  winRight.position.set(0.65, 0.15, 1.02);
  houseGroup.add(winRight);

  // Floating Foundation Pedestal (Low-poly hexagonal disc)
  const pedestalGeo = new THREE.CylinderGeometry(2.1, 2.4, 0.22, 6);
  const pedestal = new THREE.Mesh(pedestalGeo, darkNavyMat);
  pedestal.position.y = -0.92;
  houseGroup.add(pedestal);

  // Gold Trim Ring on Pedestal
  const ringGeo = new THREE.TorusGeometry(2.15, 0.04, 8, 32);
  const baseRing = new THREE.Mesh(ringGeo, goldMat);
  baseRing.position.y = -0.85;
  baseRing.rotation.x = Math.PI / 2;
  houseGroup.add(baseRing);

  // Location Pin Motif floating above roof apex
  const pinGroup = new THREE.Group();
  pinGroup.position.set(0, 2.7, 0);

  const pinHeadGeo = new THREE.SphereGeometry(0.32, 16, 16);
  const pinHead = new THREE.Mesh(pinHeadGeo, glowingPinMat);
  pinGroup.add(pinHead);

  const pinPointGeo = new THREE.ConeGeometry(0.3, 0.5, 16);
  const pinPoint = new THREE.Mesh(pinPointGeo, glowingPinMat);
  pinPoint.rotation.x = Math.PI;
  pinPoint.position.y = -0.3;
  pinGroup.add(pinPoint);

  // Center hole in pin
  const pinHoleGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 12);
  const pinHole = new THREE.Mesh(pinHoleGeo, darkNavyMat);
  pinHole.rotation.x = Math.PI / 2;
  pinGroup.add(pinHole);

  houseGroup.add(pinGroup);

  // Add House to Scene
  scene.add(houseGroup);

  // 5. Orbiting Particle Rings
  const particleCount = isMobile ? 60 : 120;
  const particlesGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);

  const crimsonCol = new THREE.Color(0xA80F2E);
  const goldCol = new THREE.Color(0xF5B400);
  const creamCol = new THREE.Color(0xFFF8E8);

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const radius = 3.2 + (Math.random() - 0.5) * 1.2;
    const y = (Math.random() - 0.5) * 1.8;

    particlePositions[i * 3] = Math.cos(angle) * radius;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = Math.sin(angle) * radius;

    const r = Math.random();
    const chosenColor = r < 0.5 ? goldCol : (r < 0.8 ? crimsonCol : creamCol);
    particleColors[i * 3] = chosenColor.r;
    particleColors[i * 3 + 1] = chosenColor.g;
    particleColors[i * 3 + 2] = chosenColor.b;
  }

  particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particlesGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

  const particleMat = new THREE.PointsMaterial({
    size: isMobile ? 0.08 : 0.09,
    vertexColors: true,
    transparent: true,
    opacity: 0.85
  });

  const particleSystem = new THREE.Points(particlesGeo, particleMat);
  scene.add(particleSystem);

  // 6. Lighting
  const ambientLight = new THREE.AmbientLight(0xFFF8E8, 0.9);
  scene.add(ambientLight);

  const goldKeyLight = new THREE.DirectionalLight(0xF5B400, 1.8);
  goldKeyLight.position.set(4, 5, 4);
  scene.add(goldKeyLight);

  const crimsonFillLight = new THREE.PointLight(0xA80F2E, 2.2, 12);
  crimsonFillLight.position.set(-4, -1, 2);
  scene.add(crimsonFillLight);

  const rimLight = new THREE.DirectionalLight(0xFFFFFF, 0.9);
  rimLight.position.set(0, 4, -5);
  scene.add(rimLight);

  // 7. Mouse Interaction & Tilt
  let mouseX = 0;
  let mouseY = 0;
  let targetRotX = 0;
  let targetRotY = 0;

  function onMouseMove(e) {
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX = x * 0.8;
    mouseY = y * 0.5;
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });

  // 8. Visibility Optimization (Pause rendering when out of viewport)
  let isVisible = true;
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
      });
    },
    { threshold: 0.1 }
  );
  observer.observe(container);

  // 9. Resize Handling
  function onResize() {
    if (!container) return;
    const w = container.clientWidth || 400;
    const h = container.clientHeight || 400;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(onResize, 100);
  });

  // 10. Animation Loop
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    if (!isVisible) return;

    if (prefersReducedMotion) {
      // Static single render with slight base angle
      houseGroup.rotation.y = 0.4;
      houseGroup.rotation.x = 0.1;
      renderer.render(scene, camera);
      return;
    }

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Gentle floating bob
    houseGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.12;

    // Smooth mouse tilt tracking with damping
    targetRotY = mouseX + 0.35 + Math.sin(elapsedTime * 0.4) * 0.1;
    targetRotX = mouseY + 0.12;

    houseGroup.rotation.y += (targetRotY - houseGroup.rotation.y) * 0.05;
    houseGroup.rotation.x += (targetRotX - houseGroup.rotation.x) * 0.05;

    // Pin gentle floating & rotating
    pinGroup.position.y = 2.7 + Math.sin(elapsedTime * 2.5) * 0.06;
    pinGroup.rotation.y += delta * 1.2;

    // Particle orbits
    particleSystem.rotation.y += delta * 0.15;
    particleSystem.rotation.x = Math.sin(elapsedTime * 0.3) * 0.1;

    renderer.render(scene, camera);
  }

  animate();
})();
