import { useMemo } from "react";
import * as THREE from "three";

// 0-9, N, E, V, H (14개)
export const ALL_CHARS = ["0","1","2","3","4","5","6","7","8","9","N","E","V","H"] as const;
export const CHAR_COUNT = ALL_CHARS.length;

export const CHAR_MAP: Record<string, number> = {
  "0":0,"1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,
  "N":10,"E":11,"V":12,"H":13,
};

export function textToDigits(text: string): number[] {
  return text.split("").map(c => CHAR_MAP[c.toUpperCase()] ?? 0);
}

interface DigitMaterialsOptions {
  color?: string;
  bgColor?: string;
  font?: string;
  size?: number;
}

export function useDigitMaterials({
  color = "#ffffff",
  bgColor = "transparent",
  font = "bold 96px system-ui, Roboto, Arial",
  size = 256,
}: DigitMaterialsOptions = {}) {
  return useMemo(() => {
    return ALL_CHARS.map(char => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      
      ctx.clearRect(0, 0, size, size);
      if (bgColor !== "transparent") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);
      }
      
      ctx.fillStyle = color;
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(char, size / 2, size / 2, size * 0.9);

      const tex = new THREE.Texture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;

      return new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthTest: true,
        depthWrite: false,
      });
    });
  }, [color, bgColor, font, size]);
}