import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// The filename below follows the spelling supplied: "boquet".
// Confirm the extension is .glb (not .gbl) and keep this path in sync with your file.
const MODEL_URL = "models/boquet.glb";

const screens = {
  flower: document.getElementById("flowerScreen"),
  letter: document.getElementById("letterScreen"),
  audio: document.getElementById("audioScreen")
};

const backgroundAudio = new Audio("assets/audio/background.mp3");
backgroundAudio.loop = true;
backgroundAudio.volume = 0.35;

const musicToggle = document.getElementById("musicToggle");
const soundStatus = document.getElementById("soundStatus");

function syncMusicButton() {
  musicToggle.textContent = backgroundAudio.paused ? "Sound on" : "Sound off";
  musicToggle.setAttribute("aria-pressed", String(!backgroundAudio.paused));
}

function showScreen(name) {
  Object.entries(screens).forEach(([key, element]) => {
    element.classList.toggle("is-active", key === name);
  });

  document.querySelectorAll(".bottom-nav button").forEach(button => {
    button.classList.toggle("selected", button.dataset.go === name);
  });

  if (name === "flower") {
    if (!backgroundAudio.paused) return;
    // Browsers may block autoplay. Music will start after a user gesture.
  } else {
    backgroundAudio.pause();
    syncMusicButton();
  }
}

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => showScreen(button.dataset.go));
});

musicToggle.addEventListener("click", async () => {
  if (backgroundAudio.paused) {
    try {
      await backgroundAudio.play();
      soundStatus.textContent = "♫ background music is playing";
    } catch (_) {
      soundStatus.textContent = "Add assets/audio/background.mp3 to enable music";
    }
  } else {
    backgroundAudio.pause();
    soundStatus.textContent = "♫ background music";
  }
  syncMusicButton();
});

backgroundAudio.addEventListener("play", syncMusicButton);
backgroundAudio.addEventListener("pause", syncMusicButton);

const surpriseAudio = document.getElementById("surpriseAudio");
const playSurprise = document.getElementById("playSurprise");
const record = document.getElementById("record");
const audioTime = document.getElementById("audioTime");

document.getElementById("surpriseButton").addEventListener("click", () => {
  surpriseAudio.pause();
  showScreen("audio");
});

playSurprise.addEventListener("click", async () => {
  backgroundAudio.pause();
  syncMusicButton();

  if (surpriseAudio.paused) {
    try {
      await surpriseAudio.play();
    } catch (_) {
      audioTime.textContent = "Add your surprise.mp3 file first";
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
  if (!surpriseAudio.ended) audioTime.textContent = "paused";
});
surpriseAudio.addEventListener("ended", () => {
  audioTime.textContent = "replay anytime ♡";
});

// Three.js bouquet stage.
const canvas = document.getElementById("flowerCanvas");
const fallback = document.getElementById("flowerFallback");
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 0.05, 5.2);

scene.add(new THREE.HemisphereLight(0xffffff, 0xb79a83, 2.0));

const keyLight = new THREE.DirectionalLight(0xfff1df, 2.2);
keyLight.position.set(3, 4, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffc9d0, 0.8);
fillLight.position.set(-3, 1, -2);
scene.add(fillLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = false;
controls.enableZoom = false;
controls.rotateSpeed = 0.55;
controls.minPolarAngle = Math.PI * 0.28;
controls.maxPolarAngle = Math.PI * 0.72;

let bouquet = null;
let modelBaseY = 0;

function fitBouquetToView(object) {
  // Normalize model dimensions and center it so different GLB export scales work.
  const bounds = new THREE.Box3().setFromObject(object);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const largestDimension = Math.max(size.x, size.y, size.z);

  if (!Number.isFinite(largestDimension) || largestDimension <= 0) {
    throw new Error("The GLB model has no measurable geometry.");
  }

  object.position.sub(center);
  const targetSize = 3.25;
  object.scale.setScalar(targetSize / largestDimension);

  // Re-center after scaling, then apply a small vertical adjustment.
  const scaledBounds = new THREE.Box3().setFromObject(object);
  const scaledCenter = scaledBounds.getCenter(new THREE.Vector3());
  object.position.sub(scaledCenter);
  modelBaseY = -0.08;
  object.position.y += modelBaseY;

  // Keep the bouquet's pivot at its visual center for intuitive rotation.
  scene.add(object);
}

const loader = new GLTFLoader();
loader.load(
  MODEL_URL,
  gltf => {
    bouquet = gltf.scene;
    fitBouquetToView(bouquet);
    fallback.classList.add("is-hidden");
    console.info("Bouquet GLB loaded:", MODEL_URL);
  },
  progress => {
    if (progress.total) {
      console.info(`Loading bouquet: ${Math.round(progress.loaded / progress.total * 100)}%`);
    }
  },
  error => {
    console.error(`Could not load ${MODEL_URL}. Check the filename, extension, and folder path.`, error);
    soundStatus.textContent = "Bouquet model not found — check models/boquet.glb";
  }
);

function resizeRenderer() {
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
const resizeObserver = new ResizeObserver(resizeRenderer);
resizeObserver.observe(canvas.parentElement);
window.addEventListener("resize", resizeRenderer);
resizeRenderer();

const clock = new THREE.Clock();
let baseRotationY = 0;

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  // Very subtle idle sway; manual drag rotation remains controlled by OrbitControls.
  if (bouquet && !controls.enabled) {
    bouquet.rotation.y = baseRotationY + Math.sin(elapsed * 0.35) * 0.018;
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();

// Envelope lift/open transition.
const envelopeButton = document.getElementById("envelopeButton");
envelopeButton.addEventListener("click", () => {
  if (envelopeButton.classList.contains("opening")) return;
  envelopeButton.classList.add("opening");
  setTimeout(() => showScreen("letter"), 1050);
});
