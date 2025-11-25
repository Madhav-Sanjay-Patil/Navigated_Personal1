// HexModule component renders hexagonal hulls for each module in the data.
// It uses D3.js to group, calculate, and display convex hulls based on x and y coordinates.
// The component is also responsible for rendering module information (e.g., module index, name) at the centroid of each hull.
// Additionally, it handles mouse events to display and position a tooltip with module details when hovering over the hulls.
import React, { useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { polygonHull } from 'd3-polygon'
const HexModule = ({ data, xScale, yScale, inverseScale }) => {
    const tooltipRef = useRef(null);

    const colorPalette = [
        'rgba(54, 162, 235, 0.3)',
        'rgba(0, 255, 127, 0.2)',
        'rgba(203, 255, 169,0.5)',
        'rgba(240, 230, 140, 0.3)',
        'rgba(246, 245, 242,0.6)',
        'rgba(255, 239, 239,0.6)',
        'rgb(212, 226, 212,0.6)',
        'rgba(230, 255, 253,0.6)',
        'rgba(255, 191, 169,0.6)',
        'rgba(251, 255, 177,0.6)',
        'rgba(255, 209, 227,0.6)',
        'rgba(229, 224, 255,0.6)',
        'rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.3)', 'rgba(255, 206, 86, 0.3)',
        'rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.3)', 'rgba(255, 159, 64, 0.3)',
        'rgba(255, 105, 180, 0.5)', 'rgba(139, 69, 19, 0.3)', 'rgba(0, 128, 128, 0.3)',
        'rgba(70, 130, 180, 0.3)', 'rgba(0, 255, 127, 0.2)', 'rgba(255, 140, 0, 0.3)',
        'rgba(220, 20, 60, 0.3)', 'rgba(34, 139, 34, 0.3)', 'rgba(218, 112, 214, 0.3)',
        'rgba(255, 69, 0, 0.3)', 'rgba(154, 205, 50, 0.3)', 'rgba(46, 139, 87, 0.3)',
        'rgba(123, 104, 238, 0.3)',
    ];

    // Group data by module_id
    const groupedData = useMemo(() => d3.group(data, d => d.module_id), [data]);

    // Calculate hulls for each group
    const hulls = useMemo(() => {
        return Array.from(groupedData).map(([module_id, points], index) => {
            const pointArray = points.map(point => [xScale(point.x), yScale(point.y)]);
            const hull = polygonHull(pointArray);
            const centroid = hull ? d3.polygonCentroid(hull) : null;
            return { module_id, hull, points, centroid, color: colorPalette[index % 20] };
        });
    }, [groupedData, xScale, yScale]);

    // Mouse event handlers
    const handleMouseOver = (event, hullGroup) => {
        const tooltip = d3.select(tooltipRef.current);
        tooltip
            .style('visibility', 'visible')
            .html(`<div><strong>Module:</strong> ${hullGroup.module_id}</div>`)
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY + 10}px`);

        d3.select(`#text-${hullGroup.module_id}`).style('visibility', 'visible');
    };

    const handleMouseMove = event => {
        const tooltip = d3.select(tooltipRef.current);
        tooltip
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY + 10}px`);
    };

    const handleMouseOut = hullGroup => {
        const tooltip = d3.select(tooltipRef.current);
        tooltip.style('visibility', 'hidden');

        d3.select(`#text-${hullGroup.module_id}`).style('visibility', 'hidden');
    };

    return (
        <g>
            {/* First loop: render all the hulls */}
            {hulls.map((hullGroup, index) => (
                <g
                    key={index}
                    onMouseOver={event => handleMouseOver(event, hullGroup)}
                    onMouseMove={handleMouseMove}
                    onMouseOut={() => handleMouseOut(hullGroup)}
                >
                    {hullGroup.hull && (
                        <path
                            d={d3.line()
                                .x(d => d[0])
                                .y(d => d[1])
                                .curve(d3.curveCatmullRomClosed)(hullGroup.hull)}
                            fill={hullGroup.color}
                            stroke="lightblue"
                            strokeWidth={2 * inverseScale}
                            strokeDasharray="8,6"
                            style={{ pointerEvents: 'all', cursor: 'pointer' }}
                        />
                    )}
                </g>
            ))}

            {/* Second loop: render all the text elements after the hulls */}
            {hulls.map((hullGroup, index) => (
                hullGroup.centroid && (
                    <text
                        key={`text-${index}`}
                        id={`text-${hullGroup.module_id}`}
                        x={hullGroup.centroid[0]}
                        y={hullGroup.centroid[1]}
                        textAnchor="middle"
                        style={{
                            pointerEvents: 'none',
                            fontSize: 14 * inverseScale,
                            fontWeight: 'bolder',
                            fill: 'black',
                            visibility: 'hidden',
                        }}
                    >
                        <tspan x={hullGroup.centroid[0]} dy="0em">
                            {`Module Index: ${hullGroup.module_id}`}
                        </tspan>
                        <tspan x={hullGroup.centroid[0]} dy="1.2em">
                            {`Module Name: ${hullGroup.points[0].module}`}
                        </tspan>
                    </text>
                )
            ))}

            {/* Tooltip element */}
            <foreignObject width="100" height="50">
                <div ref={tooltipRef} style={{ position: 'absolute', visibility: 'hidden', backgroundColor: 'white', padding: '5px', border: '1px solid black' }} />
            </foreignObject>
        </g>
    );
};

export default HexModule;
