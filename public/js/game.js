import * as THREE from "https://unpkg.com/three/build/three.module.js";
import { World, blockRef } from "./world.js";
import {
  BLOCK_AIR,
  BLOCK_BANDEDIRON,
  BLOCK_STONE,
  BLOCK_DIRT,
  BLOCK_GRASS
} from "./world.js";

const database = firebase.database();
const auth = firebase.auth();
if (location.hostname === "localhost") { // point to emulator if using it
  database.useEmulator("localhost", 9000);
  auth.useEmulator("http://localhost:9099");
}

// globals
const contentWrapper = document.querySelector(".content");
const keyManager = new KeyManager();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const pointer = new THREE.Vector2();
function onPointerMove(event) {
  const rect = contentWrapper.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / contentWrapper.clientWidth) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / contentWrapper.clientHeight) * 2 + 1;
}

contentWrapper.addEventListener("pointermove", onPointerMove, false);


class Character {
  constructor() {
    this.height = 1.5;
    this.width = 0.5;
    const boxGeo = new THREE.BoxGeometry(this.width, this.height, this.width);
    const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(boxGeo, playerMaterial);
    this.mesh.position.setX(32);
    this.mesh.position.setY(64);
    this.mesh.position.setZ(32);

    this.grounded = false;

    this.gravity = -0.01;
    this.velocity = new THREE.Vector3(0, 0, 0);

    this.characterRaycast = new THREE.Raycaster();

    this.speed = 3;
  }

  addToScene(s) {
    s.add(this.mesh);
  }

  removeFromScene(s) {
    s.remove(this.mesh);
  }

  setPosition(x, y, z) {
    this.mesh.position.set(x, y, z);
  }

  getPosition() {
    return this.mesh.position.toArray();
  }

  doCharacterCollisionRaycast(origin, direction, far, objects, onHit) {
    this.characterRaycast.set(origin, direction);
    this.characterRaycast.far = far;
    const others = this.characterRaycast.intersectObjects(objects);
    if (others.length > 0) {
      onHit(others[0]);
    }
  }

  addVelocity(v) {
    this.velocity.add(v);
  } 

  update(dt) {
    this.velocity.setY(this.velocity.y + this.gravity);
    let newPos = new THREE.Vector3().addVectors(this.mesh.position, this.velocity);
    this.grounded = false;

    const nearbyChunks = [];
    for (let x = -1; x < 2; x++) {
      for (let y = -1; y < 2; y++) {
        for (let z = -1; z < 2; z++) {
          let i = world.getChunkMeshIndexFromWorldPos([this.mesh.position.x + x, this.mesh.position.y + y, this.mesh.position.z + z]);
          if (world.chunkMeshes[i] == null) continue;
          nearbyChunks.push(world.chunkMeshes[i]);
        }
      }
    }

    // raycast down
    this.doCharacterCollisionRaycast(newPos, new THREE.Vector3(0, -1, 0), this.height / 2, nearbyChunks, (other) => {
      this.grounded = true;
      if (this.velocity.y < 0) {
          newPos.setY(other.point.y + this.height / 2);
          this.velocity.setY(0);
        }
    });

    // raycast up
    this.doCharacterCollisionRaycast(newPos, new THREE.Vector3(0, 1, 0), this.height / 2, nearbyChunks, (other) => {
      if (this.velocity.y > 0) {
        newPos.setY(other.point.y - this.height / 2);
        this.velocity.setY(0);
      }
    });

    // raycast forward
    let forward = new THREE.Vector3(this.velocity.x, 0, this.velocity.z).normalize();
    let feetPos = new THREE.Vector3(newPos.x, newPos.y - this.height / 2 + 0.1, newPos.z);
    let headPos = new THREE.Vector3(newPos.x, newPos.y + this.height / 2, newPos.z); 
    // at feet
    this.doCharacterCollisionRaycast(feetPos, forward, this.width / 2, nearbyChunks, (other) => {
        newPos.add(forward.clone().multiplyScalar(other.distance - this.width / 2));
    });

    // at head
    this.doCharacterCollisionRaycast(headPos, forward, this.width / 2, nearbyChunks, (other) => {
      newPos.add(forward.clone().multiplyScalar(other.distance - this.width / 2));
    });

    // raycast to x component
    let xComp = new THREE.Vector3(this.velocity.x, 0, 0).normalize();
    let far = this.width / 2;
    // at feet
    this.doCharacterCollisionRaycast(feetPos, xComp, far, nearbyChunks, (other) => {
      newPos.add(xComp.clone().multiplyScalar(other.distance - far));
    });
    // at head
    this.doCharacterCollisionRaycast(headPos, xComp, far, nearbyChunks, (other) => {
      newPos.add(xComp.clone().multiplyScalar(other.distance - far));
    });

    // raycast to z component
    let zComp = new THREE.Vector3(0, 0, this.velocity.z).normalize();
    // at feet
    this.doCharacterCollisionRaycast(feetPos, zComp, far, nearbyChunks, (other) => {
      newPos.add(zComp.clone().multiplyScalar(other.distance - far));
    });
    // at head
    this.doCharacterCollisionRaycast(headPos, zComp, far, nearbyChunks, (other) => {
      newPos.add(zComp.clone().multiplyScalar(other.distance - far));
    });

    // simulate drag
    this.setPosition(newPos.x, newPos.y, newPos.z);
    this.velocity.multiply(new THREE.Vector3(0.2, 1, 0.2));
  }

  // attach listeners to a player's character object
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

class Player {
  constructor(character) {
    this.character = character;

    this.buildDistance = 4;
    this.MODE_BUILD = 0;
    this.MODE_DELETE = 1;
    this.mode = this.MODE_BUILD;
    this.activeBlock = BLOCK_STONE;

    // preview block
    const previewBlockGeo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    this.previewBlockMaterialLegal = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.5,
      color: 0x00ff00
    });
    this.previewBlockMaterialIllegal = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.5,
      color: 0xff0000
    });
    this.previewBlockMesh = new THREE.Mesh(previewBlockGeo, this.previewBlockMaterialLegal);
    this.previewBlockInScene = false;

    this.playerRaycast = new THREE.Raycaster();

    this.onMouseClick = (event) => {
      switch (event.button) {
        case 0: // LMB
          this.trySetBlock(event, this.activeBlock);
          break;
        case 1: // MMB

          break;
        case 2: // RMB

          break;
      }
    }
    contentWrapper.addEventListener("click", this.onMouseClick, false);

    // press 1 key for building
    keyManager.addKey("Digit1", {
      down: false,
      downFunction: dt => {},
      pressCallback: () => {
        this.mode = this.MODE_BUILD;
        this.activeBlock = BLOCK_STONE;
      },
      upCallback: () => {},
    });

    // press 2 key for deletion
    keyManager.addKey("Digit2", {
      down: false,
      downFunction: dt => {},
      pressCallback: () => {
        this.mode = this.MODE_DELETE;
        this.activeBlock = BLOCK_AIR;
      },
      upCallback: () => {},
    });
  }

  doPlayerPointerRaycast() {
    this.playerRaycast.setFromCamera(pointer, this.camera);
    try { // when players load in, sometimes player update is called before world is loaded
      const others = this.playerRaycast.intersectObjects(world.chunkMeshes);
      if (others.length > 0) {
        return others[0];
      }
    } catch {
      return null;
    }
  }

  trySetBlock(mouseEvent, newbId) {
    // using the preview block location, try to set id of block
    if (this.buildDistance < this.previewBlockMesh.position.distanceTo(this.character.mesh.position)) return;
    const worldPos = this.previewBlockMesh.position.toArray();
    if (world.bData[worldPos[0], worldPos[1], worldPos[2]] != null) {
      world.bData[worldPos[0]][worldPos[1]][worldPos[2]] = newbId;
      // after setting block, send data to server and refresh chunk geometry
      const chunkPos = world.getChunkPosFromWorldPos(worldPos);
      world.sendSingleBlockData(chunkPos);
      world.refreshChunkGeometry(chunkPos);
    }
  }

  update(dt) {
    // depending on player build mode, do different actions on click
    const mousePoint = this.doPlayerPointerRaycast();
    switch (this.mode) {
      case this.MODE_BUILD:

        // display block preview
        if (mousePoint != null) { // if hit terrain
          if (!this.previewBlockInScene) { // add preview block to scene
            this.previewBlockInScene = true;
            scene.add(this.previewBlockMesh);
          }
          this.previewBlockMesh.position.set(
            Math.round(mousePoint.point.x + mousePoint.normal.x * 0.1),
            Math.round(mousePoint.point.y + mousePoint.normal.y * 0.1),
            Math.round(mousePoint.point.z + mousePoint.normal.z * 0.1));
          if (this.previewBlockMesh.position.distanceTo(this.character.mesh.position) > this.buildDistance) {
            this.previewBlockMesh.material = this.previewBlockMaterialIllegal;
          } else {
            this.previewBlockMesh.material = this.previewBlockMaterialLegal;
          }
        } else { // didn't hit anything
          if (this.previewBlockInScene) { // remove preview block from scene
            this.previewBlockInScene = false;
            scene.remove(this.previewBlockMesh);
          }
        }
        break;

      case this.MODE_DELETE:

        // display destroying block preview
        if (mousePoint != null) { // if hit terrain
          if (!this.previewBlockInScene) { // add preview block to scene
            this.previewBlockInScene = true;
            scene.add(this.previewBlockMesh);
          }
          this.previewBlockMesh.position.set(
            Math.round(mousePoint.point.x - mousePoint.normal.x * 0.1),
            Math.round(mousePoint.point.y - mousePoint.normal.y * 0.1),
            Math.round(mousePoint.point.z - mousePoint.normal.z * 0.1));
          this.previewBlockMesh.material = this.previewBlockMaterialIllegal;
        } else if (this.previewBlockInScene) { // didn't hit anything
          // remove preview block from scene
          this.previewBlockInScene = false;
          scene.remove(this.previewBlockMesh);
        }
        break;
    }
  }
}

// needed globals
let scene = new THREE.Scene();
let clientCharacter = new Character();
let clientPlayer = new Player(clientCharacter);
let otherCharacters = new Map();
const world = new World(64, 64, 64);
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
          console.log("no other players present. Generate World!");
          world.generate();
          world.sendWorldData();
          world.createChunkMeshes();
          world.addWorldToScene(scene);
        } else {
          console.log("other players present. Retrieve World Data!");
          world.retrieveWorldData().then(() => { 
            world.createChunkMeshes();
            world.addWorldToScene(scene);
          });
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
    console.log("player logged out, reset local game state");
    authenticated = false;
    resetGameGlobals();
    if (database.ref(`players`) == null) { // if there are no players left
      database.ref(`world`).set(null);
    }
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
  const camera = new THREE.PerspectiveCamera(75, 8 / 6, 0.1, 100);
  let cameraOffset = new THREE.Vector3(12, 8, 0);
  let cameraOrigin = new THREE.Vector3();
  let camOffsetRotation = 0;

  // set player camera
  clientPlayer.camera = camera;

  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(contentWrapper.clientWidth, contentWrapper.clientHeight);
  contentWrapper.appendChild(renderer.domElement);

  // add lights
  const ambientLight = new THREE.AmbientLight(0x5c5c5c);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xb0b0b0);
  directionalLight.rotation.set(0.2, 0, 0.2);
  scene.add(directionalLight);

  // operations
  // Any value added to this map will have the update(dt) function called from within that object.
  // ALL objects added to this map MUST have a .update(dt) function implemented.
  let updateObjects = new Map();

  // player & character
  clientCharacter.addToScene(scene);
  updateObjects.set("clientCharacter", clientCharacter);
  updateObjects.set("clientPlayer", clientPlayer);

  // add input reactions
  updateObjects.set("keyManager", keyManager);

  keyManager.addKey("KeyW", {
    down: false,
    downFunction: dt => {
      let dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      dir.setY(0);
      clientCharacter.addVelocity(dir.multiplyScalar(clientCharacter.speed * dt));
    },
    pressCallback: () => { },
    upCallback: () => { },
  });

  keyManager.addKey("KeyA", {
    down: false,
    downFunction: dt => {
      let dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      let right = dir.cross(new THREE.Vector3(0, 1, 0));
      clientCharacter.addVelocity(right.multiplyScalar(-clientCharacter.speed * dt));
    },
    pressCallback: () => { },
    upCallback: () => { },
  });

  keyManager.addKey("KeyS", {
    down: false,
    downFunction: dt => {
      let dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      dir.setY(0);
      clientCharacter.addVelocity(dir.multiplyScalar(-clientCharacter.speed * dt));
    },
    pressCallback: () => { },
    upCallback: () => { },
  });

  keyManager.addKey("KeyD", {
    down: false,
    downFunction: dt => {
      let dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      let right = dir.cross(new THREE.Vector3(0, 1, 0));
      clientCharacter.addVelocity(right.multiplyScalar(clientCharacter.speed * dt));
    },
    pressCallback: () => { },
    upCallback: () => { },
  });

  keyManager.addKey("KeyR", {
    down: false,
    downFunction: dt => {
      let up = new THREE.Vector3(0, 1, 0);
      clientCharacter.addVelocity(up.multiplyScalar(clientCharacter.speed * dt));
    },
    pressCallback: () => {},
    upCallback: () => {},
  });

  keyManager.addKey("KeyF", {
    down: false,
    downFunction: dt => {
      let up = new THREE.Vector3(0, 1, 0);
      clientCharacter.addVelocity(up.multiplyScalar(-clientCharacter.speed * dt));
    },
    pressCallback: () => {},
    upCallback: () => {},
  });

  keyManager.addKey("KeyQ", {
    down: false,
    downFunction: dt => {
      camOffsetRotation += 3 * dt;
    },
    pressCallback: () => {},
    upCallback: () => {},
  });

  keyManager.addKey("KeyE", {
    down: false,
    downFunction: dt => {
      camOffsetRotation -= 3 * dt;
    },
    pressCallback: () => {},
    upCallback: () => {},
  });

  keyManager.addKey("Space", {
    down: false,
    downFunction: dt => {},
    pressCallback: () => {
      if (clientCharacter.grounded) clientCharacter.addVelocity(new THREE.Vector3(0, 0.18, 0));
    },
    upCallback: () => {},
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
