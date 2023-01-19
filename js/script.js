var clickList = [];
var savedRecordings = [];
var recording = false;
var recordStartTime = new Date();
var recordingIndex = 0;

function drop(x, y, damping, shading, refraction, ctx, screenWidth, screenHeight) {
  this.x = x;
  this.y = y;
  this.shading = shading;
  this.refraction = refraction;
  this.bufferSize = this.x * this.y;
  this.damping = damping;
  this.background = ctx.getImageData(0, 0, screenWidth, screenHeight).data;
  this.imageData = ctx.getImageData(0, 0, screenWidth, screenHeight);
  this.buffer1 = [];
  this.buffer2 = [];
  for (var i = 0; i < this.bufferSize; i++) {
    this.buffer1.push(0);
    this.buffer2.push(0);
  }
  this.update = function() {
    for (var i = this.x + 1, x = 1; i < this.bufferSize - this.x; i++, x++) {
      if ((x < this.x)) {
        this.buffer2[i] = ((this.buffer1[i - 1] + this.buffer1[i + 1] + this.buffer1[i - this.x] + this.buffer1[i + this.x]) / 2) - this.buffer2[i];
        this.buffer2[i] *= this.damping;
      } else x = 0;
    }
    var temp = this.buffer1;
    this.buffer1 = this.buffer2;
    this.buffer2 = temp;
  }
  this.draw = function(ctx) {
    var imageDataArray = this.imageData.data;
    for (var i = this.x + 1, index = (this.x + 1) * 4; i < this.bufferSize - (1 + this.x); i++, index += 4) {
      var xOffset = ~~(this.buffer1[i - 1] - this.buffer1[i + 1]);
      var yOffset = ~~(this.buffer1[i - this.x] - this.buffer1[i + this.x]);
      var shade = xOffset * this.shading;
      var texture = index + (xOffset * this.refraction + yOffset * this.refraction * this.x) * 4;
      imageDataArray[index] = this.background[texture] + shade;
      imageDataArray[index + 1] = this.background[texture + 1] + shade;
      imageDataArray[index + 2] = 50 + this.background[texture + 2] + shade;
    }
    ctx.putImageData(this.imageData, 0, 0);
  }
}
var fps = 0;
var watereff = {
  // variables
  timeStep: 20,
  refractions: 2,
  shading: 3,
  damping: 0.99,
  screenWidth: 500,
  screenHeight: 400,
  pond: null,
  textureImg: null,
  interval: null,
  backgroundURL: 'img/underwater1.jpg',
  // initialization
  init: function() {

    var canvas = document.getElementById('water');
    if (canvas.getContext) {
      // fps countrt
      fps = 0;
      setInterval(function() {
        document.getElementById('fps').innerHTML = fps / 2 + ' FPS';
        fps = 0;
      }, 2000);
      canvas.onmousedown = function(e) {
        var mouse = watereff.getMousePosition(e).sub(new vector2d(canvas.offsetLeft, canvas.offsetTop));
        if (recording) {
          watereff.saveClickData(mouse);
        }
        watereff.pond.buffer1[mouse.y * watereff.pond.x + mouse.x] += 200;
      }
      canvas.onmouseup = function(e) {
        canvas.onmousemove = null;
      }
      canvas.width = this.screenWidth;
      canvas.height = this.screenHeight;
      this.textureImg = new Image(256, 256);
      this.textureImg.src = this.backgroundURL;
      canvas.getContext('2d').drawImage(this.textureImg, 0, 0);
      this.pond = new drop(
        this.screenWidth,
        this.screenHeight,
        this.damping,
        this.shading,
        this.refractions,
        canvas.getContext('2d'),
        this.screenWidth, this.screenHeight
      );
      if (this.interval != null) {
        clearInterval(this.interval);
      }
      this.interval = setInterval(watereff.run, this.timeStep);
    }
  },
  // change image func
  changePicture: function(url) {
    this.backgroundURL = url;
    this.init();
  },
  // get mouse position func
  getMousePosition: function(e) {
    if (!e) {
      var e = window.event;
    }
    if (e.pageX || e.pageY) {
      return new vector2d(e.pageX, e.pageY);
    } else if (e.clientX || e.clientY) {
      return new vector2d(e.clientX, e.clientY);
    }

  },
  // loop drawing
  run: function() {
    var ctx = document.getElementById('water').getContext('2d');
    watereff.pond.update();
    watereff.pond.draw(ctx);
    fps++;
  },

  startRecording: function() {
    if (!recording) {
      recording = true;
      recordStartTime = new Date();
    }
  },

  stopRecording: function() {
    if (recording) {
      recording = false;
      watereff.renderRecording();
      watereff.addToSavedRecordings();
      clickList = [];
      recordStartTime = "";
    }
  },

  addToSavedRecordings: function() {
    recordingIndex++;
    savedRecordings.push({ recordingIndex, clickList })
  },

  renderRecording: function() {
    var container = document.getElementById('records-container');
    var currentTime = new Date().toTimeString();
    var listSize = clickList.length;

    const recordingHTML = `
      <div id=${recordingIndex} class="item d-flex text-muted pt-3">
        <svg class="bd-placeholder-img flex-shrink-0 me-2 rounded" width="32" height="32"
          xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Placeholder: 32x32"
          preserveAspectRatio="xMidYMid slice" focusable="false">
          <title>Placeholder</title>
          <rect width="100%" height="100%" fill="#007bff" /><text x="50%" y="50%" fill="#007bff" dy=".3em">32x32</text>
        </svg>

        <div class="pb-3 mb-0 small lh-sm border-bottom w-100">
          <div class="d-flex justify-content-between">
            <strong class="text-gray-dark">${currentTime}</strong>
            <a href="#water" onclick="watereff.replayRecording(${recordingIndex})" >Play</a>
          </div>
          <span class="d-block">${listSize} clicks</span>
        </div>
      </div>`;
    container.insertAdjacentHTML('beforeend', recordingHTML);

  },

  saveClickData: function(mouse) {
    var timePassed = new Date() - recordStartTime;
    var clickData = {
      mouse,
      timePassed
    };
    clickList.push(clickData);
  },
  playAnimation: function(mouse) {
    watereff.pond.buffer1[mouse.y * watereff.pond.x + mouse.x] += 200;
  },
  replayRecording: function(index) {
    list = savedRecordings[index].clickList;
    list.forEach((click) => {
      setTimeout(watereff.playAnimation, click.timePassed, click.mouse);
    })

  }
}

window.onload = function() {
  watereff.init();
}
