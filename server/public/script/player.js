const trackList = document.getElementById("track-list");
const playBtn = document.getElementById("play-btn");
const stopBtn = document.getElementById("stop-btn");
const nextBtn = document.getElementById("next-btn");
const previousBtn = document.getElementById("previous-btn");
const player =  document.getElementById("player");
const currentTime =  document.getElementById("current-time");

window.onload = function(){
  showSongs(songsList); 
  getSong();
}

function showSongs(songsData) {
  const ul = document.createElement("ul");
  let songDuration;

  for (let i = 0; i < songsData.length; i++) {
    const li = document.createElement("li");
    li.setAttribute("class","track");
    li.setAttribute("data-id",songsData[i].id); //con este id el reproductor sabe qué canción es
    li.textContent = `Canción: ${songsData[i].name} - Artista: ${songsData[i].artist} --`;
    
    //cargo todas las canciones para poder leer su duración
    const track = new Audio(songsData[i].file);
    track.addEventListener("loadedmetadata",() => { 
      const minutes = add0(parseInt(track.duration / 60));
      const seconds = add0(parseInt(track.duration % 60));
      li.textContent += `duración: ${minutes}:${seconds}`;
    });

    ul.appendChild(li);
  }   
  trackList.appendChild(ul);
}

//Carga la canción que clickeo en el reproductor, o le da pausa si ya se está reproduciendo
function getSong() {
  const tracks = document.getElementsByClassName("track");

  for(let i = 0; i < tracks.length; i++) {
    tracks[i].addEventListener("click", ev => {
      const playerId = document.getElementById("player").getAttribute("data-id");
      const songFound = songsList.find(song => song.id == ev.target.getAttribute("data-id"));
      
      /*- si el data-id del repoductor está vacío, le paso como valor el id de la canción 
        - si hice click en la misma canción que estoy reproduciendo, ejecuto playPause()
        - si no, es porque hice click en una canción diferente a la que estoy reproduciendo  
      */ 
      
      if (!playerId) { 
        player.dataset.id = songFound.id;
        loadTrack(songFound.file);
      } else if (playerId == ev.target.getAttribute("data-id")) { 
          playPause();
      } else {
          player.dataset.id = songFound.id;
          stop();
          loadTrack(songFound.file);
      }
    });
  }
}

let songLoaded;

const loadTrack = song => {
  songLoaded = new Audio(song);
  songLoaded.addEventListener("progress",() => { // si hago el listen a "canplay"(recomendado MDN) me rompe
    playPause();
    updateTime();
  });
}

let interval;

const playPause = () => {
  if(!songLoaded) return; // al principio songLoaded es undefined
  

  if (songLoaded.paused) {
    songLoaded.play();
    playBtn.textContent= "PAUSE";
    interval = setInterval(updateTime, 500);
  } else {
      songLoaded.pause();
      playBtn.textContent="PLAY";
      window.clearInterval(interval); //Corto el setInterval, porque si no sigue ejecutando la función
  }  
}

const stop = () => {
  if(!songLoaded) return;

  songLoaded.currentTime = 0;
  songLoaded.pause();
  updateTime(); // Ejecuto updateTime() una vez más para que los valores vayan a 0
  window.clearInterval(interval);
  playBtn.textContent = "PLAY";
}

const playNext = () => {
  if(!songLoaded) return;

  const playerId = document.getElementById("player").getAttribute("data-id");
  const nextSong = songsList.find(song => song.id == parseInt(playerId) + 1);
  
  if (!nextSong) {
    window.clearInterval(interval);
    return; //si no existe una canción con el id que busco, salgo de la función
  }
    
  player.dataset.id = nextSong.id;
  stop();
  loadTrack(nextSong.file);
}

const playPrevious = () => {
  if(!songLoaded) return;

  const playerId = document.getElementById("player").getAttribute("data-id");
  const previousSong = songsList.find(song => song.id == parseInt(playerId) - 1);
  if(!previousSong) return; 
  
  player.dataset.id = previousSong.id;
  stop();
  loadTrack(previousSong.file);
}

//función que muestra el tiempo actual de la canción
const updateTime = () => {
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

function setBarProgress(){
  const progress = (songLoaded.currentTime / songLoaded.duration) * 100;
  document.getElementById("track-progress").style.width = progress + "%";
}

const bar =document.getElementById("track-bar");

bar.addEventListener("click", function(ev) {
  const newProgress = ev.offsetX / this.offsetWidth;
  songLoaded.currentTime = newProgress * songLoaded.duration;
  setBarProgress();
});



const songsList = [
  {
    id:1,
    name:"Kalimba",
    artist:"Bob Acri",
    file:"music/Kalimba.mp3"
  },
  {
    id:2,
    name:"Sleep Away",
    artist:"Mr Scruff",
    file:"music/Sleep Away.mp3",
  },
  {
    id:3,
    name:"Maid with the Flaxen Hair",
    artist: "Richard Stoltzman",
    file:"music/Maid with the Flaxen Hair.mp3",
  }
];

playBtn.addEventListener("click",playPause); 
stopBtn.addEventListener("click",stop); 
nextBtn.addEventListener("click",playNext); 
previousBtn.addEventListener("click",playPrevious); 

/*


songsList = {
  song{
    likes:0,
    userLiked:[]
  }
}

likes {
  songsLiked:["id:1","id:4"],
  
}


Artist = {

  followers = {
    amount: 4,
    users:[artist3,artist45,...]
  }

  folowwing = {
    amount : 5,
    users:[artist1,artist79]
  }
}

cuando clickeo en una canción hacer un get ajax, y que respondo ejecutando loadTrack(). De esta manera tengo la url para pasar la canción

*/ 