// app.js

// === MOUSE TRACKING ===
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function onMouseMove(event) {
  mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
}

if (!prefersReducedMotion) {
  window.addEventListener('mousemove', onMouseMove, { passive: true });
}

// === CUSTOM CURSOR GLOW ===
function initCursorGlow() {
  if (prefersReducedMotion || 'ontouchstart' in window) return;

  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.appendChild(glow);

  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring);

  let glowX = window.innerWidth / 2;
  let glowY = window.innerHeight / 2;

  window.addEventListener('mousemove', (e) => {
    glowX = e.clientX;
    glowY = e.clientY;
    ring.style.left = e.clientX + 'px';
    ring.style.top = e.clientY + 'px';
  }, { passive: true });

  document.querySelectorAll('a, button, .skill, .portfolio-item, .contact-category').forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('cursor-ring--active'));
    el.addEventListener('mouseleave', () => ring.classList.remove('cursor-ring--active'));
  });

  function updateGlow() {
    const currentLeft = parseFloat(glow.style.left) || glowX;
    const currentTop = parseFloat(glow.style.top) || glowY;
    glow.style.left = currentLeft + (glowX - currentLeft) * 0.12 + 'px';
    glow.style.top = currentTop + (glowY - currentTop) * 0.12 + 'px';
    requestAnimationFrame(updateGlow);
  }
  updateGlow();

  document.body.classList.add('custom-cursor');
}

// === THREE.JS SETUP ===
const canvas = document.querySelector('#bg');
if (!canvas || typeof THREE === 'undefined') {
  console.warn('Three.js canvas not found or THREE not loaded.');
} else {
  const scene = new THREE.Scene();
  const starGroup = new THREE.Group();
  const stars = [];

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.position.setZ(30);

  // === STARFIELD ===
  function addStar() {
    const geometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.15, 12, 12);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x6644aa,
      emissiveIntensity: 0.15,
    });
    const star = new THREE.Mesh(geometry, material);

    const [x, y, z] = Array(3)
      .fill()
      .map(() => THREE.MathUtils.randFloatSpread(200));

    star.position.set(x, y, z);
    star.userData = {
      baseX: x,
      baseY: y,
      baseZ: z,
      speed: 0.2 + Math.random() * 0.5,
      offset: Math.random() * Math.PI * 2,
    };

    stars.push(star);
    starGroup.add(star);
  }

  Array(250).fill().forEach(addStar);
  scene.add(starGroup);

  // === LIGHTING ===
  const mouseLight = new THREE.PointLight(0xcc88ff, 1.2, 120);
  mouseLight.position.set(0, 0, 40);
  scene.add(mouseLight);

  const pointLight = new THREE.PointLight(0xffffff, 0.6);
  pointLight.position.set(20, 20, 20);
  scene.add(pointLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const clock = new THREE.Clock();

  // === ANIMATION LOOP ===
  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    if (!prefersReducedMotion) {
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // Camera parallax follows cursor
      camera.position.x += (mouse.x * 8 - camera.position.x) * 0.04;
      camera.position.y += (mouse.y * 6 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      // Mouse light tracks cursor in 3D space
      mouseLight.position.x = mouse.x * 50;
      mouseLight.position.y = mouse.y * 40;
      mouseLight.position.z = 35 + mouse.y * 5;

      // Star group gentle rotation + per-star drift
      starGroup.rotation.y = elapsed * 0.02 + mouse.x * 0.15;
      starGroup.rotation.x = mouse.y * 0.08;

      stars.forEach((star) => {
        const { baseX, baseY, baseZ, speed, offset } = star.userData;
        const drift = Math.sin(elapsed * speed + offset) * 0.4;
        const pullX = mouse.x * 3 * Math.sin(offset);
        const pullY = mouse.y * 3 * Math.cos(offset);
        star.position.x = baseX + pullX + drift;
        star.position.y = baseY + pullY + drift * 0.5;
        star.position.z = baseZ + Math.cos(elapsed * speed * 0.7 + offset) * 0.3;
        star.rotation.x += 0.002;
        star.rotation.y += 0.003;
      });
    }

    renderer.render(scene, camera);
  }
  animate();

  // === HANDLE RESIZE ===
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// === GSAP ANIMATIONS ===
document.addEventListener('DOMContentLoaded', function () {
  if (typeof gsap === 'undefined') return;
  gsap.from('.site-header h1, header h1', { duration: 1, y: -30, opacity: 0 });
  gsap.from('.fade-in.delay, .site-header__tagline', { duration: 1, y: 20, opacity: 0, delay: 0.4 });
  gsap.from('.navbar-nav .nav-item', {
    duration: 0.6,
    y: 15,
    opacity: 0,
    stagger: 0.08,
    delay: 0.6,
  });
});

document.addEventListener('DOMContentLoaded', function() {
    initCursorGlow();
    // Hide loader after a short delay for smoothness
    // This existing loader logic should be preserved.
    setTimeout(function() {
      const loader = document.getElementById('loader');
      if (loader) {
        loader.classList.add('hide');
        setTimeout(() => {
          loader.style.display = 'none';
        }, 500);
      }
    }, 400); // Adjust delay as needed (ms)

    // === THEME TOGGLE LOGIC ===
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const body = document.body;

    // Function to update button icon based on theme
    const updateToggleButtonIcon = (isLightMode) => {
        if (themeToggleButton) {
            themeToggleButton.textContent = isLightMode ? '☀️' : '🌙';
        }
    };

    // Function to apply the stored theme or default
    const applyInitialTheme = () => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'light') {
            body.classList.add('light-mode');
            updateToggleButtonIcon(true);
        } else {
            // Default to dark mode if no theme is stored or if it's 'dark'
            body.classList.remove('light-mode'); // Explicitly remove if not light
            updateToggleButtonIcon(false);
        }
    };

    // Apply theme on initial load
    applyInitialTheme();

    // Add event listener for the toggle button
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            body.classList.toggle('light-mode');
            const isLightMode = body.classList.contains('light-mode');
            localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
            updateToggleButtonIcon(isLightMode);
        });
    }
});
