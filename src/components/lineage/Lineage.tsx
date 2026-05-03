import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { President } from "../../types";
import { CompleteScreen } from "./CompleteScreen";
import {
  CAMERA_PAN_MS,
  EGG_IMAGE_BASE,
  FINAL_PRES_NUMBER,
  MAX_ZOOM,
  MIN_ZOOM,
  OUTLINE_THRESHOLD,
  PORTRAIT_SIZE,
  SHAKE_MS,
  TIGHT_SPACING,
} from "./constants";
import { buildPentagon } from "./game";
import { HUD } from "./HUD";
import { PresCard } from "./PresCard";
import { RestartConfirm } from "./RestartConfirm";
import { StartScreen } from "./StartScreen";
import {
  loadHideCandidates,
  loadRun,
  saveHideCandidates,
  saveRun,
} from "./storage";
import type {
  Camera,
  Candidate,
  Difficulty,
  MorphPick,
  RunState,
  TrailPick,
} from "./types";
import { clamp, presidentByNumber, trailY } from "./utils";

interface Props {
  presidents: President[];
  /** "study" enters the read-only browse view immediately. "game" runs the
   * usual start → playing → complete flow. App.tsx routes the two pill
   * items (Lineage Study / Lineage Game) to these two entries. */
  entry: "game" | "study";
}

/**
 * Map a Candidate to the props needed to render its card. The Ryan Gosling
 * easter-egg case synthesizes a President-shaped object and points the
 * Portrait at the funny image folder; everything else looks up the real
 * president by number.
 */
// eslint-disable-next-line react-refresh/only-export-components
function candidateRenderProps(
  c: Candidate,
  presidents: President[],
): { president: President; imageBase?: string } | null {
  if (c.egg) {
    return {
      president: {
        number: c.number,
        name: c.egg.name,
        party: "",
        term: "",
        startYear: 0,
        era: "Founding",
        facts: [],
        image: c.egg.imageFile,
      },
      imageBase: EGG_IMAGE_BASE,
    };
  }
  const p = presidentByNumber(presidents, c.number);
  return p ? { president: p } : null;
}

export function Lineage({ presidents, entry }: Props) {
  const [run, setRun] = useState<RunState>(() => {
    if (entry !== "game") {
      return { difficulty: "easy", phase: "start", trail: [], pentagon: null };
    }
    const saved = loadRun();
    if (saved) return saved;
    return { difficulty: "easy", phase: "start", trail: [], pentagon: null };
  });

  const [camera, setCamera] = useState<Camera>(() => {
    if (entry !== "game") return { x: 0, y: 0, zoom: 1 };
    const saved = loadRun();
    if (saved?.phase === "playing" && saved.trail.length > 0) {
      const a = saved.trail[saved.trail.length - 1];
      return { x: a.x, y: a.y, zoom: 1 };
    }
    return { x: 0, y: 0, zoom: 1 };
  });

  const [cameraAnimating, setCameraAnimating] = useState(false);
  const [wrongCandidateNum, setWrongCandidateNum] = useState<number | null>(
    null,
  );
  const [fadingCandidates, setFadingCandidates] = useState<Candidate[]>([]);
  const [morphPick, setMorphPick] = useState<MorphPick | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [hideCandidates, setHideCandidates] = useState<boolean>(
    loadHideCandidates,
  );
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });

  // Persist the hide-candidates preference (game entry only — study has no
  // candidates to hide).
  useEffect(() => {
    if (entry !== "game") return;
    saveHideCandidates(hideCandidates);
  }, [hideCandidates, entry]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const morphRef = useRef<HTMLDivElement>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const wrongTimerRef = useRef<number | null>(null);
  const lastDragMoveAt = useRef(0);
  // Tracks whether we've positioned the camera for the current study
  // session. Resets when the user leaves study mode.
  const studyPositionedRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
  } | null>(null);
  const pinchRef = useRef<{
    initialDist: number;
    initialCamera: Camera;
    midScreenX: number;
    midScreenY: number;
  } | null>(null);

  // Persist on every change (game entry only — study has nothing to save).
  useEffect(() => {
    if (entry !== "game") return;
    saveRun(run);
  }, [run, entry]);

  // Measure viewport.
  useEffect(() => {
    if (!viewportRef.current) return;
    const el = viewportRef.current;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setViewportSize({ w: rect.width, h: rect.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [run.phase]);

  // Study mode opens with Washington pinned near the top of the viewport
  // rather than centered vertically. We can't do this synchronously at mount
  // because the viewport hasn't been measured yet; instead, wait for the
  // first non-zero height and position the camera once.
  useEffect(() => {
    if (entry !== "study") {
      studyPositionedRef.current = false;
      return;
    }
    if (studyPositionedRef.current) return;
    if (viewportSize.h <= 0) return;
    // Place Washington (world y = 0) so his portrait center sits ~PORTRAIT_SIZE
    // from the top edge — gives the head some breathing room.
    setCamera({
      x: 0,
      y: viewportSize.h / 2 - PORTRAIT_SIZE,
      zoom: 1,
    });
    studyPositionedRef.current = true;
  }, [entry, viewportSize.h]);

  // On mount, if a saved game run is mid-transition (pentagon null), rebuild
  // it. Skipped for study entry since it doesn't read run state.
  useEffect(() => {
    if (entry !== "game") return;
    if (
      run.phase === "playing" &&
      run.pentagon === null &&
      run.trail.length > 0
    ) {
      const last = run.trail[run.trail.length - 1];
      if (last.number < FINAL_PRES_NUMBER) {
        const p = buildPentagon(presidents, last, run.difficulty);
        if (p) setRun((s) => ({ ...s, pentagon: p }));
      } else {
        setRun((s) => ({ ...s, phase: "complete" }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Confetti on completion (game entry only).
  useEffect(() => {
    if (entry !== "game" || run.phase !== "complete") return;
    let cancelled = false;
    import("canvas-confetti")
      .then((mod) => {
        if (cancelled) return;
        const confetti = mod.default;
        const dur = 1800;
        const end = Date.now() + dur;
        const colors = ["#0b2545", "#c9a227", "#1f7a3a", "#b3261e", "#ffffff"];
        (function frame() {
          if (cancelled) return;
          confetti({
            particleCount: 4,
            angle: 60,
            spread: 60,
            origin: { x: 0, y: 0.7 },
            colors,
          });
          confetti({
            particleCount: 4,
            angle: 120,
            spread: 60,
            origin: { x: 1, y: 0.7 },
            colors,
          });
          if (Date.now() < end) requestAnimationFrame(frame);
        })();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [run.phase, entry]);

  // Cleanup timers on unmount.
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
    };
  }, []);

  // FLIP animation: when morphPick is set, place the card at its "from" pos
  // (the pentagon vertex), commit, then animate the transform to identity so
  // it slides into its "to" pos (the trail slot).
  useLayoutEffect(() => {
    if (!morphPick) return;
    const el = morphRef.current;
    if (!el) return;
    const dx = morphPick.fromX - morphPick.toX;
    const dy = morphPick.fromY - morphPick.toY;
    el.style.transition = "none";
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    // Force reflow so the from-state is committed before the to-state.
    void el.offsetWidth;
    el.style.transition = `transform ${CAMERA_PAN_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    el.style.transform = "";
  }, [morphPick]);

  function clearTimers() {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (wrongTimerRef.current) {
      clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = null;
    }
  }

  function startGame(difficulty: Difficulty) {
    clearTimers();
    const initialTrail: TrailPick[] = [{ number: 1, x: 0, y: 0 }];
    const pentagon = buildPentagon(presidents, initialTrail[0], difficulty);
    setRun({
      difficulty,
      phase: "playing",
      trail: initialTrail,
      pentagon,
    });
    // Hard mode defaults to hiding candidate images so the photo style
    // doesn't leak the era. The user can still toggle it back during play.
    if (difficulty === "hard") setHideCandidates(true);
    setCamera({ x: 0, y: 0, zoom: 1 });
    setCameraAnimating(false);
    setFadingCandidates([]);
    setMorphPick(null);
    setWrongCandidateNum(null);
  }

  function requestRestart() {
    if (run.trail.length > 1) setShowRestartConfirm(true);
    else doRestart();
  }

  function doRestart() {
    clearTimers();
    setShowRestartConfirm(false);
    setRun({
      difficulty: run.difficulty,
      phase: "start",
      trail: [],
      pentagon: null,
    });
    setCamera({ x: 0, y: 0, zoom: 1 });
    setCameraAnimating(false);
    setFadingCandidates([]);
    setMorphPick(null);
    setWrongCandidateNum(null);
  }

  function animateCamera(
    targetX: number,
    targetY: number,
    targetZoom?: number,
  ) {
    setCameraAnimating(true);
    setCamera((c) => ({
      x: targetX,
      y: targetY,
      zoom: targetZoom ?? c.zoom,
    }));
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = window.setTimeout(() => {
      setCameraAnimating(false);
    }, CAMERA_PAN_MS + 50);
  }

  function recenter() {
    if (run.phase !== "playing" || run.trail.length === 0) return;
    const a = run.trail[run.trail.length - 1];
    animateCamera(a.x, a.y);
  }

  function resetZoom() {
    if (run.phase === "playing" && run.trail.length > 0) {
      const a = run.trail[run.trail.length - 1];
      animateCamera(a.x, a.y, 1);
    } else {
      animateCamera(camera.x, camera.y, 1);
    }
  }

  function handleCorrect(correct: Candidate) {
    if (!run.pentagon) return;
    // The new active lands at the next slot on the vertical trail line,
    // at the full TRAIL_SPACING below the (compressed) previous active.
    const oldLength = run.trail.length;
    const newLength = oldLength + 1;
    const newSlotX = 0;
    const newSlotY = trailY(oldLength, newLength);
    const newActive: TrailPick = {
      number: correct.number,
      x: newSlotX,
      y: newSlotY,
    };
    const wrongs = run.pentagon.candidates.filter(
      (c) => c.number !== correct.number,
    );
    setFadingCandidates(wrongs);
    setMorphPick({
      number: correct.number,
      fromX: correct.x,
      fromY: correct.y,
      toX: newSlotX,
      toY: newSlotY,
    });

    animateCamera(newSlotX, newSlotY);
    setRun((s) => ({
      ...s,
      // Recompute every trail entry's y under the new total length so the
      // previous active "compresses" up into the past spacing as we add the
      // new active. The cards' CSS `top` transition handles the slide.
      trail: [
        ...s.trail.map((p, i) => ({ ...p, y: trailY(i, newLength) })),
        newActive,
      ],
      pentagon: null,
    }));

    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = window.setTimeout(() => {
      setFadingCandidates([]);
      setMorphPick(null);
      setCameraAnimating(false);
      setRun((s) => {
        if (s.phase !== "playing") return s;
        const last = s.trail[s.trail.length - 1];
        if (last.number >= FINAL_PRES_NUMBER) {
          return { ...s, phase: "complete" };
        }
        const p = buildPentagon(presidents, last, s.difficulty);
        return { ...s, pentagon: p };
      });
    }, CAMERA_PAN_MS + 50);
  }

  function handleWrong(cand: Candidate) {
    setWrongCandidateNum(cand.number);
    if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
    wrongTimerRef.current = window.setTimeout(() => {
      setWrongCandidateNum(null);
    }, SHAKE_MS);
  }

  function onCandidateClick(cand: Candidate) {
    if (Date.now() - lastDragMoveAt.current < 200) return;
    if (!run.pentagon || cameraAnimating) return;
    if (cand.number === run.pentagon.correctNumber) handleCorrect(cand);
    else handleWrong(cand);
  }

  // ===== Pan/zoom =====
  // React 18 attaches `wheel` and `touchmove` as PASSIVE listeners, which
  // means `e.preventDefault()` inside React synthetic handlers throws the
  // "Unable to preventDefault inside passive event listener" warning and
  // doesn't actually suppress the page scroll. Attach native non-passive
  // listeners instead. We also read camera through a ref so the listeners
  // see the latest value without reattaching on every state change.
  const cameraRef = useRef(camera);
  useEffect(() => {
    cameraRef.current = camera;
  });

  useEffect(() => {
    const el = viewportRef.current;
    // Pan/zoom is enabled in study entry always, and in game entry only
    // during the playing phase.
    if (!el) return;
    const allowed =
      entry === "study" || (entry === "game" && run.phase === "playing");
    if (!allowed) return;

    const zoomAroundScreen = (sx: number, sy: number, factor: number) => {
      setCamera((c) => {
        const newZoom = clamp(c.zoom * factor, MIN_ZOOM, MAX_ZOOM);
        if (newZoom === c.zoom) return c;
        const rect = el.getBoundingClientRect();
        const vpX = sx - rect.left;
        const vpY = sy - rect.top;
        const wx = c.x + (vpX - rect.width / 2) / c.zoom;
        const wy = c.y + (vpY - rect.height / 2) / c.zoom;
        return {
          x: wx - (vpX - rect.width / 2) / newZoom,
          y: wy - (vpY - rect.height / 2) / newZoom,
          zoom: newZoom,
        };
      });
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setCameraAnimating(false);
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-e.deltaY * 0.01);
        zoomAroundScreen(e.clientX, e.clientY, factor);
      } else {
        setCamera((c) => ({
          x: c.x + e.deltaX / c.zoom,
          y: c.y + e.deltaY / c.zoom,
          zoom: c.zoom,
        }));
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      setCameraAnimating(false);
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(
          t1.clientX - t2.clientX,
          t1.clientY - t2.clientY,
        );
        pinchRef.current = {
          initialDist: dist,
          initialCamera: { ...cameraRef.current },
          midScreenX: (t1.clientX + t2.clientX) / 2,
          midScreenY: (t1.clientY + t2.clientY) / 2,
        };
        dragRef.current = null;
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        dragRef.current = {
          pointerId: t.identifier,
          lastX: t.clientX,
          lastY: t.clientY,
        };
        pinchRef.current = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(
          t1.clientX - t2.clientX,
          t1.clientY - t2.clientY,
        );
        const factor = dist / pinchRef.current.initialDist;
        const targetZoom = clamp(
          pinchRef.current.initialCamera.zoom * factor,
          MIN_ZOOM,
          MAX_ZOOM,
        );
        const rect = el.getBoundingClientRect();
        const init = pinchRef.current.initialCamera;
        const initVpX = pinchRef.current.midScreenX - rect.left;
        const initVpY = pinchRef.current.midScreenY - rect.top;
        const wx = init.x + (initVpX - rect.width / 2) / init.zoom;
        const wy = init.y + (initVpY - rect.height / 2) / init.zoom;
        const midSX = (t1.clientX + t2.clientX) / 2;
        const midSY = (t1.clientY + t2.clientY) / 2;
        const newVpX = midSX - rect.left;
        const newVpY = midSY - rect.top;
        lastDragMoveAt.current = Date.now();
        setCamera({
          x: wx - (newVpX - rect.width / 2) / targetZoom,
          y: wy - (newVpY - rect.height / 2) / targetZoom,
          zoom: targetZoom,
        });
      } else if (e.touches.length === 1 && dragRef.current) {
        const t = e.touches[0];
        if (t.identifier !== dragRef.current.pointerId) return;
        const dx = t.clientX - dragRef.current.lastX;
        const dy = t.clientY - dragRef.current.lastY;
        dragRef.current.lastX = t.clientX;
        dragRef.current.lastY = t.clientY;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          e.preventDefault();
          lastDragMoveAt.current = Date.now();
          setCamera((c) => ({
            x: c.x - dx / c.zoom,
            y: c.y - dy / c.zoom,
            zoom: c.zoom,
          }));
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        dragRef.current = null;
        pinchRef.current = null;
      } else if (e.touches.length === 1) {
        pinchRef.current = null;
        const t = e.touches[0];
        dragRef.current = {
          pointerId: t.identifier,
          lastX: t.clientX,
          lastY: t.clientY,
        };
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [run.phase, entry]);

  // ===== Render =====
  // Study entry: render the read-only browse view, no game state involved.
  if (entry === "study") {
    const isOutline = camera.zoom < OUTLINE_THRESHOLD;
    const zoomPct = Math.round(camera.zoom * 100);
    const wrapperTransform = `translate(${
      viewportSize.w / 2 - camera.x * camera.zoom
    }px, ${
      viewportSize.h / 2 - camera.y * camera.zoom
    }px) scale(${camera.zoom})`;
    const linePoints = presidents
      .map((_, i) => `0,${i * TIGHT_SPACING}`)
      .join(" ");

    return (
      <div className="lineage">
        <div className="lineage-viewport" ref={viewportRef}>
          <div
            className="lineage-world"
            style={{
              transform: wrapperTransform,
              transition: cameraAnimating
                ? `transform ${CAMERA_PAN_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
                : "none",
              visibility: viewportSize.w > 0 ? "visible" : "hidden",
            }}
          >
            <svg
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 1,
                height: 1,
                overflow: "visible",
                pointerEvents: "none",
              }}
            >
              <polyline
                points={linePoints}
                fill="none"
                stroke="#000"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {presidents.map((p, i) => (
              <PresCard
                key={`study-${p.number}`}
                president={p}
                x={0}
                y={i * TIGHT_SPACING}
                showNumber
                kind="past"
                outline={isOutline}
                zoom={camera.zoom}
              />
            ))}
          </div>

          <div className="lineage-hud">
            {camera.zoom < 0.999 && (
              <button
                className="lineage-hud-btn lineage-zoom-chip"
                onClick={resetZoom}
                title="Reset zoom"
              >
                {zoomPct}% — reset zoom
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Game entry from here on.
  if (run.phase === "start") {
    return <StartScreen initialDifficulty={run.difficulty} onStart={startGame} />;
  }

  if (run.phase === "complete") {
    return (
      <CompleteScreen
        initialDifficulty={run.difficulty}
        onPlayAgain={startGame}
      />
    );
  }

  const active = run.trail[run.trail.length - 1];
  if (!active) return null;

  const activeScreenX =
    viewportSize.w / 2 + (active.x - camera.x) * camera.zoom;
  const activeScreenY =
    viewportSize.h / 2 + (active.y - camera.y) * camera.zoom;
  const offMargin = (PORTRAIT_SIZE * camera.zoom) / 2;
  const isActiveOffscreen =
    viewportSize.w > 0 &&
    (activeScreenX < -offMargin ||
      activeScreenX > viewportSize.w + offMargin ||
      activeScreenY < -offMargin ||
      activeScreenY > viewportSize.h + offMargin);

  const isOutline = camera.zoom < OUTLINE_THRESHOLD;
  const zoomPct = Math.round(camera.zoom * 100);

  const wrapperTransform = `translate(${
    viewportSize.w / 2 - camera.x * camera.zoom
  }px, ${viewportSize.h / 2 - camera.y * camera.zoom}px) scale(${camera.zoom})`;

  const linePoints = run.trail.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="lineage">
      <div className="lineage-viewport" ref={viewportRef}>
        <div
          className="lineage-world"
          style={{
            transform: wrapperTransform,
            transition: cameraAnimating
              ? `transform ${CAMERA_PAN_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
              : "none",
            visibility: viewportSize.w > 0 ? "visible" : "hidden",
          }}
        >
          {run.trail.length > 1 && (
            <svg
              className="lineage-line"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 1,
                height: 1,
                overflow: "visible",
                pointerEvents: "none",
              }}
            >
              <polyline
                points={linePoints}
                fill="none"
                stroke="#777"
                strokeWidth={12}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {run.trail.map((pick, i) => {
            const p = presidentByNumber(presidents, pick.number);
            if (!p) return null;
            const isActive = i === run.trail.length - 1;
            // While morphing, the morph card renders the active in its place.
            if (isActive && morphPick) return null;
            return (
              <PresCard
                key={`trail-${i}-${pick.number}`}
                president={p}
                x={pick.x}
                y={pick.y}
                showNumber
                kind={isActive ? "active" : "past"}
                outline={isOutline}
                zoom={camera.zoom}                
              />
            );
          })}

          {morphPick &&
            (() => {
              const p = presidentByNumber(presidents, morphPick.number);
              if (!p) return null;
              return (
                <PresCard
                  ref={morphRef}
                  key={`morph-${morphPick.number}`}
                  president={p}
                  x={morphPick.toX}
                  y={morphPick.toY}
                  showNumber
                  kind="active"
                  outline={isOutline}
                  zoom={camera.zoom}
                />
              );
            })()}

          {fadingCandidates.map((c) => {
            const props = candidateRenderProps(c, presidents);
            if (!props) return null;
            return (
              <PresCard
                key={`fade-${c.number}-${Math.round(c.x)}-${Math.round(c.y)}`}
                president={props.president}
                imageBase={props.imageBase}
                x={c.x}
                y={c.y}
                showNumber={false}
                kind="candidate"
                outline={isOutline}
                fading
                hideImage={hideCandidates}
                zoom={camera.zoom}
              />
            );
          })}

          {run.pentagon?.candidates.map((c) => {
            const props = candidateRenderProps(c, presidents);
            if (!props) return null;
            return (
              <PresCard
                key={`cand-${c.number}`}
                president={props.president}
                imageBase={props.imageBase}
                x={c.x}
                y={c.y}
                showNumber={false}
                kind="candidate"
                outline={isOutline}
                shaking={wrongCandidateNum === c.number}
                hideImage={hideCandidates}
                onClick={() => onCandidateClick(c)}
                zoom={camera.zoom}
              />
            );
          })}
        </div>

        <HUD
          zoom={camera.zoom}
          zoomPct={zoomPct}
          isActiveOffscreen={isActiveOffscreen}
          hideCandidates={hideCandidates}
          onRestart={requestRestart}
          onResetZoom={resetZoom}
          onRecenter={recenter}
          onToggleHideCandidates={() => setHideCandidates((v) => !v)}
        />

        {showRestartConfirm && (
          <RestartConfirm
            activeNumber={active.number}
            onCancel={() => setShowRestartConfirm(false)}
            onConfirm={doRestart}
          />
        )}
      </div>
    </div>
  );
}
