import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Replace this file with your generated model: assets/models/bouquet.glb
const MODEL_URL = "assets/models/bouquet.glb";

const screens = {
  flower: document.getElementById("flowerScreen"),
  letter: document.getElementById("letterScreen"),
  audio: document.getElementById("audioScreen")
};
const gate = document.getElementById("welcomeGate");
const backgroundAudio = new Audio("assets/audio/background.mp3");
backgroundAudio.loop = true;
backgroundAudio.volume = 0.35;

function showScreen(name) {
  Object.entries(screens).forEach(([key, element]) => element.classList.toggle("is-active", key === name));
  document.querySelectorAll(".bottom-nav button").forEach(button => {
    button.classList.toggle("selected", button.dataset.go === name);
  });
  if (name === "flower") backgroundAudio.play().catch(() => {});
  else backgroundAudio.pause();
}
document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => showScreen(button.dataset.go)));

document.getElementById("enterButton").addEventListener("click", async () => {
  gate.classList.add("hidden");
  showScreen("flower");
  try { await backgroundAudio.play(); } catch (_) {
    document.getElementById("soundStatus").textContent = "tap Sound on to play music";
  }
});

document.getElementById("musicToggle").addEventListener("click", async event => {
  if (backgroundAudio.paused) {
    try { await backgroundAudio.play(); event.currentTarget.textContent = "Sound off"; }
    catch (_) { document.getElementById("soundStatus").textContent = "Add background.mp3 to enable music"; }
  } else {
    backgroundAudio.pause();
    event.currentTarget.textContent = "Sound on";
  }
});

const surpriseAudio = document.getElementById("surpriseAudio");
const playSurprise = document.getElementById("playSurprise");
const record = document.getElementById("record");
const audioTime = document.getElementById("audioTime");
document.getElementById("surpriseButton").addEventListener("click", () => showScreen("audio"));
playSurprise.addEventListener("click", async () => {
  backgroundAudio.pause();
  if (surpriseAudio.paused) {
    try { await surpriseAudio.play(); }
    catch (_) { audioTime.textContent = "Add your surprise.mp3 file first"; }
  } else surpriseAudio.pause();
});
surpriseAudio.addEventListener("play", () => {
  playSurprise.textContent = "Ⅱ"; record.classList.add("playing"); audioTime.textContent = "now playing ♡";
});
surpriseAudio.addEventListener("pause", () => {
  playSurprise.textContent = "▶"; record.classList.remove("playing");
  if (!surpriseAudio.ended) audioTime.textContent = "paused";
});
surpriseAudio.addEventListener("ended", () => { audioTime.textContent = " replay anytime ♡"; });

// Three.js bouquet stage. The fallback image remains visible if no GLB is installed yet.
const canvas = document.getElementById("flowerCanvas");
const fallback = document.getElementById("flowerFallback");
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 0.15, 5.2);
scene.add(new THREE.HemisphereLight(0xffffff, 0xb79a83, 2.0));
const keyLight = new THREE.DirectionalLight(0xfff1df, 2.2);
keyLight.position.set(3, 4, 5); scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xffc9d0, 0.8);
fillLight.position.set(-3, 1, -2); scene.add(fillLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.minPolarAngle = Math.PI * 0.34;
controls.maxPolarAngle = Math.PI * 0.66;
controls.rotateSpeed = 0.55;

let bouquet = null;
const loader = new GLTFLoader();
loader.load(MODEL_URL, gltf => {
  bouquet = gltf.scene;
  const box = new THREE.Box3().setFromObject(bouquet);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  bouquet.position.sub(center);
  const maxDimension = Math.max(size.x, size.y, size.z);
  const scale = 3.25 / maxDimension;
  bouquet.scale.setScalar(scale);
  bouquet.position.y -= 0.12;
  scene.add(bouquet);
  fallback.style.display = "none";
}, undefined, error => {
  console.info("Bouquet GLB not installed yet. Showing the supplied reference image.", error);
});

function resize() {
  const width = canvas.clientWidth || canvas.parentElement.clientWidth;
  const height = canvas.clientHeight || canvas.parentElement.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  if (bouquet) bouquet.rotation.y += Math.sin(t * 0.45) * 0.0007;
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Envelope is an HTML hit target positioned as a deliberate overlay for now.
// Once the GLB is available, adjust left/top in style.css to align it to the wrapping.
document.getElementById("envelopeButton").addEventListener("click", () => {
  const envelope = document.getElementById("envelopeButton");
  envelope.classList.add("opening");
  setTimeout(() => showScreen("letter"), 420);
});
