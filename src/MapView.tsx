import { useEffect, useState } from 'react';
import { Layer, Map, Source, useMap, type MapLayerMouseEvent } from 'react-map-gl/maplibre';
import type { Feature } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import styled from 'styled-components';
import { MapControls } from './components/MapControls';
import { mapPresets, mapStyle } from './mapConfig';
import type { Line } from './App';
import { bbox, bboxPolygon, booleanIntersects, featureCollection, lineString } from '@turf/turf';


interface MapViewProps {
    lines: Line[],
    addLine: (line: Pick<Line, 'id'|'coordinatesRaw'>)=>void,
    activeLineId: string|undefined,
    setActiveLineId: (id: string|undefined)=>void
}


/* Styled divs used in the MapView */
const MapContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

/** Map with controls for a location bookmark system */
export function MapView({lines, addLine, activeLineId, setActiveLineId, ...props}: MapViewProps) {
    const [mapInputMode, setMapInputMode] = useState<'panning'|'drawing'>('panning');
    const [cursor, setCursor] = useState((mapInputMode === 'drawing')? 'pointer' : undefined);
    const [mapViewState, setMapViewState] = useState(mapPresets[0].viewState);
    const {default: mapRef} = useMap();
    
    /* Drawing state */
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawnLine, setDrawnLine] = useState<[number, number][]>([]);

    /* The cursor should be a pointer in drawing mode */
    useEffect(()=>{
        setCursor((mapInputMode === 'drawing') ? 'pointer' : undefined);
    }, [mapInputMode]);

    /* If the activeLineId is set from an external source, jump to the line */
    useEffect(()=>{
        if (activeLineId) {
            /* Get the active line's bounding box */
            const activeLine = lines.filter(({id})=>(id === activeLineId))?.[0];
            const lineBoundsRaw = bbox(activeLine.coordinatesRaw);
            const lineBounds = bboxPolygon(lineBoundsRaw);

            /* Get the current bounding box */
            const mapBoundsRaw = mapRef?.getBounds()!;
            const mapBounds = bboxPolygon([mapBoundsRaw._sw.lng, mapBoundsRaw._sw.lat, mapBoundsRaw._ne.lng, mapBoundsRaw._ne.lat]);

            /* Check for overlap (don't want to unnecessarily zoom about just because something's slightly peeking off the edge) */
            const onScreen = booleanIntersects(lineBounds, mapBounds);

            /* Zoom the map if fully off screen */
            if (!onScreen) {
                mapRef?.fitBounds(
                    [[lineBoundsRaw[0], lineBoundsRaw[1]], [lineBoundsRaw[2], lineBoundsRaw[3]]],
                    {padding: 100, duration: 500}
                )
            }
        }
    }, [activeLineId]);

    /* Let listeners be undefined when not in specific mode to prevent unneeded execution */
    let mapOnMouseDown, mapOnMouseMove, mapOnMouseOut, mapOnMouseUp, mapOnClick, mapOnMouseEnter, mapOnMouseLeave;

    /* Drawing logic */
    if(mapInputMode === 'drawing') {
        mapOnMouseDown = () => {
            setDrawnLine([]);
            setIsDrawing(true);
        };
        mapOnMouseMove = (ev: MapLayerMouseEvent) => {
            if(isDrawing) setDrawnLine([...drawnLine, [ev.lngLat.lng, ev.lngLat.lat]]);
        };
        mapOnMouseOut = mapOnMouseUp = () => {
            /* Read drawing value to only trigger once */
            if(isDrawing && drawnLine.length > 2) {
                const id = crypto.randomUUID();

                /* Convert to GeoJSON for easier turf handling */                
                addLine({
                    id: id,
                    coordinatesRaw: lineString(drawnLine, {lineId: id}),
                });
            }

            setIsDrawing(false);
            setDrawnLine([]);
        }
    }
    if(mapInputMode === 'panning') {
        /* Make the lines interactive */
        mapOnClick = (ev: MapLayerMouseEvent) => {
            const feature = ev.features?.[0];
            if(feature) {
                setActiveLineId(feature.properties.lineId);
            } else {
                setActiveLineId(undefined);
            }
        };
        mapOnMouseEnter = () => setCursor('pointer');
        mapOnMouseLeave = () => setCursor(undefined);
    }

    /* Convert the lines to GeoJSON for rendering */
    const linesRawAsGeoJSON = featureCollection(lines.map(({ coordinatesRaw }) => coordinatesRaw));
    const linesResampledAsGeoJSON = featureCollection(lines.map(({ coordinatesResampled }) => coordinatesResampled));
    const drawnLineAsGeoJSON: Feature = {
        type: 'Feature',
        properties: {},
        geometry: {type: 'LineString', coordinates: drawnLine},
    }
    

    return (
        <MapContainer {...props}>
            <MapControls {...{mapInputMode, setMapInputMode, mapViewState, setMapViewState}} presets={mapPresets} />
            <Map
                /* Don't instantiate a new map on each component load */
                reuseMaps

                /* The actual map configuration */
                mapStyle={mapStyle}

                /* React flavored movement of the map */
                {...mapViewState}
                onMove={(ev) => setMapViewState(ev.viewState)}

                /* Only have dragging do something when not in drawing mode */
                dragPan={(mapInputMode === 'panning')}
                dragRotate={(mapInputMode === 'panning')}

                /* Listeners that are activated when in drawing/panning mode and undefined otherwise */
                onMouseDown={mapOnMouseDown}
                onMouseMove={mapOnMouseMove}
                onMouseOut={mapOnMouseOut}
                onMouseUp={mapOnMouseUp}
                onClick={mapOnClick}
                onMouseEnter={mapOnMouseEnter}
                onMouseLeave={mapOnMouseLeave}

                /* Cursor is changed to pointer when drawing and hovering over existing lines for selection */
                cursor={cursor}

                /* The existing lines should be interactive */
                interactiveLayerIds={['linesRaw', 'lineResampledDots']}
            >
                {/* Existing and drawn lines (converted to GeoJSON and rendered) */}
                <Source type='geojson' data={linesRawAsGeoJSON}>
                    <Layer id='linesRaw' type='line' paint={{
                        'line-color': ['case', ['==', ['get', 'lineId'], activeLineId || ''], 'rgb(47, 155, 197)', 'rgb(109, 109, 109)'],
                        'line-width': 3,
                    }} />
                </Source>
                <Source type='geojson' data={linesResampledAsGeoJSON}>
                    <Layer id='linesResampledDots' type='circle' paint={{
                        'circle-color': ['case', ['==', ['get', 'lineId'], activeLineId || ''], 'rgb(0, 183, 255)', 'rgb(109, 109, 109)'],
                        'circle-stroke-color': ['case', ['==', ['get', 'lineId'], activeLineId || ''], 'rgb(83, 206, 255)', 'rgb(109, 109, 109)'],
                        'circle-radius': 4,
                        'circle-stroke-width': 1,
                    }} />
                </Source>
                <Source type='geojson' data={drawnLineAsGeoJSON}>
                    <Layer id='drawnLine' type='line' paint={{
                        'line-color': '#0f0',
                        'line-width': 3
                    }} />
                </Source>
            </Map>
        </MapContainer>
    );
}