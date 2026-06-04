import styled from 'styled-components';
import RadioSet from './RadioSet';
import Select from './Select';
import Button from './Button';
import TextInput from './TextInput';
import { useState } from 'react';

interface MapControlsProps {
	mapInputMode: 'panning'|'drawing',
	setMapInputMode: (value: 'panning'|'drawing')=>void,
	mapViewState: {latitude: number, longitude: number, zoom: number},
	setMapViewState: (value: {latitude: number, longitude: number, zoom: number})=>void,
	presets: Array<{name: string, viewState: {latitude: number, longitude: number, zoom: number}}>,
}

const ControlsContainer = styled.div`
	& > * {
		display: inline-block;
	}
`;

export default function MapControls({mapInputMode, setMapInputMode, mapViewState, setMapViewState, presets}: MapControlsProps) {
	const [mapPresets, setMapPresets] = useState(presets);
	const [mapPresetsIndex, setMapPresetsIndex] = useState(0);
	
	return (<ControlsContainer>
		<RadioSet legend='Select Mode:' options={{panning: '🖐️ Panning', drawing: '✒️ Drawing'}} checked={mapInputMode} onChange={(v)=>setMapInputMode(v)} />
		{' '}
		<label>
			Load a location:
			{' '}
			<Select
				value={mapPresetsIndex}
				options={mapPresets.map((mp)=>mp.name)}
				onChange={(val)=>{
					setMapPresetsIndex(val);
					setMapViewState(mapPresets[val].viewState);
				}}>
			</Select>
		</label>
		{' '}
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
				Bookmark current location:
				{' '}
				<TextInput name='bookmark' />
			</label>
			<Button>Save</Button>
		</form>
	</ControlsContainer>);
}