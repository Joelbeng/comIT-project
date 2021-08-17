// función que crea y muestra los campos a completar por user
const createAndShowNewElements= () => {
  const fileInput = document.getElementById("new-song");
  const files = fileInput.files;
  const div = document.getElementsByClassName("new-song-info")[0];
  const form = document.getElementsByTagName("form")[0];
  
  const divImage = document.createElement("div");
  const pImage = document.createElement("p");
  const imageButton = document.createElement("button");
  const inputImage = document.createElement("input");

  const divPreview = document.createElement("div");
  const previewImg = document.createElement("img");   

  imageButton.setAttribute("type","button");
  imageButton.setAttribute("id","upload-img");
  inputImage.setAttribute("type","file");
  inputImage.setAttribute("name","songImg");
  inputImage.setAttribute("id","new-song-img");
  inputImage.setAttribute("accept","image/*");
  
  divPreview.setAttribute("class","preview");
  divImage.setAttribute("class","upload-img-container")

  imageButton.addEventListener("click", () => {
    inputImage.click();
  });

  inputImage.addEventListener("change", function() {
    const file = this.files[0];
    const reader = new FileReader();

    if (file) {
      reader.readAsDataURL(file);
    } else {
      previewImg.src = "";
    }

    reader.onloadend = function () {
      previewImg.src = reader.result;
    }
  });

  imageButton.textContent = "Select your Image";
  pImage.textContent = "Upload a cover image";

  divPreview.appendChild(previewImg);

  divImage.appendChild(pImage);
  divImage.appendChild(imageButton);
  divImage.appendChild(divPreview);
  div.appendChild(divImage);

  const divInputs = document.createElement("div");
  const genreLabel = document.createElement("label");
  const select = document.createElement("select");
  
  divInputs.setAttribute("class","input-container");
  genreLabel.setAttribute("for","new-song-genre");
  genreLabel.textContent = "Genre:"
  
  // se crea option vacío así no toma el primer género como elegido por defecto (es eliminado en la funcion select2function)
  const option = document.createElement("option");
  option.setAttribute("id","parche");
  select.appendChild(option); 
 
  genres.forEach(genre => {
    const option = document.createElement("option");
    option.setAttribute("value", genre);
    option.textContent = genre;
    select.appendChild(option);
  });

  select.setAttribute("id","new-song-genre");
  select.setAttribute("name","songGenre");
  select.setAttribute("class","form-control");
  select.setAttribute("multiple","multiple");
  select.setAttribute("required","true");
  
  divInputs.appendChild(genreLabel);
  divInputs.appendChild(select);

  const buttonsDiv = document.createElement("div");
  const cancelBtn = document.createElement("a");
  const submitBtn = document.createElement("input");

  buttonsDiv.setAttribute("class","upload-form-buttons");
  cancelBtn.setAttribute("href","/upload");
  submitBtn.setAttribute("type","submit");
  submitBtn.setAttribute("value","Ready");
  cancelBtn.textContent = "Cancel";
  
  buttonsDiv.appendChild(cancelBtn);
  buttonsDiv.appendChild(submitBtn);
  form.appendChild(buttonsDiv);
  document.getElementsByClassName("file-select")[0].style.display = "none";


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
    albumYearInput.setAttribute("min","1900");
    albumYearInput.setAttribute("max","2020");
    albumYearInput.setAttribute("required","true");


    albumNameDiv.appendChild(nameLabel);
    albumNameDiv.appendChild(albumNameInput);
    divInputs.appendChild(albumNameDiv);

    albumYearDiv.appendChild(yearLabel);
    albumYearDiv.appendChild(albumYearInput);
    divInputs.appendChild(albumYearDiv);
    div.appendChild(divInputs);
  }
  
  // se crean los campos para que el user nombre sus canciones
  for (let i = 0; i < files.length; i++) {
    const inputDiv = document.createElement("div");
    inputDiv.setAttribute("class", "upload-form-group");
    const label= document.createElement("label");
    label.setAttribute("for","song-name"+i);
    
    if (files.length === 1) {
      label.textContent = "Song Title";
    } else {
      label.textContent = `${i+1}. Song Title`;
    }

    const songNameInput = document.createElement("input");
    songNameInput.setAttribute("type","text");
    songNameInput.setAttribute("name","songname");
    songNameInput.setAttribute("id","song-name"+i);
    songNameInput.setAttribute("required","true");

    // Los inputs tienen como valor por defecto el mismo nombre del archivo sin la extensión
    songNameInput.value = files[i].name.replace(".mp3","");

    inputDiv.appendChild(label);
    inputDiv.appendChild(songNameInput);
    divInputs.appendChild(inputDiv);
    div.appendChild(divInputs);
  }
  select2function(); // setea select2
}

document.getElementById("new-song").onchange = createAndShowNewElements;

// trigger de input file
document.getElementById("upload-song").addEventListener("click", () => {
  document.getElementById("new-song").click();
});

// select2 script
const select2function = () => {
  $(".form-control").select2({
    placeholder:"Select the genre/s",
    tags: true,
    tokenSeparators: [',', ' ']
  });
  
  /* Se elimina option vacío para que funcione correctamente select2. Si se lo dejaba, al seleccionar 
  el primero se seleccionaba también un tag vacío. Sin option vacío comenzaba con el primer género como placeholder */
  document.getElementById("parche").remove();
}