# Navigated_React
React Portal with Database

## Clone Git Repository
To get started, clone the repository using the following command:
```bash
git clone <github link>
```

## Frontend Setup and Running Application

### Prerequisites
- Install Node.js (e.g., v20.15.1) and npm (e.g., v10.7.0).

### Steps to Setup
1. Navigate to the frontend directory (if applicable).
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Run the frontend application:
   - For HTTP:
     ```bash
     npm start
     ```
   - For HTTPS:
     - PowerShell:
       ```powershell
       $env:HTTPS="true"; npm start
       ```
     - Command Prompt:
       ```cmd
       set HTTPS=true&&npm start
       ```
     - macOS/Linux:
       ```bash
       HTTPS=true npm start
       ```

## Backend Setup and Running Application

### Prerequisites
- Install Python (e.g., 3.x).

### Steps to Setup
1. Set up a virtual environment:
   ```bash
   python3 -m venv env
   ```
2. Activate the virtual environment:
   - On Ubuntu/Linux:
     ```bash
     source env/bin/activate
     ```
   - On Windows (Command Prompt):
     ```cmd
     env\Scripts\activate
     ```
   - On Windows (PowerShell):
     ```powershell
     .\env\Scripts\Activate
     ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the backend application:
   - Using Flask:
     ```bash
     flask --app app.py run
     ```
   - Alternatively:
     ```bash
     python app.py
     ```
5. To deactivate the virtual environment:
   ```bash
   deactivate
   ```
7.Adarsha Change

### Additional Setup
- Install and set up MySQL.
- Create a database user with the required credentials and grant the necessary permissions for the user to access the database.

