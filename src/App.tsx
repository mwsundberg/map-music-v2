import { useEffect, useMemo, useState } from 'react';
import { Splitter } from './components/Splitter';

import { MapView } from './MapView';
import type { Feature, LineString, MultiPoint } from 'geojson';
import styled from 'styled-components';
import { LineControls } from './components/LineControls';
import { LineRenderer } from './components/LineRenderer';
import { getElevations, resampleCoords } from './lineResampling';
import { Button } from './components/Button';
import { playLine } from './audioGeneration';
import { useMap, type MapRef } from 'react-map-gl/maplibre';

export type ResampleSettings = {
  /** How much to smooth the line, range [0,1] */
  smoothingFactor: number,
  mode: 'count'|'distance',
  /** The number of coordinates to resample to (ignored if resampling by distance) */
  count: number,
  /** The distance and unit used to resample along (ignored if resampling by count) */
  distance: number,
  units: 'meters'|'kilometers'|'feet'|'miles',
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
  coordinatesResampled: Feature<MultiPoint>,
  /** Elevation in meters measured along `coordinatesResampled` */
  elevations: number[],

  /** Resampling settings */
  resampleSettings: ResampleSettings,

  /** Music generation settings */
  musicSettings: MusicSettings,
}

/* Splitter panels & wrapper to give padding */
const PanelStyled = styled.section`
  width: 100%;
  min-height: 100%;
  background-color: var(--background);
  border-radius: 3px;
`;


function App() {
  /* Map instance is needed to get elevations from */
  const {default: mapRef} = useMap();

  const [splitHorizontal, setSplitHorizontal] = useState(0.8);
  const [splitVertical, setSplitVertical] = useState(0.8);

  /* Settings state */
  const [livePreview, setLivePreview] = useState(true);
  const [resampleSettings, setResampleSettings] = useState<ResampleSettings>({
    smoothingFactor: 0.25,
    mode: 'distance',
    count: 50,
    distance: 500,
    units: 'meters',
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
    const coordinatesResampled = resampleCoords(coordinatesRaw, resampleSettings);
    const elevations = getElevations(mapRef as MapRef, coordinatesResampled);
    const newLine: Line = {
      id: id,
      coordinatesRaw: coordinatesRaw,
      name: undefined,
      coordinatesResampled: coordinatesResampled,
      elevations: elevations,
      resampleSettings: resampleSettings,
      musicSettings: musicSettings,
    };
    setLines([...lines, newLine]);
    setActiveLineId(newLine.id);

    /* Play the audio for the line */
    if(livePreview) playLine(newLine);
  }

  /* Keep settings state reflective of active line. Listening for `activeLineId` changes so settings changes don't trigger an infinite loop */
  useEffect(()=>{
    if(activeLine) {
      setResampleSettings(activeLine.resampleSettings);
      setMusicSettings(activeLine.musicSettings);
    }
  }, [activeLineId]);
  
  return (
    <Splitter vertical split={splitVertical} setSplit={setSplitVertical} slot1={
      <Splitter split={splitHorizontal} setSplit={setSplitHorizontal} slot1={
        <PanelStyled style={{height: '100%'} /* Needed since the map doesn't handle implicit sizing well */}>
          <MapView
            lines={lines}
            activeLineId={activeLineId}
            setActiveLineId={setActiveLineId}
            addLine={makeNewLine} />
        </PanelStyled>
      } slot2={
        <PanelStyled>
          <LineControls {...{activeLine, setActiveLine, removeLine, livePreview, setLivePreview, resampleSettings, setResampleSettings, musicSettings, setMusicSettings}}/>
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
