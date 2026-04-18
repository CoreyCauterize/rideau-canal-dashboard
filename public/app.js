// Dashboard Configuration
const LOCATIONS = [
    { id: 'DowsLake', label: "Dow's Lake" },
    { id: 'FifthAvenue', label: 'Fifth Avenue' },
    { id: 'NAC', label: 'NAC' }
];
const REFRESH_INTERVAL = 30000; // 30 seconds
const CHART_DATA_POINTS = 12; // Last hour (5-minute intervals)

// Global variables for charts and data
let charts = {};
let historicalData = {
    DowsLake: { timestamps: [], surfaceTemperature: [], externalTemperature: [], iceThickness: [], snowAccumulation: [] },
    FifthAvenue: { timestamps: [], surfaceTemperature: [], externalTemperature: [], iceThickness: [], snowAccumulation: [] },
    NAC: { timestamps: [], surfaceTemperature: [], externalTemperature: [], iceThickness: [], snowAccumulation: [] }
};

const LOCATION_ID_TO_LABEL = Object.fromEntries(LOCATIONS.map((loc) => [loc.id, loc.label]));

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    fetchAllLocationData();
    startAutoRefresh();
    updateLastRefreshTime();
});

// Initialize Chart.js charts
function initializeCharts() {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 15
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            },
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    maxTicksLimit: 6
                }
            }
        },
        elements: {
            line: {
                tension: 0.4
            },
            point: {
                radius: 3
            }
        }
    };

    // Surface Temperature Chart
    charts.surfaceTemperature = new Chart(document.getElementById('surfaceTemperatureChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: "Dow's Lake", data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
                { label: 'Fifth Avenue', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
                { label: 'NAC', data: [], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }
            ]
        },
        options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { display: true, text: 'Surface Temp (°C)' } } } }
    });

    // External Temperature Chart
    charts.externalTemperature = new Chart(document.getElementById('externalTemperatureChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: "Dow's Lake", data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
                { label: 'Fifth Avenue', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
                { label: 'NAC', data: [], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }
            ]
        },
        options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { display: true, text: 'External Temp (°C)' } } } }
    });

    // Maximum Snow Accumulation Chart
    charts.snowAccumulation = new Chart(document.getElementById('snowAccumulationChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: "Dow's Lake", data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
                { label: 'Fifth Avenue', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
                { label: 'NAC', data: [], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }
            ]
        },
        options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { display: true, text: 'Max Snow (cm)' } } } }
    });

    // Ice Thickness Chart
    charts.iceThickness = new Chart(document.getElementById('iceThicknessChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: "Dow's Lake", data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
                { label: 'Fifth Avenue', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
                { label: 'NAC', data: [], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }
            ]
        },
        options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { display: true, text: 'Avg Ice Thickness (cm)' } } } }
    });
}

// Fetch data for all locations
async function fetchAllLocationData() {
    setSystemStatus('loading');
    
    const promises = LOCATIONS.map((location) => fetchLocationData(location.id));
    
    try {
        const results = await Promise.allSettled(promises);
        let successCount = 0;
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                updateLocationCard(LOCATIONS[index].id, result.value);
                addToHistoricalData(LOCATIONS[index].id, result.value);
                successCount++;
            } else {
                console.error(`Failed to fetch data for ${LOCATIONS[index].id}:`, result.reason);
                setLocationError(LOCATIONS[index].id);
            }
        });
        
        // Update system status based on success rate
        if (successCount === LOCATIONS.length) {
            setSystemStatus('online');
        } else if (successCount > 0) {
            setSystemStatus('warning');
        } else {
            setSystemStatus('offline');
        }
        
        updateCharts();
        updateLastRefreshTime();
        
    } catch (error) {
        console.error('Error fetching location data:', error);
        setSystemStatus('offline');
    }
}

// Fetch data for a specific location
async function fetchLocationData(location) {
    const response = await fetch(`/api/data?location=${encodeURIComponent(location)}`);

    if (response.status === 404) {
        return generateMockData(location);
    }

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

// Generate mock data for demo purposes
function generateMockData(location) {
    const baseValues = {
        DowsLake: { avgIce: 75, surface: -3, external: -8, snow: 5, status: 'Safe' },
        FifthAvenue: { avgIce: 72, surface: 1, external: -5, snow: 6, status: 'Unsafe' },
        NAC: { avgIce: 78, surface: -1, external: -6, snow: 4, status: 'Caution' }
    };

    const base = baseValues[location] || baseValues.DowsLake;

    return {
        id: `mock-${Date.now()}`,
        location: location,
        averageIceThicknessCm: +(base.avgIce + (Math.random() - 0.5) * 6).toFixed(2),
        averageSurfaceTemperatureC: +(base.surface + (Math.random() - 0.5) * 4).toFixed(2),
        averageExternalTemperatureC: +(base.external + (Math.random() - 0.5) * 4).toFixed(2),
        maximumSnowAccumulationCm: +(base.snow + (Math.random() - 0.5) * 2).toFixed(2),
        readingCount: 30,
        safetyStatus: base.status,
        timestamp: new Date().toISOString(),
        _ts: Math.floor(Date.now() / 1000)
    };
}

// Update location card with data
function updateLocationCard(location, data) {
    const locationKey = location.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Update sensor values
    document.getElementById(`surfaceTemperature-${locationKey}`).textContent = `${Number(data.averageSurfaceTemperatureC).toFixed(2)} °C`;
    document.getElementById(`externalTemperature-${locationKey}`).textContent = `${Number(data.averageExternalTemperatureC).toFixed(2)} °C`;
    document.getElementById(`snowAccumulation-${locationKey}`).textContent = `${Number(data.maximumSnowAccumulationCm).toFixed(2)} cm`;
    document.getElementById(`iceThickness-${locationKey}`).textContent = `${Number(data.averageIceThicknessCm).toFixed(2)} cm`;

    // Update timestamp
    const timestamp = data.timestamp || new Date(data._ts * 1000).toISOString();
    document.getElementById(`lastUpdate-${locationKey}`).textContent = 
        `Last update: ${new Date(timestamp).toLocaleString()}`;

    // Update safety badge
    updateSafetyBadge(location, data);
}

// Update safety badge based on stream safety status
function updateSafetyBadge(location, data) {
    const locationKey = location.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const safetyBadge = document.getElementById(`safety-${locationKey}`);

    const streamStatus = (data.safetyStatus || 'Unsafe').toLowerCase();
    let status = 'UNSAFE';
    let statusClass = 'danger';

    if (streamStatus === 'safe') {
        status = 'SAFE';
        statusClass = 'safe';
    } else if (streamStatus === 'caution') {
        status = 'CAUTION';
        statusClass = 'warning';
    }

    safetyBadge.textContent = status;
    safetyBadge.className = `safety-badge ${statusClass}`;
}

// Add data to historical tracking
function addToHistoricalData(location, data) {
    const locationData = historicalData[location];
    const timestamp = data.timestamp || new Date(data._ts * 1000).toISOString();
    
    // Add new data point
    locationData.timestamps.push(new Date(timestamp).toLocaleTimeString());
    locationData.surfaceTemperature.push(parseFloat(data.averageSurfaceTemperatureC));
    locationData.externalTemperature.push(parseFloat(data.averageExternalTemperatureC));
    locationData.snowAccumulation.push(parseFloat(data.maximumSnowAccumulationCm));
    locationData.iceThickness.push(parseFloat(data.averageIceThicknessCm));
    
    // Keep only last CHART_DATA_POINTS
    if (locationData.timestamps.length > CHART_DATA_POINTS) {
        locationData.timestamps.shift();
        locationData.surfaceTemperature.shift();
        locationData.externalTemperature.shift();
        locationData.snowAccumulation.shift();
        locationData.iceThickness.shift();
    }
}

// Update all charts with latest data
function updateCharts() {
    // Get the latest timestamp array (they should all be the same)
    const timestamps = historicalData[LOCATIONS[0].id].timestamps;
    
    // Update each chart
    Object.keys(charts).forEach(chartType => {
        const chart = charts[chartType];
        
        chart.data.labels = timestamps;
        
        LOCATIONS.forEach((location, index) => {
            chart.data.datasets[index].data = historicalData[location.id][chartType] || [];
        });
        
        chart.update('none'); // Update without animation for real-time feel
    });
}

// Set system status
function setSystemStatus(status) {
    const statusElement = document.getElementById('systemStatus');
    const statusClasses = ['status-online', 'status-warning', 'status-offline'];
    
    // Remove all status classes
    statusClasses.forEach(cls => statusElement.classList.remove(cls));
    
    // Set new status
    switch (status) {
        case 'online':
            statusElement.textContent = 'Online';
            statusElement.classList.add('status-online');
            break;
        case 'warning':
            statusElement.textContent = 'Partial';
            statusElement.classList.add('status-warning');
            break;
        case 'offline':
            statusElement.textContent = 'Offline';
            statusElement.classList.add('status-offline');
            break;
        case 'loading':
            statusElement.textContent = 'Loading...';
            statusElement.classList.add('status-warning');
            break;
    }
}

// Set location card to error state
function setLocationError(location) {
    const locationKey = location.toLowerCase().replace(/[^a-z0-9]/g, '-');

    document.getElementById(`surfaceTemperature-${locationKey}`).textContent = 'Error';
    document.getElementById(`externalTemperature-${locationKey}`).textContent = 'Error';
    document.getElementById(`snowAccumulation-${locationKey}`).textContent = 'Error';
    document.getElementById(`iceThickness-${locationKey}`).textContent = 'Error';
    document.getElementById(`lastUpdate-${locationKey}`).textContent = 'Connection failed';
    
    const safetyBadge = document.getElementById(`safety-${locationKey}`);
    safetyBadge.textContent = 'OFFLINE';
    safetyBadge.className = 'safety-badge danger';
}

// Update last refresh time
function updateLastRefreshTime() {
    document.getElementById('lastRefresh').textContent = new Date().toLocaleTimeString();
}

// Start auto-refresh interval
function startAutoRefresh() {
    setInterval(fetchAllLocationData, REFRESH_INTERVAL);
}
