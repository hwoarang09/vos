import { VehicleStatus } from "@/types/vehicleStatus";

const STATUS_OFFSET = 7;

/**
 * Apply vehicle status change and return collision/resume statistics
 */
export function applyVehicleStatus(
  data: Float32Array,
  vehiclePtr: number,
  canProceed: boolean
): { collisions: number; resumes: number } {
  const currentStatus = data[vehiclePtr + STATUS_OFFSET];

  if (!canProceed) {
    if (currentStatus !== VehicleStatus.STOPPED) {
      data[vehiclePtr + STATUS_OFFSET] = VehicleStatus.STOPPED;
      return { collisions: 1, resumes: 0 };
    }
  } else {
    if (currentStatus === VehicleStatus.STOPPED) {
      data[vehiclePtr + STATUS_OFFSET] = VehicleStatus.MOVING;
      return { collisions: 0, resumes: 1 };
    }
  }

  return { collisions: 0, resumes: 0 };
}

