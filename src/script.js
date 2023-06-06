import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls';

import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'https://cdn.skypack.dev/gsap@3.10.4';
import Stats from 'https://cdn.skypack.dev/stats.js';
import  dat from 'https://cdn.skypack.dev/dat.gui';


console.log(OrbitControls); // Check if it prints the correct module object
const points = {
  everest: new THREE.Vector3(-37.86, 33, 3.2),
  lhotseshar: new THREE.Vector3(-19.86, 29, 36.57),
  nuptse: new THREE.Vector3(-75.49, 23, 26.36),
  changtse: new THREE.Vector3(-47.68, 19.66, -37.55),
  lhotse: new THREE.Vector3(-28.86, 29.5, 32.85),
};

const elTooltips = {
  everest: document.querySelector('#everest'),
  lhotseshar: document.querySelector('#lhotseshar'),
  nuptse: document.querySelector('#nuptse'),
  changtse: document.querySelector('#changtse'),
  lhotse: document.querySelector('#lhotse'),
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
camera.position.z = 90;

const group = new THREE.Group();
scene.add(group);

const keys = {
  W: false,
  S: false,
  A: false,
  D: false
};

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

function handleKeyDown(event) {
  const key = event.key.toUpperCase();
  if (keys.hasOwnProperty(key)) {
    keys[key] = true;
  }
}

function handleKeyUp(event) {
  const key = event.key.toUpperCase();
  if (keys.hasOwnProperty(key)) {
    keys[key] = false;
  }
}
/* RENDERING */
let cameraAngle = new THREE.Vector3();
const center = new THREE.Vector3(0,-500,0);
function render(a) {
  requestAnimationFrame(render);
  
  controls.update();
  projectTooltips();
  
  // Update the compass
  let cameraDirection = camera.getWorldDirection(cameraAngle);
  let theta = Math.atan2(cameraDirection.x,cameraDirection.z);
  elCompass.style.transform = `rotate(${(theta / (Math.PI * 2)) * 360}deg)`;
  
  renderer.render(scene, camera);
}
// Center the scene on the Everest
gsap.set(group.position, {
  x: -points.everest.x,
  y: 0,
  z: -points.everest.z,
});

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: document.querySelector('#myCanvas'),
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x112B3C);
renderer.setSize(window.innerWidth, window.innerHeight);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.maxPolarAngle = 2;
controls.minDistance = 50;
controls.maxDistance = Infinity;

/* Handle auto rotation of the scene */
let rotationTimeout = null;
let firstChange = true;
controls.addEventListener('change', () => {
  if (firstChange) {
    firstChange = false;
    return;
  }

  const autoRotation = gsap.timeline();
  autoRotation.to(camera.position, {
    x: -points.everest.x,
    y: 0,
    z: -points.everest.z,
    duration: 20,
    ease: 'power1.inOut',
    repeat: -1,
    yoyo: true,
  });

  autoRotation.play();

  rotationTimeout = window.clearTimeout(rotationTimeout);
  rotationTimeout = window.setTimeout(() => {
    gsap.to(autoRotation, {
      timeScale: 1,
      duration: 20,
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
  side: THREE.DoubleSide,
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
gui.add(camera, 'zoom', 50, 300);

// Plane
const planeGeometry = new THREE.PlaneGeometry(500);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = 10;
plane.position.z = -500;
scene.add(plane);

// Roads
const roadGeometry = new THREE.CatmullRomCurve3(100);

const numRoads = 5;
const roadLength = 500;
const x = 1.0; // or any other value for the x coordinate
const z= 1.0;
for (let i = 0; i < numRoads; i++) {
  const scale = i / numRoads;
  const radius = roadLength / 10;
  const angle = 2 * Math.PI * scale;
  
  roadGeometry[i] = new THREE.CatmullRomCurve3(x, 0, z);
}

const roadMaterial = new THREE.MeshBasicMaterial({ color: 0.8, side: THREE.DoubleSide });
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.position.y = 10;
scene.add(road);

function animate() {
  requestAnimationFrame(animate);
  /* STATS */
  const stats = new Stats();
  document.body.appendChild(stats.dom);
  
  controls.update();

  stats.update(); // Use stats.update() instead of stats.begin() and stats.end()

  renderer.render(scene, camera);
}

// Initialize the animation loop
if (typeof window !== 'undefined') {
  animate();
  render();
}
