// The Learners component renders a visual representation of a learner or TA on a graph using D3. It fetches and displays learner details, 
// including their position, and uses a graduation cap icon for TAs and a user icon for learners. Clicking a learner fetches and 
// updates their activity data. A tooltip displays learner position on hover
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
}) => {

    function addLearnerToLocalStorage(newLearner) {
        // Step 1: Retrieve existing learners from localStorage
        let existingLearners = localStorage.getItem("allEnrolledLearners");
        try {
            // Parse the existing learners, ensuring it's an array
            existingLearners = existingLearners ? JSON.parse(existingLearners) : [];
            if (!Array.isArray(existingLearners)) {
                throw new Error("Existing learners is not an array");
            }
        } catch (error) {
            console.error("Error parsing existing learners from localStorage:", error);
            // Reset to an empty array if parsing fails
            existingLearners = [];
        }

        // Step 2: Check if the learner already exists
        const isLearnerAlreadyEnrolled = existingLearners.some(
            (learner) => learner.enroll_id === newLearner.enroll_id
        );

        if (!isLearnerAlreadyEnrolled) {
            // Step 3: Add the new learner if not already in the set
            existingLearners.push(newLearner);

            // Step 4: Save the updated set back to localStorage
            localStorage.setItem("allEnrolledLearners", JSON.stringify(existingLearners));
        }
    }

    const taIcon = "\uf19d";  // Graduation Cap (TA)
    const learnerIcon = "\uf183";  // User Icon (Regular Learner)
    const iconToUse = enrolledLearner.ta_id ? taIcon : learnerIcon;

    addLearnerToLocalStorage(enrolledLearner);


    const pos = [enrolledLearner.x_coordinate, enrolledLearner.y_coordinate];
    // const pos=learnerPosState[0];

    // console.log("all learners", enrolledLearner);

    const inverseScale = Math.min(1 / transform.k, 1.1);
    const handleMouseOver = (event) => {
        const tooltip = d3.select(tooltipRef.current);
        tooltip
            .style("visibility", "visible")
            .html(
                `<div>
            <strong>Learner:</strong><br>
            Position: ${pos[0].toFixed(3)}, ${pos[1].toFixed(3)}
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
        const response = await getResponseGet(`activities/${enrolledLearner.enroll_id}`);
        if (response?.data) {
            // console.log("Loaded Activities", response.data);
            activitiesState[1](response.data);
        } else {
            console.error("Failed to fetch activities data", response);
        }
    }

    return (
        <>
            <g onClick={handleClick}>
                {/* Rectangle with a border */}
                <rect
                    x={xScale(pos[0])} // Adjust position to center the icon inside the rectangle
                    y={yScale(pos[1])} // Adjust position
                    width={30 * inverseScale} // Adjust width as needed
                    height={30 * inverseScale} // Adjust height as needed
                    fill="#ffbaba" // Fill color of the rectangle
                    stroke="black" // Border color
                    strokeWidth={2 * inverseScale} // Border width
                    id="individual-point"
                    onMouseOver={handleMouseOver}
                    onMouseMove={handleMouseMove}
                    onMouseOut={handleMouseOut}
                />

                {/* Font Awesome icon inside the rectangle */}
                <text
                    x={xScale(pos[0]) + 15 * inverseScale} // Adjust to place the icon inside the rectangle
                    y={yScale(pos[1]) + 15 * inverseScale} // Adjust to center the icon vertically
                    fill="black"
                    fontSize={`${20 * inverseScale}px`} // Adjust the size as needed
                    fontFamily="FontAwesome"
                    textAnchor="middle" // Center the icon horizontally
                    dominantBaseline="middle" // Center the icon vertically
                    onMouseOver={handleMouseOver}
                    onMouseMove={handleMouseMove}
                    onMouseOut={handleMouseOut}
                >
                    {iconToUse}
                </text>
                <text
                    x={xScale(pos[0]) + 15 * inverseScale} // Align with the icon
                    y={yScale(pos[1]) - 10 * inverseScale} // Place it slightly above the icon
                    fill="black"
                    fontSize={`${12 * inverseScale}px`} // Adjust the font size as needed
                    textAnchor="middle"
                >
                    {enrolledLearner.learner_name}
                </text>
            </g>


        </>
    );
};

export default Learners;
