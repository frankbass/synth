
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

function setup() {
  let cnv = createCanvas(300, 300);
  textAlign(CENTER);
  amplitude = new p5.Amplitude();
  reverb = new p5.Reverb();

  melodySynth = new p5.Oscillator();
  melodySynth.setType("sine");
  melodySynth.freq(currentPitch);
  melodySynth.amp(.2);
  melodySynth.start();

  harmonySynth = new p5.Oscillator();
  harmonySynth.setType("sine");
  harmonySynth.freq(currentPitch*1.5);
  harmonySynth.amp(.2);
  harmonySynth.start();

  fundSynth = new p5.Oscillator();
  fundSynth.setType("sine");
  fundSynth.freq(minPitch);
  fundSynth.amp(.1);
  fundSynth.start();

  // connect soundFile to reverb, process w/
  // 3 second reverbTime, decayRate of 2%
  reverb.process(fundSynth, 3, 1);
  reverb.process(melodySynth, 3, 1);

  delay = new p5.Delay();
  // source, delayTime, feedback, filter frequency
  // delay.process(melodySynth, map(mouseY,0,height, 0.,1.), .7, targetPitch);
}

function draw() {
  background(backColor);
  let vol = getMasterVolume();
  let level = amplitude.getLevel();
  let size = map(level, 0, 1, 0, 500);
  fill(255, 0, 255);
  ellipse(width / 2, height / 2, size, size);
  loudness = map(mouseX, 0, width, 0., .5);
  delay.process(melodySynth, .1, .9, 50);

  composer();
  timer();
  tuner();
  synths();
}

function timer() {
  if (tempTime != second()) {
    // console.log("time: "+currentTime);
    if (currentTime == targetTime) {
      interval = floor(random(7))+3;
      targetTime = currentTime + interval;
      // console.log("interval " +interval);
      // console.log("target "+ targetTime)
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
        // console.log("time " + currentTime + " curr " + currentPitch);
        let factor = (random(5) + 4) / 6; //  2/3 below to 3/2 above (5th)
        targetPitch = int(factor * currentPitch);
        if (targetPitch > maxPitch) {
          targetPitch = maxPitch;
        }
        if (targetPitch < minPitch) {
          targetPitch = minPitch;
        }
        // console.log("targetPitch " + targetPitch);
        let pitchChange = targetPitch - currentPitch;

        // console.log("pitchChange " + pitchChange);
        tuneInc = pitchChange / (interval * frameRate()); // 50 ~frameRate()
        // console.log("tuneInc " + tuneInc);
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
    // console.log("match " + currentPitch + ", " + targetPitch);
  } else {
    tuning = true;
  }
  if (tuning) {
    currentPitch += tuneInc;
    // console.log("tuning");
  }
}

function synths() {
  melodySynth.freq(currentPitch);
  melodySynth.amp(loudness);

  let harmSynthVol = loudness*((sin(frameCount/200)));
  if (harmSynthVol< 0) {
    harmSynthVol = 0;
  }
  harmonySynth.freq(currentPitch*1.5);
  harmonySynth.amp(harmSynthVol);



  let fundVolume = ((sin(frameCount/200)/10));
  fundSynth.amp(fundVolume);
  let fundPitch = ((sin(frameCount/600)* 20)+minPitch);
  fundSynth.freq(fundPitch);
}
