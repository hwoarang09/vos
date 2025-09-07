import React, { useMemo } from "react";
import { useTextStore } from "../../../store/textStore";
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

// Generate groups data for NumberGridInstanced
const generateGroupsData = (
  texts: Record<string, { x: number; y: number; z: number }>
) => {
  const groups: Array<{
    x: number;
    y: number;
    z: number;
    digits: number[];
  }> = [];

  Object.entries(texts).forEach(([textName, position]) => {
    const digits = textToIndices(textName);

    groups.push({
      x: position.x,
      y: position.y,
      z: position.z,
      digits: digits,
    });
  });

  return groups;
};

interface TextRendererProps {
  // Optional props for customization
  scale?: number;
  nodeColor?: string;
  edgeColor?: string;
}

const TextRenderer: React.FC<TextRendererProps> = ({
  scale = 0.6, // 더 작게
  nodeColor = "#00e5ff", // 노드: 밝은 청록색
  edgeColor = "#ff9800", // 엣지: 주황색
}) => {
  const { nodeTexts, edgeTexts, updateTrigger } = useTextStore();

  // Generate separate groups data for nodes and edges
  const nodeGroupsData = useMemo(() => {
    const data = generateGroupsData(nodeTexts);
    console.log(
      "TextRenderer - nodeTexts:",
      Object.keys(nodeTexts).length,
      "nodes"
    );
    console.log("TextRenderer - nodeGroupsData:", data.length, "groups");
    return data;
  }, [nodeTexts, updateTrigger]);

  const edgeGroupsData = useMemo(() => {
    const data = generateGroupsData(edgeTexts);
    console.log(
      "TextRenderer - edgeTexts:",
      Object.keys(edgeTexts).length,
      "edges"
    );
    console.log("TextRenderer - edgeGroupsData:", data.length, "groups");
    return data;
  }, [edgeTexts, updateTrigger]);

  return (
    <group name="text-renderer">
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

export default TextRenderer;
