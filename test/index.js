var AudioPlayer = require("audio-player");

var ap = new AudioPlayer();
ap.add({source:"./Op. 9 No. 1.mp3"});
ap.add({source:"./Op. 9 No. 2.mp3"});
ap.add({source:"./Op. 9 No. 3.mp3"});
ap.add({source:"./Op. 15 No. 1.mp3"});
ap.add({source:"./Op. 15 No. 2.mp3"});
ap.add({source:"./Op. 27 No. 1.mp3"});
ap.add({source:"./Op. 27 No. 2.mp3"});
ap.add({source:"./Op. 32 No. 1.mp3"});
ap.add({source:"./Op. 32 No. 2.mp3"});

var ap2 = new AudioPlayer();
ap2.add({source:"./Op. 37 No. 1.mp3"});
ap2.add({source:"./Op. 37 No. 2.mp3"});
ap2.add({source:"./Op. 48 No. 1.mp3"});
ap2.add({source:"./Op. 48 No. 2.mp3"});
ap2.add({source:"./Op. 55 No. 1.mp3"});
ap2.add({source:"./Op. 55 No. 2.mp3"});
ap2.add({source:"./Op. 62 No. 1.mp3"});
ap2.add({source:"./Op. 62 No. 2.mp3"});
ap2.add({source:"./Op. 72 No. 1.mp3"});

ap.addEventListener('play', createAudioListeners);
ap.play();

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
  } else if (element === "set") {
    togglePlaylist(element);
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
};

function togglePlaylist (element) {
  var currentPlaylist = ap.items; 
  if (currentPlaylist === ap.items) { // restart playlist
    currentPlaylist = ap2.items;
  } else {
    currentPlaylist = ap.items;
  }
  ap[element](currentPlaylist);
};
