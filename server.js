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
    response.status(400).send({ 'error': error});
  }
});

app.get('/weather', (request, response) => {
  const weatherData = require('./data/darksky.json');
  let result = [];
  weatherData.daily.data.forEach((day) => {
    let weather = new Weather(request.query.data, day.summary, day.time);
    result.push(weather);
  });
  response.send(result);
});

function Location(query, geoData) {
  this.search_query = query;
  this.formatted_query = geoData.results[0].formatted_address;
  this.latitude = geoData.results[0].geometry.location.lat;
  this.longitude = geoData.results[0].geometry.location.lat;
}

function Weather(query, dataSummary, dataTime) {
  // this.searchQuery = query;
  this.forecast = dataSummary;
  let convertedTime = new Date().getTime(dataTime);
  let date = new Date(convertedTime);
  this.time = date.toString();
  // times.forEach((item) => {
  //   this.forecast = item.summary;
  //   let convertedTime = new Date().getTime(item.time);
  //   let date = new Date(convertedTime);
  //   this.time = date.toString();
  // });
}

app.listen(PORT, () => {
  console.log('Listening on port: ' + PORT);
})
