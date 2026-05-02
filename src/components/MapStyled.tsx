import { useEffect, useRef } from 'react';
import { Map, useMap } from 'react-map-gl/maplibre';
import mlcontour from 'maplibre-contour';
import { elevationColorMap } from '../mapConfig';


export const MapStyled: typeof Map = ({children, ...props}) => {
    const {default: mapRef} = useMap();
    const contourDemRef = useRef<DemSource /* TODO */>(null);

    /* Add the contours layer */
    useEffect(()=>{
        if(!contourDemRef.current && mapRef) {
            console.log(mapRef)
            contourDemRef.current = new mlcontour.DemSource({
                url: 'https://tiles.mapterhorn.com/{z}/{x}/{y}.webp',
                encoding: 'terrarium',
                maxzoom: 12,
                worker: true
            });
            contourDemRef.current.setupMaplibre(mapRef);
        }
    }, [mapRef]);


    return (<Map {...props}
        mapStyle={{
            version: 8,
            sources: {
                'demSource': {
                    type: 'raster-dem',
                    tiles: [contourDemRef.current?.sharedDemProtocolUrl],
                    encoding: 'terrarium',
                    tileSize: 512,
                    maxzoom: 17
                },
                'contourSource': {
                    type: 'vector',
                    tiles: [
                        contourDemRef.current?.contourProtocolUrl({
                            thresholds: {
                                12: [100, 500],
                                14: [20, 100]
                            },
                            elevationKey: 'ele',
                            levelKey: 'level',
                            contourLayer: 'contours',
                            buffer: 1,
                            overzoom: 2,
                        })
                    ],
                    maxzoom: 17
                }
            },
            layers: [
                {
                    /* Elevation coloring copied from original app */
                    id: 'colorRelief',
                    type: 'color-relief',
                    source: 'demSource',
                    paint: {
                        'color-relief-color': [
                            'interpolate',
                            ['linear'],
                            ['elevation'],
                            /* Flatten the elevation keyed color map into an array and insert it here */
                            /* @ts-ignore (key type confusion) */
                            ...Object.keys(elevationColorMap).sort().map((el)=>[parseInt(el), elevationColorMap[el]]).flat()
                        ]
                    }
                }, {
                    id: 'hills',
                    type: 'hillshade',
                    source: 'demSource',
                    paint: {
                        'hillshade-method': 'combined',
                    }
                }, {
                    id: 'contours',
                    type: 'line',
                    source: 'contourSource',
                    'source-layer': 'contours',
                    paint: {
                        'line-color': 'hsl(100, 100%, 20%)',
                        'line-width': ['match', ['get', 'level'], 1, 1, 0.5],
                    },
                },
            ],
            terrain: {
                source: 'demSource',
                exaggeration: 1,
            },
            sky: {}
        }}>
        {children}
    </Map>)
}