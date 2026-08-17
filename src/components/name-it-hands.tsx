"use client";

import {
  FLOWER_COLORS,
  getFlowerSlotPosition,
  getStemPath,
  getHazeColor,
  getHazeOpacity,
  HAZE_ELLIPSE,
  HAZE_BLUR_STD_DEVIATION,
  type FlowerColorId,
} from "@/lib/name-it-layout";

const BURST_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

function FlowerBurst({
  x,
  y,
  hex,
}: {
  x: number;
  y: number;
  hex: string;
}) {
  return (
    <g
      transform={`translate(${x},${y})`}
      stroke={hex}
      strokeWidth={2.2}
      strokeLinecap="round"
    >
      {BURST_ANGLES.map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const len = angle % 60 === 0 ? 11 : 8;
        return (
          <line
            key={angle}
            x1={0}
            y1={0}
            x2={Math.cos(rad) * len}
            y2={Math.sin(rad) * len}
          />
        );
      })}
    </g>
  );
}

const HAND_PATH =
  "M -12 60 Q -34 38 -29 8 Q -27 -20 -22 -32 Q -19 -38 -14 -34 Q -11 -30 -14 -20 Q -17 -8 -14 2 Q -10 -15 -8 -40 Q -6 -50 0 -47 Q 4 -44 1 -32 Q -2 -18 -1 -4 Q 2 -14 5 -35 Q 8 -48 14 -46 Q 19 -44 15 -30 Q 11 -15 13 -2 Q 20 -6 28 2 Q 36 10 34 20 Q 32 27 24 21 Q 16 14 12 6 Q 9 12 10 26 Q 11 42 12 55 Q 12 58 9 60 Z";

interface NameItHandsProps {
  flowers: FlowerColorId[];
  onRemoveFlower: (index: number) => void;
  hasHaze: boolean;
  hazeIntensity: number;
}

export function NameItHands({
  flowers,
  onRemoveFlower,
  hasHaze,
  hazeIntensity,
}: NameItHandsProps) {
  function hexFor(color: FlowerColorId) {
    return FLOWER_COLORS.find((c) => c.id === color)!.hex;
  }

  return (
    <svg
      viewBox="0 0 300 280"
      className="mx-auto h-auto w-full max-w-xs"
      role="img"
      aria-label={
        flowers.length === 0
          ? "Two empty open hands"
          : `Two hands holding a bouquet of ${flowers.length} flower${flowers.length === 1 ? "" : "s"}`
      }
    >
      <defs>
        <filter
          id="name-it-haze-blur"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation={HAZE_BLUR_STD_DEVIATION} />
        </filter>
      </defs>

      {flowers.map((color, i) => {
        const pos = getFlowerSlotPosition(i, flowers.length);
        return (
          <g key={i}>
            <path
              d={getStemPath(i, flowers.length)}
              fill="none"
              stroke="#4c8a5c"
              strokeWidth={1.6}
            />
            <g
              role="button"
              tabIndex={0}
              aria-label={`Remove flower ${i + 1}`}
              onClick={() => onRemoveFlower(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onRemoveFlower(i);
              }}
              className="cursor-pointer"
            >
              <circle cx={pos.x} cy={pos.y} r={16} fill="transparent" />
              <FlowerBurst x={pos.x} y={pos.y} hex={hexFor(color)} />
            </g>
          </g>
        );
      })}

      <path
        d={HAND_PATH}
        fill="none"
        stroke="#3a3a3a"
        strokeWidth={1.8}
        strokeLinejoin="round"
        transform="translate(115,195)"
      />
      <path
        d={HAND_PATH}
        fill="none"
        stroke="#3a3a3a"
        strokeWidth={1.8}
        strokeLinejoin="round"
        transform="translate(195,120) rotate(-90)"
      />

      {hasHaze && (
        <ellipse
          cx={HAZE_ELLIPSE.cx}
          cy={HAZE_ELLIPSE.cy}
          rx={HAZE_ELLIPSE.rx}
          ry={HAZE_ELLIPSE.ry}
          fill={getHazeColor(hazeIntensity)}
          opacity={getHazeOpacity(hazeIntensity)}
          filter="url(#name-it-haze-blur)"
        />
      )}
    </svg>
  );
}
