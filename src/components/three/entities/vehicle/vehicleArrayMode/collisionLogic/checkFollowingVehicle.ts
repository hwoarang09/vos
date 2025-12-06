import { edgeVehicleQueue } from "@/store/vehicle/arrayMode/edgeVehicleQueue";
import { VEHICLE_DATA_SIZE, MovementData, MovingStatus, SensorData, HitZone } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { Edge } from "@/types/edge";
import { calculateSameEdgeDistances } from "../helpers/distanceCalculator";
import { checkSensorCollision, roughDistanceCheck } from "../helpers/sensorCollision";
import { SENSOR_PRESETS, SensorZoneKey } from "@/store/vehicle/arrayMode/sensorPresets";
import { getBodyLength } from "@/config/vehicleConfig";
import { getApproachMinSpeed, getBrakeMinSpeed } from "@/config/movementConfig";

/**
 * Check following vehicles collision with front vehicle on same edge
 */
export function checkFollowingVehicles(params: {
  edgeIdx: number;
  edge: Edge;
  data: Float32Array;
  sameEdgeSafeDistance: number;
  resumeDistance: number;
  shouldLogDetails: boolean;
}) {
  const {
    edgeIdx,
    edge,
    data,
    sameEdgeSafeDistance,
    resumeDistance,
    shouldLogDetails,
  } = params;

  let collisions = 0;
  let resumes = 0;

  const rawData = edgeVehicleQueue.getData(edgeIdx);
  // Checked count > 1 in caller, so safe here
  const count = rawData![0];

  // Determine edge type
  const isLinearEdge = edge.vos_rail_type === "LINEAR";

  // Cache config values
  const approachMinSpeed = getApproachMinSpeed();
  const brakeMinSpeed = getBrakeMinSpeed();

  // Loop through following vehicles
  // i=0 is Leader, i=1 follows i=0, i=2 follows i=1 ...
  for (let i = 1; i < count; i++) {
    const frontVehId = rawData![1 + (i - 1)];
    const backVehId = rawData![1 + i];

    // Skip if same vehicle (shouldn't happen, but safety check)
    if (frontVehId === backVehId) {
      if (shouldLogDetails) {
        console.log(`[Skip] VEH${frontVehId} appears twice in edge ${edge.edge_name} list, skipping self-check`);
      }
      continue;
    }

    const ptrFront = frontVehId * VEHICLE_DATA_SIZE;
    const ptrBack = backVehId * VEHICLE_DATA_SIZE;

    // Reset defaults for back vehicle
    data[ptrBack + SensorData.HIT_ZONE] = HitZone.NONE;
    data[ptrBack + MovementData.DECELERATION] = 0;

    const xFront = data[ptrFront + MovementData.X];
    const xBack = data[ptrBack + MovementData.X];
    const velocity = data[ptrBack + MovementData.VELOCITY];

    // --- LINEAR OPTIMIZATION (1D Zone Check) ---
    if (isLinearEdge) {
      const distance = Math.abs(xFront - xBack);
      
      const presetIdx = data[ptrBack + SensorData.PRESET_IDX] | 0;
      const preset = SENSOR_PRESETS[presetIdx] ?? SENSOR_PRESETS[0];

      // Use actual zone lengths for linear check
      // CORRECTION: distance is center-to-center. 
      // We need to trigger when (distance - vehicleLength) <= sensorLength
      // So checks should be: distance <= sensorLength + vehicleLength
      const vehicleLength = getBodyLength();
      
      const stopDist = preset.zones.stop.leftLength + vehicleLength;
      const brakeDist = preset.zones.brake.leftLength + vehicleLength;
      const approachDist = preset.zones.approach.leftLength + vehicleLength;

      // Check zones from inner to outer
      if (distance <= stopDist) {
        // STOP ZONE
        data[ptrBack + MovementData.MOVING_STATUS] = MovingStatus.STOPPED;
        data[ptrBack + SensorData.HIT_ZONE] = HitZone.STOP;
        data[ptrBack + MovementData.VELOCITY] = 0;
        data[ptrBack + MovementData.DECELERATION] = 0;
        collisions++;
      } else if (distance <= brakeDist) {
        // BRAKE ZONE
        data[ptrBack + SensorData.HIT_ZONE] = HitZone.BRAKE;
        if (velocity > brakeMinSpeed) {
            data[ptrBack + MovementData.DECELERATION] = preset.zones.brake.dec;
        } else {
            data[ptrBack + MovementData.DECELERATION] = 0;
        }
        
        if (data[ptrBack + MovementData.MOVING_STATUS] === MovingStatus.STOPPED) {
             data[ptrBack + MovementData.MOVING_STATUS] = MovingStatus.MOVING;
        }
      } else if (distance <= approachDist) {
        // APPROACH ZONE
        data[ptrBack + SensorData.HIT_ZONE] = HitZone.APPROACH;
        if (velocity > approachMinSpeed) {
            data[ptrBack + MovementData.DECELERATION] = preset.zones.approach.dec;
        } else {
            data[ptrBack + MovementData.DECELERATION] = 0;
        }

        if (data[ptrBack + MovementData.MOVING_STATUS] === MovingStatus.STOPPED) {
             data[ptrBack + MovementData.MOVING_STATUS] = MovingStatus.MOVING;
        }
      } else {
        // NO COLLISION
        const statusBack = data[ptrBack + MovementData.MOVING_STATUS];
        if (statusBack === MovingStatus.STOPPED) {
           data[ptrBack + MovementData.MOVING_STATUS] = MovingStatus.MOVING;
           resumes++;
        }
        data[ptrBack + SensorData.HIT_ZONE] = HitZone.NONE;
        data[ptrBack + MovementData.DECELERATION] = 0;
      }

    } else {
      // --- COMPLEX / CURVE LOGIC (SAT SENSORS) ---
      // 1. Rough distance check
      if (roughDistanceCheck(backVehId, frontVehId, 8.0)) {
         // 2. Precise SAT check
         const zoneHit = checkSensorCollision(backVehId, frontVehId); 

         if (zoneHit >= 0) {
            const presetIdx = data[ptrBack + SensorData.PRESET_IDX] | 0;
            const preset = SENSOR_PRESETS[presetIdx] ?? SENSOR_PRESETS[0];
            const zoneKey: SensorZoneKey = zoneHit === HitZone.STOP ? "stop" : zoneHit === HitZone.BRAKE ? "brake" : "approach";
            const dec = preset.zones[zoneKey]?.dec ?? 0;

            data[ptrBack + SensorData.HIT_ZONE] = zoneHit;
            
            if (zoneKey === "stop" || dec === -Infinity) {
              // Stop
              data[ptrBack + MovementData.VELOCITY] = 0;
              data[ptrBack + MovementData.DECELERATION] = 0;
              data[ptrBack + MovementData.MOVING_STATUS] = MovingStatus.STOPPED;
              collisions++;
            } else {
              // Decelerate (Approach/Brake)
              // Logic: Only decelerate if current velocity is above min threshold for that zone
              let shouldDecel = true;
              if (zoneKey === "approach" && velocity <= approachMinSpeed) shouldDecel = false;
              if (zoneKey === "brake" && velocity <= brakeMinSpeed) shouldDecel = false;

              if (shouldDecel) {
                  data[ptrBack + MovementData.DECELERATION] = dec;
              } else {
                  data[ptrBack + MovementData.DECELERATION] = 0;
              }

              // Ensure we are moving if not stopped
              if (data[ptrBack + MovementData.MOVING_STATUS] === MovingStatus.STOPPED) {
                 data[ptrBack + MovementData.MOVING_STATUS] = MovingStatus.MOVING;
              }
            }
         } else {
            // No collision - Reset / Resume
             const statusBack = data[ptrBack + MovementData.MOVING_STATUS];
             if (statusBack === MovingStatus.STOPPED) {
                // Check simple distance for resume hysteresis ? 
                // Alternatively simply resume if sensors are clear.
                // For safety, let's resume.
                data[ptrBack + MovementData.MOVING_STATUS] = MovingStatus.MOVING;
                resumes++;
             }
             data[ptrBack + SensorData.HIT_ZONE] = HitZone.NONE;
             data[ptrBack + MovementData.DECELERATION] = 0;
         }
      } else {
         // Far away
         const statusBack = data[ptrBack + MovementData.MOVING_STATUS];
         if (statusBack === MovingStatus.STOPPED) {
             data[ptrBack + MovementData.MOVING_STATUS] = MovingStatus.MOVING;
             resumes++;
         }
         data[ptrBack + SensorData.HIT_ZONE] = HitZone.NONE;
         data[ptrBack + MovementData.DECELERATION] = 0;
      }
    }
  }

  return { collisions, resumes };
}
