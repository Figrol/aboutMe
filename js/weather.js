var WMO_CODES = {
  0:  { label: 'Clear sky',                   icon: '☀️'  },
  1:  { label: 'Mainly clear',                 icon: '🌤️' },
  2:  { label: 'Partly cloudy',                icon: '⛅'  },
  3:  { label: 'Overcast',                     icon: '☁️'  },
  45: { label: 'Foggy',                        icon: '🌫️' },
  48: { label: 'Rime fog',                     icon: '🌫️' },
  51: { label: 'Light drizzle',                icon: '🌦️' },
  53: { label: 'Moderate drizzle',             icon: '🌦️' },
  55: { label: 'Dense drizzle',                icon: '🌦️' },
  61: { label: 'Slight rain',                  icon: '🌧️' },
  63: { label: 'Moderate rain',                icon: '🌧️' },
  65: { label: 'Heavy rain',                   icon: '🌧️' },
  71: { label: 'Slight snow',                  icon: '🌨️' },
  73: { label: 'Moderate snow',                icon: '🌨️' },
  75: { label: 'Heavy snow',                   icon: '🌨️' },
  77: { label: 'Snow grains',                  icon: '🌨️' },
  80: { label: 'Slight showers',               icon: '🌦️' },
  81: { label: 'Moderate showers',             icon: '🌦️' },
  82: { label: 'Violent showers',              icon: '⛈️' },
  85: { label: 'Slight snow showers',          icon: '🌨️' },
  86: { label: 'Heavy snow showers',           icon: '🌨️' },
  95: { label: 'Thunderstorm',                 icon: '⛈️' },
  96: { label: 'Thunderstorm with hail',       icon: '⛈️' },
  99: { label: 'Thunderstorm, heavy hail',     icon: '⛈️' }
};

function getWeatherInfo(code) {
  return WMO_CODES[code] || { label: 'Unknown conditions', icon: '🌡️' };
}

function cToF(c) {
  return ((c * 9 / 5) + 32).toFixed(1);
}

function getDayLabel(dateStr) {
  var date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function geocode(city) {
  var url = 'https://geocoding-api.open-meteo.com/v1/search?name=' +
    encodeURIComponent(city) + '&count=1&language=en&format=json';
  return fetch(url).then(function(res) {
    return res.json();
  }).then(function(data) {
    if (!data.results || data.results.length === 0) {
      throw new Error('City "' + city + '" not found. Try a different spelling.');
    }
    return data.results[0];
  });
}

function fetchWeather(lat, lon) {
  var url = 'https://api.open-meteo.com/v1/forecast' +
    '?latitude=' + lat + '&longitude=' + lon +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,uv_index' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum' +
    '&timezone=auto&forecast_days=7';
  return fetch(url).then(function(res) { return res.json(); });
}

function renderCurrent(location, weather) {
  var c = weather.current;
  var info = getWeatherInfo(c.weather_code);
  document.getElementById('locationName').textContent = location.name + ', ' + location.country;
  document.getElementById('localTime').textContent = 'Updated: ' + new Date(c.time).toLocaleString();
  document.getElementById('currentIcon').textContent = info.icon;
  document.getElementById('currentDesc').textContent = info.label;
  document.getElementById('tempC').textContent = parseFloat(c.temperature_2m).toFixed(1);
  document.getElementById('tempF').textContent = cToF(c.temperature_2m);
  document.getElementById('feelsLike').textContent = parseFloat(c.apparent_temperature).toFixed(1);
  document.getElementById('humidity').textContent = c.relative_humidity_2m;
  document.getElementById('windSpeed').textContent = parseFloat(c.wind_speed_10m).toFixed(1);
  document.getElementById('precipitation').textContent = c.precipitation;
  document.getElementById('uvIndex').textContent = c.uv_index !== undefined ? c.uv_index : 'N/A';
}

function renderForecast(weather) {
  var d = weather.daily;
  var container = document.getElementById('forecast');
  container.innerHTML = '';
  for (var i = 0; i < d.time.length; i++) {
    var info = getWeatherInfo(d.weather_code[i]);
    var precipHtml = d.precipitation_sum[i] > 0
      ? '<div class="forecast-precip">&#128167; ' + d.precipitation_sum[i] + 'mm</div>'
      : '';
    var col = document.createElement('div');
    col.className = 'col-6 col-sm-4 col-md-3 col-lg mb-2';
    col.innerHTML =
      '<div class="forecast-card">' +
        '<div class="forecast-day">' + getDayLabel(d.time[i]) + '</div>' +
        '<div class="forecast-icon">' + info.icon + '</div>' +
        '<div class="forecast-high">' + Math.round(d.temperature_2m_max[i]) + '&deg;</div>' +
        '<div class="forecast-low">' + Math.round(d.temperature_2m_min[i]) + '&deg;</div>' +
        precipHtml +
      '</div>';
    container.appendChild(col);
  }
}

function showError(msg) {
  var el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.classList.remove('d-none');
}

function hideError() {
  document.getElementById('errorMsg').classList.add('d-none');
}

function showLoading(visible) {
  document.getElementById('loadingSpinner').classList.toggle('d-none', !visible);
}

function showWeather(visible) {
  document.getElementById('currentWeather').classList.toggle('d-none', !visible);
}

function search() {
  var city = document.getElementById('cityInput').value.trim();
  if (!city) return;
  hideError();
  showWeather(false);
  showLoading(true);
  geocode(city)
    .then(function(location) {
      return fetchWeather(location.latitude, location.longitude)
        .then(function(weather) {
          renderCurrent(location, weather);
          renderForecast(weather);
          showWeather(true);
        });
    })
    .catch(function(err) {
      showError(err.message || 'Failed to fetch weather. Please try again.');
    })
    .finally(function() {
      showLoading(false);
    });
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('searchBtn').addEventListener('click', search);
  document.getElementById('cityInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') search();
  });
});
