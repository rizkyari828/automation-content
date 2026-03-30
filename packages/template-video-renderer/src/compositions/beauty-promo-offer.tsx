import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

type Scene = {
  durationFrames: number;
  id: string;
  kind: string;
  layout: string;
  textBlocks: Array<{
    animation?: string;
    role?: string;
    text: string;
  }>;
};

type BeautyPromoOfferProps = {
  plan: {
    aspectRatio: string;
    durationSeconds?: number;
    scenes: Scene[];
    templateKey: string;
  };
};

function SceneCard({ scene, tone }: { scene: Scene; tone: SceneTone }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sceneRise = spring({
    fps,
    frame,
    config: {
      damping: 20,
      stiffness: 130
    }
  });
  const panelEntrance = spring({
    fps,
    frame,
    config: {
      damping: 26,
      stiffness: 170
    }
  });
  const panelOffsetY = interpolate(panelEntrance, [0, 1], [40, 0]);
  const panelScale = interpolate(panelEntrance, [0, 1], [0.96, 1]);
  const panelOpacity = interpolate(panelEntrance, [0, 1], [0.35, 1]);
  const ambientShift = interpolate(frame, [0, scene.durationFrames], [0, -22]);
  const sweepProgress = interpolate(frame, [0, scene.durationFrames * 0.55], [-160, 860], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const ctaPulse = interpolate(
    Math.sin(frame / 7),
    [-1, 1],
    [0.98, 1.03]
  );
  const offerLift = interpolate(
    Math.sin(frame / 9),
    [-1, 1],
    [-6, 6]
  );
  const layoutBadgeOffset = interpolate(sceneRise, [0, 1], [18, 0]);

  return (
    <AbsoluteFill
      style={{
        background: tone.background,
        color: tone.text,
        fontFamily: "Plus Jakarta Sans, Manrope, sans-serif",
        justifyContent: "space-between",
        padding: 54
      }}
    >
      <BackgroundAtmosphere tone={tone} yOffset={ambientShift} />

      <div
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${tone.highlight} 48%, transparent 100%)`,
          borderRadius: 999,
          filter: "blur(3px)",
          height: 3,
          left: 54,
          opacity: 0.68,
          position: "absolute",
          top: 42,
          transform: `translateX(${sweepProgress}px)`,
          width: 220
        }}
      />

      <div
        style={{
          alignSelf: scene.layout === "product-focus" ? "center" : "flex-start",
          background: tone.panel,
          backdropFilter: "blur(20px)",
          border: `1px solid ${tone.panelBorder}`,
          borderRadius: 30,
          boxShadow: "0 28px 60px rgba(16, 44, 69, 0.18)",
          opacity: panelOpacity,
          overflow: "hidden",
          padding: 32,
          position: "relative",
          transform: `translateY(${panelOffsetY}px) scale(${panelScale})`
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${tone.highlight} 0%, transparent 62%)`,
            height: 260,
            opacity: 0.65,
            position: "absolute",
            right: -70,
            top: -70,
            width: 260
          }}
        />

        <div
          style={{
            color: tone.muted,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "0.12em",
            marginBottom: 18,
            position: "relative",
            textTransform: "uppercase"
          }}
        >
          {scene.kind}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            position: "relative"
          }}
        >
          {scene.textBlocks.map((block, index) => {
            const blockEntrance = spring({
              fps,
              frame: frame - index * 7,
              config: {
                damping: 22,
                stiffness: 150
              }
            });
            const translateY = interpolate(blockEntrance, [0, 1], [28, 0]);
            const opacity = interpolate(blockEntrance, [0, 1], [0, 1]);
            const isCTA = block.role === "cta";
            const isOffer = block.role === "offer";
            const isPrice = block.role === "price";
            const isCaption = block.role === "caption";

            return (
              <div
                key={`${scene.id}-${block.role}-${block.text}`}
                style={{
                  alignSelf: isCTA ? "flex-start" : "stretch",
                  background: isCTA ? tone.ctaSurface : undefined,
                  border: isCTA ? `1px solid ${tone.ctaBorder}` : undefined,
                  borderRadius: isCTA ? 24 : undefined,
                  boxShadow: isCTA ? "0 16px 32px rgba(16, 44, 69, 0.12)" : undefined,
                  color: isPrice ? tone.accent : tone.text,
                  fontSize: block.role === "headline" ? 56 : isOffer ? 50 : isPrice ? 42 : 30,
                  fontWeight: isCaption ? 500 : 800,
                  letterSpacing: isCaption ? "-0.01em" : "-0.03em",
                  lineHeight: isCaption ? 1.35 : 1.05,
                  maxWidth: 800,
                  opacity,
                  padding: isCTA ? "18px 24px" : undefined,
                  position: "relative",
                  transform: `translateY(${translateY + (isOffer ? offerLift : 0)}px) scale(${isCTA ? ctaPulse : 1})`,
                  transformOrigin: "left center"
                }}
              >
                {isOffer ? (
                  <div
                    style={{
                      background: tone.offerGlow,
                      borderRadius: 999,
                      bottom: -8,
                      filter: "blur(12px)",
                      height: 18,
                      left: 12,
                      opacity: 0.52,
                      position: "absolute",
                      width: 220
                    }}
                  />
                ) : null}
                <span style={{ position: "relative" }}>{block.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between"
        }}
      >
        <div
          style={{
            color: tone.muted,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase"
          }}
        >
          CreatorFlow Template
        </div>
        <div
          style={{
            background: tone.badge,
            border: `1px solid ${tone.panelBorder}`,
            borderRadius: 999,
            color: tone.text,
            fontSize: 24,
            fontWeight: 800,
            padding: "16px 24px",
            transform: `translateY(${layoutBadgeOffset}px)`
          }}
        >
          {scene.layout}
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function BeautyPromoOffer({ plan }: BeautyPromoOfferProps) {
  let from = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#f7f2ec" }}>
      {plan.scenes.map((scene, index) => {
        const startFrom = from;
        from += scene.durationFrames;

        return (
          <Sequence key={scene.id} from={startFrom} durationInFrames={scene.durationFrames}>
            <SceneCard scene={scene} tone={SCENE_TONES[index % SCENE_TONES.length]} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

type SceneTone = {
  accent: string;
  background: string;
  badge: string;
  ctaBorder: string;
  ctaSurface: string;
  muted: string;
  offerGlow: string;
  panel: string;
  panelBorder: string;
  text: string;
  highlight: string;
};

function BackgroundAtmosphere({
  tone,
  yOffset
}: {
  tone: SceneTone;
  yOffset: number;
}) {
  return (
    <>
      <div
        style={{
          background: tone.highlight,
          borderRadius: "50%",
          filter: "blur(10px)",
          height: 300,
          left: -70,
          opacity: 0.34,
          position: "absolute",
          top: 120 + yOffset,
          width: 300
        }}
      />
      <div
        style={{
          background: tone.offerGlow,
          borderRadius: "50%",
          filter: "blur(16px)",
          height: 240,
          opacity: 0.3,
          position: "absolute",
          right: 90,
          top: 180 - yOffset * 0.8,
          width: 240
        }}
      />
      <div
        style={{
          border: `1px solid ${tone.panelBorder}`,
          borderRadius: 38,
          height: 540,
          left: 46,
          opacity: 0.55,
          position: "absolute",
          top: 70,
          transform: `translateY(${yOffset * 0.45}px)`,
          width: 980
        }}
      />
    </>
  );
}

const SCENE_TONES: SceneTone[] = [
  {
    accent: "#f59a53",
    background: "linear-gradient(160deg, #fff6ef 0%, #ffe6d1 100%)",
    badge: "rgba(245, 154, 83, 0.18)",
    ctaBorder: "rgba(245, 154, 83, 0.22)",
    ctaSurface: "rgba(255, 247, 239, 0.92)",
    highlight: "rgba(245, 154, 83, 0.44)",
    muted: "#8b5e3c",
    offerGlow: "rgba(245, 154, 83, 0.4)",
    panel: "rgba(255, 255, 255, 0.7)",
    panelBorder: "rgba(255,255,255,0.22)",
    text: "#2d180a"
  },
  {
    accent: "#0f8590",
    background: "linear-gradient(160deg, #effaf8 0%, #d9f2ef 100%)",
    badge: "rgba(15, 133, 144, 0.18)",
    ctaBorder: "rgba(15, 133, 144, 0.22)",
    ctaSurface: "rgba(243, 255, 253, 0.92)",
    highlight: "rgba(15, 133, 144, 0.34)",
    muted: "#316266",
    offerGlow: "rgba(15, 133, 144, 0.32)",
    panel: "rgba(255, 255, 255, 0.72)",
    panelBorder: "rgba(255,255,255,0.28)",
    text: "#0f2f33"
  },
  {
    accent: "#102c45",
    background: "linear-gradient(160deg, #f3f6fb 0%, #dde7f5 100%)",
    badge: "rgba(16, 44, 69, 0.12)",
    ctaBorder: "rgba(16, 44, 69, 0.2)",
    ctaSurface: "rgba(247, 250, 255, 0.94)",
    highlight: "rgba(16, 44, 69, 0.28)",
    muted: "#4a657a",
    offerGlow: "rgba(16, 44, 69, 0.26)",
    panel: "rgba(255, 255, 255, 0.78)",
    panelBorder: "rgba(255,255,255,0.32)",
    text: "#102c45"
  }
];
