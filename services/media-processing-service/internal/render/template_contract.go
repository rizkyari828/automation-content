package render

import "fmt"

const (
	TemplateObjectivePromoOffer      = "promo_offer"
	TemplateObjectiveProblemSolution = "problem_solution"
	TemplateObjectiveTestimonial     = "testimonial_style"
	TemplateObjectiveComparison      = "comparison"

	TemplateNicheBeauty  = "beauty"
	TemplateNicheGadget  = "gadget"
	TemplateNicheFashion = "fashion"
)

type TemplateRenderSpec struct {
	AspectRatio     string             `json:"aspectRatio"`
	BrandTone       string             `json:"brandTone,omitempty"`
	Branding        *TemplateBranding  `json:"branding,omitempty"`
	DurationSeconds int                `json:"durationSeconds,omitempty"`
	MusicMode       string             `json:"musicMode,omitempty"`
	Niche           string             `json:"niche"`
	Objective       string             `json:"objective"`
	Product         TemplateProduct    `json:"product"`
	RenderMode      string             `json:"renderMode"`
	ScenePlan       *TemplateScenePlan `json:"scenePlan,omitempty"`
	Script          TemplateScript     `json:"script"`
	TemplateKey     string             `json:"templateKey"`
	Version         int                `json:"version"`
}

type TemplateProduct struct {
	CTA          string   `json:"ctaText,omitempty"`
	Description  string   `json:"description,omitempty"`
	ImageAssetIDs []string `json:"imageAssetIds,omitempty"`
	OfferText    string   `json:"offerText,omitempty"`
	PriceText    string   `json:"priceText,omitempty"`
	Subtitle     string   `json:"subtitle,omitempty"`
	Title        string   `json:"title"`
}

type TemplateScript struct {
	Body          string   `json:"body"`
	CTA           string   `json:"cta"`
	Hook          string   `json:"hook"`
	SubtitleLines []string `json:"subtitleLines,omitempty"`
}

type TemplateBranding struct {
	FontFamily string   `json:"fontFamily,omitempty"`
	LogoAssetID string   `json:"logoAssetId,omitempty"`
	Palette    []string `json:"palette,omitempty"`
}

type TemplateScenePlan struct {
	AspectRatio     string                `json:"aspectRatio"`
	DurationSeconds int                   `json:"durationSeconds,omitempty"`
	MusicCue        *TemplateMusicCue     `json:"musicCue,omitempty"`
	Scenes          []TemplateScene       `json:"scenes"`
	TemplateKey     string                `json:"templateKey"`
	Version         int                   `json:"version"`
}

type TemplateMusicCue struct {
	AssetID string  `json:"assetId,omitempty"`
	Mode    string  `json:"mode,omitempty"`
	Volume  float64 `json:"volume,omitempty"`
}

type TemplateScene struct {
	BackgroundAssetID string              `json:"backgroundAssetId,omitempty"`
	DurationFrames    int                 `json:"durationFrames"`
	ID                string              `json:"id"`
	Kind              string              `json:"kind"`
	Layout            string              `json:"layout,omitempty"`
	SubtitleCue       *TemplateSubtitleCue `json:"subtitleCue,omitempty"`
	TextBlocks        []TemplateTextBlock `json:"textBlocks,omitempty"`
}

type TemplateSubtitleCue struct {
	EndFrame   int    `json:"endFrame,omitempty"`
	StartFrame int    `json:"startFrame,omitempty"`
	Text       string `json:"text,omitempty"`
}

type TemplateTextBlock struct {
	Animation string `json:"animation,omitempty"`
	Role      string `json:"role,omitempty"`
	Text      string `json:"text"`
}

func BuildTemplateKey(niche string, objective string, variant string) string {
	if variant == "" {
		return fmt.Sprintf("%s/%s", niche, objective)
	}

	return fmt.Sprintf("%s/%s/%s", niche, objective, variant)
}
