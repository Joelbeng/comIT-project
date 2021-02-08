const searchBar = document.getElementById("search-bar");
const searchBtn = document.getElementById("search-btn");

searchBar.addEventListener("keyup", function(ev) {
  console.log(ev.key);
  if(ev.key === "Enter"){
    window.location.href = "/search/"+ this.value;
  }
});

searchBtn.addEventListener("click", () => {
  if(!searchBar.value) return;
  window.location.href = "/search/"+ searchBar.value;
});