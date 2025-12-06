# Vehicle Management Renewal & Individual Control Requirements

## 1. Menu Structure Modification
*   **Target**: `menulv1` > `차량관리` (Vehicle Management).
*   **Action**: Refactor `lv2` menu items.
*   **Retention**: Keep only the following 3 items:
    1.  종합상황 (Overall Status)
    2.  개별조작 (Individual Control)
    3.  차량별 이력 (Vehicle History)
*   **Removal**: Remove all other existing `lv2` items under Vehicle Management.

## 2. '개별조작' (Individual Control) Feature Implementation
*   **Goal**: Implement a dedicated control panel for individual vehicles with search, options, and status display.

### 2.1 UI Layout
The layout should be arranged vertically:
1.  **Search Area** (Top)
2.  **Control Area** (Middle)
3.  **Status Area** (Bottom)

### 2.2 Functional Requirements

#### A. Vehicle Search
*   **Input**: Search bar to input Vehicle ID.
*   **Behavior**: Search for an existing (created) vehicle.

#### B. Control Options
*   Located between the Search Area and the Status Table.
*   **Required Controls**:
    1.  **멈추기 (Stop)**: Halt the vehicle's movement.
    2.  **센서바꾸기 (Change Sensor)**: Change the vehicle's sensor configuration/type.
    3.  **다시 진행 (Resume)**: Resume the vehicle's movement from a stopped state.

#### C. Status Table
*   **Display**: A simple table showing the current status of the vehicle found via search.
*   **Content**: "Current status" (details to be defined closer to implementation, currently "simple status").
