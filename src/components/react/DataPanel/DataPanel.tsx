// src/components/ConfigDataPanel.tsx
import React, { useMemo, useState } from "react";
import { useNodeStore } from "../../../store/nodeStore";
import { useMapStore } from "../../../store/edgeStore";
import { cn } from "@/lib/utils";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

type TabKey = "nodes" | "edges";

const headerCell =
  "sticky top-0 z-10 h-10 px-3 bg-slate-800/95 backdrop-blur-lg text-[12px] font-semibold text-slate-200 border-b border-slate-600/50";
const bodyCell =
  "px-3 py-2 align-middle text-[12px] transition-colors duration-200";
const monoRight = "font-mono tabular-nums text-[12px] text-right";
const firstCol =
  "sticky left-0 z-10 bg-slate-900/95 backdrop-blur-sm border-r border-slate-600/50";

function fmtNum(v: unknown, d = 1) {
  return typeof v === "number" && Number.isFinite(v) ? v.toFixed(d) : "-";
}

function typeColor(type?: string) {
  switch (type) {
    case "LINEAR":
    case "S":
      return {
        bg: "linear-gradient(135deg, #3B82F6, #1E40AF)",
        fg: "#fff",
        shadow: "shadow-blue-500/20",
      };
    case "CURVE_90":
      return {
        bg: "linear-gradient(135deg, #A855F7, #7C3AED)",
        fg: "#fff",
        shadow: "shadow-purple-500/20",
      };
    case "CURVE_180":
      return {
        bg: "linear-gradient(135deg, #EC4899, #BE185D)",
        fg: "#fff",
        shadow: "shadow-pink-500/20",
      };
    case "CURVE_CSC":
      return {
        bg: "linear-gradient(135deg, #F97316, #EA580C)",
        fg: "#fff",
        shadow: "shadow-orange-500/20",
      };
    default:
      return {
        bg: "linear-gradient(135deg, #64748B, #475569)",
        fg: "#fff",
        shadow: "shadow-slate-500/20",
      };
  }
}

const MiniBadge: React.FC<{
  bg: string;
  fg: string;
  shadow: string;
  children: React.ReactNode;
}> = ({ bg, fg, shadow, children }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide shadow-md transform hover:scale-105 transition-all duration-200",
      shadow
    )}
    style={{ background: bg, color: fg }}
  >
    {children}
  </span>
);

const ColorChip: React.FC<{ color?: string; label?: string }> = ({
  color = "#ffffff",
  label = "default",
}) => (
  <div className="flex items-center gap-1.5">
    <div
      className="w-3 h-3 rounded-full border border-slate-600 shadow-sm"
      style={{ backgroundColor: color }}
    />
    <span className="text-[11px] text-slate-400 font-medium truncate max-w-[60px]">
      {label}
    </span>
  </div>
);

const ConfigDataPanel: React.FC = () => {
  const [tab, setTab] = useState<TabKey>("nodes");
  const { nodes, previewNodes } = useNodeStore();
  const { edges, previewEdge } = useMapStore();

  const nodeCount = useMemo(() => nodes.length, [nodes]);
  const edgeCount = useMemo(() => edges.length, [edges]);

  return (
    <Card
      className={cn(
        "fixed left-2 right-2 bottom-16 max-h-[50vh] z-[1000] w-auto max-w-fit mx-auto",
        "border border-slate-700/50 bg-slate-900/95 backdrop-blur-xl shadow-2xl rounded-lg",
        "ring-1 ring-slate-600/30"
      )}
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="flex items-center justify-between border-b border-slate-700/50 px-3 py-2 bg-slate-800/80 rounded-t-lg">
          <TabsList className="bg-slate-700/50 rounded-lg p-0.5 shadow-inner">
            <TabsTrigger
              value="nodes"
              className="text-xs font-semibold px-3 py-1.5 rounded-md data-[state=active]:bg-slate-600 data-[state=active]:shadow-md data-[state=active]:text-blue-300 text-slate-300 transition-all duration-200"
            >
              Node Data
            </TabsTrigger>
            <TabsTrigger
              value="edges"
              className="text-xs font-semibold px-3 py-1.5 rounded-md data-[state=active]:bg-slate-600 data-[state=active]:shadow-md data-[state=active]:text-purple-300 text-slate-300 transition-all duration-200"
            >
              Edge Data
            </TabsTrigger>
          </TabsList>
          <div className="text-xs text-slate-400 font-medium">
            {tab === "nodes" ? `${nodeCount} nodes` : `${edgeCount} edges`}
          </div>
        </div>

        <CardContent className="p-3">
          <TabsContent value="nodes" className="mt-0">
            <ScrollArea className="h-[40vh] w-full rounded-lg border border-slate-700/50 bg-slate-800/30">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-0">
                    <TableHead
                      className={cn(headerCell, firstCol, "w-[100px]")}
                    >
                      Name
                    </TableHead>
                    <TableHead className={cn(headerCell, "w-[60px]")}>
                      X
                    </TableHead>
                    <TableHead className={cn(headerCell, "w-[60px]")}>
                      Y
                    </TableHead>
                    <TableHead className={cn(headerCell, "w-[60px]")}>
                      Z
                    </TableHead>
                    <TableHead className={cn(headerCell, "w-[80px]")}>
                      Barcode
                    </TableHead>
                    <TableHead className={cn(headerCell, "w-[100px]")}>
                      Color
                    </TableHead>
                    <TableHead className={cn(headerCell, "w-[60px]")}>
                      Size
                    </TableHead>
                    <TableHead className={cn(headerCell, "w-[80px]")}>
                      Source
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nodes.map((n: any, i: number) => (
                    <TableRow
                      key={n.node_name}
                      className={cn(
                        "border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors duration-200",
                        i % 2 === 1 && "bg-slate-800/30"
                      )}
                    >
                      <TableCell
                        className={cn(
                          bodyCell,
                          firstCol,
                          "font-semibold text-slate-200"
                        )}
                      >
                        {n.node_name}
                      </TableCell>
                      <TableCell
                        className={cn(
                          bodyCell,
                          monoRight,
                          "text-blue-400 font-bold"
                        )}
                      >
                        {fmtNum(n.editor_x)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          bodyCell,
                          monoRight,
                          "text-green-400 font-bold"
                        )}
                      >
                        {fmtNum(n.editor_y)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          bodyCell,
                          monoRight,
                          "text-purple-400 font-bold"
                        )}
                      >
                        {fmtNum(n.editor_z)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          bodyCell,
                          "font-mono text-slate-400 text-[11px]"
                        )}
                      >
                        {n.barcode ?? "-"}
                      </TableCell>
                      <TableCell className={bodyCell}>
                        <ColorChip
                          color={n.color}
                          label={n.color ?? "default"}
                        />
                      </TableCell>
                      <TableCell
                        className={cn(
                          bodyCell,
                          monoRight,
                          "text-orange-400 font-bold"
                        )}
                      >
                        {fmtNum(n.size)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          bodyCell,
                          "truncate text-slate-500 font-medium"
                        )}
                      >
                        {n.source ?? "unknown"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {nodeCount > 0 && (
                  <TableFooter>
                    <TableRow className="bg-slate-800/60">
                      <TableCell
                        colSpan={8}
                        className="text-[12px] font-bold text-slate-300 py-3"
                      >
                        Total: {nodeCount} nodes
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </ScrollArea>

            {previewNodes?.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-2">
                  Preview Nodes
                  <span className="bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {previewNodes.length}
                  </span>
                </div>
                <ScrollArea className="max-h-[30vh] w-full rounded-lg border border-amber-700/50 bg-amber-900/20">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-0">
                        <TableHead
                          className={cn(
                            headerCell,
                            firstCol,
                            "bg-amber-800/95 w-[100px]"
                          )}
                        >
                          Name
                        </TableHead>
                        <TableHead
                          className={cn(headerCell, "bg-amber-800/95 w-[60px]")}
                        >
                          X
                        </TableHead>
                        <TableHead
                          className={cn(headerCell, "bg-amber-800/95 w-[60px]")}
                        >
                          Y
                        </TableHead>
                        <TableHead
                          className={cn(headerCell, "bg-amber-800/95 w-[60px]")}
                        >
                          Z
                        </TableHead>
                        <TableHead
                          className={cn(
                            headerCell,
                            "bg-amber-800/95 w-[100px]"
                          )}
                        >
                          Color
                        </TableHead>
                        <TableHead
                          className={cn(headerCell, "bg-amber-800/95 w-[60px]")}
                        >
                          Size
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewNodes.map((n: any, i: number) => (
                        <TableRow
                          key={n.node_name}
                          className={cn(
                            "border-b border-amber-800/30 hover:bg-amber-800/30 transition-colors duration-200",
                            i % 2 === 1 && "bg-amber-900/30"
                          )}
                        >
                          <TableCell
                            className={cn(
                              bodyCell,
                              firstCol,
                              "font-semibold text-amber-200"
                            )}
                          >
                            {n.node_name}
                          </TableCell>
                          <TableCell
                            className={cn(
                              bodyCell,
                              monoRight,
                              "text-blue-400 font-bold"
                            )}
                          >
                            {fmtNum(n.editor_x)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              bodyCell,
                              monoRight,
                              "text-green-400 font-bold"
                            )}
                          >
                            {fmtNum(n.editor_y)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              bodyCell,
                              monoRight,
                              "text-purple-400 font-bold"
                            )}
                          >
                            {fmtNum(n.editor_z)}
                          </TableCell>
                          <TableCell className={bodyCell}>
                            <ColorChip
                              color={n.color}
                              label={n.color ?? "default"}
                            />
                          </TableCell>
                          <TableCell
                            className={cn(
                              bodyCell,
                              monoRight,
                              "text-orange-400 font-bold"
                            )}
                          >
                            {fmtNum(n.size)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          <TabsContent value="edges" className="mt-0">
            <ScrollArea className="h-[40vh] w-full rounded-lg border border-slate-700/50 bg-slate-800/30">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-0">
                    <TableHead
                      className={cn(headerCell, firstCol, "w-[100px]")}
                    >
                      Name
                    </TableHead>
                    <TableHead className={cn(headerCell, "w-[70px]")}>
                      From
                    </TableHead>
                    <TableHead className={cn(headerCell, "w-[70px]")}>
                      To
                    </TableHead>
                    <TableHead className={cn(headerCell, "w-[90px]")}>
                      Type
                    </TableHead>
                    <TableHead className={cn(headerCell, "w-[400px]")}>
                      Waypoints
                    </TableHead>
                    <TableHead className={cn(headerCell, "w-[60px]")}>
                      Distance
                    </TableHead>
                    <TableHead className={cn(headerCell, "w-[60px]")}>
                      Radius
                    </TableHead>
                    <TableHead className={cn(headerCell, "w-[60px]")}>
                      Rotation
                    </TableHead>
                    <TableHead className={cn(headerCell, "w-[80px]")}>
                      Source
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {edges.map((e: any, i: number) => {
                    const c = typeColor(e.vos_rail_type);
                    return (
                      <TableRow
                        key={e.edge_name}
                        className={cn(
                          "border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors duration-200",
                          i % 2 === 1 && "bg-slate-800/30"
                        )}
                      >
                        <TableCell
                          className={cn(
                            bodyCell,
                            firstCol,
                            "font-semibold text-slate-200"
                          )}
                        >
                          {e.edge_name}
                        </TableCell>
                        <TableCell
                          className={cn(
                            bodyCell,
                            "font-semibold text-green-400"
                          )}
                        >
                          {e.from_node}
                        </TableCell>
                        <TableCell
                          className={cn(bodyCell, "font-semibold text-red-400")}
                        >
                          {e.to_node}
                        </TableCell>
                        <TableCell className={bodyCell}>
                          <MiniBadge bg={c.bg} fg={c.fg} shadow={c.shadow}>
                            {e.vos_rail_type}
                          </MiniBadge>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-[11px] text-slate-400 font-mono">
                          {Array.isArray(e.waypoints) ? (
                            <span className="bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded font-bold">
                              {e.waypoints.join(", ")}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </TableCell>
                        <TableCell
                          className={cn(
                            bodyCell,
                            monoRight,
                            "text-indigo-400 font-bold"
                          )}
                        >
                          {fmtNum(e.distance)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            bodyCell,
                            monoRight,
                            "text-cyan-400 font-bold"
                          )}
                        >
                          {fmtNum(e.radius)}
                        </TableCell>
                        <TableCell
                          className={cn(bodyCell, "text-slate-400 font-medium")}
                        >
                          {e.rotation ?? "-"}
                        </TableCell>
                        <TableCell
                          className={cn(
                            bodyCell,
                            "truncate text-slate-500 font-medium"
                          )}
                        >
                          {e.source ?? "unknown"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                {edgeCount > 0 && (
                  <TableFooter>
                    <TableRow className="bg-slate-800/60">
                      <TableCell
                        colSpan={9}
                        className="text-[12px] font-bold text-slate-300 py-3"
                      >
                        Total: {edgeCount} edges
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </ScrollArea>

            {previewEdge && (
              <div className="mt-3">
                <div className="text-xs font-bold text-amber-400 mb-2">
                  Preview Edge
                </div>
                <ScrollArea className="max-h-[30vh] w-full rounded-lg border border-amber-700/50 bg-amber-900/20">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-0">
                        <TableHead
                          className={cn(
                            headerCell,
                            firstCol,
                            "bg-amber-800/95 w-[100px]"
                          )}
                        >
                          Name
                        </TableHead>
                        <TableHead
                          className={cn(headerCell, "bg-amber-800/95 w-[70px]")}
                        >
                          From
                        </TableHead>
                        <TableHead
                          className={cn(headerCell, "bg-amber-800/95 w-[70px]")}
                        >
                          To
                        </TableHead>
                        <TableHead
                          className={cn(headerCell, "bg-amber-800/95 w-[90px]")}
                        >
                          Type
                        </TableHead>
                        <TableHead
                          className={cn(headerCell, "bg-amber-800/95 w-[90px]")}
                        >
                          Curve Dir
                        </TableHead>
                        <TableHead
                          className={cn(headerCell, "bg-amber-800/95 w-[90px]")}
                        >
                          Start Dir
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="border-b border-amber-800/30 hover:bg-amber-800/30">
                        <TableCell
                          className={cn(
                            bodyCell,
                            firstCol,
                            "font-semibold text-amber-200"
                          )}
                        >
                          {previewEdge.edge_name}
                        </TableCell>
                        <TableCell
                          className={cn(
                            bodyCell,
                            "font-semibold text-green-400"
                          )}
                        >
                          {previewEdge.from_node}
                        </TableCell>
                        <TableCell
                          className={cn(bodyCell, "font-semibold text-red-400")}
                        >
                          {previewEdge.to_node}
                        </TableCell>
                        <TableCell className={bodyCell}>
                          <MiniBadge
                            bg={typeColor(previewEdge.vos_rail_type).bg}
                            fg={typeColor(previewEdge.vos_rail_type).fg}
                            shadow={typeColor(previewEdge.vos_rail_type).shadow}
                          >
                            {previewEdge.vos_rail_type}
                          </MiniBadge>
                        </TableCell>
                        <TableCell
                          className={cn(bodyCell, "text-slate-400 font-medium")}
                        >
                          {previewEdge.curve_direction ?? "-"}
                        </TableCell>
                        <TableCell
                          className={cn(bodyCell, "text-slate-400 font-medium")}
                        >
                          {previewEdge.start_direction ?? "-"}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default ConfigDataPanel;
