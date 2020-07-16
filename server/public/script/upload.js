document.getElementById("new-song").onchange = showInputs;

// función que crea y muestra los campos a completar por el user.
function showInputs() {
  console.log("ejecuto")
  const fileInput = document.getElementById("new-song");
  const files = fileInput.files;
  const div = document.getElementsByClassName("new-song-details")[0];
  div.innerHTML="";

  // si el user sube más de una canción se crean los campos correspondientes a los datos del album
  if (files.length > 1) {
    const albumNameDiv = document.createElement("div");
    albumNameDiv.setAttribute("class", "upload-form-group");

    const nameLabel= document.createElement("label");
    nameLabel.setAttribute("for","album-name");
    nameLabel.textContent = "Album name:"; 

    const albumNameInput = document.createElement("input");
    albumNameInput.setAttribute("type","text");
    albumNameInput.setAttribute("name","albumName");
    albumNameInput.setAttribute("id","album-name");
    albumNameInput.setAttribute("required","true");
    

    const albumYearDiv = document.createElement("div");
    albumYearDiv.setAttribute("class", "upload-form-group");
    const yearLabel= document.createElement("label");
    yearLabel.setAttribute("for","album-year");
    yearLabel.textContent = "Album year:"; 

    const albumYearInput = document.createElement("input");
    albumYearInput.setAttribute("type","number");
    albumYearInput.setAttribute("name","albumYear");
    albumYearInput.setAttribute("id","album-year");
    albumYearInput.setAttribute("required","true");


    albumNameDiv.appendChild(nameLabel);
    albumNameDiv.appendChild(albumNameInput);
    div.appendChild(albumNameDiv)

    albumYearDiv.appendChild(yearLabel);
    albumYearDiv.appendChild(albumYearInput);
    div.appendChild(albumYearDiv)
  }
  
  // se crean los campos para que el user nombre sus canciones
  for (let i = 0; i < files.length; i++) {
    const inputDiv = document.createElement("div");
    inputDiv.setAttribute("class", "upload-form-group");
    const label= document.createElement("label");
    label.setAttribute("for","song-name");
    label.textContent = `${i+1}. song title`;

    const songNameInput = document.createElement("input");
    songNameInput.setAttribute("type","text");
    songNameInput.setAttribute("name","songname");
    songNameInput.setAttribute("id","song-name");
    songNameInput.setAttribute("required","true");

    // Los inputs tienen como valor por defecto el mismo nombre del archivo sin la extensión
    songNameInput.value = files[i].name.replace(".mp3","");

    inputDiv.appendChild(label);
    inputDiv.appendChild(songNameInput);

    div.appendChild(inputDiv);
  }

}