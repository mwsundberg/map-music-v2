import { useState } from "react";
import { Layer, Map, Source} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import styled from "styled-components";
import { MapControls } from "./components/MapControls";

interface MapViewProps {
}

/* Preset locations */
const mapPresets = [
    {name: "Grand Canyon",            viewState: {latitude: 35.8102593, longitude: -113.6302593, zoom: 11}},
    {name: "Vancouver Mountains",     viewState: {latitude: 49.3822072, longitude: -123.1363749, zoom: 12}},
    {name: "University of Rochester", viewState: {latitude: 43.1289624, longitude: -77.62912500, zoom: 16}},
    {name: "Mount Everest",           viewState: {latitude: 27.9881199, longitude:  86.91622030, zoom: 11}},
    {name: "Death Valley",            viewState: {latitude: 36.3885879, longitude: -116.8938400, zoom: 10}},
    {name: "Shenandoah River",        viewState: {latitude: 38.8879720, longitude: -78.36221690, zoom: 12}},
    {name: "Appalachian Mountains",   viewState: {latitude: 37.0133000, longitude: -81.48799896, zoom: 11}},
];


/* Styled divs used in the MapView */
const MapContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

/** Map with controls for a location bookmark system */
export function MapView({...props}: MapViewProps) {
    const [mapInputMode, setMapInputMode] = useState<'panning'|'drawing'>('panning');
    const [mapViewState, setMapViewState] = useState(mapPresets[0].viewState);

    return (
        <MapContainer {...props}>
            <MapControls {...{mapInputMode, setMapInputMode, mapViewState, setMapViewState}} presets={mapPresets} />
            <Map
                reuseMaps
                {...mapViewState}
                onMove={(ev) => setMapViewState(ev.viewState)}
                >
                <Source id='mapterhorn-dem' type='raster-dem' tiles={['https://tiles.mapterhorn.com/{z}/{x}/{y}.webp']} encoding='terrarium' tileSize={512} attribution='<a href="https://mapterhorn.com/attribution">© Mapterhorn</a>'>
                    <Layer id='hillshade' type='hillshade' paint={{ 'hillshade-method': 'combined' }} />
                </Source>
            </Map>
        </MapContainer>
    );

}