import * as d3 from "d3";
import { useEffect, useState } from "react";
import ResourceMenu from "../ResourceMenu";

const ExitPoint = ({
    data,
    activitiesState,
    tooltipRef,
    transform,
    xScale,
    yScale,
    enrolledLearner,
    setAlertOpen,
    handleActivateUpdate,
    handleDeactivateUpdate,
}) => {
    const [menuPosition, setMenuPosition] = useState(null);

    function updateMenuPosition(newtransform, originalMenuPosition) {
        const adjustedX = transform.invertX(originalMenuPosition.x);
        const adjustedY = transform.invertY(originalMenuPosition.y - 80);
        setMenuPosition({ x: adjustedX, y: adjustedY });
    }

    const handleGroupClick = (event) => {
        const userType = localStorage.getItem("type");
        if (userType === "TEACHER") {
            const originalMenuPosition = { x: event.clientX, y: event.clientY };
            updateMenuPosition(transform, originalMenuPosition);
        }
    };

    const handleClose = () => setMenuPosition(null);

    const handleClick = async (event) => {
        if (isWithinCoverage) {
            // wuh
        } else {
            setAlertOpen(true);
            event.preventDefault();
        }
    };
    const handleMouseOver = (event) => {
        const tooltip = d3.select(tooltipRef.current);
        tooltip
            .style("visibility", "visible")
            .html(
                `<div>
                <strong>Exit Point</strong><br>
                <strong>Position:</strong> ${data.x.toFixed(3)},${data.y.toFixed(3)}
        </div>`
            )
            .style("left", `${event.pageX}px`)
            .style("top", `${event.pageY - 125}px`);

        d3.select(`#text-${data.index}`).style("visibility", "hidden");
    };

    const handleMouseMove = (event) => {
        const tooltip = d3.select(tooltipRef.current);
        tooltip
            .style("left", `${event.pageX}px`)
            .style("top", `${event.pageY - 125}px`);
    };

    const handleMouseOut = () => {
        const tooltip = d3.select(tooltipRef.current);
        tooltip.style("visibility", "hidden");

        d3.select(`#text-${data.index}`).style("visibility", "visible");
    };
    useEffect(() => {
        const tooltip = d3.select(tooltipRef.current);
        tooltip.style("visibility", "hidden");
    }, [transform.k, tooltipRef]);

    const visitedResourceIds = (activitiesState[0] || []).map(
        (activity) => activity.resource_id
    );
    const isVisited = visitedResourceIds.includes(data.id);

    const isWithinCoverage = (
        enrolledLearner?.accessible_resources || []
    ).includes(data.id);
    const inverseScale = Math.min(1 / transform.k, 1.1);

    if (!data.x || !data.y) return <></>;
    return (
        <>
            {localStorage.getItem("type") === "TEACHER" ? (
                <>
                    <g onClick={handleGroupClick}>
                        <circle
                            cx={xScale(data.x)}
                            cy={yScale(data.y)}
                            r={15 * inverseScale}
                            fill={
                                isVisited ? "orange" : isWithinCoverage ? "#D1E9F6" : "white"
                            }
                            stroke="black"
                            strokeWidth={2 * inverseScale}
                            onMouseOver={handleMouseOver}
                            onMouseMove={handleMouseMove}
                            onMouseOut={handleMouseOut}
                        />
                        <text
                            x={xScale(data.x)}
                            y={yScale(data.y)}
                            fontSize={`${18 * inverseScale}px`}
                            fontFamily="FontAwesome"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            onMouseOver={handleMouseOver}
                            onMouseMove={handleMouseMove}
                            onMouseOut={handleMouseOut}
                        >
                            {"\uf08b"}
                        </text>
                    </g>
                    <ResourceMenu
                        data={data}
                        menuPosition={menuPosition}
                        rType={data.type == 2 ? "Quiz" : "Resource"}
                        handleClose={handleClose}
                        handleActivateUpdate={handleActivateUpdate}
                        handleDeactivateUpdate={handleDeactivateUpdate}
                        isWithinCoverage={isWithinCoverage}
                        inverseScale={inverseScale}
                    />
                </>
            ) : (
                <g>
                    <circle
                        cx={xScale(data.x)}
                        cy={yScale(data.y)}
                        r={15 * inverseScale}
                        fill={isVisited ? "orange" : isWithinCoverage ? "#D1E9F6" : "white"}
                        stroke="black"
                        strokeWidth={2 * inverseScale}
                        onClick={handleClick}
                        onMouseOver={handleMouseOver}
                        onMouseMove={handleMouseMove}
                        onMouseOut={handleMouseOut}
                    />
                    <text
                        x={xScale(data.x)}
                        y={yScale(data.y)}
                        fontSize={`${15 * inverseScale}px`}
                        fontFamily="FontAwesome"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        onMouseOver={handleMouseOver}
                        onMouseMove={handleMouseMove}
                        onMouseOut={handleMouseOut}
                        onClick={handleClick}
                    >
                        {"\uf08b"}
                    </text>
                </g>
            )}
        </>
    );
};

export default ExitPoint;