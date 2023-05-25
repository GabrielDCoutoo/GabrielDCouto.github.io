import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
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
  threeScript.src = './three.min.js';
  document.head.appendChild(threeScript);
}

// Copy the SnowFlakes class code here

function onWindowResize(camera, renderer) {
  camera.aspect = window.innerWidth / window.innerHeight;
  
}
