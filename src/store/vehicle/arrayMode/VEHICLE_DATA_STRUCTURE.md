# Vehicle Data Structure Layout

This document describes the memory layout for `vehicleDataArray.ts`.
We use **Struct-of-Arrays (SoA)** concepts, packed into specific TypedArrays.

## 1. Physics & Movement Buffer
**File**: `vehicleDataArray.ts`
**Type**: `Float32Array`
**Stride**: `VEHICLE_DATA_SIZE` (14 floats per vehicle)

| Offset | Name | Description | Unit |
| :--- | :--- | :--- | :--- |
| `0` | `X` | World Position X | Meters |
| `1` | `Y` | World Position Y | Meters |
| `2` | `Z` | World Position Z | Meters |
| `3` | `ROTATION` | Z-axis Rotation | Radians |
| `4` | `VELOCITY` | Current Speed | m/s |
| `5` | `ACCELERATION` | Acceleration (Speed Up) | m/s² |
| `6` | `DECELERATION` | Deceleration (Brake) | m/s² |
| `7` | `EDGE_RATIO` | Progress on Edge (0.0~1.0) | Ratio |
| `8` | `STATUS` | Moving State (Legacy) | 0=Stop, 1=Move |
| `9` | `CURRENT_EDGE` | Edge Index | Integer (as float) |
| `10` | `SENSOR_PRESET` | Sensor shape index | Integer (as float) |
| `11` | `TRAFFIC_STATE` | Traffic Regulation State | 0=Free, 1=Wait, 2=Acquired |
| `12` | `STOP_REASON` | Stop Reason Bitmask | Bitmask (Integer) |
| `13` | `JOB_STATE` | High-level Mission State | Enum (Integer) |

> **Note**: Stride increased to 14 to accommodate Logic States.

---

## 2. Spatial Grid Structure
**File**: `edgeVehicleQueue.ts`
**Structure**: Array of `Int32Array`s (One Int32Array per Map Edge).

**Layout for Edge[i]:**
*   `[0]`: Count (Number of vehicles on this edge)
*   `[1..N]`: Vehicle Indices (Sorted by `EDGE_RATIO`, Front -> Back)

---

## 4. Sensor Geometry Buffer
**File**: `sensorPointArray.ts`
**Type**: `Float32Array`
**Stride**: 12 (6 points * 2 coords)

| Offset | Point | Description |
| :--- | :--- | :--- |
| `0, 1` | `FL` | Front Left (x, y) |
| `2, 3` | `FR` | Front Right (x, y) |
| `4, 5` | `BL` | Back Left (x, y) |
| `6, 7` | `BR` | Back Right (x, y) |
| `8, 9` | `SL` | Sensor Tip Left (x, y) |
| `10, 11` | `SR` | Sensor Tip Right (x, y) |
