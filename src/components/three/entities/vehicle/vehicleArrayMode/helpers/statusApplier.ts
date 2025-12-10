import { MovementData, MovingStatus, StopReason, LogicData } from "@/store/vehicle/arrayMode/vehicleDataArray";

/**
 * Apply vehicle status change and return collision/resume statistics
 */
export function applyVehicleStatus(
  data: Float32Array,
  vehiclePtr: number,
  canProceed: boolean
): { collisions: number; resumes: number } {
  const currentStatus = data[vehiclePtr + MovementData.MOVING_STATUS];
  
  // 1. Check if we can resume
  if (canProceed) {
    if (currentStatus === MovingStatus.STOPPED) {
      // Check if there is a manual stop (E_STOP) or other persistent reason
      const stopReason = data[vehiclePtr + LogicData.STOP_REASON];
      
      // If E_STOP is set, do NOT auto-resume
      if ((stopReason & StopReason.E_STOP) !== 0) {
        return { collisions: 0, resumes: 0 };
      }

      data[vehiclePtr + MovementData.MOVING_STATUS] = MovingStatus.MOVING;
      return { collisions: 0, resumes: 1 }; // Added return based on original logic
    }
  }
  // 2. Check if we need to stop
  else if (!canProceed) { // Assuming shouldStop is !canProceed
    if (currentStatus === MovingStatus.MOVING) {
      data[vehiclePtr + MovementData.MOVING_STATUS] = MovingStatus.STOPPED;
      return { collisions: 1, resumes: 0 }; // Added return based on original logic
    }
  } 
  return { collisions: 0, resumes: 0 };
}
