// The TourComponent utilizes Shepherd.js to guide users through a website with a series of informative steps, 
// highlighting key features like course details, learner maps, and profile options. A TourButton triggers the tour, 
// while Tooltip and Interrogation icons provide contextual guidance.
import { useContext, useState } from 'react';
import { ShepherdTourContext, ShepherdTour } from 'react-shepherd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Interrogation } from 'react-flaticons';
import 'shepherd.js/dist/css/shepherd.css';
import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';
const tourOptions = {
  defaultStepOptions: {
    cancelIcon: {
      enabled: true,
    },
  },
  useModalOverlay: true,
};

const TourSteps = [
  {
    id: "first",
    title: "Welcome to Navigated Learning",
    text: ["Learn Courses better on Navigated Learning"],
    scrollTo: false,
    arrow: false,
    buttons: [
      {
        classes: "shepherd-button-primary",
        text: "Next",
        type: "next",
      },
    ],
  },
  {
    id: "second",
    title: "Course Details",
    text: ["Find the description of the course here"],
    attachTo: { element: "#description", on: "bottom" },
    scrollTo: true,
    buttons: [
      {
        classes: "shepherd-button-primary",
        text: "Back",
        type: "back",
      },
      {
        classes: "shepherd-button-primary",
        text: "Next",
        type: "next",
      },
    ],
  },
  {
    id: "third",
    title: "Learner Map",
    text: [
      `The map shows all the modules in the course. The learner icon <i class="fa-solid fa-person"></i> indicates your current position. The blue circles 🔵 indicate resources that are accessible to you. The white circles ⚪ indicate resources that are not yet accessible. You can access more resources by improving your position either by summarizing your learning, watching videos or attempting quizzes.`,
    ],
    attachTo: { element: "#learner-map", on: "right" },
    scrollTo: true,
    buttons: [
      {
        classes: "shepherd-button-primary",
        text: "Back",
        type: "back",
      },
      {
        classes: "shepherd-button-primary",
        text: "Next",
        type: "next",
      },
    ],
    beforeShowPromise: () => {
      return new Promise((resolve) => {
        const textNode = document.querySelector(".shepherd-text");
        const learnerIconText = "learner icon";
        
        if (textNode) {
          // Find the position where "learner icon" appears in the text
          const innerHTML = textNode.innerHTML;
          const position = innerHTML.indexOf(learnerIconText);
          
          if (position !== -1) {
            // Split the text at "learner icon" and insert the FontAwesome icon
            const beforeText = innerHTML.substring(0, position + learnerIconText.length);
            const afterText = innerHTML.substring(position + learnerIconText.length);
  
            // Add FontAwesome icon after "learner icon"
            textNode.innerHTML = `${beforeText} <FontAwesomeIcon icon="fa-solid fa-person" />${afterText}`;
          }
        }
        resolve();
      });
    },
  },
  {
    id: "fourth",
    title: "Enrolled courses",
    text: ["Click here to check all the courses you have enrolled in"],
    attachTo: { element: "#enrolled-courses", on: "left" },
    scrollTo: true,
    canClickTarget: true,
    buttons: [
      {
        classes: "shepherd-button-primary",
        text: "Back",
        type: "back",
      },
      {
        classes: "shepherd-button-primary",
        text: "Next",
        type: "next",
      },
    ],
  },
  {
    id: "fifth",
    title: "Recentre",
    text: ["Click here to recentre the map to your position"],
    attachTo: { element: "#recentre", on: "left" },
    scrollTo: true,
    canClickTarget: true,
    buttons: [
      {
        classes: "shepherd-button-primary",
        text: "Back",
        type: "back",
      },
      {
        classes: "shepherd-button-primary",
        text: "Next",
        type: "next",
      },
    ],
  },
  {
    id: "sixth",
    title: "Zoom in",
    text: ["Click here to zoom in the map"],
    attachTo: { element: "#zoomIn", on: "left" },
    scrollTo: true,
    canClickTarget: true,
    buttons: [
      {
        classes: "shepherd-button-primary",
        text: "Back",
        type: "back",
      },
      {
        classes: "shepherd-button-primary",
        text: "Next",
        type: "next",
      },
    ],
  },
  {
    id: "seventh",
    title: "zoomOut",
    text: ["Click here to zoom out the map"],
    attachTo: { element: "#zoomOut", on: "left" },
    scrollTo: true,
    canClickTarget: true,
    buttons: [
      {
        classes: "shepherd-button-primary",
        text: "Back",
        type: "back",
      },
      {
        classes: "shepherd-button-primary",
        text: "Next",
        type: "next",
      },
    ],
  },
  {
    id: "eigth",
    title: "Move",
    text: ["Click here to move around the map"],
    attachTo: { element: "#Move", on: "left" },
    scrollTo: true,
    canClickTarget: true,
    buttons: [
      {
        classes: "shepherd-button-primary",
        text: "Back",
        type: "back",
      },
      {
        classes: "shepherd-button-primary",
        text: "Next",
        type: "next",
      },
    ],
  },
  {
    id: "ninth",
    title: "Summarise your learning",
    text: ["Click on this button and summarize what you have learned so far in your own words to change your position. Your position and proficiency determine the outcomes in the course"],
    attachTo: { element: "#summarise-learning", on: "left" },
    scrollTo: true,
    canClickTarget: false,
    buttons: [
      {
        classes: "shepherd-button-primary",
        text: "Back",
        type: "back",
      },
      {
        classes: "shepherd-button-primary",
        text: "Next",
        type: "next",
      },
    ],
  },
  {
    id: "tenth",
    title: "Open profile options",
    text: ["Click here to open profile options"],
    attachTo: { element: "#nav-profile", on: "left" },
    canClickTarget: true,
    scrollTo: true,
    buttons: [
      {
        classes: "shepherd-button-primary",
        text: "Back",
        type: "back",
      },
      {
        classes: "shepherd-button-primary",
        text: "Next",
        type: "next",
      },
    ],
    // when: {
    //   show: () => {
    //     document.getElementById("nav-profile")?.click();
    //   },
    //   hide: () => {
    //     console.log("hide step");
    //   },
    // },
  },
  {
    id: "eleventh",
    title: "Learning Journey",
    text: ["Your learning journey of the summaries you have given, the resources you have accessed and the quizzes you have attempted are shown here"],
    attachTo: { element: "#learning-journey", on: "left" },
    scrollTo: true,
    buttons: [
      {
        classes: "shepherd-button-secondary",
        text: "Restart",
        action() {
          this.cancel();
          this.start();
        },
      },
      {
        classes: "shepherd-button-primary",
        text: "Done",
        type: "cancel",
      },
    ],
  },
];

const TourButton = () => {
  const tour = useContext(ShepherdTourContext);
  const [tool, setShowTool] = useState(false);
  return (
    <div style={{ textAlign: 'center' }}>

      {/* <p style={{ fontSize: "13px", margin: "2px", fontWeight: "bold", visibility: tool ? "visible" : "hidden" }}>Don't know what to do ?</p>
        <p style={{ fontSize: "13px", margin: "2px", fontWeight: "bold",visibility: tool ? "visible" : "hidden", }}> Click on the below button to find out more</p> */}

      <h6>Need help ?</h6>
      <Tooltip title="Click here to get a guided tour of the website" placement='right' arrow TransitionComponent={Fade}
        TransitionProps={{ timeout: 600 }}>
        <Interrogation onClick={() => tour.start()} onMouseOver={() => setShowTool(true)} onMouseOut={() => setShowTool(false)} className="start-tour-button" size='32px' />
      </Tooltip>

    </div>

  );
};

const TourComponent = () => (
  <ShepherdTour steps={TourSteps} tourOptions={tourOptions}>
    <TourButton />
  </ShepherdTour>
);

export default TourComponent;
