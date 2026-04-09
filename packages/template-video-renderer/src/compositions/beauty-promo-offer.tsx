import React from "react";
import {
  AbsoluteFill,
  Img,
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
    product?: {
      ctaText?: string;
      imageUrl?: string;
      offerText?: string;
      priceText?: string;
      subtitle?: string;
      title?: string;
    };
    scenes: Scene[];
    templateKey: string;
  };
};

function SceneCard({
  scene,
  tone,
  product
}: {
  scene: Scene;
  tone: SceneTone;
  product?: BeautyPromoOfferProps["plan"]["product"];
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const subtitleText = getSceneSubtitle(scene, product);
  const chips = getSceneChips(scene, product);
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
          alignItems: "stretch",
          alignSelf: "stretch",
          background: tone.panel,
          backdropFilter: "blur(20px)",
          border: `1px solid ${tone.panelBorder}`,
          borderRadius: 30,
          boxShadow: "0 28px 60px rgba(16, 44, 69, 0.18)",
          display: "grid",
          gap: 28,
          gridTemplateColumns: "1.1fr 0.9fr",
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

        <div style={{ minWidth: 0, position: "relative" }}>
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: 12,
              marginBottom: 18
            }}
          >
            {product?.title ? (
              <div
                style={{
                  background: "rgba(255,255,255,0.52)",
                  border: `1px solid ${tone.panelBorder}`,
                  borderRadius: 999,
                  color: tone.text,
                  fontSize: 18,
                  fontWeight: 700,
                  maxWidth: 360,
                  overflow: "hidden",
                  padding: "10px 14px",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {product.title}
              </div>
            ) : null}
            {product?.subtitle ? (
              <div
                style={{
                  color: tone.muted,
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase"
                }}
              >
                {product.subtitle}
              </div>
            ) : null}
          </div>
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
              minHeight: 360,
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
          <BenefitChipRow chips={chips} tone={tone} />
        </div>
        <ProductVisual product={product} scene={scene} tone={tone} />
        <SubtitleRail scene={scene} subtitle={subtitleText} tone={tone} />
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
            <SceneCard product={plan.product} scene={scene} tone={SCENE_TONES[index % SCENE_TONES.length]} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

function ProductVisual({
  product,
  scene,
  tone
}: {
  product?: BeautyPromoOfferProps["plan"]["product"];
  scene: Scene;
  tone: SceneTone;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const floatProgress = spring({
    fps,
    frame: frame + 8,
    config: {
      damping: 24,
      stiffness: 140
    }
  });
  const floatY = interpolate(Math.sin(frame / 10), [-1, 1], [10, -10]);
  const tilt = interpolate(Math.sin(frame / 14), [-1, 1], [-3, 3]);
  const shineX = interpolate(frame, [0, scene.durationFrames], [-220, 340], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const imageScale = getSceneImageScale(scene.kind, frame);
  const imageTranslateY = getSceneImageTranslateY(scene.kind, frame);
  const imageTranslateX = interpolate(Math.sin(frame / 16), [-1, 1], [-10, 10]);
  const badgePulse = interpolate(Math.sin(frame / 9), [-1, 1], [0.98, 1.03]);

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        minHeight: 720,
        position: "relative"
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "rgba(255,255,255,0.7)",
          border: `1px solid ${tone.panelBorder}`,
          borderRadius: 999,
          color: tone.text,
          display: "flex",
          fontSize: 18,
          fontWeight: 800,
          gap: 10,
          left: 10,
          letterSpacing: "0.08em",
          padding: "12px 16px",
          position: "absolute",
          textTransform: "uppercase",
          top: 12,
          transform: `scale(${badgePulse})`,
          zIndex: 3
        }}
      >
        <div
          style={{
            background: tone.accent,
            borderRadius: "50%",
            height: 10,
            width: 10
          }}
        />
        Product motion
      </div>
      <div
        style={{
          background: tone.offerGlow,
          borderRadius: "50%",
          filter: "blur(24px)",
          height: 340,
          opacity: 0.55,
          position: "absolute",
          width: 340
        }}
      />
      <div
        style={{
          background: "rgba(255,255,255,0.6)",
          border: `1px solid ${tone.panelBorder}`,
          borderRadius: 36,
          boxShadow: "0 26px 50px rgba(16, 44, 69, 0.18)",
          height: 700,
          overflow: "hidden",
          position: "relative",
          transform: `translateY(${floatY * floatProgress}px) rotate(${tilt}deg)`,
          width: 360
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${tone.highlight} 0%, transparent 72%)`,
            inset: 0,
            opacity: 0.32,
            position: "absolute"
          }}
        />
        {product?.imageUrl ? (
          <Img
            src={product.imageUrl}
            style={{
              height: "100%",
              objectFit: "cover",
              transform: `translate(${imageTranslateX}px, ${imageTranslateY}px) scale(${imageScale})`,
              width: "100%"
            }}
          />
        ) : (
          <div
            style={{
              alignItems: "center",
              color: tone.text,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "center",
              padding: 28,
              textAlign: "center"
            }}
          >
            <div
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.35) 100%)",
                borderRadius: 999,
                boxShadow: "0 18px 38px rgba(16, 44, 69, 0.16)",
                height: 320,
                marginBottom: 28,
                position: "relative",
                width: 160
              }}
            >
              <div
                style={{
                  background: tone.accent,
                  borderRadius: 999,
                  height: 52,
                  left: 28,
                  opacity: 0.92,
                  position: "absolute",
                  top: 28,
                  width: 104
                }}
              />
              <div
                style={{
                  background: "rgba(255,255,255,0.86)",
                  borderRadius: 20,
                  bottom: 24,
                  left: 18,
                  position: "absolute",
                  right: 18,
                  top: 96
                }}
              />
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              {product?.title || "Tambahkan gambar produk untuk preview visual"}
            </div>
            <div style={{ color: tone.muted, fontSize: 22, lineHeight: 1.4, marginTop: 14 }}>
              {product?.subtitle || product?.offerText || "Template akan terasa lebih hidup saat gambar produk diisi."}
            </div>
          </div>
        )}
        <div
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.52) 50%, transparent 100%)",
            height: "120%",
            left: -120,
            opacity: 0.42,
            position: "absolute",
            top: -40,
            transform: `translateX(${shineX}px) rotate(18deg)`,
            width: 120
          }}
        />
        <div
          style={{
            alignItems: "center",
            background: "linear-gradient(135deg, rgba(255,255,255,0.84) 0%, rgba(255,255,255,0.62) 100%)",
            border: `1px solid ${tone.panelBorder}`,
            borderRadius: 24,
            bottom: 20,
            color: tone.text,
            display: "flex",
            gap: 12,
            left: 20,
            padding: "14px 16px",
            position: "absolute"
          }}
        >
          <div
            style={{
              background: tone.highlight,
              borderRadius: "50%",
              height: 42,
              width: 42
            }}
          />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Scene focus
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em" }}>
              {scene.layout}
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          background: tone.ctaSurface,
          border: `1px solid ${tone.ctaBorder}`,
          borderRadius: 999,
          bottom: 84,
          boxShadow: "0 18px 36px rgba(16, 44, 69, 0.12)",
          color: tone.text,
          left: 8,
          padding: "16px 20px",
          position: "absolute",
          transform: `translateY(${-floatY * 0.4}px)`
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {product?.offerText || "Offer"}
        </div>
        <div style={{ color: tone.accent, fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 4 }}>
          {product?.priceText || product?.ctaText || product?.title || "Visual product slot"}
        </div>
      </div>
    </div>
  );
}

function BenefitChipRow({
  chips,
  tone
}: {
  chips: string[];
  tone: SceneTone;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (chips.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        marginTop: 22
      }}
    >
      {chips.map((chip, index) => {
        const reveal = spring({
          fps,
          frame: frame - 18 - index * 4,
          config: {
            damping: 22,
            stiffness: 180
          }
        });

        return (
          <div
            key={chip}
            style={{
              background: "rgba(255,255,255,0.64)",
              border: `1px solid ${tone.panelBorder}`,
              borderRadius: 999,
              color: tone.text,
              fontSize: 18,
              fontWeight: 700,
              opacity: interpolate(reveal, [0, 1], [0, 1]),
              padding: "12px 16px",
              transform: `translateY(${interpolate(reveal, [0, 1], [18, 0])}px)`
            }}
          >
            {chip}
          </div>
        );
      })}
    </div>
  );
}

function SubtitleRail({
  scene,
  subtitle,
  tone
}: {
  scene: Scene;
  subtitle: string;
  tone: SceneTone;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({
    fps,
    frame: frame - 10,
    config: {
      damping: 24,
      stiffness: 160
    }
  });
  const visibleLength = Math.max(10, Math.round(interpolate(reveal, [0, 1], [10, subtitle.length])));
  const visibleSubtitle = subtitle.slice(0, visibleLength);

  return (
    <div
      style={{
        alignItems: "center",
        background: "rgba(18, 30, 45, 0.82)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 24,
        color: "#f9fbff",
        display: "flex",
        gap: 16,
        gridColumn: "1 / -1",
        marginTop: 8,
        minHeight: 88,
        padding: "18px 22px",
        position: "relative"
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: tone.ctaSurface,
          borderRadius: 999,
          color: tone.text,
          display: "flex",
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: "0.08em",
          padding: "10px 14px",
          textTransform: "uppercase"
        }}
      >
        Subtitle
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.3
        }}
      >
        {visibleSubtitle}
      </div>
      <div
        style={{
          background: tone.accent,
          borderRadius: 999,
          bottom: 10,
          height: 4,
          left: 22,
          opacity: 0.85,
          position: "absolute",
          width: `${Math.max(80, Math.round((frame / Math.max(scene.durationFrames, 1)) * 100))}%`
        }}
      />
    </div>
  );
}

function getSceneSubtitle(
  scene: Scene,
  product?: BeautyPromoOfferProps["plan"]["product"]
) {
  const supporting =
    scene.textBlocks.find((block) => block.role === "caption" || block.role === "supporting")?.text ??
    product?.subtitle ??
    product?.title ??
    "";

  return supporting || scene.textBlocks[0]?.text || "Preview subtitle siap dipakai untuk short-form video.";
}

function getSceneChips(
  scene: Scene,
  product?: BeautyPromoOfferProps["plan"]["product"]
) {
  const baseChips = [
    scene.kind.replaceAll("_", " "),
    product?.offerText,
    product?.priceText,
    product?.ctaText
  ].filter(Boolean) as string[];

  return baseChips
    .map((chip) => chip.trim())
    .filter((chip) => chip.length > 0)
    .slice(0, 3);
}

function getSceneImageScale(kind: string, frame: number) {
  const motion = interpolate(Math.sin(frame / 18), [-1, 1], [-0.03, 0.03]);

  if (kind === "offer") {
    return 1.2 + motion;
  }

  if (kind === "cta") {
    return 1.12 + motion;
  }

  if (kind === "benefit") {
    return 1.08 + motion;
  }

  return 1.04 + motion;
}

function getSceneImageTranslateY(kind: string, frame: number) {
  const float = interpolate(Math.sin(frame / 12), [-1, 1], [-12, 12]);

  if (kind === "offer") {
    return -22 + float;
  }

  if (kind === "cta") {
    return -8 + float;
  }

  return float;
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
