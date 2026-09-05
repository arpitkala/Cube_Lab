/**
 * Cubie.js — Individual Cubie Data + 3D Mesh
 * 
 * Supports standard cubes (2×2..6×6) and Mirror Blocks (shape-shifting dimensional offsets).
 */

import * as THREE from 'three';

const CUBIE_GAP = 0.05;
const CUBIE_SIZE = 1 - CUBIE_GAP;
const BEVEL_RADIUS = 0.06;
const BEVEL_SEGMENTS = 3;

let _sharedGeometryMap = new Map();

function getCubieGeometry(width = CUBIE_SIZE, height = CUBIE_SIZE, depth = CUBIE_SIZE) {
  const key = `${width.toFixed(2)}_${height.toFixed(2)}_${depth.toFixed(2)}`;
  if (!_sharedGeometryMap.has(key)) {
    _sharedGeometryMap.set(key, createRoundedBoxGeometry(width, height, depth, BEVEL_RADIUS, BEVEL_SEGMENTS));
  }
  return _sharedGeometryMap.get(key);
}

function createRoundedBoxGeometry(width, height, depth, radius, segments) {
  const geo = new THREE.BoxGeometry(width, height, depth, segments + 1, segments + 1, segments + 1);
  const posAttr = geo.getAttribute('position');
  const vertex = new THREE.Vector3();
  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;
  const r = Math.min(radius, width / 4, height / 4, depth / 4);

  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    const innerX = Math.max(-halfW + r, Math.min(halfW - r, vertex.x));
    const innerY = Math.max(-halfH + r, Math.min(halfH - r, vertex.y));
    const innerZ = Math.max(-halfD + r, Math.min(halfD - r, vertex.z));

    const dx = vertex.x - innerX;
    const dy = vertex.y - innerY;
    const dz = vertex.z - innerZ;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist > 0.001) {
      const scale = r / dist;
      vertex.x = innerX + dx * scale;
      vertex.y = innerY + dy * scale;
      vertex.z = innerZ + dz * scale;
    }
    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export class Cubie {
  /**
   * @param {object} cubieData — { id, position, faceColors }
   * @param {import('../rendering/Materials.js').Materials} materials
   * @param {object} [options={}] — { isMirror: boolean }
   */
  constructor(cubieData, materials, options = {}) {
    this.id = cubieData.id;
    this.logicalPosition = { ...cubieData.position };
    this.faceColors = cubieData.faceColors;
    this.isMirror = !!options.isMirror;

    // Determine dimensions & position offset
    let w = CUBIE_SIZE, h = CUBIE_SIZE, d = CUBIE_SIZE;

    if (this.isMirror) {
      // Dimensional offsets for Mirror Blocks Cube shape-shifting
      const dimX = { '-1': 0.65, '0': 1.0, '1': 1.35 };
      const dimY = { '-1': 0.55, '0': 1.0, '1': 1.45 };
      const dimZ = { '-1': 0.75, '0': 1.0, '1': 1.25 };

      w = (dimX[cubieData.position.x] || 1.0) - CUBIE_GAP;
      h = (dimY[cubieData.position.y] || 1.0) - CUBIE_GAP;
      d = (dimZ[cubieData.position.z] || 1.0) - CUBIE_GAP;
    }

    const geometry = getCubieGeometry(w, h, d);
    const cubieMatArray = materials.getCubieMaterials(cubieData.faceColors);
    this.mesh = new THREE.Mesh(geometry, cubieMatArray);

    this.syncPositionFromState();

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.userData.cubie = this;
    this.mesh.userData.cubieId = this.id;
  }

  syncPositionFromState() {
    this.mesh.position.set(
      this.logicalPosition.x,
      this.logicalPosition.y,
      this.logicalPosition.z
    );
  }

  syncMaterialsFromState(materials) {
    const newMats = materials.getCubieMaterials(this.faceColors);
    this.mesh.material = newMats;
  }

  updateMaterials(materials) {
    this.syncMaterialsFromState(materials);
  }

  dispose() {
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
  }
}
