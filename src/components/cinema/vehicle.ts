import * as T from "three";

// Original, unbranded sedan. Sections run from the front bumper to the tail.
const body = [
  [-2.38, .65, .48, .27], [-2.27, .86, .65, .23], [-1.95, .94, .78, .23],
  [-1.53, .98, .83, .24], [-.85, .96, .86, .26], [0, .94, .88, .25],
  [.84, .97, .88, .25], [1.48, .98, .89, .25], [2.02, .92, .82, .25],
  [2.25, .82, .75, .29], [2.34, .67, .61, .34],
];
const cabin = [
  [-1.24, .81, .825, .81], [-.86, .76, 1.12, .8], [-.54, .67, 1.36, .8],
  [-.1, .66, 1.42, .8], [.45, .65, 1.42, .8], [.86, .67, 1.32, .8],
  [1.22, .76, 1.03, .8], [1.63, .83, .85, .8],
];

function shell(sections: number[][], material: T.Material) {
  const positions: number[] = [];
  const indices: number[] = [];
  const profile = [[0, 0], [.83, 0], [1, .28], [.99, .72], [.86, .94], [.56, 1], [0, 1], [-.56, 1], [-.86, .94], [-.99, .72], [-1, .28], [-.83, 0]];
  const stride = profile.length;
  const samples = sections.flatMap((section, index) => {
    const next = sections[index + 1];
    if (!next) return [section];
    return Array.from({ length: 8 }, (_, i) => section.map((value, axis) => T.MathUtils.lerp(value, next[axis], i / 8)));
  });
  samples.forEach(([x, width, top, bottom], row) => {
    profile.forEach(([z, y], col) => {
      let height = T.MathUtils.lerp(bottom, top, y);
      if (sections === body && Math.abs(z) > .8 && y < .75) {
        const distance = Math.min(Math.abs(x + 1.49), Math.abs(x - 1.47));
        if (distance < .45) height = Math.max(height, Math.min(top - .025, .39 + Math.sqrt(.45 ** 2 - distance ** 2)));
      }
      positions.push(x, height, z * width);
      if (row > 0) {
        const next = (col + 1) % stride;
        const a = (row - 1) * stride + col;
        const b = (row - 1) * stride + next;
        const c = row * stride + col;
        const d = row * stride + next;
        indices.push(a, c, b, b, c, d);
      }
    });
  });
  for (let i = 1; i < stride - 1; i++) {
    const last = positions.length / 3 - stride;
    indices.push(0, i, i + 1, last, last + i + 1, last + i);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new T.Mesh(geometry, material);
}

function path(points: number[][], radius: number, material: T.Material) {
  return new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(([x, y, z]) => new T.Vector3(x, y, z))), 24, radius, 6), material);
}

export function createVehicle(environment: T.Texture) {
  const group = new T.Group();
  const paint = new T.MeshPhysicalMaterial({ color: 0x382c55, metalness: .69, roughness: .25, clearcoat: 1, envMap: environment, envMapIntensity: 1.25, side: T.DoubleSide });
  const glass = new T.MeshPhysicalMaterial({ color: 0x0a1023, metalness: .68, roughness: .15, envMap: environment, envMapIntensity: 1.4, side: T.DoubleSide });
  const rubber = new T.MeshStandardMaterial({ color: 0x0e0e17, roughness: .82 });
  const metal = new T.MeshStandardMaterial({ color: 0x8892a9, metalness: .8, roughness: .25, envMap: environment });
  const dark = new T.MeshStandardMaterial({ color: 0x080910, roughness: .64 });
  const white = new T.MeshBasicMaterial({ color: 0xd9eaff });
  const red = new T.MeshBasicMaterial({ color: 0xff426d });
  const detail = new T.MeshStandardMaterial({ color: 0x171323, roughness: .58 });
  const bodyMesh = shell(body, paint);
  const cabinMesh = shell(cabin, glass);
  group.add(bodyMesh, cabinMesh);

  const tireGeo = new T.LatheGeometry([[.23,-.15],[.34,-.14],[.395,-.105],[.41,-.056],[.41,.056],[.395,.105],[.34,.14],[.23,.15],[.23,-.15]].map(([x,y])=>new T.Vector2(x,y)), 32);
  tireGeo.rotateX(Math.PI / 2);
  const rimGeo = new T.TorusGeometry(.277, .025, 8, 32);
  const hubGeo = new T.CylinderGeometry(.085, .085, .065, 20);
  hubGeo.rotateX(Math.PI / 2);
  const spokeGeo = new T.BoxGeometry(.215, .033, .04);
  for (const x of [-1.49, 1.47]) {
    for (const side of [-1, 1]) {
      const wheel = new T.Group();
      wheel.position.set(x, .41, side * .86);
      const rim = new T.Mesh(rimGeo, metal);
      rim.position.z = side * .115;
      const hub = new T.Mesh(hubGeo, metal);
      hub.position.z = side * .11;
      wheel.add(new T.Mesh(tireGeo, rubber), rim, hub);
      for (let i = 0; i < 10; i++) {
        const angle = i * Math.PI / 5;
        const spoke = new T.Mesh(spokeGeo, metal);
        spoke.rotation.z = angle + .14;
        spoke.position.set(Math.cos(angle) * .16, Math.sin(angle) * .16, side * .11);
        wheel.add(spoke);
      }
      group.add(wheel);
    }
  }
  for (const side of [-1, 1]) {
    group.add(path([[-2.34,.56,side*.53],[-2.23,.62,side*.72],[-2.03,.67,side*.86],[-1.92,.69,side*.89]],.023,white));
    group.add(path([[2.3,.63,side*.51],[2.21,.69,side*.68],[2.04,.73,side*.85],[1.92,.73,side*.9]],.021,red));
    group.add(path([[-.98,.89,side*.76],[-.5,1.33,side*.59],[.4,1.42,side*.55],[.92,1.25,side*.6],[1.52,.88,side*.78]],.017,paint));
    group.add(path([[.02,.89,side*.78],[.03,1.37,side*.59]],.024,dark));
    group.add(path([[-1.02,.74,side*.96],[0,.77,side*.94],[.98,.77,side*.97]],.011,detail));
    group.add(path([[.0,.3,side*.9],[.0,.57,side*.95],[.0,.77,side*.948]],.008,detail));
    for (const x of [-.18,.73]) group.add(path([[x-.08,.7,side*.965],[x+.1,.7,side*.965]],.013,metal));
    const mirror = new T.Mesh(new T.SphereGeometry(1, 16, 10), paint);
    mirror.position.set(-.88,.92,side*.99);
    mirror.scale.set(.135,.065,.115);
    group.add(mirror);
  }
  const grille = new T.Mesh(new T.BoxGeometry(.025,.15,1.02), dark);
  grille.position.set(-2.375,.41,0);
  group.add(grille);

  const wire = new T.LineSegments(new T.EdgesGeometry(bodyMesh.geometry, 8), new T.LineBasicMaterial({ color: 0x77dbff, transparent: true, opacity: 0, depthWrite: false }));
  wire.scale.setScalar(1.003);
  group.add(wire);
  return { group, paint, wire };
}
