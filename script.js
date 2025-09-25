const searchButton = document.querySelector('.search-btn')
const userLocationInput = document.querySelector('input')
const currentGrid = document.querySelector('.current-grid')
const dailyGrid = document.querySelector('.daily-grid')
const hourlyGrid = document.querySelector('.hourly-grid')

async function getGeoData() {
    const userLocation =userLocationInput.value
    try {
        const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${userLocation}`
        const response = await fetch(geoURL)
        const data = await response.json()
        return data


    } catch (error) {
        throw new Error('Error happened when getting geo data')
    }
}
async function getWeatherData() {
    try {
            const data = await getGeoData()
            const latitude = data.results[0].latitude
            const longitude = data.results[0].longitude
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,rain_sum,weather_code&hourly=temperature_2m,weather_code&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,rain,wind_gusts_10m&timezone=auto`
            const response = await fetch(weatherUrl)
            const weatherData = await response.json()
            return weatherData
        } catch (error) {
            throw new Error('Error happened when getting weather data')
    }
}

function createDailyDiv(day, maxTemp, minTemp) {

    const div = document.createElement('div')
    const weekDayP = document.createElement('p')
    const temperatureDiv = document.createElement('div')
    const maxTempParagraph = document.createElement('p')
    const minTempParagraph = document.createElement('p')
    
    weekDayP.textContent = day
    maxTempParagraph.textContent = maxTemp.toFixed(0) + '\u00B0'
    minTempParagraph.textContent = minTemp.toFixed(0) + '\u00B0'
    
    temperatureDiv.append(maxTempParagraph, minTempParagraph)
    div.append(weekDayP, temperatureDiv)

    return div
}



function getDayOfWeek(date) {
    const dayOfWeek = new Date(date).getDay()
    return isNaN(dayOfWeek) ? null : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]
}

searchButton.addEventListener('click', () => getGeoData().then(result => console.log(result)))
searchButton.addEventListener('click', () => getWeatherData().then(result => console.log(result)))
searchButton.addEventListener('click', () => buildDailyDiv())


