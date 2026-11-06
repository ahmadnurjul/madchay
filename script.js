import * as THREE from "three";

import { GLTFLoader } from
  "three/addons/loaders/GLTFLoader.js";

import { OrbitControls } from
  "three/addons/controls/OrbitControls.js";

import { MeshoptDecoder } from
  "three/addons/libs/meshopt_decoder.module.js";


/* =========================================
   1. MODEL LOCATION & SETTINGS
========================================= */

// Make sure this matches your actual filename.
const MODEL_URL = "assets/models/boquet.glb";

// How much of the page height the bouquet should fill.
const TARGET_HEIGHT_RATIO = 0.95;


/* =========================================
   2. AUDIO ELEMENTS
========================================= */

// Background music (flower screen only)
const backgroundAudio = new Audio(
  "assets/audio/background.mp3"
);

backgroundAudio.loop = true;
backgroundAudio.volume = 0.35;

// Surprise audio (audio screen)
const surpriseAudio =
  document.getElementById("surpriseAudio");

const playSurprise =
  document.getElementById("playSurprise");

const record =
  document.getElementById("record");

const audioTime =
  document.getElementById("audioTime");


/* =========================================
   3. SCREEN NAVIGATION
========================================= */

const screens = {
  flower: document.getElementById("flowerScreen"),
  letter: document.getElementById("letterScreen"),
  audio: document.getElementById("audioScreen")
};

let currentScreen = "flower";

function showScreen(name) {

  currentScreen = name;

  Object.entries(screens).forEach(([key, element]) => {

    element.classList.toggle(
      "is-active",
      key === name
    );

  });

  document.querySelectorAll(".bottom-nav button")
    .forEach(button => {

      button.classList.toggle(
        "selected",
        button.dataset.go === name
      );

    });

  // Reveal the navigation for good once the audio screen has been opened.
  if (name === "audio") {
    document.body.classList.add("nav-unlocked");
  }

  // Background music plays on flower + letter, pauses on audio.
  if (name === "audio") {
    backgroundAudio.pause();
  } else {
    tryStartMusic();
  }

}

document.querySelectorAll("[data-go]")
  .forEach(button => {

    button.addEventListener("click", () => {

      showScreen(button.dataset.go);

    });

  });


/* =========================================
   4. BACKGROUND MUSIC (always on in flower screen)
========================================= */

// Browsers block autoplay until the person touches the page,
// so we also retry on the first interaction.
const UNLOCK_EVENTS = [
  "pointerdown",
  "touchend",
  "click",
  "keydown"
];

function removeUnlockListeners() {

  UNLOCK_EVENTS.forEach(type => {

    document.removeEventListener(type, tryStartMusic);

  });

}

function tryStartMusic() {

  // Only on the flower screen, only while the tab is visible,
  // and never on top of the surprise audio.
    if (
    currentScreen === "audio" ||
    document.hidden ||
    !surpriseAudio.paused
  ) {
    return;
  }
  backgroundAudio.play()
    .then(removeUnlockListeners)
    .catch(() => {
      // Blocked by the browser, retry on next interaction.
    });

}

UNLOCK_EVENTS.forEach(type => {

  document.addEventListener(
    type,
    tryStartMusic,
    { passive: true }
  );

});

document.addEventListener("visibilitychange", () => {

  if (document.hidden) {

    backgroundAudio.pause();

  } else {

    tryStartMusic();

  }

});

tryStartMusic();


/* =========================================
   5. AUDIO SURPRISE (same as before)
========================================= */

document.getElementById("surpriseButton")
  .addEventListener("click", () => {

    surpriseAudio.pause();

    showScreen("audio");

  });


playSurprise.addEventListener("click", async () => {

  backgroundAudio.pause();

  if (surpriseAudio.paused) {

    try {

      await surpriseAudio.play();

    } catch (error) {

      audioTime.textContent =
        "Check your surprise.mp3 file";

    }

  } else {

    surpriseAudio.pause();

  }

});


surpriseAudio.addEventListener("play", () => {

  playSurprise.textContent = "Ⅱ";

  record.classList.add("playing");

  audioTime.textContent = "now playing ♡";

});


surpriseAudio.addEventListener("pause", () => {

  playSurprise.textContent = "▶";

  record.classList.remove("playing");

  if (!surpriseAudio.ended) {

    audioTime.textContent = "paused";

  }

  // If the surprise stops while we're on the flower screen,
  // bring the background music back.
  tryStartMusic();

});


surpriseAudio.addEventListener("ended", () => {

  audioTime.textContent = "replay anytime ♡";

});


/* =========================================
   6. THREE.JS SCENE
========================================= */

const canvas =
  document.getElementById("flowerCanvas");

const modelStatus =
  document.getElementById("modelStatus");

const modelStatusText =
  document.getElementById("modelStatusText");


const renderer = new THREE.WebGLRenderer({

  canvas: canvas,

  alpha: true,

  antialias: true,

  powerPreference: "high-performance"

});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio || 1, 2)
);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1.15;

renderer.setClearColor(0x000000, 0);


const scene = new THREE.Scene();


const camera = new THREE.PerspectiveCamera(
  35,
  1,
  0.1,
  100
);

camera.position.set(0, 0, 5);


const hemisphereLight =
  new THREE.HemisphereLight(
    0xffffff,
    0xb79a83,
    2.0
  );

scene.add(hemisphereLight);


const keyLight =
  new THREE.DirectionalLight(
    0xfff1df,
    2.5
  );

keyLight.position.set(3, 5, 5);

scene.add(keyLight);


const fillLight =
  new THREE.DirectionalLight(
    0xffc9d0,
    1.0
  );

fillLight.position.set(-4, 1, -3);

scene.add(fillLight);


const rimLight =
  new THREE.DirectionalLight(
    0xffffff,
    1.2
  );

rimLight.position.set(0, 3, -4);

scene.add(rimLight);


/* =========================================
   7. LOAD THE ACTUAL GLB MODEL
========================================= */

let bouquet = null;
let bouquetPivot = null;

const bouquetSize = new THREE.Vector3();

const loader = new GLTFLoader();

loader.setMeshoptDecoder(MeshoptDecoder);


/* =========================================
   8. INTERACTIVE ROTATION
========================================= */

const controls = new OrbitControls(
  camera,
  renderer.domElement
);

controls.enableDamping = true;

controls.dampingFactor = 0.065;

controls.enablePan = false;

controls.enableZoom = false;

controls.rotateSpeed = 0.65;

// Allow rotation around the bouquet.
// Restrict extreme vertical flipping.
controls.minPolarAngle = Math.PI * 0.22;

controls.maxPolarAngle = Math.PI * 0.78;


// Places the camera so the bouquet fills 95% of the page height.
function fitCameraToBouquet() {

  if (!bouquetPivot) return;

  const tanHalf = Math.tan(
    THREE.MathUtils.degToRad(camera.fov) / 2
  );

  const distForHeight =
    (bouquetSize.y / TARGET_HEIGHT_RATIO) / (2 * tanHalf);

  // Safeguard for narrow phones: never let the sides get clipped.
  const widest = Math.max(bouquetSize.x, bouquetSize.z);

  const distForWidth =
    (widest / 0.98) / (2 * tanHalf * camera.aspect);

  const distance =
    Math.max(distForHeight, distForWidth) +
    bouquetSize.z / 2;

  // Keep the current viewing angle, only change the distance.
  const direction = camera.position
    .clone()
    .sub(controls.target);

  if (direction.lengthSq() === 0) direction.set(0, 0, 1);

  direction.normalize().multiplyScalar(distance);

  camera.position.copy(controls.target).add(direction);

  camera.near = Math.max(0.01, distance / 100);

  camera.far = distance * 100;

  camera.updateProjectionMatrix();

  controls.update();

}


loader.load(

  MODEL_URL,

  function (gltf) {

    bouquet = gltf.scene;

    // Calculate the original model dimensions.
    const bounds = new THREE.Box3()
      .setFromObject(bouquet);

    const size = bounds.getSize(
      new THREE.Vector3()
    );

    const center = bounds.getCenter(
      new THREE.Vector3()
    );

    const largestDimension = Math.max(
      size.x,
      size.y,
      size.z
    );

    if (
      !Number.isFinite(largestDimension) ||
      largestDimension <= 0
    ) {

      throw new Error(
        "The model contains no measurable geometry."
      );

    }

    // Center the model around its origin.
    bouquet.position.sub(center);

    // Normalize its size.
    bouquet.scale.setScalar(3.3 / largestDimension);

    // Put the model inside a pivot.
    bouquetPivot = new THREE.Group();

    bouquetPivot.add(bouquet);

    scene.add(bouquetPivot);

    // Remember the final size for camera fitting.
    new THREE.Box3()
      .setFromObject(bouquetPivot)
      .getSize(bouquetSize);

    controls.target.set(0, 0, 0);

    camera.position.set(0, 0, 10);

    fitCameraToBouquet();

    // Hide the loading message.
    document.getElementById("flowerStage").classList.add("is-ready");
    modelStatus.classList.add("hidden");

    console.info("3D bouquet loaded successfully.");

  },


  function (progress) {

    if (progress.total) {

      const percent = Math.round(
        (progress.loaded / progress.total) * 100
      );

      modelStatusText.textContent =
        `preparing your flowers... ${percent}%`;

    }

  },


  function (error) {

    console.error(
      "Could not load the 3D bouquet:",
      error
    );

    modelStatus.classList.add("error");

    modelStatusText.textContent =
      "The 3D bouquet could not load. Check assets/models/boquet.glb";

  }

);


/* =========================================
   9. RESPONSIVE CANVAS
========================================= */

function resizeScene() {

  const width = Math.max(
    1,
    canvas.clientWidth
  );

  const height = Math.max(
    1,
    canvas.clientHeight
  );

  renderer.setSize(
    width,
    height,
    false
  );

  camera.aspect = width / height;

  camera.updateProjectionMatrix();

  // Refit the bouquet whenever the screen changes.
  fitCameraToBouquet();

}


// Observe the stage, not just the browser window.
const resizeObserver = new ResizeObserver(
  resizeScene
);

resizeObserver.observe(canvas.parentElement);

window.addEventListener(
  "resize",
  resizeScene
);

resizeScene();


/* =========================================
   10. ANIMATION LOOP
========================================= */

function animate() {

  requestAnimationFrame(animate);

  controls.update();

  renderer.render(
    scene,
    camera
  );

}

animate();


/* =========================================
   11. ENVELOPE ANIMATION
========================================= */

const envelopeButton =
  document.getElementById("envelopeButton");

envelopeButton.addEventListener("click", () => {

  if (
    envelopeButton.classList.contains("opening")
  ) {
    return;
  }

  envelopeButton.classList.add("opening");

  setTimeout(() => {

    showScreen("letter");

    envelopeButton.classList.remove("opening");

  }, 1100);

});
