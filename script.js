const searchButton = document.querySelector(".search-btn");
const userLocationInput = document.querySelector("input");
const currentGrid = document.querySelector(".current-grid");
const dailyGrid = document.querySelector(".daily-grid");
const hourlyGrid = document.querySelector(".hourly-grid");
const unitButton = document.querySelector(".unit-button");
const unitDropdown = document.querySelector(".unit-dropdown");

const mainSection = document.querySelector("main");
const errorStateSection = document.querySelector(".error-state");
const retryButton = document.querySelector(".retry-button");

const tempUnitGroup = document.querySelector(".temp-unit");
const speedUnitGroup = document.querySelector(".speed-unit");
const precipitionUnitGroup = document.querySelector(".precipitation-unit");

let tempUnit = "celsius";
let speedUnit = "kmh";
let precipitationUnit = "mm";

const tempUnitButtons = tempUnitGroup.querySelectorAll("button");
const speedUnitButtons = speedUnitGroup.querySelectorAll("button");
const precipitationUnitButtons =
    precipitionUnitGroup.querySelectorAll("button");

async function getGeoData() {
    const userLocation = userLocationInput.value;
    try {
        const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${userLocation}`;
        const response = await fetch(geoURL);
        const data = await response.json();
        return data;
    } catch (error) {
        setErrorState();
        throw new Error("Error happened when getting geo data");
    }
}
async function getWeatherData() {
    try {
        const data = await getGeoData();
        const latitude = data.results[0].latitude;
        const longitude = data.results[0].longitude;
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,rain_sum,weather_code&hourly=temperature_2m,weather_code&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,rain,wind_gusts_10m&timezone=auto&windspeed_unit=${speedUnit}&temperature_unit=${tempUnit}&precipitation_unit=${precipitationUnit}`;
        const response = await fetch(weatherUrl);
        const weatherData = await response.json();
        return weatherData;
    } catch (error) {
        setErrorState();
        throw new Error("Error happened when getting weather data");
    }
}

function createDailyDiv(day, maxTemp, minTemp) {
    const div = document.createElement("div");
    const weekDayP = document.createElement("p");
    const temperatureDiv = document.createElement("div");
    const maxTempParagraph = document.createElement("p");
    const minTempParagraph = document.createElement("p");

    weekDayP.textContent = day;
    maxTempParagraph.textContent = maxTemp.toFixed(0) + "\u00B0";
    minTempParagraph.textContent = minTemp.toFixed(0) + "\u00B0";

    temperatureDiv.append(maxTempParagraph, minTempParagraph);
    div.append(weekDayP, temperatureDiv);

    return div;
}

async function buildDailyDiv() {
    dailyGrid.replaceChildren();

    const data = await getWeatherData();
    const maxTemps = data.daily.temperature_2m_max;
    const minTemps = data.daily.temperature_2m_min;
    const times = data.daily.time;

    for (let i = 0; i < 7; i++) {
        const div = createDailyDiv(
            getDayOfWeek(times[i]),
            maxTemps[i],
            minTemps[i]
        );

        dailyGrid.appendChild(div);
    }
}

function getDayOfWeek(date) {
    const dayOfWeek = new Date(date).getDay();
    return isNaN(dayOfWeek)
        ? null
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek];
}

function getHoursOfWeekday(dates) {
    const regex = /(\d{4}-\d{2}-\d{2})T(.+)/;
    const dateMap = new Map();
    dates.forEach((date) => {
        const match = date.match(regex);
        const dateStr = match[1];
        const weekDay = getDayOfWeek(dateStr);
        const hourStr = match[2];
        if (!dateMap.has(dateStr)) {
            dateMap.set(dateStr, [hourStr]);
        } else {
            dateMap.get(dateStr).push(hourStr);
        }
    });
    return dateMap;
}

function setErrorState() {
    mainSection.classList.add("hidden");
    errorStateSection.classList.remove("hidden");
}

function retry() {
    buildCurrentDiv();
    buildDailyDiv();
    buildHourlyDiv();

    mainSection.classList.remove("hidden");
    errorStateSection.classList.add("hidden");
}

function setTempUnit(e) {
    tempUnitButtons.forEach((child) => child.classList.remove("active"));
    e.target.classList.add("active");
    tempUnit = e.target.dataset.unit;
}
function setSpeedUnit(e) {
    speedUnitButtons.forEach((child) => child.classList.remove("active"));
    e.target.classList.add("active");
    speedUnit = e.target.dataset.unit;
}
function setPrecipitationUnit(e) {
    precipitationUnitButtons.forEach((child) =>
        child.classList.remove("active")
    );
    e.target.classList.add("active");
    precipitationUnit = e.target.dataset.unit;
}

async function setHourlyTemps(weekDay) {
    const data = await getWeatherData();
    const temps = data.hourly.temperature_2m;
    const dates = data.hourly.time;
    const hourMap = getHoursOfWeekday(dates);
    const hourlyTempMap = new Map();
    let index = 0;

    hourMap.forEach((hours, date) => {
        if (getDayOfWeek(date) === weekDay) {
            hours.forEach((hour) => {
                hourlyTempMap.set(hour, temps[index]);
                index++;
            });
        } else {
            index += hours.length;
        }
    });
    return hourlyTempMap;
}

function createHourlyDiv(hour, temp) {
    const div = document.createElement("div");
    const hourP = document.createElement("p");
    const tempP = document.createElement("p");

    hourP.textContent = hour;
    tempP.textContent = temp.toFixed(0) + "\u00B0";

    div.append(hourP, tempP);

    return div;
}

async function buildHourlyDiv() {
    hourlyGrid.replaceChildren();
    const currentDay = new Date();
    const dayOfWeek = currentDay.toLocaleDateString("en-US", {
        weekday: "long",
    });
    const hourMap = await setHourlyTemps(dayOfWeek.slice(0, 3));

    hourMap.forEach((temp, hour) => {
        const hourlyDiv = createHourlyDiv(hour, temp);
        hourlyGrid.appendChild(hourlyDiv);
    });
}

function createCurrentDiv(
    {
        temperature_2m,
        time,
        apparent_temperature,
        relative_humidity_2m,
        wind_speed_10m,
        precipitation,
    },
    location,
    { precipitation: precipitationUnit, wind_speed_10m: windSpeedUnit }
) {
    const temperatureContainerDiv = document.createElement("div");
    const temperatureValueDiv = document.createElement("div");
    const locationDateDiv = document.createElement("div");
    const temperatureP = document.createElement("p");
    const locationP = document.createElement("p");
    const dateP = document.createElement("p");

    const regex = /(\d{4}-\d{2}-\d{2})T(.+)/;
    const date = new Date(time.match(regex)[1]);
    const formattedDate = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    temperatureContainerDiv.classList.add("temperature");

    temperatureP.textContent = temperature_2m.toFixed(0) + "\u00B0";
    locationP.textContent = location;
    dateP.textContent = formattedDate;

    locationDateDiv.append(locationP, dateP);
    temperatureValueDiv.append(locationDateDiv);
    temperatureContainerDiv.append(temperatureValueDiv, temperatureP);

    const feelsLikeContainer = document.createElement("div");
    const humidityContainer = document.createElement("div");
    const windContainer = document.createElement("div");
    const precipitationContainer = document.createElement("div");

    feelsLikeContainer.textContent = "Feels Like";
    humidityContainer.textContent = "Humidity";
    windContainer.textContent = "Wind";
    precipitationContainer.textContent = "Precipitation";

    feelsLikeContainer.classList.add("feels-like");
    humidityContainer.classList.add("humidity");
    windContainer.classList.add("wind");
    precipitationContainer.classList.add("precipitation");

    const feelsLikeP = document.createElement("p");
    const humidityP = document.createElement("p");
    const windP = document.createElement("p");
    const precipitationP = document.createElement("p");

    feelsLikeP.textContent = apparent_temperature.toFixed(0) + "\u00B0";
    humidityP.textContent = relative_humidity_2m.toFixed(0) + "%";
    windP.textContent = wind_speed_10m.toFixed(0) + " " + windSpeedUnit;
    precipitationP.textContent =
        precipitation.toFixed() + " " + precipitationUnit;

    feelsLikeContainer.appendChild(feelsLikeP);
    humidityContainer.appendChild(humidityP);
    windContainer.appendChild(windP);
    precipitationContainer.appendChild(precipitationP);

    const valueContainers = [
        temperatureContainerDiv,
        feelsLikeContainer,
        humidityContainer,
        windContainer,
        precipitationContainer,
    ];

    return valueContainers;
}

async function buildCurrentDiv() {
    currentGrid.replaceChildren();
    const weatherData = await getWeatherData();

    createCurrentDiv(
        weatherData.current,
        "Baku",
        weatherData.current_units
    ).forEach((container) => currentGrid.appendChild(container));
}

searchButton.addEventListener("click", () =>
    getGeoData().then((result) => console.log(result))
);
searchButton.addEventListener("click", () =>
    getWeatherData().then((result) => console.log(result))
);
searchButton.addEventListener("click", () => buildDailyDiv());
searchButton.addEventListener("click", () => buildHourlyDiv());
searchButton.addEventListener("click", () => buildCurrentDiv());
searchButton.addEventListener("click", () =>
    setHourlyTemps("Sun").then((result) => console.log(result))
);

unitButton.addEventListener("click", () =>
    unitDropdown.classList.toggle("hidden")
);

tempUnitButtons.forEach((button) =>
    button.addEventListener("click", setTempUnit)
);
speedUnitButtons.forEach((button) =>
    button.addEventListener("click", setSpeedUnit)
);
precipitationUnitButtons.forEach((button) =>
    button.addEventListener("click", setPrecipitationUnit)
);

retryButton.addEventListener("click", retry);
