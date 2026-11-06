import * as THREE from "three";

import { GLTFLoader } from
  "three/addons/loaders/GLTFLoader.js";

import { OrbitControls } from
  "three/addons/controls/OrbitControls.js";


/* =========================================
   1. MODEL LOCATION
========================================= */

// Make sure this matches your actual filename.
const MODEL_URL = "models/boquet.glb";


/* =========================================
   2. SCREEN NAVIGATION
========================================= */

const screens = {
  flower: document.getElementById("flowerScreen"),
  letter: document.getElementById("letterScreen"),
  audio: document.getElementById("audioScreen")
};

function showScreen(name) {

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

  if (name !== "flower") {
    backgroundAudio.pause();
  }

}

document.querySelectorAll("[data-go]")
  .forEach(button => {

    button.addEventListener("click", () => {

      showScreen(button.dataset.go);

    });

  });


/* =========================================
   3. BACKGROUND MUSIC
========================================= */

const backgroundAudio = new Audio(
  "assets/audio/background.mp3"
);

backgroundAudio.loop = true;
backgroundAudio.volume = 0.35;

const musicToggle = document.getElementById("musicToggle");
const soundStatus = document.getElementById("soundStatus");

function updateMusicButton() {

  musicToggle.textContent =
    backgroundAudio.paused ? "Sound on" : "Sound off";

  musicToggle.setAttribute(
    "aria-pressed",
    String(!backgroundAudio.paused)
  );

}

musicToggle.addEventListener("click", async () => {

  if (backgroundAudio.paused) {

    try {

      await backgroundAudio.play();

      soundStatus.textContent =
        "♫ background music is playing";

    } catch (error) {

      soundStatus.textContent =
        "Check your background.mp3 file";

    }

  } else {

    backgroundAudio.pause();

    soundStatus.textContent =
      "♫ background music";

  }

  updateMusicButton();

});

backgroundAudio.addEventListener("play", updateMusicButton);
backgroundAudio.addEventListener("pause", updateMusicButton);


/* =========================================
   4. AUDIO SURPRISE
========================================= */

const surpriseAudio =
  document.getElementById("surpriseAudio");

const playSurprise =
  document.getElementById("playSurprise");

const record =
  document.getElementById("record");

const audioTime =
  document.getElementById("audioTime");


document.getElementById("surpriseButton")
  .addEventListener("click", () => {

    surpriseAudio.pause();

    showScreen("audio");

  });


playSurprise.addEventListener("click", async () => {

  backgroundAudio.pause();
  updateMusicButton();

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

});


surpriseAudio.addEventListener("ended", () => {

  audioTime.textContent = "replay anytime ♡";

});


/* =========================================
   5. THREE.JS SCENE
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
   6. INTERACTIVE ROTATION
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


/* =========================================
   7. LOAD THE ACTUAL GLB MODEL
========================================= */

let bouquet = null;

const loader = new GLTFLoader();


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
    const targetSize = 3.3;

    const scale = targetSize / largestDimension;

    bouquet.scale.setScalar(scale);


    // Put the model inside a pivot for rotation.
    const pivot = new THREE.Group();

    pivot.add(bouquet);

    scene.add(pivot);

    // Calculate the final bounding sphere.
    const finalBounds = new THREE.Box3()
      .setFromObject(pivot);

    const sphere = finalBounds.getBoundingSphere(
      new THREE.Sphere()
    );

    // Adjust the camera to fit the whole bouquet.
    const radius = sphere.radius;

    const verticalFov =
      THREE.MathUtils.degToRad(camera.fov);

    const horizontalFov = 2 * Math.atan(
      Math.tan(verticalFov / 2) * camera.aspect
    );

    const limitingFov = Math.min(
      verticalFov,
      horizontalFov
    );

    const cameraDistance =
      (radius / Math.sin(limitingFov / 2)) * 1.15;

    camera.position.set(
      0,
      0,
      cameraDistance
    );

    camera.near = Math.max(
      0.01,
      cameraDistance / 100
    );

    camera.far = cameraDistance * 100;

    camera.updateProjectionMatrix();

    controls.target.set(0, 0, 0);

    controls.update();


    // Hide the loading message.
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
      "The 3D bouquet could not load. Check models/boquet.glb";

  }

);


/* =========================================
   8. RESPONSIVE CANVAS
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
   9. ANIMATION LOOP
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
   10. ENVELOPE ANIMATION
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
