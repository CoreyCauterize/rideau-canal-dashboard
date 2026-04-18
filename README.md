# Rideau Canal Dashboard

## Overview

The Rideau Canal Dashboard is a web application that shows near real-time monitoring data for three canal locations:

- Dow's Lake
- Fifth Avenue
- NAC

It serves static dashboard assets and exposes API endpoints that read sensor data from Azure Cosmos DB.

### Dashboard Features

- Location cards with current readings and last update time
- Safety status badges (Safe, Warning, Danger)
- Historical charts for:
  - Water level
  - Temperature
  - Flow rate
  - Ice thickness
- Auto-refresh every 30 seconds
- System status indicator (Online, Partial, Offline)

### Technologies Used

- Node.js
- Express
- CORS
- Azure Cosmos DB SDK
- Chart.js
- HTML/CSS/JavaScript

## Prerequisites

- Node.js 18+
- npm
- Azure Cosmos DB account (NoSQL API)
- Cosmos DB database and container with data written by Stream Analytics

Recommended Cosmos setup for this project:

- Database: RideauCanalDB
- Container: SensorAggregations
- Partition key path: /location

Important note:

- The current server implementation in server.js reads from container DataContainer.
- If your Stream Analytics job writes to SensorAggregations, update server.js to query SensorAggregations.

## Installation

1. Open a terminal in the dashboard folder.
2. Install dependencies.

	npm install

3. Start the server.

	node server.js

4. Open the dashboard in your browser.

	http://localhost:3000

## Configuration

Set these environment variables before running the server:

- COSMOS_DB_ENDPOINT: Cosmos DB account endpoint URL
- COSMOS_DB_KEY: Cosmos DB primary or secondary key
- COSMOS_DB_DATABASE: Cosmos DB database name (default RideauCanalDB)
- COSMOS_DB_CONTAINER: Cosmos DB container name (default SensorAggregations)
- PORT: Optional application port (default 3000)

### Example (PowerShell)

	$env:COSMOS_DB_ENDPOINT="https://<your-account>.documents.azure.com:443/"
	$env:COSMOS_DB_KEY="<your-key>"
	$env:PORT="3000"
	node server.js

## API Endpoints

### 1) GET /

Description:

- Serves the dashboard UI from public/index.html.

Example request:

	GET http://localhost:3000/

Example response:

- HTML page for the dashboard.

### 2) GET /api/data?location={location}

Description:

- Returns the latest record from Cosmos DB for the requested location.
- If location is missing, returns HTTP 400.

Supported location values in UI:

- DowsLake
- FifthAvenue
- NAC

Example request:

	GET http://localhost:3000/api/data?location=DowsLake

Example successful response (200):

	{
	  "id": "DowsLake-2026-04-18T22:10:00.0000000Z",
	  "location": "DowsLake",
	  "timestamp": "2026-04-18T22:10:00.0000000Z",
	  "averageIceThicknessCm": 75.87,
	  "minIceThicknessCm": 50.85,
	  "maxIceThicknessCm": 98.97,
	  "averageSurfaceTemperatureC": -0.34,
	  "minSurfaceTemperatureC": -9.37,
	  "maxSurfaceTemperatureC": 9.42,
	  "maximumSnowAccumulationCm": 9.97,
	  "averageExternalTemperatureC": -4.99,
	  "readingCount": 24,
	  "safetyStatus": "Caution"
	}

Example not found response (404):

	{
	  "error": "No data found for location 'DowsLake'"
	}

Example error response (400):

	{
	  "error": "Location query parameter is required"
	}

Example error response (500):

	{
	  "error": "Internal Server Error"
	}

## Deployment to Azure App Service

### Step-by-Step Deployment Guide

1. Push the dashboard project to your GitHub repository.
2. In Azure Portal, create an App Service (Node.js runtime).
3. Configure Deployment Center to deploy from GitHub.
4. Set startup command if needed:

	node server.js

5. Add environment variables in App Service Configuration:
	- COSMOS_DB_ENDPOINT
	- COSMOS_DB_KEY
	- PORT (optional; App Service provides one automatically)
6. Save and restart the App Service.
7. Verify the site loads and API endpoint returns data.

### Configuration Settings

- Runtime stack: Node.js LTS
- Always On: Enabled (recommended)
- Health checks: Optional but recommended
- CORS: Configure if frontend and API are split across different hosts

## Dashboard Features

### Real-Time Updates

- Automatic refresh interval: 30 seconds
- Fetches each configured location in parallel
- Updates cards, status indicators, and charts after each refresh

### Charts and Visualizations

- Line charts rendered with Chart.js
- Up to 12 points retained per series (approximately last hour at 5-minute data intervals)
- Multi-series comparison across all three locations

### Safety Status Indicators

- Status levels:
  - SAFE
  - WARNING
  - DANGER
- Derived from threshold checks in client logic
- Displayed on each location card as a badge

## Troubleshooting

### Common Issues and Fixes

1. Dashboard shows no live data
	- Check environment variables are set correctly.
	- Verify Cosmos DB account, database, and container names.
	- Confirm Stream Analytics is writing to the same container being queried.

2. API returns 500 Internal Server Error
	- Validate COSMOS_DB_ENDPOINT and COSMOS_DB_KEY.
	- Check App Service logs or local console output.
	- Ensure firewall/network rules allow App Service to access Cosmos DB.

3. API returns empty array for a valid location
	- Confirm documents contain the location field with matching values.
	- Verify partition key path is /location for SensorAggregations container.
	- Make sure the query location string exactly matches stored values.

4. Frontend shows fallback or unexpected values
	- The current client has mock fallback behavior when no records are returned.
	- Confirm this behavior is desired for production.

5. Deployed app does not start
	- Ensure Node runtime is compatible.
	- Confirm startup command and package dependencies are valid.
	- Review App Service startup logs.