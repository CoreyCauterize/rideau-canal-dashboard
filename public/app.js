function fetchData(location) {
    fetch(`/api/data?location=${location}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('iceThickness').textContent = `${data.iceThickness} m`;
            document.getElementById('temperature').textContent = `${data.temperature} °C`;
            document.getElementById('snowAcc').textContent = `${data.snowAcc} cm`;
            document.getElementById('lastUpdate').textContent = new Date(data.lastUpdate).toLocaleString();
        })
        .catch(error => console.error('Error fetching data:', error));
}

document.getElementById('locationSelect').addEventListener('change', (event) => {
    const selectedLocation = event.target.value;
    fetchData(selectedLocation);
});

// Fetch initial data for the default location
fetchData(document.getElementById('locationSelect').value);
