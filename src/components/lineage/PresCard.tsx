import { forwardRef } from "react";
import type { President } from "../../types";
import { Portrait } from "../Portrait";
import { LABEL_HEIGHT, PORTRAIT_SIZE, SIDE_LABEL_WIDTH } from "./constants";
import { clamp } from "./utils";

interface PresCardProps {
  president: President;
  x: number;
  y: number;
  showNumber: boolean;
  kind: "active" | "past" | "candidate";
  outline: boolean;
  zoom: number;
  shaking?: boolean;
  fading?: boolean;
  /** When true, render an opaque "?" placeholder instead of the portrait so
   * the photo style (B&W / painted / color) doesn't leak the era. */
  hideImage?: boolean;
  /** Folder under /public/ to load the image from. Defaults to the regular
   * president portraits folder. The Ryan Gosling easter egg sets this to
   * the funny folder. */
  imageBase?: string;
  onClick?: () => void;
}

export const PresCard = forwardRef<HTMLDivElement, PresCardProps>(
  function PresCard(
    {
      president,
      x,
      y,
      showNumber,
      kind,
      outline,
      zoom,
      shaking,
      fading,
      hideImage,
      imageBase,
      onClick,
    },
    ref,
  ) {
    const cls = [
      "lineage-card",
      `lineage-card-${kind}`,
      outline ? "is-outline" : "is-portrait",
      shaking ? "is-shaking" : "",
      fading ? "is-fading" : "",
    ]
      .filter(Boolean)
      .join(" ");

    // In outline mode, scale up the chip's content to compensate for world
    // zoom so labels stay readable.
    const outlineScale = outline ? clamp(1 / Math.max(zoom, 0.2), 1, 3) : 1;

    const isPastRow = kind === "past" && !outline;
    const cardWidth = isPastRow
      ? SIDE_LABEL_WIDTH * 2 + PORTRAIT_SIZE
      : PORTRAIT_SIZE;
    const cardHeight = isPastRow ? PORTRAIT_SIZE : PORTRAIT_SIZE + LABEL_HEIGHT;
    const left = x - cardWidth / 2 - 4;
    const top = y - PORTRAIT_SIZE / 2;

    return (
      <div
        ref={ref}
        className={cls}
        style={{
          position: "absolute",
          left,
          top,
          width: cardWidth,
          height: cardHeight,
          flexDirection: isPastRow ? "row" : "column",
          cursor: onClick ? "pointer" : "default",
        }}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : -1}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
      >
        {isPastRow && (
          <span
            className="lineage-card-side lineage-card-side-term"
            style={{ width: SIDE_LABEL_WIDTH }}
          >
            {president.term}
          </span>
        )}
        {!outline && (
          <div
            className="lineage-card-portrait"
            style={{
              width: PORTRAIT_SIZE,
              height: PORTRAIT_SIZE,
              flexShrink: 0,
            }}
          >
            {hideImage ? (
              <div className="lineage-card-hidden" aria-hidden>
                ?
              </div>
            ) : (
              <Portrait
                president={president}
                size={PORTRAIT_SIZE}
                imageBase={imageBase}
              />
            )}
            {showNumber && (
              <span className="lineage-card-number">{president.number}</span>
            )}
          </div>
        )}
        {isPastRow && (
          <span
            className="lineage-card-side lineage-card-side-name"
            style={{
              width: SIDE_LABEL_WIDTH,
            }}
          >
            {president.name}
          </span>
        )}
        {!isPastRow && (
          <div
            className="lineage-card-label"
            style={
              outline
                ? {
                    transform: `scale(${outlineScale})`,
                    transformOrigin: "center top",
                  }
                : undefined
            }
          >
            <span className="lineage-card-name">{president.name}</span>
          </div>
        )}
      </div>
    );
  },
);
