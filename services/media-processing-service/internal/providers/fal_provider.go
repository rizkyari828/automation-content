package providers

import (
	"context"
	"fmt"

	"github.com/creatorflow/automation-content/services/media-processing-service/internal/render"
)

type falProvider struct {
	configured bool
	modelSlug  string
	name       string
}

func newFalProvider(name string, configured bool, modelSlug string) Provider {
	return falProvider{
		configured: configured,
		modelSlug:  modelSlug,
		name:       name,
	}
}

func (p falProvider) Name() string {
	return p.name
}

func (p falProvider) Supports(spec render.RequestSpec) bool {
	return spec.Mode == render.ModeTextToVideo ||
		spec.Mode == render.ModeImageToVideo ||
		spec.Mode == render.ModeVideoToVideo
}

func (p falProvider) StartRender(_ context.Context, input StartRenderInput) (StartRenderResult, error) {
	if !p.configured {
		return StartRenderResult{}, fmt.Errorf("%w: %s", ErrProviderNotConfigured, p.name)
	}

	return StartRenderResult{}, fmt.Errorf(
		"%w: %s uses model %s for mode %s",
		ErrProviderNotImplemented,
		p.name,
		p.modelSlug,
		input.Spec.Mode,
	)
}
