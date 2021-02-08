window.addEventListener("load",() => {
  setTimeout(showAlbumDuration,800); // sin setTimeout a veces no suma bien el total de minutos
});

// Función que muestra la duración total del Album
const showAlbumDuration = () => {
  let totalDuration = 0;
  const trackDiv = document.getElementsByClassName("track-wrapper");
  
  for (let i = 0; i < trackDiv.length; i++) {
    const songId = trackDiv[i].getAttribute("data-song-id");
    const track = new Audio(`/music/${songId}`);

    track.addEventListener("loadeddata", () => { 
      totalDuration += track.duration;

      if (i === trackDiv.length - 1) {      
        const albumMinutes = Math.round(totalDuration / 60);
        document.getElementById("album-duration").textContent += albumMinutes + " mins";
      }

    });
  }
}