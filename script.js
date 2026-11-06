import * as THREE from "three";

import { GLTFLoader } from
  "three/addons/loaders/GLTFLoader.js";

import { OrbitControls } from
  "three/addons/controls/OrbitControls.js";

import { MeshoptDecoder } from
  "three/addons/libs/meshopt_decoder.module.js";


/* =========================================
   1. MODEL LOCATION
========================================= */

const MODEL_URL = "assets/models/boquet.glb";


/* =========================================
   2. SCREEN NAVIGATION
========================================= */

const screens = {

  flower: document.getElementById("flowerScreen"),

  letter: document.getElementById("letterScreen"),

  audio: document.getElementById("audioScreen")

};


const backgroundAudio =
  document.getElementById("backgroundAudio");


function showScreen(name) {

  Object.entries(screens).forEach(([key, element]) => {

    element.classList.toggle(
      "is-active",
      key === name
    );

  });

  document.querySelectorAll("[data-go]")
    .forEach(button => {

      button.classList.toggle(
        "selected",
        button.dataset.go === name
      );

    });


  if (name !== "flower") {

    backgroundAudio.pause();

  } else {

    attemptBackgroundMusic();

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

const musicToggle =
  document.getElementById("musicToggle");

const soundStatus =
  document.getElementById("soundStatus");


backgroundAudio.loop = true;

backgroundAudio.volume = 0.35;


let musicWasBlocked = false;


function updateMusicButton() {

  const playing = !backgroundAudio.paused;

  musicToggle.setAttribute(
    "aria-pressed",
    String(playing)
  );

  soundStatus.textContent =
    playing ? "Sound off" : "Sound on";

}


async function attemptBackgroundMusic() {

  if (!screens.flower.classList.contains("is-active")) {
    return;
  }

  if (!backgroundAudio.paused) {
    return;
  }

  try {

    await backgroundAudio.play();

    musicWasBlocked = false;

    updateMusicButton();

  } catch (error) {

    musicWasBlocked = true;

    updateMusicButton();

    console.warn(
      "Browser blocked background autoplay. User interaction is required.",
      error
    );

  }

}


// Attempt automatic playback immediately.
attemptBackgroundMusic();


// Retry when the user interacts with the page.
// This allows playback after an autoplay restriction.
function unlockBackgroundMusic() {

  if (
    musicWasBlocked &&
    screens.flower.classList.contains("is-active")
  ) {

    attemptBackgroundMusic();

  }

}


document.addEventListener(
  "pointerdown",
  unlockBackgroundMusic,
  { once: true }
);


musicToggle.addEventListener("click", async () => {

  if (backgroundAudio.paused) {

    try {

      await backgroundAudio.play();

    } catch (error) {

      console.error(
        "Background audio could not play:",
        error
      );

    }

  } else {

    backgroundAudio.pause();

  }

  updateMusicButton();

});


backgroundAudio.addEventListener(
  "play",
  updateMusicButton
);

backgroundAudio.addEventListener(
  "pause",
  updateMusicButton
);


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

      console.error(
        "Surprise audio error:",
        error
      );

      audioTime.textContent =
        "Unable to play the audio. Check surprise.mp3";

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

renderer.outputColorSpace =
  THREE.SRGBColorSpace;

renderer.toneMapping =
  THREE.ACESFilmicToneMapping;

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


/* =========================================
   6. LIGHTING
========================================= */

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
   7. INTERACTIVE ROTATION
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

controls.minPolarAngle = Math.PI * 0.22;

controls.maxPolarAngle = Math.PI * 0.78;


/* =========================================
   8. MODEL LOADING
========================================= */

let bouquet = null;

let bouquetPivot = null;

let modelRadius = 1;


const loader = new GLTFLoader();

loader.setMeshoptDecoder(MeshoptDecoder);


function updateCameraFraming() {

  if (!bouquetPivot) {
    return;
  }

  const width = Math.max(
    1,
    canvas.clientWidth
  );

  const height = Math.max(
    1,
    canvas.clientHeight
  );

  const landscape = width > height;

  const verticalFov =
    THREE.MathUtils.degToRad(camera.fov);

  const horizontalFov = 2 * Math.atan(
    Math.tan(verticalFov / 2) *
    camera.aspect
  );


  let cameraDistance;


  if (landscape) {

    /*
      LANDSCAPE:
      Model fills approximately 90% of stage height.
    */

    const targetHeight = 0.90;

    cameraDistance =
      modelRadius /
      (
        targetHeight *
        Math.tan(verticalFov / 2)
      );

  } else {

    /*
      PORTRAIT:
      Model fills approximately 80% of stage width.
    */

    const targetWidth = 0.80;

    cameraDistance =
      modelRadius /
      (
        targetWidth *
        Math.tan(horizontalFov / 2)
      );

  }


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

}


loader.load(

  MODEL_URL,

  function (gltf) {

    try {

      bouquet = gltf.scene;

      bouquetPivot = new THREE.Group();

      bouquetPivot.add(bouquet);

      bouquetPivot.updateMatrixWorld(true);


      // Calculate original dimensions.
      const bounds = new THREE.Box3()
        .setFromObject(bouquetPivot);

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


      // Normalize model dimensions.
      const targetSize = 3.3;

      const scale =
        targetSize / largestDimension;


      bouquetPivot.scale.setScalar(scale);


      // Center model correctly.
      bouquetPivot.position.copy(center)
        .multiplyScalar(-scale);


      scene.add(bouquetPivot);

      bouquetPivot.updateMatrixWorld(true);


      // Calculate final bounding sphere.
      const finalBounds = new THREE.Box3()
        .setFromObject(bouquetPivot);

      const sphere = finalBounds.getBoundingSphere(
        new THREE.Sphere()
      );

      modelRadius = sphere.radius;


      // Frame the model based on screen orientation.
      updateCameraFraming();


      // Show envelope only after successful model loading.
      modelStatus.classList.add("hidden");

      const envelopeButton =
        document.getElementById("envelopeButton");

      envelopeButton.hidden = false;


      console.info(
        "3D bouquet loaded successfully.",
        gltf
      );

      console.log(
        "Model dimensions:",
        size
      );


    } catch (error) {

      console.error(
        "Error processing the bouquet:",
        error
      );

      modelStatus.classList.remove("hidden");

      modelStatus.classList.add("error");

      modelStatusText.textContent =
        "The model loaded, but could not be displayed.";

    }

  },


  function (progress) {

    if (progress.total > 0) {

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

    console.error(
      "Model URL:",
      MODEL_URL
    );

    modelStatus.classList.remove("hidden");

    modelStatus.classList.add("error");

    modelStatusText.textContent =
      "Unable to load the 3D bouquet. Check the browser console.";

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


  // Recalculate bouquet size on orientation changes.
  updateCameraFraming();

}


const resizeObserver = new ResizeObserver(
  resizeScene
);

resizeObserver.observe(
  canvas.parentElement
);


window.addEventListener(
  "resize",
  resizeScene
);


window.addEventListener(
  "orientationchange",
  () => {

    setTimeout(resizeScene, 250);

  }
);


resizeScene();


/* =========================================
   10. ANIMATION LOOP
========================================= */

const clock = new THREE.Clock();

let initialModelY = 0;


function animate() {

  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();


  controls.update();


  // Gentle floating movement.
  if (bouquetPivot) {

    bouquetPivot.position.y =
      initialModelY +
      Math.sin(elapsed * 0.8) * 0.025;

  }


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
