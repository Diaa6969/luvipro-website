import * as T from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createVehicle } from "./vehicle";

export const shots = [
  { angle: .42, height: 1.6, distance: 7.9, focus: 0, uv: 0, wire: 0 },
  { angle: .08, height: 1.25, distance: 3.35, focus: -.85, uv: 1, wire: .15 },
  { angle: -.26, height: 1.8, distance: 5, focus: -.8, uv: .8, wire: .4 },
  { angle: -.36, height: 1.65, distance: 5.8, focus: .2, uv: .2, wire: .1 },
  { angle: -.12, height: 1.95, distance: 6.3, focus: .4, uv: 0, wire: .35 },
  { angle: .45, height: 3.25, distance: 7, focus: 0, uv: 0, wire: 1 },
  { angle: .23, height: 1.95, distance: 7.2, focus: 0, uv: .32, wire: .2 },
  { angle: -.28, height: 1.75, distance: 7.6, focus: .25, uv: 0, wire: .1 },
  { angle: -.53, height: 1.32, distance: 8.2, focus: 0, uv: .12, wire: 0 },
];

type PanelCopy = { heading: string; rows: string[] };

function makePanel(copy: PanelCopy, phone: boolean, material: T.Material) {
  const group = new T.Group();
  const width = phone ? .87 : 1.38;
  const height = phone ? 1.63 : 1.43;
  const canvas = document.createElement("canvas");
  canvas.width = phone ? 512 : 640;
  canvas.height = phone ? 950 : 660;
  const ctx = canvas.getContext("2d");
  if (!ctx) return group;
  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, "#1b2545");
  bg.addColorStop(1, "#0b1022");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "600 22px system-ui";
  ctx.fillStyle = "#86e7ff";
  ctx.fillText("LUVIPRO", 42, 65);
  ctx.font = "600 32px system-ui";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(copy.heading, 42, 122, canvas.width - 84);
  copy.rows.forEach((row, index) => {
    const y = 190 + 82 * index;
    ctx.fillStyle = "#30476c";
    ctx.fillRect(42, y, canvas.width - 84, 1);
    ctx.fillStyle = "#cce8ff";
    ctx.fillText(row, 42, y + 43, canvas.width - 84);
  });
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  const chassis = new T.Mesh(new T.BoxGeometry(width + .055, height + .055, .065), material);
  const screen = new T.Mesh(new T.PlaneGeometry(width, height), new T.MeshBasicMaterial({ map: texture, toneMapped: false }));
  screen.position.z = .035;
  group.add(chassis, screen);
  return group;
}

export function mountStage(canvas: HTMLCanvasElement, panels: PanelCopy[]) {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "low-power" });
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  const scene = new T.Scene();
  scene.background = new T.Color(0x080712);
  scene.fog = new T.FogExp2(0x080712, .072);
  const camera = new T.PerspectiveCamera(37, 1, .08, 55);

  const room = new RoomEnvironment();
  const pmrem = new T.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, .06);
  room.dispose();
  pmrem.dispose();
  const vehicle = createVehicle(environment.texture);
  scene.add(vehicle.group);
  scene.add(new T.HemisphereLight(0xb8c5ff, 0x291032, 1.45));
  const key = new T.DirectionalLight(0xbfc6ff, 2.4);
  key.position.set(-3, 5, 3);
  const rim = new T.PointLight(0xaf40ff, 48, 13);
  rim.position.set(1, 3.4, -2);
  const sweep = new T.SpotLight(0x893bff, 0, 7, .26, .85, 1.25);
  const sweepTarget = new T.Object3D();
  sweep.target = sweepTarget;
  const fill = new T.PointLight(0x75d8ff, 16, 10);
  fill.position.set(-4, 2, 1);
  scene.add(key, rim, sweep, sweepTarget, fill);

  const ground = new T.Mesh(new T.PlaneGeometry(70, 70), new T.MeshStandardMaterial({ color: 0x110b20, metalness: .46, roughness: .32, envMap: environment.texture, envMapIntensity: .15 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.018;
  scene.add(ground);
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 64;
  const shadowContext = shadowCanvas.getContext("2d")!;
  const shadow = shadowContext.createRadialGradient(32, 32, 0, 32, 32, 32);
  shadow.addColorStop(0, "rgba(0,0,0,.95)");
  shadow.addColorStop(.57, "rgba(0,0,0,.65)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  shadowContext.fillStyle = shadow;
  shadowContext.fillRect(0, 0, 64, 64);
  const contact = new T.Mesh(new T.PlaneGeometry(5.9, 3.4), new T.MeshBasicMaterial({
    map: new T.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false,
  }));
  contact.rotation.x = -Math.PI / 2;
  scene.add(contact);

  const rings = new T.Group();
  const ringMaterial = new T.MeshBasicMaterial({ color: 0x7d82ff, transparent: true, opacity: 0, depthWrite: false });
  for (const [radius, length] of [[2.75, Math.PI * 1.6], [3.05, Math.PI * 1.1], [3.34, Math.PI * 1.8]]) {
    const ring = new T.Mesh(new T.RingGeometry(radius, radius + .013, 96, 1, .1, length), ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    rings.add(ring);
  }
  rings.position.y = .012;
  scene.add(rings);
  const hardware = new T.MeshStandardMaterial({ color: 0x26233d, metalness: .7, roughness: .26, envMap: environment.texture });
  const objects = panels.map((panel, i) => makePanel(panel, i === 0, hardware));
  scene.add(...objects);

  const violet = new T.Color(0x382c55);
  const technical = new T.Color(0x102746);
  const look = new T.Vector3();
  const cameraTarget = new T.Vector3();
  let rendered = false;

  function draw(progress: number, x: number, y: number, uv: number, uvEnabled: boolean, inspectionFocus?: number) {
    const from = Math.min(shots.length - 1, Math.floor(progress));
    const to = Math.min(shots.length - 1, from + 1);
    const blend = T.MathUtils.smoothstep(progress - from, 0, 1);
    const value = (field: keyof (typeof shots)[number]) => T.MathUtils.lerp(shots[from][field], shots[to][field], blend);
    const angle = value("angle") + x * .22;
    const portrait = camera.aspect < 1.1;
    const distance = (inspectionFocus === undefined ? value("distance") : 4.1) * (portrait ? 1.28 : 1);
    const focus = inspectionFocus ?? value("focus");
    cameraTarget.set(Math.sin(angle) * -distance + focus, value("height") + y * .34, Math.cos(angle) * distance);
    camera.position.lerp(cameraTarget, rendered ? .12 : 1);
    look.lerp(cameraTarget.set(focus, portrait ? .74 : .66, 0), rendered ? .13 : 1);
    camera.lookAt(look);
    vehicle.group.rotation.y = x * .075;
    rim.position.x = 1 + x * 2.3;
    fill.position.z = 2 + y * 1.5;
    const spot = T.MathUtils.lerp(-1.9, 1.88, uv);
    sweep.position.set(spot + x * .4, 2.1, 2.5);
    sweepTarget.position.set(spot, .68, .76);
    sweep.intensity = uvEnabled ? value("uv") * 105 : 0;
    vehicle.paint.color.copy(violet).lerp(technical, value("wire") * .8);
    vehicle.wire.material.opacity = value("wire") * .82;
    ringMaterial.opacity = value("wire") * .37;
    rings.rotation.y = progress * .9 + x * .5;
    objects.forEach((object, index) => {
      const chapter = [3, 4, 7][index];
      const weight = Math.max(0, 1 - Math.abs(progress - chapter));
      object.visible = weight > .025;
      object.position.set((portrait ? .93 : 1.85) + (1 - weight) * .55, (portrait ? 1.65 : 1.24) - (1 - weight) * .6, 1.15 + weight * .38);
      object.rotation.set(-.1 + y * .12, -.27 + x * .23 + (1 - weight) * .7, .05);
      object.scale.setScalar(.6 + weight * .45);
    });
    rendered = true;
    renderer.render(scene, camera);
  }

  return {
    draw,
    resize(width: number, height: number) {
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(devicePixelRatio, width < 650 ? 1.15 : 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    dispose() {
      const geometries = new Set<T.BufferGeometry>();
      const materials = new Set<T.Material>();
      scene.traverse(object => {
        if (object instanceof T.Mesh || object instanceof T.LineSegments) {
          geometries.add(object.geometry);
          materials.add(object.material);
        }
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => {
        if (material instanceof T.MeshBasicMaterial) material.map?.dispose();
        material.dispose();
      });
      environment.dispose();
      renderer.dispose();
    },
  };
}
