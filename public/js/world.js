import * as THREE from "https://unpkg.com/three/build/three.module.js";

const database = firebase.database();
const auth = firebase.auth();
if (location.hostname === "localhost") { // point to emulator if using it
  database.useEmulator("localhost", 9000);
  auth.useEmulator("http://localhost:9099");
}

// the blockref has an array of all of the possible blocks
const BLOCK_AIR = 0;
const BLOCK_BANDEDIRON = 1;
const BLOCK_STONE = 2;
const BLOCK_DIRT = 3;
const BLOCK_GRASS = 4;
export { 
  BLOCK_AIR,
  BLOCK_BANDEDIRON,
  BLOCK_STONE,
  BLOCK_DIRT,
  BLOCK_GRASS 
}
export const blockRef = [
  {//0
    name: "air",
    opaque: false,
  },
  {//1
    name: "banded iron",
    opaque: true
  },
  {//2
    name: "stone",
    opaque: true
  },
  {//3
    name: "dirt",
    opaque: true
  },
  {//4
    name: "grass",
    opaque: true
  },
];

// sprite sheet
const blockSpriteSheet = new THREE.TextureLoader().load("../images/block-textures.png");
blockSpriteSheet.wrapS = THREE.ClampToEdgeWrapping;
blockSpriteSheet.wrapT = THREE.ClampToEdgeWrapping;
blockSpriteSheet.magFilter = THREE.NearestFilter;
blockSpriteSheet.minFilter = THREE.NearestMipmapNearestFilter;


// create geo for tiles
const oneHalf = 0.5;
const VERTEX_SIZE = 8;
function getWorldCubeFace(face, pos, bId) {
  let x = bId / blockRef.length;
  let y = face / 5 + 0.2;
  switch (face) {
    case 0: return [ // front
      oneHalf + pos[0], oneHalf + pos[1], -oneHalf + pos[2], 0, 0, -1, x + 0.2, y + 0.2,
      -oneHalf + pos[0], -oneHalf + pos[1], -oneHalf + pos[2], 0, 0, -1, x, y,
      -oneHalf + pos[0], oneHalf + pos[1], -oneHalf + pos[2], 0, 0, -1, x, y + 0.2,
      oneHalf + pos[0], oneHalf + pos[1], -oneHalf + pos[2], 0, 0, -1, x + 0.2, y + 0.2,
      oneHalf + pos[0], -oneHalf + pos[1], -oneHalf + pos[2], 0, 0, -1, x + 0.2, y,
      -oneHalf + pos[0], -oneHalf + pos[1], -oneHalf + pos[2], 0, 0, -1, x, y
    ];
    case 1: return [ // back
      -oneHalf + pos[0], oneHalf + pos[1], oneHalf + pos[2], 0, 0, 1, x + 0.2, y + 0.2,
      oneHalf + pos[0], -oneHalf + pos[1], oneHalf + pos[2], 0, 0, 1, x, y,
      oneHalf + pos[0], oneHalf + pos[1], oneHalf + pos[2], 0, 0, 1, x, y + 0.2,
      -oneHalf + pos[0], oneHalf + pos[1], oneHalf + pos[2], 0, 0, 1, x + 0.2, y + 0.2,
      -oneHalf + pos[0], -oneHalf + pos[1], oneHalf + pos[2], 0, 0, 1, x + 0.2, y,
      oneHalf + pos[0], -oneHalf + pos[1], oneHalf + pos[2], 0, 0, 1, x, y
    ];
    case 2: return [ // left
      -oneHalf + pos[0], oneHalf + pos[1], -oneHalf + pos[2], -1, 0, 0, x + 0.2, y + 0.2,
      -oneHalf + pos[0], -oneHalf + pos[1], oneHalf + pos[2], -1, 0, 0, x, y,
      -oneHalf + pos[0], oneHalf + pos[1], oneHalf + pos[2], -1, 0, 0, x, y + 0.2,
      -oneHalf + pos[0], oneHalf + pos[1], -oneHalf + pos[2], -1, 0, 0, x + 0.2, y + 0.2,
      -oneHalf + pos[0], -oneHalf + pos[1], -oneHalf + pos[2], -1, 0, 0, x + 0.2, y,
      -oneHalf + pos[0], -oneHalf + pos[1], oneHalf + pos[2], -1, 0, 0, x, y
    ];
    case 3: return [ // right
      oneHalf + pos[0], oneHalf + pos[1], oneHalf + pos[2], 1, 0, 0, x + 0.2, y + 0.2,
      oneHalf + pos[0], -oneHalf + pos[1], -oneHalf + pos[2], 1, 0, 0, x, y,
      oneHalf + pos[0], oneHalf + pos[1], -oneHalf + pos[2], 1, 0, 0, x, y + 0.2,
      oneHalf + pos[0], oneHalf + pos[1], oneHalf + pos[2], 1, 0, 0, x + 0.2, y + 0.2,
      oneHalf + pos[0], -oneHalf + pos[1], oneHalf + pos[2], 1, 0, 0, x + 0.2, y,
      oneHalf + pos[0], -oneHalf + pos[1], -oneHalf + pos[2], 1, 0, 0, x, y
    ];
    case 4: return [ // top
      -oneHalf + pos[0], oneHalf + pos[1], oneHalf + pos[2], 0, 1, 0, x, y,
      oneHalf + pos[0], oneHalf + pos[1], -oneHalf + pos[2], 0, 1, 0, x + 0.2, y + 0.2,
      -oneHalf + pos[0], oneHalf + pos[1], -oneHalf + pos[2], 0, 1, 0, x, y + 0.2,
      oneHalf + pos[0], oneHalf + pos[1], oneHalf + pos[2], 0, 1, 0, x + 0.2, y,
      oneHalf + pos[0], oneHalf + pos[1], -oneHalf + pos[2], 0, 1, 0, x + 0.2, y + 0.2,
      -oneHalf + pos[0], oneHalf + pos[1], oneHalf + pos[2], 0, 1, 0, x, y
    ];
    case 5: return [ // bottom
      oneHalf + pos[0], -oneHalf + pos[1], oneHalf + pos[2], 0, -1, 0, x + 0.2, y + 0.2,
      -oneHalf + pos[0], -oneHalf + pos[1], -oneHalf + pos[2], 0, -1, 0, x, y,
      oneHalf + pos[0], -oneHalf + pos[1], -oneHalf + pos[2], 0, -1, 0, x + 0.2, y,
      -oneHalf + pos[0], -oneHalf + pos[1], oneHalf + pos[2], 0, -1, 0, x, y + 0.2,
      -oneHalf + pos[0], -oneHalf + pos[1], -oneHalf + pos[2], 0, -1, 0, x, y,
      oneHalf + pos[0], -oneHalf + pos[1], oneHalf + pos[2], 0, -1, 0, x + 0.2, y + 0.2
    ];
    default: console.log("err: face needs to be an integer 0-5");
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
    this.chunkSize = 8;
    this.chunkNumX = Math.ceil(w / this.chunkSize);
    this.chunkNumY = Math.ceil(h / this.chunkSize);
    this.chunkNumZ = Math.ceil(d / this.chunkSize);
    this.chunkMeshes = new Array(this.chunkNumX * this.chunkNumY * this.chunkNumZ);

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

      if (y === n) this.bData[x][y][z] = BLOCK_GRASS;
      else if (y < n) this.bData[x][y][z] = BLOCK_DIRT;
      else {
        this.bData[x][y][z] = BLOCK_AIR;
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
    for (let x = 0; x < this.chunkNumX; x++) {
      for (let y = 0; y < this.chunkNumY; y++) {
        for (let z = 0; z < this.chunkNumZ; z++) {
          func(x, y, z);
        }
      }
    }
  }

  // on chunk data changed on server
  setupChunkUpdateListeners() {
    this.forEachChunk((x, y, z) => {
      database.ref(`world/chunk_${x}_${y}_${z}`).on("value", (snapshot) => {
        if (snapshot.exists()) {
          // update block data with new chunk information
          const chunkData = snapshot.val();
          // for each block inside of local bData in the chunk range
          for (let bx = x * this.chunkSize; bx < x * this.chunkSize + this.chunkSize; bx++) {
            for (let by = y * this.chunkSize; by < y * this.chunkSize + this.chunkSize; by++) {
              for (let bz = z * this.chunkSize; bz < z * this.chunkSize + this.chunkSize; bz++) {
                // get the block position local to chunk origin
                const localBlockPos = [bx % this.chunkSize, by % this.chunkSize, bz % this.chunkSize];
                // set local bData to new bData in chunk
                this.bData[bx][by][bz] = chunkData[
                  localBlockPos[0] + 
                  localBlockPos[1] * this.chunkSize + 
                  localBlockPos[2] * this.chunkSize * this.chunkSize
                ];
              }
            }
          }

          // after updating all of the blocks in the chunk, refresh the chunk geometry
          this.refreshChunkGeometry([x, y, z]);
        }
      });
    });
  }

  // sends data of ENTIRE WORLD
  // ONLY USE when generating a new world.
  async sendWorldData() {
    // DATA STRUCTURE
    // World
    // seed (int)
    // Size [w, h, d] (arr)
    // chunk_X_Y_Z
    //  block data [ID#, ID#] 
    //  (multiple blocks stored into one array for efficient storage)
    //  (1d array in database converted to 3d array in data processing)
    // END

    database.ref(`world`).set(null); // erase all
    database.ref(`world/seed`).set(this.seed);
    let size = new Uint8Array(3);
    size[0] = this.width;
    size[1] = this.height;
    size[2] = this.depth;
    database.ref(`world/size`).set(size);

    // create chunk data 3d array
    let chunkArr = new Array(this.chunkNumX);
    for (let x = 0; x < chunkArr.length; x++) {
      chunkArr[x] = new Array(this.chunkNumY);
      for (let y = 0; y < chunkArr[x].length; y++) {
        chunkArr[x][y] = new Array(this.chunkNumZ);
      }
    }

    // add block data to each chunk
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        for (let z = 0; z < this.depth; z++) {
          const block = this.bData[x][y][z];
          const chunkPos = this.getChunkPosFromWorldPos([x,y,z]);
          // if data at chunk pos doesn't exist yet, create data
          if (chunkArr[chunkPos[0]][chunkPos[1]][chunkPos[2]] == null) chunkArr[chunkPos[0]][chunkPos[1]][chunkPos[2]] = new Uint8Array(this.chunkSize * this.chunkSize * this.chunkSize);
          // chunkdata is a typed 1d array, so we need to map 3d coordinates to fit in a 1d array. cannot use .push()
          let localpos = [x % this.chunkSize, y % this.chunkSize, z % this.chunkSize]; // get position of block local to chunk origin
          let i = localpos[0] + localpos[1] * this.chunkSize + localpos[2] * this.chunkSize * this.chunkSize; // map local position to index in chunk data
          chunkArr[chunkPos[0]][chunkPos[1]][chunkPos[2]][i] = block;
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
    await database.ref(`world`).get().then((snapshot) => {
      if (snapshot.exists()) {
        this.seed = snapshot.child("seed").val();
        let size = snapshot.child("size").val();
        this.width = size[0];
        this.height = size[1];
        this.depth = size[2];

        this.forEachChunk((x, y, z) => {
          const chunkData = snapshot.child(`chunk_${x}_${y}_${z}`).val();
          for (let i = 0; i < chunkData.length; i++) {
            // convert 1d data array to 3d array coords
            const blockPos = new Array(3);
            let tempIndex = i + 0;
            blockPos[2] = Math.floor(tempIndex / (this.chunkSize * this.chunkSize) + z * this.chunkSize);
            tempIndex -= (blockPos[2] - z * this.chunkSize) * this.chunkSize * this.chunkSize;
            blockPos[1] = Math.floor(tempIndex / this.chunkSize) + y * this.chunkSize;
            tempIndex -= (blockPos[1] - y * this.chunkSize) * this.chunkSize;
            blockPos[0] = tempIndex + x * this.chunkSize;
            this.bData[blockPos[0]][blockPos[1]][blockPos[2]] = chunkData[i];
          }
        });
      }
    });
  }

  addWorldToScene(s) {
    for (let i = 0; i < this.chunkMeshes.length; i++) {
      s.add(this.chunkMeshes[i]);
    }

    this.setupChunkUpdateListeners();
  }

  createChunkMeshes() {
    // I need a vertex array of all verts that I need to render in a chunk
    const chunkMat = new THREE.MeshLambertMaterial({map: blockSpriteSheet});
    const chunkArrSize = this.chunkNumX * this.chunkNumY * this.chunkNumZ;
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

      if (block === BLOCK_AIR) return; // don't render air blocks
      
      // convert chunk position to chunk 2d array index
      let i = this.getChunkMeshIndexFromWorldPos([x, y, z]);
      if (x + 1 === this.width) { // right face exposed to edge
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(3, [x, y, z], block));
      } else if (!blockRef[this.bData[x + 1][y][z]].opaque) { // right block transparent
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(3, [x, y, z], block));
      }
      if (x - 1 < 0) { // left face exposed to edge
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(2, [x, y, z], block));
      } else if (!blockRef[this.bData[x - 1][y][z]].opaque) { // left block transparent
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(2, [x, y, z], block));
      }
      if (y + 1 === this.height) { // top face exposed to edge
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(4, [x, y, z], block));
      } else if (!blockRef[this.bData[x][y + 1][z]].opaque) { // top block transparent
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(4, [x, y, z], block));
      }
      if (z + 1 === this.depth) { // back face exposed to edge
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(1, [x, y, z], block));
      } else if (!blockRef[this.bData[x][y][z + 1]].opaque) { // back block transparent
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(1, [x, y, z], block));
      }
      if (z - 1 < 0) { // front face exposed to edge
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(0, [x, y, z], block));
      } else if (!blockRef[this.bData[x][y][z - 1]].opaque) { // front block transparent
        chunkVertexBuffers[i] = chunkVertexBuffers[i].concat(getWorldCubeFace(0, [x, y, z], block));
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
      let i = this.getChunkMeshIndexFromChunkPos([x, y, z]);
      this.chunkMeshes[i] = new THREE.Mesh(chunkGeos[i], chunkMat);
    });
  }

  // updates chunk mesh from block data
  refreshChunkGeometry(chunkPos) {
    // check that the chunk position is valid
    try {
      this.bData[this.chunkSize * chunkPos[0]][this.chunkSize * chunkPos[1]][this.chunkSize * chunkPos[2]] == null
    } catch { return; }
    // I need a vertex array of all verts that I need to render in a chunk
    let chunkVertexBuffer = [];
    let chunkIndexBuffer = [];
    const chunkGeo = new THREE.BufferGeometry();

    // add block vertices to vertex buffer if necessary
    for (let x = this.chunkSize * chunkPos[0]; x < this.chunkSize * chunkPos[0] + this.chunkSize; x++) {
      for (let y = this.chunkSize * chunkPos[1]; y < this.chunkSize * chunkPos[1] + this.chunkSize; y++) {
        for (let z = this.chunkSize * chunkPos[2]; z < this.chunkSize * chunkPos[2] + this.chunkSize; z++) {
          // if any neighbors are oob or transparent, we need to keep rendering the face
          // don't check for the bottom neighbor because of camera constraints

          const block = this.bData[x][y][z];
          if (block === BLOCK_AIR) continue; // don't render air blocks

          if (x + 1 === this.width) { // right face exposed to edge
            chunkVertexBuffer = chunkVertexBuffer.concat(getWorldCubeFace(3, [x, y, z], block));
          } else if (!blockRef[this.bData[x + 1][y][z]].opaque) { // right block transparent
            chunkVertexBuffer = chunkVertexBuffer.concat(getWorldCubeFace(3, [x, y, z], block));
          }
          if (x - 1 < 0) { // left face exposed to edge
            chunkVertexBuffer = chunkVertexBuffer.concat(getWorldCubeFace(2, [x, y, z], block));
          } else if (!blockRef[this.bData[x - 1][y][z]].opaque) { // left block transparent
            chunkVertexBuffer = chunkVertexBuffer.concat(getWorldCubeFace(2, [x, y, z], block));
          }
          if (y + 1 === this.height) { // top face exposed to edge
            chunkVertexBuffer = chunkVertexBuffer.concat(getWorldCubeFace(4, [x, y, z], block));
          } else if (!blockRef[this.bData[x][y + 1][z]].opaque) { // top block transparent
            chunkVertexBuffer = chunkVertexBuffer.concat(getWorldCubeFace(4, [x, y, z], block));
          }
          if (z + 1 === this.depth) { // back face exposed to edge
            chunkVertexBuffer = chunkVertexBuffer.concat(getWorldCubeFace(1, [x, y, z], block));
          } else if (!blockRef[this.bData[x][y][z + 1]].opaque) { // back block transparent
            chunkVertexBuffer = chunkVertexBuffer.concat(getWorldCubeFace(1, [x, y, z], block));
          }
          if (z - 1 < 0) { // front face exposed to edge
            chunkVertexBuffer = chunkVertexBuffer.concat(getWorldCubeFace(0, [x, y, z], block));
          } else if (!blockRef[this.bData[x][y][z - 1]].opaque) { // front block transparent
            chunkVertexBuffer = chunkVertexBuffer.concat(getWorldCubeFace(0, [x, y, z], block));
          }
        }
      }
    }

    // index the vertex buffer and push to chunkIndexBuffer array
    let outVb = [];
    let outIb = [];

    // for each input vertex
    for (let i = 0; i < chunkVertexBuffer.length; i += VERTEX_SIZE) {
      // extract the vertex for comparison
      let vertex = chunkVertexBuffer.slice(i, i + VERTEX_SIZE);

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

    chunkVertexBuffer = outVb;
    chunkIndexBuffer = outIb;

      // set geometry vertex and index buffers
    chunkGeo.setIndex(new THREE.BufferAttribute(Uint16Array.from(chunkIndexBuffer), 1));
    const vBuff = new THREE.InterleavedBuffer(Float32Array.from(chunkVertexBuffer), VERTEX_SIZE);
    chunkGeo.setAttribute("position", new THREE.InterleavedBufferAttribute(vBuff, 3, 0));
    chunkGeo.setAttribute("normal", new THREE.InterleavedBufferAttribute(vBuff, 3, 3));
    chunkGeo.setAttribute("uv", new THREE.InterleavedBufferAttribute(vBuff, 2, 6));

    // convert index to 2d array
    const i = this.getChunkMeshIndexFromChunkPos(chunkPos);
    this.chunkMeshes[i].geometry = chunkGeo;
  }

  // sends a single block's data to the server
  async sendSingleBlockData(chunkPos, blockPos) {
    // send update to server
    const chunkDataRef = database.ref(`world/chunk_${chunkPos[0]}_${chunkPos[1]}_${chunkPos[2]}`);
    await chunkDataRef.get().then((snapshot) => {
      if (snapshot.exists()) {
        let chunkData = snapshot.val();
        const localBlockPos = [
          blockPos[0] % this.chunkSize, 
          blockPos[1] % this.chunkSize, 
          blockPos[2] % this.chunkSize
        ];
        // convert local block position to 1d array index
        const index = localBlockPos[0] + localBlockPos[1] * this.chunkSize + localBlockPos[2] * this.chunkSize * this.chunkSize;
        chunkData[index] = this.bData[blockPos[0]][blockPos[1]][blockPos[2]];
        chunkDataRef.set(chunkData);
      }
    });
  }

  getChunkMeshIndexFromChunkPos(pos) {
    return pos[0] + pos[1] * this.chunkNumX + pos[2] * this.chunkNumX * this.chunkNumY;
  }

  getChunkMeshIndexFromWorldPos(pos) {
    return Math.floor(pos[0] / this.chunkSize) + Math.floor(pos[1] / this.chunkSize) * this.chunkNumX + Math.floor(pos[2] / this.chunkSize) * this.chunkNumX * this.chunkNumY;
  }

  getChunkPosFromWorldPos(pos) {
    return [Math.floor(pos[0] / this.chunkSize), Math.floor(pos[1] / this.chunkSize), Math.floor(pos[2] / this.chunkSize)];
  }
}

export { World };