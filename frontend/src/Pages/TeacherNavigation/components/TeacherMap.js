// TeacherMap.js

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

const TeacherMap = ({
  activitiesState,
  learnerPosState,
  svgRef,
  zoomRef,
  enrollId,
  enrolledLearnersByCourse,
  courseId,
  needsReload,
  selectedTopicId,
}) => {
  const [data, setData] = useState([]);
  const [moduleData, setModuleData] = useState([]);
  const [journeyData, setJourneyData] = useState([]);
  const [topicsData, setTopicsData] = useState([]);

  // 🔹 New: clusters from backend
  const [clusterAssignments, setClusterAssignments] = useState({}); // enroll_id -> cluster_id
  const [clusterKeywords, setClusterKeywords] = useState({}); // cluster_id -> [keywords]

  const mapRef = useRef(null);
  const [transform, setTransform] = useState(
    d3.zoomIdentity.translate(130, 10).scale(0.6)
  );
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const tooltipRef = useRef(null);
  const [coverageRadius] = useState(300);
  const inverseScale = Math.min(1 / transform.k, 1.1);

  const [showJourney, setShowJourney] = useState(false);
  const [showHex, setShowHex] = useState(false);
  const [showAllLearners, setShowAllLearners] = useState(true);
  const [showModules, setShowModules] = useState(true);
  const [showResources, setShowResources] = useState(true);
  const [isDrag, setIsDrag] = useState(false);
  const [topicsLinesCoords, setTopicsLinesCoords] = useState([]);
  const [showTopicLines, setShowTopicLines] = useState(false);
  const [showClusters, setShowClusters] = useState(false);

  const [newPos, setNewPos] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdateActive, setIsUpdateActive] = useState(false);
  const [refresh, setRefresh] = useState(true);
  const [updatingData, setUpdatingData] = useState(null);
  const [quizCoordinates, setQuizCoordinates] = useState({ x: null, y: null });
  const [Index, setIndex] = useState(null);

  const quiz_create_status = sessionStorage.getItem("quiz_create_status");

  useEffect(() => {
    if (quiz_create_status == 1) {
      const x = sessionStorage.getItem("quiz_x");
      const y = sessionStorage.getItem("quiz_y");
      const index = sessionStorage.getItem("quiz_index");

      if (x && y && index) {
        setQuizCoordinates({ x, y });
        setIndex(index);
        sessionStorage.setItem("quiz_create_status", 0);
        sessionStorage.setItem("quiz_index", 0);
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
  };

  const getYRadius = () => {
    const yExtent = d3.extent(data, yAccessor);
    return Math.abs(yExtent[1] - yExtent[0]);
  };

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
      _minPoint["len"] = Math.sqrt(
        (xExtent[0] - xExtent[1]) * (xExtent[0] - xExtent[1]) +
          (yExtent[0] - yExtent[1]) * (yExtent[0] - yExtent[1])
      );
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

  // 🔹 NEW: Load cluster assignments + keywords for selected topic
  useEffect(() => {
    const loadClustersForTopic = async () => {
      // Need a topic chosen + course
      if (!courseId || !selectedTopicId) {
        setClusterAssignments({});
        setClusterKeywords({});
        return;
      }

      try {
        const response = await getResponseGet(
          `/summary-clusters/${courseId}/${selectedTopicId}`
        );

        if (response?.data?.clusters) {
          const assignments = {}; // enroll_id -> cluster_id
          const keywordsMap = {}; // cluster_id -> [keywords]

          response.data.clusters.forEach((cluster) => {
            const cid = cluster.cluster_id;
            keywordsMap[cid] = cluster.top_keywords || [];

            (cluster.learners || []).forEach((learner) => {
              assignments[learner.enroll_id] = cid;
            });
          });

          setClusterAssignments(assignments);
          setClusterKeywords(keywordsMap);

          console.log("Loaded cluster assignments:", assignments);
          console.log("Loaded cluster keywords:", keywordsMap);
        } else {
          setClusterAssignments({});
          setClusterKeywords({});
        }
      } catch (err) {
        console.error("Failed to load summary clusters:", err);
        setClusterAssignments({});
        setClusterKeywords({});
      }
    };

    loadClustersForTopic();
  }, [courseId, selectedTopicId]);

  useEffect(() => {
    if (minPoint && topicsData && topicsData.length > 0) {
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
    setQuizCoordinates({ x: null, y: null });
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
      handleDeactivateUpdate();
    }
  }, [showConfirm]);

  // 🔹 Derive cluster list from clusterKeywords
  const clusterIds = Object.keys(clusterKeywords)
    .map((id) => Number(id))
    .sort((a, b) => a - b);

  const getClusterKeywords = (clusterId) => {
    return clusterKeywords[clusterId] || [];
  };

  return (
    <div
      className="learnerMapBody"
      ref={mapRef}
      style={{ position: "relative" }}
    >
      {/* Quiz popup */}
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
            width: "300px",
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
                      handleActivateUpdate={handleActivateUpdate}
                      handleDeactivateUpdate={handleDeactivateUpdate}
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

          {showTopicLines && topicsData && topicsData.length > 0 && (
            <>
              {topicsData.map((d, idx) => (
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

          {/* Learners */}
          {enrolledLearnersByCourse.length > 0 ? (
            showAllLearners ? (
              enrolledLearnersByCourse.map((d) => (
                <React.Fragment key={d.enroll_id}>
                  <Learners
                    enroll_id={d.enroll_id}
                    tooltipRef={tooltipRef}
                    transform={transform}
                    xScale={xScale}
                    yScale={yScale}
                    enrolledLearner={d}
                    activitiesState={activitiesState}
                    // 🔹 cluster from backend summary_clusters endpoint
                    cluster_id={clusterAssignments[d.enroll_id]}
                    showClusters={showClusters}
                  />
                </React.Fragment>
              ))
            ) : null
          ) : (
            <div>Loading or no data available</div>
          )}

          {journeyData && showJourney && (
            <JourneyMap
              journeyData={journeyData}
              tooltipRef={tooltipRef}
              transform={transform}
              xScale={xScale}
              yScale={yScale}
              setTransform={setTransform}
              activitiesState={activitiesState}
              setShowJourneyTwo={localStorage.getItem("clickButton")}
              updatedJourneyPathTwo={JSON.parse(
                localStorage.getItem("updatedJourneyPath")
              )}
              learnerPosState={learnerPosState}
            />
          )}
        </GroupComponent>
      </SVGComponent>

      {/* 🔹 Cluster legend using backend clusterKeywords */}
      {showClusters && clusterIds.length > 0 && (
        <div
          className="cluster-legend"
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "15px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
            minWidth: "140px",
            zIndex: "100",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>Clusters</h4>

          {clusterIds.map((clusterId) => {
            const uniqueKeywords = getClusterKeywords(clusterId);

            return (
              <div
                key={clusterId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "8px",
                  padding: "5px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  const tooltip = e.currentTarget.querySelector(
                    `[data-keywords="cluster-${clusterId}"]`
                  );
                  if (tooltip) tooltip.style.display = "block";
                }}
                onMouseLeave={(e) => {
                  const tooltip = e.currentTarget.querySelector(
                    `[data-keywords="cluster-${clusterId}"]`
                  );
                  if (tooltip) tooltip.style.display = "none";
                }}
              >
                {/* Basic shape icons */}
                {clusterId === 1 && (
                  <svg width="16" height="16" style={{ marginRight: "8px" }}>
                    <rect
                      x="2"
                      y="2"
                      width="12"
                      height="12"
                      fill="#ff6b6b"
                      stroke="#e55353"
                      strokeWidth="1"
                    />
                  </svg>
                )}
                {clusterId === 2 && (
                  <svg width="16" height="16" style={{ marginRight: "8px" }}>
                    <circle
                      cx="8"
                      cy="8"
                      r="6"
                      fill="#4ecdc4"
                      stroke="#45b7af"
                      strokeWidth="1"
                    />
                  </svg>
                )}
                {clusterId === 3 && (
                  <svg width="16" height="16" style={{ marginRight: "8px" }}>
                    <polygon
                      points="8,2 14,14 2,14"
                      fill="#45b7d1"
                      stroke="#3a9bc1"
                      strokeWidth="1"
                    />
                  </svg>
                )}
                {clusterId === 4 && (
                  <svg width="20" height="20" style={{ marginRight: "10px" }}>
                    <polygon
                      points="10,2 18,10 10,18 2,10"
                      fill="#96ceb4"
                      stroke="#2f9e44"
                      strokeWidth="2"
                    />
                  </svg>
                )}
                {clusterId === 5 && (
                  <svg width="20" height="20" style={{ marginRight: "10px" }}>
                    <polygon
                      points="10,2 16,6 16,14 10,18 4,14 4,6"
                      fill="#feca57"
                      stroke="#f08c00"
                      strokeWidth="2"
                    />
                  </svg>
                )}
                {clusterId > 5 && (
                  <svg width="16" height="16" style={{ marginRight: "8px" }}>
                    <circle
                      cx="8"
                      cy="8"
                      r="6"
                      fill="#e9ecef"
                      stroke="#868e96"
                      strokeWidth="1"
                    />
                  </svg>
                )}

                <span>Cluster {clusterId}</span>

                {/* Keywords Tooltip */}
                <div
                  data-keywords={`cluster-${clusterId}`}
                  style={{
                    display: "none",
                    position: "absolute",
                    left: "100%",
                    top: "0",
                    marginLeft: "10px",
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    padding: "8px",
                    minWidth: "160px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    zIndex: "1001",
                    whiteSpace: "normal",
                  }}
                >
                  {uniqueKeywords.length > 0 ? (
                    <>
                      <div
                        style={{
                          fontWeight: "bold",
                          marginBottom: "6px",
                          fontSize: "11px",
                          color: "#333",
                        }}
                      >
                        Keywords:
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px",
                        }}
                      >
                        {uniqueKeywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            style={{
                              backgroundColor: "#e3f2fd",
                              color: "#1976d2",
                              padding: "3px 6px",
                              borderRadius: "10px",
                              fontSize: "10px",
                              border: "1px solid #90caf9",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: "#999", fontSize: "10px" }}>
                      No keywords yet
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ButtonPanel
        svgRef={svgRef}
        setShowHex={setShowHex}
        setShowJourney={setShowJourney}
        setShowJourneyTwo={localStorage.getItem("clickButton")}
        setShowAllLearners={setShowAllLearners}
        setShowModules={setShowModules}
        setShowResources={setShowResources}
        setShowTopicLines={setShowTopicLines}
        setShowClusters={setShowClusters}
        showClusters={showClusters}
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
        oldPos={{ x: xScale(data.x), y: yScale(data.y) }} // you may want to adjust this
        xScale={xScale}
        yScale={yScale}
        data={updatingData}
        setRefresh={setRefresh}
      />
    </div>
  );
};

export default TeacherMap;
