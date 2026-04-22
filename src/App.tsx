import { useState } from 'react';
import { Splitter } from './components/Splitter';

import { MapView } from './MapView';

function App() {

  const [splitHorizontal, setSplitHorizontal] = useState(0.8);
  const [splitVertical, setSplitVertical] = useState(0.8);

  /* Map controls */
  const [mapInputMode, setMapInputMode] = useState<'panning'|'drawing'>('panning');
  
  return (
    <Splitter vertical split={splitVertical} setSplit={setSplitVertical} slot1={
      <Splitter split={splitHorizontal} setSplit={setSplitHorizontal} slot1={
        <MapView mapInputMode={mapInputMode} setMapInputMode={setMapInputMode} />
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
