import React from "react";
import { VehicleSystemType } from "../../../types/vehicle";
import { useVehicleTestStore } from "../../../store/vehicle/vehicleTestStore";

/**
 * VehicleTestUI
 * - UI component for vehicle test status panel
 * - Displays test state, mode, vehicle count, and controls
 * - Shows initial vehicle distribution across edges
 */

interface VehicleTestUIProps {
  testState: "loading-map" | "initializing" | "running" | "error";
  mode: VehicleSystemType;
  mapName: string;
  numVehicles: number;
  isPanelVisible: boolean;
  onClose: () => void;
  onStopTest: () => void;
}

const VehicleTestUI: React.FC<VehicleTestUIProps> = ({
  testState,
  mode,
  mapName,
  numVehicles,
  isPanelVisible,
  onClose,
  onStopTest,
}) => {
  const initialVehicleDistribution = useVehicleTestStore((state) => state.initialVehicleDistribution);

  // Don't render panel if it's hidden
  if (!isPanelVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "rgba(0, 0, 0, 0.9)",
        color: "white",
        padding: "30px",
        borderRadius: "12px",
        border: "2px solid #4ecdc4",
        fontFamily: "monospace",
        fontSize: "14px",
        zIndex: 1000,
        minWidth: "400px",
        textAlign: "center",
      }}
    >
      <h2 style={{ margin: "0 0 20px 0", color: "#4ecdc4" }}>
        Vehicle Performance Test
      </h2>

      {testState === "loading-map" && (
        <div>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #333",
              borderTop: "4px solid #4ecdc4",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 15px auto",
            }}
          />
          <p>Loading test map...</p>
        </div>
      )}

      {testState === "initializing" && (
        <div>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #333",
              borderTop: "4px solid #4ecdc4",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 15px auto",
            }}
          />
          <p>Initializing vehicles...</p>
        </div>
      )}

      {testState === "running" && (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>✓</div>
            <p style={{ color: "#4ecdc4", fontWeight: "bold" }}>Test Running</p>
          </div>

          <div style={{ textAlign: "left", marginBottom: "20px" }}>
            <p><strong>Mode:</strong> {mode}</p>
            <p><strong>Vehicles:</strong> {numVehicles}</p>
            <p><strong>Map:</strong> {mapName}</p>
            <p><strong>Status:</strong> Vehicles circulating on track</p>
          </div>

          {/* Initial Vehicle Distribution */}
          {initialVehicleDistribution && initialVehicleDistribution.size > 0 && (
            <div style={{
              textAlign: "left",
              marginBottom: "20px",
              maxHeight: "200px",
              overflowY: "auto",
              background: "rgba(0, 0, 0, 0.3)",
              padding: "10px",
              borderRadius: "4px",
              fontSize: "11px",
            }}>
              <p style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "12px" }}>
                Initial Vehicle Distribution:
              </p>
              {Array.from(initialVehicleDistribution.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([edgeIndex, vehicleIndices]) => (
                  <div key={edgeIndex} style={{ marginBottom: "6px" }}>
                    <strong>Edge {edgeIndex}:</strong> {vehicleIndices.length} vehicles
                    <div style={{
                      color: "#aaa",
                      fontSize: "10px",
                      marginLeft: "10px",
                      wordBreak: "break-all",
                    }}>
                      [{vehicleIndices.slice(0, 20).join(", ")}
                      {vehicleIndices.length > 20 ? `, ... +${vehicleIndices.length - 20} more` : ""}]
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              onClick={onClose}
              style={{
                background: "#4ecdc4",
                color: "black",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              Close Panel
            </button>

            <button
              onClick={onStopTest}
              style={{
                background: "#ff6b6b",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              Stop Test
            </button>
          </div>
        </div>
      )}

      {testState === "error" && (
        <div>
          <p style={{ color: "#ff6b6b", marginBottom: "15px" }}>
            Failed to load test map
          </p>
          <button
            onClick={onClose}
            style={{
              background: "#ff6b6b",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Close
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VehicleTestUI;

