import { Node } from "../types";

/**
 * Calculate waypoints for different rail types
 */
export class PointsCalculator {
  private nodes: Node[];

  constructor(nodes: Node[]) {
    this.nodes = nodes;
  }

  /**
   * Get node by name
   */
  private getNode(nodeName: string): Node | undefined {
    return this.nodes.find(n => n.node_name === nodeName);
  }

  /**
   * Calculate waypoints for an edge based on rail type
   */
  calculateWaypoints(
    fromNodeName: string,
    toNodeName: string,
    railType: string,
    radius?: number,
    rotation?: number
  ): string[] {
    const fromNode = this.getNode(fromNodeName);
    const toNode = this.getNode(toNodeName);

    if (!fromNode || !toNode) {
      console.warn(`Nodes not found: ${fromNodeName} or ${toNodeName}`);
      return [fromNodeName, toNodeName];
    }

    switch (railType) {
      case "S":
        return this.calculateStraightWaypoints(fromNode, toNode);
      case "C90":
        return this.calculateCurve90Waypoints(fromNode, toNode, radius || 0.5);
      case "C180":
        return this.calculateCurve180Waypoints(fromNode, toNode, radius || 0.5);
      case "CS":
        return this.calculateSCurveWaypoints(fromNode, toNode, radius || 0.5);
      default:
        console.warn(`Unknown rail type: ${railType}`);
        return [fromNodeName, toNodeName];
    }
  }

  /**
   * Calculate waypoints for straight rail (S)
   * Simple: just from and to nodes
   */
  private calculateStraightWaypoints(fromNode: Node, toNode: Node): string[] {
    return [fromNode.node_name, toNode.node_name];
  }

  /**
   * Calculate waypoints for 90-degree curve (C90)
   * Creates intermediate points for smooth curve
   */
  private calculateCurve90Waypoints(fromNode: Node, toNode: Node, radius: number): string[] {
    // For now, return just from and to
    // TODO: Calculate actual curve intermediate points
    return [fromNode.node_name, toNode.node_name];
  }

  /**
   * Calculate waypoints for 180-degree curve (C180)
   */
  private calculateCurve180Waypoints(fromNode: Node, toNode: Node, radius: number): string[] {
    // For now, return just from and to
    // TODO: Calculate actual curve intermediate points
    return [fromNode.node_name, toNode.node_name];
  }

  /**
   * Calculate waypoints for S-curve (CS)
   * Creates multiple intermediate points for complex curve
   */
  private calculateSCurveWaypoints(fromNode: Node, toNode: Node, radius: number): string[] {
    // For now, return just from and to
    // TODO: Calculate actual S-curve intermediate points with multiple segments
    return [fromNode.node_name, toNode.node_name];
  }

  /**
   * Generate intermediate node name for curves
   */
  private generateIntermediateNodeName(edgeName: string, index: number): string {
    return `TMP_${edgeName}_${index}`;
  }

  /**
   * Create intermediate node at specific position
   */
  private createIntermediateNode(
    nodeName: string,
    x: number,
    y: number,
    z: number
  ): Node {
    return {
      node_name: nodeName,
      barcode: 0,
      editor_x: x,
      editor_y: y,
      editor_z: z,
      source: "calculated",
    };
  }

  /**
   * Calculate intermediate points for 90-degree curve
   * Returns array of [x, y, z] coordinates
   */
  private calculateCurve90Points(
    fromNode: Node,
    toNode: Node,
    radius: number,
    segments: number = 8
  ): Array<[number, number, number]> {
    const points: Array<[number, number, number]> = [];
    
    // Add start point
    points.push([fromNode.editor_x, fromNode.editor_y, fromNode.editor_z]);
    
    // Calculate curve center and intermediate points
    // This is a simplified version - actual implementation would need
    // to consider the direction and proper curve geometry
    
    const dx = toNode.editor_x - fromNode.editor_x;
    const dy = toNode.editor_y - fromNode.editor_y;
    const dz = toNode.editor_z - fromNode.editor_z;
    
    // Generate intermediate points along the curve
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      // Simple interpolation for now - should be replaced with proper curve math
      const x = fromNode.editor_x + dx * t;
      const y = fromNode.editor_y + dy * t;
      const z = fromNode.editor_z + dz * t;
      points.push([x, y, z]);
    }
    
    // Add end point
    points.push([toNode.editor_x, toNode.editor_y, toNode.editor_z]);
    
    return points;
  }
}

/**
 * Create a points calculator instance
 */
export function createPointsCalculator(nodes: Node[]): PointsCalculator {
  return new PointsCalculator(nodes);
}
