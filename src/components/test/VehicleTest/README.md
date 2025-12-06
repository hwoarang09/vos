# Vehicle Test Components

Test components for vehicle system performance testing.

## Structure

```
test/VehicleTest/
├── VehicleTest.tsx          - Router component (menu integration)
├── VehicleTestRunner.tsx    - Test lifecycle manager (logic only)
└── VehicleTestUI.tsx        - Test status panel UI (presentation only)
```

## Components

### VehicleTest.tsx
- Integrates with menu system
- Routes to appropriate test mode based on submenu selection
- Manages test lifecycle (start/stop)

### VehicleTestRunner.tsx
- **Logic Layer**: Manages test lifecycle and state
- Automatically loads test map (`straight_short_test`)
- Manages test states: loading-map → initializing → running → error
- Handles user actions (close panel, stop test)
- Delegates UI rendering to VehicleTestUI

### VehicleTestUI.tsx
- **Presentation Layer**: Pure UI component
- Displays test status panel based on testState prop
- Shows loading spinner, success checkmark, or error message
- Renders control buttons (Close Panel, Stop Test)

## Usage

### Via Menu System
1. Open Test menu
2. Select test mode (Rapier Array, Rapier Dict, Shared Memory)
3. VehicleTestRunner automatically loads map and starts test

### Standalone
```tsx
import VehicleTestUI from '@components/test/VehicleTest/VehicleTestUI';

// In your component
<VehicleTestUI />
```

## Test Configuration

### Test Settings (`/public/config/testSettingConfig.json`)
Pre-defined test scenarios with map and vehicle count:
- **SMALL_LOOP**: `straight_short_test` with 5 vehicles (quick testing)
- **MEDIUM_LOOP**: `straight_test` with 20 vehicles (moderate testing)
- **LARGE_LOOP**: `straight_test` with 50 vehicles (stress testing)
- **STRESS_TEST**: `dismantle` with 100 vehicles (performance testing)

### Movement Config (`/public/config/movementConfig.json`)
- **LINEAR_MAX_SPEED**: 5.0 m/s
- **LINEAR_ACCELERATION**: 3.0 m/s²
- **CURVE_MAX_SPEED**: 1.0 m/s

### How to Add New Test Settings
Edit `/public/config/testSettingConfig.json`:
```json
{
  "id": "MY_TEST",
  "name": "My Custom Test",
  "description": "Description here",
  "mapName": "my_map_folder",
  "numVehicles": 10
}
```

## Related Files

- **Vehicle System**: `src/components/three/entities/vehicle/VehicleSystem.tsx`
- **Test Store**: `src/store/vehicleTestStore.ts`
- **Movement Config**: `src/config/movementConfig.ts`

