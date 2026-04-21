import './App.css';
import { useState } from 'react';
import { Splitter } from './components/Splitter';

import { Layer, Map, Source} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

function App() {

  const [split, setSplit] = useState(0.5);

  /* Map controls */
  const [mapInputMode, setMapInputMode] = useState('panning');
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
    <Splitter vertical split={0.8} slot1={
      <Splitter split={split} slot1={
        <>
          <div className='map-controls'>
            <fieldset>
              <legend>Select Mode:</legend>
              <label><input name='map-input-mode' type='radio' value='panning' checked={mapInputMode === 'panning'} onChange={(ev)=>{setMapInputMode(ev.target.value)}} /> Panning</label>
              <label><input name='map-input-mode' type='radio' value='drawing' checked={mapInputMode === 'drawing'} onChange={(ev)=>{setMapInputMode(ev.target.value)}} /> Drawing</label>
            </fieldset>
            <label>
              Load a location:
              {' '}
              <select 
                value={mapPresetsIndex}
                onChange={(ev)=>{
                  setMapPresetsIndex(parseInt(ev.target.value));
                  setMapViewState(mapPresets[parseInt(ev.target.value)].viewState);
                  }}>
                {mapPresets.map((mp, i)=>(
                  <option key={mp.name+i} value={i}>{mp.name}</option>
                ))}
              </select>
            </label>
            <form onSubmit={(ev)=>{
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
                Save a bookmark:
                {' '}
                <input name='bookmark' type='text'/>
              </label>
              <button>Save</button>
            </form>
          </div>
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
