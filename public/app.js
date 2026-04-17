// Dashboard Configuration
const LOCATIONS = ['Dow\'s Lake', 'Fifth Avenue', 'NAC'];
const REFRESH_INTERVAL = 30000; // 30 seconds
const CHART_DATA_POINTS = 12; // Last hour (5-minute intervals)

// Global variables for charts and data
let charts = {};
let historicalData = {
    'Dow\'s Lake': { timestamps: [], waterLevel: [], temperature: [], flowRate: [], iceThickness: [] },
    'Fifth Avenue': { timestamps: [], waterLevel: [], temperature: [], flowRate: [], iceThickness: [] },
    'NAC': { timestamps: [], waterLevel: [], temperature: [], flowRate: [], iceThickness: [] }
};

// Safety thresholds
const SAFETY_THRESHOLDS = {
    waterLevel: { min: 2.0, max: 8.0 }, // meters
    temperature: { min: -20, max: 35 }, // Celsius
    flowRate: { min: 0.5, max: 5.0 }, // m³/s
    iceThickness: { max: 50 } // cm
};

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

    // Water Level Chart
    charts.waterLevel = new Chart(document.getElementById('waterLevelChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Dow\'s Lake', data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
                { label: 'Fifth Avenue', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
                { label: 'NAC', data: [], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }
            ]
        },
        options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { display: true, text: 'Water Level (m)' } } } }
    });

    // Temperature Chart
    charts.temperature = new Chart(document.getElementById('temperatureChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Dow\'s Lake', data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
                { label: 'Fifth Avenue', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
                { label: 'NAC', data: [], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }
            ]
        },
        options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { display: true, text: 'Temperature (°C)' } } } }
    });

    // Flow Rate Chart
    charts.flowRate = new Chart(document.getElementById('flowRateChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Dow\'s Lake', data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
                { label: 'Fifth Avenue', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
                { label: 'NAC', data: [], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }
            ]
        },
        options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { display: true, text: 'Flow Rate (m³/s)' } } } }
    });

    // Ice Thickness Chart
    charts.iceThickness = new Chart(document.getElementById('iceThicknessChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Dow\'s Lake', data: [], borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
                { label: 'Fifth Avenue', data: [], borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
                { label: 'NAC', data: [], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }
            ]
        },
        options: { ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { display: true, text: 'Ice Thickness (cm)' } } } }
    });
}

// Fetch data for all locations
async function fetchAllLocationData() {
    setSystemStatus('loading');
    
    const promises = LOCATIONS.map(location => fetchLocationData(location));
    
    try {
        const results = await Promise.allSettled(promises);
        let successCount = 0;
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                updateLocationCard(LOCATIONS[index], result.value);
                addToHistoricalData(LOCATIONS[index], result.value);
                successCount++;
            } else {
                console.error(`Failed to fetch data for ${LOCATIONS[index]}:`, result.reason);
                setLocationError(LOCATIONS[index]);
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
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // If no data returned, generate mock data for demo purposes
    if (!data || data.length === 0) {
        return generateMockData(location);
    }
    
    // Return the latest data point
    return data[data.length - 1];
}

// Generate mock data for demo purposes
function generateMockData(location) {
    const baseValues = {
        'Dow\'s Lake': { waterLevel: 4.2, temperature: 12, flowRate: 1.8, iceThickness: 15 },
        'Fifth Avenue': { waterLevel: 4.5, temperature: 11, flowRate: 2.1, iceThickness: 12 },
        'NAC': { waterLevel: 4.1, temperature: 13, flowRate: 1.9, iceThickness: 18 }
    };
    
    const base = baseValues[location] || baseValues['Dow\'s Lake'];
    
    return {
        id: `mock-${Date.now()}`,
        location: location,
        waterLevel: (base.waterLevel + (Math.random() - 0.5) * 0.4).toFixed(2),
        temperature: (base.temperature + (Math.random() - 0.5) * 4).toFixed(1),
        flowRate: (base.flowRate + (Math.random() - 0.5) * 0.3).toFixed(2),
        iceThickness: Math.max(0, (base.iceThickness + (Math.random() - 0.5) * 5)).toFixed(0),
        timestamp: new Date().toISOString(),
        _ts: Math.floor(Date.now() / 1000)
    };
}

// Update location card with data
function updateLocationCard(location, data) {
    const locationKey = location.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Update sensor values
    document.getElementById(`waterLevel-${locationKey}`).textContent = `${data.waterLevel} m`;
    document.getElementById(`temperature-${locationKey}`).textContent = `${data.temperature} °C`;
    document.getElementById(`flowRate-${locationKey}`).textContent = `${data.flowRate} m³/s`;
    document.getElementById(`iceThickness-${locationKey}`).textContent = `${data.iceThickness} cm`;
    
    // Update timestamp
    const timestamp = data.timestamp || new Date(data._ts * 1000).toISOString();
    document.getElementById(`lastUpdate-${locationKey}`).textContent = 
        `Last update: ${new Date(timestamp).toLocaleString()}`;
    
    // Update safety badge
    updateSafetyBadge(location, data);
}

// Update safety badge based on sensor readings
function updateSafetyBadge(location, data) {
    const locationKey = location.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const safetyBadge = document.getElementById(`safety-${locationKey}`);
    
    let status = 'SAFE';
    let statusClass = 'safe';
    
    // Check water level
    if (data.waterLevel < SAFETY_THRESHOLDS.waterLevel.min || data.waterLevel > SAFETY_THRESHOLDS.waterLevel.max) {
        status = 'WARNING';
        statusClass = 'warning';
    }
    
    // Check temperature (extreme conditions)
    if (data.temperature < SAFETY_THRESHOLDS.temperature.min || data.temperature > SAFETY_THRESHOLDS.temperature.max) {
        status = 'DANGER';
        statusClass = 'danger';
    }
    
    // Check flow rate
    if (data.flowRate < SAFETY_THRESHOLDS.flowRate.min || data.flowRate > SAFETY_THRESHOLDS.flowRate.max) {
        status = 'WARNING';
        statusClass = 'warning';
    }
    
    // Check ice thickness (dangerous if too thick)
    if (data.iceThickness > SAFETY_THRESHOLDS.iceThickness.max) {
        status = 'DANGER';
        statusClass = 'danger';
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
    locationData.waterLevel.push(parseFloat(data.waterLevel));
    locationData.temperature.push(parseFloat(data.temperature));
    locationData.flowRate.push(parseFloat(data.flowRate));
    locationData.iceThickness.push(parseFloat(data.iceThickness));
    
    // Keep only last CHART_DATA_POINTS
    if (locationData.timestamps.length > CHART_DATA_POINTS) {
        locationData.timestamps.shift();
        locationData.waterLevel.shift();
        locationData.temperature.shift();
        locationData.flowRate.shift();
        locationData.iceThickness.shift();
    }
}

// Update all charts with latest data
function updateCharts() {
    // Get the latest timestamp array (they should all be the same)
    const timestamps = historicalData[LOCATIONS[0]].timestamps;
    
    // Update each chart
    Object.keys(charts).forEach(chartType => {
        const chart = charts[chartType];
        
        chart.data.labels = timestamps;
        
        LOCATIONS.forEach((location, index) => {
            chart.data.datasets[index].data = historicalData[location][chartType] || [];
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
    
    document.getElementById(`waterLevel-${locationKey}`).textContent = 'Error';
    document.getElementById(`temperature-${locationKey}`).textContent = 'Error';
    document.getElementById(`flowRate-${locationKey}`).textContent = 'Error';
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
