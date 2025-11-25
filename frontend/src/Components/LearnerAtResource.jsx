// LearnerAtResource component visualizes a learner's position on the map with a circle and an icon.
// - The position of the learner is represented as a circle on the SVG canvas, with dynamic scaling based on zoom level (transform.k).
// - When the mouse hovers over the circle, a tooltip is displayed showing the learner's coordinates with formatted precision.
// - The tooltip follows the mouse movement, appearing near the mouse cursor, and disappears when the mouse moves out.
// - The circle has a dotted border and adjusts its position based on the `xScale` and `yScale` functions, which are responsible for mapping the coordinates to screen space.
// - The FontAwesome icon ("\uf263") is centered inside the circle to represent the learner visually.
import * as d3 from "d3";

const LearnerAtResource = ({
    tooltipRef,
    transform,
    xScale,
    yScale,
    pos,
}) => {
    //   const pos = [enrolledLearner.x_coordinate, enrolledLearner.y_coordinate];
    const inverseScale = Math.min(1 / transform.k, 1.1);
    // console.log("all learners are ", enrolledLearner)
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
    return (
        <>
            <g>

                <circle
                    cx={xScale(pos[0]) + 15 * inverseScale} // Adjust position to center the icon inside the rectangle
                    cy={yScale(pos[1]) + 15 * inverseScale} // Adjust position
                    r={15 * inverseScale}
                    fill="#ffbaba"
                    stroke="black" // Border color
                    strokeWidth={2 * inverseScale} // Border width
                    id="individual-point"
                    strokeDasharray="2, 2" // Dotted border
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
                    {"\uf263"}
                </text>
                {/* <text
          x={xScale(pos[0]) + 15 * inverseScale} // Align with the icon
          y={yScale(pos[1]) - 10 * inverseScale} // Place it slightly above the icon
          fill="black"
          fontSize={`${12 * inverseScale}px`} // Adjust the font size as needed
          textAnchor="middle"
        >
          {enrolledLearner.learner_name}
        </text> */}
            </g>


        </>
    );
};

export default LearnerAtResource;
