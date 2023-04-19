import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'https://cdn.skypack.dev/gsap@3.10.4';
console.clear();

let points = {
  everest: new THREE.Vector3(-37.86,33,3.2),
  lhotseshar: new THREE.Vector3(-19.86,29,36.57),
  nuptse: new THREE.Vector3(-75.49,23,26.36),
  changtse: new THREE.Vector3(-47.68,19.66,-37.55),
  lhotse: new THREE.Vector3(-28.86,29.5,32.85)
};
let elTooltips = {
  Torre: document.querySelector('#Torre'),
  Velho: document.querySelector('#Velho'),
  nuptse: document.querySelector('#nuptse'),
  changtse: document.querySelector('#changtse'),
  lhotse: document.querySelector('#lhotse')
};
let elWireframe = document.querySelector('#wireframe');
let elFill = document.querySelector('#fill');
let elCompass = document.querySelector('#compass');
let gradient = chroma.scale(['#EFEFEF','#0c440ec9','#205375','#112B3C','#112B3C']);
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  gradient = chroma.scale(['#112B3C','#205375', '#57e505', '#EFEFEF', '#EFEFEF']);
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
  antialias: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x112B3C);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

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
  rotationTimeout = window.setTimeout(afterControlChange, 800);
});

function afterControlChange () {
  gsap.to(autoRotation, {
    timeScale: 1,
    duration: 1,
    ease: 'power2.out'
  });
}

const autoRotation = gsap.to(scene.rotation, {
  y: Math.PI * 2,
  ease: 'none',
  duration: 80,
  repeat: -1
});

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.140.0/examples/js/libs/draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
let ground;
let ground2;
loader.load('https://mamboleoo.be/CodePen/random/Brussels/everest.glb', setup);

function setup (model) {
  const geom = model.scene.children[0];
  geom.geometry.scale(-1,-1,1);
  
  ground = new THREE.Mesh(geom.geometry, new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: 2,
    vertexColors: true,
    transparent: true,
    opacity: (parseInt(elFill.value) / 100)
  }));
  const colors = [];
  let maxY = 0;
  let minY = 0;
  for (let i =0;i < ground.geometry.attributes.position.count;i++) {
    let y = ground.geometry.attributes.position.getY(i);
    if (y > maxY) {
      maxY = y;
    }
    if (y < minY) {
      minY = y;
    }
    y -= 26;
    y /= -85;
    let rgb = gradient(y).rgb();
    colors.push(rgb[0]/255, rgb[1]/255, rgb[2]/255);
  }
  ground.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
  group.add(ground);
  
  ground2 = ground.clone();
  ground2.material = ground.material.clone();
  ground2.material.color.set(0x000000);
  ground2.material.opacity = parseInt(elWireframe.value) / 100;
  ground2.material.wireframe = true;
  group.add(ground2);
  
  elWireframe.addEventListener('input', () => {
    gsap.to(ground2.material, {
      opacity: parseInt(elWireframe.value) / 100,
      duration: 0.4,
      ease: 'power1.out'
    });
  });
  elFill.addEventListener('input', () => {
    gsap.to(ground.material, {
      opacity: (parseInt(elFill.value) / 100),
      duration: 0.4,
      ease: 'power1.out'
    });
    ground2.material.color.setHSL(0, 0, 1 - (parseInt(elFill.value) / 100));
  });
}

// Center the camera to the clicked tooltip
for (let tooltip in elTooltips) {
  elTooltips[tooltip].addEventListener('click', () => {
    gsap.to(group.position, {
      x: -points[tooltip].x,
      y: 0,
      z: -points[tooltip].z,
      duration: 1.5,
      ease: 'power2.out'
    });
  });
}

function projectTooltips () {
  for (let point in points) {
    const projection = points[point].clone();
    projection.applyMatrix4(group.matrix);
    projection.applyMatrix4(scene.matrix);
    projection.project(camera);
    projection.x = (projection.x * window.innerWidth/2) + window.innerWidth/2;
    projection.y = -(projection.y * window.innerHeight/2) + window.innerHeight/2;
    elTooltips[point].style.transform = `translate3d(${projection.x}px, ${projection.y}px, 0)`;
    elTooltips[point].style.zIndex = 100 - Math.round((projection.z - 0.99) * 10000);
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

/* EVENTS */
function onWindowResize() {
  var stats;
var params = {
  snowfall: 10
};

window.addEventListener('load', init);

function init() {
  var frame = 5;
  var meshList = [];
  var renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#myCanvas'),
  });
  renderer.setPixelRatio(1);
  renderer.setSize(window.innerWidth , window.innerHeight);

  var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight);
  camera.position.set(0, 0, -10);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  var scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x232323 );
  scene.fog = new THREE.Fog( 0x999999, 0, 2000 );

  stats = new Stats();
  document.body.appendChild( stats.dom );

  // Add the necessary libraries
  var script = document.createElement('script');
  script.onload = function () {
    // Create a new SnowFlakes object
    var snowflakes = new SnowFlakes();
    // Add the SnowFlakes object to the scene
    scene.add(snowflakes);

    var gui = new dat.GUI();
    gui.add( params, 'snowfall', 0, 100 ).step( 1 );

    window.addEventListener( 'resize', function(){
      onWindowResize(camera, renderer);
    }, false );

    tick();
    function tick() {
      for (var i = 0; i < meshList.length; i++) {
        meshList[i].update();
      }
      snowflakes.update();
      renderer.render(scene, camera);
      requestAnimationFrame(tick);

      frame++;
      if(frame % 2 == 0) { return; }

      stats.update();
    }
  };
  script.src = 'https://cdn.rawgit.com/mrdoob/stats.js/v0.7.0/build/stats.min.js';
  document.head.appendChild(script);

  var threeScript = document.createElement('script');
  threeScript.onload = function () {
    console.log('Three.js loaded');
  };
  threeScript.src = 'https://cdn.rawgit.com/mrdoob/three.js/r89/build/three.min.js';
  document.head.appendChild(threeScript);
}

// Copy the SnowFlakes class code here

function onWindowResize(camera, renderer) {
  camera.aspect = window.innerWidth / window.innerHeight;
  
}

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);
requestAnimationFrame(render);


var stats;
var params = {
  snowfall: 10
};

window.addEventListener('load', init);

function init() {
  var frame = 5;
  var meshList = [];
  var renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#myCanvas'),
  });
  renderer.setPixelRatio(1);
  renderer.setSize(window.innerWidth , window.innerHeight);

  var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight);
  camera.position.set(0, 0, -10);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  var scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x232323 );
  scene.fog = new THREE.Fog( 0x999999, 0, 2000 );

  stats = new Stats();
  document.body.appendChild( stats.dom );

  // Add the necessary libraries
  var script = document.createElement('script');
  script.onload = function () {
    // Create a new SnowFlakes object
    var snowflakes = new SnowFlakes();
    // Add the SnowFlakes object to the scene
    scene.add(snowflakes);

    var gui = new dat.GUI();
    gui.add( params, 'snowfall', 0, 100 ).step( 1 );

    window.addEventListener( 'resize', function(){
      onWindowResize(camera, renderer);
    }, false );

    tick();
    function tick() {
      for (var i = 0; i < meshList.length; i++) {
        meshList[i].update();
      }
      snowflakes.update();
      renderer.render(scene, camera);
      requestAnimationFrame(tick);

      frame++;
      if(frame % 2 == 0) { return; }

      stats.update();
    }
  };
  script.src = 'https://cdn.rawgit.com/mrdoob/stats.js/v0.7.0/build/stats.min.js';
  document.head.appendChild(script);

  var threeScript = document.createElement('script');
  threeScript.onload = function () {
    console.log('Three.js loaded');
  };
  threeScript.src = 'https://cdn.rawgit.com/mrdoob/three.js/r89/build/three.min.js';
  document.head.appendChild(threeScript);
}