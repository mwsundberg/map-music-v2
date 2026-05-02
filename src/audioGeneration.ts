import type { Line } from "./App";

export function playLine(line: Line) {
    console.log('played line ' + line.id, line.elevations);
}