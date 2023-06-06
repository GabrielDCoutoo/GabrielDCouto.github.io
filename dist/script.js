import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'https://cdn.skypack.dev/gsap@3.10.4';
import Stats from 'https://cdn.skypack.dev/stats.js';
import  dat from 'https://cdn.skypack.dev/dat.gui';


console.clear();


let points = {
  everest: new THREE.Vector3(-37.86,33,3.2),
  lhotseshar: new THREE.Vector3(-19.86,29,36.57),
  nuptse: new THREE.Vector3(-75.49,23,26.36),
  changtse: new THREE.Vector3(-47.68,19.66,-37.55),
  lhotse: new THREE.Vector3(-28.86,29.5,32.85)
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
controls.autoRotate = true;
controls.autoRotateSpeed = 2; // Adjust the speed as desired
controls.enableDamping = true;
controls.enablePan = false;
controls.maxPolarAngle = 2;
controls.minDistance = 50;
controls.maxDistance = 180;

const gui = new dat.GUI();
gui.add(camera.position, 'x', -200, 200);
gui.add(camera.position, 'y', -200, 200);
gui.add(camera.position, 'z', -200, 200);
gui.add(camera, 'zoom', 50, 300);


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
let snowflakes_count = 200;

let base_css = `/animated-snowfall-effect/style.css`; // Put your custom base css here

if (typeof total !== 'undefined'){
    snowflakes_count = total;
}


// This function allows you to turn on and off the snow
function toggle_snow() {
    let check_box = document.getElementById("toggle_snow");
    if (check_box.checked == true) {
        document.getElementById('snow').style.display = "block";
    }
    else {
        document.getElementById('snow').style.display = "none";
    }
}

// Creating snowflakes
function spawn_snow(snow_density = 200) {
    snow_density -= 1;

    for (let x = 0; x < snow_density; x++) {
        let board = document.createElement('div');
        board.className = "snowflake";

        document.getElementById('snow').appendChild(board);
    }
}

// Append style for each snowflake to the head
function add_css(rule) {
    let css = document.createElement('style');
    css.type = 'text/css';
    css.appendChild(document.createTextNode(rule)); // Support for the rest
    document.getElementsByTagName("head")[0].appendChild(css);
}



// Math
function random_int(value = 100){
    return Math.floor(Math.random() * value) + 1;
}

function random_range(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// Create style for snowflake
function spawnSnowCSS(snow_density = 200){
    let snowflake_name = "snowflake";
    let rule = ``;
    if (typeof base_css !== 'undefined'){
        rule = base_css;
    }
    
    for(let i = 1; i < snow_density; i++){
        let random_x = Math.random() * 100; // vw
        let random_offset = random_range(-100000, 100000) * 0.0001; // vw;
        let random_x_end = random_x + random_offset;
        let random_x_end_yoyo = random_x + (random_offset / 2);
        let random_yoyo_time = random_range(30000, 80000) / 100000;
        let random_yoyo_y = random_yoyo_time * 100; // vh
        let random_scale = Math.random();
        let fall_duration = random_range(10, 30) * 1; // s
        let fall_delay = random_int(30) * -1; // s
        let opacity_ = Math.random();

        rule += `
        .${snowflake_name}:nth-child(${i}) {
            opacity: ${opacity_};
            transform: translate(${random_x}vw, -10px) scale(${random_scale});
            animation: fall-${i} ${fall_duration}s ${fall_delay}s linear infinite;
        }

        @keyframes fall-${i} {
            ${random_yoyo_time*100}% {
                transform: translate(${random_x_end}vw, ${random_yoyo_y}vh) scale(${random_scale});
            }

            to {
                transform: translate(${random_x_end_yoyo}vw, 100vh) scale(${random_scale});
            }
            
        }
        `
    }

    add_css(rule);
}

// Load the rules and execute after the DOM loads
window.onload = function() {
    spawnSnowCSS(snowflakes_count);
    spawn_snow(snowflakes_count);
};

// TODO add progress bar for slower clients

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
// Load the snowfall effect
function loadSnowfallEffect() {
  let snowflakes_count = 200; // Set the desired number of snowflakes here

  // This function allows you to turn on and off the snow
  function toggleSnow() {
    let checkBox = document.getElementById("toggle_snow");
    if (checkBox.checked) {
      document.getElementById('snow').style.display = "block";
    } else {
      document.getElementById('snow').style.display = "none";
    }
  }

  // Creating snowflakes
  function spawnSnow(snowDensity = 200) {
    snowDensity -= 1;

    for (let x = 0; x < snowDensity; x++) {
      let snowflake = document.createElement('div');
      snowflake.className = "snowflake";

      document.getElementById('snow').appendChild(snowflake);
    }
  }

  // Append style for each snowflake to the head
  function addCSS(rule) {
    let css = document.createElement('style');
    css.type = 'text/css';
    css.appendChild(document.createTextNode(rule));
    document.getElementsByTagName("head")[0].appendChild(css);
  }

  // Math
  function randomInt(value = 100) {
    return Math.floor(Math.random() * value) + 1;
  }

  function randomRange(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Create style for snowflake
  function spawnSnowCSS(snowDensity = 200) {
    let snowflakeName = "snowflake";
    let rule = ``;

    for (let i = 1; i < snowDensity; i++) {
      let randomX = Math.random() * 100; // vw
      let randomOffset = randomRange(-100000, 100000) * 0.0001; // vw
      let randomXEnd = randomX + randomOffset;
      let randomXEndYoyo = randomX + (randomOffset / 2);
      let randomYoyoTime = randomRange(30000, 80000) / 100000;
      let randomYoyoY = randomYoyoTime * 100; // vh
      let randomScale = Math.random();
      let fallDuration = randomRange(10, 30) * 1; // s
      let fallDelay = randomInt(30) * -1; // s
      let opacity = Math.random();

      rule += `
        .${snowflakeName}:nth-child(${i}) {
            opacity: ${opacity};
            transform: translate(${randomX}vw, -10px) scale(${randomScale});
            animation: fall-${i} ${fallDuration}s ${fallDelay}s linear infinite;
        }

        @keyframes fall-${i} {
            ${randomYoyoTime * 100}% {
                transform: translate(${randomXEnd}vw, ${randomYoyoY}vh) scale(${randomScale});
            }

            to {
                transform: translate(${randomXEndYoyo}vw, 100vh) scale(${randomScale});
            }
        }
      `;
    }

    addCSS(rule);
  }
  // Call the function to load the snowfall effect

}


/* EVENTS */
function onWindowResize() {
  var stats;
  loadSnowfallEffect();


window.addEventListener('load', init);
function initMap() {
  stats = new Stats();
  document.body.appendChild( stats.dom );
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 8,
    center: { lat: 37.7749, lng: -122.4194 },
  });
  const flightPlanCoordinates = [
    { lat: 37.772, lng: -122.214 },
    { lat: 21.291, lng: -157.821 },
    { lat: -18.142, lng: 178.431 },
    { lat: -27.467, lng: 153.027 },
  ];
  const flightPath = new google.maps.Polyline({
    path: flightPlanCoordinates,
    geodesic: true,
    strokeColor: "#FF0000",
    strokeOpacity: 1.0,
    strokeWeight: 2,
  });
  flightPath.setMap(map);
}
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
  function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Render the scene
    renderer.render(scene, camera);
}

animate();
  script.src = 'https://cdn.rawgit.com/mrdoob/stats.js/v0.7.0/build/stats.min.js';
  document.head.appendChild(script);

  var threeScript = document.createElement('script');
  threeScript.onload = function () {
    console.log('Three.js loaded');
  };
  threeScript.src = 'https://cdn.rawgit.com/mrdoob/three.js/r89/build/three.min.js';
  document.head.appendChild(threeScript);
}