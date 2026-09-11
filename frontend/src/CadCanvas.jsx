import React, { useState, useRef } from 'react';
import { Stage, Layer, Line, Circle } from 'react-konva';

export default function CadCanvas({ activeProjectId, onAnalysisComplete, hoveredBeamId, lines, setLines }) {
  const [currentLinePoints, setCurrentLinePoints] = useState([]);
  const [tool, setTool] = useState('draw_line');
  const GRID_SIZE = 40;
  const stageRef = useRef(null);

  const getSnappedPosition = (stage) => {
    const transform = stage.getAbsoluteTransform().copy().invert();
    const rawPos = transform.point(stage.getPointerPosition());
    return {
      x: Math.round(rawPos.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(rawPos.y / GRID_SIZE) * GRID_SIZE
    };
  };

  const handleStageClick = (e) => {
    if (tool !== 'draw_line') return;
    const stage = e.target.getStage();
    const snapped = getSnappedPosition(stage);

    if (currentLinePoints.length === 0) {
      setCurrentLinePoints([snapped.x, snapped.y]);
    } else {
      const newLine = { points: [...currentLinePoints, snapped.x, snapped.y], layer: 'Structural_Beams' };
      const updatedLines = [...lines, newLine];
      setLines(updatedLines);
      setCurrentLinePoints([]);
      runRealTimeSafetyCheck(updatedLines);
    }
  };

  const runRealTimeSafetyCheck = async (currentLines) => {
    const beamPayload = currentLines.map((l, i) => ({ id: `beam_${i}`, points: l.points }));
    try {
      const res = await fetch('http://localhost/api/v1/structural/verify-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scale_factor: 0.05, beams: beamPayload })
      });
      const data = await res.json();
      if (data.status === 'success') onAnalysisComplete(data.results);
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <Stage width={window.innerWidth - 600} height={window.innerHeight} ref={stageRef} onClick={handleStageClick} style={{ backgroundColor: '#1a1a1a', cursor: 'crosshair' }}>
        <Layer>
          {lines.map((line, i) => {
            const isHovered = hoveredBeamId === `beam_${i}`;
            return <Line key={i} points={line.points} stroke={isHovered ? '#ff00ff' : '#00ffcc'} strokeWidth={isHovered ? 5 : 3} />;
          })}
          {currentLinePoints.length === 2 && <Circle x={currentLinePoints[0]} y={currentLinePoints[1]} radius={5} fill="#ffcc00" />}
        </Layer>
      </Stage>
    </div>
  );
}
