// Déclaration de la fonction debounce pour optimiser les appels de fonction
function debounce(func, wait, immediate) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

const cityInput = document.getElementById('cityInput');
const citySelect = document.getElementById('citySelect');
const resultDiv = document.getElementById('result');
citySelect.style.display = 'none';

function searchCity() {
    const input = cityInput.value.trim();
    if (input === '') {
        alert('Veuillez entrer le nom d\'une ville');
        return;
    }

    fetch('https://countriesnow.space/api/v0.1/countries')
        .then(response => {
            if (!response.ok) throw new Error('Réponse réseau non OK');
            return response.json();
        })
        .then(data => {
            let cityFound = false;
            data.data.forEach(country => {
                country.cities.forEach(city => {
                    if (city === input) {
                        cityFound = true;
                        getWeather(city, country.iso2);
                    }
                });
            });
            if (!cityFound) {
                resultDiv.innerHTML = `La ville ${input} n'a pas été trouvée.`;
            }
        })
        .catch(error => {
            console.error('Erreur lors de la recherche de la ville:', error);
            resultDiv.innerHTML = 'Une erreur est survenue lors de la recherche de la ville.';
        });
}

function showSuggestions() {
    const input = cityInput.value.trim().toLowerCase();
    if (input === '') {
        citySelect.style.display = 'none';
        return;
    }

    fetch('https://countriesnow.space/api/v0.1/countries')
        .then(response => {
            if (!response.ok) throw new Error('Réponse réseau non OK');
            return response.json();
        })
        .then(data => {
            const suggestions = [];
            data.data.forEach(country => {
                country.cities.forEach(city => {
                    if (city.toLowerCase().startsWith(input)) {
                        suggestions.push({ city, iso2: country.iso2 });
                    }
                });
            });
            renderSuggestions(suggestions);
        })
        .catch(error => {
            console.error('Erreur lors de la recherche des suggestions de villes:', error);
            citySelect.innerHTML = '';
        });
}

function renderSuggestions(suggestions) {
    citySelect.innerHTML = '';
    suggestions.forEach(suggestion => {
        const option = document.createElement('option');
        option.textContent = suggestion.city;
        option.setAttribute('data-iso2', suggestion.iso2);
        citySelect.appendChild(option);
    });
    citySelect.style.display = suggestions.length > 0 ? 'block' : 'none';
}

cityInput.addEventListener('input', debounce(showSuggestions, 500));

citySelect.addEventListener('change', () => {
    const selectedOption = citySelect.options[citySelect.selectedIndex];
    getWeather(selectedOption.textContent, selectedOption.getAttribute('data-iso2'));
    cityInput.value = selectedOption.textContent;
    citySelect.style.display = 'none';
});

function getWeather(city, iso2) {
    const apiKey = '1e16acfede1ce83bf90221ffe71dc46b';
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city},${iso2}&appid=${apiKey}`;
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error('Réponse réseau non OK pour les données météo');
            return response.json();
        })
        .then(data => {
            const weatherIconUrl = determineWeatherIcon(data.weather[0].description);
            resultDiv.innerHTML = `
                <div id="meteo">
                <div id="info">
                <h2>Météo pour ${city}, ${iso2}</h2>
                <p>Température: ${data.main.temp} K</p>
                <p>humidity: ${data.main.humidity} </p>
                <p>wind speed : ${data.wind.speed} </p>
                <p>wind deg : ${data.wind.deg} </p>
                <p>wind gust : ${data.wind.gust} </p>
                <p>sunrise : ${ new Date(data.sys.sunrise * 1000)} </p>
                <p>sunset : ${ new Date(data.sys.sunset * 1000)} </p>
                <p>Description: ${data.weather[0].description}</p>
                <p>Longitude : ${data.coord.lon} - Longitude : ${data.coord.lat}</p>  
                </div>
                <div id="image"><img src="${weatherIconUrl}" alt="./weather.png"> </div>
                </div>
            `;
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des données météo:', error);
            resultDiv.innerHTML = 'Une erreur est survenue lors de la récupération des données météo.';
        });
}

function determineWeatherIcon(description) {
    description = description.toLowerCase();
    if (description.includes('clear')) return '/sun.png';
    if (description.includes('rain')) return '/rainy.png';
    if (description.includes('cloud')) return '/cloud.png';
    return '/weather.png'; // Image par défaut
}
