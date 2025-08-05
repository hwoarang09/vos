// components/react/menu/data/submenuConfig.tsx
import React from "react";
import {
  TrendingUp,
  Calendar,
  BarChart3,
  CalendarDays,
  Zap,
  Car,
  Circle,
  Clock,
  Wrench,
  FileText,
  Map,
  Timer,
  Eye,
  Bell,
  FileCheck,
  Minus,
  RotateCcw,
  Move3D,
  Waves,
  Hash,
  CornerDownRight,
  Shuffle,
  Building2,
  Cog,
} from "lucide-react";
import { ReactComponent as Curve180Icon } from "@/assets/icons/curve180.svg";
import { ReactComponent as Curve90Icon } from "@/assets/icons/curve90.svg";
import { ReactComponent as StrmapIcon } from "@/assets/icons/str_edge.svg";
import { ReactComponent as R_mapIcon } from "@/assets/icons/r_edge.svg";

import {
  SubMenuItem,
  ACTIVE_STROKE_COLOR,
  INACTIVE_STROKE_COLOR,
  ACTIVE_FILL_COLOR,
  INACTIVE_FILL_COLOR,
  ICON_SIZE_LARGE,
  ICON_SIZE_MEDIUM,
  ICON_SIZE_SMALL,
  ICON_SIZE_EXTRA_SMALL,
} from "../shared";

export const subMenuConfig: Record<string, SubMenuItem[]> = {
  Statistics: [
    {
      id: "stats-menu-1",
      label: "Realtime",
      iconFn: (isActive: boolean) => (
        <TrendingUp
          size={ICON_SIZE_LARGE}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "stats-menu-2",
      label: "Daily",
      iconFn: (isActive: boolean) => (
        <Calendar
          size={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "stats-menu-3",
      label: "Weekly",
      iconFn: (isActive: boolean) => (
        <BarChart3
          size={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "stats-menu-4",
      label: "Monthly",
      iconFn: (isActive: boolean) => (
        <CalendarDays
          size={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "stats-menu-5",
      label: "Performance",
      iconFn: (isActive: boolean) => (
        <Zap
          size={36}
          style={{
            fill: isActive ? ACTIVE_FILL_COLOR : INACTIVE_FILL_COLOR,
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 1,
          }}
        />
      ),
    },
  ],
  Vehicle: [
    {
      id: "vehicle-menu-1",
      label: "All",
      iconFn: (isActive: boolean) => (
        <Car
          size={36}
          style={{
            fill: isActive ? ACTIVE_FILL_COLOR : INACTIVE_FILL_COLOR,
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 1.5,
          }}
        />
      ),
    },
    {
      id: "vehicle-menu-2",
      label: "Active",
      iconFn: (isActive: boolean) => (
        <Circle
          size={36}
          style={{
            fill: isActive ? "#00ff00" : "#00aa00",
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "vehicle-menu-3",
      label: "Idle",
      iconFn: (isActive: boolean) => (
        <Clock
          size={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "vehicle-menu-4",
      label: "Maintenance",
      iconFn: (isActive: boolean) => (
        <Wrench
          size={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "vehicle-menu-5",
      label: "History",
      iconFn: (isActive: boolean) => (
        <FileText
          size={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
  ],
  Operation: [
    {
      id: "operation-menu-1",
      label: "Routes",
      iconFn: (isActive: boolean) => (
        <Map
          size={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "operation-menu-2",
      label: "Schedule",
      iconFn: (isActive: boolean) => (
        <Timer
          size={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "operation-menu-3",
      label: "Monitor",
      iconFn: (isActive: boolean) => (
        <Eye
          size={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "operation-menu-4",
      label: "Alerts",
      iconFn: (isActive: boolean) => (
        <Bell
          size={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "operation-menu-5",
      label: "Logs",
      iconFn: (isActive: boolean) => (
        <FileCheck
          size={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
  ],
  MapBuilder: [
    {
      id: "map-menu-1",
      label: "Straight",
      iconFn: (isActive: boolean) => (
        <StrmapIcon
          width={40}
          height={40}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            fill: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "map-menu-2",
      label: "90° Curve",
      iconFn: (isActive: boolean) => (
        <Curve90Icon
          width={40}
          height={40}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            fill: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "map-menu-3",
      label: "180° Curve",
      iconFn: (isActive: boolean) => (
        <Curve180Icon
          width={36}
          height={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            fill: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "map-menu-4",
      label: "S Curve",
      iconFn: (isActive: boolean) => (
        <Waves
          size={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "map-menu-5",
      label: "H Shape",
      iconFn: (isActive: boolean) => (
        <Hash
          size={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "map-menu-6",
      label: "R Shape",
      iconFn: (isActive: boolean) => (
        <R_mapIcon
          // size={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "map-menu-7",
      label: "Junction",
      iconFn: (isActive: boolean) => (
        <Shuffle
          size={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "map-menu-8",
      label: "Bridge",
      iconFn: (isActive: boolean) => (
        <Building2
          size={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
    {
      id: "map-menu-9",
      label: "Custom",
      iconFn: (isActive: boolean) => (
        <Cog
          size={36}
          style={{
            stroke: isActive ? ACTIVE_STROKE_COLOR : INACTIVE_STROKE_COLOR,
            strokeWidth: 2,
          }}
        />
      ),
    },
  ],
};
