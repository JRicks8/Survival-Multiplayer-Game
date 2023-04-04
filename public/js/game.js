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

// sprite sheet
const blockSpriteSheet = new THREE.TextureLoader().load("../images/block-textures.png");
blockSpriteSheet.wrapS = THREE.ClampToEdgeWrapping;
blockSpriteSheet.wrapT = THREE.ClampToEdgeWrapping;
blockSpriteSheet.magFilter = THREE.NearestFilter;
blockSpriteSheet.minFilter = THREE.NearestMipmapNearestFilter;

// create geo for tiles
const half = 0.5;
const standardBlockGeo = new THREE.BufferGeometry();
const VERTEX_SIZE = 8;

function getWorldCubeFace(face, pos, bId) {
  let faceOffset = face / 5;
  let one = (bId + 1) / blockRef.length + faceOffset;
  let zero = bId / blockRef.length + faceOffset;
  switch (face) {
    case 0: return [ // front
      half + pos[0], half + pos[1], -half + pos[2], 0, 0, -1, one, one,
      -half + pos[0], -half + pos[1], -half + pos[2], 0, 0, -1, zero, zero,
      -half + pos[0], half + pos[1], -half + pos[2], 0, 0, -1, zero, one,
      half + pos[0], half + pos[1], -half + pos[2], 0, 0, -1, one, one,
      half + pos[0], -half + pos[1], -half + pos[2], 0, 0, -1, one, zero,
      -half + pos[0], -half + pos[1], -half + pos[2], 0, 0, -1, zero, zero
    ];
    case 1: return [ // back
      -half + pos[0], half + pos[1], half + pos[2], 0, 0, 1, one, one,
      half + pos[0], -half + pos[1], half + pos[2], 0, 0, 1, zero, zero,
      half + pos[0], half + pos[1], half + pos[2], 0, 0, 1, zero, one,
      -half + pos[0], half + pos[1], half + pos[2], 0, 0, 1, one, one,
      -half + pos[0], -half + pos[1], half + pos[2], 0, 0, 1, one, zero,
      half + pos[0], -half + pos[1], half + pos[2], 0, 0, 1, zero, zero
    ];
    case 2: return [ // left
      -half + pos[0], half + pos[1], -half + pos[2], -1, 0, 0, one, one,
      -half + pos[0], -half + pos[1], half + pos[2], -1, 0, 0, zero, zero, 
      -half + pos[0], half + pos[1], half + pos[2], -1, 0, 0, zero, one,
      -half + pos[0], half + pos[1], -half + pos[2], -1, 0, 0, one, one,
      -half + pos[0], -half + pos[1], -half + pos[2], -1, 0, 0, one, zero, 
      -half + pos[0], -half + pos[1], half + pos[2], -1, 0, 0, zero, zero
    ];
    case 3: return [ // right
      half + pos[0], half + pos[1], half + pos[2], 1, 0, 0, one, one, 
      half + pos[0], -half + pos[1], -half + pos[2], 1, 0, 0, zero, zero, 
      half + pos[0], half + pos[1], -half + pos[2], 1, 0, 0, zero, one,
      half + pos[0], half + pos[1], half + pos[2], 1, 0, 0, one, one,
      half + pos[0], -half + pos[1], half + pos[2], 1, 0, 0, one, zero, 
      half + pos[0], -half + pos[1], -half + pos[2], 1, 0, 0, zero, zero
    ];
    case 4: return [ // top
      -half + pos[0], half + pos[1], half + pos[2], 0, 1, 0, zero, zero,
      half + pos[0], half + pos[1], -half + pos[2], 0, 1, 0, one, one, 
      -half + pos[0], half + pos[1], -half + pos[2], 0, 1, 0, zero, one,
      half + pos[0], half + pos[1], half + pos[2], 0, 1, 0, one, zero,
      half + pos[0], half + pos[1], -half + pos[2], 0, 1, 0, one, one, 
      -half + pos[0], half + pos[1], half + pos[2], 0, 1, 0, zero, zero
    ];
    case 5: return [ // bottom
      half + pos[0], -half + pos[1], half + pos[2], 0, -1, 0, one, one,
      -half + pos[0], -half + pos[1], -half + pos[2], 0, -1, 0, zero, zero, 
      half + pos[0], -half + pos[1], -half + pos[2], 0, -1, 0, one, zero,
      -half + pos[0], -half + pos[1], half + pos[2], 0, -1, 0, zero, one,
      -half + pos[0], -half + pos[1], -half + pos[2], 0, -1, 0, zero, zero, 
      half + pos[0], -half + pos[1], half + pos[2], 0, -1, 0, one, one
    ];
    default: console.log("err: face needs to be an integer 0-5");
  }
}
const cubeVertexBuffer = new Float32Array([
  // Front
  -half, half, half, 0, 0, -1, 0, 1,
  half, half, half, 0, 0, -1, 1, 1,
  -half, -half, half, 0, 0, -1, 0, 0,
  half, -half, half, 0, 0, -1, 1, 0,
  // Back
  half, half, -half, 0, 0, 1, 0, 1,
  -half, half, -half, 0, 0, 1, 1, 1,
  half, -half, -half, 0, 0, 1, 0, 0,
  -half, -half, -half, 0, 0, 1, 1, 0,
  // Left
  -half, half, -half, -1, 0, 0, 0, 1,
  -half, half, half, -1, 0, 0, 1, 1,
  -half, -half, -half, -1, 0, 0, 0, 0,
  -half, -half, half, -1, 0, 0, 1, 0,
  // Right
  half, half, half, 1, 0, 0, 0, 1,
  half, half, -half, 1, 0, 0, 1, 1,
  half, -half, half, 1, 0, 0, 0, 0,
  half, -half, -half, 1, 0, 0, 1, 0,
  // Top
  -half, half, half, 0, 1, 0, 0, 1,
  half, half, half, 0, 1, 0, 1, 1,
  -half, half, -half, 0, 1, 0, 0, 0,
  half, half, -half, 0, 1, 0, 1, 0,
  // Bottom
  half, -half, half, 0, -1, 0, 1, 0,
  -half, -half, half, 0, -1, 0, 0, 0,
  half, -half, -half, 0, -1, 0, 1, 1,
  -half, -half, -half, 0, -1, 0, 0, 1,
]);
// standardTileGeo vertex buffer & index buffer
{
  const vertexBuffer = new THREE.InterleavedBuffer(cubeVertexBuffer, VERTEX_SIZE);

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
  standardBlockGeo.setAttribute("uv", new THREE.InterleavedBufferAttribute(vertexBuffer, 2, 6));
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
    this.position = pos;
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
    this.chunkSize = 16;
    this.chunkMeshes = new Array(Math.ceil(w / 16) * Math.ceil(h / 16) * Math.ceil(d / 16));

    // 3d array
    this.bData = new Array(w);
    for (let i = 0; i < this.bData.length; i++) {
      this.bData[i] = new Array(h);
      for (let j = 0; j < this.bData[i].length; j++) {
        this.bData[i][j] = new Array(d);
      }
    }
    this.seed = Math.round(Math.random() * 65536);
    noise.seed(this.seed);
  }

  generate() {
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
    });
  }

  // RETURNS A COPY OF THE BLOCK, NOT REFERENCE. WHY? I DONT KNOW!
  forEachBlock(func) {
    for (let x = 0; x < this.bData.length; x++) {
      for (let y = 0; y < this.bData[x].length; y++) {
        for (let z = 0; z < this.bData[x][y].length; z++) {
          func(this.bData[x][y][z], x, y, z);
        }
      }
    }
  }

  forEachChunk(func) {
    for (let x = 0; x < Math.ceil(this.width / 16); x++) {
      for (let y = 0; y < Math.ceil(this.height / 16); y++) {
        for (let z = 0; z < Math.ceil(this.depth / 16); z++) {
          func(x, y, z);
        }
      }
    }
  }

  // sends data of ENTIRE WORLD
  // ONLY USE when generating a new world.
  async sendWorldData() {
    // DATA STRUCTURE
    // World
      // seed (int)
      // Size [w, h, d] (arr)
      // chunk_X_Y_Z
        // block data [X, Y, Z, ID#, X, Y, Z, ID#] (multiple blocks stored into one array for efficient storage)
    // END
    
    database.ref(`world`).set(null); // erase all
    database.ref(`world/seed`).set(this.seed);
    let size = new Uint8Array(3);
    size[0] = this.width;
    size[1] = this.height;
    size[2] = this.depth;
    database.ref(`world/size`).set(size);

    // create chunk data 3d array
    let chunkArr = new Array(Math.ceil(this.width / 16));
    for (let x = 0; x < chunkArr.length; x++) {
      chunkArr[x] = new Array(Math.ceil(this.height / 16));
      for (let y = 0; y < chunkArr[x].length; y++) {
        chunkArr[x][y] = new Array(Math.ceil(this.depth / 16));
      }
    }

    // add block data to each chunk
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        for (let z = 0; z < this.depth; z++) {
          const block = this.bData[x][y][z];
          const chunkPos = [Math.floor(x / 16), Math.floor(y / 16), Math.floor(z / 16)];
          const blockPos = block.position.toArray();
          const dataStride = 4;
          if (chunkArr[chunkPos[0]][chunkPos[1]][chunkPos[2]] == null) chunkArr[chunkPos[0]][chunkPos[1]][chunkPos[2]] = new Uint8Array(16 * 16 * 16 * dataStride);
          // chunkdata is a typed 1d array, so we need to map 3d coordinates to fit in a 1d array. cannot use .push()
          let localpos = [x % 16, y % 16, z % 16]; // get position of block local to chunk origin
          let i = (localpos[0] + localpos[1] * 16 + localpos[2] * 16 * 16) * dataStride; // map local position to index in chunk data
          chunkArr[chunkPos[0]][chunkPos[1]][chunkPos[2]][i] = blockPos[0];
          chunkArr[chunkPos[0]][chunkPos[1]][chunkPos[2]][i + 1] = blockPos[1];
          chunkArr[chunkPos[0]][chunkPos[1]][chunkPos[2]][i + 2] = blockPos[2];
          chunkArr[chunkPos[0]][chunkPos[1]][chunkPos[2]][i + 3] = block.bId;
        }
      }
    }

    // send updates to server
    for (let x = 0; x < chunkArr.length; x++) {
      for (let y = 0; y < chunkArr[x].length; y++) {
        for (let z = 0; z < chunkArr[x][y].length; z++) {
          database.ref(`world/chunk_${x}_${y}_${z}`).set(chunkArr[x][y][z]);
        }
      }
    }
  }

  // gets world data from server
  async retrieveWorldData() {
    // for each chunk
    const dataStride = 4;
    await database.ref(`world`).get().then((snapshot) => {
      if (snapshot.exists()) {
        this.seed = snapshot.child("seed").val();
        let size = snapshot.child("size").val();
        this.width = size[0];
        this.height = size[1];
        this.depth = size[2];

        for (let x = 0; x < Math.ceil(this.width / 16); x++) {
          for (let y = 0; y < Math.ceil(this.height / 16); y++) {
            for (let z = 0; z < Math.ceil(this.depth / 16); z++) {
              const chunkData = snapshot.child(`chunk_${x}_${y}_${z}`).val();
              for (let i = 0; i < chunkData.length; i += dataStride) {
                let pos = [chunkData[i], chunkData[i + 1], chunkData[i + 2]];
                this.bData[pos[0]][pos[1]][pos[2]] = new Block(chunkData[i + 3], new THREE.Vector3(pos[0], pos[1], pos[2]));
              }
            }
          }
        }
      }
    });
  }

  addWorldToScene(s) {
    for (let i = 0; i < this.chunkMeshes.length; i++) {
      s.add(this.chunkMeshes[i]);
    }
  }

  createChunkMeshes() {
    // I need a vertex array of all verts that I need to render in a chunk
    const chunkMat = new THREE.MeshLambertMaterial({ map: blockSpriteSheet });
    const chunkArrSize = Math.ceil(this.width / 16) * Math.ceil(this.height / 16) * Math.ceil(this.depth / 16);
    const chunkVertexBuffers = new Array(chunkArrSize);
    const chunkIndexBuffers = new Array(chunkArrSize);
    const chunkGeos = new Array(chunkArrSize);
    for (let i = 0; i < chunkArrSize; i++) {
      chunkVertexBuffers[i] = [];
      chunkIndexBuffers[i] = [];
      chunkGeos[i] = new THREE.BufferGeometry();
    }

    // add block vertices to vertex buffer if necessary
    this.forEachBlock((block, x, y, z) => {
      // if any neighbors are oob or transparent, we need to keep rendering the face
      // don't check for the bottom neighbor because of camera constraints

      if (block.bId === 0) return; // don't render air blocks
      const chunkPos = [Math.floor(x / 16), Math.floor(y / 16), Math.floor(z / 16)];
      // convert chunk position to chunk 2d array index
      let i = chunkPos[0] + chunkPos[1] * Math.ceil(this.width / 16) + chunkPos[2] * Math.ceil(this.width / 16) * Math.ceil(this.height / 16);
      if (x + 1 === this.width) { // right face exposed to edge
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(3, [x, y, z], block.bId));
      } else if (!blockRef[this.bData[x + 1][y][z].bId].opaque) { // right block transparent
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(3, [x, y, z], block.bId));
      }
      if (x - 1 < 0) { // left face exposed to edge
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(2, [x, y, z], block.bId));
      } else if (!blockRef[this.bData[x - 1][y][z].bId].opaque) { // left block transparent
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(2, [x, y, z], block.bId));
      }
      if (y + 1 === this.height) { // top face exposed to edge
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(4, [x, y, z], block.bId));
      } else if (!blockRef[this.bData[x][y + 1][z].bId].opaque) { // top block transparent
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(4, [x, y, z], block.bId));
      }
      if (z + 1 === this.depth) { // back face exposed to edge
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(1, [x, y, z], block.bId));
      } else if (!blockRef[this.bData[x][y][z + 1].bId].opaque) { // back block transparent
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(1, [x, y, z], block.bId));
      }
      if (z - 1 < 0) { // front face exposed to edge
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(0, [x, y, z], block.bId));
      } else if (!blockRef[this.bData[x][y][z - 1].bId].opaque) { // front block transparent
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(0, [x, y, z], block.bId));
      }
    });

    // index the vertex buffers and push to chunkIndexBuffers array
    for (let chunkIndex = 0; chunkIndex < chunkArrSize; chunkIndex++) { // for each chunk
      let outVb = [];
      let outIb = [];

      // for each input vertex
      for (let i = 0; i < chunkVertexBuffers[chunkIndex].length; i += VERTEX_SIZE) {
        // extract the vertex for comparison
        let vertex = chunkVertexBuffers[chunkIndex].slice(i, i + VERTEX_SIZE);
        
        let index = undefined;
        // look in outVb for the same vertex
        for (let j = 0; j < outVb.length; j += VERTEX_SIZE) { // for each vert in output
          if (vertex[0] == outVb[j] &&
            vertex[1] == outVb[j + 1] &&
            vertex[2] == outVb[j + 2] &&
            vertex[3] == outVb[j + 3] &&
            vertex[4] == outVb[j + 4] &&
            vertex[5] == outVb[j + 5] &&
            vertex[6] == outVb[j + 6] &&
            vertex[7] == outVb[j + 7]) { // if there is a similar vertex in input buffer
            index = j / VERTEX_SIZE;
            break;
          }
        }

        if (index == undefined) { // if the vertex is not in the output already
          outVb = outVb.concat(vertex);
          outIb.push(outVb.length / VERTEX_SIZE - 1);

        } else { // else, push the existing vertex's index to the index buffer
          outIb.push(index);
        }
      }

      chunkVertexBuffers[chunkIndex] = outVb;
      chunkIndexBuffers[chunkIndex] = outIb;
    }

    for (let i = 0; i < chunkArrSize; i++) {
      // set geometry vertex and index buffers
      chunkGeos[i].setIndex(new THREE.BufferAttribute(Uint16Array.from(chunkIndexBuffers[i]), 1));
      const vBuff = new THREE.InterleavedBuffer(Float32Array.from(chunkVertexBuffers[i]), VERTEX_SIZE);
      chunkGeos[i].setAttribute("position", new THREE.InterleavedBufferAttribute(vBuff, 3, 0));
      chunkGeos[i].setAttribute("normal", new THREE.InterleavedBufferAttribute(vBuff, 3, 3));
      chunkGeos[i].setAttribute("uv", new THREE.InterleavedBufferAttribute(vBuff, 2, 6));
    }

    this.forEachChunk((x, y, z) => {
      // convert index to 2d array
      let i = x + y * Math.ceil(this.width / 16) + z * Math.ceil(this.width / 16) * Math.ceil(this.height / 16);
      this.chunkMeshes[i] = new THREE.Mesh(chunkGeos[i], chunkMat);
    });

    console.log(chunkIndexBuffers[0].slice(0, 6));
    for (let i = 0; i < 6; i++) {
      console.log(chunkVertexBuffers[0].slice(chunkIndexBuffers[0][i] * VERTEX_SIZE, chunkIndexBuffers[0][i] * VERTEX_SIZE + 3));
    }
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

// needed globals
let scene = new THREE.Scene();
let clientCharacter = new Character();
let otherCharacters = new Map();
const world = new World(32, 64, 32);
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
  const contentWrapper = document.querySelector(".content");

  //const camera = new THREE.OrthographicCamera(-20, 20, 15, -15, 0.1, 100);
  const camera = new THREE.PerspectiveCamera(75, 8 / 6, 0.1, 100);
  let cameraOffset = new THREE.Vector3(10, 5, 0);
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
