document.getElementById("new-song").onchange = showNameInput;

function showNameInput() {
  console.log("ejecuto")
  const fileInput = document.getElementById("new-song");
  const files = fileInput.files;
  const div = document.getElementsByClassName("new-song-input")[0];
  div.innerHTML="";

  //si sube más de una canción le creo los campos correspondientes a los datos del album
  if (files.length > 1) {

    const nameLabel= document.createElement("label");
    nameLabel.setAttribute("for","album-name");
    nameLabel.textContent = "Name of the album:"; 

    const albumNameInput = document.createElement("input");
    albumNameInput.setAttribute("type","text");
    albumNameInput.setAttribute("name","albumname");
    albumNameInput.setAttribute("id","album-name");
    albumNameInput.setAttribute("required","true");
    

    const yearLabel= document.createElement("yearLabel");
    yearLabel.setAttribute("for","album-year");
    yearLabel.textContent = "Year of the album:"; 

    const albumYearInput = document.createElement("input");
    albumYearInput.setAttribute("type","number");
    albumYearInput.setAttribute("name","albumyear");
    albumYearInput.setAttribute("id","album-year");
    albumYearInput.setAttribute("required","true");


    div.appendChild(nameLabel);
    div.appendChild(albumNameInput);
    div.appendChild(yearLabel);
    div.appendChild(albumYearInput);
  }
  
  //creo campos para que el user nombre sus canciones
  for (let i = 0; i < files.length; i++) {
    const label= document.createElement("label");
    label.setAttribute("for","song-name");
    label.textContent = `${i+1}. name:`; 

    const songNameInput = document.createElement("input");
    songNameInput.setAttribute("type","text");
    songNameInput.setAttribute("name","songname");
    songNameInput.setAttribute("id","song-name");
    songNameInput.setAttribute("required","true");

    div.appendChild(label);
    div.appendChild(songNameInput);
  }
    document.getElementsByTagName("form")[0].appendChild(div);
    console.log("hago append")
}