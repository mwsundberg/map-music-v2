import { useState } from 'react';
import { Splitter } from './components/Splitter';

import { MapView } from './MapView';
import { MapProvider } from 'react-map-gl/maplibre';

function App() {

  const [splitHorizontal, setSplitHorizontal] = useState(0.8);
  const [splitVertical, setSplitVertical] = useState(0.8);


  const [lines, setLines] = useState([]);
  
  return (
    <Splitter vertical split={splitVertical} setSplit={setSplitVertical} slot1={
      <Splitter split={splitHorizontal} setSplit={setSplitHorizontal} slot1={
        <MapProvider>
          <MapView lines={lines} addLine={(line) => setLines([...lines, line])} />
        </MapProvider>
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
