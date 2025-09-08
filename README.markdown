# Media Download and Management System

## Overview
This project is a Node.js-based backend system built with Express.js to manage media downloads and provide access to categorized content via the Pangle service. It includes API endpoints for downloading media files, tracking download jobs, retrieving content categories, and listing media items. The system also features cron jobs for cleanup tasks and timeout configurations for handling long-running requests.

## Project Structure
- **index.js**: Main entry point for setting up Express routes and cron jobs.
- **download.router.js**: Handles routes related to media downloads and job management.
- **pangle.router.js**: Manages routes for retrieving media categories and lists from the Pangle service.
- **Modules**:
  - `download.service`: Service logic for managing download tasks.
  - `pangle.service`: Service logic for fetching categories and media lists.
  - `cron/cleanup.cron`: Scheduled tasks for cleanup operations.

## Features

### 1. Download Management
- **Download All Episodes**: Initiates download tasks for all episodes of a specified film.
- **Job History**: Retrieves the history of download jobs based on query parameters.
- **Job Status**: Checks the status and results of a specific download job by its ID.

### 2. Pangle Content Management
- **Get Categories**: Retrieves a list of available media categories.
- **List Media**: Fetches a list of media items, either from a database (`getFrom=db`) or based on provided filters.

### 3. Timeout Configuration
- Routes are configured with a 5-minute timeout to prevent hanging requests, returning a 408 status code on timeout.

### 4. Cron Jobs
- The system includes a cleanup cron job to manage resources and maintain system performance.

## Installation
1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment**:
   - Create a `.env` file if required for configuration (e.g., database connection, API keys).
   - Example `.env`:
     ```
     PORT=3000
     DATABASE_URL=<your-database-url>
     ```

4. **Run the Application**:
   ```bash
   npm start
   ```

## API Endpoints

### Download Routes (`/api/v1/download`)
- **POST /**: Initiates a download for all episodes of a film.
  - **Body**: `{ clientId, filmId, filmName, filmLang }`
  - **Response**: `{ success: true, jobIds: [] }`
- **GET /job/history**: Retrieves download job history.
  - **Query**: Filtering parameters (e.g., `?status=completed`)
  - **Response**: List of job history entries.
- **GET /job/status/:jobId**: Retrieves the status of a specific download job.
  - **Params**: `jobId` (integer)
  - **Response**: Job status details.

### Pangle Routes (`/api/v1/pangle`)
- **GET /categories**: Retrieves a list of media categories.
  - **Response**: Array of category objects.
- **POST /list**: Retrieves a list of media items.
  - **Query**: `getFrom=db` to fetch from database, otherwise uses request body filters.
  - **Body**: Filter parameters (e.g., validated via `pangleFilterSchema`).
  - **Response**: List of media items.

## Error Handling
- The system uses a custom `ApiError` class for structured error responses.
- Validation errors (e.g., invalid request body for `/api/v1/pangle/list`) return a 400 status code with a descriptive message.

## Timeout Handling
- All routes have a 5-minute timeout configured via middleware in `index.js`.
- If a request exceeds this limit, a 408 status code is returned with the message: `{ error: 'Request Timeout after 5 minutes' }`.

## Cron Jobs
- **Cleanup Cron**: Defined in `modules/cron/cleanup.cron`. Automatically handles resource cleanup tasks to maintain system efficiency.

## Dependencies
- **Express.js**: Web framework for routing and middleware.
- **Joi** (assumed): For request body validation in `pangle.router.js`.
- **Custom Modules**:
  - `download.service`: Handles download-related logic.
  - `pangle.service`: Manages media content retrieval.
  - `cron/cleanup.cron`: Manages scheduled cleanup tasks.

## Usage Example
### Start a Download
```bash
curl -X POST http://localhost:3000/api/v1/download \
-H "Content-Type: application/json" \
-d '{"clientId": "123", "filmId": "456", "filmName": "Sample Film", "filmLang": "en"}'
```

### Get Pangle Categories
```bash
curl http://localhost:3000/api/v1/pangle/categories
```

### List Media from Database
```bash
curl http://localhost:3000/api/v1/pangle/list?getFrom=db
```

## Notes
- Ensure the `DownloadService` and `PangleService` modules are properly implemented to handle the business logic for downloads and media retrieval.
- The `pangleFilterSchema` (Joi schema) should be defined in `common/dtos/pangle.dto` for validating POST `/list` requests.
- Add appropriate error handling middleware in your Express app to catch and format errors thrown by routes.

## Future Improvements
- Add authentication/authorization for secure access to endpoints.
- Implement rate limiting to prevent abuse.
- Expand cron jobs for additional maintenance tasks.
- Add unit tests for services and routes.