// Función que esconde el mensaje sobre el estado de las canciones subidas
const hideUploadMsg = () => {
  const successUpload = document.getElementById("successUpload");
  const failUpload = document.getElementById("failUpload");

  if (!successUpload && !failUpload) return;

  if (document.body.contains(successUpload)) {
    setTimeout(() => {
      successUpload.style.top = "-150px";
    }, 5000);
  } else {
    setTimeout(() => {
      failUpload.style.top = "-150px";
    }, 5000);
  }
}

hideUploadMsg();