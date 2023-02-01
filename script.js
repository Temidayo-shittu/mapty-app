"use strict";

/*
The toggle() method toggles between hide() and show() for the selected elements.
This method checks the selected elements for visibility. show() is run if an element is hidden. 
hide() is run if an element is visible - This creates a toggle effect.
*/

//REFACTORING PROJECT ARCHITECTURE

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10); //to copy d last 10 elem of our cur timestamp
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; //km
    this.duration = duration; //min
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}
class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = "cycling";

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    // this.type = 'cycling';
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
//const run1= new Running([39,-12],5.2,24,178);
//const cycling1= new Cycling([39,-12],27,95,523);
//console.log(run1,cycling1);
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

///////////////////////////////////////////////////////////
//APPLICATION ARCHITECTURE
class App {
  //private instance proprties-ppt created on all instances through this class
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    //Get users position
    this._getPosition(); //d const func is called when a new obj is created from thisclass
    //Get localstorage
    this._getLocalStorage;
    //Attach event handlers
    form.addEventListener("submit", this._newWorkOut.bind(this)); //handling submitting of forms
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
    //we always tohave to bind d this keyword when using eventhandlers in classes
  }
  _getPosition() {
    if (navigator.geolocation)
      //receives 2 param(success,failure)which are both calbacks
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () =>
        alert("Could not get your position")
      );
    //we used d bind method to acces d this variable
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);
    //tiles determines d appearance of our maps
    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //we use the on method on map rather than d conventional eventlistener.
    //handling clicks on maps
    this.#map.on("click", this._showForm.bind(this));
    this.#workouts.forEach((cur) => {
      this._renderWorkoutMarker(cur);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    //RENDERING WORKOUT INPUT FORM
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  _hideForm() {
    //empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }
  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkOut(e) {
    //using helper fns to simplify complex conditions
    const validInputs = (...inp) => inp.every((cur) => Number.isFinite(cur)); //returns true if all inputs are finite numb
    const allPositive = (...inp) => inp.every((cur) => cur > 0); //returns true if all nums are>0
    e.preventDefault();
    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng; //gets d position coords for every click ond map
    let workout;
    //If workout running,create running object
    if (type === "running") {
      const cadence = +inputCadence.value;

      // Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("Inputs have to be positive numbers!");

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling, create cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert("Inputs have to be positive numbers!");

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //Add new workout object to workout array
    this.#workouts.push(workout);
    //Render workout on map as worker
    this._renderWorkoutMarker(workout);
    //Render workout on list
    this._renderWorkout(workout);

    //Hide form + clear input fields
    this._hideForm();
    //set local storage to all workouts
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map) //display marker using d pos coords(.marker creates marker .addto ads it to d map)
      .bindPopup(
        L.popup({
          //creates a popup & binds to d marker
          maxWidth: 250,
          minWidth: 50,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "⚡️"} ${workout.description}`
      ) //sets a text content to d already created popup
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
<li class="workout workout--${workout.type}" data-id=${workout.id}>
<h2 class="workout__title">${workout.description}</h2>
<div class="workout__details">
  <span class="workout__icon">${
    workout.type === "running" ? "🏃‍♂️" : "⚡️"
  }</span>
  <span class="workout__value">${workout.distance}</span>
  <span class="workout__unit">km</span>
</div>
<div class="workout__details">
  <span class="workout__icon">⏱</span>
  <span class="workout__value">${workout.duration}</span>
  <span class="workout__unit">min</span>
</div>`;
    if (workout.type === "running") {
      html += `
  <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
  `;
    }
    if (workout.type === "cycling") {
      html += `
  <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>`;
    }
    form.insertAdjacentHTML("afterend", html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");
    //console.log(workoutEl);
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      (cur) => cur.id === workoutEl.dataset.id
    );
    console.log(workout);
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    //this displays d workout on map with equiv id from rendered form
    //workout.click();
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}
const app = new App();

///////////////////////////////////////////////////////////////
//1.USER STORIES
//a high level overview of the entire app,which allows developers to determine d excat features we need to implement
//to make d user stories work as it is intended.its a description of an apps functionality from d users perspective

//2.FEATURES

//3.FLOW CHART-contains these diff features we're going to implement&contains how diff parts of d app
//interacts wit each other & how data flows across d app.

//4.ARCHITECTURE
//how to organise our codes & what javascript features to use.IT GIVES A STRUCTURE to develop d apps functionality

//GEOLOCATION API

//DISPLAYING A MAP USING LEAFLET LIBRARAY(3RD PARTY)
//its an open source js library for mobile friendly interactive maps
//we download a hoisted version of d leaflet lib & paste in our html just before our script,so that d code gets
//downloaded 1st,before our script runs
//ID name of our elem in html=str we copied rm leaflet
//we can access global variables in multiple scripts.this is why L variable can be accessed in our current script
//though it wasn defined here but in d leaflet.js script
//however other.js cant access variabls frm script.js because its comes before script.js in d order of execution
//of script
