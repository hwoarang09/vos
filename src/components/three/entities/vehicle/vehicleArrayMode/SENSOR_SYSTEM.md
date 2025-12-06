# Sensor-Based Collision Detection System

## 📐 Overview

라이다 센서 기반 충돌 감지 시스템으로 업그레이드했습니다.

### **Before (거리 기반)**
- ❌ 점 vs 점 거리 계산
- ❌ 차량 크기/회전 무시
- ❌ 센서 방향성 없음

### **After (센서 기반)**
- ✅ 사각형 vs 사각형 충돌 (SAT 알고리즘)
- ✅ 차량 본체 + 센서 파형 표현
- ✅ 센서 방향성 (직선/좌회전/우회전)

---

## 🎯 Architecture

### **1. Data Structure**

```typescript
// Vehicle Data (15 floats per vehicle) - DECEL, hitZone, logic state included
MovementData = {
  X: 0, Y: 1, Z: 2,
  ROTATION: 3,
  VELOCITY: 4,
  ACCELERATION: 5,
  DECELERATION: 6,   // braking command (m/s^2, negative to brake)
  EDGE_RATIO: 7,
  MOVING_STATUS: 8,
  CURRENT_EDGE: 9,
}

StatusData = {
  // (deprecated; use MovingStatus + CURRENT_EDGE above)
}

SensorData = {
  PRESET_IDX: 10,  // 0=직진, 1=좌커브, 2=우커브, 3=합류, 4=분기
  HIT_ZONE: 11,    // -1=none, 0=approach, 1=brake, 2=stop
}

LogicData = {
  TRAFFIC_STATE: 12,
  STOP_REASON: 13,
  JOB_STATE: 14,
}

// Sensor Geometry Data (36 floats per vehicle) - 3 zones * 12 floats
SensorPoint = {
  FL_X: 0,  FL_Y: 1,   // Front Left (앞 왼쪽)
  FR_X: 2,  FR_Y: 3,   // Front Right (앞 오른쪽)
  BL_X: 4,  BL_Y: 5,   // Back Left (뒤 왼쪽)
  BR_X: 6,  BR_Y: 7,   // Back Right (뒤 오른쪽)
  SL_X: 8,  SL_Y: 9,   // Sensor Left tip (센서 왼쪽 끝)
  SR_X: 10, SR_Y: 11,  // Sensor Right tip (센서 오른쪽 끝)
}
```

### **2. Sensor Presets (3-Zone per preset)**

```typescript
type SensorZoneKey = "approach" | "brake" | "stop";

SENSOR_PRESETS = [
  // 0: 직진
  {
    zones: {
      approach: { leftAngle: 0, rightAngle: 0, leftLength: 2.5, rightLength: 2.5, dec: -1 },      // 서서히 감속
      brake:    { leftAngle: 0, rightAngle: 0, leftLength: 1.5, rightLength: 1.5, dec: -3 },      // 급감속
      stop:     { leftAngle: 0, rightAngle: 0, leftLength: 0.5, rightLength: 0.5, dec: -Infinity }, // 즉시 정지
    },
  },
  // 1: 좌커브
  {
    zones: {
      approach: { leftAngle: 15, rightAngle: -20, leftLength: 2.0, rightLength: 1.2, dec: -1 },
      brake:    { leftAngle: 15, rightAngle: -20, leftLength: 1.2, rightLength: 0.7, dec: -3 },
      stop:     { leftAngle: 15, rightAngle: -20, leftLength: 0.4, rightLength: 0.4, dec: -Infinity },
    },
  },
  // 2: 우커브
  { zones: { /* 좌커브 대비 좌/우 길이 반전 */ } },
  // 3: 합류
  { zones: { /* approach/brake/stop 길이 동일, dec 단계만 다름 */ } },
  // 4: 분기
  { zones: { /* approach/brake/stop 길이 동일, dec 단계만 다름 */ } },
];
```

---

## 🔄 Update Flow

```
movementUpdate.ts
  ↓
1. Calculate new position (x, y, rotation)
  ↓
2. Read PRESET_IDX from MovementData (acc/dec 제어는 zone 기반으로 확장 예정)
  ↓
3. updateSensorPoints(vehIdx, x, y, rot, presetIdx)
  ↓
4. Calculate 6 points (FL, FR, BL, BR, SL, SR) for each zone (approach/brake/stop)
  ↓
5. Write to sensorPointArray

> DECELERATION (`MovementData.DECELERATION`) now lives in the movement buffer; braking tiers from presets (approach/brake/stop) should map to this slot when control logic is wired.
```

### **Key Function: `updateSensorPoints()`**

```typescript
// helpers/sensorPoints.ts
export function updateSensorPoints(
  vehIdx: number,
  x: number,
  y: number,
  rot: number,
  presetIdx: number
): void {
  const preset = SENSOR_PRESETS[presetIdx];
  
  // 1. Calculate body corners (FL, FR, BL, BR)
  // 2. Calculate sensor tips (SL, SR) based on preset angles/lengths
  // 3. Write to sensorPointArray.getData()
}
```

---

## 🔍 Collision Detection

### **Hybrid Approach**

```typescript
// checkLeadVehicle.ts
if (isComplex) {
  // 복잡한 상황 (커브, 합류, 분기)
  // → 센서 기반 정밀 체크
  if (roughDistanceCheck(leadVehId, targetVehId, 8.0)) {
    if (checkSensorCollision(leadVehId, targetVehId)) {
      canProceed = false;
    }
  }
} else {
  // 단순 직선
  // → 기존 거리 기반 체크 (빠름)
  const distance = calculateVehicleDistance(...);
  if (distance <= effectiveResumeDistance) {
    canProceed = false;
  }
}
```

### **SAT Algorithm (Separating Axis Theorem)**

```typescript
// helpers/sensorCollision.ts
export function checkSensorCollision(
  sensorVehIdx: number,  // 뒤차 (센서)
  targetVehIdx: number   // 앞차 (본체)
): boolean {
  // 1. 뒤차의 센서 사각형 (FL -> SL -> SR -> FR)
  // 2. 앞차의 본체 사각형 (FL -> BL -> BR -> FR)
  // 3. SAT로 충돌 검사
  
  // 센서 사각형 축으로 검사
  if (!satQuadCheck(sensorQuad, bodyQuad)) return false;
  
  // 본체 사각형 축으로 검사
  if (!satQuadCheck(bodyQuad, sensorQuad)) return false;
  
  return true; // 충돌!
}
```

---

## 🎨 Visualization

### **SensorDebugRenderer**

```typescript
// renderers/VehiclesRenderer/SensorDebugRenderer.tsx
export function SensorDebugRenderer({ numVehicles }) {
  // 매 프레임마다:
  // 1. sensorPointArray에서 6개 점 읽기
  // 2. 센서 사각형 (FL -> SL -> SR -> FR) 그리기 (녹색)
  // 3. 본체 사각형 (FL -> BL -> BR -> FR) 그리기 (청록색)
}
```

**사용법:**
```tsx
// VehicleArrayRenderer.tsx
<SensorDebugRenderer numVehicles={actualNumVehicles} color="#00ff00" />
```

---

## 🐛 Debugging

### **Console Logs**

```typescript
// movementUpdate.ts에서 5초마다 자동 로그
[SensorDebug] Summary: 100 initialized, 0 zero (total: 100)
[SensorDebug] First initialized VEH0:
  FL: (10.25, 5.90)
  FR: (10.25, 4.10)
  BL: (5.75, 5.90)
  BR: (5.75, 4.10)
  SL: (12.75, 5.90)  // 센서 왼쪽 끝
  SR: (12.75, 4.10)  // 센서 오른쪽 끝
```

### **Manual Debug**

```typescript
import { logSensorData, isSensorDataZero } from './helpers/sensorDebug';

// 특정 차량 센서 데이터 확인
logSensorData(0, "Vehicle 0");

// 센서 데이터 초기화 여부 확인
if (isSensorDataZero(0)) {
  console.warn("Vehicle 0 sensor not initialized!");
}
```

---

## ⚡ Performance

### **Zero-Allocation Design**

1. **센서 점 계산**: 임시 객체 생성 없이 직접 Float32Array에 쓰기
2. **충돌 검사**: Stack 변수만 사용, GC 오버헤드 없음
3. **Rough Distance Check**: 정밀 검사 전 빠른 필터링 (8m 이내만 SAT 실행)

### **Hybrid Strategy**

- **직선 구간**: 기존 거리 기반 (빠름)
- **커브/합류/분기**: 센서 기반 (정확함)

---

## 📝 TODO

- [ ] 센서 프리셋 자동 선택 (Edge 타입 기반)
- [ ] 센서 디버그 렌더러 토글 (UI)
- [ ] 센서 충돌 통계 (센서 vs 거리 기반 비교)
- [ ] 센서 길이 동적 조정 (속도 기반)

---

## 🎓 Key Files

```
vehicleArrayMode/
├── helpers/
│   ├── sensorPoints.ts          # 센서 점 계산
│   ├── sensorCollision.ts       # SAT 충돌 검사
│   └── sensorDebug.ts           # 디버깅 유틸
├── collisionLogic/
│   └── checkLeadVehicle.ts      # 하이브리드 충돌 로직
├── movementUpdate.ts            # 센서 점 업데이트 통합
└── SENSOR_SYSTEM.md             # 이 문서

store/vehicle/arrayMode/
├── sensorPointArray.ts     # 센서 데이터 저장소
└── sensorPresets.ts             # 센서 파형 정의

renderers/VehiclesRenderer/
└── SensorDebugRenderer.tsx      # 센서 시각화
```
