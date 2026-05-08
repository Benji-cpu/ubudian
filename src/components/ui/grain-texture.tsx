interface GrainTextureProps {
  opacity?: number;
  className?: string;
}

export function GrainTexture({ opacity = 0.05, className = "" }: GrainTextureProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 mix-blend-multiply ${className}`}
      style={{ opacity }}
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <filter id="grain-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-noise)" />
      </svg>
    </div>
  );
}
