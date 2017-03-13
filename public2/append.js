window.onresize = function () {
  console.log("Yay");
};

function main () {
  b1.addEventListener('click', bindSecondButton);
  /* b1.onclick = bindSecondButton;*/
  /* window.onresize = consli('resizing');*/
  /* window.addEventListener('resize', consli('resizing'));*/
  /* window.onload = consli('loaded');*/
  /* window.addEventListener('load', consli('loaded'));*/
  /* window.onclick = consli('clicked');*/
  /* window.addEventListener('click', consli('clicked'));*/
  setInterval(noop, 1000);
  /* recurnoop();*/
}
function consli(message) {
  return function (){ console.log('am ', message, ' :)'); };
}
function recurnoop () {
  console.log('recurnoop');
  setTimeout(noop, 1000);
}
function noop () {
  console.log('noop');
}
function bindSecondButton () {
  b2.addEventListener('click', throwError);
}

function throwError () {
  throw new Error('aw shucks');
}

main();
