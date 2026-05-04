import { elevationColorMap } from './mapConfig';

/** Interpolate a color for a given elevation */
export default function elevationColor(elevation: number): string {
    const elevationColorMapKeys = Object.keys(elevationColorMap).map((k)=>parseInt(k));

    /* Get the range of the elevation color map */
    const [minElevationKey, maxElevationKey] = elevationColorMapKeys.reduce(([min, max], current)=>[
        (current < min)? current:min,
        (current > max)? current:max
    ], [Infinity, -Infinity]);

    /* Get closest elevations that have a mapped color */
    const [lowerElevationKey, upperElevationKey] = elevationColorMapKeys.reduce(([lower, upper], elevationKey)=>{
        if (elevationKey <= elevation && elevationKey > lower) lower = elevationKey;
        if (elevationKey > elevation && elevationKey < upper) upper = elevationKey;
        return [lower, upper];
    }, [minElevationKey, maxElevationKey]);

    /* Early returns for exact or out of bounds matches */
        /* @ts-ignore (keys are guaranteed to work, but the `parseInt` and min/max manipulations throw off the type checker) */
    const lowerColor = elevationColorMap[lowerElevationKey];
    if (lowerElevationKey === elevation || upperElevationKey === minElevationKey) return lowerColor;
        /* @ts-ignore (same as above) */
    const upperColor = elevationColorMap[upperElevationKey];
    if (lowerElevationKey === maxElevationKey) return upperColor;

    /* Make a formula for the interpolation */
    const interpolationFactor = (elevation - lowerElevationKey) / (upperElevationKey - lowerElevationKey);
    const interpolate = (lower: number, upper: number) => (interpolationFactor * upper + (1 - interpolationFactor) * lower);

    /* Split the colors into components */
    const colorExtractor = /rgb\((\d+),\s*(\d+),\s*(\d+)\s*\)/;
    const lowerRegexMatch = lowerColor.match(colorExtractor);
    const upperRegexMatch = upperColor.match(colorExtractor);
    const [lowerR, lowerG, lowerB] = [parseInt(lowerRegexMatch[1]), parseInt(lowerRegexMatch[2]), parseInt(lowerRegexMatch[3])];
    const [upperR, upperG, upperB] = [parseInt(upperRegexMatch[1]), parseInt(upperRegexMatch[2]), parseInt(upperRegexMatch[3])];

    /* Interpolate and reassemble the color string */
    return `rgb(${interpolate(lowerR, upperR)}, ${interpolate(lowerG, upperG)}, ${interpolate(lowerB, upperB)})`;
}
