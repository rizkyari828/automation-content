package render

import (
	"errors"
	"fmt"
)

const (
	ModeTemplatePromo  = "template_promo"
	ModeTextToVideo    = "ai_text_to_video"
	ModeImageToVideo   = "ai_image_to_video"
	ModeVideoToVideo   = "ai_video_to_video"
	DefaultAspectRatio = "9:16"
)

var (
	ErrInvalidRenderMode     = errors.New("invalid render mode")
	ErrMissingPrompt         = errors.New("prompt is required for the selected render mode")
	ErrMissingSourceAsset    = errors.New("sourceAssetId is required for the selected render mode")
	ErrMissingPromptOrSource = errors.New("sourceAssetId or prompt is required")
	ErrMissingTemplateSpec   = errors.New("templateRenderSpec is required for template promo render mode")
)

type RequestSpec struct {
	AspectRatio       string         `json:"aspectRatio,omitempty"`
	DurationSeconds   int            `json:"durationSeconds,omitempty"`
	Mode              string         `json:"mode"`
	Options           map[string]any `json:"options,omitempty"`
	PreferredProvider string         `json:"preferredProvider,omitempty"`
	Prompt            string         `json:"prompt,omitempty"`
}

func SupportedModes() []string {
	return []string{
		ModeTemplatePromo,
		ModeTextToVideo,
		ModeImageToVideo,
		ModeVideoToVideo,
	}
}

func NormalizeSpec(input RequestSpec) RequestSpec {
	spec := input
	if spec.Mode == "" {
		spec.Mode = ModeTemplatePromo
	}
	if spec.AspectRatio == "" {
		spec.AspectRatio = DefaultAspectRatio
	}
	if spec.DurationSeconds < 0 {
		spec.DurationSeconds = 0
	}
	return spec
}

func ValidateSpec(spec RequestSpec, sourceAssetID string) error {
	switch spec.Mode {
	case ModeTemplatePromo:
		if spec.Options == nil {
			return ErrMissingTemplateSpec
		}
		if _, ok := spec.Options["templateRenderSpec"]; !ok {
			return ErrMissingTemplateSpec
		}
	case ModeTextToVideo:
		if spec.Prompt == "" {
			return ErrMissingPrompt
		}
	case ModeImageToVideo, ModeVideoToVideo:
		if sourceAssetID == "" {
			return ErrMissingSourceAsset
		}
		if spec.Prompt == "" {
			return ErrMissingPrompt
		}
	default:
		return fmt.Errorf("%w: %s", ErrInvalidRenderMode, spec.Mode)
	}

	return nil
}
