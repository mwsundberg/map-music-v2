import { memo } from "react";

interface MapMarkerCircleProps {
  /** Size in pixels */
  size?: number|string,
  /** CSS color string */
  color: string
}

function MapMarkerCircle({size = '10px', color}: MapMarkerCircleProps) {
  return (
    <svg height={size} viewBox="0 0 20 20" style={{fill: color, stroke: 'none'}}>
      <circle cx='10' cy='10' r='10' />
    </svg>
  );
}

export default memo(MapMarkerCircle);