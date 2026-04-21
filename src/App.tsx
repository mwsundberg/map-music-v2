import './App.css';
import { useState } from 'react';
import { Splitter } from './components/Splitter';

import { Layer, Map, Source} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

function App() {

  const [split, setSplit] = useState(0.5);
  const [mapViewState, setMapViewState] = useState({
    longitude: -113.6302593801,
    latitude: 35.81025936,
    zoom: 11,
  });

  
  return (
    <Splitter vertical split={0.8} slot1={
      <Splitter split={split} slot1={
        <>
          Map
          <Map
            reuseMaps
            {...mapViewState}
            onMove={(ev)=>setMapViewState(ev.viewState)}>
              <Source id='mapterhorn-dem' type='raster-dem' tiles={['https://tiles.mapterhorn.com/{z}/{x}/{y}.webp']} encoding='terrarium' tileSize={512} attribution='<a href="https://mapterhorn.com/attribution">© Mapterhorn</a>'>
                <Layer id='hillshade' type='hillshade' paint={{'hillshade-method': 'igor'}} />
              </Source>
          </Map>
        </>
      } slot2={
        <>
          Sidebar controls
        </>
      } />
    } slot2={
      <>
        Audio scrubbers
      </>
    } />
  )
}

export default App
