import * as THREE from "https://unpkg.com/three/build/three.module.js";

const database = firebase.database();
const auth = firebase.auth();
if (location.hostname === "localhost") { // point to emulator if using it
  database.useEmulator("localhost", 9000);
  auth.useEmulator("http://localhost:9099");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// make this object because in the voxel editor, we are given only position and hex color,
// so use the hex color in the editor to convert to tile indices.
// I do this for faster lookup when parsing sample world data
const hexIndex = new Map();
hexIndex.set("000000", 1);
hexIndex.set("847e87", 2);
hexIndex.set("8f563b", 3);
hexIndex.set("6abe30", 4);

// create geo for tiles
const halfBlockSize = 0.5;
const standardBlockGeo = new THREE.BufferGeometry();
// standardTileGeo vertex buffer & index buffer
{
  const vertexBuffer = new THREE.InterleavedBuffer(new Float32Array([
    // Front
    -halfBlockSize, halfBlockSize, halfBlockSize, 0, 0, -1, 0, 1,
    halfBlockSize, halfBlockSize, halfBlockSize, 0, 0, -1, 1, 1,
    -halfBlockSize, -halfBlockSize, halfBlockSize, 0, 0, -1, 0, 0,
    halfBlockSize, -halfBlockSize, halfBlockSize, 0, 0, -1, 1, 0,
    // Back
    halfBlockSize, halfBlockSize, -halfBlockSize, 0, 0, 1, 0, 1,
    -halfBlockSize, halfBlockSize, -halfBlockSize, 0, 0, 1, 1, 1,
    halfBlockSize, -halfBlockSize, -halfBlockSize, 0, 0, 1, 0, 0,
    -halfBlockSize, -halfBlockSize, -halfBlockSize, 0, 0, 1, 1, 0,
    // Left
    -halfBlockSize, halfBlockSize, -halfBlockSize, -1, 0, 0, 0, 1,
    -halfBlockSize, halfBlockSize, halfBlockSize, -1, 0, 0, 1, 1,
    -halfBlockSize, -halfBlockSize, -halfBlockSize, -1, 0, 0, 0, 0,
    -halfBlockSize, -halfBlockSize, halfBlockSize, -1, 0, 0, 1, 0,
    // Right
    halfBlockSize, halfBlockSize, halfBlockSize, 1, 0, 0, 0, 1,
    halfBlockSize, halfBlockSize, -halfBlockSize, 1, 0, 0, 1, 1,
    halfBlockSize, -halfBlockSize, halfBlockSize, 1, 0, 0, 0, 0,
    halfBlockSize, -halfBlockSize, -halfBlockSize, 1, 0, 0, 1, 0,
    // Top
    -halfBlockSize, halfBlockSize, halfBlockSize, 0, 1, 0, 0, 1,
    halfBlockSize, halfBlockSize, halfBlockSize, 0, 1, 0, 1, 1,
    -halfBlockSize, halfBlockSize, -halfBlockSize, 0, 1, 0, 0, 0,
    halfBlockSize, halfBlockSize, -halfBlockSize, 0, 1, 0, 1, 0,
    // Bottom
    halfBlockSize, -halfBlockSize, halfBlockSize, 0, -1, 0, 1, 0,
    -halfBlockSize, -halfBlockSize, halfBlockSize, 0, -1, 0, 0, 0,
    halfBlockSize, -halfBlockSize, -halfBlockSize, 0, -1, 0, 1, 1,
    -halfBlockSize, -halfBlockSize, -halfBlockSize, 0, -1, 0, 0, 1,
  ]), 8);

  const indices = new Uint16Array([
    0, 2, 1,
    2, 3, 1,
    4, 6, 5,
    6, 7, 5,
    8, 10, 9,
    10, 11, 9,
    12, 14, 13,
    14, 15, 13,
    16, 17, 18,
    18, 17, 19,
    20, 21, 22,
    22, 21, 23
  ]);

  standardBlockGeo.setIndex(new THREE.BufferAttribute(indices, 1));
  standardBlockGeo.setAttribute("position", new THREE.InterleavedBufferAttribute(vertexBuffer, 3, 0));
  standardBlockGeo.setAttribute("normal", new THREE.InterleavedBufferAttribute(vertexBuffer, 3, 3));
  standardBlockGeo.setAttribute("uv", new THREE.InterleavedBufferAttribute(vertexBuffer, 6, 2));
}

// the blockref has an array of all of the possible blocks
const blockRef = [
  {//0
    name: "air",
    material: new THREE.MeshLambertMaterial({ transparent: true, opacity: 0 }),
    geometry: standardBlockGeo,
    opaque: false,
  },
  {//1
    name: "banded iron",
    material: new THREE.MeshLambertMaterial({ color: 0x000000 }),
    geometry: standardBlockGeo,
    opaque: true
  },
  {//2
    name: "stone",
    material: new THREE.MeshLambertMaterial({ color: 0x847E87 }),
    geometry: standardBlockGeo,
    opaque: true
  },
  {//3
    name: "dirt",
    material: new THREE.MeshLambertMaterial({ color: 0x8F563B }),
    geometry: standardBlockGeo,
    opaque: true
  },
  {//4
    name: "grass",
    material: new THREE.MeshLambertMaterial({ color: 0x6ABE30 }),
    geometry: standardBlockGeo,
    opaque: true
  },
];

class Block {
  constructor(bId = 0, pos = new THREE.Vector3(0,0,0)) {
    this.bId = bId;
    const b = blockRef[bId];
    this.mesh = new THREE.Mesh(b.geometry, b.material)
    this.mesh.position.setX(pos.x);
    this.mesh.position.setY(pos.y - 20);
    this.mesh.position.setZ(pos.z);
  }

  setPosition(pos) {
    this.mesh.position.set(pos.getComponent(0), pos.getComponent(1), pos.getComponent(2));
  }

  addToScene(s) {
    s.add(this.mesh);
  }

  removeFromScene(s) {
    s.remove(this.mesh);
  }
}

class LayeredNoise {
  constructor(scale, octaves, persistance, lacunarity) {
    this.scale = scale;
    this.octaves = octaves;
    this.persistance = persistance;
    this.lacunarity = lacunarity;
  }

  getNoise(x, y, z = 0) {
    let amplitude = 1;
    let frequency = 1;
    let outNoise = 0;

    for (let i = 0; i < this.octaves; i++) {
      let sampleX = x / this.scale * frequency;
      let sampleY = y / this.scale * frequency;
      let sampleZ = z / this.scale * frequency;

      let n = noise.simplex3(sampleX, sampleY, sampleZ);
      outNoise += n * amplitude;

      amplitude *= this.persistance;
      frequency *= this.lacunarity;
    }

    return outNoise;
  }
}

class World {
  constructor(w, h, d) {
    // initialize block data 3d array
    this.width = w;
    this.height = h;
    this.depth = d;
    this.bData = new Array(w);
    for (let i = 0; i < this.bData.length; i++) {
      this.bData[i] = new Array(h);
      for (let j = 0; j < this.bData[i].length; j++) {
        this.bData[i][j] = new Array(d);
      }
    }
    this.seed = noise.seed;
  }

  generate() {
    noise.seed(Math.random());
    let layeredNoise = new LayeredNoise(20, 4, 0.5, 1.5);
    let surfaceHeightVariance = 4;
    let surfaceLevel = Math.round(this.height * 0.7);

    // generate hills and valleys
    this.forEachBlock((block, x, y, z) => { // x, y, z is the position of the block in array
      let n = layeredNoise.getNoise(x, z);
      n = Math.round(n * surfaceHeightVariance) + surfaceLevel;

      if (y === n) this.bData[x][y][z] = new Block(4, new THREE.Vector3(x, y, z));
      else if (y < n) this.bData[x][y][z] = new Block(3, new THREE.Vector3(x, y, z));
      else {
        this.bData[x][y][z] = new Block(0, new THREE.Vector3(x, y, z));
        return;
      }
      this.bData[x][y][z].addToScene(scene);
    });

    // last step: if surrounded by opaque neighbors, do not render the block.
    this.forEachBlock((block, x, y, z) => {
      // if any neighbors are oob or transparent, we need to keep rendering the block
      // don't check for the bottom neighbor because of camera constraints
      if (x + 1 === this.width ||
          x - 1 < 0 ||
          y + 1 === this.height ||
          z + 1 === this.depth ||
          z - 1 < 0) return;
      if (!blockRef[this.bData[x + 1][y][z].bId].opaque ||
          !blockRef[this.bData[x - 1][y][z].bId].opaque ||
          !blockRef[this.bData[x][y + 1][z].bId].opaque ||
          !blockRef[this.bData[x][y][z + 1].bId].opaque ||
          !blockRef[this.bData[x][y][z - 1].bId].opaque) {
        return;
      } // no neighbors are transparent, so we don't need to render the block.
      block.removeFromScene(scene);
    });
  }

  // RETURNS A COPY OF THE BLOCK, NOT REFERENCE. WHY? I DONT KNOW!
  forEachBlock(func) {
    for (let i = 0; i < this.bData.length; i++) {
      for (let j = 0; j < this.bData[i].length; j++) {
        for (let k = 0; k < this.bData[i][j].length; k++) {
          func(this.bData[i][j][k], i, j, k);
        }
      }
    }
  }

  // .txt world format: "X Z Y 000000"
  async parseWorldText(file) {
    // parse world sample text into usable game data
    // js is annoying, wish I could just do output[6][40][6];
    let output = new Array(6);
    for (let i = 0; i < output.length; i++) {
      output[i] = new Array(40);
      for (let j = 0; j < output[i].length; j++) {
        output[i][j] = new Array(6);
      }
    }

    await fetch(file)
    .then(response => response.text())
    .then(text => {
      const lines = text.split('\n');

      // set existing tiles
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line[0] === '#') continue;
        let vals = line.split(' ');
        let outPos = new THREE.Vector3(parseInt(vals[0]), parseInt(vals[2]), parseInt(vals[1])); // z-up -> y-up
        vals[3] = vals[3].trim(); // remove invisible '\n' at end of string. This caused me hours of pain.
        let bId = hexIndex.get(vals[3]);
        if (bId == null) {
          console.log(`ERR: tile id not found from hex code ${vals[3]}. Tile will be air.`);
          bId = 0;
        }
        output[outPos.x][outPos.y][outPos.z] = new Block(bId, outPos);
      }
    });

    for (let i = 0; i < output.length; i++) {
      for (let j = 0; j < output[i].length; j++) {
        for (let k = 0; k < output[i][j].length; k++) {
          if (output[i][j][k] == null) output[i][j][k] = new Block(0, new THREE.Vector3(i, j, k));
        }
      }
    }

    return output;
  }
}

class Character {
  constructor() {
    const boxGeo = new THREE.BoxGeometry(0.5, 1.5, 0.5);
    const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(boxGeo, playerMaterial);
    this.mesh.position.setY(1);

    this.speed = 10;
  }

  addToScene(s) {
    s.add(this.mesh);
  }

  removeFromScene(s) {
    s.remove(this.mesh);
  }

  setPosition(vec3) {
    this.mesh.position.set(vec3);
  }

  update(dt) {
    //this.mesh.position.clamp(new THREE.Vector3(-10, 1, -10), new THREE.Vector3(10, 10, 10));
  }

  setupListeners(uid) {
    database.ref(`characters/${uid}/position`).on("value", (snapshot) => {
      if (snapshot == null) return;
      const pos = snapshot.val();
      if (snapshot.val() == null) return;
      this.mesh.position.setX(pos[0]);
      this.mesh.position.setY(pos[1]);
      this.mesh.position.setZ(pos[2]);
    });
  }
}

// needed globals
let scene = new THREE.Scene();
let clientCharacter = new Character();
let otherCharacters = new Map();
let clientUid;

function resetGameGlobals() {
  scene = new THREE.Scene();
  clientCharacter = new Character();
  otherCharacters = new Map();
}

// database management
function sendCharacterInformation() {
  if (loggingOut) return;
  let characterData = {
    position: clientCharacter.mesh.position.toArray(),
  };
  let updates = {};
  updates[`characters/${clientUid}`] = characterData;

  // final check before sending
  if (database.ref(`characters/${clientUid}`) == null || database.ref(`players/${clientUid}`) == null) {
    console.log("no character and/or player ref in database!");
    return;
  }
  return database.ref().update(updates);
}

// on auth changed (logged in/out)
let authenticated = false;
auth.onAuthStateChanged(user => {
  if (user) {
    async function wrapper() {
      console.log("user logged in, adding data to game");
      await database.ref(`players`).get().then((snapshot) => {
        if (!snapshot.exists()) {
          // generate world because no players are in game.
        }
      });

      authenticated = true;
      clientUid = String(user.uid);

      // write player data to the database
      const playerRef = database.ref(`players/${user.uid}`);
      const characterRef = database.ref(`characters/${user.uid}`);
      playerRef.onDisconnect().remove(); // on client disconnect, delete temp game data
      playerRef.set({
        uid: user.uid,
      });
      characterRef.onDisconnect().remove();
      characterRef.set({
        position: [ 0, 0, 0 ],
      });
    }
    wrapper();
  } else if (clientUid != null) { // player logged out, remove info from database
    console.log("player logged out, reset game state");
    authenticated = false;
    console.log(clientUid);
    resetGameGlobals();
  }
});

async function waitForLogin() {
  while (authenticated === false) {
    await sleep(100);
  }
  initGame();
  runGame();
}
waitForLogin();

function initGame() {
  // players added/changed/removed
  let lastSnapshot = [];
  database.ref(`players`).on("value", (snapshot) => {
    let currentSnapshot;
    if (snapshot.val() == null) currentSnapshot = [];
    else currentSnapshot = Object.keys(snapshot.val());

    console.log("here are the character ids:")
    for (const key of otherCharacters.keys()) { console.log(key) }

    if (currentSnapshot == null) currentSnapshot = [];
    console.log("current snapshot", currentSnapshot);
    console.log("last snapshot", lastSnapshot);

    if (lastSnapshot.length > currentSnapshot.length) { // a player left
      lastSnapshot.forEach(lastId => {
        if (currentSnapshot.find(currId => currId === lastId) == null && lastId !== clientUid) { // if id not in current (player left)
          console.log("DELETING PLAYER CHARACTER:", lastId);
          console.log("client:", clientUid);
          const char = otherCharacters.get(lastId);
          console.log(char);

          char.removeFromScene(scene); // remove char from scene and delete ref
          otherCharacters.delete(lastId);
        }
      });
    } else if (lastSnapshot.length < currentSnapshot.length) { // a player joined
      currentSnapshot.forEach(currId => {
        console.log("checking id", currId);
        console.log("client uid:", clientUid);
        if (lastSnapshot.find(lastId => lastId === currId) == null && currId !== clientUid) { // if id not in last (new player)
          const newCharacter = new Character(); // make new char and add to scene
          newCharacter.setupListeners(currId);
          newCharacter.addToScene(scene);
          otherCharacters.set(currId, newCharacter);

          console.log("NEW PLAYER JOINED:", currId);
          console.log("client:", clientUid);
        }
      });
    }
    lastSnapshot = currentSnapshot;
  });
}

function runGame() {
  // basic world setup
  const contentWrapper = document.querySelector(".content");

  // generate world
  const world = new World(20, 50, 20);
  world.generate();

  //const camera = new THREE.OrthographicCamera(-20, 20, 15, -15, 0.1, 100);
  const camera = new THREE.PerspectiveCamera(75, 8 / 6, 0.1, 100);
  let cameraOffset = new THREE.Vector3(10, 5, 10);
  let cameraOrigin = new THREE.Vector3();
  let camOffsetRotation = 0;

  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(contentWrapper.clientWidth, contentWrapper.clientHeight);
  contentWrapper.appendChild(renderer.domElement);

  // add lights
  const ambientLight = new THREE.AmbientLight(0x5c5c5c);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xb0b0b0);
  directionalLight.rotation.set(0.2, 0, 0.2);
  scene.add(directionalLight);

  // make materials
  const materialLambert = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
  const materialToon = new THREE.MeshToonMaterial({ color: 0x00ff00 });

  // add geometry


  // operations
  // Any value added to this map will have the update(dt) function called from within that object.
  // ALL objects added to this map MUST have a .update(dt) function implemented.
  let updateObjects = new Map();

  // player
  clientCharacter.addToScene(scene);
  updateObjects.set("clientCharacter", clientCharacter);

  // game functions
  function movePlayer(dir) {
    clientCharacter.mesh.position.add(dir);
  }

  // add input reactions
  let keyManager = new KeyManager();
  updateObjects.set("keyManager", keyManager);

  keyManager.addKey("KeyW", {
    down: false,
    downFunction: dt => {
      let dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      dir.setY(0);
      movePlayer(dir.multiplyScalar(clientCharacter.speed * dt));
    },
    pressCallback: () => { },
    upCallback: () => { },
  });

  keyManager.addKey("KeyA", {
    down: false,
    downFunction: dt => {
      let dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      let right = dir.cross(new THREE.Vector3(0, 1, 0));
      movePlayer(right.multiplyScalar(-clientCharacter.speed * dt));
    },
    pressCallback: () => { },
    upCallback: () => { },
  });

  keyManager.addKey("KeyS", {
    down: false,
    downFunction: dt => {
      let dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      dir.setY(0);
      movePlayer(dir.multiplyScalar(-clientCharacter.speed * dt));
    },
    pressCallback: () => { },
    upCallback: () => { },
  });

  keyManager.addKey("KeyD", {
    down: false,
    downFunction: dt => {
      let dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      let right = dir.cross(new THREE.Vector3(0, 1, 0));
      movePlayer(right.multiplyScalar(clientCharacter.speed * dt));
    },
    pressCallback: () => { },
    upCallback: () => { },
  });

  keyManager.addKey("KeyR", {
    down: false,
    downFunction: dt => {
      let up = new THREE.Vector3(0, 1, 0);
      movePlayer(up.multiplyScalar(clientCharacter.speed * dt));
    },
    pressCallback: () => {},
    upCallback: () => {},
  });

  keyManager.addKey("KeyF", {
    down: false,
    downFunction: dt => {
      let up = new THREE.Vector3(0, 1, 0);
      movePlayer(up.multiplyScalar(-clientCharacter.speed * dt));
    },
    pressCallback: () => {},
    upCallback: () => {},
  });

  keyManager.addKey("KeyQ", {
    down: false,
    downFunction: dt => {
      camOffsetRotation += 3 * dt;
    },
    pressCallback: () => { },
    upCallback: () => { },
  });

  keyManager.addKey("KeyE", {
    down: false,
    downFunction: dt => {
      camOffsetRotation -= 3 * dt;
    },
    pressCallback: () => { },
    upCallback: () => { },
  });

  // aux variables
  let lastTime = Date.now();

  function gameLoop() {
    requestAnimationFrame(gameLoop);

    // dt
    let dt = (Date.now() - lastTime) / 1000;
    lastTime = Date.now();

    // update objects
    for (const val of updateObjects.values()) {
      val.update(dt);
    }

    // update camera
    cameraOrigin = clientCharacter.mesh.position.clone();
    let adjustedOffset = cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), camOffsetRotation);
    camera.position.addVectors(cameraOrigin, adjustedOffset); // set position to origin + offset
    camera.lookAt(cameraOrigin);

    // send information to the server
    sendCharacterInformation();

    renderer.render(scene, camera);
  }
  gameLoop();
}
