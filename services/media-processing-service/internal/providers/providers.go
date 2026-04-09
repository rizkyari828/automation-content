package providers

import (
	"context"
	"errors"
	"fmt"
	"slices"

	"github.com/creatorflow/automation-content/services/media-processing-service/internal/render"
)

var (
	ErrNoProviderAvailable    = errors.New("no render provider available for the requested job")
	ErrProviderNotConfigured  = errors.New("render provider is not configured")
	ErrProviderNotImplemented = errors.New("render provider adapter is not implemented yet")
)

type StartRenderInput struct {
	JobID         string
	ScriptID      string
	SourceAssetID string
	Spec          render.RequestSpec
	WorkspaceID   string
}

type StartRenderResult struct {
	ExternalJobID string
	LocalArtifact *RenderedArtifact
	ProviderName  string
}

type RenderedArtifact struct {
	FilePath       string
	Metadata       map[string]any
	MimeType       string
	PosterFilePath string
	PosterMimeType string
}

type Provider interface {
	Name() string
	Supports(spec render.RequestSpec) bool
	StartRender(ctx context.Context, input StartRenderInput) (StartRenderResult, error)
}

type Registry struct {
	defaultProvider string
	providers       map[string]Provider
}

func NewRegistry(defaultProvider string, inputProviders ...Provider) *Registry {
	providersByName := make(map[string]Provider, len(inputProviders))
	for _, provider := range inputProviders {
		providersByName[provider.Name()] = provider
	}

	return &Registry{
		defaultProvider: defaultProvider,
		providers:       providersByName,
	}
}

func (r *Registry) Resolve(spec render.RequestSpec) (Provider, error) {
	if spec.PreferredProvider != "" {
		provider, ok := r.providers[spec.PreferredProvider]
		if !ok {
			return nil, fmt.Errorf("%w: %s", ErrNoProviderAvailable, spec.PreferredProvider)
		}
		if !provider.Supports(spec) {
			return nil, fmt.Errorf("%w: %s does not support %s", ErrNoProviderAvailable, spec.PreferredProvider, spec.Mode)
		}
		return provider, nil
	}

	if r.defaultProvider != "" {
		if provider, ok := r.providers[r.defaultProvider]; ok && provider.Supports(spec) {
			return provider, nil
		}
	}

	names := make([]string, 0, len(r.providers))
	for name := range r.providers {
		names = append(names, name)
	}
	slices.Sort(names)

	for _, name := range names {
		provider := r.providers[name]
		if provider.Supports(spec) {
			return provider, nil
		}
	}

	return nil, fmt.Errorf("%w: mode=%s", ErrNoProviderAvailable, spec.Mode)
}

type stubProvider struct {
	configured bool
	name       string
	supported  map[string]struct{}
}

func newStubProvider(name string, configured bool, modes ...string) Provider {
	supported := make(map[string]struct{}, len(modes))
	for _, mode := range modes {
		supported[mode] = struct{}{}
	}

	return stubProvider{
		configured: configured,
		name:       name,
		supported:  supported,
	}
}

func (p stubProvider) Name() string {
	return p.name
}

func (p stubProvider) Supports(spec render.RequestSpec) bool {
	_, ok := p.supported[spec.Mode]
	return ok
}

func (p stubProvider) StartRender(_ context.Context, _ StartRenderInput) (StartRenderResult, error) {
	if !p.configured {
		return StartRenderResult{}, fmt.Errorf("%w: %s", ErrProviderNotConfigured, p.name)
	}

	return StartRenderResult{}, fmt.Errorf("%w: %s", ErrProviderNotImplemented, p.name)
}

type devNoopProvider struct{}

func NewDevNoopProvider() Provider {
	return devNoopProvider{}
}

func NewTemplateProvider() Provider {
	return templateProvider{}
}

func NewFalVeoFastProvider(configured bool) Provider {
	return newFalProvider("fal_veo31_fast", configured, "fal-ai/veo-3.1/fast")
}

func NewFalSoraProvider(configured bool) Provider {
	return newFalProvider("fal_sora2", configured, "fal-ai/sora-2")
}

func NewVeoProvider(configured bool) Provider {
	return newStubProvider("veo3", configured, render.ModeTextToVideo, render.ModeImageToVideo, render.ModeVideoToVideo)
}

func NewSoraProvider(configured bool) Provider {
	return newStubProvider("sora", configured, render.ModeTextToVideo, render.ModeImageToVideo, render.ModeVideoToVideo)
}

func NewRunwayProvider(configured bool) Provider {
	return newStubProvider("runway", configured, render.ModeTextToVideo, render.ModeImageToVideo, render.ModeVideoToVideo)
}

func NewLumaProvider(configured bool) Provider {
	return newStubProvider("luma", configured, render.ModeTextToVideo, render.ModeImageToVideo)
}

func (p devNoopProvider) Name() string {
	return "dev_noop"
}

func (p devNoopProvider) Supports(_ render.RequestSpec) bool {
	return true
}

func (p devNoopProvider) StartRender(_ context.Context, input StartRenderInput) (StartRenderResult, error) {
	return StartRenderResult{
		ExternalJobID: fmt.Sprintf("dev-noop-%s", input.JobID),
		ProviderName:  p.Name(),
	}, nil
}
