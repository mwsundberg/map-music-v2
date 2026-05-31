import { useEffect, useState } from 'react';
import Splitter from './components/Splitter';

import MapView from './MapView';
import styled from 'styled-components';
import LineControls from './components/LineControls';
import LineRenderer from './components/LineRenderer';
import Button from './components/Button';
import { Frequency } from 'tone';
import useLines, { type ResampleSettings, type MusicSettings } from './useLines';

/* Splitter panels & wrapper to give padding */
const PanelStyled = styled.section`
  width: 100%;
  min-height: 100%;
  background-color: var(--background);
  border-radius: 3px;
`;


function App() {
  const [splitHorizontal, setSplitHorizontal] = useState(0.8);
  const [splitVertical, setSplitVertical] = useState(0.8);

  /* Settings state */
  const [livePreview, setLivePreview] = useState(true);
  const [resampleSettings, setResampleSettingsRaw] = useState<ResampleSettings>({
    smoothingFactor: 0.25,
    mode: 'distance',
    count: 50,
    distance: 500,
    units: 'meters',
  });
  const [musicSettings, setMusicSettingsRaw] = useState<MusicSettings>({
    synth: 'classic',
    lowNote: Frequency(24, 'midi').toFrequency(),
    highNote: Frequency(84, 'midi').toFrequency(),
    noteTime: 125,
    roundNotes: false,
  });

  /* Lines state from the helper hook */
  const {
    lines,
    activeLineId,
    setActiveLineId,
    activeLine,
    addLine,
    removeLine,
    updateLine,
    updateResampleSettings,
    updateMusicSettings,
  } = useLines(resampleSettings, musicSettings, livePreview);

  /* Wrap setters for the resample and music settings to also include updates to the active line, if one is selected */
  function setResampleSettings(resampleSettings: ResampleSettings) {
    if(activeLine) {
      updateResampleSettings(resampleSettings);
    }
    setResampleSettingsRaw(resampleSettings);
  }
  function setMusicSettings(musicSettings: MusicSettings) {
    if(activeLine) {
      updateMusicSettings(musicSettings);
    }
    setMusicSettingsRaw(musicSettings);
  }

  /* Keep settings state reflective of the active line. Listening for `activeLine.id` changes so settings changes don't trigger an infinite loop */
  useEffect(()=>{
    if(activeLine) {
      setResampleSettingsRaw(activeLine.resampleSettings);
      setMusicSettingsRaw(activeLine.musicSettings);
    }
  }, [activeLine?.id]);
  
  return (
    <Splitter vertical split={splitVertical} setSplit={setSplitVertical} slot1={
      <Splitter split={splitHorizontal} setSplit={setSplitHorizontal} slot1={
        <PanelStyled style={{height: '100%'} /* Needed since the map doesn't handle implicit sizing well */}>
          <MapView
            lines={lines}
            activeLineId={activeLineId}
            setActiveLineId={setActiveLineId}
            addLine={addLine} />
        </PanelStyled>
      } slot2={
        <PanelStyled>
          <LineControls {...{activeLine, updateLine, removeLine, livePreview, setLivePreview, resampleSettings, setResampleSettings, musicSettings, setMusicSettings}}/>
        </PanelStyled>
      } />
    } slot2={
      <PanelStyled>
        Audio scrubbers
        <ul>
          {lines.map((l)=>(<li key={l.id}><LineRenderer line={l} /></li>))}
        </ul>
        <Button onClick={()=>setActiveLineId(lines[0]?.id)}>Set first line to be active</Button>
      </PanelStyled>
    } />
  )
}

export default App
