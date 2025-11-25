// JourneyMap component animates and visualizes the learner's journey across two separate runs:
// - The red run (resources) and the green run (summary), where each path is animated sequentially.
// - The component handles the rendering of activities and paths, visualized with circles and arrows, showing the learner's progress over time.
// - The journey paths are dynamically updated based on zoom (transform.k), with arrows resizing based on the zoom level.
// - The component also controls the flow of the animation, switching between red and green runs after each one completes.
import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

const JourneyMap = ({
    journeyData,
    learnerPosState,
    tooltipRef,
    transform,
    setTransform,
    xScale,
    yScale,
    activitiesState,
    updatedJourneyPathTwo,
    setShowJourneyTwo,
}) => {
    const [activeRun, setActiveRun] = useState("resources");
    const [animationProgress, setAnimationProgress] = useState(0);
    const [activePointIndex, setActivePointIndex] = useState(0);
    const [completedRuns, setCompletedRuns] = useState({ resources: false, summary: false });
    const animationInterval = useRef(null);
    const [showMap, setShowMap] = useState(true);

    const tempActivitiesState = activitiesState?.[0] || [];
    console.log("this is the goddamn Activities State:", activitiesState);
    console.log("this is the goddamn journeyData:", journeyData);
    // const resourcesActivities = tempActivitiesState.filter(activity => activity.type === "resource");
    // const summaryActivities = tempActivitiesState.filter(activity => activity.type === "summary");
    const redIds = new Set();
    const resourcesActivities = [];
    const summaryActivities = [];

    tempActivitiesState.forEach(activity => {
        const isYouTube = activity.type === "resource" && activity.link?.startsWith("https://www.youtube.com");
        const isQuiz = activity.type === "resource" && activity.contribution_id === null;
        const isUngradedSummary = activity.type === "summary" && activity.contribution_id && !journeyData.find(j => j.id === activity.contribution_id)?.is_graded;

        if (isYouTube || isQuiz || isUngradedSummary) {
            resourcesActivities.push(activity);
            redIds.add(activity.id);
        }
    });

    // Green run: Graded summaries only, and not already included in red
    tempActivitiesState.forEach(activity => {
        if (activity.type === "summary" && activity.contribution_id) {
            const match = journeyData.find(j => j.id === activity.contribution_id);
            if (match?.is_graded === true && !redIds.has(activity.id)) {
                summaryActivities.push(activity);
            }
        }
    });




    console.log("Resources Activities (Red Run - YouTube Links Only):", resourcesActivities);
    console.log("Summary Activities (Green Run - All Others):", summaryActivities);

    const createRun = (activities) => [
        { id: "start", x: 0.1, y: 0.1 },
        ...activities.sort((a, b) => a.id - b.id),
        ...(learnerPosState?.[0] ? [{ id: "end", x: learnerPosState[0][0], y: learnerPosState[0][1] }] : []),
    ];

    const resourcesRun = createRun(resourcesActivities);
    const summaryRun = createRun(summaryActivities);
    console.log("transform.k: ", transform.k);
    const inverseScale = Math.min(1 / transform.k, 1.1);
    const T = 0.15; // Time per run in seconds
    const steps = 60 * T; // Assuming 60 frames per second
    const clearTime = 5000; // Clear map after 5 seconds of summary run completion

    useEffect(() => {
        if (!showMap) return; // Do not run animation if map is cleared

        let currentStep = 0;
        animationInterval.current = setInterval(() => {
            setAnimationProgress(currentStep / steps);
            currentStep++;

            if (currentStep > steps) {
                currentStep = 0;
                setActivePointIndex((prevIndex) => prevIndex + 1);
            }

            if (activePointIndex >= (activeRun === "resources" ? resourcesRun.length - 1 : summaryRun.length - 1)) {
                clearInterval(animationInterval.current);

                if (activeRun === "resources") {
                    setCompletedRuns((prev) => ({ ...prev, resources: true })); // Mark red as completed
                    setActiveRun("summary");
                    setActivePointIndex(0);
                    currentStep = 0;
                    animationInterval.current = setInterval(() => {
                        setAnimationProgress(currentStep / steps);
                        currentStep++;
                        if (currentStep > steps) {
                            currentStep = 0;
                            setActivePointIndex((prevIndex) => prevIndex + 1);
                        }

                        if (activePointIndex >= summaryRun.length - 1) {
                            clearInterval(animationInterval.current);
                            setCompletedRuns((prev) => ({ ...prev, summary: true })); // Mark green as completed
                            setTimeout(() => {
                                setShowMap(false);
                            }, clearTime);
                        }
                    }, 1000 / 60);
                }
            }
        }, 1000 / 60); // 60 frames per second

        return () => clearInterval(animationInterval.current);
    }, [activeRun, activePointIndex, showMap]);

    const lineGenerator = (pointA, pointB, offset, progress) => {
        const [x1, y1] = [xScale(pointA.x), yScale(pointA.y)];
        const [x2, y2] = [xScale(pointB.x), yScale(pointB.y)];
        const [dx, dy] = [x2 - x1, y2 - y1];
        const dr = Math.sqrt(dx * dx + dy * dy);
        const [cx, cy] = [(x1 + x2) / 2 + (dy / dr) * offset, (y1 + y2) / 2 - (dx / dr) * offset];

        const animatedX = x1 + (cx - x1) * progress;
        const animatedY = y1 + (cy - y1) * progress;

        const animatedX2 = cx + (x2 - cx) * progress;
        const animatedY2 = cy + (y2 - cy) * progress;

        return `M ${x1} ${y1} Q ${animatedX} ${animatedY} ${animatedX2} ${animatedY2}`;
    };

    const renderPaths = (run, color, strokeWidth, arrowColor, isStatic = false) => {
        // Inversely scale arrow size with zoom and clamp between 3 and 12 for visibility
        const arrowSize = Math.max(5, Math.min(10, 2 / transform.k));

        return (
            <>
                {/* Define marker for arrow */}
                <defs>
                    <marker
                        id={`arrow-${color}`}
                        viewBox="0 0 10 10"
                        refX="10"
                        refY="5"
                        markerWidth={arrowSize}  // Clamped arrow size
                        markerHeight={arrowSize} // Clamped arrow size
                        orient="auto"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill={arrowColor} />
                    </marker>
                </defs>

                {run.slice(0, -1).map((point, index) => {
                    if (index > activePointIndex && !isStatic) return null;

                    const progress = isStatic ? 1 : index === activePointIndex ? animationProgress : 1;

                    return (
                        <path
                            key={`${run[index].id}-path-${index}`}
                            d={lineGenerator(point, run[index + 1], 50 * inverseScale, progress)}
                            stroke={color}
                            strokeWidth={strokeWidth * 2}
                            strokeDasharray="4,4"
                            fill="none"
                            markerEnd={`url(#arrow-${color})`} // Use a single marker per color
                        />
                    );
                })}
            </>
        );
    };



    return (
        <g style={{ display: showMap ? "block" : "none" }}>
            {/* Persist completed red path and arrows */}
            {completedRuns.resources && renderPaths(resourcesRun, "#FF0000", 2 * inverseScale, "#FF0000", true)}

            {resourcesRun.map((point, index) => (
                <g key={`resource-${index}`}>
                    {(index === 0 || index === resourcesRun.length - 1) && (
                        <circle
                            id={`resource-circle-${index}`}
                            cx={xScale(point.x)}
                            cy={yScale(point.y)}
                            r={10 * inverseScale}
                            fill="#ffbaba"
                            stroke="black"
                            strokeWidth={2 * inverseScale}
                        />
                    )}
                </g>
            ))}

            {/* Animate red path only if it hasn't finished */}
            {!completedRuns.resources && activeRun === "resources" && renderPaths(resourcesRun, "#FF0000", 2 * inverseScale, "#FF0000")}

            {/* Persist completed green path and arrows */}
            {completedRuns.summary && renderPaths(summaryRun, "#00FF00", 2 * inverseScale, "#00FF00", true)}

            {summaryRun.map((point, index) => (
                <g key={`summary-${index}`}>
                    {(index === 0 || index === summaryRun.length - 1) && (
                        <circle
                            id={`summary-circle-${index}`}
                            cx={xScale(point.x)}
                            cy={yScale(point.y)}
                            r={10 * inverseScale}
                            fill="#baffc9"
                            stroke="black"
                            strokeWidth={2 * inverseScale}
                        />
                    )}
                </g>
            ))}

            {/* Animate green path normally */}
            {!completedRuns.summary && activeRun === "summary" && renderPaths(summaryRun, "#00FF00", 2 * inverseScale, "#00FF00")}
        </g>
    );
};

export default JourneyMap;




















// // working 100%, 2 runs. red plays, then persists. then green plays, then persists. arrows coming and arrowSize = Math.max(3, Math.min(10, 6 / transform.k));
// import React, { useEffect, useState, useRef } from "react";
// import * as d3 from "d3";

// const JourneyMap = ({
//     journeyData,
//     learnerPosState,
//     tooltipRef,
//     transform,
//     setTransform,
//     xScale,
//     yScale,
//     activitiesState,
//     updatedJourneyPathTwo,
//     setShowJourneyTwo,
// }) => {
//     const [activeRun, setActiveRun] = useState("resources");
//     const [animationProgress, setAnimationProgress] = useState(0);
//     const [activePointIndex, setActivePointIndex] = useState(0);
//     const [completedRuns, setCompletedRuns] = useState({ resources: false, summary: false });
//     const animationInterval = useRef(null);
//     const [showMap, setShowMap] = useState(true);

//     const tempActivitiesState = activitiesState?.[0] || [];
//     console.log("this is the goddamn Activities State:", activitiesState);
//     console.log("this is the goddamn journeyData:", journeyData);
//     // const resourcesActivities = tempActivitiesState.filter(activity => activity.type === "resource");
//     // const summaryActivities = tempActivitiesState.filter(activity => activity.type === "summary");
//     const redIds = new Set();
//     const resourcesActivities = [];
//     const summaryActivities = [];

//     tempActivitiesState.forEach(activity => {
//         // RED RUN — YouTube resources only
//         if (activity.type === "resource" && activity.link?.startsWith("https://www.youtube.com")) {
//             resourcesActivities.push(activity);
//             redIds.add(activity.id); // Track it to exclude from green
//         }
//     });

//     // GREEN RUN — Graded summaries
//     tempActivitiesState.forEach(activity => {
//         if (redIds.has(activity?.id)) return; // Skip if already in red

//         if (activity.type === "summary" && activity.contribution_id) {
//             const match = journeyData.find(j => j.id === activity.contribution_id);
//             if (match?.is_graded === true) {
//                 summaryActivities.push(activity);
//             }
//         }

//         // Also include quizzes (ungraded resources with no contribution_id)
//         if (activity.type === "resource" && activity.contribution_id === null) {
//             summaryActivities.push(activity);
//         }
//     });



//     console.log("Resources Activities (Red Run - YouTube Links Only):", resourcesActivities);
//     console.log("Summary Activities (Green Run - All Others):", summaryActivities);

//     const createRun = (activities) => [
//         { id: "start", x: 0.1, y: 0.1 },
//         ...activities.sort((a, b) => a.id - b.id),
//         ...(learnerPosState?.[0] ? [{ id: "end", x: learnerPosState[0][0], y: learnerPosState[0][1] }] : []),
//     ];

//     const resourcesRun = createRun(resourcesActivities);
//     const summaryRun = createRun(summaryActivities);
//     console.log("transform.k: ", transform.k);
//     const inverseScale = Math.min(1 / transform.k, 1.1);
//     const T = 0.15; // Time per run in seconds
//     const steps = 60 * T; // Assuming 60 frames per second
//     const clearTime = 5000; // Clear map after 5 seconds of summary run completion

//     useEffect(() => {
//         if (!showMap) return; // Do not run animation if map is cleared

//         let currentStep = 0;
//         animationInterval.current = setInterval(() => {
//             setAnimationProgress(currentStep / steps);
//             currentStep++;

//             if (currentStep > steps) {
//                 currentStep = 0;
//                 setActivePointIndex((prevIndex) => prevIndex + 1);
//             }

//             if (activePointIndex >= (activeRun === "resources" ? resourcesRun.length - 1 : summaryRun.length - 1)) {
//                 clearInterval(animationInterval.current);

//                 if (activeRun === "resources") {
//                     setCompletedRuns((prev) => ({ ...prev, resources: true })); // Mark red as completed
//                     setActiveRun("summary");
//                     setActivePointIndex(0);
//                     currentStep = 0;
//                     animationInterval.current = setInterval(() => {
//                         setAnimationProgress(currentStep / steps);
//                         currentStep++;
//                         if (currentStep > steps) {
//                             currentStep = 0;
//                             setActivePointIndex((prevIndex) => prevIndex + 1);
//                         }

//                         if (activePointIndex >= summaryRun.length - 1) {
//                             clearInterval(animationInterval.current);
//                             setCompletedRuns((prev) => ({ ...prev, summary: true })); // Mark green as completed
//                             setTimeout(() => {
//                                 setShowMap(false);
//                             }, clearTime);
//                         }
//                     }, 1000 / 60);
//                 }
//             }
//         }, 1000 / 60); // 60 frames per second

//         return () => clearInterval(animationInterval.current);
//     }, [activeRun, activePointIndex, showMap]);

//     const lineGenerator = (pointA, pointB, offset, progress) => {
//         const [x1, y1] = [xScale(pointA.x), yScale(pointA.y)];
//         const [x2, y2] = [xScale(pointB.x), yScale(pointB.y)];
//         const [dx, dy] = [x2 - x1, y2 - y1];
//         const dr = Math.sqrt(dx * dx + dy * dy);
//         const [cx, cy] = [(x1 + x2) / 2 + (dy / dr) * offset, (y1 + y2) / 2 - (dx / dr) * offset];

//         const animatedX = x1 + (cx - x1) * progress;
//         const animatedY = y1 + (cy - y1) * progress;

//         const animatedX2 = cx + (x2 - cx) * progress;
//         const animatedY2 = cy + (y2 - cy) * progress;

//         return `M ${x1} ${y1} Q ${animatedX} ${animatedY} ${animatedX2} ${animatedY2}`;
//     };

//     const renderPaths = (run, color, strokeWidth, arrowColor, isStatic = false) => {
//         // Inversely scale arrow size with zoom and clamp between 3 and 12 for visibility
//         const arrowSize = Math.max(5, Math.min(10, 2 / transform.k));

//         return (
//             <>
//                 {/* Define marker for arrow */}
//                 <defs>
//                     <marker
//                         id={`arrow-${color}`}
//                         viewBox="0 0 10 10"
//                         refX="10"
//                         refY="5"
//                         markerWidth={arrowSize}  // Clamped arrow size
//                         markerHeight={arrowSize} // Clamped arrow size
//                         orient="auto"
//                     >
//                         <path d="M 0 0 L 10 5 L 0 10 z" fill={arrowColor} />
//                     </marker>
//                 </defs>

//                 {run.slice(0, -1).map((point, index) => {
//                     if (index > activePointIndex && !isStatic) return null;

//                     const progress = isStatic ? 1 : index === activePointIndex ? animationProgress : 1;

//                     return (
//                         <path
//                             key={`${run[index].id}-path-${index}`}
//                             d={lineGenerator(point, run[index + 1], 50 * inverseScale, progress)}
//                             stroke={color}
//                             strokeWidth={strokeWidth * 2}
//                             strokeDasharray="4,4"
//                             fill="none"
//                             markerEnd={`url(#arrow-${color})`} // Use a single marker per color
//                         />
//                     );
//                 })}
//             </>
//         );
//     };



//     return (
//         <g style={{ display: showMap ? "block" : "none" }}>
//             {/* Persist completed red path and arrows */}
//             {completedRuns.resources && renderPaths(resourcesRun, "#FF0000", 2 * inverseScale, "#FF0000", true)}

//             {resourcesRun.map((point, index) => (
//                 <g key={`resource-${index}`}>
//                     {(index === 0 || index === resourcesRun.length - 1) && (
//                         <circle
//                             id={`resource-circle-${index}`}
//                             cx={xScale(point.x)}
//                             cy={yScale(point.y)}
//                             r={10 * inverseScale}
//                             fill="#ffbaba"
//                             stroke="black"
//                             strokeWidth={2 * inverseScale}
//                         />
//                     )}
//                 </g>
//             ))}

//             {/* Animate red path only if it hasn't finished */}
//             {!completedRuns.resources && activeRun === "resources" && renderPaths(resourcesRun, "#FF0000", 2 * inverseScale, "#FF0000")}

//             {/* Persist completed green path and arrows */}
//             {completedRuns.summary && renderPaths(summaryRun, "#00FF00", 2 * inverseScale, "#00FF00", true)}

//             {summaryRun.map((point, index) => (
//                 <g key={`summary-${index}`}>
//                     {(index === 0 || index === summaryRun.length - 1) && (
//                         <circle
//                             id={`summary-circle-${index}`}
//                             cx={xScale(point.x)}
//                             cy={yScale(point.y)}
//                             r={10 * inverseScale}
//                             fill="#baffc9"
//                             stroke="black"
//                             strokeWidth={2 * inverseScale}
//                         />
//                     )}
//                 </g>
//             ))}

//             {/* Animate green path normally */}
//             {!completedRuns.summary && activeRun === "summary" && renderPaths(summaryRun, "#00FF00", 2 * inverseScale, "#00FF00")}
//         </g>
//     );
// };

// export default JourneyMap;






















// // working 100%, 2 runs. red plays, then persists. then green plays, then persists. arrows coming and arrowSize = Math.max(3, Math.min(10, 6 / transform.k));
// import React, { useEffect, useState, useRef } from "react";
// import * as d3 from "d3";

// const JourneyMap = ({
//     journeyData,
//     learnerPosState,
//     tooltipRef,
//     transform,
//     setTransform,
//     xScale,
//     yScale,
//     activitiesState,
//     updatedJourneyPathTwo,
//     setShowJourneyTwo,
// }) => {
//     const [activeRun, setActiveRun] = useState("resources");
//     const [animationProgress, setAnimationProgress] = useState(0);
//     const [activePointIndex, setActivePointIndex] = useState(0);
//     const [completedRuns, setCompletedRuns] = useState({ resources: false, summary: false });
//     const animationInterval = useRef(null);
//     const [showMap, setShowMap] = useState(true);

//     const tempActivitiesState = activitiesState?.[0] || [];
//     console.log("this is the goddamn Activities State:", activitiesState);
//     console.log("this is the goddamn journeyData:", journeyData);
//     // const resourcesActivities = tempActivitiesState.filter(activity => activity.type === "resource");
//     // const summaryActivities = tempActivitiesState.filter(activity => activity.type === "summary");
//     const resourcesActivities = [];
//     const summaryActivities = [];

//     tempActivitiesState.forEach(activity => {
//         if (activity.type === "resource" && activity.link?.startsWith("https://www.youtube.com")) {
//             resourcesActivities.push(activity); // YouTube links go to resourcesActivities
//         } else {
//             summaryActivities.push(activity); // Everything else goes to summaryActivities
//         }
//     });

//     console.log("Resources Activities (Red Run - YouTube Links Only):", resourcesActivities);
//     console.log("Summary Activities (Green Run - All Others):", summaryActivities);

//     const createRun = (activities) => [
//         { id: "start", x: 0.1, y: 0.1 },
//         ...activities.sort((a, b) => a.id - b.id),
//         ...(learnerPosState?.[0] ? [{ id: "end", x: learnerPosState[0][0], y: learnerPosState[0][1] }] : []),
//     ];

//     const resourcesRun = createRun(resourcesActivities);
//     const summaryRun = createRun(summaryActivities);
//     console.log("transform.k: ", transform.k);
//     const inverseScale = Math.min(1 / transform.k, 1.1);
//     const T = 0.15; // Time per run in seconds
//     const steps = 60 * T; // Assuming 60 frames per second
//     const clearTime = 5000; // Clear map after 5 seconds of summary run completion

//     useEffect(() => {
//         if (!showMap) return; // Do not run animation if map is cleared

//         let currentStep = 0;
//         animationInterval.current = setInterval(() => {
//             setAnimationProgress(currentStep / steps);
//             currentStep++;

//             if (currentStep > steps) {
//                 currentStep = 0;
//                 setActivePointIndex((prevIndex) => prevIndex + 1);
//             }

//             if (activePointIndex >= (activeRun === "resources" ? resourcesRun.length - 1 : summaryRun.length - 1)) {
//                 clearInterval(animationInterval.current);

//                 if (activeRun === "resources") {
//                     setCompletedRuns((prev) => ({ ...prev, resources: true })); // Mark red as completed
//                     setActiveRun("summary");
//                     setActivePointIndex(0);
//                     currentStep = 0;
//                     animationInterval.current = setInterval(() => {
//                         setAnimationProgress(currentStep / steps);
//                         currentStep++;
//                         if (currentStep > steps) {
//                             currentStep = 0;
//                             setActivePointIndex((prevIndex) => prevIndex + 1);
//                         }

//                         if (activePointIndex >= summaryRun.length - 1) {
//                             clearInterval(animationInterval.current);
//                             setCompletedRuns((prev) => ({ ...prev, summary: true })); // Mark green as completed
//                             setTimeout(() => {
//                                 setShowMap(false);
//                             }, clearTime);
//                         }
//                     }, 1000 / 60);
//                 }
//             }
//         }, 1000 / 60); // 60 frames per second

//         return () => clearInterval(animationInterval.current);
//     }, [activeRun, activePointIndex, showMap]);

//     const lineGenerator = (pointA, pointB, offset, progress) => {
//         const [x1, y1] = [xScale(pointA.x), yScale(pointA.y)];
//         const [x2, y2] = [xScale(pointB.x), yScale(pointB.y)];
//         const [dx, dy] = [x2 - x1, y2 - y1];
//         const dr = Math.sqrt(dx * dx + dy * dy);
//         const [cx, cy] = [(x1 + x2) / 2 + (dy / dr) * offset, (y1 + y2) / 2 - (dx / dr) * offset];

//         const animatedX = x1 + (cx - x1) * progress;
//         const animatedY = y1 + (cy - y1) * progress;

//         const animatedX2 = cx + (x2 - cx) * progress;
//         const animatedY2 = cy + (y2 - cy) * progress;

//         return `M ${x1} ${y1} Q ${animatedX} ${animatedY} ${animatedX2} ${animatedY2}`;
//     };

//     const renderPaths = (run, color, strokeWidth, arrowColor, isStatic = false) => {
//         // Inversely scale arrow size with zoom and clamp between 3 and 12 for visibility
//         const arrowSize = Math.max(5, Math.min(10, 2 / transform.k));

//         return (
//             <>
//                 {/* Define marker for arrow */}
//                 <defs>
//                     <marker
//                         id={`arrow-${color}`}
//                         viewBox="0 0 10 10"
//                         refX="10"
//                         refY="5"
//                         markerWidth={arrowSize}  // Clamped arrow size
//                         markerHeight={arrowSize} // Clamped arrow size
//                         orient="auto"
//                     >
//                         <path d="M 0 0 L 10 5 L 0 10 z" fill={arrowColor} />
//                     </marker>
//                 </defs>

//                 {run.slice(0, -1).map((point, index) => {
//                     if (index > activePointIndex && !isStatic) return null;

//                     const progress = isStatic ? 1 : index === activePointIndex ? animationProgress : 1;

//                     return (
//                         <path
//                             key={`${run[index].id}-path-${index}`}
//                             d={lineGenerator(point, run[index + 1], 50 * inverseScale, progress)}
//                             stroke={color}
//                             strokeWidth={strokeWidth * 2}
//                             strokeDasharray="4,4"
//                             fill="none"
//                             markerEnd={`url(#arrow-${color})`} // Use a single marker per color
//                         />
//                     );
//                 })}
//             </>
//         );
//     };



//     return (
//         <g style={{ display: showMap ? "block" : "none" }}>
//             {/* Persist completed red path and arrows */}
//             {completedRuns.resources && renderPaths(resourcesRun, "#FF0000", 2 * inverseScale, "#FF0000", true)}

//             {resourcesRun.map((point, index) => (
//                 <g key={`resource-${index}`}>
//                     {(index === 0 || index === resourcesRun.length - 1) && (
//                         <circle
//                             id={`resource-circle-${index}`}
//                             cx={xScale(point.x)}
//                             cy={yScale(point.y)}
//                             r={10 * inverseScale}
//                             fill="#ffbaba"
//                             stroke="black"
//                             strokeWidth={2 * inverseScale}
//                         />
//                     )}
//                 </g>
//             ))}

//             {/* Animate red path only if it hasn't finished */}
//             {!completedRuns.resources && activeRun === "resources" && renderPaths(resourcesRun, "#FF0000", 2 * inverseScale, "#FF0000")}

//             {/* Persist completed green path and arrows */}
//             {completedRuns.summary && renderPaths(summaryRun, "#00FF00", 2 * inverseScale, "#00FF00", true)}

//             {summaryRun.map((point, index) => (
//                 <g key={`summary-${index}`}>
//                     {(index === 0 || index === summaryRun.length - 1) && (
//                         <circle
//                             id={`summary-circle-${index}`}
//                             cx={xScale(point.x)}
//                             cy={yScale(point.y)}
//                             r={10 * inverseScale}
//                             fill="#baffc9"
//                             stroke="black"
//                             strokeWidth={2 * inverseScale}
//                         />
//                     )}
//                 </g>
//             ))}

//             {/* Animate green path normally */}
//             {!completedRuns.summary && activeRun === "summary" && renderPaths(summaryRun, "#00FF00", 2 * inverseScale, "#00FF00")}
//         </g>
//     );
// };

// export default JourneyMap;
