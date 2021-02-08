let songLoaded; // canción cargada en el reproductor
let interval; // almacena el setInterval de la función updateTime()
let lastTrackDiv; // almacena el div de última canción reproduciéndose
let lastVolumeVal; // almacena el último valor de volumen, antes de mutear

window.onload = () => {
  showDuration();
  getSongByClick();
  getSongDataByAJAX();
  changeBarProgess();
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
      document.getElementsByClassName("track-duration")[i].textContent += `${minutes}:${seconds}`;
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
 * @param {object} songObject || Objeto que contiene detalles de la canción en reproducción de la página anterior
 */
const loadTrack = (song, songObject) => {
  songLoaded = new Audio(`/music/${song}`);

  const currentTrackIndex = checkCurrentTrack();
  showTrackInPlayer(currentTrackIndex, songObject);

  songLoaded.addEventListener("loadeddata", function() {
    const minutes = add0(parseInt(this.duration / 60));
    const seconds = add0(parseInt(this.duration % 60));
    document.getElementById("track-full-time").textContent =`${minutes}:${seconds}`;
    
    playPause(currentTrackIndex, songObject);
  });
}

/**
 * Función que da play o pausa a la canción, y resalta su div contenedor mediante clases 
 * 
 * @param {number} trackIndex || índice/posición del div que contiene la canción que se está reproduciendo
 * @param {object} songObject || Objeto que contiene detalles de la canción en reproducción de la página anterior
 */
const playPause = (trackIndex, songObject) => { 
  if(!songLoaded) return; // se evita error por undefined
  const playPauseBtn = document.getElementById("play-pause-btn").children[0];

  if (lastTrackDiv) {
    lastTrackDiv.classList.remove("active-track");
    lastTrackDiv.children[0].children[1].title = "Reproducir";
    lastTrackDiv.children[0].children[1].children[0].classList.remove("fas","fa-pause-circle");
    lastTrackDiv.children[0].children[1].children[0].classList.add("fas", "fa-play-circle");
  }
  
  if (trackIndex || trackIndex === 0) {
    currentTrackDiv = document.getElementsByClassName("track-wrapper")[trackIndex];
    lastTrackDiv = currentTrackDiv;
  } else {
    currentTrackDiv = lastTrackDiv;
  }
  
  if (currentTrackDiv) {
    currentTrackDiv.classList.add("active-track");
  }

  if (songObject) { 
    songLoaded.currentTime = songObject.actualTime + 0.5;
    updateTime(); // se ejecuta para actualizar el tiempo actual de la canción cuando está en pausa, entre páginas
    
    if (songObject.state === "paused") { // se evita autoplay
      return;
    }
  }

  if (songLoaded.paused) {
    songLoaded.play();
    songLoaded.volume = document.getElementById("volume-input").value;

    if (currentTrackDiv) {
      currentTrackDiv.children[0].children[1].children[0].classList.remove("fas", "fa-play-circle");
      currentTrackDiv.children[0].children[1].children[0].classList.add("fas","fa-pause-circle");
      currentTrackDiv.children[0].children[1].title = "Pause";
    }
   
    playPauseBtn.classList.remove("far", "fa-play-circle");
    playPauseBtn.classList.add("far", "fa-pause-circle");
    
    // Cada medio segundo se ejecuta la función updateTime para mostrar el tiempo actual y progreso en la barra de la canción.
    interval = setInterval(updateTime, 500);
  } else {
    songLoaded.pause();

    if (currentTrackDiv) {
      currentTrackDiv.children[0].children[1].children[0].classList.remove("fas","fa-pause-circle");
      currentTrackDiv.children[0].children[1].children[0].classList.add("fas", "fa-play-circle");
      currentTrackDiv.children[0].children[1].title = "Play";
    }
    
    playPauseBtn.classList.remove("far", "fa-pause-circle");
    playPauseBtn.classList.add("far", "fa-play-circle");
    
    window.clearInterval(interval); // Deja de correr el setInterval que ejecuta la función updateTime()  
  }
} 

const stop = () => {
  if(!songLoaded) return;

  songLoaded.currentTime = 0
  updateTime(); // Se ejecuta para que el valor de la barra de progreso vaya a 0
  window.clearInterval(interval);
  songLoaded.pause();
  document.getElementById("play-pause-btn").children[0].classList.remove("far", "fa-pause-circle");
  document.getElementById("play-pause-btn").children[0].classList.add("far", "fa-play-circle");
}

const playNext = () => {
  if(!songLoaded) return;

  const trackDiv = document.getElementsByClassName("track-wrapper");
  const currentTrackIndex = checkCurrentTrack();
  
  // Si es la última canción de la lista y terminó de reproducirse, ejecuto stop() y salgo de la función
  if (!trackDiv[currentTrackIndex + 1] && songLoaded.ended) {
    trackDiv[currentTrackIndex].children[0].children[1].children[0].classList.remove("fas","fa-pause-circle");
    trackDiv[currentTrackIndex].children[0].children[1].children[0].classList.add("fas", "fa-play-circle");
    stop();
    return;
  }

  // Si no hay más canciones en la lista, salgo de la función 
  if (!trackDiv[currentTrackIndex + 1]) return;
  
  const nextTrackDiv = trackDiv[currentTrackIndex + 1];
  nextSong = nextTrackDiv.dataset.songId;
  player.dataset.id = nextSong;

  stop();
  loadTrack(nextSong);
}

const playPrevious = () => {
  if (!songLoaded) return;

  if (songLoaded.currentTime >= 5) { // resetea canción
    stop();
    playPause();
    return
  }

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

document.getElementById("track-bar").addEventListener("click", function(ev) {
    if(!songLoaded) return;
    const newProgress = ev.offsetX / this.offsetWidth;
    songLoaded.currentTime = newProgress * songLoaded.duration;
    updateTime();
  });
}

/**
 * Función que modifica el volumen de la canción
 * 
 * @param {number} AJAXvol || valor del volumen de la canción reproduciéndose en la vista anterior
 */
const changeVolume = (AJAXvol) => {
  const volumeIcon = document.getElementById("volume-btn").children[0];
  const volumeBtn = document.getElementById("volume-btn");
  const volumeInput = document.getElementById("volume-input");
  lastVolumeVal = volumeInput.value;

  if (AJAXvol) {
    volumeInput.value = AJAXvol;
    AJAXvol == 0 ? lastVolumeVal = 0.5 : lastVolumeVal = AJAXvol;
  }

  if (songLoaded) songLoaded.volume = volumeInput.value // Se setea el volumen fuera del evento, por si el usuario modificó el volumen anter de dar PLAY;

  changeVolumeIcon(volumeInput.value);

  // Cuando el usuario deslice sobre la barra volumen este se modifica
  volumeInput.addEventListener("input", function() {
    changeVolumeIcon(this.value);
    lastVolumeVal = this.value;
    if (songLoaded) songLoaded.volume = this.value;
  });

  console.log(lastVolumeVal);

  volumeBtn.addEventListener("click", () => {
    if (volumeInput.value > 0) {
      volumeInput.value = 0;
      if (songLoaded) songLoaded.volume = 0;
      changeVolumeIcon(volumeInput.value);
    } else {
      changeVolumeIcon(lastVolumeVal);
      volumeInput.value = lastVolumeVal;
      if (songLoaded) songLoaded.volume = lastVolumeVal;
    }
  });

  function changeVolumeIcon(volume) {
    if (volume == 0) {
      volumeIcon.classList.remove("fa-volume-down","fa-volume-up","fas");
      volumeIcon.classList.add("fa-volume-mute", "fas");
    } else if (volume < 0.5){
      volumeIcon.classList.remove("fa-volume-mute", "fa-volume-up", "fas");
      volumeIcon.classList.add("fa-volume-down", "fas");
    } else {
      volumeIcon.classList.remove("fa-volume-down","fas");
      volumeIcon.classList.add("fa-volume-up", "fas");
    }
  }
}

// Función que trae los datos de la canción que estaba cargada en el reproductor en la vista anterior. Con esos datos carga de vuelta la canción para tener continuidad de reproducción entre páginas
const getSongDataByAJAX = () => {
  const xhr = new XMLHttpRequest();
      
  xhr.onload = function() {
    if (this.responseText) {
      const songData = JSON.parse(this.responseText);

      if (songData) {
        const songToLoad = songData.artist.toUpperCase() + "_" + songData.title + ".mp3"  

        document.getElementById("player").dataset.id = songToLoad;
        loadTrack(songToLoad, songData);
        changeVolume(songData.volume);
      } else {
        changeVolume(); // se ejecuta acá para que no sea ejecutada más de una vez
      }
    } 
  }

  xhr.open("GET", "/playerInfo");
  xhr.send();
}

// Función que envía al back un objeto con los datos de la canción reproduciéndose en el momento
const sendSongDataByAJAX = () => {
  const currentTrack = document.getElementById("player").dataset.id;

  if (currentTrack) {
    const artist = currentTrack.slice(0, currentTrack.lastIndexOf("_")).toLowerCase();
    const song = currentTrack.slice(currentTrack.lastIndexOf("_") + 1 , currentTrack.lastIndexOf("."));
    const imgSrc = document.getElementById("track-img-box").src;

    const currentSongData = {
      title: song,
      artist: artist,
      img: imgSrc,
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
 
// Función que muestra portada, nombre y artista de la canción en reproducción.
const showTrackInPlayer = (trackIndex, songObject) => {
  const imgBox = document.getElementById("track-img-box");
  const trackArtist = document.getElementById("track-artist-box");
  const trackName = document.getElementById("track-title-box");

  if (songObject) {
    imgBox.src = songObject.img;
    trackArtist.textContent = songObject.artist;
    trackArtist.href = "/artist/" + songObject.artist
    trackName.textContent = songObject.title;
    trackName.title = songObject.title;
    return;
  } 

  const currentTrackDiv = document.getElementsByClassName("track-wrapper")[trackIndex];
  const imgSrc = currentTrackDiv.children[0].children[0].src;
  let artistElement = document.getElementsByClassName("track-artist")[trackIndex];

  if (artistElement) {
    trackArtist.textContent = artistElement.textContent;
    trackArtist.href = "/artist/" + artistElement.textContent;
  } else {
    artistElement = document.getElementById("user-bio").children[0];
    trackArtist.textContent = artistElement.textContent;
    trackArtist.href = "/artist/" + artistElement.textContent;
  }

  imgBox.src = imgSrc;
  trackName.textContent = document.getElementsByClassName("track-name")[trackIndex].textContent;
  trackName.title = document.getElementsByClassName("track-name")[trackIndex].textContent;
}