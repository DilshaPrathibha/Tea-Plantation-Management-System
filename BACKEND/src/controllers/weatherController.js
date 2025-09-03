// const axios = require('axios');

// const toEnum = (main='') => {
//   const m = main.toLowerCase();
//   if (m.includes('thunder') || m.includes('storm')) return 'Stormy';
//   if (m.includes('rain') || m.includes('drizzle')) return 'Rainy';
//   if (m.includes('cloud')) return 'Cloudy';
//   if (m.includes('clear')) return 'Sunny';
//   return 'Unknown';
// };

// exports.getAvissawella = async (_req, res) => {
//   try {
//     const key = process.env.OPENWEATHER_API_KEY;
//     if (!key) {
//       return res.json({
//         location: 'Avissawella',
//         condition: 'Unknown',
//         tempC: null, humidity: null, windMs: null,
//         workAllowed: true, alerts: [],
//         fetchedAt: new Date().toISOString(),
//       });
//     }

//     const url = `https://api.openweathermap.org/data/2.5/weather?q=Avissawella,LK&appid=${key}&units=metric`;
//     const { data } = await axios.get(url, { timeout: 8000 });

//     const main = data?.weather?.[0]?.main || '';
//     const condition = toEnum(main);
//     const tempC = Math.round(data?.main?.temp ?? 0);
//     const humidity = data?.main?.humidity ?? 0;
//     const windMs = data?.wind?.speed ?? 0;

//     const alerts = [];
//     let workAllowed = true;
//     if (condition === 'Stormy') { workAllowed = false; alerts.push('Stormy — avoid outdoor tasks.'); }
//     if (condition === 'Rainy')  { alerts.push('Rain — carry rain gear & watch footing.'); }
//     if (windMs > 10)            { alerts.push('High winds — secure equipment.'); }
//     if (tempC > 32)             { alerts.push('High heat — extra water & shade breaks.'); }

//     res.json({ location: 'Avissawella', condition, tempC, humidity, windMs, workAllowed, alerts, fetchedAt: new Date().toISOString() });
//   } catch {
//     res.status(500).json({ message: 'Failed to fetch weather' });
//   }
// };

const axios = require("axios");

const fetchWeather = async() => {
  try{
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) throw new Error('Weather API key missing');

    const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=6.95&lon=80.22&units=metric&appid=${apiKey}`);
    const data = res.data;

    const condition = data.weather[0]?.main || 'Unknown';
    const tempC = data.main?.temp ?? null;
    const humidity = data.main?.humidity ?? null;
    const windMs = data.wind?.speed ?? null;

    let workAllowed = true;
    const alerts = [];
    
    if (condition.includes('Rain') || condition.includes('Thunderstorm')) {
      workAllowed = false;
      alerts.push('Rain or storm expected - outdoor work not advised');
    }
    if (tempC > 35) {
      workAllowed = false;
      alerts.push('High temperature - heat stress risk');
    }
    if (windMs > 15) {
      alerts.push('Strong winds - caution advised');
    }
    
    return { condition, tempC, humidity, windMs, workAllowed, alerts };
  }catch(e){
    console.error('[WEATHER_FETCH] error:', e);
    return null;
  }
}

const getWeather = async(req,res) => {
  const weather = await fetchWeather();
  if (!weather) {
    return res.status(503).json({ message: 'Weather unavailable' });
  }
  res.json(weather);
}

module.exports = {
  getWeather
}