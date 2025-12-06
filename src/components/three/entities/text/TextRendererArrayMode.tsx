import React, { useMemo } from "react";
import { useTextStore } from "../../../../store/map/textStore";
import NumberGridInstanced from "./customSpriteText/NumberGridInstnaced";

// Character mapping: 0-9, N, E
const CHAR_MAP: Record<string, number> = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  N: 10,
  E: 11,
};

// Convert text to character indices
const textToIndices = (text: string): number[] => {
  return text.split("").map((char) => CHAR_MAP[char.toUpperCase()] ?? 0);
};

// Generate groups data for NumberGridInstanced from array
const generateGroupsDataFromArray = (
  texts: Array<{ name: string; position: { x: number; y: number; z: number } }>
) => {
  return texts.map((item) => ({
    x: item.position.x,
    y: item.position.y,
    z: item.position.z,
    digits: textToIndices(item.name),
  }));
};

interface TextRendererArrayModeProps {
  // Optional props for customization
  scale?: number;
  nodeColor?: string;
  edgeColor?: string;
}

const TextRendererArrayMode: React.FC<TextRendererArrayModeProps> = ({
  scale = 0.6,
  nodeColor = "#00e5ff", // Node: bright cyan
  edgeColor = "#ff9800", // Edge: orange
}) => {
  const { nodeTextsArray, edgeTextsArray, updateTrigger } = useTextStore();

  // Generate separate groups data for nodes and edges
  const nodeGroupsData = useMemo(() => {
    const data = generateGroupsDataFromArray(nodeTextsArray);
    console.log(
      "TextRendererArrayMode - nodeTextsArray:",
      nodeTextsArray.length,
      "nodes"
    );
    console.log("TextRendererArrayMode - nodeGroupsData:", data.length, "groups");
    return data;
  }, [nodeTextsArray, updateTrigger]);

  const edgeGroupsData = useMemo(() => {
    const data = generateGroupsDataFromArray(edgeTextsArray);
    console.log(
      "TextRendererArrayMode - edgeTextsArray:",
      edgeTextsArray.length,
      "edges"
    );
    console.log("TextRendererArrayMode - edgeGroupsData:", data.length, "groups");
    return data;
  }, [edgeTextsArray, updateTrigger]);

  return (
    <group name="text-renderer-array-mode">
      {/* Node texts */}
      {nodeGroupsData.length > 0 && (
        <NumberGridInstanced
          groups={nodeGroupsData}
          scale={scale}
          color={nodeColor}
        />
      )}

      {/* Edge texts */}
      {edgeGroupsData.length > 0 && (
        <NumberGridInstanced
          groups={edgeGroupsData}
          scale={scale}
          color={edgeColor}
        />
      )}
    </group>
  );
};

export default TextRendererArrayMode;

