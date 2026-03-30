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
    role?: string;
    text: string;
  }>;
};

type GadgetComparisonProps = {
  plan: {
    scenes: Scene[];
    templateKey: string;
  };
};

export function GadgetComparison({ plan }: GadgetComparisonProps) {
  let from = 0;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #09111a 0%, #101b28 52%, #162535 100%)",
        color: "#f4f7fb",
        fontFamily: "Sora, Space Grotesk, sans-serif"
      }}
    >
      {plan.scenes.map((scene, index) => {
        const startFrom = from;
        from += scene.durationFrames;

        return (
          <Sequence key={scene.id} from={startFrom} durationInFrames={scene.durationFrames}>
            <GadgetScene scene={scene} index={index} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

function GadgetScene({ scene, index }: { scene: Scene; index: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({
    fps,
    frame,
    config: {
      damping: 22,
      stiffness: 150
    }
  });
  const panelLift = interpolate(reveal, [0, 1], [34, 0]);
  const panelScale = interpolate(reveal, [0, 1], [0.94, 1]);
  const glowTravel = interpolate(frame, [0, scene.durationFrames], [-180, 180], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const vsPulse = interpolate(Math.sin(frame / 8), [-1, 1], [0.96, 1.04]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "space-between",
        overflow: "hidden",
        padding: 48
      }}
    >
      <ComparisonBackdrop glowTravel={glowTravel} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          position: "relative"
        }}
      >
        <div>
          <div
            style={{
              color: "#88a4c5",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase"
            }}
          >
            Gadget comparison
          </div>
          <div
            style={{
              color: "#f7fbff",
              fontSize: 56,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              marginTop: 14,
              maxWidth: 760
            }}
          >
            {scene.textBlocks[0]?.text ?? "Bandingkan perangkat yang paling masuk akal."}
          </div>
        </div>

        <div
          style={{
            alignItems: "center",
            background: "rgba(18, 34, 52, 0.72)",
            border: "1px solid rgba(129, 164, 209, 0.22)",
            borderRadius: 999,
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            gap: 10,
            padding: "14px 20px",
            transform: `scale(${vsPulse})`
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #82b2ff 0%, #53e6d8 100%)",
              borderRadius: "50%",
              height: 12,
              width: 12
            }}
          />
          {scene.kind}
        </div>
      </div>

      <div
        style={{
          alignItems: "stretch",
          display: "grid",
          gap: 22,
          gridTemplateColumns: "1fr 120px 1fr",
          position: "relative",
          transform: `translateY(${panelLift}px) scale(${panelScale})`
        }}
      >
        <ComparisonPanel
          accent="linear-gradient(135deg, rgba(130, 178, 255, 0.28) 0%, rgba(83, 230, 216, 0.08) 100%)"
          eyebrow={index % 2 === 0 ? "Pilihan cepat" : "Yang perlu dicek"}
          scene={scene}
          side="left"
        />
        <div
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              alignItems: "center",
              background: "rgba(14, 24, 36, 0.84)",
              border: "1px solid rgba(130, 178, 255, 0.24)",
              borderRadius: 999,
              color: "#dce9f8",
              display: "flex",
              fontSize: 30,
              fontWeight: 800,
              height: 88,
              justifyContent: "center",
              letterSpacing: "0.08em",
              width: 88
            }}
          >
            VS
          </div>
        </div>
        <ComparisonPanel
          accent="linear-gradient(135deg, rgba(245, 154, 83, 0.24) 0%, rgba(245, 154, 83, 0.06) 100%)"
          eyebrow="Angle konversi"
          scene={scene}
          side="right"
        />
      </div>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          position: "relative"
        }}
      >
        <div
          style={{
            color: "#6f89a8",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase"
          }}
        >
          CreatorFlow comparison template
        </div>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: 12
          }}
        >
          {scene.textBlocks.slice(0, 2).map((block, blockIndex) => (
            <div
              key={`${scene.id}-chip-${blockIndex}`}
              style={{
                background: "rgba(17, 31, 47, 0.74)",
                border: "1px solid rgba(129, 164, 209, 0.2)",
                borderRadius: 999,
                color: "#d6e5f6",
                fontSize: 20,
                fontWeight: 700,
                maxWidth: 260,
                overflow: "hidden",
                padding: "14px 18px",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {block.text}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function ComparisonBackdrop({ glowTravel }: { glowTravel: number }) {
  return (
    <>
      <div
        style={{
          background:
            "radial-gradient(circle at center, rgba(130,178,255,0.32) 0%, rgba(130,178,255,0) 68%)",
          height: 420,
          left: -140 + glowTravel,
          position: "absolute",
          top: 220,
          width: 420
        }}
      />
      <div
        style={{
          background:
            "radial-gradient(circle at center, rgba(83,230,216,0.16) 0%, rgba(83,230,216,0) 72%)",
          height: 360,
          position: "absolute",
          right: -80 - glowTravel * 0.65,
          top: 120,
          width: 360
        }}
      />
      <div
        style={{
          inset: 42,
          opacity: 0.2,
          position: "absolute"
        }}
      >
        <div
          style={{
            backgroundImage:
              "linear-gradient(rgba(129,164,209,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(129,164,209,0.18) 1px, transparent 1px)",
            backgroundSize: "90px 90px",
            borderRadius: 32,
            height: "100%",
            width: "100%"
          }}
        />
      </div>
    </>
  );
}

function ComparisonPanel({
  accent,
  eyebrow,
  scene,
  side
}: {
  accent: string;
  eyebrow: string;
  scene: Scene;
  side: "left" | "right";
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stagger = spring({
    fps,
    frame: frame - (side === "left" ? 2 : 8),
    config: {
      damping: 24,
      stiffness: 160
    }
  });

  return (
    <div
      style={{
        background: "rgba(10, 20, 31, 0.76)",
        border: "1px solid rgba(129, 164, 209, 0.16)",
        borderRadius: 34,
        boxShadow: "0 28px 60px rgba(0, 0, 0, 0.24)",
        overflow: "hidden",
        padding: 28,
        position: "relative",
        transform: `translateY(${interpolate(stagger, [0, 1], [24, 0])}px)`
      }}
    >
      <div
        style={{
          background: accent,
          height: 220,
          left: -40,
          position: "absolute",
          top: -40,
          width: 220
        }}
      />
      <div style={{ position: "relative" }}>
        <div
          style={{
            color: "#80a4ca",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase"
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            marginTop: 28
          }}
        >
          {scene.textBlocks.map((block, index) => (
            <div
              key={`${scene.id}-${side}-${index}`}
              style={{
                color: index === 0 ? "#f7fbff" : index === 1 ? "#8be6dc" : "#dbe7f4",
                fontSize: index === 0 ? 48 : index === 1 ? 30 : 24,
                fontWeight: index === 0 ? 800 : 700,
                letterSpacing: index === 0 ? "-0.04em" : "-0.02em",
                lineHeight: 1.08
              }}
            >
              {block.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
