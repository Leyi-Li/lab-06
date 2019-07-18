'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');


const app = express();
const PORT = process.env.PORT || 3000;
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('err',err=>console.log(err));

app.use(cors());

app.get('/location',getLocation);
app.get('/weather',getWeather);
// app.get('/events',getEvent);


function handleError(err,res){
  if(res){
    res.status(500).send('Sorry, something went wrong');
  }
}

function lookup(tableName, rowId,hit,miss) {
  const SQL =`SELECT * FROM ${tableName} WHERE id = $1`;
  console.log(rowId);
  client.query(SQL, [rowId])
    .then(result =>{
      if(result.rowCount>0){
        hit(result);
      }else{
        miss();
      }
    })
    .catch(error=>handleError(error));
}

//location functions

function getLocation(request,response){
  const locationHnadler = {
    query : request.query.data,

    cacheHit: (results)=>{
      response.send(results.rows[0]);
    },

    cacheMiss: ()=>{
      Location.fetchLocation(request.query.data)
        .then(data=>response.send(data));
    },
  };
  Location.lookupLocation(locationHnadler);
}



function Location(query, res) {
  this.search_query = query;
  this.formatted_query = res.formatted_address;
  this.latitude = res.geometry.location.lat;
  this.longitude = res.geometry.location.lng;
}

Location.prototype.save = function() {
  let SQL = `
    INSERT INTO locations
      (search_query, formatted_query, latitude,longitude)
      VALUES($1,$2,$3,$4)
      RETURNING id
  `;
  let values = Object.values(this);
  return client.query(SQL,values);
};

Location.fetchLocation=(query)=>{
  const _URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;
  return superagent.get(_URL)
    .then(data=>{
      if(! data.body.results.length){throw 'No Data;'}
      else{
        let location = new Location(query, data.body.results[0]);
        return location.save()
          .then( result => {
            location.id = result.rows[0].id;
            return location;
          });
        // return location;
      }
    });
}


Location.lookupLocation=(handler)=>{
  const SQL =`SELECT * FROM locations WHERE search_query=$1`;
  const values = [handler.query];
  console.log(values);
  return client.query(SQL, values)
    .then( results=>{
      if(results.rowCount > 0){
        handler.cacheHit(results);
      }else{
        handler.cacheMiss();
      }
    })
    .catch(console.error);

};

//weather section

function getWeather(request,response){
  const handler = {
    location: request.query.data,
    cacheHit: function(result){
      response.send(result.rows);
    },
    cacheMiss: function(){
      Weather.fetch(request.query.data)
        .then(results=>response.send(results))
        .catch(console.error);
    }
  };
  lookup('weathers',handler.location.id,handler.cacheHit,handler.cacheMiss);
  console.log(handler);
}


function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toDateString().slice(0,15);
}

Weather.prototype.save = function(id){
  console.log('Saving weather');
  const SQL = `INSERT INTO weathers(forecast, time, location_id) VALUES($1,$2,$3);`;
  const values = [this.forecast,this.time];
  values.push(id);
  console.log('this is the pushed id values',values,id);
  client.query(SQL,values);
  console.log(SQL);
}

Weather.fetch = function(location){
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${location.latitude},${location.longitude}`;
  console.log(location.latitude);
  return superagent.get(url)
    .then(result=>{
      const weatherSummaries = result.body.daily.data.map(day =>{
        const summary = new Weather(day);
        summary.save(location.id);
        return summary;
      })
      return weatherSummaries;
    })
}



//event

// function getEvent(request,response){
//   const url = `https://www.eventbriteapi.com/v3/events/search?location.longitude=${request.query.data.longitude}&location.latitude=${request.query.data.latitude}&token=${process.env.EVENTBRITE_API_KEY}`;

//   console.log(url);
//   return superagent.get(url)
//     .then(res=>{
//       console.log('got in');
//       const events = res.body.events.map(eventData=>{
//         const event = new Event(eventData);
//         return event;
//       });
//       console.log(events);
//       response.send(events);
//     })
//     .catch(err=>{
//       response.send(err);
//     })
// }

// Event.lookUpEvent = lookup;

// function Event(event){
//   this.link = event.url;
//   this.name=event.name.text;
//   // this.event_date = new Date(event.start.local).toString().slice(0,15);
//   this.summary = event.summary;
// }

app.listen(PORT, () => {
  console.log('Listening on port: ' + PORT);
})
