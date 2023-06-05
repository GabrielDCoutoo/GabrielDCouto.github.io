import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.119.1/examples/jsm/controls/OrbitControls.js';
import Stats from 'https://cdnjs.cloudflare.com/ajax/libs/stats.js/7/Stats.min.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import chroma from 'https://cdnjs.cloudflare.com/ajax/libs/chroma-js/2.4.2/chroma.min.js';

console.clear();

const points = {
  everest: new THREE.Vector3(-37.86, 33, 3.2),
  lhotseshar: new THREE.Vector3(-19.86, 29, 36.57),
  nuptse: new THREE.Vector3(-75.49, 23, 26.36),
  changtse: new THREE.Vector3(-47.68, 19.66, -37.55),
  lhotse: new THREE.Vector3(-28.86, 29.5, 32.85)
};

const elTooltips = {
  everest: document.querySelector('#everest'),
  lhotseshar: document.querySelector('#lhotseshar'),
  nuptse: document.querySelector('#nuptse'),
  changtse: document.querySelector('#changtse'),
  lhotse: document.querySelector('#lhotse')
};

const elWireframe = document.querySelector('#wireframe');
const elFill = document.querySelector('#fill');
const elCompass = document.querySelector('#compass');
let gradient = chroma.scale(['#EFEFEF', '#0c440ec9', '#205375', '#112B3C', '#112B3C']);

if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  gradient = chroma.scale(['#112B3C', '#205375', '#57e505', '#EFEFEF', '#EFEFEF']);
}

/* SETUP */
const scene = new THREE.Scene();
if (!window.matchMedia('(prefers-color-scheme: dark)').matches) {
  scene.fog = new THREE.Fog(0x112B3C, 250, 350);
}

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.y = 30;
camera.position.x = -60;
camera.position.z = 110;

const group = new THREE.Group();
scene.add(group);

// Center the scene on the Everest
gsap.set(group.position, {
  x: -points.everest.x,
  y: 0,
  z: -points.everest.z
});

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: document.querySelector('#myCanvas')
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x112B3C);
renderer.setSize(window.innerWidth, window.innerHeight);

/* CONTROLS */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.maxPolarAngle = 2;
controls.minDistance = 50;
controls.maxDistance = 180;

/* Handle auto rotation of the scene */
let rotationTimeout = null;
let firstChange = true;

controls.addEventListener('change', () => {
  if (firstChange) {
    firstChange = false;
    return;
  }

  gsap.to(autoRotation, {
    timeScale: 0,
    duration: 0.2
  });
  rotationTimeout = window.clearTimeout(rotationTimeout);
  rotationTimeout = window.setTimeout(() => {
    gsap.to(autoRotation, {
      timeScale: 1,
      duration: 20
    });
  }, 2000);
});

/* LIGHTS */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(-1, 0.75, 1);
scene.add(dirLight);

/* OBJECTS */
const loader = new GLTFLoader();
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.5,
  metalness: 0.5,
  side: THREE.DoubleSide
});

loader.load('everest.gltf', (gltf) => {
  const mesh = gltf.scene.children[0];
  mesh.material = material;
  mesh.scale.set(0.5, 0.5, 0.5);
  group.add(mesh);
});

/* STATS */
const stats = new Stats();
document.body.appendChild(stats.dom);

/* GUI */
const gui = new dat.GUI();
gui.add(camera.position, 'x', -200, 200);
gui.add(camera.position, 'y', -200, 200);
gui.add(camera.position, 'z', -200, 200);
gui.add(controls, 'autoRotateSpeed', 0, 10);
gui.add(controls, 'enableRotate');

/* ANIMATION */
const autoRotation = { timeScale: 1 };
gsap.to(group.rotation, {
  y: Math.PI * 2,
  duration: 60,
  ease: 'none',
  repeat: -1,
  modifiers: {
    y: gsap.utils.wrap(0, Math.PI * 2)
  },
  paused: true,
  timeScale: autoRotation.timeScale
});

/* RENDER LOOP */
function render() {
  stats.begin();

  const wireframe = elWireframe.checked;
  const fill = elFill.checked;
  const compass = elCompass.checked;

  if (wireframe) {
    group.children.forEach((mesh) => {
      mesh.material.wireframe = true;
    });
  } else {
    group.children.forEach((mesh) => {
      mesh.material.wireframe = false;
    });
  }

  if (fill) {
    group.children.forEach((mesh) => {
      mesh.material.opacity = 1;
      mesh.material.transparent = false;
    });
  } else {
    group.children.forEach((mesh) => {
      mesh.material.opacity = 0.5;
      mesh.material.transparent = true;
    });
  }

  if (compass) {
    controls.target.set(points.everest.x, points.everest.y, points.everest.z);
  } else {
    controls.target.set(0, 0, 0);
  }

  // Update tooltip positions
  Object.keys(points).forEach((pointName) => {
    const point = points[pointName];
    const tooltip = elTooltips[pointName];
    const pos = point.clone().applyMatrix4(group.matrixWorld);
    const screenPos = pos.clone().project(camera);
    const x = (screenPos.x + 1) / 2 * window.innerWidth;
    const y = (-screenPos.y + 1) / 2 * window.innerHeight;
    tooltip.style.transform = `translate(${x}px, ${y}px)`;
  });

  renderer.render(scene, camera);

  stats.end();

  requestAnimationFrame(render);
}

requestAnimationFrame(render);

