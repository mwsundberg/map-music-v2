import type { Feature, LineString, MultiPoint } from 'geojson';
import type { ResampleSettings } from './App';
import { length, lineChunk, multiPoint } from '@turf/turf';

export function resampleCoords(coords: Feature<LineString>, {smoothingFactor, mode, count: sampleCount, distance: gapDistance, units}: ResampleSettings): Feature<MultiPoint> {
    /* Smoothing */
    /* TODO */

    /* Get the length equivalent to divide by to get an even number of chunks */
    if(mode === 'count') {
        if (isNaN(sampleCount) || sampleCount < 2) sampleCount = 2;
        gapDistance = length(coords, {units: units}) / (sampleCount - 1);
    }

    /* Divide the line into segments of the given length */
    const chunks = lineChunk(coords, gapDistance, {units: units});

    /* Convert the line chunks into a line of its own */
    const startCoords = chunks.features.map(({geometry: {coordinates: lineArray}})=>(lineArray[0]));
    const lastSegment = chunks.features[chunks.features.length - 1].geometry.coordinates;
    
    /* Make a new MultiPoint collection, passing along the properties if needed */
    return multiPoint([...startCoords, lastSegment[lastSegment.length - 1]], coords.properties);
}

