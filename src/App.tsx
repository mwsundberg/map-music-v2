import './App.css';
import { useState } from 'react';
import { Splitter } from './components/Splitter';

import { MapView } from './MapView';

function App() {

  const [split, setSplit] = useState(0.5);

  /* Map controls */
  const [mapInputMode, setMapInputMode] = useState('panning');
  
  return (
    <Splitter vertical split={0.8} slot1={
      <Splitter split={split} slot1={
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
