# Packing Automation Application

This is a full-stack application for automated pallet packing generation. It converts sales order quantities into a detailed 3D multi-pallet packing plan with AI-generated instructions.

## Project Structure
- `client/`: React + Vite + Tailwind frontend.
- `backend/`: FastAPI backend with an algorithmic packing engine and Ollama integration.

## Running the Application

Both the Frontend and Backend must be running simultaneously for the application to work.

### 1. Backend (FastAPI Python)
Open a new terminal window, navigate to the **project root** (`Pallet` folder, NOT the `backend` folder), and run:
```powershell
# 1. If you are inside the 'backend' folder, go back to the root FIRST:
cd ..

# 2. Create and activate a Virtual Environment inside the backend folder
python.exe -m venv backend\venv
backend\venv\Scripts\Activate.ps1

# 3. Install required Python packages
pip install -r backend\requirements.txt

# 4. Start the FastAPI server (MUST be run from the root 'Pallet' folder)
python -m uvicorn backend.main:app --reload --port 8000
```
*The backend API will be available at `http://localhost:8000`. You can test this by opening `http://localhost:8000/api/doc/mock` in your browser.*

### 2. Frontend (React Vite)
Open a second terminal window, navigate to the `client` folder, and run:
```powershell
# Navigate to client directory
cd client

# Install Node dependencies (only needed the first time)
npm install

# Start the React development server
npm run dev
```
*The React UI will automatically open or be available at `http://localhost:5173`. When you use the Packing features, the frontend will automatically communicate with the backend at port 8000.*

## Features
- Complete UI conversion from single-file HTML to React.
- Mobile responsive product tables and action bars.
- 3D Visualizer using Three.js for multi-pallet arrangements.
- FastAPI backend integration providing algorithms for weight limits, fragilities, and orientations.
- Uses local data structure and localStorage persistence for drafts.
