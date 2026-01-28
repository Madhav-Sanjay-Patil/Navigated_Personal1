// LearnerMap module composes a fully interactive, zoomable SVG learning map by fetching and rendering course resources, modules,
// topics, and learner positions. It integrates multiple subcomponents—GridComponent for background grid lines, SVGComponent for 
// D3-driven pan/zoom behavior, GroupComponent as a container, CircleComponent/ModuleCircleComponent/TopicLineComponent for drawing
// resource nodes, module circles, and topic lines, LearnerAtResource and LearnerPositionComponent for showing learner locations, 
// HexModule for convex‐hull clustering, and JourneyMap for animating learner paths. The component manages state and side effects 
// to load data via API calls, calculate scales and extents, handle tooltip interactions with D3, update learner activity state, 
// and orchestrate UI controls via ButtonPanel, enabling teachers and learners to explore resources, quiz links, 
// and summary contributions in a unified map interface.

import React, { Fragment, useEffect, useRef, useState } from "react";
import { getResponseGet, getResponsePost } from "../lib/utils";
import * as d3 from "d3";
import JourneyMap from "./JourneyMap";
import HexModule from "./Hexmodule";
import ButtonPanel from "./ButtonPanel";
import LearnerPositionComponent from "./LearnerPositionComponent";
import LearnerAtResource from "./LearnerAtResource";
import {
    useNavigate,
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";
import ResourceMenu from "./ResourceMenu";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import PolarGridComponent from "./SVGComponents/PolarGridComponent";
import ExitPoint from "./SVGComponents/ExitPoint";

// Grid component
export const GridComponent = ({ width, height, step }) => {
    const lines = [];
    for (let x = 0; x <= width; x += step) {
        lines.push(
            <line
                key={`v${x}`}
                x1={x}
                y1={0}
                x2={x}
                y2={height}
                stroke="lightgrey"
                strokeWidth="1"
            />
        );
    }
    for (let y = 0; y <= height; y += step) {
        lines.push(
            <line
                key={`h${y}`}
                x1={0}
                y1={y}
                x2={width}
                y2={y}
                stroke="lightgrey"
                strokeWidth="1"
            />
        );
    }
    return <>{lines}</>;
};

// SVG component with zoom
export const SVGComponent = ({
    children,
    svgRef,
    zoomRef,
    setTransform,
    transform,
    isUpdateActive,
    setNewPos,
    handleUpdate,
    showTopicLines,
    minPoint,
    xRadius,
    yRadius,
    xScale,
    yScale,
}) => {
    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const g = svg.select("g");

        const zoom = d3
            .zoom()
            .scaleExtent([0.6, 10])
            .on("start", (event) => {
                if (
                    event.sourceEvent &&
                    event.sourceEvent.type === "mousedown" &&
                    event.sourceEvent.type !== "dblclick"
                ) {
                    svg.style("cursor", "move");
                }
            })
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
                setTransform(event.transform);
            })
            .on("end", (event) => {
                svg.style("cursor", "default");
            });

        const initialTransform = d3.zoomIdentity.translate(130, 10).scale(1.2);
        svg.call(zoom.transform, initialTransform);
        g.attr("transform", initialTransform);
        setTransform(initialTransform);
        svg.call(zoom);
        zoomRef.current = zoom;
    }, []);

    const handleSvgClick = (event) => {
        if (!isUpdateActive) return;

        const svg = d3.select(svgRef.current);
        const point = d3.pointer(event, svg.node());
        const transformedPoint = transform.invert(point);

        setNewPos({ x: transformedPoint[0], y: transformedPoint[1] });
        handleUpdate();
    };
    return (
        <svg
            ref={svgRef}
            style={{ width: "100%", height: "100%" }}
            onClick={handleSvgClick}
        >
            <g>
                {!showTopicLines &&
                    <PolarGridComponent
                        origin={minPoint}
                        xRadius={xRadius}
                        yRadius={yRadius}
                        xScale={xScale}
                        yScale={yScale}
                    />
                }
                {children}
            </g>
        </svg>
    );
};

// Group component
export const GroupComponent = ({ children }) => {
    return <>{children}</>;
};

// New ContributionIcon component
export const ContributionIcon = ({
    contribution,
    tooltipRef,
    transform,
    xScale,
    yScale
}) => {
    const handleMouseOver = (event) => {
        const tooltip = d3.select(tooltipRef.current);
        tooltip
            .style("visibility", "visible")
            .html(
                `<div>
                    <strong>Summary:</strong> ${contribution.contribution_content}<br>
                    <strong>Position:</strong> ${contribution.x_coordinate.toFixed(3)}, ${contribution.y_coordinate.toFixed(3)}
                </div>`
            )
            .style("left", `${event.pageX}px`)
            .style("top", `${event.pageY - 125}px`);
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
    };

    const inverseScale = Math.min(1 / transform.k, 1.1);

    if (!contribution.x_coordinate || !contribution.y_coordinate) return null;

    return (
        <g>
            <circle
                cx={xScale(contribution.x_coordinate)}
                cy={yScale(contribution.y_coordinate)}
                r={10 * inverseScale}
                fill="#4CAF50"
                stroke="white"
                strokeWidth={1 * inverseScale}
                onMouseOver={handleMouseOver}
                onMouseMove={handleMouseMove}
                onMouseOut={handleMouseOut}
            />
            <text
                x={xScale(contribution.x_coordinate)}
                y={yScale(contribution.y_coordinate)}
                fill="white"
                fontSize={`${10 * inverseScale}px`}
                fontFamily="FontAwesome"
                textAnchor="middle"
                dominantBaseline="middle"
                onMouseOver={handleMouseOver}
                onMouseMove={handleMouseMove}
                onMouseOut={handleMouseOut}
            >
                {"\uf040"} {/* FontAwesome pencil icon */}
            </text>
        </g>
    );
};

export const CircleComponent = ({
    data,
    activitiesState,
    tooltipRef,
    learnerPosState,
    coverageRadius,
    transform,
    enrollId,
    xScale,
    yScale,
    svgRef,
    zoomRef,
    setNewPos,
    enrolledLearner,
    setEnrolledLearner,
    handleActivateUpdate,
    handleDeactivateUpdate,
    setAlertOpen,
}) => {
    const learnerId = enrolledLearner?.learner_id;
    const courseId = enrolledLearner?.course_id;
    const navigate = useNavigate();
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
        const clickedElement = event.target.tagName.toLowerCase();
        if (isWithinCoverage) {
            if (data.type == 2) {
                event.preventDefault();
                sessionStorage.setItem("enrollId", enrollId);
                sessionStorage.setItem("courseId", courseId);
                sessionStorage.setItem("quizTitle", data.name);
                sessionStorage.setItem("quizDesc", data.description);
                const quiz_id = parseInt(data.link, 10);
                sessionStorage.setItem("quizId", quiz_id);
                sessionStorage.setItem("aType", 1);

                const response = await getResponseGet(`/quiz_questions/${quiz_id}`);
                const quizData = response?.data;

                activitiesState[1]((activities) => [
                    ...activities,
                    {
                        type: "resource",
                        name: data.name,
                        link: data.link,
                        time: new Date().toString(),
                        resource_id: data.id,
                        x: data.x,
                        y: data.y,
                    },
                ]);

                let activityData = {
                    type: "resource",
                    name: data.name,
                    link: data.link,
                    time: new Date().toISOString().slice(0, 19).replace("T", " "),
                    enroll_id: enrollId,
                    resource_id: data.id,
                    x_coordinate: data.x,
                    y_coordinate: data.y,
                };

                const response2 = await getResponsePost("/activities", activityData);
                navigate("/quiz", {
                    state: { quizData },
                });
            } else {
                let data_to_send = {
                    resource_id: data.id,
                    enroll_id: enrollId,
                };
                const response2 = await getResponsePost("/watchResource", data_to_send);
                var newPositions = response2?.data;

                learnerPosState[1]([newPositions[0], newPositions[1]]);

                const response3 = await getResponseGet(
                    `enrolledLearner/${learnerId}/${courseId}`
                );
                if (response3?.data) {
                    setEnrolledLearner(response3.data);
                    if (response3.data.x_coordinate && response2.data.y_coordinate) {
                        learnerPosState[1]([
                            Number(response3.data.x_coordinate),
                            Number(response3.data.y_coordinate),
                        ]);
                    }
                } else {
                    console.error("Failed to fetch enrolled learner data", response2);
                }
                let circleElement = null;
                if (clickedElement === "circle") {
                    circleElement = event.target;
                } else if (clickedElement === "text") {
                    const parentAnchor = event.target.closest("a");
                    circleElement = parentAnchor.querySelector("circle");
                }

                if (circleElement) {
                    circleElement.setAttribute("fill", "orange");
                }

                activitiesState[1]((activities) => [
                    ...activities,
                    {
                        type: "resource",
                        name: data.name,
                        link: data.link,
                        time: new Date().toString(),
                        resource_id: data.id,
                        x: data.x,
                        y: data.y,
                    },
                ]);

                let activityData = {
                    type: "resource",
                    name: data.name,
                    link: data.link,
                    time: new Date().toISOString().slice(0, 19).replace("T", " "),
                    enroll_id: enrollId,
                    resource_id: data.id,
                    x_coordinate: data.x,
                    y_coordinate: data.y,
                };

                const response = await getResponsePost("/activities", activityData);
            }
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
                <strong>Index:</strong> ${data.index}<br>
                <strong>Name:</strong> ${data.name}<br>
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
                            fill={data.type == 2 ? "red" : "black"}
                            fontSize={`${18 * inverseScale}px`}
                            fontFamily="FontAwesome"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            onMouseOver={handleMouseOver}
                            onMouseMove={handleMouseMove}
                            onMouseOut={handleMouseOut}
                        >
                            {data.type === 0 && "\uf1c1"}
                            {data.type === 1 && "\uf16a"}
                            {data.type === 2 && "\uf059"}
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
                <a
                    href={isWithinCoverage ? data.link : "#"}
                    target={isWithinCoverage ? "_blank" : ""}
                    rel="noopener noreferrer"
                >
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
                        fill={data.type == 2 ? "red" : "black"}
                        fontSize={`${15 * inverseScale}px`}
                        fontFamily="FontAwesome"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        onMouseOver={handleMouseOver}
                        onMouseMove={handleMouseMove}
                        onMouseOut={handleMouseOut}
                        onClick={handleClick}
                    >
                        {data.type === 0 && "\uf0f6"}
                        {data.type === 1 && "\uf16a"}
                        {data.type === 2 && "\uf059"}
                    </text>
                </a>
            )}
        </>
    );
};

export const ModuleCircleComponent = ({
    moduleData,
    activitiesState,
    tooltipRef,
    transform,
    xScale,
    yScale,
}) => {
    const handleMouseOver = (event) => {
        const tooltip = d3.select(tooltipRef.current);
        tooltip
            .style("visibility", "visible")
            .html(
                `<div>
                    <strong>Index:</strong> ${moduleData.module_id}<br>
                    <strong>Name:</strong> ${moduleData.module}<br>
                    <strong>Position:</strong> ${moduleData.x.toFixed(
                    3
                )},${moduleData.y.toFixed(3)}
                </div>`
            )
            .style("left", `${event.pageX}px`)
            .style("top", `${event.pageY - 125}px`);

        d3.select(`#text-${moduleData.id}`).style("visibility", "hidden");
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

        d3.select(`#text-${moduleData.id}`).style("visibility", "visible");
    };

    useEffect(() => {
        const tooltip = d3.select(tooltipRef.current);
        tooltip.style("visibility", "hidden");
    }, [transform.k, tooltipRef]);

    const inverseScale = Math.min(1 / transform.k, 1.1);

    return (
        <g>
            <circle
                cx={xScale(moduleData.x)}
                cy={yScale(moduleData.y)}
                r={20 * inverseScale}
                fill={"red"}
                stroke="black"
                strokeWidth={2 * inverseScale}
                onMouseOver={handleMouseOver}
                onMouseMove={handleMouseMove}
                onMouseOut={handleMouseOut}
            />
        </g>
    );
};

export const TopicLineComponent = ({
    topicName,
    coords,
    tooltipRef,
    transform,
    xScale,
    yScale,
    minPoint,
    onClick,
}) => {
    const handleMouseOver = (event) => {
        const tooltip = d3.select(tooltipRef.current);
        tooltip
            .style("visibility", "visible")
            .html(
                `<div>
                    <strong>Topic Name:</strong> ${topicName}<br>
                </div>`
            )
            .style("left", `${event.pageX}px`)
            .style("top", `${event.pageY - 125}px`);
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
    };

    useEffect(() => {
        const tooltip = d3.select(tooltipRef.current);
        tooltip.style("visibility", "hidden");
    }, [transform.k, tooltipRef]);

    const inverseScale = Math.min(1 / transform.k, 1.1);

    if (!minPoint || !coords) return null;

    return (
        <g onClick={onClick} style={{ cursor: "pointer" }}>
            <line
                x1={xScale(minPoint.x)}
                y1={yScale(minPoint.y)}
                x2={xScale(coords.x)}
                y2={yScale(coords.y)}
                stroke="#cccd"
                strokeWidth={10 * inverseScale}
                strokeDasharray={"5 2"}
                onMouseOver={handleMouseOver}
                onMouseMove={handleMouseMove}
                onMouseOut={handleMouseOut}
            />
        </g>
    );
};

const LearnerMap = ({
    activitiesState,
    learnerPosState,
    svgRef,
    zoomRef,
    enrollId,
    enrolledLearner,
    setEnrolledLearner,
    enrolledLearnersByCourse,
    courseId,
    learnerAtResourcePos,
    setLearnerAtResourcePos,
}) => {
    const [data, setData] = useState([]);
    const [moduleData, setModuleData] = useState([]);
    const [journeyData, setJourneyData] = useState([]);
    const [topicsData, setTopicsData] = useState([]);
    const [contributions, setContributions] = useState([]);
    const [exitPointsData, setExitPointsData] = useState([]);

    const mapRef = useRef(null);
    const [transform, setTransform] = useState(
        d3.zoomIdentity.translate(130, 10).scale(1.2)
    );
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const tooltipRef = useRef(null);
    const [coverageRadius] = useState(300);
    const inverseScale = Math.min(1 / transform.k, 1.1);
    const [showJourney, setShowJourney] = useState(false);
    const [showHex, setShowHex] = useState(false);
    const [showAllLearners, setShowAllLearners] = useState(false);
    const [showModules, setShowModules] = useState(true);
    const [showResources, setShowResources] = useState(true);
    const [clickedIndexes, setClickedIndexes] = useState([]);
    const [topicsLinesCoords, setTopicsLinesCoords] = useState([]);
    const [showTopicLines, setShowTopicLines] = useState(false);
    const [showContributions, setShowContributions] = useState(true);

    const loadLearnerAtResource = () => {
        const lastResourceVisitedId = activitiesState[0]?.at(-1)?.resource_id;
        const lastResourceVisited = data.find(
            (item) => item.id === lastResourceVisitedId
        );
        setLearnerAtResourcePos([lastResourceVisited?.x, lastResourceVisited?.y]);
    };

    const loadContributions = async () => {
        if (!enrollId) return;
        try {
            const response = await getResponseGet(`/contributions/positions/${enrollId}`);
            if (response?.data) {
                setContributions(response.data);
            }
        } catch (error) {
            console.error("Error loading contributions:", error);
        }
    };

    const xAccessor = (d) => Number(d.x);
    const yAccessor = (d) => Number(d.y);

    const dimensionScale = {
        width: 1000,
        height: 1000,
        ctrWidth: 1000,
        ctrHeight: 1000
    };

    const xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, xAccessor))
        .range([15, dimensionScale.ctrWidth - 15])
        .clamp(true);

    const yScale = d3
        .scaleLinear()
        .domain(d3.extent(data, yAccessor))
        .range([dimensionScale.ctrHeight - 35, 35])
        .clamp(true);

    const getXRadius = () => {
        const xExtent = d3.extent(data, xAccessor);
        return Math.abs(xExtent[1] - xExtent[0]);
    }

    const getYRadius = () => {
        const yExtent = d3.extent(data, yAccessor);
        return Math.abs(yExtent[1] - yExtent[0]);
    }

    const [minPoint, setMinPoint] = useState(null);

    const loadData = async (courseId) => {
        const response = await getResponseGet(`/resources/${courseId}`);
        if (response) {
            setData(response.data);
            const xExtent = d3.extent(response.data, xAccessor);
            const yExtent = d3.extent(response.data, yAccessor);
            const _minPoint = {
                x: xExtent[0],
                y: yExtent[0],
            };
            _minPoint['len'] = Math.sqrt((xExtent[0] - xExtent[1]) * (
                xExtent[0] - xExtent[1]) + (yExtent[0] - yExtent[1])
                * (yExtent[0] - yExtent[1]));
            setMinPoint(_minPoint);
        }
    };

    const loadModuleData = async (courseId) => {
        const response = await getResponseGet(`/moduleData/${courseId}`);
        if (response) {
            setModuleData(response.data);
        }
    };

    const loadJourney = async () => {
        const response = await getResponseGet(`/contributions/${enrollId}`);
        if (response) {
            setJourneyData(response.data);
        }
    };

    const loadTopics = async () => {
        const response = await getResponseGet(`/topics/${courseId}`);
        if (response) {
            const topicsData = response.data;
            setTopicsData(topicsData);
        }
    };

    const loadExitPoints = async () => {
        const res = await getResponseGet(`/exit-points/${courseId}`);
        if (res) {
            console.log('exit point response data', res.data);
            setExitPointsData(res.data.map((d, idx) => ({
                index: idx,
                type: 3,
                x: d[0],
                y: d[1],
            })));
        }
    }

    useEffect(() => {
        if (minPoint && topicsData) {
            const coords = [];
            for (let i = 0; i < topicsData.length; i++) {
                const arg = (Math.PI / 2) * (i / (topicsData.length - 1));
                const coord = {
                    x: minPoint.x + getXRadius() * Math.cos(arg),
                    y: minPoint.y + getYRadius() * Math.sin(arg),
                };
                coords.push(coord);
            }
            setTopicsLinesCoords(coords);
        }
    }, [minPoint, topicsData]);

    const handleCloseAlert = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }
        setAlertOpen(false);
    };

    useEffect(() => {
        loadData(courseId);
        loadModuleData(courseId);
        loadTopics();
        loadContributions();
        loadExitPoints();
    }, [courseId]);

    useEffect(() => {
        enrollId && loadJourney();
        enrollId && loadContributions();
    }, [enrollId]);

    useEffect(() => {
        loadLearnerAtResource();
    }, [activitiesState[0], enrollId]);

    const updateDimensions = () => {
        if (mapRef.current) {
            setDimensions({
                width: mapRef.current.offsetWidth,
                height: mapRef.current.offsetHeight,
            });
        }
    };

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const [x, y] = learnerPosState[0];
        const width = svg.node().getBoundingClientRect().width;
        const height = svg.node().getBoundingClientRect().height;
        svg.call(
            zoomRef.current.transform,
            d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(transform.k)
                .translate(-xScale(x), -yScale(y))
                .translate(-200, 100)
        );
    }, [learnerPosState[0]]);

    useEffect(() => {
        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => {
            window.removeEventListener("resize", updateDimensions);
        };
    }, []);

    const [alertOpen, setAlertOpen] = useState(false);

    // Filter learners with ta_id NOT NULL
    const learnersWithTA = enrolledLearnersByCourse.filter(learner => learner.ta_id !== null);
    
    // Combine current learner and learners with TA, removing duplicates
    const learnersToShow = [
        enrolledLearner,
        ...learnersWithTA.filter(learner => learner.enroll_id !== enrolledLearner?.enroll_id)
    ].filter(Boolean);

    return (
        <div
            className="learnerMapBody"
            ref={mapRef}
            style={{ position: "relative" }}
        >
            <Snackbar
                open={alertOpen}
                autoHideDuration={3000}
                onClose={handleCloseAlert}
            >
                <Alert
                    onClose={handleCloseAlert}
                    severity="error"
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    Summarise your learning to access this resource
                </Alert>
            </Snackbar>
            <SVGComponent
                width={dimensions.width}
                height={dimensions.height}
                svgRef={svgRef}
                zoomRef={zoomRef}
                setTransform={setTransform}
                transform={transform}
                showTopicLines={showTopicLines}
                minPoint={minPoint ?? undefined}
                xRadius={getXRadius()}
                yRadius={getYRadius()}
                xScale={xScale}
                yScale={yScale}
            >
                <GroupComponent>
                    {showHex && (
                        <HexModule
                            data={data}
                            xScale={xScale}
                            yScale={yScale}
                            inverseScale={inverseScale}
                        />)}
                    {showResources && (
                        <>
                            {data && data.length > 0 ? (
                                data.map((d) => (
                                    <React.Fragment key={d.id}>
                                        <CircleComponent
                                            data={d}
                                            activitiesState={activitiesState}
                                            tooltipRef={tooltipRef}
                                            learnerPosState={learnerPosState}
                                            coverageRadius={coverageRadius}
                                            transform={transform}
                                            enrollId={enrollId}
                                            xScale={xScale}
                                            yScale={yScale}
                                            enrolledLearner={enrolledLearner}
                                            setEnrolledLearner={setEnrolledLearner}
                                            svgRef={svgRef}
                                            zoomRef={zoomRef}
                                            setAlertOpen={setAlertOpen}
                                        />
                                        <text
                                            id={`text-${d.index}`}
                                            x={xScale(d.x) - 5 * inverseScale}
                                            y={yScale(d.y) - 20 * inverseScale}
                                            fill="black"
                                            fontSize={`${12 * inverseScale}px`}
                                            fontFamily="sans-serif"
                                        >
                                            {d.index}
                                        </text>
                                    </React.Fragment>
                                ))
                            ) : (
                                <div>Loading Data...</div>
                            )}
                            {exitPointsData && exitPointsData.map((exitPt, idx) => (
                                <ExitPoint
                                    data={exitPt}
                                    activitiesState={activitiesState}
                                    tooltipRef={tooltipRef}
                                    transform={transform}
                                    enrollId={enrollId}
                                    xScale={xScale}
                                    yScale={yScale}
                                    setAlertOpen={setAlertOpen}
                                />
                            ))}
                        </>
                    )}
                    {showTopicLines && (
                        <>
                            {topicsData &&
                                topicsData.length > 0 &&
                                topicsData.map((d, idx) => (
                                    <React.Fragment key={d.id}>
                                        <TopicLineComponent
                                            topicName={d.name}
                                            coords={topicsLinesCoords[idx]}
                                            tooltipRef={tooltipRef}
                                            transform={transform}
                                            xScale={xScale}
                                            yScale={yScale}
                                            minPoint={minPoint}
                                        />
                                    </React.Fragment>
                                ))}
                        </>
                    )}
                    {/* Show contributions if enabled */}
                    {showContributions && contributions.length > 0 && (
                        contributions.map((contribution, idx) => (
                            <ContributionIcon
                                key={`contribution-${idx}`}
                                contribution={contribution}
                                tooltipRef={tooltipRef}
                                transform={transform}
                                xScale={xScale}
                                yScale={yScale}
                            />
                        ))
                    )}
                    {/* Show current learner and learners with TA */}
                    {learnersToShow.length > 0 ? (
                        learnersToShow.map((d) => (
                            <React.Fragment key={d.enroll_id}>
                                <LearnerPositionComponent
                                    learnerPosState={learnerPosState}
                                    coverageRadius={coverageRadius}
                                    transform={transform}
                                    tooltipRef={tooltipRef}
                                    xScale={xScale}
                                    yScale={yScale}
                                    enrolledLearner={d}
                                    enrolledLearnersByCourse={enrolledLearnersByCourse}
                                />
                            </React.Fragment>
                        ))
                    ) : (
                        <div>No learners to display</div>
                    )}
                    {journeyData && showJourney && (
                        <JourneyMap
                            journeyData={journeyData}
                            learnerPosState={learnerPosState}
                            tooltipRef={tooltipRef}
                            transform={transform}
                            setTransform={setTransform}
                            xScale={xScale}
                            yScale={yScale}
                            activitiesState={activitiesState}
                            updatedJourneyPathTwo={JSON.parse(localStorage.getItem("updatedJourneyPath"))}
                            setShowJourneyTwo={localStorage.getItem("clickButton")}
                        />
                    )}
                </GroupComponent>
            </SVGComponent>

            <ButtonPanel
                setShowHex={setShowHex}
                setShowJourney={setShowJourney}
                setShowJourneyTwo={localStorage.getItem("clickButton")}
                svgRef={svgRef}
                xScale={xScale}
                yScale={yScale}
                learnerPosState={learnerPosState}
                zoomRef={zoomRef}
                transform={transform}
                setShowAllLearners={setShowAllLearners}
                setShowModules={setShowModules}
                setShowResources={setShowResources}
                enrolledLearnersByCourse={enrolledLearnersByCourse}
                setTransform={setTransform}
                setShowTopicLines={setShowTopicLines}
                setShowContributions={setShowContributions}
            />

            <div
                ref={tooltipRef}
                style={{
                    position: "absolute",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    border: "1px solid #ccc",
                    padding: "8px",
                    borderRadius: "4px",
                    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                    pointerEvents: "none",
                    visibility: "hidden",
                    transition: "opacity 0.2s ease",
                    fontSize: "12px",
                    zIndex: 10,
                }}
            />
        </div>
    );
};

export default LearnerMap;
