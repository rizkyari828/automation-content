import React from "react";
import { Composition } from "remotion";

import { BeautyPromoOffer } from "./compositions/beauty-promo-offer";
import { BeautyTestimonialStyle } from "./compositions/beauty-testimonial-style";
import { GadgetComparison } from "./compositions/gadget-comparison";
import {
  sampleBeautyPromoPlan,
  sampleBeautyTestimonialPlan,
  sampleGadgetComparisonPlan
} from "./lib/sample-plan";

const beautyTotalFrames = sampleBeautyPromoPlan.scenes.reduce(
  (sum, scene) => sum + scene.durationFrames,
  0
);
const beautyTestimonialTotalFrames = sampleBeautyTestimonialPlan.scenes.reduce(
  (sum, scene) => sum + scene.durationFrames,
  0
);
const gadgetTotalFrames = sampleGadgetComparisonPlan.scenes.reduce(
  (sum, scene) => sum + scene.durationFrames,
  0
);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="creatorflow-template-video"
        component={BeautyPromoOffer}
        durationInFrames={beautyTotalFrames}
        fps={30}
        height={1920}
        width={1080}
        defaultProps={{
          plan: sampleBeautyPromoPlan
        }}
      />
      <Composition
        id="creatorflow-gadget-comparison"
        component={GadgetComparison}
        durationInFrames={gadgetTotalFrames}
        fps={30}
        height={1920}
        width={1080}
        defaultProps={{
          plan: sampleGadgetComparisonPlan
        }}
      />
      <Composition
        id="creatorflow-beauty-testimonial"
        component={BeautyTestimonialStyle}
        durationInFrames={beautyTestimonialTotalFrames}
        fps={30}
        height={1920}
        width={1080}
        defaultProps={{
          plan: sampleBeautyTestimonialPlan
        }}
      />
    </>
  );
};

export default RemotionRoot;
