https://github.com/Niveditha-Angaraju/Navigated-Learning

tasks:
- add learner for simulator to database
- dropdown to select course
- add learner map to the simulator page
- add simulator code to backend and make api available to frontend
- add system to interact with the model in a loop
- latest polylines should be visible beside the simulator

dqn simulator backend:
- needs polyline as input
- returns next resource_id to access next
- frontend will be updated to point to next resource
- training can run in the backend, and trained model can be deployed through the rest api
- can use pygame env during training -> use eel or similar to display on webpage -> display on frontend using iframe
