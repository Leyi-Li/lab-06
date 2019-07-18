'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/location',searchToLatLong);
app.get('/weather',getWeather);
app.get('/events',getEvent);

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

function getWeather(request,response){
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

  return superagent.get(url)
    .then(res=>{
      const weatherList = res.body.daily.data.map(day =>{
        return new Weather(day);
      })
      response.send(weatherList);
    })
    .catch(err=>{
      response.send(err)
    });
}

function getEvent(request,response){
  const url = `https://www.eventbriteapi.com/v3/events/search?location.longitude=${request.query.data.longitude}&location.latitude=${request.query.data.latitude}&token=${process.env.EVENTBRITE_API_KEY}`;

  console.log(url);
  return superagent.get(url)
    .then(res=>{
      console.log('got in');
      const events = res.body.events.map(eventData=>{
        const event = new Event(eventData);
        return event;
      });
      console.log(events);
      response.send(events);
    })
    .catch(err=>{
      response.send(err);
    })
}


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

function Event(event){
  this.link = event.url;
  this.name=event.name.text;
  // this.event_date = new Date(event.start.local).toString().slice(0,15);
  this.summary = event.summary;
}

app.listen(PORT, () => {
  console.log('Listening on port: ' + PORT);
})
