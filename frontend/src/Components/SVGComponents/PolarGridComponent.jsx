// Component that renders a polar grid with customizable origin, number of arcs, lines, and scaling functions.
import React from 'react';

export const PolarGridComponent = ({
  origin = { x: 0, y: 0 },
  lineCount = 15,
  arcCount = 15,
  xRadius = 1000,
  yRadius = 1000,
  xScale = x => x,
  yScale = y => y,
}) => {
  const scaledOrigin = {
    x: xScale(origin.x),
    y: yScale(origin.y)
  };
  const arcs = [];
  for (let i = 1; i <= arcCount; i++) {
    const radiusX = i / arcCount * xRadius;
    const radiusY = i / arcCount * yRadius;
    const startX = xScale(origin.x + radiusX);
    const startY = yScale(origin.y);
    const endX = xScale(origin.x);
    const endY = yScale(origin.y + radiusY);
    arcs.push(
      <path
        key={`arc-${i}`}
        d={`M ${startX} ${startY}
          A ${startX - scaledOrigin.x} ${endY - scaledOrigin.y}
          0 0 0 ${endX} ${endY}`}
        fill="none"
        stroke="#aaa"
        strokeWidth="1"
      />
    );
  }

  const lines = [];
  for (let i = 0; i <= lineCount; i++) {
    const angle = (Math.PI / 2) * i / lineCount;
    const endX = xScale(origin.x + Math.cos(angle) * xRadius);
    const endY = yScale(origin.y + Math.sin(angle) * yRadius);
    lines.push(
      <line
        key={`line-${i}`}
        x1={scaledOrigin.x}
        y1={scaledOrigin.y}
        x2={endX}
        y2={endY}
        stroke="#aaa"
        strokeWidth="1"
      />
    );
  };

  return (
    <>
      {arcs}
      {lines}
    </>
  );
};

export default PolarGridComponent;
