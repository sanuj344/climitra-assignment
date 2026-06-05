# Climitra Evidence Verification System

A production-quality MVP for an auditable evidence collection and verification platform designed for biomass procurement and carbon credit verification.

## Architecture Overview
The system is built with an offline-first mobile web application (React, Vite, Dexie) and a robust backend (FastAPI, PostgreSQL). 
- **Frontend**: React + Vite + Tailwind CSS + Zustand + Dexie
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL + PaddleOCR
- **Security**: JWT Authentication + Role Based Access Control (RBAC)

## Setup Instructions

### 1. Database
Ensure you have a local PostgreSQL instance running on `localhost:5432`.
Create the database:
```sql
CREATE DATABASE climitra_evidence;
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt

# Create tables and seed initial users
python seed.py

# Run the server
uvicorn app.main:app --reload
```
**Seed Users Created:**
- admin@climitra.local (Admin123!)
- reviewer@climitra.local (Reviewer123!)
- operator@climitra.local (Operator123!)

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## Architecture Deep Dives

### OCR Pipeline
1. **Upload**: Images are uploaded and stored in the local filesystem.
2. **Preprocessing**: (Designed for OpenCV) Images can be converted to grayscale, denoised, and perspective corrected to ensure optimal text recognition.
3. **Extraction**: PaddleOCR runs in FastAPI `BackgroundTasks` to extract `vehicle_number`, `gross_weight`, `tare_weight`, `net_weight`, `date`, `time`, and `slip_number`.
4. **Confidence**: Every extracted field is assigned a confidence score. Green (>90%), Yellow (70-89%), Red (<70%).

### Offline Architecture
The mobile capture flow uses `Dexie` (IndexedDB) as an offline store.
- If a user captures an image while offline, it is serialized to a Blob and stored locally.
- A "Sync" indicator displays the offline status.
- Once connectivity is restored, the operator can manually or automatically trigger a synchronization that iterates over the Dexie store and uploads pending blobs to the backend.

### Audit Trail Design
Every modification to an OCR extracted field is tracked in the `audit_logs` table.
The system captures:
- `user_id`: Who made the change
- `action`: `field_corrected`, `status_changed`, etc.
- `previous_value` and `new_value`: What specifically changed
- `timestamp`: When the modification occurred.
This ensures full auditable history for carbon credit verification.

---

## Tradeoffs, Assumptions & Future Improvements

### Key Tradeoffs & Assumptions
- **Local PostgreSQL vs Docker**: Assumed an existing local Postgres installation to reduce virtualization overhead and simplify setup for the immediate assignment timeline.
- **BackgroundTasks vs Celery**: We used FastAPI's built-in `BackgroundTasks` instead of Celery + Redis for OCR processing. This reduces moving parts for the MVP and ensures easier deployment under tight deadlines.
- **PaddleOCR Local Simulation**: If PaddleOCR dependencies conflict with modern Python versions natively (e.g., Python 3.14), the service simulates the extraction logic to preserve UI/UX verification without blocking deployment.

### Scaling Considerations (Future Improvements)
- **Dedicated OCR Workers**: At scale, OCR processing is highly CPU/GPU intensive. This should be moved to dedicated worker containers using **Celery + Redis** to prevent blocking the main web server threads.
- **Object Storage**: Local filesystem storage (`/uploads`) should be replaced with AWS S3 or Google Cloud Storage.
- **Advanced Duplicate Detection**: Implementation of robust perceptual hashing (phash) and OCR text similarity (Levenshtein distance) to automatically flag duplicate weighbridge slips.
- **Service Worker (PWA)**: Implement a full service worker caching strategy to allow the UI to load instantly even on a completely dead network.
