import { useEffect, useMemo, useState } from 'react';
import { Splitter } from './components/Splitter';

import { MapView } from './MapView';
import { MapProvider } from 'react-map-gl/maplibre';
import type { Feature, LineString } from 'geojson';
import styled from 'styled-components';
import { LineControls } from './components/LineControls';
import { LineRenderer } from './components/LineRenderer';
import { resampleCoords } from './lineResampling';
import { Button } from './components/Button';

export type ResampleSettings = {
  /** How much to smooth the line, range [0,1] */
  smoothingFactor: number,
  mode: 'count'|'distance',
  /** The number of coordinates to resample to (ignored if resampling by distance) */
  count: number,
  /** The distance in meters to resample by (ignored if resampling by count) */
  distance: number,
}

export type MusicSettings = {
  synth: 'classic'|'duo',
  /** TODO Could be based on absolute elevation */
  lowNote: number,
  highNote: number,
  /** Length of a single note in ms (do the math if wanting to set the total clip length) */
  noteTime: number,
}

export type Line = {
  /** UUID made on generation from map */
  id: string,

  /** Name of the line */
  name: string|undefined,

  /** Raw input coordinates that make up the line, `{lng, lat}` objects */
  coordinatesRaw: Feature<LineString>,
  /** Resampled into evenly spaced points along the original line, with optional smoothing */
  coordinatesResampled: Feature<LineString>,
  /** Elevation in meters measured along `coordinatesResampled` */
  elevationsResampled: number[],

  /** Resampling settings */
  resampleSettings: ResampleSettings,

  /** Music generation settings */
  musicSettings: MusicSettings,
}

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

  /* Settings state */
  const [resampleSettings, setResampleSettings] = useState<ResampleSettings>({
    smoothingFactor: 0.25,
    mode: 'count',
    count: 50,
    distance: 1,
  });
  const [musicSettings, setMusicSettings] = useState<MusicSettings>({
    synth: 'classic',
    lowNote: 24,
    highNote: 84,
    noteTime: 500,
  });

  /* Lines state */
  const [lines, setLines] = useState<Line[]>([]);
  const [activeLineId, setActiveLineId] = useState<string|undefined>(undefined);
  const activeLine: Line|undefined = useMemo(() =>
    lines.filter(
      ({id}) => (id === activeLineId)
    )?.[0],
    [lines, activeLineId]);
  const setActiveLine = (line: Line) =>
    setLines(lines.map((l)=>{
      if(l.id === activeLineId) return line;
      else return l;
    }));
  const removeLine = (lineId: string) => {
    if(activeLineId === lineId) setActiveLineId(undefined);
    setLines(lines.filter(({id})=>(id !== lineId)));
  }

  const makeNewLine = ({id, coordinatesRaw}: Pick<Line, 'id'|'coordinatesRaw'>) => {
    const newLine: Line = {
      id: id,
      coordinatesRaw: coordinatesRaw,
      name: undefined,
      coordinatesResampled: resampleCoords(coordinatesRaw, resampleSettings),
      elevationsResampled: [],
      resampleSettings: resampleSettings,
      musicSettings: musicSettings,
    };
    setLines([...lines, newLine]);
    setActiveLineId(newLine.id);
  }

  /* Keep settings state reflective of active line */
  useEffect(()=>{
    if(activeLine) {
      setResampleSettings(activeLine.resampleSettings);
      setMusicSettings(activeLine.musicSettings);
    }
  }, [activeLine]);
  
  return (
    <MapProvider>
      <Splitter vertical split={splitVertical} setSplit={setSplitVertical} slot1={
        <Splitter split={splitHorizontal} setSplit={setSplitHorizontal} slot1={
          <PanelStyled>
            <MapView
              lines={lines}
              activeLineId={activeLineId}
              setActiveLineId={setActiveLineId}
              addLine={makeNewLine} />
          </PanelStyled>
        } slot2={
          <PanelStyled>
            <LineControls {...{activeLine, setActiveLine, removeLine, resampleSettings, setResampleSettings, musicSettings, setMusicSettings}}/>
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
    </MapProvider>
  )
}

export default App
