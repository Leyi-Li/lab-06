'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/location',searchToLatLong);
// app.get('/weather',getWeather);

function searchToLatLong(request,response){
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
  return superagent.get(url)
    .then(res=>{
      const location = new Location(request.query.data, JSON.parse(res.text));
      response.send(location);
    })
    .catch(err =>{
      response.send(err);
    });
}

// app.get('/weather', (request, response) => {
//   try {
//     const weatherData = require('./data/darksky.json');
//     const weatherList = weatherData.daily.data.map(day=>{
//       return new Weather(day);
//     })
//     response.send(weatherList);
//   } catch(error){
//     response.status(500).send('status:500. responseText: "Sorry, something went wrong"');
//   }
// });

function Location(query, res) {
  this.search_query = query;
  this.formatted_query = res.results[0].formatted_address;
  this.latitude = res.results[0].geometry.location.lat;
  this.longitude = res.results[0].geometry.location.lng;
}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toDateString().slice(0,15);
}

app.listen(PORT, () => {
  console.log('Listening on port: ' + PORT);
})
