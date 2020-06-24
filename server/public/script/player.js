let currentTrackDiv; 
let songLoaded; 
let interval; 
const playBtn = document.getElementById("play-btn");

window.onload = () => {
  showDuration();
  getSong();
}

//Cargo las canciones que muestro en la lista para poder leer su duración y renderizarla en el front
const showDuration = () => {
  const trackDiv = document.getElementsByClassName("track-wrapper");

  for (let i = 0; i < trackDiv.length; i++) {
    const songId = trackDiv[i].getAttribute("data-song-id");
    
    const track = new Audio(`${songId}`);

    track.addEventListener("loadedmetadata",() => { 
      const minutes = add0(parseInt(track.duration / 60));
      const seconds = add0(parseInt(track.duration % 60));
      document.getElementsByClassName("track-duration")[i].textContent += ` duración: ${minutes}:${seconds}`;
    });
    
  }
}

//Función que realiza diferentes acciones con la canción que clickeo
const getSong = () => {
  const trackDiv = document.getElementsByClassName("track-wrapper");
  const player = document.getElementById("player")

  for (let i = 0; i < trackDiv.length; i++) {
    
    //al hacer click en uno de los divs con canciones, se obtiene su data value, y se guarda en la var songSelected
    trackDiv[i].addEventListener("click", ev => { 
      const songSelected = ev.currentTarget.getAttribute("data-song-id");
  
      /*- si el data-id del repoductor está vacío, le paso como valor el id de la canción. Ejecuto loadTrack.
        - si hice click en la misma canción que estoy reproduciendo, ejecuto playPause()
        - si no, es porque hice click en una canción diferente a la que estoy reproduciendo    
      */ 
   
      if (!player.dataset.id) { 
        player.dataset.id = songSelected;
        loadTrack(songSelected);
      } else if (player.dataset.id == songSelected) {        
        playPause();
      } else {
        player.dataset.id = songSelected
        stop();
        loadTrack(songSelected);
      }

    });
  }
}

//función que carga la carga la canción. 
//Cuando se complete el estado "loadeddata" da play
const loadTrack = song => {
  songLoaded = new Audio(`${song}`);
  
  // estaba en "progress" anteriormente, pero al ir moviendo la duración con el progressBar se pausaba sola la canción. Con este estado funciona mejor
  songLoaded.addEventListener("loadeddata", () => {
    playPause();
    
  });

}

const playPause = () => {
  //songLoaded no está inicializada al cargar la página, y con esta condición evito el error en la consola
  if(!songLoaded) return; 
  
  if (songLoaded.paused) {
    songLoaded.play();
    changeVolume();
    playBtn.textContent="PAUSE";
    
    //cada medio segundo ejecuto la función updateTime para mostrar el tiempo actual y progreso en la barra de la canción.
    interval = setInterval(updateTime, 500);
    changeBarProgess();  
  } else {
    songLoaded.pause();
    playBtn.textContent="PLAY";
    
    //Deja de correr el setInterval que ejecuta la función updateTime()  
    window.clearInterval(interval);
  }
} 

const stop = () => {
  if(!songLoaded) return;

  songLoaded.currentTime = 0;

  // Ejecuto updateTime() una vez más para que el valor de la barra de progreso vaya a 0
  updateTime(); 
  window.clearInterval(interval);
  playPause();
}

const playNext = () => {
  if(!songLoaded) return;

  const trackDiv = document.getElementsByClassName("track-wrapper");
  const currentTrack = checkCurrentTrack();
  
  // Me tira error porque espero a que termine la canción, antes de sacarlo. Si borro el songLoaded.ended se arregla
  if (!trackDiv[currentTrack + 1] && songLoaded.ended) { 
    stop();
    return;
  }
  
  const nextTrackDiv = trackDiv[currentTrack + 1];
  nextSong = nextTrackDiv.dataset.songId;

  player.dataset.id = nextSong;
  stop();
  loadTrack(nextSong);
  
}

// Función que carga la canción previa (en posición) a la que se está reproduciendo 
const playPrevious = () => {
  if(!songLoaded) return;

  const trackDiv = document.getElementsByClassName("track-wrapper");
  const currentTrack = checkCurrentTrack();
  
  // Si a la posición del índice del div actual le resto 1 y obtengo como resultado -1, es porque el índice es 0 (no hay divs previos). Entonces salgo de la función 
  if (currentTrack - 1 === -1) { 
    return;
  }
  
  const previousTrackDiv = trackDiv[currentTrack - 1];
  previousSong = previousTrackDiv.dataset.songId;

  player.dataset.id = previousSong;
  stop();
  loadTrack(previousSong);
}

//función que muestra el tiempo actual de la canción
const updateTime = () => {
  const trackDiv = document.getElementsByClassName("track-wrapper");
  const currentTime = document.getElementById("track-current-time"); 

  if (!songLoaded) return;
  
  if (songLoaded.ended) {
    playNext();
  }  
  
  let minutes = add0(parseInt(songLoaded.currentTime / 60));
  let seconds = add0(parseInt(songLoaded.currentTime % 60));
  
  currentTime.textContent = `${minutes}:${seconds}`;
  setBarProgress();
} 

// función que agrega un 0 por delante, si el valor del parametro (minuto, segundos) es menor a 10. 
const add0 = (time) => {
  return (time < 10) ? "0" + time.toString() :  time.toString();
} 

// Función que retorna el índice/posición del div que está reproduciendo la canción.
const checkCurrentTrack = () => {
  const player = document.getElementById("player");
  const trackDivArray = Array.from(document.getElementsByClassName("track-wrapper"));
  let currentTrackDiv;
  
  // Recorro la cantidad total de divs con canciones, buscando el que tiene el mismo data value que el reproductor y quedandome con su índice
  for (let i = 0; i < trackDivArray.length; i++) {
    if (trackDivArray[i].dataset.songId == player.dataset.id){
      currentTrackDiv = trackDivArray.indexOf(trackDivArray[i]);
    }
  }
  return currentTrackDiv;
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
});
}

// Función que modifica el volumen de la canción
const changeVolume = () => {
  if (!songLoaded) return;

  const volumeInput = document.getElementById("volume-input");

  // Seteo el volumen de la canción antes del evento, por si el usuario modificó el volumen anter de dar PLAY
  songLoaded.volume = volumeInput.value;

  // Cuando el usuario deslice sobre la barra volumen, esta a se va a modificar 
  volumeInput.addEventListener("input", function() {
    songLoaded.volume = this.value;
  });
}