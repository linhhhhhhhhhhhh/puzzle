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
let prevRotationZ = 0;
let lockAnimFrames = 0; // frames remaining for lock snap animation
let puzzleSolved = false;
let celebrationFrame = 0;

const NUM_SHAPES = 4;
const LOCK_TOLERANCE = 6; // degrees

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
  let maxR = min(flowerBuffer.width, flowerBuffer.height) * 0.42;

  // Concentric circle rings (bullseye target pattern)
  let colors = [
    [220, 60, 60],    // red
    [255, 255, 255],  // white
    [60, 120, 200],   // blue
    [255, 255, 255],  // white
    [240, 180, 40],   // yellow
    [255, 255, 255],  // white
    [80, 180, 80],    // green
  ];

  for (let i = 0; i < colors.length; i++) {
    let r = maxR * (1 - i / colors.length);
    flowerBuffer.fill(colors[i][0], colors[i][1], colors[i][2]);
    flowerBuffer.circle(cx, cy, r * 2);
  }

  // Center dot
  flowerBuffer.fill(220, 60, 60);
  flowerBuffer.circle(cx, cy, maxR * 0.15);

  flowerBuffer.pop();
}

// ── Step 3: Define shapes and target angles ────────────────────

function initShapes() {
  let cx = width / 2;
  let cy = height / 2;
  let radius = min(width, height) * 0.22;
  let shapeSize = min(width, height) * 0.18;

  // 4 shapes at 12, 3, 6, 9 o'clock
  for (let i = 0; i < NUM_SHAPES; i++) {
    let angle = i * 90 - 90; // start at top, go clockwise
    let px = cx + cos(angle) * radius;
    let py = cy + sin(angle) * radius;

    shapePositions.push({ x: px, y: py });
    shapeTargetAngles.push(0); // all shapes align at 0 degrees for the bullseye
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
      // Phone: use rotationZ delta from previous frame (handle 0/360 wrap)
      let currentZ = rotationZ;
      rotationDelta = currentZ - prevRotationZ;
      // Handle wrap-around
      if (rotationDelta > 180) rotationDelta -= 360;
      if (rotationDelta < -180) rotationDelta += 360;
      prevRotationZ = currentZ;
    } else {
      rotationDelta = 0;
    }
    shapeCurrentAngles[selectedShape] += rotationDelta;

    // Step 9: Check if selected shape is within tolerance of target angle
    let currentAngle = shapeCurrentAngles[selectedShape];
    let targetAngle = shapeTargetAngles[selectedShape];
    let angleDiff = abs(currentAngle - targetAngle);
    // Handle 0/360 wrap-around
    if (angleDiff > 180) angleDiff = 360 - angleDiff;
    if (angleDiff <= LOCK_TOLERANCE) {
      // Lock the shape!
      shapeLocked[selectedShape] = true;
      shapeCurrentAngles[selectedShape] = targetAngle;
      selectedShape = -1;
      lockAnimFrames = 15; // frames for snap animation
      playLockSound();

      // Step 12: Check for win condition
      if (shapeLocked.every(l => l)) {
        puzzleSolved = true;
        celebrationFrame = 0;
      }
    }
  }

  // Step 12: Check for win condition
  if (puzzleSolved) {
    celebrationFrame++;
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

    // Step 13a: Bloom animation — scale up slightly when solved
    if (puzzleSolved) {
      let scale = 1 + sin(celebrationFrame * 0.05) * 0.1;
      scale(scale);
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

  // Step 13b: Display "Well Done!" text
  if (puzzleSolved && celebrationFrame > 60) {
    fill(255, 215, 0);
    textAlign(CENTER, CENTER);
    textSize(min(width, height) * 0.08);
    textStyle(BOLD);
    text('Well Done!', width / 2, height / 2);
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

// ── Step 10: Play a lock sound effect ──────────────────────────

function playLockSound() {
  if (!window.soundEnabled) return;
  let osc = new p5.Oscillator('sine');
  osc.freq(880);
  osc.amp(0.3);
  osc.start();
  osc.stop(0.15);
}
