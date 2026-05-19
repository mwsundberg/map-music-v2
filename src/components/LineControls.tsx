import { useId } from "react";
import type { Line, MusicSettings, ResampleSettings } from "../App";
import LineRenderer from "./LineRenderer";
import RadioSet from "./RadioSet";
import TextInput from "./TextInput";
import { getElevations, resampleCoords } from "../lineResampling";
import Button from "./Button";
import Select from "./Select";
import { playLine } from "../audioGeneration";
import styled from "styled-components";
import { useMap } from "react-map-gl/maplibre";
import NumberInput from "./NumberInput";

interface LineControlsProps {
    activeLine: Line|undefined,
    setActiveLine: (value: Line)=>void,
    removeLine: (id: string)=>void,
    livePreview: boolean,
    setLivePreview: (value: boolean)=>void,
    resampleSettings: ResampleSettings,
    setResampleSettings: (value: ResampleSettings)=>void,
    musicSettings: MusicSettings,
    setMusicSettings: (value: MusicSettings)=>void,
}

const SettingsWrapperStyled = styled.div`
    padding: 1ch;
`;

export default function LineControls({activeLine, setActiveLine, removeLine, livePreview, setLivePreview, resampleSettings, setResampleSettings: setResampleSettingsRaw, musicSettings, setMusicSettings: setMusicSettingsRaw}: LineControlsProps) {
    const id = useId();

    /* Need map ref for resampling the elevations */
    const {default: mapRef} = useMap();

    /* Override the settings setters to also update the active line (if present) */
    function setResampleSettings(value: ResampleSettings) {
        setResampleSettingsRaw(value);
        if(activeLine && mapRef) {
            const coordinatesResampled = resampleCoords(activeLine.coordinatesRaw, value);
            const elevations = getElevations(mapRef, coordinatesResampled);
            setActiveLine({
                ...activeLine,
                coordinatesResampled,
                elevations,
                resampleSettings: value,
                musicSettings: { ...musicSettings },
            });
        }
    }
    function setMusicSettings(value: MusicSettings) {
        setMusicSettingsRaw(value);
        if(activeLine) setActiveLine({
            ...activeLine,
            resampleSettings: { ...resampleSettings },
            musicSettings: value,
        });
    }

    return (<>
        <LineRenderer line={activeLine} />
        <SettingsWrapperStyled>
            <section>
                <Button onClick={()=>{
                    if (activeLine){
                        removeLine(activeLine.id);
                    }
                }}>Remove</Button>
                <br />
                <label htmlFor={id+'name'}>Name: </label><TextInput id={id+'name'} value={activeLine?.name || ''} onChange={(ev)=>{if(activeLine) setActiveLine({...activeLine, name: ev.target.value})}} />
            </section>
            <section>
                <h2>Resampling Settings</h2>
                <label htmlFor={id+'smoothingFactor'}>Smoothing Factor:</label><input id={id+'smoothingFactor'} type='range' min={0} max={100} value={resampleSettings.smoothingFactor * 100} onChange={(ev)=>setResampleSettings({...resampleSettings, smoothingFactor: parseInt(ev.target.value)/100})} />
                <br />
                <RadioSet legend='Resample Mode: ' options={{'count': 'Note Count', 'distance': 'Distance'}} checked={resampleSettings.mode} onChange={(value)=>setResampleSettings({...resampleSettings, mode: value})} />
                <br />
                {resampleSettings.mode === 'count' && <>
                    <label htmlFor={id+'count'}>Number of notes: </label><NumberInput id={id+'count'} size={3} step={1} min={1} value={resampleSettings.count} onChange={(value)=>setResampleSettings({...resampleSettings, count: value})} />
                </>}
                {resampleSettings.mode === 'distance' && <>
                    <label htmlFor={id + 'distance'}>Distance between notes: </label><NumberInput id={id + 'distance'} size={5} value={resampleSettings.distance} min={0} onChange={(value)=>setResampleSettings({...resampleSettings, distance: value})} />
                    <Select options={{'meters': 'm', 'kilometers': 'km', 'feet': 'ft', 'miles': 'mi'}} value={resampleSettings.units} onChange={(value)=>setResampleSettings({...resampleSettings, units: value})} />
                </>}
            </section>
            <section>
                <h2>Synth Settings</h2>
                <RadioSet legend='Synth voice: ' options={{'classic': 'Classic', 'duo': 'Duo'}} checked={musicSettings.synth} onChange={(value)=>setMusicSettings({...musicSettings, synth: value})} />
                <label htmlFor={id+'lowNote'}>Low Note: </label><NumberInput id={id+'lowNote'} step={1} min={0} size={3} value={musicSettings.lowNote} onChange={(value)=>setMusicSettings({...musicSettings, lowNote: value})} />
                <br />
                <label htmlFor={id+'highNote'}>High Note: </label><NumberInput id={id+'highNote'} step={1} min={0} size={3} value={musicSettings.highNote} onChange={(value)=>setMusicSettings({...musicSettings, highNote: value})} />
            </section>
            <section>
                <h2>Playback Settings</h2>
                <input id={id+'livePreview'} type='checkbox' checked={livePreview} onChange={(ev)=>setLivePreview(ev.target.checked)} /><label htmlFor={id+'livePreview'}>Play live preview after drawing</label>
                {activeLine && <>
                    <br />
                    <Button onClick={()=>playLine(activeLine)}>Play Audio</Button>
                </>}
            </section>
        </SettingsWrapperStyled>
    </>);
}