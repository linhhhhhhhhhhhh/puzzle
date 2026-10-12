// Rotation-Lock Flower Puzzle
// Step 1a: Set up the project scaffold
// Step 1b: Implement a Screen Wake Lock
// Step 2: Draw the flower image on an offscreen buffer
// Step 3: Define the 4 puzzle shapes and their target angles
// Step 4a: Create offscreen buffers and draw each shape
// Step 4b: Use each shape as a mask to extract flower fragments
// Step 5: Draw the 4 shape-fragments in a circle at random starting angles

let wakeLock = null;
let wantAwake = false;

let flowerBuffer;
let shapeFragments = [];
let shapePositions = [];
let shapeTargetAngles = [];
let shapeStartAngles = [];
let shapeCurrentAngles = [];
let shapeLocked = [];
let selectedShape = -1; // index of currently selected shape, -1 = none
let prevMouseX = 0;

const NUM_SHAPES = 4;
const LOCK_TOLERANCE = 12; // degrees

function setup() {
  createCanvas(windowWidth, windowHeight);
  lockGestures();
  angleMode(DEGREES);
  enablePermissionsTap(['gyro', 'sound'], 'Tap to enable motion and sound');
  showDesktopQr();

  document.addEventListener('visibilitychange', () => {
    if (wantAwake && document.visibilityState === 'visible') requestWakeLock();
  });

  flowerBuffer = createGraphics(width, height);
  drawFlower();
  initShapes();
  prevMouseX = mouseX;
}

// ── Step 2: Draw the flower image ──────────────────────────────

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

// ── Step 3: Define shapes and target angles ────────────────────

function initShapes() {
  let cx = width / 2;
  let cy = height / 2;
  let radius = min(width, height) * 0.32;
  let shapeSize = min(width, height) * 0.18;

  // 4 shapes at 12, 3, 6, 9 o'clock
  for (let i = 0; i < NUM_SHAPES; i++) {
    let angle = i * 90 - 90; // start at top, go clockwise
    let px = cx + cos(angle) * radius;
    let py = cy + sin(angle) * radius;

    shapePositions.push({ x: px, y: py });
    shapeTargetAngles.push(angle); // correct orientation faces outward
    shapeStartAngles.push(random(0, 360));
    shapeCurrentAngles.push(shapeStartAngles[i]);
    shapeLocked.push(false);

    // Step 4a: Create shape mask buffer (black bg, white shape)
    let maskBuf = createGraphics(shapeSize * 2, shapeSize * 2);
    maskBuf.push();
    maskBuf.background(0); // black background
    maskBuf.noStroke();
    maskBuf.fill(255); // white shape
    let scx = shapeSize;
    let scy = shapeSize;

    if (i === 0) {
      // Triangle
      maskBuf.triangle(scx, scy - shapeSize * 0.8, scx - shapeSize * 0.7, scy + shapeSize * 0.6, scx + shapeSize * 0.7, scy + shapeSize * 0.6);
    } else if (i === 1) {
      // Circle
      maskBuf.circle(scx, scy, shapeSize * 1.4);
    } else if (i === 2) {
      // Square
      maskBuf.rect(scx - shapeSize * 0.65, scy - shapeSize * 0.65, shapeSize * 1.3, shapeSize * 1.3);
    } else {
      // Hexagon
      maskBuf.beginShape();
      for (let j = 0; j < 6; j++) {
        let a = j * 60;
        let hx = scx + cos(a) * shapeSize * 0.75;
        let hy = scy + sin(a) * shapeSize * 0.75;
        maskBuf.vertex(hx, hy);
      }
      maskBuf.endShape(CLOSE);
    }
    maskBuf.pop();

    // Step 4b: Extract flower fragment using pixel-level masking
    // Draw the flower image offset so the shape's position on the flower is centered in the buffer
    let fragment = createGraphics(shapeSize * 2, shapeSize * 2);
    fragment.push();
    fragment.image(flowerBuffer, -px + scx, -py + scy, width, height);
    fragment.pop();

    // Apply mask: where mask is black (0), make fragment transparent
    fragment.loadPixels();
    maskBuf.loadPixels();
    for (let p = 0; p < fragment.pixels.length; p += 4) {
      if (maskBuf.pixels[p] === 0) {
        fragment.pixels[p + 3] = 0; // set alpha to 0 where mask is black
      }
    }
    fragment.updatePixels();

    shapeFragments.push(fragment);
  }
}

// ── Draw loop ──────────────────────────────────────────────────

function draw() {
  background(30);

  // Step 7a: Read rotation input from phone
  // Step 7b: Mouse fallback for laptop
  if (selectedShape >= 0 && !shapeLocked[selectedShape]) {
    let rotationDelta;
    if (window.isDesktop) {
      // Laptop: use mouse X movement delta
      rotationDelta = mouseX - prevMouseX;
      prevMouseX = mouseX;
    } else if (window.sensorsEnabled) {
      // Phone: use rotationZ delta (handle 0/360 wrap)
      let currentZ = rotationZ;
      let prevZ = shapeCurrentAngles[selectedShape];
      rotationDelta = currentZ - prevZ;
      // Handle wrap-around
      if (rotationDelta > 180) rotationDelta -= 360;
      if (rotationDelta < -180) rotationDelta += 360;
    } else {
      rotationDelta = 0;
    }
    shapeCurrentAngles[selectedShape] += rotationDelta;
  }

  // Draw shape fragments
  for (let i = 0; i < NUM_SHAPES; i++) {
    push();
    translate(shapePositions[i].x, shapePositions[i].y);
    if (shapeLocked[i]) {
      rotate(shapeTargetAngles[i]);
    } else {
      rotate(shapeCurrentAngles[i]);
    }
    image(shapeFragments[i], -shapeFragments[i].width / 2, -shapeFragments[i].height / 2);

    // Draw pulsing border on selected shape
    if (i === selectedShape && !shapeLocked[i]) {
      let pulse = (sin(frameCount * 0.1) + 1) * 0.5; // 0 to 1
      let shapeSize = min(width, height) * 0.18;
      noFill();
      stroke(255, 200, 0);
      strokeWeight(3 + pulse * 4);
      if (i === 0) {
        triangle(0, -shapeSize * 0.8, -shapeSize * 0.7, shapeSize * 0.6, shapeSize * 0.7, shapeSize * 0.6);
      } else if (i === 1) {
        circle(0, 0, shapeSize * 1.4);
      } else if (i === 2) {
        rect(-shapeSize * 0.65, -shapeSize * 0.65, shapeSize * 1.3, shapeSize * 1.3);
      } else {
        beginShape();
        for (let j = 0; j < 6; j++) {
          let a = j * 60;
          vertex(cos(a) * shapeSize * 0.75, sin(a) * shapeSize * 0.75);
        }
        endShape(CLOSE);
      }
    }
    pop();
  }

  if (!window.sensorsEnabled) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(20);
    text('Waiting for sensors...', width / 2, height / 2);
  }
}

// ── Input handlers ──────────────────────────────────────────────

function mouseReleased() {
  const awake = wakeLock !== null && !wakeLock.released;
  if ('wakeLock' in navigator && !awake) {
    wantAwake = true;
    requestWakeLock();
  }
  return false;
}

function mousePressed() {
  if (!window.sensorsEnabled) return false;

  // Check if tap is inside any shape
  for (let i = 0; i < NUM_SHAPES; i++) {
    if (shapeLocked[i]) continue; // can't select locked shapes
    let d = dist(mouseX, mouseY, shapePositions[i].x, shapePositions[i].y);
    let shapeSize = min(width, height) * 0.18;
    if (d < shapeSize) {
      selectedShape = i;
      return false;
    }
  }

  // Tapped outside any shape — deselect
  selectedShape = -1;
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
