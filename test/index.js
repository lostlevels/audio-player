var AudioPlayer = require("audio-player");
// first playlist
var ap = new AudioPlayer();
ap.addAndPlay({source:"./1 PM.mp3"});
ap.add({source:"./2 PM.mp3"});
ap.add({source:"./3 PM.mp3"});

//second playlist
var ap2 = new AudioPlayer();
ap2.add({source:""});
ap2.add({source:""});
ap2.add({source:""});

ap.addEventListener('play', createAudioListeners);

//buttons to respond to their individual actions; 
var button = document.getElementsByTagName("button");
for (var i = 0; i < button.length; i++) {
  button[i].addEventListener('click', playerAction);
};

// display time + sourece;
function createAudioListeners () {
  audio.addEventListener('playing', updateSource);
  audio.addEventListener('timeupdate', updateTime);
};

function updateTime () {
  var time = document.getElementById("time-remaining");
  time.innerHTML = (ap.audio.duration - ap.audio.currentTime).toFixed(2);
};

function updateSource () {
  var source = document.getElementById("source-title");
  source.innerHTML = ap.audio.source;

};

function playerAction () {
  var element = this.getAttribute('do');
  if (!element) {
    var attribute = this.getAttribute('class');
    toggleAttribute(attribute);
  } else {
    ap[element]();
  }
};

function toggleAttribute (attribute) {
  if( ap[attribute] === true ) {
    ap[attribute] = false;
  } else {
    ap[attribute] = true;
  }
}
