// Learners.jsx

import * as d3 from "d3";
import { getResponseGet } from "../../../lib/utils";

const Learners = ({
  enroll_id,
  tooltipRef,
  transform,
  xScale,
  yScale,
  enrolledLearner,
  activitiesState,
  cluster_id,
  showClusters = false,
  showKeywords = false, // not used yet, but kept for future
}) => {
  console.log(
    "Rendering Learner:",
    enrolledLearner.learner_name,
    "Cluster:",
    cluster_id,
    "Position:",
    [enrolledLearner.x_coordinate, enrolledLearner.y_coordinate]
  );

  function addLearnerToLocalStorage(newLearner) {
    let existingLearners = localStorage.getItem("allEnrolledLearners");
    try {
      existingLearners = existingLearners ? JSON.parse(existingLearners) : [];
      if (!Array.isArray(existingLearners)) {
        throw new Error("Existing learners is not an array");
      }
    } catch (error) {
      console.error(
        "Error parsing existing learners from localStorage:",
        error
      );
      existingLearners = [];
    }

    const isLearnerAlreadyEnrolled = existingLearners.some(
      (learner) => learner.enroll_id === newLearner.enroll_id
    );

    if (!isLearnerAlreadyEnrolled) {
      existingLearners.push(newLearner);
      localStorage.setItem(
        "allEnrolledLearners",
        JSON.stringify(existingLearners)
      );
    }
  }

  // Define cluster styles - different shapes and colors for each cluster
  const getClusterStyle = (clusterId) => {
    const styles = {
      1: { shape: "rect", color: "#ff6b6b", borderColor: "#c92a2a" }, // Red Rectangle
      2: { shape: "circle", color: "#4ecdc4", borderColor: "#0a9396" }, // Teal Circle
      3: { shape: "triangle", color: "#45b7d1", borderColor: "#1971c2" }, // Blue Triangle
      4: { shape: "diamond", color: "#96ceb4", borderColor: "#2f9e44" }, // Green Diamond
      5: { shape: "hexagon", color: "#feca57", borderColor: "#f08c00" }, // Yellow Hexagon
    };
    // Default to light gray rectangle if no cluster assigned
    return (
      styles[clusterId] || {
        shape: "rect",
        color: "#ffbaba",
        borderColor: "rgba(34, 6, 6, 1)",
      }
    );
  };

  const taIcon = "\uf19d"; // Graduation Cap
  const learnerIcon = "\uf183"; // User Icon
  const iconToUse = enrolledLearner.ta_id ? taIcon : learnerIcon;

  addLearnerToLocalStorage(enrolledLearner);

  const pos = [enrolledLearner.x_coordinate, enrolledLearner.y_coordinate];
  const inverseScale = Math.min(1 / transform.k, 1.1);

  const clusterStyle =
    showClusters && cluster_id
      ? getClusterStyle(cluster_id)
      : {
          shape: "rect",
          color: "pink",
          borderColor: "rgba(34, 6, 6, 1)",
        };

  const handleMouseOver = (event) => {
    const tooltip = d3.select(tooltipRef.current);
    tooltip
      .style("visibility", "visible")
      .html(
        `<div>
          <strong>${enrolledLearner.learner_name || "Learner"}</strong><br>
          Position: ${pos[0].toFixed(3)}, ${pos[1].toFixed(3)}<br>
          <strong>Cluster: ${
            cluster_id !== undefined && cluster_id !== null ? cluster_id : "N/A"
          }</strong>
        </div>`
      )
      .style("left", `${event.pageX + 15}px`)
      .style("top", `${event.pageY - 125}px`);
  };

  const handleMouseMove = (event) => {
    const tooltip = d3.select(tooltipRef.current);
    tooltip
      .style("left", `${event.pageX + 15}px`)
      .style("top", `${event.pageY - 125}px`);
  };

  const handleMouseOut = () => {
    const tooltip = d3.select(tooltipRef.current);
    tooltip.style("visibility", "hidden");
  };

  const handleClick = async () => {
    const response = await getResponseGet(
      `activities/${enrolledLearner.enroll_id}`
    );
    if (response?.data) {
      activitiesState[1](response.data);
    } else {
      console.error("Failed to fetch activities data", response);
    }
  };

  const renderClusterShape = () => {
    const x = xScale(pos[0]);
    const y = yScale(pos[1]);
    const size = 15 * inverseScale;
    const strokeWidth = 2 * inverseScale;

    const commonProps = {
      fill: clusterStyle.color,
      stroke: clusterStyle.borderColor,
      strokeWidth: strokeWidth,
      id: "individual-point",
      onMouseOver: handleMouseOver,
      onMouseMove: handleMouseMove,
      onMouseOut: handleMouseOut,
      style: { cursor: "pointer" },
    };

    switch (clusterStyle.shape) {
      case "circle":
        return <circle cx={x + size} cy={y + size} r={size} {...commonProps} />;

      case "rect":
        return (
          <rect
            x={x}
            y={y}
            width={30 * inverseScale}
            height={30 * inverseScale}
            {...commonProps}
          />
        );

      case "triangle":
        const trianglePoints = `${x + size},${y} ${x + 30 * inverseScale},${
          y + 30 * inverseScale
        } ${x},${y + 30 * inverseScale}`;
        return <polygon points={trianglePoints} {...commonProps} />;

      case "diamond":
        const diamondPoints = `${x + size},${y} ${x + 30 * inverseScale},${
          y + size
        } ${x + size},${y + 30 * inverseScale} ${x},${y + size}`;
        return <polygon points={diamondPoints} {...commonProps} />;

      case "hexagon":
        const hexPoints = [];
        const hexSize = size;
        const centerX = x + size;
        const centerY = y + size;
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const px = centerX + hexSize * Math.cos(angle);
          const py = centerY + hexSize * Math.sin(angle);
          hexPoints.push(`${px},${py}`);
        }
        return <polygon points={hexPoints.join(" ")} {...commonProps} />;

      default:
        return (
          <rect
            x={x}
            y={y}
            width={30 * inverseScale}
            height={30 * inverseScale}
            {...commonProps}
          />
        );
    }
  };

  return (
    <>
      <g onClick={handleClick}>
        {/* Cluster-based shape */}
        {renderClusterShape()}

        {/* Icon inside the shape */}
        <text
          x={xScale(pos[0]) + 15 * inverseScale}
          y={yScale(pos[1]) + 15 * inverseScale}
          fill="black"
          fontSize={`${20 * inverseScale}px`}
          fontFamily="FontAwesome"
          textAnchor="middle"
          dominantBaseline="middle"
          onMouseOver={handleMouseOver}
          onMouseMove={handleMouseMove}
          onMouseOut={handleMouseOut}
          style={{ pointerEvents: "none" }}
        >
          {iconToUse}
        </text>

        {/* Learner name above */}
        <text
          x={xScale(pos[0]) + 15 * inverseScale}
          y={yScale(pos[1]) - 10 * inverseScale}
          fill="black"
          fontSize={`${12 * inverseScale}px`}
          textAnchor="middle"
          style={{ pointerEvents: "none" }}
        >
          {enrolledLearner.learner_name}
        </text>

        {/* Cluster badge */}
        {showClusters && cluster_id != null && (
          <g>
            <circle
              cx={xScale(pos[0]) + 25 * inverseScale}
              cy={yScale(pos[1]) + 5 * inverseScale}
              r={8 * inverseScale}
              fill="white"
              stroke={clusterStyle.borderColor}
              strokeWidth={1.5 * inverseScale}
            />
            <text
              x={xScale(pos[0]) + 25 * inverseScale}
              y={yScale(pos[1]) + 5 * inverseScale}
              fill={clusterStyle.borderColor}
              fontSize={`${10 * inverseScale}px`}
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ pointerEvents: "none" }}
            >
              {cluster_id}
            </text>
          </g>
        )}
      </g>
    </>
  );
};

export default Learners;
