import { useEffect, useState } from 'react';
import { Layer, Map, Source, type MapLayerMouseEvent } from 'react-map-gl/maplibre';
import type { Feature } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import styled from 'styled-components';
import { MapControls } from './components/MapControls';
import { mapPresets, mapStyle } from './mapConfig';
import type { Line } from './App';
import { featureCollection, lineString } from '@turf/turf';


interface MapViewProps {
    lines: Line[],
    addLine: (line: Pick<Line, 'id'|'coordinatesRaw'>)=>void,
    activeLineId: string|undefined,
    setActiveLineId: (id: string)=>void
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
    
    /* Drawing state */
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawnLine, setDrawnLine] = useState<[number, number][]>([]);

    /* The cursor should be a pointer in drawing mode */
    useEffect(() => {
        setCursor((mapInputMode === 'drawing') ? 'pointer' : undefined);
    }, [mapInputMode]);

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
                interactiveLayerIds={['linesRaw', 'linesResampled']}
            >
                {/* Existing and drawn lines (converted to GeoJSON and rendered) */}
                <Source type='geojson' data={linesRawAsGeoJSON}>
                    <Layer id='linesRaw' type='line' paint={{
                        'line-color': ['case', ['==', ['get', 'lineId'], activeLineId || ''], '#ff0', '#f00'],
                        'line-width': 3
                    }} />
                </Source>
                <Source type='geojson' data={linesResampledAsGeoJSON}>
                    <Layer id='linesResampled' type='line' paint={{
                        'line-color': ['case', ['==', ['get', 'lineId'], activeLineId || ''], '#ff0', '#f00'],
                        'line-width': 3
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