package providers

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/creatorflow/automation-content/services/media-processing-service/internal/render"
)

type templateProvider struct{}

func (p templateProvider) Name() string {
	return "template"
}

func (p templateProvider) Supports(spec render.RequestSpec) bool {
	return spec.Mode == render.ModeTemplatePromo
}

func (p templateProvider) StartRender(_ context.Context, input StartRenderInput) (StartRenderResult, error) {
	if input.Spec.Options == nil {
		return StartRenderResult{}, fmt.Errorf("%w: missing options.templateRenderSpec for template provider", ErrNoProviderAvailable)
	}

	templateRenderSpec, ok := input.Spec.Options["templateRenderSpec"]
	if !ok {
		return StartRenderResult{}, fmt.Errorf("%w: missing options.templateRenderSpec for template provider", ErrNoProviderAvailable)
	}

	repoRoot, err := resolveRepoRoot()
	if err != nil {
		return StartRenderResult{}, fmt.Errorf("resolve repo root: %w", err)
	}

	outputDir := filepath.Join(repoRoot, ".creatorflow", "renders", input.WorkspaceID, input.JobID)
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		return StartRenderResult{}, fmt.Errorf("create render output dir: %w", err)
	}

	specPath := filepath.Join(outputDir, "template-render-spec.json")
	specJSON, err := json.MarshalIndent(templateRenderSpec, "", "  ")
	if err != nil {
		return StartRenderResult{}, fmt.Errorf("encode template render spec: %w", err)
	}

	if err := os.WriteFile(specPath, specJSON, 0o644); err != nil {
		return StartRenderResult{}, fmt.Errorf("write template render spec: %w", err)
	}

	outputPath := filepath.Join(outputDir, "render.mp4")
	renderScript := filepath.Join(repoRoot, "packages", "template-video-renderer", "scripts", "render-template-video.mjs")
	command := exec.Command("node", renderScript, "--input", specPath, "--output", outputPath)
	command.Dir = repoRoot
	output, err := command.CombinedOutput()
	if err != nil {
		return StartRenderResult{}, fmt.Errorf("template renderer command failed: %w: %s", err, strings.TrimSpace(string(output)))
	}

	if _, err := os.Stat(outputPath); err != nil {
		return StartRenderResult{}, fmt.Errorf("template renderer did not create output: %w", err)
	}

	posterPath := filepath.Join(outputDir, "poster.jpg")
	posterOutput, err := generatePoster(outputPath, posterPath)
	if err != nil {
		return StartRenderResult{}, fmt.Errorf("template poster generation failed: %w: %s", err, strings.TrimSpace(string(posterOutput)))
	}

	return StartRenderResult{
		ExternalJobID: fmt.Sprintf("template-stub-%s", input.JobID),
		LocalArtifact: &RenderedArtifact{
			FilePath:       outputPath,
			Metadata: map[string]any{
				"posterPath":     posterPath,
				"posterMimeType": "image/jpeg",
				"renderMode":     input.Spec.Mode,
				"rendererOutput": strings.TrimSpace(string(output)),
			},
			MimeType:       "video/mp4",
			PosterFilePath: posterPath,
			PosterMimeType: "image/jpeg",
		},
		ProviderName:  p.Name(),
	}, nil
}

func generatePoster(videoPath string, posterPath string) ([]byte, error) {
	command := exec.Command(
		"ffmpeg",
		"-y",
		"-ss", "00:00:00.500",
		"-i", videoPath,
		"-frames:v", "1",
		"-q:v", "2",
		posterPath,
	)
	return command.CombinedOutput()
}

func resolveRepoRoot() (string, error) {
	current, err := os.Getwd()
	if err != nil {
		return "", err
	}

	for {
		if _, err := os.Stat(filepath.Join(current, "package.json")); err == nil {
			if _, err := os.Stat(filepath.Join(current, "packages", "template-video-renderer")); err == nil {
				return current, nil
			}
		}

		parent := filepath.Dir(current)
		if parent == current {
			return "", fmt.Errorf("repository root not found")
		}
		current = parent
	}
}
