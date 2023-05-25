import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';
import gsap from 'https://cdn.skypack.dev/gsap@3.10.4';
import Stats from 'https://cdn.skypack.dev/stats.js';
import dat from 'https://cdn.skypack.dev/dat.gui';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';

console.clear();

let points = {
  everest: new THREE.Vector3(-37.86, 33, 3.2),
  lhotseshar: new THREE.Vector3(-19.86, 29, 36.57),
  nuptse: new THREE.Vector3(-75.49, 23, 26.36),
  changtse: new THREE.Vector3(-47.68, 19.66, -37.55),
  lhotse: new THREE.Vector3(-28.86, 29.5, 32.85)
};

let elTooltips = {
  everest: document.querySelector('#everest'),
  lhotseshar: document.querySelector('#lhotseshar'),
  nuptse: document.querySelector('#nuptse'),
  changtse: document.querySelector('#changtse'),
  lhotse: document.querySelector('#lhotse')
};

let elWireframe = document.querySelector('#wireframe');
let elFill = document.querySelector('#fill');
let elCompass = document.querySelector('#compass');
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
const light = new THREE.HemisphereLight(0xffffff, 0x112B3C, 1);
scene.add(light);

let wireframeHelper;
let mountain;
/* MOUNTAIN */
const loader = new GLTFLoader();
loader.load('https://mamboleoo.be/CodePen/random/Brussels/everest.glb', (gltf) => {
  mountain = gltf.scene.children[0].clone();
  // Modify and configure the mountain mesh as needed

  // Add the mountain to the scene
  mountain.name = 'Mountain'; // Set a name to identify the object later
  group.add(mountain);

  // Create bounding box around the group
  const boundingBox = new THREE.Box3().setFromObject(group);
  const boundingGeometry = new THREE.BoxBufferGeometry().setFromPoints(boundingBox.getCorners());

  // Create wireframe helper using the bounding box geometry
  wireframeHelper = new THREE.LineSegments(
    new THREE.WireframeGeometry(boundingGeometry),
    new THREE.LineBasicMaterial({ color: 0xff0000 })
  );
  wireframeHelper.visible = false;
  wireframeHelper.name = 'WireframeHelper'; // Set a name to identify the object later
  scene.add(wireframeHelper);

  toggleWireframe();
  toggleFill();
});

/* SNOWFALL */
// ... (existing snowfall code)

/* RENDER */
function render() {
  requestAnimationFrame(render);

  controls.update();

  // Update the compass
  let cameraDirection = camera.getWorldDirection(new THREE.Vector3());
  let theta = Math.atan2(cameraDirection.x, cameraDirection.z);
  elCompass.style.transform = `rotate(${(theta / (Math.PI * 2)) * 360}deg)`;

  renderer.render(scene, camera);
}

render();

/* STATS */
const stats = new Stats();
document.body.appendChild(stats.dom);

/* GUI */
const gui = new dat.GUI();
gui.add(controls, 'autoRotate').listen();
gui.add(controls, 'autoRotateSpeed', -10, 10).step(0.1).listen();
gui.close();

/* HELPERS */
// ... (existing helper code)

/* FUNCTIONS */
function projectTooltips() {
  const widthHalf = window.innerWidth / 2;
  const heightHalf = window.innerHeight / 2;

  Object.keys(points).forEach((key) => {
    const point = points[key];
    const vector = point.clone().project(camera);

    const x = vector.x * widthHalf + widthHalf;
    const y = -(vector.y * heightHalf) + heightHalf;

    elTooltips[key].style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });
}

function toggleWireframe() {
  if (wireframeHelper) {
    wireframeHelper.visible = !wireframeHelper.visible;
  }
}

function toggleFill() {
  if (mountain) {
    mountain.visible = !mountain.visible;
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  projectTooltips();
});

projectTooltips();
