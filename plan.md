# Plan: Rotation-Lock Flower Puzzle

## Project
Phone as a combination-lock dial, to solve a jigsaw puzzle by rotating shapes to the correct angle, for a design class project.

## The question
Can a phone's rotation sensor (twisting flat on a table) be used as an intuitive dial mechanism to solve a jigsaw puzzle, where each piece must be rotated to a specific angle to complete a larger flower image?

## The experience
The user places their phone flat on a table. They see 4 shapes (triangle, circle, square, rectangle) arranged in a circle, each displaying a fragment of a flower image. They tap a shape to select it — a pulsing colored border appears around it. As they twist the phone on the table, the selected shape rotates on screen in real-time. When the shape reaches its correct angle, it snaps into place with a sound and locks permanently. The user repeats this for all 4 shapes in any order. When all 4 are locked, the flower blooms with a celebration animation and "Well Done!" appears. The user refreshes the page to play again with new random starting angles.

## Input, transformation, output, fallback
- Input: Phone rotation around the Z axis (rotationZ, 0–360 degrees) when the phone is flat on a table; mouse X movement on laptop
- Transformation: rotationZ maps to the selected shape's on-screen rotation angle; when the shape's angle is within 10–15 degrees of its target angle, it locks
- Output: The selected shape rotates on screen in real-time as the phone twists; on lock, a visual snap animation + sound effect; when all 4 shapes are locked, the flower blooms and "Well Done!" appears
- Fallback: On a laptop (no rotation sensor), mouse X movement controls the selected shape's rotation; the sketch is fully playable with mouse

## References
| File | Use it as | Take | Leave |
|---|---|---|---|
| IMG_6518.HEIC (sketch) | layout: match this | Two-state design (solved flower / unsolved scattered shapes), shapes arranged in a circle, tap-to-select then rotate-to-lock flow | The specific drawing style and paper texture |

## Limits
- Change only sketch.js
- Not now: Real flower image (using a code-drawn placeholder flower), cross-device/multi-phone support, vibration feedback, reset button (refresh instead)

## How I will check it
- On my laptop: I should see 4 shapes arranged in a circle, each with a fragment of the flower image. I can click a shape to select it (pulsing border), move the mouse left/right to rotate it, and the shape locks with a sound when I find the right angle. When all 4 are locked, the flower blooms and "Well Done!" appears.
- On my phone: Same experience, but I twist the phone flat on a table to rotate the selected shape. A "Tap to enable motion" button appears first. The same lock sound, bloom animation, and "Well Done!" message appear.

## Steps

### Step 1a: Set up the project scaffold
Create an `index.html` that loads p5.js 2.x, the p5.js-compatibility library, p5.sound, the p5-phone library, and `sketch.js` (in that order). In `sketch.js`, create a full-screen canvas, call `lockGestures()`, set `angleMode(DEGREES)`, and call `enablePermissionsTap(['gyro', 'sound'], 'Tap to enable motion and sound')` — this combines motion and sound permission in a single tap so both work. Call `showDesktopQr()` so a QR code appears on desktop for easy phone testing. Show a waiting message until `window.sensorsEnabled` is true. Define a `userSetupComplete()` callback for post-permission initialization. Serve the sketch over HTTPS or localhost — all mobile hardware requires a secure context.

### Step 1b: Implement a Screen Wake Lock
The puzzle is entirely motion-driven — only touches reset the phone's auto-lock timer, so the screen will dim after ~30 seconds. Implement a Screen Wake Lock: request it from `mouseReleased()` (iOS needs a user gesture, and a touch only counts when the finger lifts), re-request on `visibilitychange` (the lock is released when the page is hidden), wrap `request()` in `try`/`catch`, and check `wakeLock.released` rather than assuming the lock is held.

### Step 2: Draw the flower image
Draw a simple flower graphic (petals, center, stem) on an offscreen buffer using p5 drawing functions. This is the image that will be divided into puzzle fragments. The flower should be centered and large enough to fill most of the canvas.

### Step 3: Define the 4 puzzle shapes and their target angles
Define 4 shapes: a triangle, a circle, a square, and a rectangle. Assign each shape a target angle (the correct rotation that aligns it with the rest of the flower). These target angles should be different for each shape.

### Step 4a: Create offscreen buffers and draw each shape
For each of the 4 shapes, create an offscreen graphics buffer using `createGraphics()`. Draw the shape (triangle, circle, square, or rectangle) filled white on its buffer. These buffers will be used as masks to extract fragments from the flower image.

### Step 4b: Use each shape as a mask to extract flower fragments
For each shape, position it at its specific target location on the flower image (each shape maps to a distinct quadrant or region of the flower). Then use its buffer as a mask on the flower image to extract the corresponding fragment. Store each resulting shape-fragment as a separate graphic that can be rotated independently.

### Step 5: Draw the 4 shape-fragments in a circle at random starting angles
Draw the 4 shape-fragments arranged in a circle (e.g., at 12, 3, 6, and 9 o'clock positions). Each shape starts at a random angle (different from its target angle). The fragments should not form a coherent image at the start.

### Step 6: Implement tap-to-select
Use `mousePressed()` (the p5.js 2 unified pointer callback — fires for both mouse and touch) to detect taps. `return false` from `mousePressed()` so p5-phone's gesture handling manages the touch. When the user taps a shape, select it and show a pulsing colored border around it. Only one shape can be selected at a time. Tapping a different shape switches the selection. Tapping a locked shape does nothing. Tapping outside any shape deselects the current selection.

### Step 7a: Read rotation input from the phone
Read `rotationZ` (a p5.js built-in) after `window.sensorsEnabled` is true. This gives the phone's twist angle (0–360 degrees) when flat on a table. Map or scale the value so the shape rotates at a comfortable speed.

### Step 7b: Mouse fallback for laptop
On laptop (detect with `window.isDesktop`), `rotationZ` stays at 0. Instead, track mouse X movement (delta from previous frame) as the rotation input. Use the same mapping as the phone path so the sketch is fully playable with a mouse.

### Step 8: Rotate the selected shape on screen in real-time
As the user twists the phone (or moves the mouse), rotate the selected shape on screen in real-time. The shape should spin smoothly in response to the rotation input. Locked shapes do not rotate.

### Step 9: Detect when the selected shape reaches its target angle
Check if the selected shape's current angle is within 10–15 degrees of its target angle. Account for the 0/360 wrap-around: if the target is 5° and the current angle is 355°, the difference is 10° (not 350°). Use modular arithmetic to compute the shortest angular distance. If within tolerance, the shape is "locked" — snap it to the exact target angle with a quick animation.

### Step 10: Play a lock sound effect
When a shape locks, play a short sound effect (a click, chime, or tone) using p5.sound's `p5.Oscillator` (preferred over `loadSound()` for portability). The sound should be satisfying and distinct. Gate playback behind `window.soundEnabled` — if sound permission was denied, skip silently. Note: sound permission was already combined with gyro in Step 1a's `enablePermissionsTap(['gyro', 'sound'], ...)` call — do not make a second `enable*` call here, or it will remove the motion permission UI.

### Step 11: Mark the shape as locked permanently
Once a shape is locked, it stays locked regardless of further phone rotation. It should look visually distinct (e.g., no pulsing border, maybe a subtle glow or different appearance). The user can then select the next shape.

### Step 12: Check for win condition
After each lock, check if all 4 shapes are locked. If so, trigger the celebration sequence.

### Step 13a: Create the blooming animation
Animate the flower blooming — the 4 locked shapes could scale slightly, move toward the center, or a full flower image fades in on top. The animation should feel like a reward.

### Step 13b: Display "Well Done!" text
After the bloom animation, display "Well Done!" text prominently on screen. The text should be clear and celebratory.

### Step 14: Define the draw loop structure and no-shape state
Describe the frame-by-frame `draw()` order: (1) draw background, (2) draw all 4 shape-fragments at their current angles, (3) if a shape is selected, animate its pulsing border, (4) read rotation input and update the selected shape's angle, (5) check if the selected shape is within tolerance of its target angle — if so, lock it, (6) if all shapes are locked, run the celebration. When no shape is selected (before any tap, or after deselection), just draw the 4 shapes statically with a subtle prompt like "Tap a shape to begin". Do not read rotation input or check lock conditions when no shape is selected.

### Step 15: Test on laptop, then on phone
Test the full flow on a laptop with mouse controls. Then test on a phone: tap to enable motion, twist to rotate shapes, lock all 4, see the bloom animation. Adjust angles, timing, and sensitivity as needed.

## Changes
<!-- One line each time you change this plan, and why. -->
