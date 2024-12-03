// (async () => {
//   const response = await fetch("https://googlechromeai.devpost.com/favicon.ico", { mode: 'no-cors' });
//   if (!response.ok) { console.log("Not Ok"); }

//   const blob = await response.blob();
//   const buffer = await blob.arrayBuffer();
//   const base64String = bufferToBase64(buffer);
//   console.log(base64String);
//   document.getElementById('fav').innerHTML = `<img src="data:image/png;base64,${base64String}" alt="Favicon" class="favicon" />`;
// })();

// function bufferToBase64(buffer) {
//   return Buffer.from(buffer).toString('base64');
// }

(async () => {
  const response = await fetch("https://googlechromeai.devpost.com/favicon.ico", { mode: 'no-cors' });
  if (!response.ok) {
    console.log("Not Ok");
    return;
  }

  const blob = await response.blob();
  // const base64String = await blobToBase64(blob);
  console.log(blob);
  // document.getElementById('fav').innerHTML = `<img src="data:image/png;base64,${base64String}" alt="Favicon" class="favicon" />`;
})();

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]); // Extract base64 string
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}