# Sensor Point Array Layout (Array Mode)

- Per-vehicle floats: **36** (3 zones × 12 floats)
- Zones (outer → inner): `0=approach` (yellow), `1=brake` (orange), `2=stop` (red)
- Per-zone layout (offsets are relative to the zone start):

| Offset | Key  | Description          |
| --- | --- | --- |
| 0   | FL_X | Front Left X |
| 1   | FL_Y | Front Left Y |
| 2   | FR_X | Front Right X |
| 3   | FR_Y | Front Right Y |
| 4   | BL_X | Back Left X |
| 5   | BL_Y | Back Left Y |
| 6   | BR_X | Back Right X |
| 7   | BR_Y | Back Right Y |
| 8   | SL_X | Sensor Left tip X |
| 9   | SL_Y | Sensor Left tip Y |
| 10  | SR_X | Sensor Right tip X |
| 11  | SR_Y | Sensor Right tip Y |

Zone base offset = `(vehIdx * 36) + (zoneIndex * 12)`.

- Outer zone bases are the vehicle corners.
- Middle/inner zones start from narrower bases toward the vehicle center (scaled widths).

