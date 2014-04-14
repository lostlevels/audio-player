
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

AudioPlayer.prototype.clearPlaylist = function () {
  for ( key in this.cache ) {
    this.cache[key].destroy();
  }
  delete this.list;
};

AudioPlayer.prototype.setPlaylist = function ( list ) {
  this.clearPlaylist();
  if ( list && list.join && list.concat ) {
    this.list = list.concat();
  }
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

AudioPlayer.prototype.prepare = function ( index ) {
  if ( this.list && index < this.list.length ) {
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

  if ( index != undefined && this.list && this.list.length > 0 && index < this.list.length ) {
    this.kill();
    var item = this.list[index];
    this.index = index;
    this.wrapper = this.getAudioWrapper(item.source);
    this.wrapper.on("progress", this.onWrapperProgress.bind(this));
    this.wrapper.once("almostdone", this.onWrapperAlmostDone.bind(this));
    this.wrapper.once("finished", this.onWrapperFinished.bind(this));
    this.wrapper.once("error", this.onWrapperError.bind(this));
    this.wrapper.setVolume(this.volume);
    this.wrapper.play();
    this.emit("change", item);
  }
  else if ( this.wrapper ) {
    this.wrapper.play();
  }
};

AudioPlayer.prototype.pause = function () {
  if ( this.wrapper ) {
    this.wrapper.pause();
  }
};

AudioPlayer.prototype.stop = function () {
  if ( this.wrapper ) {
    this.wrapper.stop();
  }
};

AudioPlayer.prototype.seek = function ( percent ) {
  if ( this.wrapper ) {
    this.wrapper.seekTo(percent);
  }
};

AudioPlayer.prototype.next = function () {
  if ( this.index >= 0 && this.index + 1 < this.list.length ) {
    this.play(this.index + 1);
  }
};

AudioPlayer.prototype.previous = function () {
  if ( this.index >= 0 && this.index - 1 >= 0 ) {
    this.play(this.index - 1);
  }
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

AudioPlayer.prototype.onWrapperAlmostDone = function () {
  this.prepare(this.index + 1);
};

AudioPlayer.prototype.onWrapperFinished = function () {
  this.next();
};

AudioPlayer.prototype.onWrapperError = function () {
  this.emit("error", this.list[this.index]);
  this.next();
};

AudioPlayer.prototype.onWrapperProgress = function () {
  this.emit("progress");
};

Emitter(AudioPlayer.prototype);

module.exports = AudioPlayer;
