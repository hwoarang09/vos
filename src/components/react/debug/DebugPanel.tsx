import React, { useState } from "react";
import { useNodeStore } from "../../../store/nodeStore";
import { useMapStore } from "../../../store/edgeStore";

interface DebugPanelProps {}

const DebugPanel: React.FC<DebugPanelProps> = () => {
  const [activeTab, setActiveTab] = useState<"nodes" | "edges">("nodes");
  
  const { nodes, previewNodes } = useNodeStore();
  const { edges, previewEdge } = useMapStore();

  const tabStyle = (isActive: boolean) => ({
    padding: "8px 16px",
    backgroundColor: isActive ? "#2196F3" : "#424242",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: isActive ? "bold" : "normal",
  });

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "12px",
    backgroundColor: "#1e1e1e",
    color: "#ffffff",
  };

  const thStyle = {
    backgroundColor: "#333333",
    color: "#ffffff",
    padding: "8px",
    textAlign: "left" as const,
    borderBottom: "1px solid #555555",
    fontSize: "11px",
    fontWeight: "bold",
  };

  const tdStyle = {
    padding: "6px 8px",
    borderBottom: "1px solid #333333",
    fontSize: "11px",
  };

  const renderNodesTable = () => (
    <div>
      <h4 style={{ color: "#ffffff", margin: "10px 0 5px 0", fontSize: "14px" }}>
        Nodes ({nodes.length})
      </h4>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>X</th>
            <th style={thStyle}>Y</th>
            <th style={thStyle}>Z</th>
            <th style={thStyle}>Barcode</th>
            <th style={thStyle}>Color</th>
            <th style={thStyle}>Size</th>
            <th style={thStyle}>Source</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <tr key={node.node_name}>
              <td style={tdStyle}>{node.node_name}</td>
              <td style={tdStyle}>{node.editor_x.toFixed(1)}</td>
              <td style={tdStyle}>{node.editor_y.toFixed(1)}</td>
              <td style={tdStyle}>{node.editor_z.toFixed(1)}</td>
              <td style={tdStyle}>{node.barcode}</td>
              <td style={tdStyle}>
                <span
                  style={{
                    backgroundColor: node.color || "#ffffff",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    color: "#000000",
                    fontSize: "10px",
                  }}
                >
                  {node.color || "default"}
                </span>
              </td>
              <td style={tdStyle}>{node.size?.toFixed(1) || "1.0"}</td>
              <td style={tdStyle}>{node.source || "unknown"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {previewNodes.length > 0 && (
        <>
          <h4 style={{ color: "#ffeb3b", margin: "15px 0 5px 0", fontSize: "14px" }}>
            Preview Nodes ({previewNodes.length})
          </h4>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>X</th>
                <th style={thStyle}>Y</th>
                <th style={thStyle}>Z</th>
                <th style={thStyle}>Color</th>
                <th style={thStyle}>Size</th>
              </tr>
            </thead>
            <tbody>
              {previewNodes.map((node) => (
                <tr key={node.node_name}>
                  <td style={tdStyle}>{node.node_name}</td>
                  <td style={tdStyle}>{node.editor_x.toFixed(1)}</td>
                  <td style={tdStyle}>{node.editor_y.toFixed(1)}</td>
                  <td style={tdStyle}>{node.editor_z.toFixed(1)}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        backgroundColor: node.color || "#ffffff",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        color: "#000000",
                        fontSize: "10px",
                      }}
                    >
                      {node.color || "default"}
                    </span>
                  </td>
                  <td style={tdStyle}>{node.size?.toFixed(1) || "1.0"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );

  const renderEdgesTable = () => (
    <div>
      <h4 style={{ color: "#ffffff", margin: "10px 0 5px 0", fontSize: "14px" }}>
        Edges ({edges.length})
      </h4>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>From</th>
            <th style={thStyle}>To</th>
            <th style={thStyle}>Type</th>
            <th style={thStyle}>Distance</th>
            <th style={thStyle}>Radius</th>
            <th style={thStyle}>Rotation</th>
            <th style={thStyle}>Source</th>
          </tr>
        </thead>
        <tbody>
          {edges.map((edge) => (
            <tr key={edge.edge_name}>
              <td style={tdStyle}>{edge.edge_name}</td>
              <td style={tdStyle}>{edge.from_node}</td>
              <td style={tdStyle}>{edge.to_node}</td>
              <td style={tdStyle}>
                <span
                  style={{
                    backgroundColor: edge.vos_rail_type === "S" ? "#4CAF50" : "#FF9800",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    color: "#ffffff",
                    fontSize: "10px",
                  }}
                >
                  {edge.vos_rail_type}
                </span>
              </td>
              <td style={tdStyle}>{edge.distance.toFixed(1)}</td>
              <td style={tdStyle}>{edge.radius?.toFixed(1) || "-"}</td>
              <td style={tdStyle}>{edge.rotation || "-"}</td>
              <td style={tdStyle}>{edge.source || "unknown"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {previewEdge && (
        <>
          <h4 style={{ color: "#ffeb3b", margin: "15px 0 5px 0", fontSize: "14px" }}>
            Preview Edge
          </h4>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>From</th>
                <th style={thStyle}>To</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Curve Dir</th>
                <th style={thStyle}>Start Dir</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>{previewEdge.edge_name}</td>
                <td style={tdStyle}>{previewEdge.from_node}</td>
                <td style={tdStyle}>{previewEdge.to_node}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      backgroundColor: previewEdge.vos_rail_type === "S" ? "#4CAF50" : "#FF9800",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      color: "#ffffff",
                      fontSize: "10px",
                    }}
                  >
                    {previewEdge.vos_rail_type}
                  </span>
                </td>
                <td style={tdStyle}>{previewEdge.curve_direction || "-"}</td>
                <td style={tdStyle}>{previewEdge.start_direction || "-"}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        bottom: "60px",
        left: "10px",
        right: "10px",
        height: "400px",
        backgroundColor: "#1e1e1e",
        border: "1px solid #333333",
        borderRadius: "8px",
        overflow: "hidden",
        zIndex: 1000,
      }}
    >
      {/* Tab Headers */}
      <div style={{ display: "flex", borderBottom: "1px solid #333333" }}>
        <button
          style={tabStyle(activeTab === "nodes")}
          onClick={() => setActiveTab("nodes")}
        >
          Nodes
        </button>
        <button
          style={tabStyle(activeTab === "edges")}
          onClick={() => setActiveTab("edges")}
        >
          Edges
        </button>
      </div>

      {/* Tab Content */}
      <div
        style={{
          height: "calc(100% - 40px)",
          overflow: "auto",
          padding: "10px",
        }}
      >
        {activeTab === "nodes" ? renderNodesTable() : renderEdgesTable()}
      </div>
    </div>
  );
};

export default DebugPanel;
