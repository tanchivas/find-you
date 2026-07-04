import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initScrapbook } from './scrapbook.js';
import confetti from 'canvas-confetti';

// State variables
let scene, camera, renderer, controls;
let galaxyPoints, specialStar, specialLight;
let isTransitioning = false;
let searchStarted = false;
let scanProgress = 0;
let scanInterval;

// Camera positioning variables
const startCamPos = new THREE.Vector3(18, 14, 18);
const endCamPos = new THREE.Vector3(2.0, 1.5, 2.5); // Zooms much closer to the heart planet
let cameraTargetPos = startCamPos.clone();

// Web Audio API variables for Heartbeat Sound
let audioCtx = null;
let heartbeatInterval = null;
let heartbeatVolume = 0.6;

const startBtn = document.getElementById('start-btn');
const bgMusic = document.getElementById('bg-music');
const landingScreen = document.getElementById('landing-screen');
const galaxyScreen = document.getElementById('galaxy-screen');
const scrapbookScreen = document.getElementById('scrapbook-screen');

// Radar UI Elements
const radarStatus = document.getElementById('radar-status');
const radarProgress = document.getElementById('radar-progress');
const radarCoords = document.getElementById('radar-coords');
const radarHint = document.getElementById('radar-hint');

// Target position for the heart planet (hovering isolated above the galaxy)
const targetPosition = new THREE.Vector3(0, 1.2, 0);

// Array to hold flying photos for transition
let flyingPhotos = [];
const flyingPhotosCount = 45;
let textures = [];

// Start Button Handler
startBtn.addEventListener('click', () => {
  // Play background music
  bgMusic.volume = 0.4;
  bgMusic.play().catch(err => console.warn("Audio play blocked by browser:", err));

  // Fade landing, show galaxy
  landingScreen.classList.remove('active');
  galaxyScreen.classList.add('active');

  searchStarted = true;

  // Initialize Three.js Scene
  initGalaxyScene();
  // Start Scanning progress and camera zoom
  startRadarScan();
});

function initGalaxyScene() {
  // 1. Scene setup
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020205, 0.05);

  // 2. Camera setup
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.copy(startCamPos);

  // 3. Renderer setup
  const canvas = document.getElementById('galaxy-canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 4. Controls setup
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 25;
  controls.minDistance = 2;
  controls.target.copy(targetPosition); // Make controls rotate around the heart planet

  // 5. Build Galaxy (Spiral Particle System)
  const galaxyParams = {
    count: 120000,
    size: 0.022,
    radius: 30, // Much larger and wider galaxy
    branches: 3,
    spin: 1.2,
    randomness: 0.45,
    power: 3,
    insideColor: '#ff79c6', // Pink violet theme
    outsideColor: '#bd93f9'
  };

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(galaxyParams.count * 3);
  const colors = new Float32Array(galaxyParams.count * 3);

  const colorInside = new THREE.Color(galaxyParams.insideColor);
  const colorOutside = new THREE.Color(galaxyParams.outsideColor);

  for (let i = 0; i < galaxyParams.count; i++) {
    const x = Math.random() * galaxyParams.radius;
    const branchAngle = ((i % galaxyParams.branches) / galaxyParams.branches) * Math.PI * 2;
    const spinAngle = x * galaxyParams.spin;

    const randomX = Math.pow(Math.random(), galaxyParams.power) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * x;
    const randomY = Math.pow(Math.random(), galaxyParams.power) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * x * 0.5;
    const randomZ = Math.pow(Math.random(), galaxyParams.power) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * x;

    // We flatten the galaxy disk along the Y axis
    positions[i * 3] = Math.cos(branchAngle + spinAngle) * x + randomX;
    positions[i * 3 + 1] = randomY;
    positions[i * 3 + 2] = Math.sin(branchAngle + spinAngle) * x + randomZ;

    const mixedColor = colorInside.clone();
    mixedColor.lerp(colorOutside, x / galaxyParams.radius);

    colors[i * 3] = mixedColor.r;
    colors[i * 3 + 1] = mixedColor.g;
    colors[i * 3 + 2] = mixedColor.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Particle texture
  const canvasTexture = document.createElement('canvas');
  canvasTexture.width = 16;
  canvasTexture.height = 16;
  const ctx = canvasTexture.getContext('2d');
  const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 16, 16);
  const particleTexture = new THREE.CanvasTexture(canvasTexture);

  const material = new THREE.PointsMaterial({
    size: galaxyParams.size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    map: particleTexture,
    transparent: true
  });

  galaxyPoints = new THREE.Points(geometry, material);
  scene.add(galaxyPoints);

  // 6. Build the Heart-Shaped Planet
  const heartShape = new THREE.Shape();
  const hx = 0, hy = 0;
  heartShape.moveTo( hx + 0.25, hy + 0.25 );
  heartShape.bezierCurveTo( hx + 0.25, hy + 0.25, hx + 0.2, hy, hx, hy );
  heartShape.bezierCurveTo( hx - 0.3, hy, hx - 0.3, hy + 0.35, hx - 0.3, hy + 0.35 );
  heartShape.bezierCurveTo( hx - 0.3, hy + 0.55, hx - 0.15, hy + 0.77, hx + 0.25, hy + 0.95 );
  heartShape.bezierCurveTo( hx + 0.65, hy + 0.77, hx + 0.8, hy + 0.55, hx + 0.8, hy + 0.35 );
  heartShape.bezierCurveTo( hx + 0.8, hy + 0.35, hx + 0.8, hy, hx + 0.5, hy );
  heartShape.bezierCurveTo( hx + 0.35, hy, hx + 0.25, hy + 0.25, hx + 0.25, hy + 0.25 );

  const extrudeSettings = {
    depth: 0.15,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.04,
    bevelThickness: 0.04
  };
  
  const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
  heartGeo.center(); // Center the heart geometry

  // Glossy and emissive pink material
  const heartMat = new THREE.MeshStandardMaterial({
    color: 0xff3366,
    emissive: 0xff1493,
    emissiveIntensity: 0.8,
    roughness: 0.25,
    metalness: 0.15
  });

  specialStar = new THREE.Mesh(heartGeo, heartMat);
  specialStar.position.copy(targetPosition);
  specialStar.rotation.x = Math.PI; // Face the camera upright
  scene.add(specialStar);

  // Soft pulsing light centered at the heart planet
  specialLight = new THREE.PointLight(0xff007f, 3, 10);
  specialLight.position.copy(targetPosition);
  scene.add(specialLight);

  // Ambient lighting to make the heart material look glossy
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  // 7. Load textures for the flying photos (20 real couple photos)
  const textureLoader = new THREE.TextureLoader();
  const photoPaths = [
    '/memories/ho_guom/IMG_20260702_122704.jpg',
    '/memories/ho_guom/MYXJ_20260701221636303_save.jpg',
    '/memories/ho_guom/MYXJ_20260702011415717_save.jpg',
    '/memories/ho_guom/MYXJ_20260702101058064_save.jpg',
    '/memories/ho_guom/MYXJ_20260702113555727_save.jpg',
    '/memories/ho_guom/MYXJ_20260702123529828_save.jpg',
    '/memories/ho_guom/MYXJ_20260702141422327_save.jpg',
    '/memories/ho_guom/MYXJ_20260702154948700_save.jpg',
    '/memories/ho_guom/MYXJ_20260702163330274_save.jpg',
    '/memories/ho_guom/MYXJ_20260702172248977_save.jpg',
    '/memories/nha_tho/MYXJ_20260702173050106_save.jpg',
    '/memories/nha_tho/MYXJ_20260702181127610_save.jpg',
    '/memories/nha_tho/MYXJ_20260702191943598_save.jpg',
    '/memories/nha_tho/MYXJ_20260702193229840_save.jpg',
    '/memories/nha_tho/MYXJ_20260702193950801_save.jpg',
    '/memories/cafe_phim/MYXJ_20260702202209569_save.jpg',
    '/memories/cafe_phim/MYXJ_20260702203013187_save.jpg',
    '/memories/cafe_phim/MYXJ_20260702204707510_save.jpg',
    '/memories/cafe_phim/MYXJ_20260702205212119_save.jpg',
    '/memories/cafe_phim/MYXJ_20260702205852469_save.jpg'
  ];
  textures = photoPaths.map(path => textureLoader.load(path));

  // 8. Raycaster for clicking the Heart Planet
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener('click', (event) => {
    if (isTransitioning || !searchStarted) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(specialStar);

    if (intersects.length > 0) {
      triggerHeartPhotoTransition();
    }
  });

  // Window Resize
  window.addEventListener('resize', onWindowResize);

  // Start Animation Loop
  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Synthesize Heartbeat sound programmatically using Web Audio API
function playHeartbeatLoop() {
  if (heartbeatInterval) return;

  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Resume audio context if suspended (browser security)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const playThump = (time, frequency, duration, gainVal) => {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, time);
      osc.frequency.exponentialRampToValueAtTime(5, time + duration);

      gainNode.gain.setValueAtTime(gainVal * heartbeatVolume, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start(time);
      osc.stop(time + duration);
    };

    const triggerHeartbeat = () => {
      const now = audioCtx.currentTime;
      // Lub (First thump - higher pitch, louder)
      playThump(now, 55, 0.16, 0.9);
      // Dub (Second thump - lower pitch, slightly softer)
      playThump(now + 0.22, 45, 0.14, 0.65);
    };

    triggerHeartbeat();
    heartbeatInterval = setInterval(triggerHeartbeat, 1200); // ~50 BPM
  } catch (err) {
    console.error("Failed to synthesize heartbeat sound:", err);
  }
}

function stopHeartbeatLoop() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Radar scan simulation with automatic zoom
function startRadarScan() {
  scanProgress = 0;
  clearInterval(scanInterval);

  scanInterval = setInterval(() => {
    if (isTransitioning) {
      clearInterval(scanInterval);
      return;
    }

    scanProgress += Math.floor(Math.random() * 2) + 1;
    if (scanProgress >= 100) {
      scanProgress = 100;
      clearInterval(scanInterval);
      
      radarStatus.innerHTML = "TÌM THẤY HÀNH TINH TRÁI TIM! Nhấp vào trái tim để mở khóa album...";
      radarProgress.style.width = "100%";
      radarProgress.innerText = "100%";
      radarHint.innerHTML = "❤️ CLICK VÀO HÀNH TINH TRÁI TIM ĐỂ XEM ALBUM ❤️";
      radarHint.style.color = "#ff79c6";
      radarHint.style.fontSize = "0.85rem";
      radarHint.style.fontWeight = "bold";
    } else {
      radarProgress.style.width = `${scanProgress}%`;
      radarProgress.innerText = `${scanProgress}%`;

      // Slow zoom interpolation based on scan progress
      const pct = scanProgress / 100;
      cameraTargetPos.copy(startCamPos).lerp(endCamPos, pct);

      // Status updates
      if (scanProgress < 15) {
        radarStatus.innerHTML = "Khởi động kính thiên văn quang học... [Đang zoom]";
      } else if (scanProgress < 40) {
        radarStatus.innerHTML = "Quét quang phổ hồng ngoại dải ngân hà... [Không phát hiện]";
      } else if (scanProgress < 68) {
        radarStatus.innerHTML = "Phát hiện tần số dao động sinh học lạ... Căn chỉnh camera...";
      } else if (scanProgress < 85) {
        radarStatus.innerHTML = "Định vị một hành tinh hình trái tim riêng biệt! Khởi động radar âm thanh...";
        // Start playing heartbeat once we are close
        playHeartbeatLoop();
        // Dynamic volume increase as we get closer
        heartbeatVolume = 0.3 + (scanProgress / 100) * 0.6;
      } else {
        radarStatus.innerHTML = "Đã khóa mục tiêu: HÀNH TINH TRÁI TIM (Khoảng cách cực cận)";
        heartbeatVolume = 1.0;
      }

      // Tick coordinates
      const lat = (Math.random() * 90 - 45 + (1 - pct) * 45).toFixed(2);
      const lon = (Math.random() * 180 - 90 + (1 - pct) * 90).toFixed(2);
      const sec = Math.floor(scanProgress * 6.8);
      radarCoords.innerHTML = `SEC-${sec.toString().padStart(3, '0')} : LAT ${lat} : LON ${lon}`;
    }
  }, 220);
}

// Custom 3D flying photos roll up transition
function triggerHeartPhotoTransition() {
  if (isTransitioning) return;
  isTransitioning = true;
  clearInterval(scanInterval);

  // Speed up heartbeat loop to represent excitement!
  stopHeartbeatLoop();
  if (audioCtx) {
    let fastHeartbeatCount = 0;
    const playFastThump = () => {
      const now = audioCtx.currentTime;
      // Lub
      const o1 = audioCtx.createOscillator();
      const g1 = audioCtx.createGain();
      o1.type = 'sine';
      o1.frequency.setValueAtTime(65, now);
      o1.frequency.exponentialRampToValueAtTime(10, now + 0.12);
      g1.gain.setValueAtTime(1.0, now);
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      o1.connect(g1); g1.connect(audioCtx.destination);
      o1.start(now); o1.stop(now + 0.12);

      // Dub
      const o2 = audioCtx.createOscillator();
      const g2 = audioCtx.createGain();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(55, now + 0.15);
      o2.frequency.exponentialRampToValueAtTime(10, now + 0.1);
      g2.gain.setValueAtTime(0.8, now + 0.15);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      o2.connect(g2); g2.connect(audioCtx.destination);
      o2.start(now + 0.15); o2.stop(now + 0.25);
      
      fastHeartbeatCount++;
      if (fastHeartbeatCount < 8) {
        setTimeout(playFastThump, 500); // 120 bpm fast heartbeat
      }
    };
    playFastThump();
  }

  radarStatus.innerHTML = "ĐANG TỔNG HỢP KÝ ỨC...";
  radarStatus.style.color = "#ff79c6";
  radarHint.innerHTML = "Bức tranh kỷ niệm đang được ghép lại từ vũ trụ!";

  // 1. Create flying photo planes bursting from the heart
  const photoGeometry = new THREE.PlaneGeometry(0.5, 0.35);

  // Load dynamic uploaded user photos from localStorage as textures to include them in the flight
  const activeTextures = [...textures];
  const dynamicLoader = new THREE.TextureLoader();
  for (let u = 1; u <= 16; u++) {
    const userImgData = localStorage.getItem(`find-you-user-img-${u}`);
    if (userImgData) {
      try {
        const userTex = dynamicLoader.load(userImgData);
        activeTextures.push(userTex);
      } catch (err) {
        console.warn("Failed to load user image from localStorage into 3D flyout:", err);
      }
    }
  }

  for (let i = 0; i < flyingPhotosCount; i++) {
    // White border background and texture front
    const mat = new THREE.MeshBasicMaterial({
      map: activeTextures[i % activeTextures.length],
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    });

    const mesh = new THREE.Mesh(photoGeometry, mat);
    // Start at heart position
    mesh.position.copy(targetPosition);
    // Random initial rotation
    mesh.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );

    scene.add(mesh);

    // Save metadata for animation
    flyingPhotos.push({
      mesh: mesh,
      material: mat,
      seed: Math.random() * 100,
      angleOffset: Math.random() * Math.PI * 2,
      speedY: 0.5 + Math.random() * 1.5,
      radiusOffset: 0.5 + Math.random() * 2.5
    });
  }

  // 2. Animate the photos: burst out -> spiral/roll up towards the camera -> fade to white
  const transitionDuration = 7500; // 7.5 seconds (slower, smoother transition to view photos)
  const startTime = Date.now();
  
  // Disable orbit controls
  controls.enabled = false;

  function runTransition() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / transitionDuration, 1);

    // Zoom the camera even closer into the heart
    camera.position.lerp(targetPosition.clone().add(new THREE.Vector3(0, 0, 0.4)), 0.04);
    camera.lookAt(targetPosition);

    // Pulsing heart speed increase (relative to 0.6 base scale)
    const baseScale = 0.6;
    const pulseScale = baseScale * (1.0 + Math.sin(progress * 40) * 0.25 * (1 - progress));
    specialStar.scale.set(pulseScale, pulseScale, pulseScale);
    specialLight.intensity = 3.5 * (pulseScale / baseScale);

    // Slow spin galaxy
    galaxyPoints.rotation.y += 0.03 * (1 + progress * 8);

    // Animate each photo
    flyingPhotos.forEach((photo) => {
      const { mesh, material, seed, angleOffset, speedY, radiusOffset } = photo;

      if (progress < 0.25) {
        // Phase 1: Burst outwards (fade in and push away)
        const burstProgress = progress / 0.25;
        material.opacity = burstProgress;

        // Move radially outward from heart
        const dir = new THREE.Vector3(
          Math.sin(angleOffset) * Math.cos(seed),
          Math.sin(seed),
          Math.cos(angleOffset) * Math.cos(seed)
        ).normalize();

        mesh.position.copy(targetPosition).addScaledVector(dir, burstProgress * radiusOffset);
      } else {
        // Phase 2: Spiral and roll up together towards camera (center)
        const rollProgress = (progress - 0.25) / 0.75; // 0 to 1

        // Spiraling towards camera view axis
        // We define spiral coordinates centered around targetPosition
        const angle = angleOffset + rollProgress * 15; // spin spiral
        const currentRadius = radiusOffset * (1 - rollProgress); // contracting
        
        // Calculate position along camera vector
        const camDir = new THREE.Vector3().subVectors(camera.position, targetPosition);
        const targetPos = targetPosition.clone().addScaledVector(camDir, rollProgress * 0.95);

        // Add circular offset to simulate spiral cylinder
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(camDir, up).normalize();
        const localUp = new THREE.Vector3().crossVectors(right, camDir).normalize();

        targetPos.addScaledVector(right, Math.cos(angle) * currentRadius);
        targetPos.addScaledVector(localUp, Math.sin(angle) * currentRadius);

        mesh.position.lerp(targetPos, 0.15);

        // Spin photos fast as they roll up
        mesh.rotation.x += 0.05;
        mesh.rotation.y += 0.08;

        // Fade out right before collapsing
        if (rollProgress > 0.8) {
          material.opacity = (1 - rollProgress) * 5;
        }
      }
    });

    if (progress < 1) {
      requestAnimationFrame(runTransition);
    } else {
      // Transition complete! Cleanup meshes and switch screen
      completeScrapbookTransition();
    }
  }

  runTransition();
}

function completeScrapbookTransition() {
  stopHeartbeatLoop();

  // Remove photo meshes from scene
  flyingPhotos.forEach(photo => {
    scene.remove(photo.mesh);
    photo.mesh.geometry.dispose();
    photo.material.dispose();
  });
  flyingPhotos = [];

  // Fade out screen
  galaxyScreen.style.transition = 'opacity 0.8s ease-in-out';
  galaxyScreen.style.opacity = 0;

  setTimeout(() => {
    galaxyScreen.classList.remove('active');
    scrapbookScreen.classList.add('active');
    scrapbookScreen.style.opacity = 0;
    
    setTimeout(() => {
      scrapbookScreen.style.transition = 'opacity 0.8s ease-in-out';
      scrapbookScreen.style.opacity = 1;
      
      // Heart explosion confetti!
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#ff79c6', '#ff5555', '#ffb86c', '#ff79c6', '#bd93f9']
      });
      
      initScrapbook();
    }, 50);
  }, 800);
}

// Render loop
let clock = new THREE.Clock();

function animate() {
  if (!scene) return;
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // If search started and not warping, handle automatic slow zoom and heart rotation
  if (searchStarted && !isTransitioning) {
    // Lerp camera position closer based on search progress (only until scan completes, so manual zoom controls aren't locked)
    if (scanProgress < 100) {
      camera.position.lerp(cameraTargetPos, 0.035);
    }
    
    // Slowly rotate galaxy points
    galaxyPoints.rotation.y = elapsedTime * 0.02;
    
    // Heart beats and rotates (using a base scale of 0.6 to make it slightly larger and easier to see/click)
    const baseScale = 0.6;
    const pulse = baseScale * (1 + Math.sin(elapsedTime * (heartbeatInterval ? 4.5 : 2.5)) * 0.12);
    specialStar.scale.set(pulse, pulse, pulse);
    specialLight.intensity = 1.8 + Math.sin(elapsedTime * (heartbeatInterval ? 4.5 : 2.5)) * 1.0;

    // Slowly rotate the heart planet to look 3D and dynamic
    specialStar.rotation.y = elapsedTime * 0.25;
    specialStar.rotation.z = Math.sin(elapsedTime * 0.5) * 0.1;
  }

  controls.update();
  renderer.render(scene, camera);
}
