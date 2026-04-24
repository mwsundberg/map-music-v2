import { useState } from "react";
import { Layer, Map, Source, useMap, type LngLat, type MapLayerMouseEvent} from 'react-map-gl/maplibre';
import type {Feature, FeatureCollection} from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import styled from "styled-components";
import { MapControls } from "./components/MapControls";
import { mapPresets, mapStyle } from "./mapConfig";

export type Line = {
    coordinates: LngLat[],
    elevations: number[],
}

interface MapViewProps {
    lines: Line[],
    addLine: (line: Line)=>void,
}


/* Styled divs used in the MapView */
const MapContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

/** Map with controls for a location bookmark system */
export function MapView({lines, addLine, ...props}: MapViewProps) {
    const [mapInputMode, setMapInputMode] = useState<'panning'|'drawing'>('panning');
    const [mapViewState, setMapViewState] = useState(mapPresets[0].viewState);
    const {default: map} = useMap();
    
    /* Drawing state */
    const [activeLineDrawing, setActiveLineDrawing] = useState(false);
    const [activeLine, setActiveLine] = useState<Array<LngLat>>([]);

    /* Let listeners be undefined when not in drawing mode to prevent unneeded execution */
    let mapOnMouseDown, mapOnMouseMove, mapOnMouseOut, mapOnMouseUp;
    if(mapInputMode === 'drawing') {
        mapOnMouseDown = () => {
            setActiveLine([]);
            setActiveLineDrawing(true);
        };
        mapOnMouseMove = (ev: MapLayerMouseEvent) => {
            if(activeLineDrawing) setActiveLine([...activeLine, ev.lngLat]);
        };
        mapOnMouseOut = mapOnMouseUp = () => {
            /* Read drawing value to only trigger once */
            if(activeLineDrawing) {
                const elevations = activeLine.map((coords) => map?.queryTerrainElevation(coords)!);

                console.log(elevations);
                addLine({
                    coordinates: activeLine,
                    elevations: elevations,
                });
            }

            setActiveLineDrawing(false);
            setActiveLine([]);
        }
    }

    /* Convert the lines to GeoJSON for rendering */
    const linesAsGeoJSON: FeatureCollection = {
        type: 'FeatureCollection',
        features: lines.map(({ coordinates }) =>
            ({type: 'Feature', properties: {}, geometry: {type: 'LineString', coordinates: coordinates.map(({lng, lat}) => [lng, lat])}})
        ),
    }
    const activeLineAsGeoJSON: Feature = {
        type: 'Feature',
        properties: {},
        geometry: {type: 'LineString', coordinates: activeLine.map(({lng, lat}) => [lng, lat])},
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

                /* Listeners that are activated when in drawing mode */
                onMouseDown={mapOnMouseDown}
                onMouseMove={mapOnMouseMove}
                onMouseOut={mapOnMouseOut}
                onMouseUp={mapOnMouseUp}
            >
                {/* Existing and active lines (converted to GeoJSON and rendered) */}
                <Source type='geojson' data={linesAsGeoJSON}>
                    <Layer id='existingLines' type='line' paint={{
                        'line-color': '#f00',
                        'line-width': 3
                    }} />
                </Source>
                <Source type='geojson' data={activeLineAsGeoJSON}>
                    <Layer id='activeLine' type='line' paint={{
                        'line-color': '#0f0',
                        'line-width': 3
                    }} />
                </Source>
            </Map>
        </MapContainer>
    );
}