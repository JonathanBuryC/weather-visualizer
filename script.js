let map;
let marker;

document.getElementById('searchButton').addEventListener('click', () => {
    const city = document.getElementById('cityInput').value;
    fetchCoordinates(city);
});

function fetchCoordinates(city) {
    const apiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP ! statut : ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.results && data.results.length > 0) {
                const { latitude, longitude } = data.results[0];
                fetchWeatherData(latitude, longitude);
                updateMap(latitude, longitude);
            } else {
                console.error('Ville non trouvée');
            }
        })
        .catch(error => console.error('Erreur lors de la récupération des coordonnées :', error));
}

function fetchWeatherData(latitude, longitude) {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP ! statut : ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            displayWeatherData(data);
            displayForecast(data);
            applyWeatherEffect(data.current_weather.weathercode);
        })
        .catch(error => console.error('Erreur lors de la récupération des données météorologiques :', error));
}

function displayWeatherData(data) {
    if (!data || !data.current_weather) {
        console.error('Données météorologiques invalides :', data);
        return;
    }

    const weatherDataDiv = document.getElementById('weatherData');
    const weather = data.current_weather;
    const weatherIcon = getWeatherIcon(weather.weathercode);

    weatherDataDiv.innerHTML = `
        <h2>Météo actuelle</h2>
        <img src="${weatherIcon}" alt="Weather Icon" class="weather-icon">
        <p>Température : ${weather.temperature} °C</p>
        <p>Vitesse du vent : ${weather.windspeed} km/h</p>
        <p>Direction du vent : ${weather.winddirection}°</p>
    `;
}

function displayForecast(data) {
    if (!data || !data.daily || !data.daily.time) {
        console.error('Données de prévision invalides :', data);
        return;
    }

    const forecastDiv = document.getElementById('forecast');
    const days = data.daily.time.length;

    forecastDiv.innerHTML = '';

    for (let i = 0; i < days; i++) {
        const date = new Date(data.daily.time[i]);
        const maxTemp = data.daily.temperature_2m_max[i];
        const minTemp = data.daily.temperature_2m_min[i];
        const weatherCode = data.daily.weathercode[i];
        const weatherIcon = getWeatherIcon(weatherCode);

        forecastDiv.innerHTML += `
            <div class="forecast-day">
                <h3>${date.toLocaleDateString()}</h3>
                <img src="${weatherIcon}" alt="Weather Icon" class="weather-icon">
                <p>Max : ${maxTemp} °C</p>
                <p>Min : ${minTemp} °C</p>
            </div>
        `;
    }
}

function getWeatherIcon(weatherCode) {
    // Utilisez les codes météo de l'API Open-Meteo pour obtenir les icônes appropriées
    // Exemple simple : vous pouvez utiliser des URL d'icônes météo gratuites
    const iconMap = {
        0: 'https://www.weatherbit.io/static/img/icons/c01d.png',  // Exemple d'icône pour un temps clair
        1: 'https://www.weatherbit.io/static/img/icons/c01d.png',
        2: 'https://www.weatherbit.io/static/img/icons/c02d.png',
        3: 'https://www.weatherbit.io/static/img/icons/c03d.png',
        // Ajoutez d'autres correspondances de code météo à icône ici
    };

    return iconMap[weatherCode] || 'https://www.weatherbit.io/static/img/icons/c01d.png';  // Icône par défaut
}

function applyWeatherEffect(weatherCode) {
    const container = document.querySelector('.container');
    container.classList.remove('weather-sunny', 'weather-rainy', 'weather-foggy');

    if (weatherCode === 0 || weatherCode === 1) {
        container.classList.add('weather-sunny');
    } else if (weatherCode === 2) {
        container.classList.add('weather-rainy');
    } else if (weatherCode === 3) {
        container.classList.add('weather-foggy');
    }
}

function updateMap(latitude, longitude) {
    if (!map) {
        map = L.map('map').setView([latitude, longitude], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    } else {
        map.setView([latitude, longitude], 10);
    }

    if (marker) {
        marker.setLatLng([latitude, longitude]);
    } else {
        marker = L.marker([latitude, longitude]).addTo(map)
            .bindPopup('Localisation choisie')
            .openPopup();
    }

    // Resize the map to fit the container
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}