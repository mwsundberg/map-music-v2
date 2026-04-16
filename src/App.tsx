import './App.css'
import { useState } from 'react';
import { Splitter } from './components/Splitter'

function App() {

  const [split, setSplit] = useState(0.5);
  
  return (
    <Splitter vertical split={0.8} slot1={
      <Splitter split={split} slot1={
        <>
          Map
          <input type='range' min={0} max={100} value={split * 100} onChange={(ev) => setSplit(parseInt(ev.target.value) / 100)} />
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
