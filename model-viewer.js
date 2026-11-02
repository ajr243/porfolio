import * as THREE from 'three';
import { OrbitControls } from './assets/vendor/three/OrbitControls.js';
import { STLLoader } from './assets/vendor/three/STLLoader.js';

function createViewer(root) {
  const stage = root.querySelector('[data-cad-stage]');
  const status = root.querySelector('[data-cad-status]');
  const spin = root.querySelector('[data-cad-spin]');
  const wire = root.querySelector('[data-cad-wire]');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x101c1a);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    stage.append(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.01, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 0.5;
    controls.maxDistance = 12;
    controls.autoRotateSpeed = 1.2;
    controls.zoomToCursor = true;
    scene.add(new THREE.HemisphereLight(0xf1ffe6, 0x374d58, 3));
    for (const [color, intensity, position] of [[0xfff5df, 4, [3, 5, 4]], [0x9bbfff, 3, [-4, 2, -3]], [0xd9edbb, 2, [0, 1, -4]]]) {
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(...position); scene.add(light);
    }
    const grid = new THREE.GridHelper(12, 40, 0x527162, 0x263c34);
    scene.add(grid);
    let mesh;
    const material = new THREE.MeshStandardMaterial({ color: 0xc9d9b3, metalness: 0.35, roughness: 0.32, side: THREE.DoubleSide });
    function view(name = 'iso') {
      controls.target.set(0, 0, 0);
      camera.up.set(0, 1, 0);
      const distance = 1.05 / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.min(camera.aspect, 1);
      const direction = name === 'top' ? new THREE.Vector3(0, 1, 0.001) : name === 'front' ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1.1, 0.8, 1.4).normalize();
      camera.position.copy(direction.multiplyScalar(distance));
      controls.maxDistance = Math.max(12, distance * 2);
      controls.update();
    }
    new STLLoader().load(root.dataset.model, geometry => {
      geometry.rotateX(-Math.PI / 2);
      geometry.computeBoundingBox();
      const size = geometry.boundingBox.getSize(new THREE.Vector3());
      const longest = Math.max(size.x, size.y, size.z);
      if (!Number.isFinite(longest) || longest <= 0) { geometry.dispose(); status.textContent = 'This model could not be displayed. You can still download the STL below.'; return; }
      geometry.center();
      geometry.scale(2.5 / longest, 2.5 / longest, 2.5 / longest);
      geometry.computeVertexNormals();
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      grid.position.y = -size.y * (2.5 / longest) / 2 - 0.025;
      root.querySelector('[data-cad-details]').textContent = `Explore the surfaces and geometry of my CAD model. ${Math.round(geometry.attributes.position.count / 3).toLocaleString()} triangles in the exported STL mesh. Use wireframe to inspect the geometry.`;
      status.hidden = true;
      stage.dataset.loaded = 'true';
      view();
    }, undefined, () => { status.textContent = 'The model could not load. Try refreshing, or download the STL below.'; });
    root.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => view(button.dataset.view)));
    spin.addEventListener('click', () => { controls.autoRotate = !controls.autoRotate; spin.setAttribute('aria-pressed', String(controls.autoRotate)); });
    wire.addEventListener('click', () => { material.wireframe = !material.wireframe; wire.setAttribute('aria-pressed', String(material.wireframe)); });
    const full = root.querySelector('[data-cad-fullscreen]');
    full.hidden = !document.fullscreenEnabled;
    full.addEventListener('click', async () => {
      try { if (document.fullscreenElement) await document.exitFullscreen(); else await root.querySelector('[data-cad-viewer]').requestFullscreen(); }
      catch { status.hidden = false; status.textContent = 'Full screen is unavailable in this browser.'; }
    });
    document.addEventListener('fullscreenchange', () => { full.textContent = document.fullscreenElement === root.querySelector('[data-cad-viewer]') ? 'Exit full screen' : 'Full screen'; });
    stage.addEventListener('keydown', event => {
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Home') { view(); return; }
      const offset = camera.position.clone().sub(controls.target);
      if (['+', '=', '-'].includes(event.key)) camera.position.copy(controls.target).add(offset.multiplyScalar(event.key === '-' ? 1.12 : 0.89));
      else if (event.shiftKey) {
        const move = new THREE.Vector3(event.key === 'ArrowLeft' ? -0.1 : event.key === 'ArrowRight' ? 0.1 : 0, event.key === 'ArrowUp' ? 0.1 : event.key === 'ArrowDown' ? -0.1 : 0, 0).applyQuaternion(camera.quaternion);
        camera.position.add(move); controls.target.add(move);
      } else {
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.theta += event.key === 'ArrowLeft' ? 0.12 : event.key === 'ArrowRight' ? -0.12 : 0;
        spherical.phi += event.key === 'ArrowUp' ? -0.12 : event.key === 'ArrowDown' ? 0.12 : 0;
        spherical.makeSafe(); camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
      }
      controls.update();
    });
    let initial = true;
    new ResizeObserver(() => {
      const { width, height } = stage.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height; camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (initial) { view(); initial = false; }
    }).observe(stage);
    let visible = true;
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(stage);
    renderer.setAnimationLoop(() => { if (!visible || document.hidden) return; controls.update(); renderer.render(scene, camera); });
    renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); status.hidden = false; status.textContent = '3D rendering was interrupted. Refresh to reload the viewer.'; });
  } catch (error) {
    renderer?.dispose();
    status.textContent = '3D viewing is unavailable in this browser. Download the STL below to explore the model.';
    root.querySelector('.cad-toolbar').hidden = true;
    console.error('CAD viewer:', error);
  }

}

// Load each model only as its showcase approaches the viewport.
const showcases = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    showcases.unobserve(entry.target);
    createViewer(entry.target);
  }
}, { rootMargin: '300px' });
document.querySelectorAll('.cad-section').forEach(section => showcases.observe(section));
