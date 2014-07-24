
var Point = require("point");
var Emitter = require("emitter");

function AudioPlayer () {
  this.items = [];
  this.index = -1;
  this.continuous = true;
  this.vol = 1.0;
  this.listeners = {
    audio: {
      error: this.onAudioError.bind(this),
      ended: this.onAudioEnded.bind(this)
    }
  };
  this.events = new Emitter();
}

AudioPlayer.prototype.trigger = function ( event ) {
  this.events.emit(event, this);
};

AudioPlayer.prototype.add = function ( item ) {
  if ( item && item.source && typeof item.source == "string" ) {
    this.items.push(item);
    this.trigger("add");
    return this.items.length - 1;
  }
  return -1;
};

AudioPlayer.prototype.addAndPlay = function ( item ) {
  var index = this.add(item);
  if ( index >= 0 ) {
    this.play(index);
  }
};

AudioPlayer.prototype.remove = function ( item ) {
  var index = this.items.indexOf(item);
  if ( index > -1 ) {
    if ( index == this.index ) {
      this.killAudio();
    }
    this.items.splice(index, 1);
    this.trigger("remove");
  }
};

AudioPlayer.prototype.createAudio = function ( source ) {
  audio = new Audio(source);
  audio.source = source;
  audio.volume = this.vol;
  for ( var key in this.listeners.audio ) {
    audio.addEventListener(key, this.listeners.audio[key]);
  }
  return audio;
};

AudioPlayer.prototype.destroyAudio = function ( audio ) {
  if ( !audio ) return;
  for ( var key in this.listeners.audio ) {
    audio.removeEventListener(key, this.listeners.audio[key]);
  }
};

AudioPlayer.prototype.killAudio = function () {
  if ( !this.audio ) return;
  this.stop();
  this.destroyAudio(this.audio);
  delete this.audio;
};

AudioPlayer.prototype.play = function ( index ) {
  index = index != undefined ? index : this.index;
  var source = (this.items[index] || {}).source;
  if ( !source ) return false;

  var changed = false;
  if ( index != this.index || (this.audio && this.audio.source != source) ) {
    this.index = index;
    changed = true;
  }

  if ( changed ) {
    this.destroyAudio(this.audio);
    this.audio = this.createAudio(source);
    this.trigger("changed");
  }

  this.audio.play();
  this.trigger("play");
  return true;
};

AudioPlayer.prototype.pause = function () {
  if ( !this.audio || this.audio.error ) return;
  this.audio.pause();
  this.trigger("pause");
};

AudioPlayer.prototype.stop = function () {
  if ( !this.audio || this.audio.error ) return;
  this.audio.currentTime = 0.0;
  this.audio.pause();
  this.trigger("stop");
};

AudioPlayer.prototype.next = function () {
  var index = this.index + 1; 
  this.stop();
  this.trigger("next");
  this.play(index);
};

AudioPlayer.prototype.previous = function () {
  var index = this.index - 1; 
  this.stop();
  this.trigger("previous");
  this.play(index);
};

AudioPlayer.prototype.volume = function ( value ) {
  var volume = Point.clamp(value, 0.0, 1.0);

  if ( this.vol != volume ) {
    this.vol = volume;
    this.trigger("volume");
  }

  if ( this.audio ) {
    this.audio.volume = this.vol;
  }

  return this.vol;
};

AudioPlayer.prototype.seek = function ( percent ) {
  if ( !this.audio || this.audio.error ) return;

  percent = Point.clamp(percent, 0.0, 1.0);
  this.audio.currentTime = percent * this.audio.duration;
};

AudioPlayer.prototype.onAudioError = function ( e ) {
  this.trigger("error");
  this.killAudio();
};

AudioPlayer.prototype.onAudioEnded = function( e ) {
  this.trigger("ended");
  if ( this.continuous ) {
    this.next();
  }
};

module.exports = AudioPlayer;
