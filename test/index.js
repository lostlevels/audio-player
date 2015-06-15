var AudioPlayer = require("audio-player");

var ap = new AudioPlayer();
ap.addAndPlay({source:"./1 PM.mp3"});
ap.add({source:"./2 PM.mp3"});
ap.add({source:"./3 PM.mp3"});

var ap2 = new AudioPlayer();
ap2.add({source:"./nevgen01.mp3"})
ap2.add({source:"./nevgen02.mp3"})
ap2.add({source:"./nevgen03.mp3"})
ap2.add({source:"./nevgen04.mp3"})
ap2.add({source:"./nevgen05.mp3"})
ap2.add({source:"./nevgen06.mp3"})

var ap3 = new AudioPlayer();
ap3.add({source:"./glass0.mp3"});
ap3.add({source:"./glass1.mp3"});
ap3.add({source:"./glass2.mp3"});
ap3.add({source:"./glass3.mp3"});
ap3.add({source:"./glass4.mp3"});
ap3.add({source:"./glass5.mp3"});

ap.addEventListener('play', createAudioListeners);

var playlists = [];
playlists.push(ap.items);
playlists.push(ap2.items);
playlists.push(ap3.items);

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
  var currentPlaylist = playlists[0];
  for (var i = 0; i < playlists.length; i++) {
    if (currentPlaylist === playlists[i]) {
      currentPlaylist = playlists[i+1];
    }
    if (currentPlaylist === playlists.length) { // restart
      currentPlaylist = playlists[0];
    }
    ap[element](currentPlaylist);
  }
};
