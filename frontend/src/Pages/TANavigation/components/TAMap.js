// The TAMap component renders an interactive map visualizing learning resources, modules, and learners for a course.
// It fetches and displays data using D3, allowing zooming and panning. It shows learner positions, resource locations, 
// and potentially learning paths. TAs can interact with elements and update resource positions via a popup.
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getResponseGet } from "../../../lib/utils";
import {
    CircleComponent,
    GroupComponent,
    ModuleCircleComponent,
    SVGComponent,
    TopicLineComponent,
} from "../../../Components/LearnerMap";
import HexModule from "../../../Components/Hexmodule";
import ButtonPanel from "../../../Components/ButtonPanel";
import JourneyMap from "../../../Components/JourneyMap";
import Learners from "./Learners";
import UpdatePositionPopup from "../../../Components/UpdatePositionPopup";
import LearnerActivity from "../../../Components/LearnerActivity";
const TAMap = ({
    // quiz_x =0,
    // quiz_y=0,
    activitiesState,
    learnerPosState,
    svgRef,
    zoomRef,
    enrollId,
    // enrolledLearner,
    enrolledLearnersByCourse,
    courseId,
    needsReload,
}) => {
    const [data, setData] = useState([]);
    const [moduleData, setModuleData] = useState([]);
    const [journeyData, setJourneyData] = useState([]);
    const [topicsData, setTopicsData] = useState([]);

    const mapRef = useRef(null);
    const [transform, setTransform] = useState(
        d3.zoomIdentity.translate(130, 10).scale(0.6)
    );
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const tooltipRef = useRef(null);
    const [coverageRadius] = useState(300); // Define the coverage radius (adjust as needed)
    const inverseScale = Math.min(1 / transform.k, 1.1);

    const [showJourney, setShowJourney] = useState(false);
    const [showHex, setShowHex] = useState(false);
    const [showAllLearners, setShowAllLearners] = useState(true);
    const [showModules, setShowModules] = useState(true);
    const [showResources, setShowResources] = useState(true);
    const [isDrag, setIsDrag] = useState(false);
    const [topicsLinesCoords, setTopicsLinesCoords] = useState([]);
    const [showTopicLines, setShowTopicLines] = useState(false);

    const [newPos, setNewPos] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isUpdateActive, setIsUpdateActive] = useState(false);
    const [refresh, setRefresh] = useState(true);
    const [updatingData, setUpdatingData] = useState(null);
    const [quizCoordinates, setQuizCoordinates] = useState({ x: null, y: null });
    const [Index, setIndex] = useState(null);
    const [alertOpen, setAlertOpen] = useState(false);
    // quiz_create_status =sessionStorage.getItem('quiz_create_status');
    // Retrieve the quiz create status and coordinates from sessionStorage
    const quiz_create_status = sessionStorage.getItem('quiz_create_status');
    // const index = sessionStorage.getItem('quiz_index');
    // let quiz_x = null;
    // let quiz_y = null;
    // let index = null;

    useEffect(() => {
        if (quiz_create_status == 1) {
            const x = sessionStorage.getItem('quiz_x');
            const y = sessionStorage.getItem('quiz_y');
            const index = sessionStorage.getItem('quiz_index');

            if (x && y && index) {
                setQuizCoordinates({ x, y });
                setIndex(index);
                // Reset the create status in sessionStorage
                sessionStorage.setItem('quiz_create_status', 0);
                sessionStorage.setItem('quiz_index', 0);
            }
        }
    }, [quiz_create_status]);

    let dimensionScale = {
        width: 1000,
        height: 1000,
    };

    const xAccessor = (d) => Number(d.x);
    const yAccessor = (d) => Number(d.y);

    dimensionScale.ctrWidth = 1000;
    dimensionScale.ctrHeight = 1000;

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
        // console.log(response)
        if (response) {
            setData(response.data);
            // console.log(response.data)
            console.log("this is the data", response.data);
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
        // useEffect(() => {
        //   loadData();
        // }, [courseId]);
    };

    const loadModuleData = async (courseId) => {
        const response = await getResponseGet(`/moduleData/${courseId}`);
        if (response) {
            setModuleData(response.data);
            console.log("this is the module data", response.data);
        }
    };
    const loadJourney = async () => {
        const response = await getResponseGet(`/contributions/${enrollId}`);
        if (response) {
            setJourneyData(response.data);
            console.log("this is the learner journey data", response.data);
        }
    };
    const loadTopics = async () => {
        const response = await getResponseGet(`/topics/${courseId}`);
        if (response) {
            const topicsData = response.data;
            setTopicsData(topicsData);
            // console.log("this is the topics data", response.data);
        }
    };

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
            console.log(minPoint);
            console.log(coords);
            setTopicsLinesCoords(coords);
        }
    }, [minPoint, topicsData]);

    useEffect(() => {
        if (refresh) {
            loadData(courseId);
            loadModuleData(courseId);
            loadTopics();
            setRefresh(false);
        }
    }, [courseId, refresh]);

    useEffect(() => {
        if (needsReload) setRefresh(true);
    }, [needsReload]);

    useEffect(() => {
        enrollId && loadJourney();
    }, [enrollId]);

    const updateDimensions = () => {
        if (mapRef.current) {
            setDimensions({
                width: mapRef.current.offsetWidth,
                height: mapRef.current.offsetHeight,
            });
        }
    };

    useEffect(() => {
        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => {
            window.removeEventListener("resize", updateDimensions);
        };
    }, []);

    const learnerPos = learnerPosState[0];
    const closePopup = () => {
        setQuizCoordinates({ x: null, y: null }); // Close the popup by resetting coordinates
        setIndex(Index);
    };


    const handleActivateUpdate = (data) => {
        setIsUpdateActive(true);
        setUpdatingData(data);
    };

    const handleDeactivateUpdate = () => {
        setIsUpdateActive(false);
        setUpdatingData(null);
        setNewPos(null);
    };

    const handleConfirmPopup = () => setShowConfirm(true);

    useEffect(() => {
        if (!showConfirm) {
            // setNewPos(null);
            handleDeactivateUpdate();
        }
    }, [showConfirm]);

    return (
        <div className="learnerMapBody" ref={mapRef} style={{ position: "relative" }}>
            {/* Show the popup if quiz coordinates and index are available */}
            {quizCoordinates.x && quizCoordinates.y && Index && (
                <div
                    style={{
                        position: "fixed",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                        padding: "20px",
                        borderRadius: "10px",
                        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
                        fontSize: "16px",
                        zIndex: 30,
                        width: "300px", // Adjust the width of the popup
                        textAlign: "center",
                    }}
                >
                    <h3>Quiz Added at Coordinates</h3>
                    <p>x: {quizCoordinates.x}</p>
                    <p>y: {quizCoordinates.y}</p>
                    <p>Index: {Index}</p>
                    <button
                        onClick={closePopup}
                        style={{
                            marginTop: "10px",
                            padding: "5px 10px",
                            backgroundColor: "#007BFF",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                        }}
                    >
                        Close
                    </button>
                </div>
            )}

            <SVGComponent
                width={dimensions.width}
                height={dimensions.height}
                svgRef={svgRef}
                zoomRef={zoomRef}
                setTransform={setTransform}
                transform={transform}
                isUpdateActive={isUpdateActive}
                setNewPos={setNewPos}
                handleUpdate={handleConfirmPopup}
                showTopicLines={showTopicLines}
                minPoint={minPoint ?? undefined}
                xRadius={getXRadius()}
                yRadius={getYRadius()}
                xScale={xScale}
                yScale={yScale}
            >
                <GroupComponent>
                    {/* Your existing map components */}
                    {showHex && (
                        <HexModule
                            data={data}
                            xScale={xScale}
                            yScale={yScale}
                            inverseScale={inverseScale}
                        />
                    )}
                    {showResources && (
                        <>
                            {data.length > 0 ? (
                                data.map((d) => (
                                    <React.Fragment key={d.id}>
                                        <CircleComponent
                                            data={d}
                                            activitiesState={activitiesState}
                                            tooltipRef={tooltipRef}
                                            learnerPos={learnerPos}
                                            coverageRadius={coverageRadius}
                                            transform={transform}
                                            enrollId={enrollId}
                                            xScale={xScale}
                                            yScale={yScale}
                                            svgRef={svgRef}
                                            zoomRef={zoomRef}
                                            handleActivateUpdate={handleActivateUpdate}
                                            handleDeactivateUpdate={handleDeactivateUpdate}
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

                    {/* Other map data rendering */}
                    {enrolledLearnersByCourse.length > 0 ? (
                        showAllLearners ? (
                            enrolledLearnersByCourse.map((d) => (
                                <React.Fragment key={d.enroll_id}>
                                    <Learners
                                        enrollId={enrollId}
                                        learnerPosState={learnerPosState}
                                        coverageRadius={coverageRadius}
                                        transform={transform}
                                        tooltipRef={tooltipRef}
                                        xScale={xScale}
                                        yScale={yScale}
                                        enrolledLearner={d}
                                        enrolledLearnersByCourse={enrolledLearnersByCourse}
                                        activitiesState={activitiesState}
                                    />
                                </React.Fragment>
                            ))
                        ) : (
                            <></>
                        )
                    ) : (
                        <div>Loading or no data available</div>
                    )}


                    {journeyData && showJourney && transform.k > 1 && (
                        <JourneyMap
                            // enrolledLearner={enrolledLearnersByCourse}
                            journeyData={journeyData}
                            tooltipRef={tooltipRef}
                            transform={transform}
                            xScale={xScale}
                            yScale={yScale}
                            setTransform={setTransform}
                            activitiesState={activitiesState}
                            setShowJourneyTwo={localStorage.getItem("clickButton")}
                            updatedJourneyPathTwo={JSON.parse(localStorage.getItem("updatedJourneyPath"))}
                            learnerPosState={learnerPosState}
                        />
                    )}
                </GroupComponent>
            </SVGComponent>
            <ButtonPanel
                svgRef={svgRef}
                setShowHex={setShowHex}
                setShowJourney={setShowJourney}
                setShowJourneyTwo={localStorage.getItem("clickButton")}
                setShowAllLearners={setShowAllLearners}
                setShowModules={setShowModules}
                setShowResources={setShowResources}
                setShowTopicLines={setShowTopicLines}
                xScale={xScale}
                yScale={yScale}
                learnerPosState={learnerPosState}
                zoomRef={zoomRef}
                transform={transform}
                isDrag={isDrag}
                setIsDrag={setIsDrag}
                setTransform={setTransform}
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
            <UpdatePositionPopup
                open={showConfirm}
                setOpen={setShowConfirm}
                newPos={newPos}
                oldPos={{ x: xScale(data.x), y: yScale(data.y) }}
                xScale={xScale}
                yScale={yScale}
                // updatePosition={updatePosition}
                data={updatingData}
                setRefresh={setRefresh}
            />
        </div>
    );
};

export default TAMap;
