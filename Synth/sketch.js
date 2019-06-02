let reverb;
let polySynth;
let backColor = 255;
let currentTime = 0;
let tempTime;
let currentPitch = 400;
let compose = true;
let maxPitch = 800;
let minPitch = 100;
let interval = 2;
let targetTime = currentTime + interval;
let tuning = false;

let targetPitch = currentPitch;
let tuneInc = 0;

let even = 0;

let melodySynth;
let harmonySynth;
let fundSynth;
let delay;
let loudness;
let loudnessMax = .7;

let video;
let prevFrame;
let threshold = 20;
let changeCoefficient = 0;
let arrayLength = 90
let prevChanges = new Array(arrayLength);

function setup() {
  let cnv = createCanvas(640, 360);
  audioSetup();
  videoSetup();
}

function audioSetup() {
  amplitude = new p5.Amplitude();
  reverb = new p5.Reverb();

  melodySynth = new p5.Oscillator();
  melodySynth.setType("sine");
  melodySynth.freq(currentPitch);
  melodySynth.amp(.2);
  melodySynth.start();

  harmonySynth = new p5.Oscillator();
  harmonySynth.setType("sine");
  harmonySynth.freq(currentPitch * 1.5);
  harmonySynth.amp(.2);
  harmonySynth.start();

  fundSynth = new p5.Oscillator();
  fundSynth.setType("sine");
  fundSynth.freq(minPitch);
  fundSynth.amp(.1);
  fundSynth.start();


  // 3 second reverbTime, decayRate of 2%
  // reverb.process(fundSynth, 3, 1);
  reverb.process(melodySynth, 3, 1);

  delay = new p5.Delay();
  // source, delayTime, feedback, filter frequency
  delay.process(melodySynth, .9, .8, 2000);
}

function videoSetup() {
  //pixelDensity(1);
  video = createCapture(VIDEO);
  video.size(640, 360);
  video.hide();
  prevFrame = createImage(video.width, video.height);
  ellipseMode(CENTER);
  fill(255, 0, 255);
  prevChanges.fill(0, 0);
}

function draw() {
  background(255);
  let vol = getMasterVolume();
  let level = amplitude.getLevel();
  let size = map(level, 0, 1, 0, 500);
  fill(0, 255, 255);
  //ellipse(width / 2, height / 2, size, size);
  // loudness = map(mouseX, 0, width, 0., .5);
  // delay.process(melodySynth, .1, .9, 50);

  videoProcessing();
  averageChanges()
  composer();
  timer();
  tuner();
  synths();
}

function timer() {
  if (tempTime != second()) {
    // console.log("time: "+currentTime);
    if (currentTime == targetTime) {
      interval = floor(random(7)) + 3;
      targetTime = currentTime + interval;
    }
    currentTime++;
    tempTime = second();
  }
  if (currentTime % interval != 0) {
    compose = true;
  }
}

function composer() {
  if (tempTime != second()) {
    if (compose && currentTime % interval == 0) {
      if (even) {
        currentPitch = int(currentPitch);
        currentPitch = targetPitch;
        let factor = (random(5) + 4) / 6; //  2/3 below to 3/2 above (5th)
        targetPitch = int(factor * currentPitch);
        if (targetPitch > maxPitch) {
          targetPitch = maxPitch;
        }
        if (targetPitch < minPitch) {
          targetPitch = minPitch;
        }
        let pitchChange = targetPitch - currentPitch;
        tuneInc = pitchChange / (interval * frameRate());
        compose = false;
      }
      even++;
      even = even % 2;

    }
  }
}

function tuner() {
  if (currentPitch == targetPitch || abs(currentPitch - targetPitch) < abs(tuneInc)) {
    tuning = false;
  } else {
    tuning = true;
  }
  if (tuning) {
    currentPitch += tuneInc;
  }
}

function synths() {
  melodySynth.freq(currentPitch);
  melodySynth.amp(loudness);

  let harmSynthVol = loudness * ((sin(frameCount / 200)));
  if (harmSynthVol < 0) {
    harmSynthVol = 0;
  }
  harmonySynth.freq(currentPitch * 1.5);
  harmonySynth.amp(harmSynthVol);

  let fundVolume = ((sin(frameCount / 200) / 10));
  fundSynth.amp(fundVolume);
  let fundPitch = ((sin(frameCount / 600) * 20) + minPitch);
  fundSynth.freq(fundPitch);
}

function distSq(x1, y1, z1, x2, y2, z2) {
  let dist = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) + (z1 - z2) * (z1 - z2);
  return dist;
}

function videoProcessing() {
  changeCoefficient = 0;
  loadPixels();
  video.loadPixels();
  prevFrame.loadPixels();
  for (var x = 0; x < video.width; x++) {
    for (var y = 0; y < video.height; y++) {
      var loc = (x + y * video.width) * 4;

      var r1 = prevFrame.pixels[loc];
      var g1 = prevFrame.pixels[loc + 1];
      var b1 = prevFrame.pixels[loc + 2];

      var r2 = video.pixels[loc];
      var g2 = video.pixels[loc + 1];
      var b2 = video.pixels[loc + 2];

      var diff = distSq(r1, g1, b1, r2, g2, b2);
      if (diff > threshold * threshold) {
        changeCoefficient++;
      }
    }
  }
  updatePixels();
  // Save frame for the next cycle
  if (video.canvas) {
    prevFrame.copy(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height); // Before we read the new frame, we always save the previous frame for comparison!
  }

}

function averageChanges() {
  prevChanges.push(changeCoefficient);
  if (prevChanges.length > arrayLength) {
    prevChanges.shift();
  }
  let sum = prevChanges.reduce((previous, current) => current += previous);
  let avg = sum / prevChanges.length;
  let size = map(avg, 0, 6000, 0, 100);
  loudness = map(avg, 0, 6000, 0., loudnessMax);
  if (loudness > loudnessMax) {
    loudness = loudnessMax;
  }
  ellipse(width / 2, height / 2, size, size);
}
