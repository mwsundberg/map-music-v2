import { useState } from 'react';
import { Splitter } from './components/Splitter';

import { MapView, type Line } from './MapView';
import { MapProvider } from 'react-map-gl/maplibre';
import styled from 'styled-components';

/* Splitter panels & wrapper to give padding */
const PanelStyled = styled.section`
  width: 100%;
  height: 100%;
  background-color: var(--background);
  border-radius: 3px;
`;


function App() {

  const [splitHorizontal, setSplitHorizontal] = useState(0.8);
  const [splitVertical, setSplitVertical] = useState(0.8);


  const [lines, setLines] = useState<Line[]>([]);
  const [activeLine, setActiveLine] = useState<Line|undefined>(undefined);
  
  return (
    <Splitter vertical split={splitVertical} setSplit={setSplitVertical} slot1={
      <Splitter split={splitHorizontal} setSplit={setSplitHorizontal} slot1={
        <PanelStyled>
          <MapProvider>
            <MapView lines={lines} addLine={(line) => {
              setLines([...lines, line]);
              setActiveLine(line);
            }} />
          </MapProvider>
        </PanelStyled>
      } slot2={
        <PanelStyled>
          Sidebar controls
        </PanelStyled>
      } />
    } slot2={
      <PanelStyled>
        Audio scrubbers
      </PanelStyled>
    } />
  )
}

export default App
