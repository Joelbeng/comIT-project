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

  // se chequea que haya elegido al menos un género
  if (userGenres.length > 0) {
    sendUserGenres(userGenres);
    //cambiar el estilo del color del botón "Ready"        
  } else {
    alert("eliga por lo menos un genero")
  }
});

/**
 * Función que realiza POST AJAX a "/genres" enviando los géneros elegidos por el usuario, y cambia de página
 * 
 * @param {object} Arr || Array que contiene los géneros elegidos (string)
 */
const sendUserGenres= Arr => {
  const genresBody = JSON.stringify(Arr);
  const xhr = new XMLHttpRequest();

  xhr.onload = function() {
    const result = JSON.parse(this.responseText);

  // El post a genres responde con un objeto que me dice si el user está en la etapa de registro, o si ya es usuario loggeado 
    if (result.result && !result.userOldGenres) {
      window.location.href = "/setProfile";
    } else if (result) {
      window.location.href ="/home";
    } else {
      window.location.href ="/error";
    }
  }

  xhr.open("POST", "/genres");
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.send(genresBody);
}