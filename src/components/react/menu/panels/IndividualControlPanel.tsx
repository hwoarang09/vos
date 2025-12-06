
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, Play, Pause, Settings, RefreshCw, Octagon } from "lucide-react";
import { useVehicleGeneralStore } from "@/store/vehicle/vehicleGeneralStore";
import { vehicleDataArray, MovingStatus, SensorData, StopReason, TrafficState } from "@/store/vehicle/arrayMode/vehicleDataArray";
import { PresetIndex } from "@/store/vehicle/arrayMode/sensorPresets";

// Helper to decode StopReason bitmask
const getStopReasons = (reasonMask: number): string[] => {
    if (reasonMask === 0) return ["NONE"];
    const reasons: string[] = [];
    if (reasonMask & StopReason.OBS_LIDAR) reasons.push("LIDAR");
    if (reasonMask & StopReason.OBS_CAMERA) reasons.push("CAMERA");
    if (reasonMask & StopReason.E_STOP) reasons.push("E_STOP");
    if (reasonMask & StopReason.WAITING_FOR_LOCK) reasons.push("TRAFFIC_LOCK");
    if (reasonMask & StopReason.DESTINATION_REACHED) reasons.push("DEST_REACHED");
    if (reasonMask & StopReason.PATH_BLOCKED) reasons.push("BLOCKED");
    if (reasonMask & StopReason.LOAD_ON) reasons.push("LOADING");
    if (reasonMask & StopReason.LOAD_OFF) reasons.push("UNLOADING");
    if (reasonMask & StopReason.NOT_INITIALIZED) reasons.push("NOT_INIT");
    return reasons;
};

// Map for Traffic State
const TrafficStateMap: Record<number, string> = {
    [TrafficState.FREE]: "FREE",
    [TrafficState.WAITING]: "WAITING",
    [TrafficState.ACQUIRED]: "ACQUIRED",
};

// Map for Hit Zone
const HitZoneMap: Record<number, string> = {
    [-1]: "None",
    0: "Approach",
    1: "Brake",
    2: "Stop",
};

const IndividualControlPanel: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [foundVehicleIndex, setFoundVehicleIndex] = useState<number | null>(null);
    // Local tick state to force re-render for real-time monitoring
    const [tick, setTick] = useState(0);
    const vehicles = useVehicleGeneralStore((state) => state.vehicles);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Start polling when a vehicle is selected
    useEffect(() => {
        if (foundVehicleIndex !== null) {
            intervalRef.current = setInterval(() => {
                setTick(t => t + 1);
            }, 100); // Update 10 times a second
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [foundVehicleIndex]);

    // Memoize vehicle options for the datalist (Smart Search)
    const vehicleOptions = useMemo(() => {
        return Array.from(vehicles.values()).map(v => v.id);
    }, [vehicles]);

    // Helper to find vehicle index by ID string (assuming ID is stored in general store)
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
            const currentReason = vehicleDataArray.getStopReason(foundVehicleIndex);
            vehicleDataArray.setStopReason(foundVehicleIndex, currentReason & ~StopReason.E_STOP);
        }
    };

    const handleSensorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (foundVehicleIndex !== null) {
            const newPreset = parseInt(e.target.value, 10);
            vehicleDataArray.get(foundVehicleIndex).sensor.presetIdx = newPreset;
        }
    };

    const getCurrentSensorPreset = () => {
        if (foundVehicleIndex !== null) {
            return vehicleDataArray.get(foundVehicleIndex).sensor.presetIdx;
        }
        return 0;
    };

    const handleChangeSensor = () => {
        if (foundVehicleIndex !== null) {
            const vehicleData = vehicleDataArray.get(foundVehicleIndex);
            const currentSensor = vehicleData.sensor.presetIdx;
            vehicleData.sensor.presetIdx = (currentSensor + 1) % 5;
        }
    };

    // Simple status display
    const renderStatus = () => {
        if (foundVehicleIndex === null) return null;

        // Force access to properties to ensure they are read fresh every render (triggered by tick)
        const vData = vehicleDataArray.get(foundVehicleIndex);
        
        const status = vData.movement.movingStatus;
        const velocity = vData.movement.velocity;
        const acceleration = vData.movement.acceleration;
        const deceleration = vData.movement.deceleration;
        const sensorPreset = vData.sensor.presetIdx;
        const hitZone = vData.sensor.hitZone;
        const trafficState = vData.logic.trafficState;
        const stopReasonMask = vData.logic.stopReason;
        
        const vehicleInfo = vehicles.get(foundVehicleIndex);
        const stopReasons = getStopReasons(stopReasonMask);

        return (
            <div className="mt-4 p-4 border border-gray-200 rounded bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                     <h4 className="font-semibold">Vehicle Status</h4>
                     <span className="text-xs text-gray-400 font-mono">Tick: {tick % 100}</span>
                </div>
               
                <div className="space-y-1 text-sm bg-white p-2 rounded border border-gray-100">
                    <div className="flex justify-between border-b border-gray-100 pb-1 mb-1">
                        <span className="text-gray-500">ID / Index</span>
                        <span className="font-mono font-bold">{vehicleInfo?.id || "Unknown"} <span className="text-gray-400 text-xs">#{foundVehicleIndex}</span></span>
                    </div>

                    <div className="flex justify-between">
                        <span>Status</span>
                        <span className={`font-mono font-bold ${status === MovingStatus.MOVING ? "text-green-600" : status === MovingStatus.PAUSED ? "text-orange-600" : "text-red-600"}`}>
                            {status === MovingStatus.MOVING ? "MOVING" : status === MovingStatus.PAUSED ? "PAUSED" : "STOPPED"}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span>Velocity</span>
                        <span className="font-mono">{velocity.toFixed(3)} m/s</span>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Acc / Dec</span>
                        <span className="font-mono">{acceleration.toFixed(2)} / {deceleration.toFixed(2)}</span>
                    </div>

                    <div className="my-2 border-t border-gray-200"></div>

                    <div className="flex justify-between">
                        <span>Sensor Preset</span>
                        <span className="font-mono">{Object.keys(PresetIndex).find(key => PresetIndex[key as keyof typeof PresetIndex] === sensorPreset) || sensorPreset}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Hit Zone</span>
                         <span className={`font-mono font-bold ${hitZone > 0 ? "text-red-600" : "text-gray-600"}`}>
                            {HitZoneMap[Math.round(hitZone)] || hitZone} ({hitZone.toFixed(0)})
                        </span>
                    </div>

                    <div className="my-2 border-t border-gray-200"></div>

                    <div className="flex justify-between">
                        <span>Traffic State</span>
                         <span className={`font-mono ${trafficState === TrafficState.WAITING ? "text-orange-600 animate-pulse" : "text-blue-600"}`}>
                            {TrafficStateMap[trafficState] || trafficState}
                        </span>
                    </div>

                     <div className="flex flex-col mt-1">
                        <span className="mb-1 text-gray-500">Stop Reasons:</span>
                        <div className="flex flex-wrap gap-1">
                            {stopReasons.map(r => (
                                <span key={r} className={`px-1.5 py-0.5 text-[10px] rounded border ${r === "NONE" ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-red-50 text-red-700 border-red-200 font-bold"}`}>
                                    {r}
                                </span>
                            ))}
                        </div>
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
                        placeholder="ID (e.g. VEH00001)"
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
                             <span className="text-[10px] font-medium leading-tight text-center px-1">
                                {Object.keys(PresetIndex).find(key => PresetIndex[key as keyof typeof PresetIndex] === getCurrentSensorPreset()) || "SENSOR"}
                             </span>
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
