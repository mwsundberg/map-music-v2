import type { Line } from "../App"

interface LineRendererProps {
    line: Line|undefined
}

export function LineRenderer({line}: LineRendererProps) {
    return (
        <div>Line Render: {line?.elevationsResampled.join(', ')}</div>
    )
}