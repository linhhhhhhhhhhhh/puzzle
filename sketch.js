// Rotation-Lock Flower Puzzle
// Step 1a: Set up the project scaffold
// Step 1b: Implement a Screen Wake Lock

let wakeLock = null;
let wantAwake = false;
let flowerBuffer;

function setup() {
  createCanvas(windowWidth, windowHeight);
  lockGestures();
  angleMode(DEGREES);
  enablePermissionsTap(['gyro', 'sound'], 'Tap to enable motion and sound');
  showDesktopQr();

  // The browser drops the wake lock while the page is hidden. Ask again when it's back.
  document.addEventListener('visibilitychange', () => {
    if (wantAwake && document.visibilityState === 'visible') requestWakeLock();
  });

  // Step 2: Draw the flower image on an offscreen buffer
  flowerBuffer = createGraphics(width, height);
  drawFlower();
}

function drawFlower() {
  flowerBuffer.push();
  flowerBuffer.background(240, 240, 250);
  flowerBuffer.noStroke();

  let cx = flowerBuffer.width / 2;
  let cy = flowerBuffer.height / 2;
  let flowerR = min(flowerBuffer.width, flowerBuffer.height) * 0.38;

  // Stem
  flowerBuffer.fill(60, 160, 80);
  flowerBuffer.rect(cx - flowerR * 0.06, cy + flowerR * 0.5, flowerR * 0.12, flowerR * 0.8);

  // Petals
  flowerBuffer.fill(255, 120, 150);
  for (let i = 0; i < 8; i++) {
    let a = i * 45;
    let px = cx + cos(a) * flowerR * 0.75;
    let py = cy + sin(a) * flowerR * 0.75;
    flowerBuffer.push();
    flowerBuffer.translate(px, py);
    flowerBuffer.rotate(a + 90);
    flowerBuffer.ellipse(0, 0, flowerR * 0.35, flowerR * 0.6);
    flowerBuffer.pop();
  }

  // Center
  flowerBuffer.fill(255, 210, 60);
  flowerBuffer.circle(cx, cy, flowerR * 0.5);

  flowerBuffer.pop();
}

function draw() {
  image(flowerBuffer, 0, 0);

  if (!window.sensorsEnabled) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(20);
    text('Waiting for sensors...', width / 2, height / 2);
  }
}

function mouseReleased() {
  // Request wake lock from mouseReleased (iOS needs a user gesture, and a touch only counts when the finger lifts)
  const awake = wakeLock !== null && !wakeLock.released;
  if ('wakeLock' in navigator && !awake) {
    wantAwake = true;
    requestWakeLock();
  }
  return false;
}

function mousePressed() {
  return false;
}

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch (err) {
    console.warn('Wake lock refused: ' + err.message);
  }
}

function userSetupComplete() {
  console.log('Permissions ready');
}
