import { useState } from "react";
import { Layer, Map, Source} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import styled from "styled-components";
import { RadioSet } from "./components/RadioSet";
import { Button } from "./components/Button";

interface MapViewProps {
    mapInputMode: 'panning'|'drawing',
    setMapInputMode: (mode: 'panning'|'drawing')=>void
}

/* Styled divs used in the MapView */
const ControlsContainer = styled.div`
    display: flex;
    gap: 1ch;
    flex-wrap: wrap;
`;
const MapContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

/** Map with controls for a location bookmark system */
export function MapView({mapInputMode, setMapInputMode, ...props}: MapViewProps) {
    const [mapPresets, setMapPresets] = useState([
        { name: "Grand Canyon",            viewState: { latitude: 35.8102593, longitude: -113.6302593, zoom: 11 }},
        { name: "Vancouver Mountains",     viewState: { latitude: 49.3822072, longitude: -123.1363749, zoom: 12 }},
        { name: "University of Rochester", viewState: { latitude: 43.1289624, longitude: -77.62912500, zoom: 16 }},
        { name: "Mount Everest",           viewState: { latitude: 27.9881199, longitude:  86.91622030, zoom: 11 }},
        { name: "Death Valley",            viewState: { latitude: 36.3885879, longitude: -116.8938400, zoom: 10 }},
        { name: "Shenandoah River",        viewState: { latitude: 38.8879720, longitude: -78.36221690, zoom: 12 }},
        { name: "Appalachian Mountains",   viewState: { latitude: 37.0133000, longitude: -81.48799896, zoom: 11 }},
    ]);
    const [mapPresetsIndex, setMapPresetsIndex] = useState(0);
    const [mapViewState, setMapViewState] = useState(mapPresets[mapPresetsIndex].viewState);

    return (
        <MapContainer {...props}>
            <ControlsContainer>
                <RadioSet legend='Select Mode:' options={{panning: ' Panning', drawing: ' Drawing'}} checked={mapInputMode} onChange={(v)=>setMapInputMode(v)} />
                <label>
                    Load a location:
                    {' '}
                    <select
                        value={mapPresetsIndex}
                        onChange={(ev) => {
                            setMapPresetsIndex(parseInt(ev.target.value));
                            setMapViewState(mapPresets[parseInt(ev.target.value)].viewState);
                        }}>
                        {mapPresets.map((mp, i) => (
                            <option key={mp.name + i} value={i}>{mp.name}</option>
                        ))}
                    </select>
                </label>
                <form onSubmit={(ev) => {
                    /* Using a form for automatic button association, adds some boilerplate */
                    ev.preventDefault();
                    const formData = new FormData(ev.target);
                    ev.target.reset();

                    const newPreset = {
                        name: formData.get('bookmark') as string,
                        viewState: mapViewState,
                    }
                    setMapPresets([...mapPresets, newPreset]);
                    setMapPresetsIndex(mapPresets.length);
                }}>
                    <label>
                        Bookmark current location:
                        {' '}
                        <input name='bookmark' type='text' />
                    </label>
                    <Button>Save</Button>
                </form>
            </ControlsContainer>
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