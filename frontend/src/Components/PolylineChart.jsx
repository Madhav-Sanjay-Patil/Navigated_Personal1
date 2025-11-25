// The PolylineChart component generates a dynamic SVG chart based on a polyline dataset and topic data. 
// It uses React's state management to track tooltip visibility and position, showing detailed values when a user 
// hovers over data points. The chart scales the y-axis based on the polyline values, adjusting for padding and ensuring 
// proper display of axis labels and grid lines. The component also maps over the polyline data to create corresponding 
// points on the graph, with hover interactions that display assimilation values and associated topic names. 
// The topicData is filtered by course ID to generate a legend of topic names displayed below the chart. 
// It supports user interaction through mouse hover events, providing both real-time data point details and a 
// visual guide to topics for contextual understanding.

import React, { useState } from "react";

const PolylineChart = ({ polyline, topicData }) => {
    const [tooltip, setTooltip] = useState({ display: false, x: 0, y: 0, value: 0 });

    // Get polyline data
    const currLearner = JSON.parse(localStorage.getItem("currentLearner"));
    const initialPolyline = polyline && polyline.length > 0 ? polyline : currLearner?.polyline || [];
    const flattenedPolyline = Array.isArray(initialPolyline) ? initialPolyline.flat() : [];

    // Calculate dynamic y-axis scale
    const dataValues = flattenedPolyline.length > 0 ? flattenedPolyline : [0];
    let dataMin = Math.min(...dataValues);
    let dataMax = Math.max(...dataValues);

    if (dataMin === dataMax) {
        dataMin = Math.max(0, dataMin - 0.1);
        dataMax = Math.min(1, dataMax + 0.1);
    } else {
        const padding = (dataMax - dataMin) * 0.1;
        dataMin = Math.max(0, dataMin - padding);
        dataMax = Math.min(1, dataMax + padding);
    }

    // Chart dimensions
    const svgWidth = 500;
    const svgHeight = 300;
    const padding = 60;

    // Generate y-axis labels
    const yAxisLabels = [];
    const numYLabels = 5;
    for (let i = 0; i < numYLabels; i++) {
        yAxisLabels.push(dataMin + (i / (numYLabels - 1)) * (dataMax - dataMin));
    }

    // Calculate points with dynamic scaling
    const points = flattenedPolyline.map((value, index) => {
        const x = padding + (index / (flattenedPolyline.length - 1 || 1)) * (svgWidth - 2 * padding);
        const yScale = (value - dataMin) / (dataMax - dataMin);
        const y = svgHeight - padding - yScale * (svgHeight - 2 * padding);
        return { x, y, value, index };
    });

    const handleMouseEnter = (event, value) => {
        setTooltip({ display: true, x: event.clientX, y: event.clientY, value });
    };

    const handleMouseLeave = () => {
        setTooltip({ ...tooltip, display: false });
    };

    // Get topic names for the course_id (assuming course_id is part of topicData)
    const courseId = topicData[0]?.course_id; // Assuming you have a way to fetch the course_id
    const topicNames = topicData.filter(topic => topic.course_id === courseId);

    return (
        <div>
            <svg width={svgWidth} height={svgHeight} style={{ border: "1px solid black" }}>
                {/* Axes */}
                <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="black" />
                <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="black" />

                {/* Y-Axis Labels and Grid */}
                {yAxisLabels.map((label, index) => {
                    const y = svgHeight - padding - ((label - dataMin) / (dataMax - dataMin)) * (svgHeight - 2 * padding);
                    return (
                        <g key={index}>
                            <text x={padding - 10} y={y} textAnchor="end" dominantBaseline="middle">
                                {label.toFixed(2)}
                            </text>
                            <line x1={padding} x2={svgWidth - padding} y1={y} y2={y} stroke="lightgray" strokeDasharray="5,5" />
                        </g>
                    );
                })}

                {/* X-Axis Labels */}
                {points.map(({ x, index }) => (
                    <g key={index}>
                        <text x={x} y={svgHeight - padding + 20} textAnchor="middle">{index + 1}</text>
                        <line x1={x} x2={x} y1={padding} y2={svgHeight - padding} stroke="lightgray" strokeDasharray="5,5" />
                    </g>
                ))}
                {/* Y-Axis Title */}
                <text x={padding - 50} y={svgHeight / 2} textAnchor="middle" dominantBaseline="middle" transform={`rotate(-90, ${padding - 50}, ${svgHeight / 2})`}>
                    Assimilation
                </text>

                {/* X-Axis Title */}
                <text x={svgWidth / 2} y={svgHeight - padding + 40} textAnchor="middle">Topic Index</text>
                {/* Polyline */}
                <polyline
                    points={points.map(({ x, y }) => `${x},${y}`).join(" ")}
                    style={{ fill: "none", stroke: "blue", strokeWidth: 2 }}
                />

                {/* Data Points */}
                {points.map(({ x, y, value, index }) => (
                    <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r={4}
                        fill="blue"
                        onMouseEnter={(e) => handleMouseEnter(e, value)}
                        onMouseLeave={handleMouseLeave}
                        title={`Assimilation: ${value.toFixed(3)}\nTopic: ${topicData[index]?.name || "Unknown"}`}
                    />
                ))}
            </svg>

            {tooltip.display && (
                <div style={{
                    position: "fixed",
                    left: tooltip.x + 15,
                    top: tooltip.y + 15,
                    backgroundColor: "white",
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}>
                    Assimilation: <strong>{tooltip.value.toFixed(3)}</strong>
                </div>
            )}

            {/* Legend Display for Topics (Side by Side) */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                <strong>Topic Legend:</strong>
                {topicNames.map((topic, index) => (
                    <div key={index} style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '5px' }}>{topic.name}:</span>
                        <span>{index + 1}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PolylineChart;
