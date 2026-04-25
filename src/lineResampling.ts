import type { Feature, LineString } from 'geojson';
import type { ResampleSettings } from './App';
import { length, lineChunk, lineString } from '@turf/turf';

export function resampleCoords(coords: Feature<LineString>, {smoothingFactor, mode, count: sampleCount, distance: gapDistance}: ResampleSettings): Feature<LineString> {
    /* Smoothing */
    /* TODO */

    /* Get the length equivalent to divide by to get an even number of chunks */
    if(mode === 'count') {
        gapDistance = length(coords, {units: 'meters'}) / sampleCount;
    }

    /* Divide the line into segments of the given length */
    const chunks = lineChunk(coords, gapDistance, {units: 'meters'});

    /* Convert the line chunks into a line of its own */
    const startCoords = chunks.features.map(({geometry: {coordinates: lineArray}})=>(lineArray[0]));
    const lastSegment = chunks.features[chunks.features.length - 1].geometry.coordinates;
    
    /* Make a new LineString, passing along the properties if needed */
    return lineString([...startCoords, lastSegment[lastSegment.length - 1]], coords.properties);
}

