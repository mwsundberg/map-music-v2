import { useState } from "react";
import { Map, useMap, type LngLat, type MapLayerMouseEvent} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import styled from "styled-components";
import { MapControls } from "./components/MapControls";
import { mapPresets, mapStyle } from "./mapConfig";

type LngLatElevation = {
    lng: number,
    lat: number,
    elevation: number
}

interface MapViewProps {
    lines: LngLatElevation[][],
    addLine: (line: LngLatElevation[])=>void
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
                const withElevation = activeLine.map((coords) => {
                    const elevation = map?.queryTerrainElevation(coords)!;
                    return {lng: coords.lng, lat: coords.lat, elevation};
                })

                console.log(withElevation);
                addLine(withElevation);
            }

            setActiveLineDrawing(false);
        }
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
            </Map>
        </MapContainer>
    );
}