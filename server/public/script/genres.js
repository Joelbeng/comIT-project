// Función que realiza toggle de los géneros clickeados desde las cajas
const addAndRemoveGenres = () => {
  const genreBoxes = Array.from(document.getElementsByClassName("genre-box"));

  genreBoxes.forEach(box => {
    box.addEventListener("click", () => {  
      const laterBtn = document.getElementById("later-btn");

      if (laterBtn) laterBtn.style.display = "none"; // desaparece el btn Later

      box.classList.toggle("active-genre");
  
      if (box.className.indexOf("active-genre") > -1) {
        addNewPill(box);
      } else { 
        removePill(box);
      }

    });
});
}

// Función que añade nueva pill y resalta el género elegido. Recibe un elemento HTML
const addNewPill = box => {
  const selectedGenres = document.getElementsByClassName("selected-genres")[0];

  const pill = document.createElement("li");
  const span = document.createElement("span");
  const closeBtn= document.createElement("i");
  
  closeBtn.setAttribute("class","fas fa-times");     
  pill.textContent = box.getAttribute("data-genre");
  span.appendChild(closeBtn);
  pill.prepend(span);
  
  pill.addEventListener("click", () => {
    pill.remove();
    removeActiveClass(pill.textContent);
  });

  selectedGenres.appendChild(pill);
}

// Función que le agrega listener a las pills ya existentes
const addClickListenerToOldPills = () => {
  const oldPills = Array.from(document.getElementsByClassName("selected-genres")[0].children);
  
  if (oldPills.length === 0) return; // cuando el user se registra no hay oldPills, por eso retorno 

  oldPills.forEach(pill => {
    pill.addEventListener("click", () => {
      pill.remove();
      removeActiveClass(pill.textContent);
    });
  });
}

// Función que elimina la pill. Recibe un elemento HTML
const removePill = box => {
  const pills = document.getElementsByClassName("selected-genres")[0].children;

  for (let i = 0; i < pills.length; i++) {
    if (pills[i].textContent === box.getAttribute("data-genre")) {
      pills[i].remove();
      break;
    }
  }

}

// Función que saca la clase active al box seleccioinado. Recibe String
const removeActiveClass = genre => {
  const boxes = document.getElementsByClassName("active-genre");

  for (let i = 0; i < boxes.length; i++) {
    if (genre === boxes[i].getAttribute("data-genre")) {
      boxes[i].classList.remove("active-genre");
      break;
    }
  }

}

// Función agrupa en un array los géneros elegidos
const groupSelectedGenres = () => {
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
    } else {
      alert("elija por lo menos un genero");
    }
  });
}

const createLaterBtn = () => {
  const a = document.createElement("a");
  const genreButtons = document.getElementById("genres-buttons");

  a.setAttribute("id","later-btn");
  a.setAttribute("href","/setProfile");
  a.textContent = "Later";

  genreButtons.prepend(a);
}

/**
 * Función que realiza POST AJAX a "/genres" enviando los géneros elegidos por el usuario, y cambia de página
 * 
 * @param {object} genresArray || Array que contiene los géneros elegidos (string)
 */
const sendUserGenres = genresArray => {
  const genresBody = JSON.stringify(genresArray);
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