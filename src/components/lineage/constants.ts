export const STORAGE_KEY = "lineage:run:v1";

export const PORTRAIT_SIZE = 96;
export const LABEL_HEIGHT = 30;
// In the past-pick "row" layout, the name lives in a fixed-width column on
// the left of the portrait and the term on the right. Both widths are equal
// so the portrait stays horizontally centered on the trail line at x=0.
export const SIDE_LABEL_WIDTH = 220;
export const PENTAGON_RADIUS = 170;
// Gap between the current active and the most recent past pick — stays
// generous so the active feels separate from the timeline above it.
export const TRAIL_SPACING = 370;
// Gap between consecutive past picks — tighter so the lineage reads as a
// compact timeline, not a sprawling chain.
export const TIGHT_SPACING = 160;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 1.0;
export const OUTLINE_THRESHOLD = 0.55;
export const CAMERA_PAN_MS = 420;
export const SHAKE_MS = 360;
export const FINAL_PRES_NUMBER = 46;

// Point-down pentagon: one vertex at the bottom (where the next trail slot
// is heading), top edge flat (so the trail line coming down from above has
// clear space between the two upper vertices).
export const PENTAGON_ANGLES: number[] = [0, 1, 2, 3, 4].map(
  (i) => Math.PI / 2 + (i * 2 * Math.PI) / 5,
);

// ===== Ryan Gosling easter egg =====
// On Easy mode only, each new pentagon has EGG_RATE chance of replacing one
// of the four distractors with Ryan Gosling. He's always incorrect.
export const EGG_RATE = 0.02; // 1 in 50 pentagons
export const EGG_NAME = "Ryan Gosling";
export const EGG_IMAGE_BASE = "i/funny/";
export const EGG_IMAGES = [
  "ryan-gosling.jpg",
  "blade-runner.jpg",
  "ken-barbie.jpg",
  "project-hail-mary.jpg",
];
// Sentinel "president number" for the egg — guaranteed to never match any
// real correctNumber (1..46), so clicking it always triggers handleWrong.
export const EGG_NUMBER = -1;
