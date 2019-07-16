'use strict';

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
// const cors = require('cors');

// app.use(cors());
app.get('/location', (request, response) => {
  try {
    const geoData = require('./data/geo.json');
    const location = new Location(request.query.data, geoData);
    response.send(location);
  } catch (error) {
    response.status(500).send('responseText: "Sorry, something went wrong"');
  }
});

app.get('/weather', (request, response) => {
  try {
    const weatherData = require('./data/darksky.json');
    let result = [];
    weatherData.daily.data.forEach((day) => {
      let weather = new Weather(request.query.data, day.summary, day.time);
      result.push(weather);
    });
    response.send(result);
  } catch(error){
    response.status(500).send('responseText: "Sorry, something went wrong"');
  }
});

function Location(query, geoData) {
  this.search_query = query;
  this.formatted_query = geoData.results[0].formatted_address;
  this.latitude = geoData.results[0].geometry.location.lat;
  this.longitude = geoData.results[0].geometry.location.lat;
}

function Weather(query, dataSummary, dataTime) {
  this.forecast = dataSummary;
  this.time = new Date(dataTime).toDateString();
}

app.listen(PORT, () => {
  console.log('Listening on port: ' + PORT);
})
