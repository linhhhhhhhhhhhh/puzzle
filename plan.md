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

### Step 1: Set up the project scaffold
Create an `index.html` that loads p5.js 2.x, the p5-phone library, and `sketch.js`. In `sketch.js`, create a full-screen canvas, call `lockGestures()`, set `angleMode(DEGREES)`, and call `enableGyroTap()` with a message like "Tap to enable motion". Show a waiting message until `window.sensorsEnabled` is true.

### Step 2: Draw the flower image
Draw a simple flower graphic (petals, center, stem) on an offscreen buffer using p5 drawing functions. This is the image that will be divided into puzzle fragments. The flower should be centered and large enough to fill most of the canvas.

### Step 3: Define the 4 puzzle shapes and their target angles
Define 4 shapes: a triangle, a circle, a square, and a rectangle. Assign each shape a target angle (the correct rotation that aligns it with the rest of the flower). These target angles should be different for each shape.

### Step 4: Extract each shape's fragment of the flower image
For each of the 4 shapes, use the shape as a clip mask to extract its corresponding fragment from the flower image buffer. Each shape-fragment should be stored as a separate graphic that can be rotated independently.

### Step 5: Draw the 4 shape-fragments in a circle at random starting angles
Draw the 4 shape-fragments arranged in a circle (e.g., at 12, 3, 6, and 9 o'clock positions). Each shape starts at a random angle (different from its target angle). The fragments should not form a coherent image at the start.

### Step 6: Implement tap-to-select
When the user taps (or clicks) a shape, select it. Show a pulsing colored border around the selected shape. Only one shape can be selected at a time. Tapping a different shape switches the selection. Tapping a locked shape does nothing.

### Step 7: Read rotation input from phone and laptop
Read `rotationZ` on phone (after `sensorsEnabled` is true). On laptop, track mouse X movement (delta from previous frame) as a fallback rotation input. The rotation input should be smoothed or mapped to a reasonable range so the shape doesn't spin too fast.

### Step 8: Rotate the selected shape on screen in real-time
As the user twists the phone (or moves the mouse), rotate the selected shape on screen in real-time. The shape should spin smoothly in response to the rotation input. Locked shapes do not rotate.

### Step 9: Detect when the selected shape reaches its target angle
Check if the selected shape's current angle is within 10–15 degrees of its target angle. If so, the shape is "locked" — snap it to the exact target angle with a quick animation.

### Step 10: Play a lock sound effect
When a shape locks, play a short sound effect (a click, chime, or tone) using p5.sound's `p5.Oscillator`. The sound should be satisfying and distinct.

### Step 11: Mark the shape as locked permanently
Once a shape is locked, it stays locked regardless of further phone rotation. It should look visually distinct (e.g., no pulsing border, maybe a subtle glow or different appearance). The user can then select the next shape.

### Step 12: Check for win condition
After each lock, check if all 4 shapes are locked. If so, trigger the celebration sequence.

### Step 13: Create the blooming animation and "Well Done!" message
Animate the flower blooming — the 4 locked shapes could scale slightly, move toward the center, or a full flower image fades in on top. Display "Well Done!" text prominently on screen. The animation should feel like a reward.

### Step 14: Test on laptop, then on phone
Test the full flow on a laptop with mouse controls. Then test on a phone: tap to enable motion, twist to rotate shapes, lock all 4, see the bloom animation. Adjust angles, timing, and sensitivity as needed.

## Changes
<!-- One line each time you change this plan, and why. -->
