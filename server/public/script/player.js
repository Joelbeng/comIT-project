let currentTrackDiv; // usar esta var para almacenar el div que hizo click, y luego usarlo en updateTime(); para pasarle el currentTime al track-wrapper
let songLoaded;
let interval; // ¿por qué no anda con el scope de la función?
const playBtn = document.getElementById("play-btn");

window.onload = () => {
  showDuration();
  getSong();
  changeBarProgess();
}

//Cargo las canciones que muestro en la lista para poder leer su duración y renderizarla en el front
function showDuration() {
  const trackDiv = document.getElementsByClassName("track-wrapper");

  for (let i = 0; i < trackDiv.length; i++) {
    const songId = trackDiv[i].getAttribute("data-song-id");
    
    const track = new Audio(`/music/${songId}.mp3`);

    track.addEventListener("loadedmetadata",() => { 
      const minutes = add0(parseInt(track.duration / 60));
      const seconds = add0(parseInt(track.duration % 60));
      document.getElementsByClassName("track-duration")[i].textContent += ` duración: ${minutes}:${seconds}`;
    });
    
  }
}

//Carga la canción que clickeo en el reproductor, o le da pausa si ya se está reproduciendo
function getSong() {
  const trackDiv = document.getElementsByClassName("track-wrapper");
  const player = document.getElementById("player")

  for (let i = 0; i < trackDiv.length; i++) {
    
    trackDiv[i].addEventListener("click", ev => { 
      const songSelected = ev.currentTarget.getAttribute("data-song-id");
  
      /*- si el data-id del repoductor está vacío, le paso como valor el id de la canción 
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

const loadTrack = song => {
  songLoaded = new Audio(`/music/${song}.mp3`);
  
  songLoaded.addEventListener("progress", () => {
    playPause();
    updateTime();
  });

}

const playPause = () => {
  if(!songLoaded) return; //songLoaded es undefined, y así evito el error
  if (songLoaded.paused) {
    songLoaded.play();
    playBtn.textContent="PAUSE";
    //hacer que el botón play sea pausa
    interval = setInterval(updateTime, 500);
  } else {
    songLoaded.pause();
    playBtn.textContent="PLAY";
    //hacer que el botón pause sea play
    window.clearInterval(interval);
  }
} 

const stop = () => {
  if(!songLoaded) return;

  songLoaded.currentTime = 0;
  songLoaded.pause();
  updateTime(); // Ejecuto updateTime() una vez más para que los valores de la progress bar vayan a 0
  window.clearInterval(interval);
  //playBtn.textContent = "PLAY";
}

const playNext = () => {
  if(!songLoaded) return;

  const trackDiv = document.getElementsByClassName("track-wrapper");
  const currentTrack = checkCurrentTrack();
  
  if (!trackDiv[currentTrack + 1] && songLoaded.ended) { // Me tira error porque espero a que termine la canción, antes de sacarlo. Si borro el songLoaded.enden se arregla
    stop();
    return;
  }
  
  const nextTrackDiv = trackDiv[currentTrack + 1];
  nextSong = nextTrackDiv.dataset.songId;

  player.dataset.id = nextSong;
  stop();
  loadTrack(nextSong);
  
}

const playPrevious = () => {
  if(!songLoaded) return;

  const trackDiv = document.getElementsByClassName("track-wrapper");
  const currentTrack = checkCurrentTrack();
  
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
    console.log("F");
  const trackDiv = document.getElementsByClassName("track-wrapper");
  const currentTime = document.getElementById("track-current-time"); 

  if (!songLoaded) return;
  
  if (songLoaded.ended) {
    console.log("Terminó");
    playNext();
  }  
  
  let minutes = add0(parseInt(songLoaded.currentTime / 60));
  let seconds = add0(parseInt(songLoaded.currentTime % 60));
  
  currentTime.textContent = `${minutes}:${seconds}`;
  setBarProgress();
} 
// función que agrega un 0 por delante, si el valor del parametro es menor a 10. 
const add0 = (time) => {
  return (time < 10) ? "0" + time.toString() :  time.toString();
} 

const checkCurrentTrack = () => {
  const player = document.getElementById("player");
  const trackDivArray = Array.from(document.getElementsByClassName("track-wrapper"));
  let currentTrackDiv;
  
  for (let i = 0; i < trackDivArray.length; i++) {
    if (trackDivArray[i].dataset.songId == player.dataset.id){
      currentTrackDiv = trackDivArray.indexOf(trackDivArray[i]);
      console.log(currentTrackDiv);
    }
  }

  return currentTrackDiv;
}

function setBarProgress(){
  const progress = (songLoaded.currentTime / songLoaded.duration) * 100;
  document.getElementById("track-progress").style.width = progress + "%";
}

function changeBarProgess(){
if(!songLoaded);

const bar =document.getElementById("track-bar");

bar.addEventListener("click", function(ev) {
  const newProgress = ev.offsetX / this.offsetWidth;
  songLoaded.currentTime = newProgress * songLoaded.duration;
  setBarProgress();
});
}

//Falta función de volumen songLoaded.volume!!