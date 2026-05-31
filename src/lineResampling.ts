import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import type { ResampleSettings } from './useLines';
import { along, featureCollection, length } from '@turf/turf';
import type { MapRef } from 'react-map-gl/maplibre';

/** Generate an evenly spaced set of points along a GeoJSON LineString */
export function resampleCoords(map: MapRef, id: string, coords: Feature<LineString>, {smoothingFactor, mode, count: sampleCount, distance: gapDistance, units}: ResampleSettings): FeatureCollection<Point, { lineId: string, fractionAlong: number, elevation: number }> {
    /* Smoothing */
    /* TODO */

    /* Get the length divide by to get a given number of chunks */
    const totalLength = length(coords, {units: units});
    if(mode === 'count') {
        if (isNaN(sampleCount) || sampleCount < 2) sampleCount = 2;
        gapDistance = totalLength / (sampleCount - 1);
    }

    /* Get points along the line, with the percentage along the line the point is and the elevation at the point */
    const coordsResampled = [];
    for(let d = 0; d < totalLength; d += gapDistance) {
        const point = along(coords, d, {units: units});
        point.properties = {
            lineId: id,
            fractionAlong: d / totalLength,
            elevation: map.queryTerrainElevation(point.geometry.coordinates as [number, number]),
        };

        coordsResampled.push(point as Feature<Point, {lineId: string, fractionAlong: number, elevation: number}>);
    }
    /* The last point isn't always added properly in 'count' mode */
    if(mode === 'count') {
                const point = along(coords, totalLength, {units: units});
        point.properties = {
            lineId: id,
            fractionAlong: 1,
            elevation: map.queryTerrainElevation(point.geometry.coordinates as [number, number]),
        };

        coordsResampled.push(point as Feature<Point, {lineId: string, fractionAlong: number, elevation: number}>);
    }

    /* Convert the Features array into a FeatureCollection */
    return featureCollection(coordsResampled);
}