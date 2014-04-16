
var Emitter = require("emitter");
var Point = require("point");

function AudioWrapper ( source ) {
  this.init(source);
}

AudioWrapper.prototype.init = function( source ) {
  this.audio = new Audio();
  this.audio.src = source;
  this.listeners = {
    ended: this.onEnded.bind(this),
    error: this.onError.bind(this)
  };
};

AudioWrapper.prototype.destroy = function () {
  this.stop();
  this.unwatch();
  delete this.audio;
  delete this.listeners;
};

AudioWrapper.prototype.watch = function () {
  this.unwatch();
  this.watching = true;
  this.audio.addEventListener("ended", this.listeners.ended);
  this.audio.addEventListener("error", this.listeners.error);
  this.startTimer();
};

AudioWrapper.prototype.unwatch = function () {
  delete this.watching;
  this.stopTimer();
  this.audio.removeEventListener("ended", this.onEnded.bind(this));
  this.audio.removeEventListener("error", this.onError.bind(this));
};

AudioWrapper.prototype.startTimer = function () {
  this.stopTimer();
  this.timer = setTimeout((function () {
    this.onStep();
    this.startTimer();
  }).bind(this), 20);
};

AudioWrapper.prototype.stopTimer = function () {
  if ( this.timer ) {
    clearTimeout(this.timer);
    delete this.timer;
  }
};

AudioWrapper.prototype.play = function () {
  this.watch();
  this.audio.play();
};

AudioWrapper.prototype.pause = function () {
  if ( !this.invalid ) {
    this.audio.pause();
    // TODO Add fade out.
  }
};

AudioWrapper.prototype.stop = function () {
  if ( !this.invalid ) {
    this.audio.currentTime = 0.0;
    this.audio.pause();
  }
};

AudioWrapper.prototype.setVolume = function ( value ) {
  this.audio.volume = Point.clamp(value, 0.0, 1.0);
};

AudioWrapper.prototype.seekTo = function ( percent ) {
  if ( !this.invalid ) {
    percent = Point.clamp(percent, 0, 1.0);
    this.audio.currentTime = this.audio.duration * percent;
  }
};

AudioWrapper.prototype.onError = function ( e ) {
  this.invalid = true;
  this.emit("error");
};

AudioWrapper.prototype.onEnded = function ( e ) {
  this.emit("finished");
};

AudioWrapper.prototype.onStep = function () {
  var index = this.audio.currentTime;
  var length = this.audio.duration;
  var percent = index / length;
  var timeleft = length - index;
  
  // Almost done warning.
  if ( !this.firedAlmostDone && percent > 0.9 ) {
    this.firedAlmostDone = true;
    this.emit("almostdone");
  } 
  else {
    delete this.firedAlmostDone;
  }

  // One second remaining warning.
  if ( !this.firedTimeLeft && timeleft <= 1.0 ) {
    this.firedTimeLeft = true;
    this.emit("secondremaining");
  }
  else {
    delete this.firedTimeLeft;
  }

  if ( !this.timeleft || this.timeleft != timeleft ) {
    this.timeleft = timeleft;
    this.emit("progress");
  }
};

Emitter(AudioWrapper.prototype);

function AudioPlayer () {
  this.volume = 1.0;
  this.cache = {};
}

AudioPlayer.prototype.destroy = function () {
  this.kill();
  this.clearPlaylist();
};

AudioPlayer.prototype.createPlaylistIfNone = function () {
  if ( !this.playlist ) {
    this.createPlaylist(true);
  }
};

AudioPlayer.prototype.createPlaylist = function ( silent ) {
  this.setPlaylist({tracks:[]}, silent);
};

AudioPlayer.prototype.clearPlaylist = function () {
  for ( key in this.cache ) {
    this.cache[key].destroy();
  }
  delete this.index;
  delete this.playlist;
};

AudioPlayer.prototype.setPlaylist = function ( playlist, silent ) {
  if ( playlist.tracks && playlist.tracks.join ) {
    this.kill();
    this.clearPlaylist();
    this.playlist = playlist;
    if ( !silent ) {
      this.emit("set:playlist");
    }
  }
};

AudioPlayer.prototype.getCurrentPlaylistItem = function () {
  if ( this.index && this.playlist && this.index < this.playlist.tracks.length ) {
    return this.playlist.tracks[this.index];
  }
};

AudioPlayer.prototype.addItemToPlaylist = function ( item , silent ) {
  if ( item.source ) {
    this.createPlaylistIfNone();
    this.playlist.tracks.push(item);
    if ( !silent ) {
      this.emit("update:playlist");
    }
    return this.playlist.tracks.length - 1;
  }

  return -1;
};

AudioPlayer.prototype.addToPlaylist = function ( items ) {
  if ( items.join ) {
    for ( var i = 0; i < items.length; i++ ) {
      this.addItemToPlaylist(items[i], true);
    }
    this.emit("update:playlist");
  }
  else {
    this.addItemToPlaylist(items);
  }

  return this.playlist.tracks.length - 1;
};

AudioPlayer.prototype.setVolume = function ( value ) {
  this.volume = value;
  if ( this.wrapper ) {
    this.wrapper.setVolume(this.volume);
  }
};

AudioPlayer.prototype.getAudioWrapper = function ( source ) {
  if ( !this.cache[source] ) {
    this.cache[source] = new AudioWrapper(source);
  }
  return this.cache[source];
};

AudioPlayer.prototype.getTimeDuration = function () {
  if ( this.wrapper ) {
    return this.wrapper.audio.duration;
  }
  return 0;
};

AudioPlayer.prototype.getTimeRemaining = function () {
  if ( this.wrapper ) {
    return this.wrapper.audio.duration - this.wrapper.audio.currentTime;
  }
  return 0;
};

AudioPlayer.prototype.getTimeProgressed = function () {
  if ( this.wrapper ) {
    return this.wrapper.audio.currentTime;
  }
  return 0;
}

AudioPlayer.prototype.getTimePercentage = function () {
  if ( this.wrapper ) {
    return this.wrapper.audio.currentTime / this.wrapper.audio.duration;
  }
  return 0;
};

AudioPlayer.prototype.prepare = function ( index ) {
  if ( this.playlist.tracks && index < this.playlist.tracks.length ) {
    this.getAudioWrapper(index);
  }
};

AudioPlayer.prototype.kill = function () {
  if ( this.wrapper ) {
    this.wrapper.off();
    this.wrapper.stop();
    delete this.wrapper;
  }
};

AudioPlayer.prototype.play = function ( index ) {
  index = !isNaN(index) ? parseInt(index) : undefined; 

  if ( index != undefined && this.playlist.tracks && this.playlist.tracks.length > 0 && index < this.playlist.tracks.length ) {
    this.kill();
    var item = this.playlist.tracks[index];
    this.index = index;
    this.wrapper = this.getAudioWrapper(item.source);
    this.wrapper.on("progress", this.onWrapperProgress.bind(this));
    this.wrapper.once("almostdone", this.onWrapperAlmostDone.bind(this));
    this.wrapper.once("finished", this.onWrapperFinished.bind(this));
    this.wrapper.once("error", this.onWrapperError.bind(this));
    this.wrapper.setVolume(this.volume);
    this.emit("change:audio", item);
  }

  if ( this.wrapper ) {
    this.wrapper.play();
    this.emit("audio:play");
  }
};

AudioPlayer.prototype.pause = function () {
  if ( this.wrapper ) {
    this.wrapper.pause();
    this.emit("audio:pause");
  }
};

AudioPlayer.prototype.toggle = function () {
  if ( this.wrapper.audio.paused ) {
    this.play();
  }
  else {
    this.pause();
  }
};

AudioPlayer.prototype.stop = function () {
  if ( this.wrapper ) {
    this.wrapper.stop();
    this.emit("audio:stop");
  }
};

AudioPlayer.prototype.seek = function ( percent ) {
  if ( this.wrapper ) {
    this.wrapper.seekTo(percent);
    this.emit("audio:seek", percent);
  }
};

AudioPlayer.prototype.next = function () {
  if ( this.index >= 0 && this.index + 1 < this.playlist.tracks.length ) {
    this.play(this.index + 1);
  }
};

AudioPlayer.prototype.previous = function () {
  if ( this.index >= 0 && this.index - 1 >= 0 ) {
    this.play(this.index - 1);
  }
};

AudioPlayer.prototype.onWrapperAlmostDone = function () {
  this.prepare(this.index + 1);
};

AudioPlayer.prototype.onWrapperFinished = function () {
  this.next();
};

AudioPlayer.prototype.onWrapperError = function () {
  this.emit("error:audio", this.playlist.tracks[this.index]);
  this.next();
};

AudioPlayer.prototype.onWrapperProgress = function () {
  this.emit("audio:progress", this.getTimePercentage());
};

Emitter(AudioPlayer.prototype);

module.exports = AudioPlayer;
