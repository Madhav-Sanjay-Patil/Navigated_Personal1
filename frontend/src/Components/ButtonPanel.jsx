// ButtonPanel component that provides interactive UI elements (zoom, move, play) and toggles for various views such as learners, modules, and resources.
import { Fragment, useEffect } from "react";
import { ZoomIn, ZoomOut, Arrows, Play } from "react-flaticons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonGroup, Button } from "react-bootstrap";
import * as d3 from "d3";

const ButtonPanel = ({
    setShowJourney,
    setShowHex,
    svgRef,
    xScale,
    yScale,
    learnerPosState,
    zoomRef,
    transform,
    setShowAllLearners,
    setShowModules,
    setShowResources,
    setShowTopicLines,
    isDrag,
    setIsDrag,
    enrolledLearnersByCourse,
    setTransform,
    setShowJourneyTwo
}) => {
    var trans = transform.k;
    // console.log("setShowJourneyTwo: ", setShowJourneyTwo);

    useEffect(() => {
        const checkClickButton = () => {
            const isClicked = localStorage.getItem("clickButton") === "true"; // Ensure proper type checking
            if (isClicked) {
                setShowJourney(setShowJourneyTwo);
                localStorage.removeItem("clickButton"); // Prevents re-triggering
            }
        };

        checkClickButton(); // Check on mount

        const handleStorageChange = (event) => {
            if (event.key === "clickButton" && event.newValue === "true") {
                checkClickButton();
            }
        };

        window.addEventListener("storage", handleStorageChange); // Listen for storage updates

        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, [setShowJourney]); // Ensures effect runs properly



    useEffect(() => {
        setTransform((prev) => ({
            ...prev,
            k: prev.k * (1000 / 1001),
            x: prev.x * (1000 / 1001),
            y: prev.y * (1000 / 1001),
        }));
        setTimeout(() => {
            setTransform((prev) => ({
                ...prev,
                k: prev.k * (1001 / 1000),
                x: prev.x * (1001 / 1000),
                y: prev.y * (1001 / 1000),
            }));
        }, 0);
    }, [setTransform]);

    return (
        <Fragment>
            <ButtonGroup
                vertical={true}
                style={{
                    position: "absolute",
                    zIndex: "100",
                    left: "10px",
                    top: "10px",
                }}
            >
                <Button
                    id="recentre"
                    onClick={() => {
                        const svg = d3.select(svgRef.current);
                        const [x, y] = learnerPosState[0]; // Extract x and y coordinates
                        const width = svg.node().getBoundingClientRect().width;
                        const height = svg.node().getBoundingClientRect().height;
                        svg
                            .transition()
                            .duration(750)
                            .call(
                                zoomRef.current.transform,
                                d3.zoomIdentity
                                    .translate(width / 2, height / 2) // Move the center of the map
                                    .scale(transform.k)
                                    .translate(-xScale(x), -yScale(y)) // Translate the map based on the user's position
                            );
                    }}
                >
                    <span>
                        <FontAwesomeIcon
                            style={{
                                fontSize: "25px",
                                color: "black",
                                verticalAlign: "middle",
                            }}
                            icon="location-crosshairs"
                            size="xs"
                        />
                    </span>
                </Button>
                <Button
                    id="zoomIn"
                    onClick={() => {
                        const svg = d3.select(svgRef.current);
                        svg.transition().duration(750).call(
                            zoomRef.current.scaleBy,
                            1.5 // Zoom in by a factor of 1.5
                        );
                    }}
                >
                    <span>
                        <ZoomIn color="black"></ZoomIn>
                    </span>
                </Button>
                <Button
                    id="zoomOut"
                    onClick={() => {
                        const svg = d3.select(svgRef.current);
                        svg.transition().duration(750).call(
                            zoomRef.current.scaleBy,
                            1 / 1.5 // Zoom out by a factor of 1.5
                        );
                    }}
                >
                    <span>
                        <ZoomOut color="black"></ZoomOut>
                    </span>
                </Button>
                <Button
                    id="Move"
                    onClick={() => {
                        const svg = d3.select(svgRef.current);
                        svg.style("cursor", "move"); // Change cursor to move
                    }}
                >
                    <span>
                        <Arrows color="black"></Arrows>
                    </span>
                </Button>
                <Button
                    id="Play"
                    onClick={() => {
                        setShowJourney((curr) => {
                            if (curr) localStorage.removeItem("updatedJourneyPath");
                            return !curr;
                        });
                    }}
                >
                    <span>
                        <Play color="black"></Play>
                    </span>
                </Button>
            </ButtonGroup>
            <ButtonGroup
                style={{
                    position: "absolute",
                    zIndex: "100",
                    right: "10px",
                    bottom: "10px",
                }}
            >
                <Button
                    onClick={() => {
                        setShowHex((curr) => !curr);
                    }}
                >
                    <span style={{ color: "black" }}>Regions</span>
                </Button>
                {localStorage.getItem("type") === "TEACHER" && (
                    <Button
                        onClick={() => {
                            setShowAllLearners((curr) => !curr);
                        }}
                    >
                        <span style={{ color: "black" }}>Learners</span>
                    </Button>
                )}
                <Button
                    onClick={() => {
                        setShowModules((curr) => !curr);
                    }}
                >
                    <span style={{ color: "black" }}>Modules</span>
                </Button>
                <Button
                    onClick={() => {
                        setShowTopicLines((curr) => !curr);
                    }}
                >
                    <span style={{ color: "black" }}>Topics</span>
                </Button>
                <Button
                    onClick={() => {
                        setShowResources((curr) => !curr);
                    }}
                >
                    <span style={{ color: "black" }}>Resources</span>
                </Button>
            </ButtonGroup>
        </Fragment>
    );
};

export default ButtonPanel;
