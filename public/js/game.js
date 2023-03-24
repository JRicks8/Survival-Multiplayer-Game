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
const standardTileGeo = new THREE.BoxGeometry(1, 1, 1);

// the tileref has an array of all of the possible tiles
const tileRef = [
  {//0
    name: "air",
    material: new THREE.MeshBasicMaterial({ opacity: 0 }),
    geometry: standardTileGeo,
    opaque: false,
  },
  {//1
    name: "banded iron",
    material: new THREE.MeshBasicMaterial({ color: 0x000000 }),
    geometry: standardTileGeo,
    opaque: true
  },
  {//2
    name: "stone",
    material: new THREE.MeshBasicMaterial({ color: 0x847E87 }),
    geometry: standardTileGeo,
    opaque: true
  },
  {//3
    name: "dirt",
    material: new THREE.MeshBasicMaterial({ color: 0x8F563B }),
    geometry: standardTileGeo,
    opaque: true
  },
  {//4
    name: "grass",
    material: new THREE.MeshBasicMaterial({ color: 0x6ABE30 }),
    geometry: standardTileGeo,
    opaque: true
  },
];

class Block {
  constructor(tId = 0, pos = new THREE.Vector3()) {
    this.tId = tId;
    const t = tileRef[tId];
    this.mesh = new THREE.Mesh(t.geometry, t.material)
    this.mesh.position.set(pos.getComponent(0), pos.getComponent(1), pos.getComponent(2));
  }

  setPosition(pos) {
    this.mesh.position.set(pos.getComponent(0), pos.getComponent(1), pos.getComponent(2))
  }

  addToScene(s) {
    s.add(this.mesh);
  }

  removeFromScene(s) {
    s.remove(this.mesh);
  }
}

/** Wave Function Collapse Algorithm, used for world generation */
class WFC {
  /** init params for world generation */
  constructor() {
  }

  /** generates the world using the WFC */
  generate(file, n = 3) {
    // 1: read input, store every NxN pattern and count occurences
    let worldData = this.parseWorldText(file);
    worldData.then(() => {
      console.log(worldData);
    })

    // 2: store every possible adjacency pattern

    // 3: create 3d array (called w for wave). Each element holds an array
    // of bools determining the state of each stored pattern. At start, all
    // bools are true because every pattern is initially possible.

    // 4: create 3d array (called h). each element holds a float that is the
    // "entropy" value of the corresponding cell in output.
    // calculate entropy via the shannon formula, the input being the number
    // of true values in the wave cell (w[n]).
    // Initial entropy of all wave cells are the same.

    // 5: find cell with minimum non-zero entropy (first iteration is random)
    // out of valid patterns (true values) pick one randomly, weighted by that
    // pattern's occurences.

    // 6: assign the selected pattern to the cell with minimum entropy (every
    // pattern bool in the wave cell is false except for the chosen one)

    // 7: assigning a pattern to a tile has effects on neighboring tiles. using
    // the adjacency patterns in step 2, adjust possible patterns in neighboring
    // tiles. this is of course recursive and should be propagated to all tiles.
    // IF THERE ARE NO POSSIBLE PATTERNS IN ANY NEIGHBORS, the program must be stopped.

    // 8: recalculate entropy.

    // repeat steps 5-8 until all cells have collapsed.
  }

  // .txt world format: "X Z Y 000000"
  async parseWorldText(file) {
    // parse world sample text into usable game data
    // js is annoying, wish I could just do output[6][40][6];
    let output = new Array(6).fill(
      new Array(40).fill(
        new Array(6).fill(0)
      )
    );
    await fetch("../sample-world-0.txt")
    .then(response => response.text())
    .then(text => {
      const lines = text.split('\n');
      // first, fill the array with air tiles
      for (let i = 0; i < output.length; i++) {
        for (let j = 0; j < output[i].length; j++) {
          for (let k = 0; k < output[i][j].length; k++) {
            output[i][j][k] = new Block(0, new THREE.Vector3(i, j, k));
          }
        }
      }

      // then, set existing tiles
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line[0] === '#') continue;
        let vals = line.split(' ');
        let outPos = new THREE.Vector3(parseInt(vals[0]), parseInt(vals[2]), parseInt(vals[1])); // z-up -> y-up
        let tId = hexIndex.get(String(vals[3]));
        if (tId == null) {
          //console.log(`ERR: tile id not found from hex code ${vals[3]}. Tile will be air.`);
          tId = 0;
        }
        output[outPos.getComponent(0)][outPos.getComponent(1)][outPos.getComponent(2)] = new Block(tId, outPos);
      }
    });
    return output;
  }
}

class Character {
  constructor() {
    const boxGeo = new THREE.BoxGeometry(1, 2, 1);
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
    this.mesh.position.clamp(new THREE.Vector3(-10, 1, -10), new THREE.Vector3(10, 10, 10));
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
  const wfc = new WFC();
  wfc.generate("../sample-world-0.txt");

  //const camera = new THREE.OrthographicCamera(-20, 20, 15, -15, 0.1, 100);
  const camera = new THREE.PerspectiveCamera(75, 8 / 6, 0.1, 100);
  let cameraOffset = new THREE.Vector3(15, 10, 15);
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
  const planeGeo = new THREE.PlaneGeometry(20, 20);
  const baseplate = new THREE.Mesh(planeGeo, materialLambert);
  baseplate.rotation.x = -0.5 * Math.PI;
  scene.add(baseplate);

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
