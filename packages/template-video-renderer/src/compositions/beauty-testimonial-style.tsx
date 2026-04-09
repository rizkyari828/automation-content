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

type TestimonialStyleProps = {
  plan: {
    product?: {
      ctaText?: string;
      imageUrl?: string;
      offerText?: string;
      presenterImageUrl?: string;
      priceText?: string;
      subtitle?: string;
      title?: string;
    };
    scenes: Scene[];
    templateKey: string;
  };
};

export function BeautyTestimonialStyle({ plan }: TestimonialStyleProps) {
  let from = 0;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #fff7f1 0%, #f5ede6 55%, #f2e7de 100%)",
        color: "#143047",
        fontFamily: "Plus Jakarta Sans, Manrope, sans-serif"
      }}
    >
      {plan.scenes.map((scene, index) => {
        const startFrom = from;
        from += scene.durationFrames;

        return (
          <Sequence key={scene.id} from={startFrom} durationInFrames={scene.durationFrames}>
            <TestimonialScene
              index={index}
              product={plan.product}
              scene={scene}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

function TestimonialScene({
  index,
  product,
  scene
}: {
  index: number;
  product?: TestimonialStyleProps["plan"]["product"];
  scene: Scene;
}) {
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
  const panelTranslateY = interpolate(reveal, [0, 1], [36, 0]);
  const panelOpacity = interpolate(reveal, [0, 1], [0.3, 1]);
  const subtitle = getSceneSubtitle(scene, product);

  return (
    <AbsoluteFill style={{ justifyContent: "space-between", overflow: "hidden", padding: 48 }}>
      <Backdrop index={index} />

      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          position: "relative"
        }}
      >
        <div>
          <div
            style={{
              color: "#7c92a8",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase"
            }}
          >
            UGC presenter style
          </div>
          <div
            style={{
              color: "#143047",
              fontSize: 58,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.02,
              marginTop: 14,
              maxWidth: 760
            }}
          >
            {scene.textBlocks[0]?.text ?? "Buat angle host yang terasa lebih personal."}
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.68)",
            border: "1px solid rgba(20,48,71,0.1)",
            borderRadius: 999,
            color: "#143047",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: "0.08em",
            padding: "14px 18px",
            textTransform: "uppercase"
          }}
        >
          {scene.layout}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "0.92fr 1.08fr",
          opacity: panelOpacity,
          position: "relative",
          transform: `translateY(${panelTranslateY}px)`
        }}
      >
        <HostCard product={product} scene={scene} />
        <StoryCard product={product} scene={scene} />
      </div>

      <SubtitleCard subtitle={subtitle} />
    </AbsoluteFill>
  );
}

function Backdrop({ index }: { index: number }) {
  return (
    <>
      <div
        style={{
          background:
            index % 2 === 0
              ? "radial-gradient(circle at center, rgba(245,154,83,0.28) 0%, rgba(245,154,83,0) 68%)"
              : "radial-gradient(circle at center, rgba(15,133,144,0.22) 0%, rgba(15,133,144,0) 70%)",
          height: 420,
          left: -90,
          position: "absolute",
          top: 160,
          width: 420
        }}
      />
      <div
        style={{
          background: "rgba(255,255,255,0.5)",
          border: "1px solid rgba(20,48,71,0.08)",
          borderRadius: 42,
          inset: 38,
          position: "absolute"
        }}
      />
    </>
  );
}

function HostCard({
  product,
  scene
}: {
  product?: TestimonialStyleProps["plan"]["product"];
  scene: Scene;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const float = spring({
    fps,
    frame: frame + 6,
    config: {
      damping: 24,
      stiffness: 160
    }
  });
  const offsetY = interpolate(Math.sin(frame / 10), [-1, 1], [10, -10]);
  const scale = 1.01 + interpolate(Math.sin(frame / 18), [-1, 1], [-0.02, 0.025]);
  const bubbleReveal = spring({
    fps,
    frame: frame - 12,
    config: {
      damping: 20,
      stiffness: 180
    }
  });

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.84)",
        border: "1px solid rgba(20,48,71,0.1)",
        borderRadius: 36,
        boxShadow: "0 28px 64px rgba(20, 48, 71, 0.12)",
        minHeight: 980,
        overflow: "hidden",
        padding: 24,
        position: "relative"
      }}
    >
      <div
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(20,48,71,0.25) 100%)",
          borderRadius: 30,
          height: 710,
          overflow: "hidden",
          position: "relative",
          transform: `translateY(${offsetY * float}px) scale(${scale})`
        }}
      >
        {product?.presenterImageUrl ? (
          <Img
            src={product.presenterImageUrl}
            style={{
              height: "100%",
              objectFit: "cover",
              width: "100%"
            }}
          />
        ) : (
          <div
            style={{
              alignItems: "center",
              background:
                "radial-gradient(circle at top, rgba(255,255,255,0.5) 0%, rgba(20,48,71,0.15) 34%, rgba(20,48,71,0.45) 100%)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "center",
              width: "100%"
            }}
          >
            <div
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.45) 100%)",
                borderRadius: "50%",
                height: 210,
                width: 210
              }}
            />
            <div
              style={{
                background: "rgba(255,255,255,0.34)",
                borderRadius: 999,
                height: 360,
                marginTop: 24,
                width: 280
              }}
            />
          </div>
        )}
        <div
          style={{
            background: "linear-gradient(180deg, rgba(20,48,71,0.04) 0%, rgba(20,48,71,0.72) 100%)",
            inset: 0,
            position: "absolute"
          }}
        />
        <div
          style={{
            alignItems: "center",
            background: "rgba(255,255,255,0.82)",
            borderRadius: 999,
            bottom: 18,
            color: "#143047",
            display: "flex",
            fontSize: 18,
            fontWeight: 800,
            gap: 10,
            left: 18,
            letterSpacing: "0.08em",
            padding: "12px 16px",
            position: "absolute",
            textTransform: "uppercase"
          }}
        >
          <div
            style={{
              background: "#0f8590",
              borderRadius: "50%",
              height: 10,
              width: 10
            }}
          />
          Creator voice
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.88)",
          border: "1px solid rgba(20,48,71,0.08)",
          borderRadius: 24,
          color: "#143047",
          marginTop: 18,
          padding: "18px 20px",
          position: "relative",
          transform: `translateY(${interpolate(bubbleReveal, [0, 1], [16, 0])}px)`,
          width: "82%"
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Talking point
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25, marginTop: 8 }}>
          {scene.textBlocks[1]?.text ?? product?.subtitle ?? product?.offerText ?? "Tambahkan sudut pandang creator di scene ini."}
        </div>
      </div>
    </div>
  );
}

function StoryCard({
  product,
  scene
}: {
  product?: TestimonialStyleProps["plan"]["product"];
  scene: Scene;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chips = [scene.kind.replaceAll("_", " "), product?.offerText, product?.priceText].filter(Boolean).slice(0, 3) as string[];

  return (
    <div
      style={{
        background: "rgba(255,252,248,0.88)",
        border: "1px solid rgba(20,48,71,0.08)",
        borderRadius: 36,
        boxShadow: "0 28px 64px rgba(20, 48, 71, 0.08)",
        display: "flex",
        flexDirection: "column",
        gap: 22,
        minHeight: 980,
        overflow: "hidden",
        padding: 30,
        position: "relative"
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 12
        }}
      >
        {chips.map((chip, index) => (
          <div
            key={chip}
            style={{
              background: index === 0 ? "rgba(15,133,144,0.12)" : "rgba(245,154,83,0.12)",
              border: index === 0 ? "1px solid rgba(15,133,144,0.16)" : "1px solid rgba(245,154,83,0.16)",
              borderRadius: 999,
              color: "#143047",
              fontSize: 16,
              fontWeight: 700,
              padding: "10px 14px"
            }}
          >
            {chip}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {scene.textBlocks.map((block, index) => {
          const reveal = spring({
            fps,
            frame: frame - index * 5,
            config: {
              damping: 22,
              stiffness: 170
            }
          });

          return (
            <div
              key={`${scene.id}-${block.role}-${index}`}
              style={{
                color: index === 0 ? "#143047" : "#51697f",
                fontSize: index === 0 ? 54 : block.role === "cta" ? 34 : 28,
                fontWeight: index === 0 ? 800 : block.role === "cta" ? 800 : 600,
                letterSpacing: index === 0 ? "-0.04em" : "-0.02em",
                lineHeight: index === 0 ? 1.04 : 1.3,
                opacity: interpolate(reveal, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(reveal, [0, 1], [22, 0])}px)`
              }}
            >
              {block.text}
            </div>
          );
        })}
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.78)",
          border: "1px solid rgba(20,48,71,0.08)",
          borderRadius: 30,
          display: "grid",
          gap: 18,
          gridTemplateColumns: "0.7fr 1fr",
          marginTop: "auto",
          minHeight: 280,
          overflow: "hidden",
          padding: 18,
          position: "relative"
        }}
      >
        <div
          style={{
            background: "linear-gradient(180deg, rgba(245,154,83,0.18) 0%, rgba(15,133,144,0.08) 100%)",
            borderRadius: 24,
            overflow: "hidden",
            position: "relative"
          }}
        >
          {product?.imageUrl ? (
            <Img
              src={product.imageUrl}
              style={{
                height: "100%",
                objectFit: "cover",
                transform: `translateY(${interpolate(Math.sin(frame / 12), [-1, 1], [-8, 8])}px) scale(1.08)`,
                width: "100%"
              }}
            />
          ) : (
            <div
              style={{
                alignItems: "center",
                color: "#143047",
                display: "flex",
                fontSize: 18,
                fontWeight: 700,
                height: "100%",
                justifyContent: "center",
                padding: 16,
                textAlign: "center"
              }}
            >
              Tambahkan gambar produk untuk product spotlight
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ color: "#7c92a8", fontSize: 16, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Product spotlight
          </div>
          <div style={{ color: "#143047", fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, marginTop: 8 }}>
            {product?.title ?? "Produk utama"}
          </div>
          <div style={{ color: "#51697f", fontSize: 22, lineHeight: 1.35, marginTop: 10 }}>
            {product?.offerText ?? product?.subtitle ?? "Masukkan offer atau subtitle agar card produk terasa lebih meyakinkan."}
          </div>
          <div
            style={{
              alignSelf: "flex-start",
              background: "#143047",
              borderRadius: 999,
              color: "#ffffff",
              fontSize: 18,
              fontWeight: 800,
              marginTop: 18,
              padding: "14px 18px"
            }}
          >
            {product?.ctaText ?? product?.priceText ?? "CTA"}
          </div>
        </div>
      </div>
    </div>
  );
}

function SubtitleCard({ subtitle }: { subtitle: string }) {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        alignItems: "center",
        background: "rgba(20,48,71,0.86)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 24,
        color: "#ffffff",
        display: "flex",
        gap: 14,
        minHeight: 82,
        padding: "18px 20px",
        position: "relative"
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.14)",
          borderRadius: 999,
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: "0.08em",
          padding: "10px 14px",
          textTransform: "uppercase"
        }}
      >
        Subtitle
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
        {subtitle}
      </div>
      <div
        style={{
          background: "linear-gradient(90deg, #f59a53 0%, #0f8590 100%)",
          borderRadius: 999,
          bottom: 10,
          height: 4,
          left: 20,
          opacity: 0.82,
          position: "absolute",
          width: `${Math.max(96, Math.round(interpolate(Math.min(frame, 90), [0, 90], [96, 520])))}px`
        }}
      />
    </div>
  );
}

function getSceneSubtitle(
  scene: Scene,
  product?: TestimonialStyleProps["plan"]["product"]
) {
  return (
    scene.textBlocks.find((block) => block.role === "caption" || block.role === "supporting")?.text ??
    product?.subtitle ??
    product?.offerText ??
    scene.textBlocks[0]?.text ??
    "Gunakan presenter card ini untuk angle creator-style yang terasa lebih personal."
  );
}
