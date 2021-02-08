window.addEventListener("load", ()=> {
  showAndHideDropdown();
  showAndHideMobileMenu();
  closeMenusOnClickOut();
});

const showAndHideDropdown = () => {
  document.getElementById("drop-btn").addEventListener("click", () => {
    document.getElementById("dropdown").classList.toggle("show");
  });
}

const showAndHideMobileMenu = () => {
  const hiddenMenu = document.getElementsByClassName("overlay-menu")[0];
  const openBtn = document.getElementById('open-menu');
  const closeBtn = document.getElementById('close-menu-btn');
  const fullOverlay = document.getElementById('full-overlay');

  openBtn.addEventListener('click', () => {
    hiddenMenu.style.right = '0%';
    fullOverlay.style.right = "0";
  });

  closeBtn.addEventListener('click', () => {
    hiddenMenu.style.right = '-50%';
    fullOverlay.style.right = "100%";
  });
}

// cierra dropdown o el menú mobile al hacer click fuera del menu
const closeMenusOnClickOut = () => {
  const dropdown = document.getElementById("dropdown"); 
  const mobileMenu = document.getElementsByClassName("overlay-menu")[0];

  window.addEventListener("click", (ev) => {
    // cierra dropdown
    if (!ev.target.matches(".drop-btn-part") && dropdown.classList.contains("show")) {
      dropdown.classList.remove("show");
    }

    // cierra menu mobile
    if (!ev.target.matches(".overlay-menu") && getComputedStyle(mobileMenu,null).getPropertyValue("right") === "0px") {
      document.getElementById("full-overlay").style.right = "100%";
      mobileMenu.style.right = "-50%";
    }
  });
}