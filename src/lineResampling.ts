import type { Feature, LineString, MultiPoint } from 'geojson';
import type { ResampleSettings } from './useLines';
import { length, lineChunk, multiPoint } from '@turf/turf';
import type { MapRef } from 'react-map-gl/maplibre';

/** Generate an evenly spaced set of points along a GeoJSON LineString */
export function resampleCoords(coords: Feature<LineString>, {smoothingFactor, mode, count: sampleCount, distance: gapDistance, units}: ResampleSettings): Feature<MultiPoint> {
    /* Smoothing */
    /* TODO */

    /* Get the length divide by to get a given number of chunks */
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

/** Get elevations at a set of points, returning an array in the same order */
export function getElevations(map: MapRef, coords: Feature<MultiPoint>): number[] {
    const elevations = coords.geometry.coordinates.map(([lng, lat])=>{
        return map.queryTerrainElevation([lng, lat]);
    });

    /* Check that we actually got data before returning */
    if(elevations[0] === null) {
        throw new Error('Getting null when checking elevations with `queryTerrainElevation`');
    };
    return elevations as number[];
}