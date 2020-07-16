let songLoaded; // canción cargada en el reproductor
let interval; // almacena el setInterval de la función updateTime()
let lastTrackDiv; // almacena el div de última canción reproduciéndose

window.onload = () => {
  showDuration();
  getSongByClick();
  getSongDataByAJAX();
}

window.onbeforeunload = () => {
  sendSongDataByAJAX();
}

// Función que muestra la duración total de cada canción de la lista
const showDuration = () => {
  const trackDiv = document.getElementsByClassName("track-wrapper");

  for (let i = 0; i < trackDiv.length; i++) {
    const songId = trackDiv[i].getAttribute("data-song-id");
    const track = new Audio(`/music/${songId}`);

    track.addEventListener("loadedmetadata",() => { 
      const minutes = add0(parseInt(track.duration / 60));
      const seconds = add0(parseInt(track.duration % 60));
      document.getElementsByClassName("track-duration")[i].textContent += ` duración: ${minutes}:${seconds}`;
    });
  }
}

// Función que carga, reproduce o pausa la canción clickeada
const getSongByClick = () => {
  const trackDiv = document.getElementsByClassName("track-wrapper");
  const player = document.getElementById("player");
  
  for (let i = 0; i < trackDiv.length; i++) {
    trackDiv[i].addEventListener("click", ev => {    
      // si se clickea sobre el nombre de artista o album no se carga ni reproduce la canción
      if (ev.target.tagName === "A") return;
      
      // se obtiene su data value (que contiene el nombre del archivo de la canción)
      const songSelected = ev.currentTarget.getAttribute("data-song-id");
      
      /*- si el data-id del repoductor está vacío, le paso como valor el id de la canción. Ejecuto loadTrack().
        - si hice click en la misma canción que estoy reproduciendo, ejecuto playPause()
        - si no, es porque hice click en una canción diferente a la que estoy reproduciendo. Paro la anterior y reproduzco la seleccionada    
      */ 
   
      if (!player.dataset.id) { 
        player.dataset.id = songSelected;
        loadTrack(songSelected);
      } else if (player.dataset.id == songSelected) {        
        playPause(null,null, i);
      } else {
        player.dataset.id = songSelected
        stop();
        loadTrack(songSelected);
      }
    });
  }
}

/**
 * Función que carga la canción (crea el elemento audio), y muestra la duración total de la misma en el reproductor
 * 
 * @param {string} song || nombre del archivo. Único param esencial
 * @param {string} songState || estado de la canción de la vista anterior, en pausa o en reproducción
 * @param {number} songTime || tiempo actual de la canción de la vista anterior
 */
const loadTrack = (song, songState, songTime) => {
  songLoaded = new Audio(`/music/${song}`);

  const currentTrackIndex = checkCurrentTrack();

  songLoaded.addEventListener("loadeddata", function() {
    const minutes = add0(parseInt(this.duration / 60));
    const seconds = add0(parseInt(this.duration % 60));
    document.getElementById("track-full-time").textContent =`${minutes}:${seconds}`;

    playPause(songState, songTime, currentTrackIndex);
  });
}

/**
 * Función que da play o pausa a la canción, y resalta su div contenedor mediante clases 
 * 
 * Los primeros dos parámetros, son los mismos que los de la función loadTrack()
 * @param {number} trackIndex || índice/posición del div que contiene la canción que se está reproduciendo
 */
const playPause = (songState, songTime, trackIndex) => { 
  if(!songLoaded) return; // se evita error por undefined

  if (lastTrackDiv) {
    lastTrackDiv.classList.remove("playing"); 
    lastTrackDiv.classList.remove("paused");
    lastTrackDiv.children[0].classList.add("track-img-container");
  }

  let currentTrackDiv;
  
  if (trackIndex || trackIndex === 0) {
    currentTrackDiv = document.getElementsByClassName("track-wrapper")[trackIndex];
    lastTrackDiv = currentTrackDiv;
  } else {
    currentTrackDiv = lastTrackDiv;
  }
  
  if (currentTrackDiv) {
    currentTrackDiv.children[0].classList.remove("track-img-container");
    currentTrackDiv.children[0].classList.add("current-track-img-container");
  }

  if (songState) {
    songLoaded.currentTime = songTime;
    updateTime(); // se ejecuta para actualizar el tiempo actual de la canción cuando está en pausa, entre páginas
    changeBarProgess();
    
    if (songState === "paused") { // se evita autoplay
      if (currentTrackDiv) currentTrackDiv.classList.add("paused"); 
      return;
    }

  }

  if (songLoaded.paused) {
    songLoaded.play();
    changeVolume();

    if (currentTrackDiv) currentTrackDiv.classList.add("playing");
    
    // Cada medio segundo se ejecuta la función updateTime para mostrar el tiempo actual y progreso en la barra de la canción.
    interval = setInterval(updateTime, 500);
    changeBarProgess();  
  } else {
    songLoaded.pause();

    if (currentTrackDiv) {
      currentTrackDiv.classList.remove("playing");
      currentTrackDiv.classList.add("paused");
    }
    
    // Deja de correr el setInterval que ejecuta la función updateTime()  
    window.clearInterval(interval);
  }
} 

const stop = () => {
  if(!songLoaded) return;

  songLoaded.currentTime = 0
  updateTime(); // Se ejecuta para que el valor de la barra de progreso vaya a 0
  window.clearInterval(interval);
  songLoaded.pause();
  document.getElementById("play-btn").textContent="PLAY";
}

const playNext = () => {
  if(!songLoaded) return;

  const trackDiv = document.getElementsByClassName("track-wrapper");
  const currentTrackIndex = checkCurrentTrack();
  
  // Si es la última canción de la lista y terminó de reproducirse, ejecuto stop() y salgo de la función
  if (!trackDiv[currentTrackIndex + 1] && songLoaded.ended) { 
    stop();
    return;
  }

  // Si no hay más canciones en la lista, salgo de la función 
  if(!trackDiv[currentTrackIndex + 1]) return;
  
  const nextTrackDiv = trackDiv[currentTrackIndex + 1];
  nextSong = nextTrackDiv.dataset.songId;

  player.dataset.id = nextSong;
  stop();
  loadTrack(nextSong);
}

const playPrevious = () => {
  if (!songLoaded) return;

  const trackDiv = document.getElementsByClassName("track-wrapper");
  const currentTrackIndex = checkCurrentTrack();

  // Si currentTrack es 0 (no hay divs previos), o si su valor es undefined (por cambiar de vista) se reinicia la canción.
  if (currentTrackIndex === 0 || !currentTrackIndex) {
    songLoaded.currentTime = 0;
    updateTime();
    return;
  }
  
  if (!currentTrackIndex) return;
 
  const previousTrackIndex = trackDiv[currentTrackIndex - 1];
  previousSong = previousTrackIndex.dataset.songId;

  player.dataset.id = previousSong;
  stop();
  loadTrack(previousSong);
}

// Función que muestra el tiempo actual de la canción
const updateTime = () => {
  const currentTime = document.getElementById("track-actual-time"); 

  if (!songLoaded) return;
  
  if (songLoaded.ended) {
    playNext();
  }  
  
  let minutes = add0(parseInt(songLoaded.currentTime / 60));
  let seconds = add0(parseInt(songLoaded.currentTime % 60));
  
  currentTime.textContent = `${minutes}:${seconds}`;
  setBarProgress();
} 

/**
 * Función que agrega un 0 por delante, si el valor del parametro es menor a 10
 * 
 * @returns {string} número en string
 */
const add0 = (time) => {
  return (time < 10) ? "0" + time.toString() :  time.toString();
} 

/**
 * Función que retorna el índice/posición del div que está reproduciendo la canción.
 * 
 * @returns {number} índice del div actual
 */
const checkCurrentTrack = () => {
  const player = document.getElementById("player");
  const trackDivArray = Array.from(document.getElementsByClassName("track-wrapper"));
  let currentTrackIndex;
  
  // Recorro la cantidad total de divs con canciones, buscando el que tiene el mismo data value que el reproductor y quedandome con su índice
  for (let i = 0; i < trackDivArray.length; i++) {
    if (trackDivArray[i].dataset.songId == player.dataset.id){
      currentTrackIndex = trackDivArray.indexOf(trackDivArray[i]);
      break;
    }
  }
  return currentTrackIndex;
}

// Función que muestra en la barra de progreso el tiempo actual de la canción
const setBarProgress = () => {
  const progress = (songLoaded.currentTime / songLoaded.duration) * 100;
  document.getElementById("track-progress").style.width = progress + "%";
}

// Función que modifica el tiempo actual de la canción si el usuario hace click sobre la barra de progreso
const changeBarProgess = () => {
  if(!songLoaded) return;

  const bar =document.getElementById("track-bar");

  bar.addEventListener("click", function(ev) {
    const newProgress = ev.offsetX / this.offsetWidth;
    songLoaded.currentTime = newProgress * songLoaded.duration;
    setBarProgress();
    updateTime();
  });
}

/**
 * Función que modifica el volumen de la canción
 * 
 * @param {string} AJAXvol || valor del volumen de la canción reproduciéndose en la vista anterior
 */
const changeVolume = (AJAXvol) => {
  if (!songLoaded) return;

  const volumeInput = document.getElementById("volume-input");

  if (AJAXvol) volumeInput.value = AJAXvol;

  // Se setea el volumen de la canción por fuera del eventListener, por si el usuario modificó el volumen anter de dar PLAY
  songLoaded.volume = volumeInput.value;

  // Cuando el usuario deslice sobre la barra volumen este se modifica
  volumeInput.addEventListener("input", function() {
    songLoaded.volume = this.value;
  });
}


// Función que trae los datos de la canción que estaba cargada en el reproductor en la vista anterior. Con esos datos carga de vuelta la canción para tener continuidad de reproducción entre páginas
const getSongDataByAJAX = () => {
  const xhr = new XMLHttpRequest();
      
      xhr.onload = function() {
        if (this.responseText) {
          const songData = JSON.parse(this.responseText);

          // si el responseText es válido, se le asigna al data-value del reproductor el filename de la canción, para que la función getSongByClick() funcione como debe. Se ejecuta loadTrack()
          if (songData) {
            document.getElementById("player").dataset.id = songData.song;
            loadTrack(songData.song, songData.state, songData.actualTime);
            changeVolume(songData.volume);
          }
        }
      }

      xhr.open("GET", "/playerInfo");
      xhr.send();
}

// Función que envía al back los datos de la canción reproduciéndose en el momento
const sendSongDataByAJAX = () => {
  const currentSong = document.getElementById("player").dataset.id;
  
  if (currentSong) {
    // Objeto que contiene la información de la canción que se está reproduciendo en el momento
    const currentSongData = {
      song: currentSong,
      actualTime: songLoaded.currentTime,
      volume: document.getElementById("volume-input").value,
      state: (songLoaded.paused) ? "paused": "playing"
    }

    const xhr = new XMLHttpRequest();
    const body = JSON.stringify(currentSongData);

    xhr.open("POST", "/playerInfo");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(body);
  }
}