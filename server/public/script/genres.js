const boxes = document.getElementsByClassName("genre-box");
const boxesArr = Array.from(boxes);

boxesArr.forEach(box => {
  box.addEventListener("click", () => {
    box.classList.toggle("active-genre");
  });
});

document.getElementById("ready-btn").addEventListener("click", () => {
  let userGenres = [];
  const chosenGenres = document.getElementsByClassName("active-genre");
  const genresArr = Array.from(chosenGenres);

  genresArr.forEach(genre => {
    userGenres.push(genre.getAttribute("data-genre"));
  });

  //chequeo que haya elegido al menos un género
  if (userGenres.length > 0) {
    sendUserGenres(userGenres);
    //cambiar el estilo del color del botón "Ready"        
  } else {
    alert("eliga por lo menos un genero")
  }
});

//Realiza post Ajax a "/genres" enviando el array que contiene los géneros elegidos por el user
function sendUserGenres(Arr) {
  const genresBody = JSON.stringify(Arr);
  const xhr = new XMLHttpRequest();

  xhr.onload = function () {
    const result = JSON.parse(this.responseText);

  // El post a genres responde con un objeto que me dice si el user está en la etapa de registro, o si ya es usuario loggeado 
    if (result.success && result.user == "registered") {
      window.location.href = "/setProfile";
    } else if (result.success) {
      window.location.href ="/home";
    } else {
      window.location.href ="/error";
    }
  }

  xhr.open("POST", "/genres");
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.send(genresBody);
}