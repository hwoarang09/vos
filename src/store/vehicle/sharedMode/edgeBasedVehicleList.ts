// Edge-based vehicle list management using SharedArrayBuffer
// Each edge has its own array of vehicle indices

const MAX_VEHICLES_PER_EDGE = 500;
const EDGE_LIST_SIZE = MAX_VEHICLES_PER_EDGE + 1; // count + vehicles

class VehicleSharedByEdge {
  private buffers: SharedArrayBuffer[];
  private dataArrays: Int32Array[];
  private maxEdges: number;

  constructor(maxEdges: number) {
    this.maxEdges = maxEdges;
    this.buffers = [];
    this.dataArrays = [];

    // Create separate SharedArrayBuffer for each edge
    for (let i = 0; i < maxEdges; i++) {
      const buffer = new SharedArrayBuffer(EDGE_LIST_SIZE * 4); // Int32 = 4 bytes
      const data = new Int32Array(buffer);
      data[0] = 0; // count = 0
      data.fill(-1, 1); // vehicles = -1 (empty)

      this.buffers.push(buffer);
      this.dataArrays.push(data);
    }
  }

  // Add vehicle to edge list
  addVehicle(edgeIndex: number, vehicleIndex: number): void {
    if (edgeIndex < 0 || edgeIndex >= this.maxEdges) {
      console.error(`Invalid edge index: ${edgeIndex}`);
      return;
    }

    const data = this.dataArrays[edgeIndex];
    const count = data[0];

    if (count >= MAX_VEHICLES_PER_EDGE) {
      console.error(
        `Edge ${edgeIndex} is full (max ${MAX_VEHICLES_PER_EDGE} vehicles)`
      );
      return;
    }

    // Add vehicle at the end
    data[1 + count] = vehicleIndex;
    data[0] = count + 1;
  }

  // Remove vehicle from edge list
  removeVehicle(edgeIndex: number, vehicleIndex: number): void {
    if (edgeIndex < 0 || edgeIndex >= this.maxEdges) {
      console.error(`Invalid edge index: ${edgeIndex}`);
      return;
    }

    const data = this.dataArrays[edgeIndex];
    const count = data[0];

    // Find and remove vehicle
    for (let i = 0; i < count; i++) {
      if (data[1 + i] === vehicleIndex) {
        // Shift remaining vehicles forward
        for (let j = i; j < count - 1; j++) {
          data[1 + j] = data[1 + j + 1];
        }
        data[1 + count - 1] = -1; // Clear last slot
        data[0] = count - 1; // Decrease count
        return;
      }
    }

    console.warn(
      `Vehicle ${vehicleIndex} not found in edge ${edgeIndex}`
    );
  }

  // Get all vehicles in an edge
  getVehicles(edgeIndex: number): number[] {
    if (edgeIndex < 0 || edgeIndex >= this.maxEdges) {
      console.error(`Invalid edge index: ${edgeIndex}`);
      return [];
    }

    const data = this.dataArrays[edgeIndex];
    const count = data[0];
    const vehicles: number[] = [];

    for (let i = 0; i < count; i++) {
      vehicles.push(data[1 + i]);
    }

    return vehicles;
  }

  // Get vehicle count in an edge
  getCount(edgeIndex: number): number {
    if (edgeIndex < 0 || edgeIndex >= this.maxEdges) {
      console.error(`Invalid edge index: ${edgeIndex}`);
      return 0;
    }

    return this.dataArrays[edgeIndex][0];
  }

  // Get SharedArrayBuffer for a specific edge (for Worker)
  getBuffer(edgeIndex: number): SharedArrayBuffer | null {
    if (edgeIndex < 0 || edgeIndex >= this.maxEdges) {
      console.error(`Invalid edge index: ${edgeIndex}`);
      return null;
    }

    return this.buffers[edgeIndex];
  }

  // Get all buffers (for Worker initialization)
  getAllBuffers(): SharedArrayBuffer[] {
    return this.buffers;
  }

  // Get Int32Array for a specific edge
  getData(edgeIndex: number): Int32Array | null {
    if (edgeIndex < 0 || edgeIndex >= this.maxEdges) {
      console.error(`Invalid edge index: ${edgeIndex}`);
      return null;
    }

    return this.dataArrays[edgeIndex];
  }

  // Clear all vehicles from an edge
  clearEdge(edgeIndex: number): void {
    if (edgeIndex < 0 || edgeIndex >= this.maxEdges) {
      console.error(`Invalid edge index: ${edgeIndex}`);
      return;
    }

    const data = this.dataArrays[edgeIndex];
    data[0] = 0; // count = 0
    data.fill(-1, 1); // clear all vehicles
  }

  // Clear all edges
  clearAll(): void {
    for (let i = 0; i < this.maxEdges; i++) {
      this.clearEdge(i);
    }
  }
}

// Singleton instance (1000 edges, 500 vehicles per edge max)
export const vehicleSharedByEdge = new VehicleSharedByEdge(1000);

export default VehicleSharedByEdge;

