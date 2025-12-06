// text/instanced/MapTextRenderer.tsx
import React, { useMemo } from "react";
import { useTextStore } from "@store/map/textStore";
import InstancedText, { TextGroup } from "./InstancedText";
import { VehicleSystemMode } from "../../vehicle/VehicleSystem";

const CHAR_MAP: Record<string, number> = {
  "0":0,"1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"N":10,"E":11,
};

const textToIndices = (text: string): number[] =>
  text.split("").map(c => CHAR_MAP[c.toUpperCase()] ?? 0);

interface Props {
  mode: VehicleSystemMode;
  scale?: number;
  nodeColor?: string;
  edgeColor?: string;
}

const MapTextRenderer: React.FC<Props> = ({
  mode,
  scale = 0.6,
  nodeColor = "#00e5ff",
  edgeColor = "#ff9800",
}) => {
  const { 
    nodeTexts, edgeTexts,           // dict mode
    nodeTextsArray, edgeTextsArray, // array mode
    updateTrigger 
  } = useTextStore();

  // Node groups
  const nodeGroups = useMemo((): TextGroup[] => {
    if (mode === "array-single") {
      return nodeTextsArray.map(item => ({
        x: item.position.x,
        y: item.position.y,
        z: item.position.z,
        digits: textToIndices(item.name),
      }));
    }
    return Object.entries(nodeTexts).map(([name, pos]) => ({
      x: pos.x, y: pos.y, z: pos.z,
      digits: textToIndices(name),
    }));
  }, [mode, nodeTexts, nodeTextsArray, updateTrigger]);

  // Edge groups
  const edgeGroups = useMemo((): TextGroup[] => {
    if (mode === "array-single") {
      return edgeTextsArray.map(item => ({
        x: item.position.x,
        y: item.position.y,
        z: item.position.z,
        digits: textToIndices(item.name),
      }));
    }
    return Object.entries(edgeTexts).map(([name, pos]) => ({
      x: pos.x, y: pos.y, z: pos.z,
      digits: textToIndices(name),
    }));
  }, [mode, edgeTexts, edgeTextsArray, updateTrigger]);

  return (
    <group name="map-text">
      {nodeGroups.length > 0 && (
        <InstancedText groups={nodeGroups} scale={scale} color={nodeColor} />
      )}
      {edgeGroups.length > 0 && (
        <InstancedText groups={edgeGroups} scale={scale} color={edgeColor} />
      )}
    </group>
  );
};

export default MapTextRenderer;