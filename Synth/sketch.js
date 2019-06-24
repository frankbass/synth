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
let running = false;

let targetPitch = currentPitch;
let tuneInc = 0;

let even = 0;

let melodySynth;
let harmonySynth;
let fundSynth;
let delay;
let controlSignal;
let controlSignalMax = .7;

let amFMsynth;
let amFMharm;
let amFMfund = 200;

let video;
let prevFrame;
let threshold = 50;
let changeCoefficient = 0;
let arrayLength = 90
let prevChanges = new Array(arrayLength);

let pinkNoise, filtering;

let chapter = 0;
let lastChap = chapter;
let chapName;
let maxChapter = 32;
let timeStamps = new Array(maxChapter);

let tempFrCo;

let synthVol = 0;
let waveVol = 0;
// let waveCounter = 0;
let amFMsynthVol = 0;

let twitch;
let twitchVol = 0;

let sectionLength = 225;


function preload() {
  soundFormats('wav');
  twitch = loadSound('twitch.wav');
}

function setup() {
  let cnv = createCanvas(640, 360);
  tempFrCo = frameCount;

  for (let i = 0; i < maxChapter; i++) {
    timeStamps[i] = sectionLength * i;
  }

  chapters();
  synthSetup();
  noiseSetup();
  loopSetup();
  revDelay();
  videoSetup();
  textSize(32);
  fadeInOut();
}

function synthSetup() {
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

  amFMsynth = new p5.Oscillator();
  amFMsynth.setType("sine");
  amFMsynth.freq(amFMfund);
  amFMsynth.start();
  amFMsynth.pan(-1);

  amFMharm = new p5.Oscillator();
  amFMharm.setType("sine");
  amFMharm.freq(amFMfund);
  amFMharm.start();
  amFMharm.pan(1);
}

function loopSetup() {
  twitch.play();
  twitch.setVolume(twitchVol);
  twitch.loop();
}

function revDelay() {
  // 3 second reverbTime, decayRate of 2%
  // reverb.process(fundSynth, 3, 1);
  reverb.process(melodySynth, 3, 1);
  reverb.process(filtering, 3, 2);
  reverb.process(twitch, 5, 1);

  delay = new p5.Delay();
  // source, delayTime, feedback, filter frequency
  delay.process(melodySynth, .8, .8, 2000);
  delay.process(filtering, .6, .2, 2000);
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
  background(0);

  // let vol = getMasterVolume();
  let level = amplitude.getLevel();
  let size = map(level, 0, 1, 0, 500);

  screenText();
  videoProcessing();
  averageChanges()
  composer();
  timer();
  chapters();
  tuner();
  synths();
  amFMmodulation();
  waves();
  twitchLoop();
  // voiceSelecter();
  if ((tempFrCo == frameCount) || (tempFrCo + 120) > (frameCount)) {
    fadeInOut();
  }
}

// function voiceSelecter() {
//   if (chapName === "A") {
//     tuner();
//     synths();
//   }
//   if (chapName === "B") {
//     amFMmodulation();
//   }
//   if (chapName === "C") {
//     waves();
//   }
//
// }

function screenText() {
  let secs = currentTime % 60;
  secs = nf(secs, 2, 0);
  let mins = currentTime / 60;
  mins = floor(mins);
  mins = nf(mins, 2, 0);
  // let hrs = currentTime / 360;
  // hrs = floor(hrs);
  // hrs = nf(hrs, 2, 0);
  fill(255, 255, 0);
  text(chapName, 50, 50);
  // text(hrs +":"+mins + ":"+ secs, 50, 80);
  text(mins + ":" + secs, 50, 80);
}

function timer() {
  if (running) {
    if (tempTime != second()) {
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

  let melSynthVol = controlSignal;

  // let melSynthVol = 1;
  melSynthVol = melSynthVol * synthVol;
  melodySynth.freq(currentPitch);
  melodySynth.amp(melSynthVol);

  let harmSynthVol = controlSignal * ((sin(frameCount / 200)));
  harmSynthVol = harmSynthVol * synthVol;
  if (harmSynthVol < 0) {
    harmSynthVol = 0;
  }
  harmonySynth.freq(currentPitch * 1.5);
  harmonySynth.amp(harmSynthVol);

  let fundVolume = ((sin(frameCount / 200) / 10));
  fundVolume = fundVolume * synthVol;
  fundSynth.amp(fundVolume);
  let fundPitch = ((sin(frameCount / 600) * 20) + minPitch);
  fundSynth.freq(fundPitch);

  let x = map(currentPitch, minPitch, maxPitch, 0, width);
  let y = map(fundPitch, minPitch - 20, minPitch + 20, 0, height);
  let ySize = map(fundVolume, -.1, .1, 2, 30);

  fill(255, 0, 0);
  ellipse(x, y, ySize, ySize);
}

function amFMmodulation() {

  let fm = sin(frameCount / (200 * PI)); // ~ 0.1 Hz
  fm = (fm * 2) + amFMfund; // fund ± 2
  amFMsynth.freq(fm);

  let fastAm = sin(frameCount / (20 * PI)); // ~ 1 Hz
  fastAm = (fastAm * 2) + 3; // ~ 1 => 5
  fastAm = sin((frameCount * fastAm) / (2 * PI));
  let slowAM = sin(frameCount / (200 * PI));
  slowAm = slowAM / 2;
  slowAM = slowAM + 1; // ~ .5 => 1.5
  let product = amFMsynthVol * fastAm * slowAM;
  amFMsynth.amp(product, .1);
  amFMharm.amp(product, .1);

}

function waves() {
  let x = (sin(frameCount / 100) + 1) / 2;
  // let x = (sin(waveCounter / 1000000) + 1) / 2;
  x = x * width;
  let freq = map(x, 0, width, 100, 500);
  filtering.freq(freq);

  let y = (cos(frameCount / 300) + 1) / 2;
  // let y = (cos(waveCounter / 3000000) + 1) / 2;
  y = y * height;
  let resonance = map(y, 0, height, 0.1, 5);
  filtering.res(resonance);

  let z = controlSignal;
  // let z = 1;
  let dia = (z + .1) * 30;
  let squareAmp = squareWave2();
  z = z * waveVol * squareAmp;

  pinkNoise.amp(z + 0, 0);

  let panning;
  if (chapter == 2) {
    panning = squareWave();
  } else {
    panning = 0;
  }
  pinkNoise.pan(panning)
  fill(0, 255, 255);
  ellipse(x, y, dia, dia);
}

function twitchLoop() {
  let onOff;
  let tempLoopVol;
  let leftRight;
  if (frameCount % 15 == 0) {
    onOff = random();
    if (onOff > .5) {
      onOff = 1;
    } else {
      onOff = 0;
    }
    leftRight = random();
    if (leftRight > .5) {
      leftRight = 1;
    } else {
      leftRight = -1;
    }
    tempLoopVol = twitchVol * onOff;
    twitch.pan(leftRight);
  }
  twitch.setVolume(tempLoopVol);
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
        // waveCounter++;
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
  controlSignal = map(avg, 0, 6000, 0., controlSignalMax);
  if (controlSignal > controlSignalMax) {
    controlSignal = controlSignalMax;
  }
  circle(avg);
}

function circle(avg) {
  let size = map(avg, 0, 6000, 0, 100);
  let maxSize = 200;
  if (size > maxSize) {
    size = maxSize;
  }
  fill(255, 0, 255);
  ellipse(width / 2, height / 2, size, size);
}

function noiseSetup() {
  filtering = new p5.BandPass();
  pinkNoise = new p5.Noise();
  pinkNoise.disconnect();
  pinkNoise.connect(filtering);
  pinkNoise.start();
  pinkNoise.amp(waveVol, 0.2);
}

function squareWave() {
  let slope = 0;
  // let speed = sin(currentTime) + 1;
  // speed = speed * 20;
  // let zeroOne = sin(frameCount / speed);
  let zeroOne = sin(frameCount / 10);

  if (zeroOne > slope) {
    zeroOne = 1;
  } else {
    zeroOne = -1;

  }
  return zeroOne;
} // output -1 1

function squareWave2() {
  let slope = 0;
  // let speed = sin(currentTime) + 1;
  // speed = speed * 5;
  // let zeroOne = sin(frameCount / speed);
  let zeroOne = sin(frameCount / 5);

  if (zeroOne > slope) {
    zeroOne = 1;

  } else {
    zeroOne = 0;

  }
  return zeroOne;
} // output 0 1

function fadeInOut() {
  if (!running) {
    synthVol = synthVol - .01;
    if (synthVol < 0) {
      synthVol = 0;
    }
    waveVol = waveVol - .01;
    if (waveVol < 0) {
      waveVol = 0;
    }
    amFMsynthVol = amFMsynthVol - .01;
    if (amFMsynthVol < 0) {
      amFMsynthVol = 0;
    }
    twitchVol = twitchVol - .01;
    if (twitchVol < 0) {
      twitchVol = 0;
    }
  } else {
    if (chapName === "A") {
      synthVol = synthVol + .01;
      waveVol = waveVol - .01;
      if (synthVol > 1) {
        synthVol = 1;
      }
      if (waveVol < 0) {
        waveVol = 0;
      }
      amFMsynthVol = amFMsynthVol - .01;
      if (amFMsynthVol < 0) {
        amFMsynthVol = 0;
      }
      twitchVol = twitchVol - .01;
      if (twitchVol < 0) {
        twitchVol = 0;
      }
    }
    if (chapName === "B") {
      amFMsynthVol = amFMsynthVol + .01;
      if (amFMsynthVol > 1) {
        amFMsynthVol = 1;
      }
      synthVol = synthVol - .01;

      if (synthVol < 0) {
        synthVol = 0;
      }
      waveVol = waveVol - .01;
      if (waveVol < 0) {
        waveVol = 0;
      }
      twitchVol = twitchVol - .01;
      if (twitchVol < 0) {
        twitchVol = 0;
      }
    }
    if (chapName === "C") {
      synthVol = synthVol - .01;
      if (synthVol < 0) {
        synthVol = 0;
      }
      waveVol = waveVol + .01;
      if (waveVol > 1) {
        waveVol = 1;
      }
      amFMsynthVol = amFMsynthVol - .01;
      if (amFMsynthVol < 0) {
        amFMsynthVol = 0;
      }
      twitchVol = twitchVol - .01;
      if (twitchVol < 0) {
        twitchVol = 0;
      }
    }
    if (chapName === "D") {
      synthVol = synthVol - .01;
      if (synthVol < 0) {
        synthVol = 0;
      }
      waveVol = waveVol - .01;
      if (waveVol < 0) {
        waveVol = 0;
      }
      amFMsynthVol = amFMsynthVol - .01;
      if (amFMsynthVol < 0) {
        amFMsynthVol = 0;
      }
      twitchVol = twitchVol + .01;
      if (twitchVol > 1) {
        twitchVol = 1;
      }
    }
    if (chapName === "E") {
      synthVol = synthVol - .01;
      if (synthVol < 0) {
        synthVol = 0;
      }
      waveVol = waveVol - .01;
      if (waveVol < 0) {
        waveVol = 0;
      }
      amFMsynthVol = amFMsynthVol - .01;
      if (amFMsynthVol < 0) {
        amFMsynthVol = 0;
      }
      twitchVol = twitchVol - .01;
      if (twitchVol < 0) {
        twitchVol = 0;
      }
    }

  }
}

// let timeStamp0 = 0;
// let timeStamp1 = 2;
// let timeStamp2 = 4;
// let timeStamp3 = 6;
// let timeStamp4 = 8;
// let timeStamp5 = 10;
// let timeStamp6 = 1000;
// let timeStamp7 = 2000;
// let timeStamp8 = 2100;
// let timeStamp9 = 2400;
// let timeStamp10 = 2700;
// let timeStamp11 = 2925;
// let timeStamp12 = 3150;
// let timeStamp13 = 3375;
// let timeStamp14 = 3600;



function keyPressed() {
  let placeholder;
  if (keyCode == 32) { //32 == space
    if (!running) {
      running = true;
    } else {
      running = false;
    }
  }
  tempFrCo = frameCount;

  // if (keyCode >= 49 && keyCode <= 57) {
  //
  // }


  if (keyIsDown(16)) { //shift
    // keyCode 49 = 1, 50 = 2...
    if (keyCode >= 49 && keyCode <= 57) {
      placeholder = keyCode - 49;
      placeholder = (placeholder * 2) + 1;
      currentTime = timeStamps[placeholder];

    }
  } else {
    if (keyCode >= 49 && keyCode <= 57) {
      placeholder = keyCode - 49;
      placeholder = placeholder * 2;
      currentTime = timeStamps[placeholder];

    }

    // if (keyIsDown(16)) {
    // if (keyCode == 49) { //1
    //   currentTime = timeStamp0;
    // }
    // if (keyCode == 50) { //2
    //   currentTime = timeStamp2;
    // }
    // if (keyCode == 51) {
    //   currentTime = timeStamp4;
    // }
    // if (keyCode == 52) {
    //   currentTime = timeStamp6;
    // }
    // if (keyCode == 53) {
    //   currentTime = timeStamp8;
    // }
    // if (keyCode == 54) {
    //   currentTime = timeStamp10;
    // }
    // if (keyCode == 55) {
    //   currentTime = timeStamp12;
    // }

    // } else {

    // if (keyCode == 49) { //1
    //   currentTime = timeStamp0;
    // }
    // if (keyCode == 50) { //2
    //   currentTime = timeStamp2;
    // }
    // if (keyCode == 51) {
    //   currentTime = timeStamp4;
    // }
    // if (keyCode == 52) {
    //   currentTime = timeStamp6;
    // }
    // if (keyCode == 53) {
    //   currentTime = timeStamp8;
    // }
    // if (keyCode == 54) {
    //   currentTime = timeStamp10;
    // }
    // if (keyCode == 55) {
    //   currentTime = timeStamp12;
    // }
    // }



  }
}

function chapters() {

  if (currentTime % sectionLength == 0) {
    chapter = floor(currentTime / sectionLength);


  }
  // if (currentTime >= timeStamps[0] && currentTime < timeStamps[1]) {
  //   chapter = 0;
  // }
  // if (currentTime >= timeStamps[1] && currentTime < timeStamps[2]) {
  //   chapter = 1;
  // }
  // if (currentTime >= timeStamps[2] && currentTime < timeStamps[3]) {
  //   chapter = 2;
  // }
  // if (currentTime >= timeStamps[3] && currentTime < timeStamps[4]) {
  //   chapter = 3;
  // }
  // if (currentTime >= timeStamps[4] && currentTime < timeStamps[5]) {
  //   chapter = 4;
  // }
  // if (currentTime >= timeStamps[1] && currentTime < timeStamps[2]) {
  //   chapter = 5;
  // }
  // if (currentTime >= timeStamps[1] && currentTime < timeStamps[2]) {
  //   chapter = 6;
  // }
  // if (currentTime >= timeStamps[1] && currentTime < timeStamps[2]) {
  //   chapter = 7;
  // }
  // if (currentTime >= timeStamps[1] && currentTime < timeStamps[2]) {
  //   chapter = 8;
  // }
  // if (currentTime >= timeStamps[1] && currentTime < timeStamps[2]) {
  //   chapter = 9;
  // }
  // if (currentTime >= timeStamps[1] && currentTime < timeStamps[2]) {
  //   chapter = 10;
  // }
  // if (currentTime >= timeStamps[1] && currentTime < timeStamps[2]) {
  //   chapter = 11;
  // }
  // if (currentTime >= timeStamps[1] && currentTime < timeStamps[2]) {
  //   chapter = 12;
  // }
  // if (currentTime >= timeStamps[1] && currentTime < timeStamps[2]) {
  //   chapter = 13;
  // }
  if (lastChap != chapter) {
    tempFrCo = frameCount;
  }
  lastChap = chapter;

  switch (chapter) {
    case 0:
      chapName = "A";
      break;
    case 1:
      chapName = "B";
      break;
    case 2:
      chapName = "A";
      break;
    case 3:
      chapName = "B";
      break;
    case 4:
      chapName = "C";
      break;
    case 5:
      chapName = "D";
      break;
    case 6:
      chapName = "C";
      break;
    case 7:
      chapName = "D";
      break;
    case 8:
      chapName = "E";
      break;
    case 9:
      chapName = "C";
      break;
    case 10:
      chapName = "D";
      break;
    case 11:
      chapName = "A";
      break;
    case 12:
      chapName = "B";
      break;
    case 13:
      chapName = "A";
      break;
    case 14:
      chapName = "B";
      break;
    case 15:
      chapName = "B";
      break;
  }
}
