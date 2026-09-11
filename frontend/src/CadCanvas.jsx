import React, { useState, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';

export default function CadCanvas() {
  const [lines, setLines] = useState([]);
  const [currentPoints, setCurrentPoints] = useState([]);
  const GRID_SIZE = 40;
  const stageRef = useRef(null);

  const getSnapped = (stage) => {
    const transform = stage.getAbsoluteTransform().copy().invert();
    const raw = transform.point(stage.getPointerPosition());
    return { x: Math.round(raw.x / GRID_SIZE) * GRID_SIZE, y: Math.round(raw.y / GRID_SIZE) * GRID_SIZE };
  };

  const handleStageClick = (e) => {
    const snapped = getSnapped(e.target.getStage());
    if (currentPoints.length === 0) {
      setCurrentPoints([snapped.x, snapped.y]);
    } else {
      setLines([...lines, { points: [...currentPoints, snapped.x, snapped.y] }]);
      setCurrentPoints([]);
    }
  };

  return (
    <Stage width={window.innerWidth} height={window.innerHeight} ref={stageRef} onClick={handleStageClick} style={{backgroundColor: '#1a1a1a'}}>
      <Layer>
        {lines.map((l, i) => <Line key={i} points={l.points} stroke="#00ffcc" strokeWidth={3} />)}
      </Layer>
    </Stage>
  );
}
