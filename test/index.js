
var expect = require('expect')
var AudioPlayer = require('audio-player')

describe('test', function(){
  it('gets and item', function(){
    var item = { source: "./1 PM.mp3" };
    var audio = new AudioPlayer();
    var index = audio.add(item)
    expect(index).to.be(0);
  });

  it('index isnt undefined after playing from pause', function(){
    var player = new AudioPlayer();
    player.add({ source: "./1 PM.mp3" })
    player.play();
    expect(player.index).to.be(0);
    player.pause();
    expect(player.index).to.be(0);
    player.play();
    expect(player.index).to.be(0);
  });
});
