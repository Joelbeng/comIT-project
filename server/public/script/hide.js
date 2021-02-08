const showAndHide = () => {
  let elementHidden = document.getElementsByClassName("user-albums")[0];

  document.getElementById("songs").addEventListener("click",function() {
    elementHidden = document.getElementsByClassName("user-albums")[0];
    elementHidden.style.display = "none";
    document.getElementsByClassName("user-songs")[0].style.display="block";
    document.getElementById("albums").classList.remove("selected-title");
    this.classList.add("selected-title");
  });

  document.getElementById("albums").addEventListener("click",function() {
    elementHidden = document.getElementsByClassName("user-songs")[0];
    elementHidden.style.display="none";
    document.getElementsByClassName("user-albums")[0].style.display="block";
    document.getElementById("songs").classList.remove("selected-title");
    this.classList.add("selected-title");
  });  

  window.addEventListener("resize",() => {
    if (innerWidth > 768) {
      document.getElementsByClassName("user-songs")[0].style.display="block";
      document.getElementsByClassName("user-albums")[0].style.display="block";
    } else {
      elementHidden.style.display="none";
    }
  });
}

showAndHide();