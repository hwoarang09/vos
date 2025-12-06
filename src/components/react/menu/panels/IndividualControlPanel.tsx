
import React, { useState, useMemo } from "react";
import { Search, Play, Pause, Settings, RefreshCw, Octagon } from "lucide-react";
import { useVehicleGeneralStore } from "@/store/vehicle/vehicleGeneralStore";
import { vehicleDataArray, MovingStatus, SensorData, StopReason } from "@/store/vehicle/arrayMode/vehicleDataArray";

const IndividualControlPanel: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [foundVehicleIndex, setFoundVehicleIndex] = useState<number | null>(null);
    const vehicles = useVehicleGeneralStore((state) => state.vehicles);

    // Memoize vehicle options for the datalist (Smart Search)
    const vehicleOptions = useMemo(() => {
        return Array.from(vehicles.values()).map(v => v.id);
    }, [vehicles]);

    // Helper to find vehicle index by ID string (assuming ID is stored in general store)
    // Note: In a real scenario, we might need a more efficient lookup if vehicle count is huge.
    // For now, iterating map is acceptable for < 2000 vehicles.
    const handleSearch = () => {
        let found = -1;
        for (const [index, data] of vehicles.entries()) {
            if (data.id === searchTerm) {
                found = index;
                break;
            }
        }
        if (found !== -1) {
            setFoundVehicleIndex(found);
        } else {
            setFoundVehicleIndex(null);
            alert("Vehicle not found");
        }
    };

    const handleStop = () => {
        if (foundVehicleIndex !== null) {
            vehicleDataArray.setMovingStatus(foundVehicleIndex, MovingStatus.STOPPED);
            // Set manual stop reason (E_STOP)
            const currentReason = vehicleDataArray.getStopReason(foundVehicleIndex);
            vehicleDataArray.setStopReason(foundVehicleIndex, currentReason | StopReason.E_STOP);
        }
    };

    const handlePause = () => {
        if (foundVehicleIndex !== null) {
            vehicleDataArray.setMovingStatus(foundVehicleIndex, MovingStatus.PAUSED);
        }
    };

    const handleResume = () => {
        if (foundVehicleIndex !== null) {
            vehicleDataArray.setMovingStatus(foundVehicleIndex, MovingStatus.MOVING);
            // Clear manual stop reason
            const currentReason = vehicleDataArray.getStopReason(foundVehicleIndex);
            vehicleDataArray.setStopReason(foundVehicleIndex, currentReason & ~StopReason.E_STOP);
        }
    };

    const handleChangeSensor = () => {
        if (foundVehicleIndex !== null) {
            // Cycle through sensor presets 0-4
            const vehicleData = vehicleDataArray.get(foundVehicleIndex);
            const currentSensor = vehicleData.sensor.presetIdx;
            vehicleData.sensor.presetIdx = (currentSensor + 1) % 5;
        }
    };

    // Simple status display
    const renderStatus = () => {
        if (foundVehicleIndex === null) return null;

        const status = vehicleDataArray.getMovingStatus(foundVehicleIndex);
        const velocity = vehicleDataArray.getVelocity(foundVehicleIndex);
        const sensor = vehicleDataArray.get(foundVehicleIndex).sensor.presetIdx;
        const vehicleInfo = vehicles.get(foundVehicleIndex);

        return (
            <div className="mt-4 p-4 border border-gray-200 rounded bg-gray-50">
                <h4 className="font-semibold mb-2">Vehicle Status</h4>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span>ID:</span>
                        <span className="font-mono">{vehicleInfo?.id || "Unknown"}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Index:</span>
                        <span className="font-mono">{foundVehicleIndex}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-mono ${status === MovingStatus.MOVING ? "text-green-600" : status === MovingStatus.PAUSED ? "text-orange-600" : "text-red-600"}`}>
                            {status === MovingStatus.MOVING ? "MOVING" : status === MovingStatus.PAUSED ? "PAUSED" : "STOPPED"}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Velocity:</span>
                        <span className="font-mono">{velocity.toFixed(2)} m/s</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Sensor Preset:</span>
                        <span className="font-mono">{sensor}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Search Area */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Search Vehicle</label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Vehicle ID (e.g. VEH00001)"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        list="vehicle-ids-list"
                    />
                    <datalist id="vehicle-ids-list">
                        {vehicleOptions.map((id) => (
                            <option key={id} value={id} />
                        ))}
                    </datalist>
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                </div>
            </div>

            {/* Control Area */}
            {foundVehicleIndex !== null && (
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Controls</label>
                    <div className="grid grid-cols-4 gap-2">
                        <button
                            onClick={handleStop}
                            className="flex flex-col items-center justify-center p-3 border border-red-200 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                        >
                            <Octagon size={24} className="mb-1 fill-red-100" />
                            <span className="text-xs font-medium">Stop</span>
                        </button>
                        <button
                            onClick={handlePause}
                            className="flex flex-col items-center justify-center p-3 border border-orange-200 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors"
                        >
                            <Pause size={24} className="mb-1" />
                            <span className="text-xs font-medium">Pause</span>
                        </button>
                        <button
                            onClick={handleResume}
                            className="flex flex-col items-center justify-center p-3 border border-green-200 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                        >
                            <Play size={24} className="mb-1" />
                            <span className="text-xs font-medium">Resume</span>
                        </button>
                         <button
                            onClick={handleChangeSensor}
                            className="flex flex-col items-center justify-center p-3 border border-blue-200 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                        >
                            <Settings size={24} className="mb-1" />
                            <span className="text-xs font-medium">Sensor</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Status Area */}
            {renderStatus()}
        </div>
    );
};

export default IndividualControlPanel;
