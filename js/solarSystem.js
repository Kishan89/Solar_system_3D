import * as THREE from "https://unpkg.com/three@0.127.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js";
import * as dat from "https://cdn.skypack.dev/dat.gui";

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Scene
const scene = new THREE.Scene();
const loader = new THREE.TextureLoader();
const starsTexture = new THREE.CubeTextureLoader().load(Array(6).fill("./image/stars.jpg"));
const dayTexture = loader.load("./image/day.jpg");

scene.background = starsTexture;

// Camera
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(-60, 100, 180);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
sunLight.castShadow = true;
scene.add(sunLight);

// Textures
const textures = {
  sun: loader.load("./image/sun.jpg"),
  mercury: loader.load("./image/mercury.jpg"),
  venus: loader.load("./image/venus.jpg"),
  earth: loader.load("./image/earth.jpg"),
  mars: loader.load("./image/mars.jpg"),
  jupiter: loader.load("./image/jupiter.jpg"),
  saturn: loader.load("./image/saturn.jpg"),
  uranus: loader.load("./image/uranus.jpg"),
  neptune: loader.load("./image/neptune.jpg"),
  saturnRing: loader.load("./image/saturn_ring.png"),
  uranusRing: loader.load("./image/uranus_ring.png"),
};

// Sun
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(15, 64, 64),
  new THREE.MeshStandardMaterial({
    map: textures.sun,
    emissive: 0xffff33,
    emissiveIntensity: 1.5,
    emissiveMap: textures.sun,
  })
);
scene.add(sun);
sunLight.position.copy(sun.position);

// Orbit function
function addOrbit(radius) {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius);
  const points = curve.getPoints(100).map(p => new THREE.Vector3(p.x, 0, p.y));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true });
  const orbit = new THREE.LineLoop(geometry, material);
  scene.add(orbit);
}

// Planet function
function createPlanet(name, radius, texture, orbitRadius, ringConfig) {
  const material = new THREE.MeshStandardMaterial({ map: texture });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 48), material);
  sphere.position.x = orbitRadius;

  const obj = new THREE.Object3D();
  obj.add(sphere);

  if (ringConfig) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(ringConfig.inner, ringConfig.outer, 64),
      new THREE.MeshBasicMaterial({
        map: ringConfig.texture,
        transparent: true,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.x = orbitRadius;
    obj.add(ring);
  }

  addOrbit(orbitRadius);
  scene.add(obj);
  return { parent: obj, planet: sphere };
}

const orbitSpeedMultiplier = 40;
const planets = [
  { name: "Mercury", ...createPlanet("Mercury", 3.2, textures.mercury, 28), speed: { orbit: 0.01 * orbitSpeedMultiplier, spin: 0.15 } },
  { name: "Venus", ...createPlanet("Venus", 5.8, textures.venus, 44), speed: { orbit: 0.007 * orbitSpeedMultiplier, spin: 0.1 } },
  { name: "Earth", ...createPlanet("Earth", 6, textures.earth, 62), speed: { orbit: 0.005 * orbitSpeedMultiplier, spin: 0.2 } },
  { name: "Mars", ...createPlanet("Mars", 4, textures.mars, 78), speed: { orbit: 0.004 * orbitSpeedMultiplier, spin: 0.18 } },
  { name: "Jupiter", ...createPlanet("Jupiter", 12, textures.jupiter, 100), speed: { orbit: 0.002 * orbitSpeedMultiplier, spin: 0.3 } },
  {
    name: "Saturn",
    ...createPlanet("Saturn", 10, textures.saturn, 138, {
      inner: 10,
      outer: 20,
      texture: textures.saturnRing,
    }),
    speed: { orbit: 0.0015 * orbitSpeedMultiplier, spin: 0.28 },
  },
  {
    name: "Uranus",
    ...createPlanet("Uranus", 7, textures.uranus, 176, {
      inner: 7,
      outer: 12,
      texture: textures.uranusRing,
    }),
    speed: { orbit: 0.001 * orbitSpeedMultiplier, spin: 0.25 },
  },
  { name: "Neptune", ...createPlanet("Neptune", 7, textures.neptune, 200), speed: { orbit: 0.0007 * orbitSpeedMultiplier, spin: 0.26 } },
];

// GUI
const settings = { speed: 1, paused: false, darkMode: true };
const gui = new dat.GUI();
gui.add(settings, "speed", 0, 5).name("Global Speed");
const folder = gui.addFolder("Individual Speeds");
planets.forEach((p) => {
  const f = folder.addFolder(p.name);
  f.add(p.speed, "orbit", 0, 2).name("Orbit");
  f.add(p.speed, "spin", 0, 1).name("Spin");
});
gui.add(settings, "paused").name("Pause / Resume");
gui.add(settings, "darkMode").name("Toggle Dark Mode").onChange(toggleMode);

function toggleMode(value) {
  if (value) {
    // Night Mode
    scene.background = starsTexture;
    ambientLight.intensity = 0.1;
    sunLight.intensity = 2;
    sun.material.emissiveIntensity = 1.5;
  } else {
    // Day Mode
    scene.background = dayTexture;
    ambientLight.intensity = 0.5;
    sunLight.intensity = 0.8;
    sun.material.emissiveIntensity = 0.3;
  }
}

toggleMode(settings.darkMode);

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  if (!settings.paused) {
    const delta = clock.getDelta();
    sun.rotation.y += delta * settings.speed * 0.2;
    planets.forEach((p) => {
      p.parent.rotation.y += delta * settings.speed * p.speed.orbit;
      p.planet.rotation.y += delta * settings.speed * p.speed.spin;
    });
  }
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Responsive
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
