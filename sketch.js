// Rotation-Lock Flower Puzzle
// Step 1a: Set up the project scaffold
// Step 1b: Implement a Screen Wake Lock

let wakeLock = null;
let wantAwake = false;

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
}

function draw() {
  background(30);

  if (window.sensorsEnabled) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(20);
    text('Sensors ready. Tap a shape to begin.', width / 2, height / 2);
  } else {
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
