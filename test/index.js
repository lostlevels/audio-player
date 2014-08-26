
var expect = require('expect')
var AudioPlayer = require('audio-player')

describe('test', function(){
  it('gets and item', function(done){
    var item = { source: "my source" };
    var audio = new AudioPlayer();
    var index = audio.add(item)
    expect(index).to.be(0);
    done()
  });
});
