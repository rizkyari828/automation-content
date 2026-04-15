"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import SessionPanel from "../auth/session-panel.jsx";
import { useWebLocale, useWebMessages } from "../i18n/web-locale.jsx";
import ArgonPage, { ArgonFooter } from "../layout/argon-page.jsx";

const DEFAULT_WORKFLOW_MODE = "assisted";
const DEFAULT_STUDIO_STEP = "mode";
const STUDIO_STORAGE_KEY = "creatorflow.content-studio.session.v1";
const DEFAULT_TEMPLATE_SCOPE = "official";
const DEFAULT_CONNECTED_ACCOUNT_FORM = {
  accountLabel: "",
  externalAccountId: "",
  platformCode: "tiktok"
};
const INITIAL_SESSION_STATE = {
  authenticated: false,
  authorization: null,
  loading: true,
  message: null
};

const DEFAULT_FORM = {
  brandTone: "direct",
  ctaText: "",
  niche: "beauty",
  objective: "promo_offer",
  offerText: "",
  presenterImageUrl: "",
  productImageAssetIds: [],
  productImageUrl: "",
  priceText: "",
  sourceType: "product",
  title: "",
  productUrl: "",
  promptHint: "",
  videoEngine: "template_local",
  languageCode: "id"
};

const DEFAULT_TEMPLATE_EDITOR_FORM = {
  body: "",
  brandTone: "direct",
  ctaText: "",
  id: null,
  key: "",
  niche: "beauty",
  objective: "promo_offer",
  offerText: "",
  presenterImageUrl: "",
  productImageUrl: "",
  priceText: "",
  promptHint: "",
  sourceType: "product",
  status: "draft",
  title: "",
  useCaseBadge: "",
  variableTitle: ""
};

const MODE_ACCENTS = {
  assisted: {
    badgeClass: "bg-gradient-success",
    borderColor: "rgba(15, 133, 144, 0.28)",
    iconClass: "ni ni-atom"
  },
  manual: {
    badgeClass: "bg-gradient-dark",
    borderColor: "rgba(16, 44, 69, 0.2)",
    iconClass: "ni ni-settings"
  },
  quick: {
    badgeClass: "bg-gradient-warning",
    borderColor: "rgba(245, 154, 83, 0.28)",
    iconClass: "ni ni-button-play"
  }
};

const STATUS_BADGE_CLASS = {
  archived: "bg-gradient-secondary",
  draft: "bg-gradient-warning",
  ready: "bg-gradient-success"
};
const AUTH_FAILURE_PATTERNS = [
  "missing bearer token",
  "missing refresh token",
  "invalid or expired access token",
  "session expired",
  "unable to load session"
];
const STUDIO_STEP_ORDER = ["mode", "brief", "review", "templates", "render"];
const SERVER_AUTOSAVE_DEBOUNCE_MS = 3000;
const VIDEO_ENGINE_CATALOG = {
  fal_sora2: {
    preferredProvider: "fal_sora2",
    readiness: "planned",
    renderMode: "ai_text_to_video"
  },
  fal_veo31_fast: {
    preferredProvider: "fal_veo31_fast",
    readiness: "planned",
    renderMode: "ai_text_to_video"
  },
  template_local: {
    preferredProvider: "template",
    readiness: "ready",
    renderMode: "template_promo"
  }
};

function createStudioSessionId() {
  if (typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `studio-${Date.now()}`;
}

function createTemplateEditorForm(template) {
  if (!template) {
    return {
      ...DEFAULT_TEMPLATE_EDITOR_FORM
    };
  }

  return {
    body: template.body ?? "",
    brandTone: template.variables?.brandTone ?? "direct",
    ctaText: template.variables?.ctaText ?? "",
    id: template.id ?? null,
    key: template.key ?? "",
    niche: template.niche ?? "beauty",
    objective: template.objective ?? "promo_offer",
    offerText: template.variables?.offerText ?? "",
    presenterImageUrl: template.variables?.presenterImageUrl ?? "",
    productImageUrl: template.variables?.productImageUrl ?? "",
    priceText: template.variables?.priceText ?? "",
    promptHint: template.variables?.promptHint ?? "",
    sourceType: template.variables?.sourceType ?? "product",
    status: template.status ?? "draft",
    title: template.title ?? "",
    useCaseBadge: template.useCaseBadge ?? "",
    variableTitle: template.variables?.title ?? ""
  };
}

function getVideoEngineConfig(engine) {
  return VIDEO_ENGINE_CATALOG[engine] ?? VIDEO_ENGINE_CATALOG.template_local;
}

function getReviewTabOptions(copy, workflowMode) {
  const baseTabs = Array.isArray(copy.reviewTabs) ? copy.reviewTabs : [];
  const findTab = (value, fallback) => (
    baseTabs.find((tab) => tab.value === value) ?? {
      value,
      label: fallback
    }
  );

  if (workflowMode === "quick") {
    return [findTab("validation", "Validation")];
  }

  if (workflowMode === "manual") {
    return [
      findTab("script", "Script"),
      findTab("videoPlan", "Video plan"),
      findTab("validation", "Validation"),
      {
        value: "rawSpec",
        label: copy.reviewRawSpecLabel ?? "Raw spec"
      }
    ];
  }

  return [
    findTab("script", "Script"),
    findTab("videoPlan", "Video plan"),
    findTab("validation", "Validation")
  ];
}

function formatDateLabel(locale, value) {
  if (!value) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return null;
  }
}

function getRenderOutputUrl(renderJob) {
  if (!renderJob?.jobId || renderJob.status !== "completed") {
    return null;
  }

  return `/api/media/render-jobs/${renderJob.jobId}/output`;
}

function getRenderPosterUrl(renderJob) {
  if (!renderJob?.jobId || renderJob.status !== "completed") {
    return null;
  }

  return `/api/media/render-jobs/${renderJob.jobId}/poster`;
}

function formatDurationLabel(totalSeconds) {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  if (minutes === 0) {
    return `${safeSeconds}s`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function buildAssetContentUrl(assetId) {
  if (!assetId || typeof window === "undefined") {
    return "";
  }

  return new URL(`/api/assets/${assetId}/content`, window.location.origin).toString();
}

function normalizeRenderBatchJobs(renderBatch) {
  if (!renderBatch || typeof renderBatch !== "object" || !Array.isArray(renderBatch.jobs)) {
    return [];
  }

  return renderBatch.jobs.filter((job) => job && typeof job === "object");
}

function calculateRenderProgress(renderBatch, renderJob) {
  const jobs = normalizeRenderBatchJobs(renderBatch);
  const sceneJobs = jobs.filter((job) => job.taskType === "scene");

  if (sceneJobs.length === 0) {
    if (renderJob?.status === "completed") {
      return 100;
    }

    if (renderJob?.status === "failed") {
      return 100;
    }

    if (renderJob?.status === "processing") {
      return 68;
    }

    if (renderJob?.status === "queued") {
      return 12;
    }

    return 0;
  }

  const totalWeight = sceneJobs.reduce((sum, job) => sum + normalizeDuration(job.durationFrames, 90), 0);
  if (totalWeight <= 0) {
    return 0;
  }

  const weightedProgress = sceneJobs.reduce((sum, job) => {
    const weight = normalizeDuration(job.durationFrames, 90);
    const status = typeof job.status === "string" ? job.status : "";

    if (status === "completed" || status === "failed") {
      return sum + weight;
    }

    if (status === "processing") {
      return sum + weight * 0.58;
    }

    if (status === "queued") {
      return sum + weight * 0.14;
    }

    return sum;
  }, 0);

  let percent = Math.round((weightedProgress / totalWeight) * 100);

  if (renderBatch?.status === "completed" && renderJob?.status !== "completed") {
    percent = Math.max(percent, 94);
  }

  if (renderJob?.status === "completed") {
    percent = 100;
  } else if (renderJob?.status === "failed") {
    percent = Math.max(percent, 100);
  } else if (renderBatch?.status === "processing" || renderJob?.status === "processing") {
    percent = Math.max(percent, 8);
  } else if (renderBatch?.status === "queued" || renderJob?.status === "queued") {
    percent = Math.max(percent, 4);
  }

  return Math.max(0, Math.min(100, percent));
}

function createPublishFileName(plan) {
  const templateKey = plan?.templateRenderSpec?.templateKey ?? "creatorflow-video";
  return `${String(templateKey).replaceAll("/", "-")}.mp4`;
}

function HeroCard({ copy }) {
  return (
    <div
      className="card h-100 border-0 text-white cf-content-hero"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(245, 154, 83, 0.32), transparent 28%), linear-gradient(135deg, #102c45 0%, #0f4f64 45%, #0f8590 100%)",
        boxShadow: "0 26px 56px rgba(16, 44, 69, 0.24)"
      }}
    >
      <div className="card-body p-4">
        <p className="text-xs text-uppercase mb-2 opacity-8" style={{ letterSpacing: "0.18em" }}>
          {copy.heroEyebrow}
        </p>
        <h3 className="text-white mb-3">{copy.heroTitle}</h3>
        <p className="mb-4 opacity-8 cf-content-hero-body">{copy.heroBody}</p>
        <div className="row g-3">
          {copy.heroStats.map((item) => (
            <div key={item.label} className="col-sm-4">
              <div className="cf-content-stat">
                <span className="text-xs text-uppercase opacity-7" style={{ letterSpacing: "0.12em" }}>
                  {item.label}
                </span>
                <h5 className="text-white mb-0 mt-1">{item.value}</h5>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudioFlowNav({
  activeStep,
  copy,
  maxReachedStepIndex,
  onSelectStep,
  steps,
  workflowMode
}) {
  const activeStepIndex = Math.max(
    0,
    steps.findIndex((step) => step.value === activeStep)
  );
  const progressPercent = steps.length > 1
    ? Math.round((activeStepIndex / (steps.length - 1)) * 100)
    : 0;

  return (
    <div className="card cf-surface-card">
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h6 className="mb-1">{copy.studioFlowTitle}</h6>
            <p className="text-sm mb-0">{copy.studioFlowBody}</p>
          </div>
          <span className="badge bg-light text-dark border">
            {copy.workflowModeLabels[workflowMode] ?? workflowMode}
          </span>
        </div>
        <div className="cf-content-flow-progress mt-3" role="presentation">
          <div className="cf-content-flow-progress-bar" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="cf-content-flow-breadcrumb mt-2">
          {steps.map((step, index) => (
            <span
              key={`crumb-${step.value}`}
              className={`cf-content-flow-crumb${index === activeStepIndex ? " is-active" : index < activeStepIndex ? " is-complete" : ""}`}
            >
              {step.label}
            </span>
          ))}
        </div>
        <div className="cf-content-flow-nav mt-3">
          {steps.map((step, index) => {
            const active = step.value === activeStep;
            const unlocked = index <= maxReachedStepIndex;

            return (
              <button
                key={step.value}
                type="button"
                className={`cf-content-flow-step${active ? " is-active" : ""}${unlocked ? "" : " is-locked"}`}
                onClick={() => (unlocked ? onSelectStep(step.value) : undefined)}
                disabled={!unlocked}
              >
                <span className="cf-content-flow-step-index">{String(index + 1).padStart(2, "0")}</span>
                <strong>{step.label}</strong>
                <span>{step.body}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StageIntroCard({
  actions,
  body,
  eyebrow,
  progressLabel,
  title
}) {
  return (
    <div className="card cf-surface-card">
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-2">{eyebrow}</p>
            <h5 className="mb-1">{title}</h5>
            <p className="text-sm mb-0">{body}</p>
          </div>
          <div className="d-flex flex-column align-items-start align-items-md-end gap-2">
            <span className="badge bg-light text-dark border">{progressLabel}</span>
            {actions?.length ? (
              <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                {actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className={`btn btn-sm mb-0 ${action.variant === "primary" ? "btn-primary" : "btn-outline-dark"}`}
                    onClick={action.onClick}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeSelectorCard({
  copy,
  lastSavedAt,
  locale,
  restoredDraft,
  workflowMode,
  onSelectMode
}) {
  const savedLabel = useMemo(() => formatDateLabel(locale, lastSavedAt), [locale, lastSavedAt]);

  return (
    <div className="card h-100 cf-surface-card cf-premium-card">
      <div className="card-header pb-0">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h6 className="mb-1">{copy.modeSelectorTitle}</h6>
            <p className="text-sm mb-0">{copy.modeSelectorBody}</p>
          </div>
          <span className="badge bg-light text-dark border">{copy.modeSelectorBadge}</span>
        </div>
      </div>
      <div className="card-body p-3">
        <div className="cf-content-mode-grid">
          {copy.workflowModes.map((mode) => {
            const selected = mode.value === workflowMode;
            const accent = MODE_ACCENTS[mode.value] ?? MODE_ACCENTS.assisted;

            return (
              <button
                key={mode.value}
                type="button"
                className={`cf-content-mode-card text-start${selected ? " is-selected" : ""}`}
                onClick={() => onSelectMode(mode.value)}
                style={selected ? { borderColor: accent.borderColor } : undefined}
              >
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div
                    className="icon icon-shape icon-sm border-radius-md text-center"
                    style={{
                      background: selected ? "rgba(15, 133, 144, 0.12)" : "#f3f6fa",
                      color: "#102c45"
                    }}
                  >
                    <i className={`${accent.iconClass} text-sm`} />
                  </div>
                  <span className={`badge ${accent.badgeClass}`}>{mode.badge}</span>
                </div>
                <h6 className="text-sm mb-1 mt-3">{mode.title}</h6>
                <p className="text-xs text-secondary mb-3">{mode.body}</p>
                <span className={`badge ${selected ? accent.badgeClass : "bg-light text-dark border"}`}>
                  {selected ? copy.modeSelected : mode.cta}
                </span>
              </button>
            );
          })}
        </div>
        <div className="cf-content-session-note mt-3">
          <div>
            <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
              {copy.sessionStateTitle}
            </p>
            <p className="text-sm mb-0">
              {restoredDraft
                ? copy.sessionStateRestored.replace("{{savedAt}}", savedLabel ?? copy.sessionStateFreshFallback)
                : copy.sessionStateFresh}
            </p>
          </div>
          <span className="badge bg-light text-dark border">
            {copy.workflowModeLabels[workflowMode] ?? workflowMode}
          </span>
        </div>
      </div>
    </div>
  );
}

function PlaybookCard({ copy }) {
  return (
    <div className="card h-100 cf-surface-card">
      <div className="card-header pb-0">
        <h6 className="mb-1">{copy.playbookTitle}</h6>
        <p className="text-sm mb-0">{copy.playbookBody}</p>
      </div>
      <div className="card-body p-3">
        <ul className="list-group">
          {copy.playbooks.map((item, index) => (
            <li
              key={item.title}
              className={`list-group-item border-0 px-0${index < copy.playbooks.length - 1 ? " mb-3" : ""}`}
            >
              <div className="d-flex align-items-start">
                <div
                  className="icon icon-shape icon-sm border-radius-md text-center me-3"
                  style={{ background: item.iconBackground }}
                >
                  <i className={`${item.icon} text-sm`} style={{ color: item.iconColor }} />
                </div>
                <div>
                  <h6 className="text-sm mb-1">{item.title}</h6>
                  <p className="text-xs text-secondary mb-1">{item.body}</p>
                  <span className="badge bg-light text-dark border">{item.badge}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function GeneratorCard({
  authLocked,
  authMessage,
  canUploadAssets,
  copy,
  form,
  locale,
  modeCopy,
  onChange,
  onProductAssetUpload,
  onPreviewPlan,
  onReset,
  onSwitchMode,
  productAssetUploadState,
  onSubmit,
  planning,
  submitting,
  workflowModes,
  workflowMode
}) {
  const primaryActionLabel = copy.actions.generateByMode?.[workflowMode] ?? copy.actions.generate;

  return (
    <div className="card h-100 cf-surface-card">
      <div className="card-header pb-0">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h6 className="mb-1">{copy.generatorTitle}</h6>
            <p className="text-sm mb-0">{copy.generatorBody}</p>
          </div>
          <span className={`badge ${MODE_ACCENTS[workflowMode]?.badgeClass ?? "bg-gradient-success"}`}>
            {copy.workflowModeLabels[workflowMode] ?? workflowMode}
          </span>
        </div>
        <div className="d-flex flex-wrap gap-2 mt-3">
          {workflowModes.map((mode) => (
            <button
              key={mode.value}
              type="button"
              className={`btn btn-sm mb-0 ${workflowMode === mode.value ? "btn-primary" : "btn-outline-dark"}`}
              onClick={() => onSwitchMode(mode.value)}
            >
              {mode.title}
            </button>
          ))}
        </div>
      </div>
      <div className="card-body p-3">
        <div className="cf-content-checkpoint mb-4">
          <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
            {modeCopy.eyebrow}
          </p>
          <h6 className="text-sm mb-1">{modeCopy.title}</h6>
          <p className="text-xs text-secondary mb-0">{modeCopy.body}</p>
        </div>

        <form id="content-studio-brief-form" onSubmit={onSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">{copy.fields.sourceType.label}</label>
              <select
                className="form-select"
                name="sourceType"
                value={form.sourceType}
                onChange={onChange}
              >
                {copy.sourceTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">{copy.fields.niche.label}</label>
              <select className="form-select" name="niche" value={form.niche} onChange={onChange}>
                {copy.nicheOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">{copy.fields.objective.label}</label>
              <select className="form-select" name="objective" value={form.objective} onChange={onChange}>
                {copy.objectiveOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">{copy.fields.title.label}</label>
              <input
                className="form-control"
                name="title"
                value={form.title}
                onChange={onChange}
                placeholder={copy.fields.title.placeholder}
              />
            </div>
            <div className="col-12">
              <label className="form-label">{copy.fields.productUrl.label}</label>
              <input
                className="form-control"
                name="productUrl"
                type="url"
                value={form.productUrl}
                onChange={onChange}
                placeholder={copy.fields.productUrl.placeholder}
              />
            </div>
            <div className="col-12">
              <div className="cf-content-checkpoint">
                <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                  <div>
                    <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
                      {locale === "id" ? "Asset produk" : "Product asset"}
                    </p>
                    <p className="text-xs text-secondary mb-0">
                      {locale === "id"
                        ? "Lebih mudah upload foto produk langsung dibanding mengisi URL gambar manual."
                        : "Upload a product image directly instead of filling a manual image URL."}
                    </p>
                  </div>
                  {canUploadAssets ? (
                    <label className={`btn btn-sm mb-0 ${productAssetUploadState.uploading ? "btn-outline-dark" : "btn-outline-primary"}`}>
                      {productAssetUploadState.uploading
                        ? (locale === "id" ? "Mengunggah..." : "Uploading...")
                        : (locale === "id" ? "Upload foto produk" : "Upload product image")}
                      <input
                        hidden
                        accept="image/*"
                        disabled={productAssetUploadState.uploading}
                        type="file"
                        onChange={onProductAssetUpload}
                      />
                    </label>
                  ) : (
                    <span className="badge bg-light text-dark border">
                      {locale === "id" ? "Butuh akses asset" : "Asset access needed"}
                    </span>
                  )}
                </div>
                {productAssetUploadState.fileName ? (
                  <div className="d-flex align-items-center gap-2 flex-wrap mt-3">
                    <span className="badge bg-light text-dark border">{productAssetUploadState.fileName}</span>
                    {productAssetUploadState.assetId ? (
                      <span className="badge bg-gradient-success">
                        {locale === "id" ? "Siap dipakai render" : "Ready for render"}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {productAssetUploadState.previewUrl ? (
                  <img
                    alt={productAssetUploadState.fileName || "product upload preview"}
                    className="border-radius-lg mt-3"
                    src={productAssetUploadState.previewUrl}
                    style={{ width: 96, height: 96, objectFit: "cover" }}
                  />
                ) : canUploadAssets ? (
                  <p className="text-xs text-secondary mb-0 mt-3">
                    {locale === "id"
                      ? "Format yang paling aman untuk test cepat: JPG atau PNG ukuran kecil."
                      : "For quick testing, small JPG or PNG files work best."}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="col-12">
              <label className="form-label">{copy.fields.promptHint.label}</label>
              <textarea
                className="form-control"
                name="promptHint"
                rows="5"
                value={form.promptHint}
                onChange={onChange}
                placeholder={copy.fields.promptHint.placeholder}
              />
            </div>
            <div className="col-12">
              <details className="cf-content-advanced" open={workflowMode === "manual"}>
                <summary>{copy.advancedTitle}</summary>
                <p className="text-xs text-secondary mt-2 mb-3">{copy.advancedBody}</p>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">{copy.fields.videoEngine.label}</label>
                    <select
                      className="form-select"
                      name="videoEngine"
                      value={form.videoEngine}
                      onChange={onChange}
                    >
                      {copy.videoEngineOptions.map((option) => {
                        const config = getVideoEngineConfig(option.value);

                        return (
                          <option key={option.value} value={option.value} disabled={config.readiness !== "ready"}>
                            {option.label}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-xs text-secondary mt-2 mb-0">
                      {copy.videoEngineHelp[form.videoEngine] ?? copy.videoEngineHelp.template_local}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{copy.fields.languageCode.label}</label>
                    <select
                      className="form-select"
                      name="languageCode"
                      value={form.languageCode}
                      onChange={onChange}
                    >
                      {copy.languageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{copy.fields.brandTone.label}</label>
                    <select className="form-select" name="brandTone" value={form.brandTone} onChange={onChange}>
                      {copy.brandToneOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{copy.fields.offerText.label}</label>
                    <input
                      className="form-control"
                      name="offerText"
                      value={form.offerText}
                      onChange={onChange}
                      placeholder={copy.fields.offerText.placeholder}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{copy.fields.productImageUrl.label}</label>
                    <input
                      className="form-control"
                      name="productImageUrl"
                      type="url"
                      value={form.productImageUrl}
                      onChange={onChange}
                      placeholder={copy.fields.productImageUrl.placeholder}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{copy.fields.presenterImageUrl.label}</label>
                    <input
                      className="form-control"
                      name="presenterImageUrl"
                      type="url"
                      value={form.presenterImageUrl}
                      onChange={onChange}
                      placeholder={copy.fields.presenterImageUrl.placeholder}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{copy.fields.priceText.label}</label>
                    <input
                      className="form-control"
                      name="priceText"
                      value={form.priceText}
                      onChange={onChange}
                      placeholder={copy.fields.priceText.placeholder}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">{copy.fields.ctaText.label}</label>
                    <input
                      className="form-control"
                      name="ctaText"
                      value={form.ctaText}
                      onChange={onChange}
                      placeholder={copy.fields.ctaText.placeholder}
                    />
                  </div>
                </div>
              </details>
            </div>
          </div>
          <p className="text-xs text-secondary mt-3 mb-0">{copy.generatorNote}</p>
          {authLocked ? (
            <div className="alert alert-light border text-dark mt-3 mb-0" role="status">
              <span className="text-sm">{authMessage}</span>
            </div>
          ) : null}
          <div className="d-flex flex-wrap gap-2 mt-4">
            <button className="btn btn-primary mb-0" type="submit" disabled={submitting || authLocked}>
              {submitting ? copy.actions.generating : primaryActionLabel}
            </button>
            <button className="btn btn-outline-primary mb-0" type="button" onClick={onPreviewPlan} disabled={planning || authLocked}>
              {planning ? copy.actions.planning : copy.actions.previewPlan}
            </button>
            <button className="btn btn-outline-dark mb-0" type="button" onClick={onReset} disabled={submitting}>
              {copy.actions.reset}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OutputPreviewCard({ copy, script, isSample, locale }) {
  const createdLabel = useMemo(() => formatDateLabel(locale, script?.createdAt), [locale, script?.createdAt]);

  return (
    <div className="card h-100 cf-surface-card">
      <div className="card-header pb-0 d-flex justify-content-between align-items-start gap-3">
        <div>
          <h6 className="mb-1">{copy.previewTitle}</h6>
          <p className="text-sm mb-0">{isSample ? copy.previewSampleBody : copy.previewBody}</p>
        </div>
        <span className={`badge ${isSample ? "bg-light text-dark border" : STATUS_BADGE_CLASS[script.status] ?? "bg-gradient-dark"}`}>
          {isSample ? copy.sampleBadge : copy.statusLabels[script.status] ?? script.status}
        </span>
      </div>
      <div className="card-body p-3">
        <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap mb-3">
          <div>
            <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
              {copy.previewMeta.title}
            </p>
            <h5 className="mb-0">{script.title}</h5>
          </div>
          <div className="text-sm text-secondary">
            {createdLabel ? `${copy.previewMeta.createdAt}: ${createdLabel}` : copy.previewMeta.sampleLabel}
          </div>
        </div>
        <div className="cf-content-output-block">
          <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
            {copy.previewMeta.hook}
          </p>
          <p className="mb-0">{script.hook}</p>
        </div>
        <div className="cf-content-output-block">
          <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
            {copy.previewMeta.body}
          </p>
          <p className="mb-0">{script.body}</p>
        </div>
        <div className="cf-content-output-block">
          <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
            {copy.previewMeta.cta}
          </p>
          <p className="mb-0">{script.cta}</p>
        </div>
      </div>
    </div>
  );
}

function BriefSnapshotCard({
  copy,
  form,
  hasGeneratedScript,
  lastSavedAt,
  locale,
  templatePlan,
  workflowMode
}) {
  const savedLabel = useMemo(() => formatDateLabel(locale, lastSavedAt), [locale, lastSavedAt]);
  const hasProductImage =
    Boolean(form.productImageUrl.trim()) ||
    (Array.isArray(form.productImageAssetIds) && form.productImageAssetIds.length > 0);
  const progressItems = [
    {
      done: Boolean(form.title.trim()),
      key: "brief",
      title: copy.snapshotProgress.brief
    },
    {
      done: hasGeneratedScript,
      key: "script",
      title: copy.snapshotProgress.script
    },
    {
      done: Boolean(templatePlan?.scenePlan?.scenes?.length),
      key: "plan",
      title: copy.snapshotProgress.plan
    }
  ];

  return (
    <div className="card h-100 cf-surface-card">
      <div className="card-header pb-0">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h6 className="mb-1">{copy.snapshotTitle}</h6>
            <p className="text-sm mb-0">{copy.snapshotBody}</p>
          </div>
          <span className="badge bg-light text-dark border">
            {savedLabel
              ? copy.snapshotSavedAt.replace("{{savedAt}}", savedLabel)
              : copy.snapshotSavedEmpty}
          </span>
        </div>
      </div>
      <div className="card-body p-3">
        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <div className="cf-content-mini-stat">
              <span className="text-xs text-uppercase text-secondary">{copy.snapshotMeta.mode}</span>
              <h6 className="mb-0 mt-1">{copy.workflowModeLabels[workflowMode] ?? workflowMode}</h6>
            </div>
          </div>
          <div className="col-md-4">
            <div className="cf-content-mini-stat">
              <span className="text-xs text-uppercase text-secondary">{copy.snapshotMeta.niche}</span>
              <h6 className="mb-0 mt-1">{copy.nicheLabels[form.niche]}</h6>
            </div>
          </div>
          <div className="col-md-4">
            <div className="cf-content-mini-stat">
              <span className="text-xs text-uppercase text-secondary">{copy.snapshotMeta.objective}</span>
              <h6 className="mb-0 mt-1">{copy.objectiveLabels[form.objective]}</h6>
            </div>
          </div>
        </div>
        <div className="cf-content-snapshot mb-3">
          <div className="cf-content-snapshot-row">
            <span>{copy.snapshotFields.title}</span>
            <strong>{form.title.trim() || copy.snapshotFallbacks.title}</strong>
          </div>
          <div className="cf-content-snapshot-row">
            <span>{copy.snapshotFields.offer}</span>
            <strong>{form.offerText.trim() || copy.snapshotFallbacks.offer}</strong>
          </div>
          <div className="cf-content-snapshot-row">
            <span>{copy.snapshotFields.productImage}</span>
            <strong>{hasProductImage ? copy.snapshotStatus.done : copy.snapshotStatus.next}</strong>
          </div>
          <div className="cf-content-snapshot-row">
            <span>{copy.snapshotFields.presenterImage}</span>
            <strong>{form.presenterImageUrl.trim() ? copy.snapshotStatus.done : copy.snapshotStatus.next}</strong>
          </div>
          <div className="cf-content-snapshot-row">
            <span>{copy.snapshotFields.cta}</span>
            <strong>{form.ctaText.trim() || copy.snapshotFallbacks.cta}</strong>
          </div>
        </div>
        <div className="d-flex flex-column gap-2">
          {progressItems.map((item) => (
            <div key={item.key} className="cf-content-progress-item">
              <div className={`cf-content-progress-dot${item.done ? " is-done" : ""}`} />
              <span className="text-sm">{item.title}</span>
              <span className={`badge ms-auto ${item.done ? "bg-gradient-success" : "bg-light text-dark border"}`}>
                {item.done ? copy.snapshotStatus.done : copy.snapshotStatus.next}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewApproveCard({
  canRender,
  copy,
  form,
  isSample,
  locale,
  loading,
  onEditBrief,
  onSaveReview,
  onSceneTextChange,
  onScriptChange,
  onRender,
  plan,
  renderJob,
  renderSubmitting,
  reviewSaving,
  reviewTab,
  script,
  workflowMode,
  setReviewTab
}) {
  const tabOptions = getReviewTabOptions(copy, workflowMode);
  const hasProductImage =
    Boolean(form.productImageUrl.trim()) ||
    (Array.isArray(form.productImageAssetIds) && form.productImageAssetIds.length > 0);
  const validationItems = [
    {
      key: "script",
      state: script?.hook && script?.body && script?.cta ? "ok" : "warn",
      text: script?.hook && script?.body && script?.cta
        ? copy.reviewValidation.scriptReady
        : copy.reviewValidation.scriptMissing
    },
    {
      key: "scenes",
      state: plan?.scenePlan?.scenes?.length ? "ok" : "warn",
      text: plan?.scenePlan?.scenes?.length
        ? copy.reviewValidation.scenesReady.replace("{{count}}", String(plan.scenePlan.scenes.length))
        : copy.reviewValidation.scenesMissing
    },
    {
      key: "format",
      state: plan?.templateRenderSpec?.aspectRatio ? "ok" : "warn",
      text: plan?.templateRenderSpec?.aspectRatio
        ? copy.reviewValidation.formatReady.replace("{{format}}", `${plan.templateRenderSpec.aspectRatio} · MP4`)
        : copy.reviewValidation.formatMissing
    },
    {
      key: "product",
      state: form.productUrl.trim() ? "ok" : "warn",
      text: form.productUrl.trim()
        ? copy.reviewValidation.productLinked
        : copy.reviewValidation.productMissing
    },
    {
      key: "product-image",
      state: hasProductImage ? "ok" : "warn",
      text: hasProductImage
        ? copy.reviewValidation.productImageReady
        : copy.reviewValidation.productImageMissing
    },
    {
      key: "presenter-image",
      state: form.presenterImageUrl.trim() ? "ok" : "warn",
      text: form.presenterImageUrl.trim()
        ? copy.reviewValidation.presenterImageReady
        : copy.reviewValidation.presenterImageMissing
    }
  ];
  const criticalValidationKeys = ["script", "scenes", "format"];
  const criticalValidationLabels = locale === "id"
    ? {
        format: "format video",
        scenes: "scene plan",
        script: "script"
      }
    : {
        format: "video format",
        scenes: "scene plan",
        script: "script"
      };
  const criticalMissing = validationItems.filter(
    (item) => criticalValidationKeys.includes(item.key) && item.state !== "ok"
  );
  const nonCriticalWarnings = validationItems.filter(
    (item) => !criticalValidationKeys.includes(item.key) && item.state !== "ok"
  );
  const approveBlocked = criticalMissing.length > 0;
  const readinessMessage = approveBlocked
    ? locale === "id"
      ? `Belum lengkap: ${criticalMissing.map((item) => criticalValidationLabels[item.key] ?? item.key).join(", ")}`
      : `Still incomplete: ${criticalMissing.map((item) => criticalValidationLabels[item.key] ?? item.key).join(", ")}`
    : nonCriticalWarnings.length > 0
      ? locale === "id"
        ? `Siap render dengan ${nonCriticalWarnings.length} peringatan minor`
        : `Ready to render with ${nonCriticalWarnings.length} minor warnings`
      : locale === "id"
        ? "Siap render"
        : "Ready to render";

  return (
    <div className="card h-100 cf-surface-card cf-premium-card">
      <div className="card-header pb-0">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h6 className="mb-1">{copy.reviewBoardTitle}</h6>
            <p className="text-sm mb-0">{copy.reviewBoardBody}</p>
          </div>
          <span className={`badge ${loading ? "bg-light text-dark border" : "bg-gradient-success"}`}>
            {loading ? copy.reviewBoardThinking : copy.reviewBoardReady}
          </span>
        </div>
      </div>
      <div className="card-body p-3">
        <div className="cf-content-review-tabs">
          {tabOptions.map((tab) => {
            const active = tab.value === reviewTab;

            return (
              <button
                key={tab.value}
                type="button"
                className={`cf-content-review-tab${active ? " is-active" : ""}`}
                onClick={() => setReviewTab(tab.value)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          {reviewTab === "script" ? (
            <div className="cf-content-snapshot">
              <div className="cf-content-output-block">
                <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
                  {copy.previewMeta.hook}
                </p>
                <input
                  className="form-control"
                  value={script.hook ?? ""}
                  onChange={(event) => onScriptChange("hook", event.target.value)}
                />
              </div>
              <div className="cf-content-output-block">
                <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
                  {copy.previewMeta.body}
                </p>
                <textarea
                  className="form-control"
                  rows="5"
                  value={script.body ?? ""}
                  onChange={(event) => onScriptChange("body", event.target.value)}
                />
              </div>
              <div className="cf-content-output-block">
                <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
                  {copy.previewMeta.cta}
                </p>
                <input
                  className="form-control"
                  value={script.cta ?? ""}
                  onChange={(event) => onScriptChange("cta", event.target.value)}
                />
              </div>
              <div className="d-flex flex-wrap gap-2 mt-3">
                <span className={`badge ${isSample ? "bg-light text-dark border" : STATUS_BADGE_CLASS[script.status] ?? "bg-gradient-dark"}`}>
                  {isSample ? copy.sampleBadge : copy.statusLabels[script.status] ?? script.status}
                </span>
                <span className="badge bg-light text-dark border">{copy.workflowModeLabels[workflowMode] ?? workflowMode}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-dark mb-0 ms-auto"
                  onClick={onSaveReview}
                  disabled={reviewSaving || isSample}
                >
                  {reviewSaving
                    ? (locale === "id" ? "Menyimpan..." : "Saving...")
                    : isSample
                      ? (locale === "id" ? "Generate draft dulu" : "Generate a draft first")
                      : (locale === "id" ? "Simpan edit review" : "Save review edits")}
                </button>
              </div>
            </div>
          ) : null}

          {reviewTab === "videoPlan" ? (
            loading ? (
              <p className="text-sm text-secondary mb-0">{copy.planLoading}</p>
            ) : !plan?.scenePlan?.scenes?.length ? (
              <p className="text-sm text-secondary mb-0">{copy.planEmpty}</p>
            ) : (
              <>
                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <div className="cf-content-mini-stat">
                      <span className="text-xs text-uppercase text-secondary">{copy.planMeta.niche}</span>
                      <h6 className="mb-0 mt-1">{copy.nicheLabels[plan?.templateRenderSpec?.niche] ?? "-"}</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="cf-content-mini-stat">
                      <span className="text-xs text-uppercase text-secondary">{copy.planMeta.objective}</span>
                      <h6 className="mb-0 mt-1">{copy.objectiveLabels[plan?.templateRenderSpec?.objective] ?? "-"}</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="cf-content-mini-stat">
                      <span className="text-xs text-uppercase text-secondary">{copy.planMeta.scenes}</span>
                      <h6 className="mb-0 mt-1">{plan.scenePlan.scenes.length}</h6>
                    </div>
                  </div>
                </div>
                <div className="cf-content-draft-list d-flex flex-column gap-3">
                  {plan.scenePlan.scenes.map((scene, index) => (
                    <div key={scene.id} className="cf-content-draft-item">
                      <div className="d-flex justify-content-between gap-3 align-items-start">
                        <div className="d-flex gap-3 align-items-start">
                          <span className="badge bg-light text-dark border">{String(index + 1).padStart(2, "0")}</span>
                          <div>
                            <span className="text-xs text-uppercase font-weight-bolder text-secondary">
                              {copy.sceneLabels[scene.kind] ?? scene.kind}
                            </span>
                            <textarea
                              className="form-control mt-2"
                              rows="2"
                              value={scene.textBlocks?.[0]?.text ?? ""}
                              onChange={(event) => onSceneTextChange(scene.id, event.target.value)}
                            />
                            <p className="text-xs text-secondary mb-0">
                              {copy.planMeta.layout}: {copy.layoutLabels[scene.layout] ?? scene.layout}
                            </p>
                          </div>
                        </div>
                        <span className="badge bg-light text-dark border">{scene.durationFrames}f</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="d-flex justify-content-end mt-3">
                  <button type="button" className="btn btn-sm btn-outline-dark mb-0" onClick={onSaveReview} disabled={reviewSaving}>
                    {reviewSaving ? (locale === "id" ? "Menyimpan..." : "Saving...") : (locale === "id" ? "Simpan perubahan scene" : "Save scene edits")}
                  </button>
                </div>
              </>
            )
          ) : null}

          {reviewTab === "validation" ? (
            <div className="cf-content-snapshot">
              {validationItems.map((item) => (
                <div key={item.key} className="cf-content-validation-row">
                  <span className={`cf-content-validation-icon${item.state === "ok" ? " is-ok" : " is-warn"}`}>
                    {item.state === "ok" ? "✓" : "!"}
                  </span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          ) : null}
          {reviewTab === "rawSpec" ? (
            <div className="cf-content-snapshot">
              <p className="text-sm text-secondary mb-3">
                {copy.reviewRawSpecBody ?? "Raw template render payload for manual mode review."}
              </p>
              <pre className="cf-content-raw-spec mb-0">
                {JSON.stringify({
                  scenePlan: plan?.scenePlan ?? null,
                  templateRenderSpec: plan?.templateRenderSpec ?? null
                }, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      </div>
      <div className="card-footer pt-0 border-0 bg-transparent">
        <div className="cf-content-session-note">
          <div>
            <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
              {copy.reviewApproveTitle}
            </p>
            <p className={`text-sm mb-0 ${approveBlocked ? "text-warning" : ""}`}>{readinessMessage}</p>
            <p className="text-xs text-secondary mb-0 mt-2">
              {copy.renderEngineActive.replace("{{engine}}", copy.videoEngineLabels[form.videoEngine] ?? form.videoEngine)}
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2 justify-content-end">
            <button type="button" className="btn btn-outline-dark btn-sm mb-0" onClick={onEditBrief}>
              {copy.reviewActions.editBrief}
            </button>
            {canRender ? (
              <button
                type="button"
                className="btn btn-primary btn-sm mb-0"
                onClick={onRender}
                disabled={renderSubmitting || loading || !plan?.templateRenderSpec || approveBlocked}
              >
                {renderSubmitting ? copy.renderActions.submitting : copy.reviewActions.approveRender}
              </button>
            ) : (
              <span className="badge bg-light text-dark border">{copy.renderActions.locked}</span>
            )}
            {renderJob?.jobId ? (
              <span className="badge bg-light text-dark border">{renderJob.jobId}</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanPreviewCard({
  assemblyResult,
  canRender,
  canManagePublishAccounts,
  connectedAccountForm,
  connectedAccountLoading,
  connectedAccounts,
  canSubmitPublish,
  copy,
  loading,
  locale,
  onConnectedAccountChange,
  onCreateConnectedAccount,
  onPublish,
  onRender,
  onRetryScene,
  onSelectConnectedAccount,
  plan,
  publishJob,
  publishSubmitting,
  renderBatch,
  renderJob,
  renderPosterUrl,
  renderPreviewUrl,
  renderSubmitting,
  retryingSceneTaskId,
  selectedVideoEngine,
  selectedConnectedAccountId,
  submitConnectedAccount
}) {
  const renderStatus = renderJob?.status ? copy.renderJobStatusLabels?.[renderJob.status] ?? renderJob.status : null;
  const publishStatus = publishJob?.status
    ? copy.publishJobStatusLabels?.[publishJob.status] ?? publishJob.status
    : null;
  const renderStatusBody = renderJob?.status === "queued"
    ? copy.renderQueuedBody
    : renderJob?.status === "processing"
      ? copy.renderProcessingBody
      : renderStatus
        ? copy.renderStatusBody.replace("{{status}}", renderStatus)
        : copy.renderHint;
  const batchSummary = renderBatch && typeof renderBatch === "object" && renderBatch.summary
    ? renderBatch.summary
    : null;
  const totalBatchJobs = Number.isFinite(Number(batchSummary?.total))
    ? Number(batchSummary.total)
    : Array.isArray(renderBatch?.jobs)
      ? renderBatch.jobs.length
      : 0;
  const sceneBatchJobs = normalizeRenderBatchJobs(renderBatch).filter((job) => job.taskType === "scene");
  const totalSceneJobs = sceneBatchJobs.length;
  const completedSceneJobs = sceneBatchJobs.filter((job) => job.status === "completed").length;
  const failedSceneJobs = sceneBatchJobs.filter((job) => job.status === "failed").length;
  const runningSceneJobs = sceneBatchJobs.filter((job) => job.status === "processing" || job.status === "queued").length;
  const completedBatchJobs = Number.isFinite(Number(batchSummary?.completed)) ? Number(batchSummary.completed) : 0;
  const failedBatchJobs = Number.isFinite(Number(batchSummary?.failed)) ? Number(batchSummary.failed) : 0;
  const processingBatchJobs = Number.isFinite(Number(batchSummary?.processing)) ? Number(batchSummary.processing) : 0;
  const queuedBatchJobs = Number.isFinite(Number(batchSummary?.queued)) ? Number(batchSummary.queued) : 0;
  const runningBatchJobs = processingBatchJobs + queuedBatchJobs;
  const renderProgressPercent = calculateRenderProgress(renderBatch, renderJob);
  const renderInFlight =
    renderBatch?.status === "processing" ||
    renderBatch?.status === "queued" ||
    renderJob?.status === "queued" ||
    renderJob?.status === "processing";
  const etaSeconds = renderInFlight ? Math.max(8, runningBatchJobs * 7) : 0;
  const etaLabel = etaSeconds > 0
    ? locale === "id"
      ? `Estimasi selesai ~${etaSeconds} detik`
      : `Estimated completion ~${etaSeconds}s`
    : null;
  const backgroundHint = renderInFlight
    ? locale === "id"
      ? "Kamu bisa lanjut ke langkah lain, proses render tetap jalan di background."
      : "You can continue to other steps while rendering runs in the background."
    : null;
  const showRenderProgress = totalBatchJobs > 0 || renderInFlight;
  const renderButtonLabel = renderSubmitting
    ? copy.renderActions.submitting
    : renderInFlight
      ? renderBatch?.status === "queued"
        ? copy.renderJobStatusLabels?.queued ?? "Queued"
        : copy.renderJobStatusLabels?.processing ?? "Processing"
      : copy.renderActions.submit;
  const totalFrames =
    plan?.scenePlan?.scenes?.reduce((sum, scene) => sum + (scene.durationFrames ?? 0), 0) ?? 0;
  const durationLabel = formatDurationLabel(plan?.scenePlan?.durationSeconds ?? plan?.templateRenderSpec?.durationSeconds ?? 0);
  let elapsedFrames = 0;
  const timelineScenes =
    plan?.scenePlan?.scenes?.map((scene, index) => {
      const startFrames = elapsedFrames;
      elapsedFrames += scene.durationFrames ?? 0;

      const widthWeight =
        totalFrames > 0 ? Math.max(20, Math.round(((scene.durationFrames ?? 0) / totalFrames) * 180)) : 88;

      return {
        id: scene.id,
        label: copy.sceneLabels[scene.kind] ?? scene.kind,
        startLabel: formatDurationLabel(Math.floor(startFrames / 30)),
        widthWeight
      };
    }) ?? [];
  const sceneJobBySceneId = Object.fromEntries(
    normalizeRenderBatchJobs(renderBatch)
      .filter((job) => job.taskType === "scene" && job.sceneId)
      .map((job) => [job.sceneId, job])
  );
  const checklistItems = [
    {
      done: Boolean(assemblyResult?.videoAssetId || renderJob?.outputAssetId),
      label: locale === "id" ? "Video output siap" : "Video output ready"
    },
    {
      done: Boolean(assemblyResult?.caption || renderPreviewUrl),
      label: locale === "id" ? "Caption siap pakai" : "Caption prepared"
    },
    {
      done: Boolean(selectedConnectedAccountId),
      label: locale === "id" ? "Akun TikTok dipilih" : "TikTok account selected"
    },
    {
      done: Boolean(durationLabel),
      label: locale === "id" ? "Durasi terdeteksi" : "Duration detected"
    },
    {
      done: Boolean(renderPosterUrl),
      label: locale === "id" ? "Poster / thumbnail siap" : "Poster / thumbnail ready"
    }
  ];

  return (
    <div className="card h-100 cf-surface-card">
      <div className="card-header pb-0">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h6 className="mb-1">{copy.planTitle}</h6>
            <p className="text-sm mb-0">{copy.planBody}</p>
          </div>
          {plan?.templateRenderSpec?.templateKey ? (
            <span className="badge bg-gradient-dark">{plan.templateRenderSpec.templateKey}</span>
          ) : null}
        </div>
      </div>
      <div className="card-body p-3">
        {loading ? (
          <p className="text-sm text-secondary mb-0">{copy.planLoading}</p>
        ) : !plan?.scenePlan?.scenes?.length ? (
          <p className="text-sm text-secondary mb-0">{copy.planEmpty}</p>
        ) : (
          <>
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <div className="cf-content-mini-stat">
                  <span className="text-xs text-uppercase text-secondary">{copy.planMeta.niche}</span>
                  <h6 className="mb-0 mt-1">{copy.nicheLabels[plan?.templateRenderSpec?.niche] ?? "-"}</h6>
                </div>
              </div>
              <div className="col-md-4">
                <div className="cf-content-mini-stat">
                  <span className="text-xs text-uppercase text-secondary">{copy.planMeta.objective}</span>
                  <h6 className="mb-0 mt-1">{copy.objectiveLabels[plan?.templateRenderSpec?.objective] ?? "-"}</h6>
                </div>
              </div>
              <div className="col-md-4">
                <div className="cf-content-mini-stat">
                  <span className="text-xs text-uppercase text-secondary">{copy.planMeta.scenes}</span>
                  <h6 className="mb-0 mt-1">{plan.scenePlan.scenes.length}</h6>
                </div>
              </div>
            </div>
            <details className="cf-content-advanced mb-3">
              <summary>{locale === "id" ? "Lihat detail scene" : "View scene details"}</summary>
              <div className="cf-content-draft-list d-flex flex-column gap-3 mt-3">
                {plan.scenePlan.scenes.map((scene) => (
                  <div key={scene.id} className="cf-content-draft-item">
                    <div className="d-flex justify-content-between gap-3 align-items-start">
                      <div>
                        <span className="text-xs text-uppercase font-weight-bolder text-secondary">
                          {copy.sceneLabels[scene.kind] ?? scene.kind}
                        </span>
                        <h6 className="text-sm mb-1 mt-1">{scene.textBlocks?.[0]?.text ?? copy.planFallbackText}</h6>
                        <p className="text-xs text-secondary mb-0">
                          {copy.planMeta.layout}: {copy.layoutLabels[scene.layout] ?? scene.layout}
                        </p>
                      </div>
                      <div className="d-flex flex-column align-items-end gap-2">
                        <span className="badge bg-light text-dark border">{scene.durationFrames}f</span>
                        {sceneJobBySceneId[scene.id]?.status ? (
                          <span className={`badge ${sceneJobBySceneId[scene.id]?.status === "failed" ? "bg-gradient-danger" : sceneJobBySceneId[scene.id]?.status === "completed" ? "bg-gradient-success" : "bg-light text-dark border"}`}>
                            {copy.renderJobStatusLabels?.[sceneJobBySceneId[scene.id]?.status] ?? sceneJobBySceneId[scene.id]?.status}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4 pt-3 border-top">
              <div>
                <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">{copy.renderCardTitle}</p>
                <p className="text-sm mb-0">{renderStatusBody}</p>
                <p className="text-xs text-secondary mb-0 mt-2">
                  {copy.renderEngineActive.replace("{{engine}}", copy.videoEngineLabels[selectedVideoEngine] ?? selectedVideoEngine)}
                </p>
                {showRenderProgress ? (
                  <div className="cf-content-render-progress mt-3">
                    <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                      <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-0">
                        Progress render
                      </p>
                      <span className="badge bg-light text-dark border">{renderProgressPercent}%</span>
                    </div>
                    <div className="progress" style={{ height: 8 }}>
                      <div
                        className={`progress-bar ${
                          failedBatchJobs > 0
                            ? "bg-gradient-danger"
                            : renderProgressPercent >= 100
                              ? "bg-gradient-success"
                              : "bg-gradient-info"
                        }`}
                        role="progressbar"
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={renderProgressPercent}
                        style={{ width: `${renderProgressPercent}%` }}
                      />
                    </div>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      <span className="badge bg-light text-dark border">
                        {`${completedSceneJobs} / ${totalSceneJobs || completedBatchJobs || totalBatchJobs} ${copy.renderJobStatusLabels?.completed ?? "Completed"}`}
                      </span>
                      <span className="badge bg-light text-dark border">
                        {`${runningSceneJobs || runningBatchJobs} ${copy.renderJobStatusLabels?.processing ?? "Processing"}`}
                      </span>
                      {failedSceneJobs > 0 || failedBatchJobs > 0 ? (
                        <span className="badge bg-gradient-danger">
                          {`${failedSceneJobs || failedBatchJobs} ${copy.renderJobStatusLabels?.failed ?? "Failed"}`}
                        </span>
                      ) : null}
                    </div>
                    {etaLabel ? <p className="text-xs text-secondary mb-0 mt-2">{etaLabel}</p> : null}
                    {backgroundHint ? <p className="text-xs text-secondary mb-0 mt-1">{backgroundHint}</p> : null}
                  </div>
                ) : null}
              </div>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                {renderJob?.jobId ? (
                  <span className={`badge ${renderJob.status === "failed" ? "bg-gradient-danger" : renderJob.status === "completed" ? "bg-gradient-success" : "bg-light text-dark border"}`}>
                    {renderStatus}
                  </span>
                ) : null}
                {canRender ? (
                  <button
                    type="button"
                    className="btn btn-primary mb-0"
                    onClick={onRender}
                    disabled={renderSubmitting || loading || renderInFlight}
                  >
                    {renderButtonLabel}
                  </button>
                ) : (
                  <span className="badge bg-light text-dark border">{copy.renderActions.locked}</span>
                )}
              </div>
            </div>
            {renderJob?.status === "failed" && renderJob?.lastErrorMessage ? (
              <div className="alert alert-danger text-sm py-2 px-3 mt-3 mb-0" role="alert">
                {renderJob.lastErrorMessage}
              </div>
            ) : null}
            {failedSceneJobs.length > 0 ? (
              <details className="cf-content-advanced mt-3" open>
                <summary>{locale === "id" ? "Troubleshooting render" : "Render troubleshooting"}</summary>
                <div className="cf-content-checkpoint mt-3">
                <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-2">
                  {locale === "id" ? "Retry scene yang gagal" : "Retry failed scenes"}
                </p>
                <div className="d-flex flex-column gap-2">
                  {failedSceneJobs.map((job) => (
                    <div key={job.taskId} className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                      <span className="text-sm">{job.sceneId || job.taskId}</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger mb-0"
                        disabled={retryingSceneTaskId === job.taskId || typeof onRetryScene !== "function"}
                        onClick={() => onRetryScene?.(job.taskId)}
                      >
                        {retryingSceneTaskId === job.taskId
                          ? (locale === "id" ? "Retry..." : "Retrying...")
                          : (locale === "id" ? "Retry scene" : "Retry scene")}
                      </button>
                    </div>
                  ))}
                </div>
                </div>
              </details>
            ) : null}
            {renderJob?.jobId ? (
              <details className="cf-content-advanced mt-3">
                <summary>{locale === "id" ? "Detail job render" : "Render job details"}</summary>
                <div className="cf-content-checkpoint mt-3">
                <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">{copy.renderJobTitle}</p>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <span className="badge bg-light text-dark border">{renderJob.jobId}</span>
                  {renderJob.providerName ? <span className="badge bg-light text-dark border">{renderJob.providerName}</span> : null}
                  {renderJob.providerJobId ? <span className="badge bg-light text-dark border">{renderJob.providerJobId}</span> : null}
                </div>
                {renderJob.lastErrorMessage ? (
                  <p className="text-xs text-danger mb-0 mt-2">{renderJob.lastErrorMessage}</p>
                ) : null}
                </div>
              </details>
            ) : null}
            {renderPreviewUrl ? (
              <div className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
                  <div>
                    <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
                      {copy.renderPreviewTitle}
                    </p>
                    <p className="text-sm mb-0">{copy.renderPreviewBody}</p>
                  </div>
                  <span className="badge bg-gradient-dark">
                    {copy.renderDurationLabel.replace("{{duration}}", durationLabel)}
                  </span>
                </div>
                <div
                  className="border-radius-xl overflow-hidden"
                  style={{
                    background: renderPosterUrl
                      ? `linear-gradient(180deg, rgba(9, 17, 26, 0.18) 0%, rgba(16, 44, 69, 0.72) 100%), url(${renderPosterUrl}) center / cover`
                      : "linear-gradient(180deg, #09111a 0%, #102c45 100%)",
                    boxShadow: "0 20px 40px rgba(16, 44, 69, 0.16)",
                    maxWidth: 320
                  }}
                >
                  <video
                    key={renderPreviewUrl}
                    className="d-block w-100"
                    controls
                    muted
                    poster={renderPosterUrl ?? undefined}
                    playsInline
                    preload="metadata"
                    src={renderPreviewUrl}
                    style={{
                      aspectRatio: "9 / 16",
                      background: "#09111a",
                      objectFit: "cover"
                    }}
                  />
                </div>
                {timelineScenes.length ? (
                  <div className="mt-3">
                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-2">
                      <div>
                        <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
                          {copy.renderTimelineTitle}
                        </p>
                        <p className="text-xs text-secondary mb-0">{copy.renderTimelineBody}</p>
                      </div>
                    </div>
                    <div className="d-flex gap-2 overflow-auto pb-1">
                      {timelineScenes.map((scene, index) => (
                        <div
                          key={scene.id}
                          className="border-radius-lg overflow-hidden flex-shrink-0"
                          style={{
                            width: scene.widthWeight,
                            minWidth: 88,
                            background: renderPosterUrl
                              ? `linear-gradient(180deg, rgba(9, 17, 26, 0.08) 0%, rgba(16, 44, 69, 0.84) 100%), url(${renderPosterUrl}) ${18 + index * 13}% center / cover`
                              : "linear-gradient(180deg, #dfe8f0 0%, #102c45 100%)",
                            boxShadow: "0 12px 24px rgba(16, 44, 69, 0.12)"
                          }}
                        >
                          <div className="p-2 d-flex flex-column justify-content-end" style={{ minHeight: 74 }}>
                            <span className="badge bg-light text-dark border align-self-start mb-2">{scene.startLabel}</span>
                            <p className="text-white text-xs font-weight-bolder mb-0" style={{ lineHeight: 1.3 }}>
                              {scene.label}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <details className="cf-content-advanced mt-3">
                  <summary>{locale === "id" ? "Pengaturan publish" : "Publish settings"}</summary>
                  <div className="mt-3 cf-content-checkpoint">
                    <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-2">
                      {locale === "id" ? "Checklist sebelum publish" : "Pre-publish checklist"}
                    </p>
                    <div className="d-flex flex-column gap-2 mb-3">
                      {checklistItems.map((item) => (
                        <div key={item.label} className="cf-content-progress-item">
                          <div className={`cf-content-progress-dot${item.done ? " is-done" : ""}`} />
                          <span className="text-sm">{item.label}</span>
                          <span className={`badge ms-auto ${item.done ? "bg-gradient-success" : "bg-light text-dark border"}`}>
                            {item.done ? (locale === "id" ? "Siap" : "Ready") : (locale === "id" ? "Cek lagi" : "Check")}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
                      {copy.publishCardTitle}
                    </p>
                    <div className="row g-2 mb-3">
                      <div className="col-md-7">
                        <label className="form-label text-xs">{copy.publishAccountFields.account.label}</label>
                        <select
                          className="form-select"
                          disabled={connectedAccountLoading}
                          value={selectedConnectedAccountId}
                          onChange={(event) => onSelectConnectedAccount(event.target.value)}
                        >
                          <option value="">{copy.publishAccountFields.account.placeholder}</option>
                          {connectedAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.accountLabel}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-5">
                        <label className="form-label text-xs">{copy.publishAccountFields.platform.label}</label>
                        <input className="form-control" disabled value="TikTok" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-xs">{copy.publishAccountFields.accountLabel.label}</label>
                        <input
                          className="form-control"
                          disabled={!canManagePublishAccounts || submitConnectedAccount}
                          name="accountLabel"
                          placeholder={copy.publishAccountFields.accountLabel.placeholder}
                          value={connectedAccountForm.accountLabel}
                          onChange={onConnectedAccountChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-xs">{copy.publishAccountFields.externalAccountId.label}</label>
                        <input
                          className="form-control"
                          disabled={!canManagePublishAccounts || submitConnectedAccount}
                          name="externalAccountId"
                          placeholder={copy.publishAccountFields.externalAccountId.placeholder}
                          value={connectedAccountForm.externalAccountId}
                          onChange={onConnectedAccountChange}
                        />
                      </div>
                      <div className="col-12 d-flex justify-content-between align-items-center gap-2 flex-wrap">
                        <p className="text-xs text-secondary mb-0">{copy.publishAccountNote}</p>
                        {canManagePublishAccounts ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark mb-0"
                            disabled={submitConnectedAccount}
                            onClick={onCreateConnectedAccount}
                          >
                            {submitConnectedAccount ? copy.publishAccountActions.creating : copy.publishAccountActions.create}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-sm mb-2">
                      {publishStatus
                        ? copy.publishStatusBody.replace("{{status}}", publishStatus)
                        : copy.publishHint}
                    </p>
                    <div className="d-flex flex-wrap gap-2 align-items-center">
                      <span className="badge bg-light text-dark border">TikTok</span>
                      {publishJob?.jobId ? (
                        <span className={`badge ${publishJob.status === "failed" ? "bg-gradient-danger" : publishJob.status === "published" ? "bg-gradient-success" : "bg-light text-dark border"}`}>
                          {publishStatus}
                        </span>
                      ) : null}
                      {publishJob?.jobId ? <span className="badge bg-light text-dark border">{publishJob.jobId}</span> : null}
                    </div>
                    <p className="text-xs text-secondary mb-0 mt-2">{copy.publishQueueNote}</p>
                    {publishJob?.lastErrorMessage ? (
                      <p className="text-xs text-danger mb-0 mt-2">{publishJob.lastErrorMessage}</p>
                    ) : null}
                  </div>
                </details>
                <div className="mt-3">
                  {canSubmitPublish ? (
                    <button
                      type="button"
                      className="btn btn-primary w-100 mb-0"
                      disabled={publishSubmitting}
                      onClick={onPublish}
                    >
                      {publishSubmitting ? copy.publishActions.submitting : copy.publishActions.queue}
                    </button>
                  ) : (
                    <span className="badge bg-light text-dark border">{copy.publishActions.locked}</span>
                  )}
                </div>
                <details className="cf-content-advanced mt-3">
                  <summary>{locale === "id" ? "Aksi lain" : "More actions"}</summary>
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <a
                      className="btn btn-sm btn-outline-dark mb-0"
                      href={renderPreviewUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {copy.renderActions.open}
                    </a>
                    <a
                      className="btn btn-sm btn-outline-primary mb-0"
                      download={createPublishFileName(plan)}
                      href={renderPreviewUrl}
                    >
                      {copy.renderActions.download}
                    </a>
                    <button type="button" className="btn btn-sm btn-outline-dark mb-0" onClick={onRender}>
                      {locale === "id" ? "Buat variasi baru" : "Create new variation"}
                    </button>
                  </div>
                </details>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function RecentStudioSessionsCard({
  items,
  loading,
  locale,
  onResume,
  restoringStudioSessionId
}) {
  return (
    <div className="card h-100 cf-surface-card">
      <div className="card-header pb-0">
        <h6 className="mb-1">{locale === "id" ? "Lanjutkan sesi" : "Resume a session"}</h6>
        <p className="text-sm mb-0">
          {locale === "id"
            ? "Buka lagi draft studio yang terakhir kamu sentuh."
            : "Jump back into the most recent studio drafts."}
        </p>
      </div>
      <div className="card-body p-3">
        {loading ? (
          <div className="cf-content-subtle-state">
            <p className="text-sm mb-1">{locale === "id" ? "Memuat sesi terakhir..." : "Loading recent sessions..."}</p>
            <p className="text-xs text-secondary mb-0">
              {locale === "id"
                ? "Begitu siap, kamu bisa lanjut tanpa mengulang brief dari awal."
                : "Once ready, you can continue without rebuilding the brief from scratch."}
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="cf-content-subtle-state">
            <p className="text-sm mb-1">{locale === "id" ? "Belum ada sesi yang bisa dilanjutkan." : "No resumable sessions yet."}</p>
            <p className="text-xs text-secondary mb-0">
              {locale === "id"
                ? "Setelah kamu isi brief atau generate draft pertama, sesi akan muncul di sini."
                : "Once you complete a brief or generate the first draft, sessions will show up here."}
            </p>
          </div>
        ) : (
          <div className="cf-content-draft-list d-flex flex-column gap-3">
            {items.map((item) => (
              <div key={item.id} className="cf-content-draft-item">
                <div className="d-flex justify-content-between gap-3 align-items-start flex-wrap">
                  <div>
                    <h6 className="text-sm mb-1">{item.rawBrief?.title || (locale === "id" ? "Draft tanpa judul" : "Untitled draft")}</h6>
                    <p className="text-xs text-secondary mb-2">
                      {(item.workflowMode || "").toUpperCase()} · {(item.lastLayer || "").toUpperCase()} · {formatDateLabel(locale, item.updatedAt) || "-"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary mb-0"
                    disabled={restoringStudioSessionId === item.id}
                    onClick={() => onResume(item.id)}
                  >
                    {restoringStudioSessionId === item.id
                      ? (locale === "id" ? "Membuka..." : "Opening...")
                      : (locale === "id" ? "Lanjutkan" : "Resume")}
                  </button>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge bg-light text-dark border">{item.status}</span>
                  {item.rawBrief?.niche ? <span className="badge bg-light text-dark border">{item.rawBrief.niche}</span> : null}
                  {item.rawBrief?.objective ? <span className="badge bg-light text-dark border">{item.rawBrief.objective}</span> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateLibraryCard({
  canClone,
  canDuplicate,
  copy,
  locale,
  loading,
  onCloneTemplate,
  onPreviewTemplate,
  onDuplicateTemplate,
  previewTemplateId,
  recommendedTemplates,
  scope,
  selectedTemplateId,
  templates,
  onApplyTemplate,
  onChangeScope
}) {
  return (
    <div className="card h-100 cf-surface-card">
      <div className="card-header pb-0">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h6 className="mb-1">{copy.templateLibraryTitle}</h6>
            <p className="text-sm mb-0">{copy.templateLibraryBody}</p>
          </div>
          <span className="badge bg-light text-dark border">{copy.templateScopeLabels[scope]}</span>
        </div>
      </div>
      <div className="card-body p-3">
        {recommendedTemplates?.length ? (
          <div className="cf-content-checkpoint mb-3">
            <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
              {locale === "id" ? "Rekomendasi otomatis" : "Automatic recommendations"}
            </p>
            <p className="text-xs text-secondary mb-2">
              {locale === "id"
                ? "Mulai dari 1-2 template ini dulu kalau kamu ingin jalur tercepat."
                : "Start with one of these first if you want the fastest path."}
            </p>
            <div className="d-flex flex-wrap gap-2">
              {recommendedTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className="btn btn-sm btn-outline-primary mb-0"
                  onClick={() => onApplyTemplate(template)}
                >
                  {template.title}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="d-flex flex-wrap gap-2 mb-3">
          {copy.templateScopes.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`btn btn-sm mb-0 ${scope === item.value ? "btn-primary" : "btn-outline-dark"}`}
              onClick={() => onChangeScope(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="cf-content-subtle-state">
            <p className="text-sm mb-1">{copy.templateLoading}</p>
            <p className="text-xs text-secondary mb-0">
              {locale === "id"
                ? "Kami sedang menyiapkan template yang paling relevan untuk brief ini."
                : "We are preparing the most relevant templates for this brief."}
            </p>
          </div>
        ) : templates.length === 0 ? (
          <div className="cf-content-subtle-state">
            <p className="text-sm mb-1">{copy.templateEmpty}</p>
            <p className="text-xs text-secondary mb-0">
              {locale === "id"
                ? "Coba ganti scope atau mulai dari template official lalu clone ke workspace."
                : "Try switching scope or start from an official template and clone it into the workspace."}
            </p>
          </div>
        ) : (
          <div className="cf-content-draft-list d-flex flex-column gap-3">
            {templates.map((template) => {
              const active = template.id === selectedTemplateId;

	              return (
	                <div key={template.id} className={`cf-content-draft-item${active ? " is-active" : ""}`}>
	                  <div className="d-flex justify-content-between gap-3 align-items-start flex-wrap">
	                    <div>
                      <div className="d-flex flex-wrap gap-2 mb-2">
                        <span className={`badge ${template.status === "published" ? "bg-gradient-success" : "bg-gradient-warning"}`}>
                          {copy.templateStatusLabels[template.status] ?? template.status}
                        </span>
                        <span className="badge bg-light text-dark border">{template.useCaseBadge}</span>
                      </div>
                      <h6 className="text-sm mb-1">{template.title}</h6>
                      <p className="text-xs text-secondary mb-2">{template.body}</p>
                    </div>
		                    <div className="d-flex flex-wrap gap-2">
		                      {canClone && template.scope === "official" ? (
		                        <button type="button" className="btn btn-sm btn-outline-dark mb-0" onClick={() => onCloneTemplate(template)}>
		                          {copy.templateActions.clone}
		                        </button>
		                      ) : null}
		                      {canDuplicate && template.scope === "workspace" ? (
		                        <button type="button" className="btn btn-sm btn-outline-dark mb-0" onClick={() => onDuplicateTemplate(template)}>
		                          {copy.templateActions.duplicate}
		                        </button>
		                      ) : null}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark mb-0"
                            onClick={() => onPreviewTemplate(template)}
                          >
                            {locale === "id" ? "Preview 3 detik" : "3s preview"}
                          </button>
		                      <button type="button" className={`btn btn-sm mb-0 ${active ? "btn-outline-dark" : "btn-outline-primary"}`} onClick={() => onApplyTemplate(template)}>
		                        {active ? copy.templateActions.applied : copy.templateActions.use}
		                      </button>
	                    </div>
	                  </div>
                  {previewTemplateId === template.id ? (
                    <div className="cf-content-template-preview mt-3">
                      <div className="cf-content-template-preview-layer">
                        <span className="badge bg-light text-dark border">
                          {locale === "id" ? "Hook" : "Hook"}
                        </span>
                      </div>
                      <div className="cf-content-template-preview-layer">
                        <span className="badge bg-light text-dark border">
                          {locale === "id" ? "Produk" : "Product"}
                        </span>
                      </div>
                      <div className="cf-content-template-preview-layer">
                        <span className="badge bg-light text-dark border">
                          {locale === "id" ? "CTA" : "CTA"}
                        </span>
                      </div>
                      <p className="text-xs text-secondary mb-0 mt-2">
                        {locale === "id"
                          ? "Preview cepat 3 detik untuk cek pacing dan visual template."
                          : "Quick 3-second preview to check template pacing and visuals."}
                      </p>
                    </div>
                  ) : null}
                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge bg-light text-dark border">{copy.nicheLabels[template.niche]}</span>
                    <span className="badge bg-light text-dark border">{copy.objectiveLabels[template.objective]}</span>
                    <span className="badge bg-light text-dark border">{template.key}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateManagerCard({
  badgeClass = "bg-gradient-dark",
  copy,
  duplicateEnabled = false,
  form,
  loading,
  managerCopy,
  templates,
  saving,
  onChange,
  onCreateNew,
  onDuplicate,
  onLoadTemplate,
  onPublish,
  onArchive,
  onSave
}) {
  return (
    <div className="card h-100 cf-surface-card cf-premium-card">
      <div className="card-header pb-0">
        <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
          <div>
            <h6 className="mb-1">{managerCopy.title}</h6>
            <p className="text-sm mb-0">{managerCopy.body}</p>
          </div>
          <span className={`badge ${badgeClass}`}>{managerCopy.badge}</span>
        </div>
      </div>
      <div className="card-body p-3">
        <div className="row g-3">
          <div className="col-md-8">
            <label className="form-label">{managerCopy.fields.template.label}</label>
            <select
              className="form-select"
              value={form.id ?? ""}
              onChange={(event) => onLoadTemplate(event.target.value)}
              disabled={loading}
            >
              <option value="">{managerCopy.fields.template.placeholder}</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4 d-flex align-items-end">
            <button type="button" className="btn btn-outline-dark w-100 mb-0" onClick={onCreateNew}>
              {managerCopy.actions.new}
            </button>
          </div>
          <div className="col-md-8">
            <label className="form-label">{managerCopy.fields.title.label}</label>
            <input className="form-control" name="title" value={form.title} onChange={onChange} placeholder={managerCopy.fields.title.placeholder} />
          </div>
          <div className="col-md-4">
            <label className="form-label">{managerCopy.fields.useCaseBadge.label}</label>
            <input className="form-control" name="useCaseBadge" value={form.useCaseBadge} onChange={onChange} placeholder={managerCopy.fields.useCaseBadge.placeholder} />
          </div>
          <div className="col-md-7">
            <label className="form-label">{managerCopy.fields.key.label}</label>
            <input className="form-control" name="key" value={form.key} onChange={onChange} placeholder={managerCopy.fields.key.placeholder} />
          </div>
          <div className="col-md-5">
            <label className="form-label">{managerCopy.fields.status.label}</label>
            <input className="form-control" value={copy.templateStatusLabels[form.status] ?? form.status} disabled />
          </div>
          <div className="col-md-6">
            <label className="form-label">{copy.fields.niche.label}</label>
            <select className="form-select" name="niche" value={form.niche} onChange={onChange}>
              {copy.nicheOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">{copy.fields.objective.label}</label>
            <select className="form-select" name="objective" value={form.objective} onChange={onChange}>
              {copy.objectiveOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12">
            <label className="form-label">{managerCopy.fields.body.label}</label>
            <textarea className="form-control" name="body" rows="3" value={form.body} onChange={onChange} placeholder={managerCopy.fields.body.placeholder} />
          </div>
          <div className="col-md-6">
            <label className="form-label">{managerCopy.fields.variableTitle.label}</label>
            <input className="form-control" name="variableTitle" value={form.variableTitle} onChange={onChange} placeholder={managerCopy.fields.variableTitle.placeholder} />
          </div>
          <div className="col-md-6">
            <label className="form-label">{copy.fields.brandTone.label}</label>
            <select className="form-select" name="brandTone" value={form.brandTone} onChange={onChange}>
              {copy.brandToneOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">{copy.fields.offerText.label}</label>
            <input className="form-control" name="offerText" value={form.offerText} onChange={onChange} placeholder={copy.fields.offerText.placeholder} />
          </div>
          <div className="col-md-6">
            <label className="form-label">{copy.fields.productImageUrl.label}</label>
            <input className="form-control" name="productImageUrl" value={form.productImageUrl} onChange={onChange} placeholder={copy.fields.productImageUrl.placeholder} />
          </div>
          <div className="col-md-6">
            <label className="form-label">{copy.fields.presenterImageUrl.label}</label>
            <input className="form-control" name="presenterImageUrl" value={form.presenterImageUrl} onChange={onChange} placeholder={copy.fields.presenterImageUrl.placeholder} />
          </div>
          <div className="col-md-6">
            <label className="form-label">{copy.fields.priceText.label}</label>
            <input className="form-control" name="priceText" value={form.priceText} onChange={onChange} placeholder={copy.fields.priceText.placeholder} />
          </div>
          <div className="col-md-6">
            <label className="form-label">{copy.fields.ctaText.label}</label>
            <input className="form-control" name="ctaText" value={form.ctaText} onChange={onChange} placeholder={copy.fields.ctaText.placeholder} />
          </div>
          <div className="col-md-6">
            <label className="form-label">{copy.fields.sourceType.label}</label>
            <select className="form-select" name="sourceType" value={form.sourceType} onChange={onChange}>
              {copy.sourceTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12">
            <label className="form-label">{copy.fields.promptHint.label}</label>
            <textarea className="form-control" name="promptHint" rows="3" value={form.promptHint} onChange={onChange} placeholder={copy.fields.promptHint.placeholder} />
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2 mt-4">
          <button type="button" className="btn btn-primary mb-0" onClick={onSave} disabled={saving}>
            {saving ? managerCopy.actions.saving : managerCopy.actions.save}
          </button>
          {duplicateEnabled ? (
            <button type="button" className="btn btn-outline-dark mb-0" onClick={onDuplicate} disabled={!form.id || saving}>
              {managerCopy.actions.duplicate}
            </button>
          ) : null}
          <button type="button" className="btn btn-outline-primary mb-0" onClick={onPublish} disabled={!form.id || saving}>
            {managerCopy.actions.publish}
          </button>
          <button type="button" className="btn btn-outline-dark mb-0" onClick={onArchive} disabled={!form.id || saving}>
            {managerCopy.actions.archive}
          </button>
        </div>
      </div>
    </div>
  );
}

function TemplateAdminPanels({
  canManageWorkspaceTemplates,
  copy,
  isSuperadmin,
  locale,
  superadminLoading,
  superadminManagerCopy,
  superadminSaving,
  superadminTemplates,
  templateEditorForm,
  workspaceManagerCopy,
  workspaceTemplateEditorForm,
  workspaceTemplateLoading,
  workspaceTemplateSaving,
  workspaceTemplates,
  onChangeOfficial,
  onChangeOfficialStatus,
  onChangeWorkspace,
  onChangeWorkspaceStatus,
  onCreateNewOfficial,
  onCreateNewWorkspace,
  onDuplicateWorkspace,
  onLoadOfficial,
  onLoadWorkspace,
  onSaveOfficial,
  onSaveWorkspace
}) {
  if (!canManageWorkspaceTemplates && !isSuperadmin) {
    return null;
  }

  return (
    <details className="cf-content-advanced mt-3">
      <summary>{locale === "id" ? "Kelola template studio" : "Manage studio templates"}</summary>
      <p className="text-xs text-secondary mb-3">
        {locale === "id"
          ? "Panel ini khusus untuk superadmin atau operator workspace yang mengelola library template."
          : "This panel is reserved for superadmins or workspace operators managing the template library."}
      </p>
      <div className="row g-4">
        {canManageWorkspaceTemplates ? (
          <div className="col-12">
            <TemplateManagerCard
              badgeClass="bg-light text-dark border"
              copy={copy}
              form={workspaceTemplateEditorForm}
              loading={workspaceTemplateLoading}
              managerCopy={workspaceManagerCopy}
              templates={workspaceTemplates}
              saving={workspaceTemplateSaving}
              onChange={onChangeWorkspace}
              onCreateNew={onCreateNewWorkspace}
              onDuplicate={onDuplicateWorkspace}
              onLoadTemplate={onLoadWorkspace}
              onPublish={() => onChangeWorkspaceStatus("publish")}
              onArchive={() => onChangeWorkspaceStatus("archive")}
              duplicateEnabled
              onSave={onSaveWorkspace}
            />
          </div>
        ) : null}
        {isSuperadmin ? (
          <div className="col-12">
            <TemplateManagerCard
              badgeClass="bg-gradient-dark"
              copy={copy}
              form={templateEditorForm}
              loading={superadminLoading}
              managerCopy={superadminManagerCopy}
              templates={superadminTemplates}
              saving={superadminSaving}
              onChange={onChangeOfficial}
              onCreateNew={onCreateNewOfficial}
              onDuplicate={undefined}
              onLoadTemplate={onLoadOfficial}
              onPublish={() => onChangeOfficialStatus("publish")}
              onArchive={() => onChangeOfficialStatus("archive")}
              onSave={onSaveOfficial}
            />
          </div>
        ) : null}
      </div>
    </details>
  );
}

function FeedbackAlert({ feedback }) {
  if (!feedback) {
    return null;
  }

  return (
    <div className={`alert ${feedback.type === "error" ? "alert-danger" : "alert-success"} text-white mb-4`} role="alert">
      {feedback.message}
    </div>
  );
}

function OptionalPanels({ title, body, children }) {
  return (
    <details className="cf-content-advanced mt-3">
      <summary>
        <span>{title}</span>
        <span className="badge bg-light text-dark border ms-2">
          {title.toLowerCase().includes("optional") || title.toLowerCase().includes("opsional")
            ? (title.toLowerCase().includes("opsional") ? "boleh dilewati" : "optional")
            : ""}
        </span>
      </summary>
      <p className="text-xs text-secondary mb-3">{body}</p>
      {children}
    </details>
  );
}

function StudioStickyActionBar({
  activeStep,
  authLocked,
  authMessage,
  canRenderVideos,
  canSubmitPublishJobs,
  copy,
  locale,
  planning,
  publishReady,
  publishSubmitting,
  renderInFlight,
  renderSubmitting,
  reviewReady,
  savedLabel,
  stepOrder,
  submitting,
  workflowMode,
  onNextStep,
  onPreviewPlan,
  onPublish,
  onRender
}) {
  const activeIndex = Math.max(0, stepOrder.indexOf(activeStep));
  const hasBack = activeIndex > 0;
  const backStep = hasBack ? stepOrder[activeIndex - 1] : null;
  const nextStep = activeIndex < stepOrder.length - 1 ? stepOrder[activeIndex + 1] : null;
  let primaryLabel = locale === "id" ? "Lanjut" : "Continue";
  let onPrimary = () => {
    if (nextStep) {
      onNextStep(nextStep);
    }
  };
  let primaryDisabled = false;
  let secondaryLabel = null;
  let onSecondary = null;
  let secondaryDisabled = false;

  if (activeStep === "mode") {
    primaryLabel = locale === "id" ? "Lanjut ke brief" : "Continue to brief";
  } else if (activeStep === "brief") {
    primaryLabel = copy.actions.generateByMode?.[workflowMode] ?? copy.actions.generate;
    onPrimary = () => {
      if (typeof document === "undefined") {
        return;
      }

      const form = document.getElementById("content-studio-brief-form");
      if (form && typeof form.requestSubmit === "function") {
        form.requestSubmit();
      }
    };
    primaryDisabled = submitting || authLocked;
    secondaryLabel = copy.actions.previewPlan;
    onSecondary = onPreviewPlan;
    secondaryDisabled = planning || authLocked;
  } else if (activeStep === "review") {
    primaryLabel = copy.reviewActions.approveRender;
    onPrimary = onRender;
    primaryDisabled = renderSubmitting || !canRenderVideos || !reviewReady;
  } else if (activeStep === "templates") {
    primaryLabel = locale === "id" ? "Kembali ke brief" : "Back to brief";
    onPrimary = () => onNextStep("brief");
  } else if (activeStep === "render") {
    primaryLabel = copy.publishActions.queue;
    onPrimary = onPublish;
    primaryDisabled = publishSubmitting || !canSubmitPublishJobs || !publishReady;
    secondaryLabel = copy.renderActions.submit;
    onSecondary = onRender;
    secondaryDisabled = renderSubmitting || !canRenderVideos || renderInFlight;
  }

  return (
    <div className="cf-content-sticky-bar">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <p className="text-xs text-secondary mb-0">
          {savedLabel
            ? (locale === "id" ? `Autosave: ${savedLabel}` : `Autosave: ${savedLabel}`)
            : (locale === "id" ? "Autosave aktif" : "Autosave enabled")}
        </p>
        {authLocked ? (
          <span className="badge bg-light text-dark border">{authMessage}</span>
        ) : (
          <span className="badge bg-gradient-success">
            {locale === "id" ? "Sesi aktif" : "Session active"}
          </span>
        )}
      </div>
      <div className="d-flex flex-wrap gap-2">
        {hasBack && backStep ? (
          <button type="button" className="btn btn-outline-dark btn-sm mb-0" onClick={() => onNextStep(backStep)}>
            {locale === "id" ? "Kembali" : "Back"}
          </button>
        ) : null}
        {secondaryLabel && onSecondary ? (
          <button type="button" className="btn btn-outline-primary btn-sm mb-0" disabled={secondaryDisabled} onClick={onSecondary}>
            {secondaryLabel}
          </button>
        ) : null}
        <button type="button" className="btn btn-primary btn-sm mb-0 ms-auto" disabled={primaryDisabled} onClick={onPrimary}>
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}

function createSampleScript(copy) {
  return {
    id: "sample",
    title: copy.sampleDraft.title,
    hook: copy.sampleDraft.hook,
    body: copy.sampleDraft.body,
    cta: copy.sampleDraft.cta,
    languageCode: copy.sampleDraft.languageCode,
    sourceType: copy.sampleDraft.sourceType,
    status: "ready",
    createdAt: null
  };
}

function createTrackedProperties(form, workflowMode, extras = {}) {
  return {
    has_cta_text: Boolean(form.ctaText.trim()),
    has_offer_text: Boolean(form.offerText.trim()),
    has_presenter_image_url: Boolean(form.presenterImageUrl.trim()),
    has_product_image_url: Boolean(form.productImageUrl.trim()),
    has_product_image_asset: Array.isArray(form.productImageAssetIds) && form.productImageAssetIds.length > 0,
    has_price_text: Boolean(form.priceText.trim()),
    has_product_url: Boolean(form.productUrl.trim()),
    niche: form.niche,
    objective: form.objective,
    product_source_type: form.sourceType,
    video_engine: form.videoEngine,
    workflow_mode: workflowMode,
    ...extras
  };
}

function buildStudioRawBrief(form, workflowMode) {
  return {
    ctaText: form.ctaText.trim(),
    languageCode: form.languageCode,
    niche: form.niche,
    objective: form.objective,
    offerText: form.offerText.trim(),
    presenterImageUrl: form.presenterImageUrl.trim(),
    productImageAssetIds: Array.isArray(form.productImageAssetIds) ? form.productImageAssetIds : [],
    priceText: form.priceText.trim(),
    productImageUrl: form.productImageUrl.trim(),
    productUrl: form.productUrl.trim(),
    promptHint: form.promptHint.trim(),
    sourceType: form.sourceType,
    title: form.title.trim(),
    videoEngine: form.videoEngine,
    workflowMode
  };
}

function buildStudioDraftState({
  activeStudioStep,
  assemblyResult,
  connectedAccountForm,
  publishJob,
  renderBatch,
  renderJob,
  reviewTab,
  selectedConnectedAccountId,
  selectedScriptId,
  selectedTemplateId,
  templatePlan,
  templateScope
}) {
  return {
    activeStudioStep,
    assemblyResult,
    connectedAccountForm,
    publishJob,
    renderBatch,
    renderJob,
    reviewTab,
    selectedConnectedAccountId,
    selectedScriptId,
    selectedTemplateId,
    templatePlan,
    templateScope
  };
}

function deriveDirectorAngles(form) {
  const objectiveMap = {
    comparison: ["value_comparison", "best_pick"],
    problem_solution: ["pain_solution", "benefit_proof"],
    promo_offer: ["urgency_offer", "daily_benefit"],
    testimonial_style: ["trusted_review", "daily_routine"]
  };

  return objectiveMap[form.objective] ?? ["daily_benefit"];
}

function isAuthFailure(status, message) {
  if (status === 401) {
    return true;
  }

  if (typeof message !== "string") {
    return false;
  }

  const normalized = message.toLowerCase();
  return AUTH_FAILURE_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export default function ContentStudioPage() {
  const copy = useWebMessages().web.contentPage;
  const { locale } = useWebLocale();
  const [activeStudioStep, setActiveStudioStep] = useState(DEFAULT_STUDIO_STEP);
  const [workflowMode, setWorkflowMode] = useState(DEFAULT_WORKFLOW_MODE);
  const [reviewTab, setReviewTab] = useState("script");
  const [maxReachedStepIndex, setMaxReachedStepIndex] = useState(0);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [scripts, setScripts] = useState([]);
  const [selectedScriptId, setSelectedScriptId] = useState(null);
  const [reviewScriptDraft, setReviewScriptDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [templatePlan, setTemplatePlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [studioSessionId, setStudioSessionId] = useState("");
  const [templateScope, setTemplateScope] = useState(DEFAULT_TEMPLATE_SCOPE);
  const [templates, setTemplates] = useState([]);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [sessionState, setSessionState] = useState(INITIAL_SESSION_STATE);
  const [recentStudioSessions, setRecentStudioSessions] = useState([]);
  const [recentStudioSessionsLoading, setRecentStudioSessionsLoading] = useState(false);
  const [restoringStudioSessionId, setRestoringStudioSessionId] = useState(null);
  const [superadminTemplates, setSuperadminTemplates] = useState([]);
  const [superadminLoading, setSuperadminLoading] = useState(true);
  const [superadminSaving, setSuperadminSaving] = useState(false);
  const [templateEditorForm, setTemplateEditorForm] = useState(() => createTemplateEditorForm(null));
  const [workspaceTemplates, setWorkspaceTemplates] = useState([]);
  const [workspaceTemplateLoading, setWorkspaceTemplateLoading] = useState(true);
  const [workspaceTemplateSaving, setWorkspaceTemplateSaving] = useState(false);
  const [workspaceTemplateEditorForm, setWorkspaceTemplateEditorForm] = useState(() => createTemplateEditorForm(null));
  const [renderJob, setRenderJob] = useState(null);
  const [renderBatch, setRenderBatch] = useState(null);
  const [assemblyResult, setAssemblyResult] = useState(null);
  const [assemblySubmitting, setAssemblySubmitting] = useState(false);
  const [renderSubmitting, setRenderSubmitting] = useState(false);
  const [publishJob, setPublishJob] = useState(null);
  const [publishSubmitting, setPublishSubmitting] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [connectedAccountLoading, setConnectedAccountLoading] = useState(false);
  const [selectedConnectedAccountId, setSelectedConnectedAccountId] = useState("");
  const [connectedAccountForm, setConnectedAccountForm] = useState(DEFAULT_CONNECTED_ACCOUNT_FORM);
  const [connectedAccountSubmitting, setConnectedAccountSubmitting] = useState(false);
  const [productAssetUploadState, setProductAssetUploadState] = useState({
    assetId: null,
    fileName: "",
    previewUrl: "",
    uploading: false
  });
  const [reviewSaving, setReviewSaving] = useState(false);
  const [retryingSceneTaskId, setRetryingSceneTaskId] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState(null);
  const sessionStartedRef = useRef(false);
  const initialRestoreRef = useRef(true);
  const serverAutosaveInitRef = useRef(true);
  const serverSessionSyncingRef = useRef(false);
  const metadataLookupRef = useRef("");
  const templatePreviewTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (templatePreviewTimerRef.current) {
        window.clearTimeout(templatePreviewTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    try {
      const savedRaw = window.localStorage.getItem(STUDIO_STORAGE_KEY);
      const saved = savedRaw ? JSON.parse(savedRaw) : null;

      if (saved?.form && typeof saved.form === "object") {
        const derivedAssetId =
          Array.isArray(saved.form.productImageAssetIds) && saved.form.productImageAssetIds.length > 0
            ? saved.form.productImageAssetIds[0]
            : null;
        setForm((current) => ({
          ...current,
          ...saved.form,
          productImageUrl:
            saved.form.productImageUrl || derivedAssetId
              ? saved.form.productImageUrl || buildAssetContentUrl(derivedAssetId)
              : current.productImageUrl
        }));
        if (derivedAssetId) {
          setProductAssetUploadState((current) => ({
            ...current,
            assetId: derivedAssetId,
            fileName: locale === "id" ? "Asset produk tersimpan" : "Saved product asset"
          }));
        }
      }

      if (typeof saved?.workflowMode === "string") {
        setWorkflowMode(saved.workflowMode);
      }

      if (typeof saved?.reviewTab === "string") {
        setReviewTab(saved.reviewTab);
      }

      if (typeof saved?.activeStudioStep === "string" && STUDIO_STEP_ORDER.includes(saved.activeStudioStep)) {
        setActiveStudioStep(saved.activeStudioStep);
      }

      if (typeof saved?.templateScope === "string") {
        setTemplateScope(saved.templateScope);
      }

      if (typeof saved?.selectedTemplateId === "string") {
        setSelectedTemplateId(saved.selectedTemplateId);
      }

      if (saved?.templatePlan && typeof saved.templatePlan === "object") {
        setTemplatePlan(saved.templatePlan);
      }

      if (saved?.renderJob && typeof saved.renderJob === "object") {
        setRenderJob(saved.renderJob);
      }

      if (saved?.renderBatch && typeof saved.renderBatch === "object") {
        setRenderBatch(saved.renderBatch);
      }

      if (saved?.assemblyResult && typeof saved.assemblyResult === "object") {
        setAssemblyResult(saved.assemblyResult);
      }

      if (saved?.publishJob && typeof saved.publishJob === "object") {
        setPublishJob(saved.publishJob);
      }

      if (typeof saved?.selectedScriptId === "string") {
        setSelectedScriptId(saved.selectedScriptId);
      }

      if (typeof saved?.selectedConnectedAccountId === "string") {
        setSelectedConnectedAccountId(saved.selectedConnectedAccountId);
      }

      if (saved?.connectedAccountForm && typeof saved.connectedAccountForm === "object") {
        setConnectedAccountForm((current) => ({
          ...current,
          ...saved.connectedAccountForm
        }));
      }

      const restored = Boolean(
        saved?.form?.title ||
          saved?.form?.offerText ||
          saved?.form?.promptHint ||
          saved?.templatePlan?.scenePlan?.scenes?.length ||
          saved?.renderBatch?.batchId
      );

      setRestoredDraft(restored);
      setLastSavedAt(typeof saved?.updatedAt === "string" ? saved.updatedAt : null);
      setStudioSessionId(typeof saved?.sessionId === "string" ? saved.sessionId : createStudioSessionId());
    } catch {
      setStudioSessionId(createStudioSessionId());
      setRestoredDraft(false);
      setLastSavedAt(null);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSessionAuthorization() {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "same-origin"
        });
        const payload = await response.json().catch(() => null);

        if (!active) {
          return;
        }

        if (!response.ok || !payload?.authenticated) {
          setSessionState({
            authenticated: false,
            authorization: null,
            loading: false,
            message: copy.authRequiredMessage
          });
          return;
        }

        setSessionState({
          authenticated: true,
          authorization: payload.authorization ?? null,
          loading: false,
          message: null
        });
      } catch {
        if (!active) {
          return;
        }

        setSessionState({
          authenticated: false,
          authorization: null,
          loading: false,
          message: copy.authRequiredMessage
        });
      }
    }

    loadSessionAuthorization();

    return () => {
      active = false;
    };
  }, [copy.authRequiredMessage]);

  const sessionResolved = !sessionState.loading;
  const isAuthenticated = sessionState.authenticated;
  const sessionAuthorization = sessionState.authorization;
  const authRequiredMessage = sessionState.message ?? copy.authRequiredMessage;

  function markSessionInactive(message = copy.authRequiredMessage) {
    setSessionState({
      authenticated: false,
      authorization: null,
      loading: false,
      message
    });
  }

  function getRequestErrorMessage(response, payload, fallbackMessage) {
    if (isAuthFailure(response.status, payload?.message)) {
      markSessionInactive(copy.authRequiredMessage);
      return copy.authRequiredMessage;
    }

    return payload?.message ?? fallbackMessage;
  }

  function ensureAuthenticated() {
    if (sessionState.loading) {
      setFeedback({
        type: "error",
        message: copy.authCheckingMessage
      });
      return false;
    }

    if (!sessionState.authenticated) {
      setFeedback({
        type: "error",
        message: authRequiredMessage
      });
      return false;
    }

    return true;
  }

  async function ensureServerStudioSession(nextWorkflowMode = workflowMode) {
    if (!isAuthenticated || !studioSessionId || serverSessionSyncingRef.current) {
      return studioSessionId;
    }

    serverSessionSyncingRef.current = true;

    try {
      const response = await fetch("/api/content/studio-sessions", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          draftState: buildStudioDraftState({
            activeStudioStep,
            assemblyResult,
            connectedAccountForm,
            publishJob,
            renderBatch,
            renderJob,
            reviewTab,
            selectedConnectedAccountId,
            selectedScriptId,
            selectedTemplateId,
            templatePlan,
            templateScope
          }),
          rawBrief: buildStudioRawBrief(form, nextWorkflowMode),
          sessionId: studioSessionId,
          workflowMode: nextWorkflowMode
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, payload, copy.loadError));
      }

      const resolvedSessionId = payload?.item?.id ?? studioSessionId;
      if (resolvedSessionId !== studioSessionId) {
        setStudioSessionId(resolvedSessionId);
      }

      return resolvedSessionId;
    } finally {
      serverSessionSyncingRef.current = false;
    }
  }

  useEffect(() => {
    if (!sessionResolved) {
      return undefined;
    }

    if (!isAuthenticated) {
      setLoading(false);
      setScripts([]);
      setSelectedScriptId(null);
      return undefined;
    }

    let active = true;

    async function loadScripts(preferredId) {
      setLoading(true);

      try {
        const response = await fetch("/api/content/scripts?limit=8", {
          credentials: "same-origin"
        });
        const payload = await response.json().catch(() => null);

        if (!active) {
          return;
        }

        if (!response.ok) {
          if (isAuthFailure(response.status, payload?.message)) {
            setScripts([]);
            setSelectedScriptId(null);
            setFeedback(null);
            markSessionInactive(copy.authRequiredMessage);
            return;
          }

          setScripts([]);
          setFeedback({
            type: "error",
            message: payload?.message ?? copy.loadError
          });
          return;
        }

        const items = Array.isArray(payload?.items) ? payload.items : [];
        setScripts(items);
        setSelectedScriptId((currentId) => preferredId ?? currentId ?? items[0]?.id ?? null);
        setFeedback(null);
      } catch {
        if (!active) {
          return;
        }

        setScripts([]);
        setFeedback({
          type: "error",
          message: copy.loadError
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadScripts();

    return () => {
      active = false;
    };
  }, [copy.authRequiredMessage, copy.loadError, isAuthenticated, sessionResolved]);

  useEffect(() => {
    if (!sessionResolved) {
      return undefined;
    }

    if (!isAuthenticated) {
      setTemplateLoading(false);
      setTemplates([]);
      setSelectedTemplateId(null);
      return undefined;
    }

    let active = true;

    async function loadTemplates() {
      setTemplateLoading(true);

      try {
        const response = await fetch(`/api/content/templates?scope=${templateScope}`, {
          credentials: "same-origin"
        });
        const payload = await response.json().catch(() => null);

        if (!active) {
          return;
        }

        if (!response.ok) {
          if (isAuthFailure(response.status, payload?.message)) {
            setTemplates([]);
            setSelectedTemplateId(null);
            setFeedback(null);
            markSessionInactive(copy.authRequiredMessage);
            return;
          }

          setTemplates([]);
          setFeedback((current) => current ?? {
            type: "error",
            message: payload?.message ?? copy.templateLoadError
          });
          return;
        }

        const items = Array.isArray(payload?.items) ? payload.items : [];
        setTemplates(items);
        setSelectedTemplateId((currentId) => (
          items.some((item) => item.id === currentId) ? currentId : items[0]?.id ?? null
        ));
      } catch {
        if (!active) {
          return;
        }

        setTemplates([]);
        setFeedback((current) => current ?? {
          type: "error",
          message: copy.templateLoadError
        });
      } finally {
        if (active) {
          setTemplateLoading(false);
        }
      }
    }

    loadTemplates();

    return () => {
      active = false;
    };
  }, [copy.authRequiredMessage, copy.templateLoadError, isAuthenticated, sessionResolved, templateScope]);

  const isSuperadmin = sessionAuthorization?.platformRoleCode === "superadmin";
  const canCloneTemplates =
    isSuperadmin ||
    Boolean(sessionAuthorization?.permissions?.includes("content.generate"));
  const canManageWorkspaceTemplates = canCloneTemplates;
  const canRenderVideos =
    isSuperadmin ||
    Boolean(sessionAuthorization?.permissions?.includes("media.render"));
  const canReadRenderJobs =
    isSuperadmin ||
    Boolean(sessionAuthorization?.permissions?.includes("media.read"));
  const canSubmitPublishJobs =
    isSuperadmin ||
    Boolean(sessionAuthorization?.permissions?.includes("publishing.write"));
  const canReadPublishJobs =
    isSuperadmin ||
    Boolean(sessionAuthorization?.permissions?.includes("publishing.read"));
  const canManagePublishAccounts = canSubmitPublishJobs;

  useEffect(() => {
    if (!sessionResolved) {
      return undefined;
    }

    if (!isAuthenticated || !isSuperadmin) {
      setSuperadminTemplates([]);
      setSuperadminLoading(false);
      setTemplateEditorForm(createTemplateEditorForm(null));
      return undefined;
    }

    let active = true;

    async function loadSuperadminTemplates() {
      setSuperadminLoading(true);

      try {
        const response = await fetch("/api/content/templates?scope=official&includeUnpublished=true", {
          credentials: "same-origin"
        });
        const payload = await response.json().catch(() => null);

        if (!active) {
          return;
        }

        if (!response.ok) {
          if (isAuthFailure(response.status, payload?.message)) {
            setSuperadminTemplates([]);
            setFeedback(null);
            markSessionInactive(copy.authRequiredMessage);
            return;
          }

          setSuperadminTemplates([]);
          setFeedback((current) => current ?? {
            type: "error",
            message: payload?.message ?? copy.superadminLoadError
          });
          return;
        }

        const items = Array.isArray(payload?.items) ? payload.items : [];
        setSuperadminTemplates(items);
        setTemplateEditorForm((current) => {
          const matched = items.find((item) => item.id === current.id);
          return matched ? createTemplateEditorForm(matched) : createTemplateEditorForm(items[0] ?? null);
        });
      } catch {
        if (!active) {
          return;
        }

        setSuperadminTemplates([]);
        setFeedback((current) => current ?? {
          type: "error",
          message: copy.superadminLoadError
        });
      } finally {
        if (active) {
          setSuperadminLoading(false);
        }
      }
    }

    loadSuperadminTemplates();

    return () => {
      active = false;
    };
  }, [copy.authRequiredMessage, copy.superadminLoadError, isAuthenticated, isSuperadmin, sessionResolved]);

  useEffect(() => {
    if (!sessionResolved) {
      return undefined;
    }

    if (!isAuthenticated || !canManageWorkspaceTemplates) {
      setWorkspaceTemplates([]);
      setWorkspaceTemplateLoading(false);
      setWorkspaceTemplateEditorForm(createTemplateEditorForm(null));
      return undefined;
    }

    let active = true;

    async function loadWorkspaceTemplates() {
      setWorkspaceTemplateLoading(true);

      try {
        const response = await fetch("/api/content/templates?scope=workspace&includeUnpublished=true", {
          credentials: "same-origin"
        });
        const payload = await response.json().catch(() => null);

        if (!active) {
          return;
        }

        if (!response.ok) {
          if (isAuthFailure(response.status, payload?.message)) {
            setWorkspaceTemplates([]);
            setFeedback(null);
            markSessionInactive(copy.authRequiredMessage);
            return;
          }

          setWorkspaceTemplates([]);
          setFeedback((current) => current ?? {
            type: "error",
            message: payload?.message ?? copy.workspaceManagerLoadError
          });
          return;
        }

        const items = Array.isArray(payload?.items) ? payload.items : [];
        setWorkspaceTemplates(items);
        setWorkspaceTemplateEditorForm((current) => {
          const matched = items.find((item) => item.id === current.id);
          return matched ? createTemplateEditorForm(matched) : createTemplateEditorForm(items[0] ?? null);
        });
      } catch {
        if (!active) {
          return;
        }

        setWorkspaceTemplates([]);
        setFeedback((current) => current ?? {
          type: "error",
          message: copy.workspaceManagerLoadError
        });
      } finally {
        if (active) {
          setWorkspaceTemplateLoading(false);
        }
      }
    }

    loadWorkspaceTemplates();

    return () => {
      active = false;
    };
  }, [canManageWorkspaceTemplates, copy.authRequiredMessage, copy.workspaceManagerLoadError, isAuthenticated, sessionResolved]);

  useEffect(() => {
    if (!sessionResolved) {
      return undefined;
    }

    if (!isAuthenticated || (!canReadPublishJobs && !canManagePublishAccounts)) {
      setConnectedAccounts([]);
      setConnectedAccountLoading(false);
      return undefined;
    }

    let active = true;

    async function loadConnectedAccounts() {
      setConnectedAccountLoading(true);

      try {
        const response = await fetch("/api/publishing/connected-accounts?platformCode=tiktok", {
          credentials: "same-origin"
        });
        const payload = await response.json().catch(() => null);

        if (!active) {
          return;
        }

        if (!response.ok) {
          if (isAuthFailure(response.status, payload?.message)) {
            setConnectedAccounts([]);
            setFeedback(null);
            markSessionInactive(copy.authRequiredMessage);
            return;
          }

          setConnectedAccounts([]);
          setFeedback((current) => current ?? {
            type: "error",
            message: payload?.message ?? copy.publishAccountLoadError
          });
          return;
        }

        const items = Array.isArray(payload?.items) ? payload.items : [];
        setConnectedAccounts(items);
        setSelectedConnectedAccountId((currentId) => (
          items.some((item) => item.id === currentId) ? currentId : items[0]?.id ?? ""
        ));
      } catch {
        if (!active) {
          return;
        }

        setConnectedAccounts([]);
        setFeedback((current) => current ?? {
          type: "error",
          message: copy.publishAccountLoadError
        });
      } finally {
        if (active) {
          setConnectedAccountLoading(false);
        }
      }
    }

    loadConnectedAccounts();

    return () => {
      active = false;
    };
  }, [canManagePublishAccounts, canReadPublishJobs, copy.authRequiredMessage, copy.publishAccountLoadError, isAuthenticated, sessionResolved]);

  useEffect(() => {
    if (!sessionResolved) {
      return undefined;
    }

    if (!isAuthenticated) {
      setRecentStudioSessions([]);
      setRecentStudioSessionsLoading(false);
      return undefined;
    }

    let active = true;

    async function loadRecentStudioSessions() {
      setRecentStudioSessionsLoading(true);

      try {
        const response = await fetch("/api/content/studio-sessions?limit=6", {
          credentials: "same-origin"
        });
        const payload = await response.json().catch(() => null);

        if (!active) {
          return;
        }

        if (!response.ok) {
          if (isAuthFailure(response.status, payload?.message)) {
            setRecentStudioSessions([]);
            setFeedback(null);
            markSessionInactive(copy.authRequiredMessage);
            return;
          }

          setRecentStudioSessions([]);
          setFeedback((current) => current ?? {
            type: "error",
            message: payload?.message ?? copy.loadError
          });
          return;
        }

        setRecentStudioSessions(Array.isArray(payload?.items) ? payload.items : []);
      } catch {
        if (!active) {
          return;
        }

        setRecentStudioSessions([]);
      } finally {
        if (active) {
          setRecentStudioSessionsLoading(false);
        }
      }
    }

    loadRecentStudioSessions();

    return () => {
      active = false;
    };
  }, [copy.authRequiredMessage, copy.loadError, isAuthenticated, sessionResolved]);

  useEffect(() => {
    if (!sessionResolved || !isAuthenticated) {
      return undefined;
    }

    const productUrl = form.productUrl.trim();
    if (!productUrl || !/^https?:\/\//i.test(productUrl)) {
      metadataLookupRef.current = "";
      return undefined;
    }

    if (metadataLookupRef.current === productUrl) {
      return undefined;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/content/product-metadata?url=${encodeURIComponent(productUrl)}`, {
          credentials: "same-origin"
        });
        const payload = await response.json().catch(() => null);

        if (!active || !response.ok) {
          return;
        }

        const metadata = payload?.item;
        metadataLookupRef.current = productUrl;
        if (!metadata || typeof metadata !== "object") {
          return;
        }

        setForm((current) => ({
          ...current,
          niche:
            current.niche === DEFAULT_FORM.niche && typeof metadata.detected_niche === "string"
              ? metadata.detected_niche
              : current.niche,
          title: current.title.trim() ? current.title : metadata.name ?? current.title
        }));
      } catch {
        // Metadata lookup should stay silent and non-blocking.
      }
    }, 600);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [form.productUrl, isAuthenticated, sessionResolved]);

  useEffect(() => {
    if (!studioSessionId || !isAuthenticated || !canReadRenderJobs || !renderBatch?.batchId) {
      return undefined;
    }

    if (!["processing", "queued"].includes(renderBatch.status)) {
      return undefined;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/content/studio-sessions/${studioSessionId}/render-batch-status`, {
          credentials: "same-origin"
        });
        const payload = await response.json().catch(() => null);

        if (!active || !response.ok) {
          return;
        }

        if (payload?.renderBatch && typeof payload.renderBatch === "object") {
          setRenderBatch(payload.renderBatch);
        }

        if (payload?.primaryRenderJob && typeof payload.primaryRenderJob === "object") {
          setRenderJob(payload.primaryRenderJob);
        }
      } catch {
        // Batch polling should stay silent to avoid interrupting the studio.
      }
    }, 3500);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [canReadRenderJobs, isAuthenticated, renderBatch?.batchId, renderBatch?.status, studioSessionId]);

  useEffect(() => {
    if (!studioSessionId || !isAuthenticated || !renderBatch?.batchId) {
      return;
    }

    if (renderBatch.status !== "completed" || assemblyResult || assemblySubmitting) {
      return;
    }

    void assembleRenderBatch(studioSessionId, { silent: true });
  }, [assemblyResult, assemblySubmitting, isAuthenticated, renderBatch?.batchId, renderBatch?.status, studioSessionId]);

  useEffect(() => {
    if (!renderJob?.jobId || !canReadRenderJobs) {
      return;
    }

    if (!["queued", "processing"].includes(renderJob.status)) {
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/media/render-jobs/${renderJob.jobId}`, {
          credentials: "same-origin"
        });
        const payload = await response.json().catch(() => null);

        if (!active || !response.ok) {
          return;
        }

        setRenderJob(payload);
      } catch {
        // Polling should stay silent to avoid interrupting the studio.
      }
    }, 4000);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [canReadRenderJobs, renderJob]);

  useEffect(() => {
    if (!publishJob?.jobId || !canReadPublishJobs) {
      return;
    }

    if (!["scheduled", "queued", "processing"].includes(publishJob.status)) {
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/publishing/publish-jobs/${publishJob.jobId}`, {
          credentials: "same-origin"
        });
        const payload = await response.json().catch(() => null);

        if (!active || !response.ok) {
          return;
        }

        setPublishJob(payload);
      } catch {
        // Polling should stay silent to avoid interrupting the studio.
      }
    }, 5000);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [canReadPublishJobs, publishJob]);

  useEffect(() => {
    if (!storageReady || !studioSessionId) {
      return;
    }

    if (initialRestoreRef.current) {
      initialRestoreRef.current = false;
      return;
    }

    const payload = {
      activeStudioStep,
      assemblyResult,
      connectedAccountForm,
      form,
      publishJob,
      renderBatch,
      renderJob,
      reviewTab,
      selectedConnectedAccountId,
      selectedScriptId,
      selectedTemplateId,
      sessionId: studioSessionId,
      templateScope,
      templatePlan,
      updatedAt: new Date().toISOString(),
      workflowMode
    };

    window.localStorage.setItem(STUDIO_STORAGE_KEY, JSON.stringify(payload));
    setLastSavedAt(payload.updatedAt);
  }, [activeStudioStep, assemblyResult, connectedAccountForm, form, publishJob, renderBatch, renderJob, reviewTab, selectedConnectedAccountId, selectedScriptId, selectedTemplateId, storageReady, studioSessionId, templatePlan, templateScope, workflowMode]);

  useEffect(() => {
    if (!storageReady || !sessionResolved || !isAuthenticated || !studioSessionId) {
      return;
    }

    void ensureServerStudioSession(workflowMode).catch(() => {
      // Session bootstrap should stay silent and never block the UI.
    });
  }, [isAuthenticated, sessionResolved, storageReady, studioSessionId, workflowMode]);

  useEffect(() => {
    if (!storageReady || !sessionResolved || !isAuthenticated || !studioSessionId) {
      return;
    }

    if (serverAutosaveInitRef.current) {
      serverAutosaveInitRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const resolvedSessionId = await ensureServerStudioSession(workflowMode);
        if (!resolvedSessionId) {
          return;
        }

        const response = await fetch(`/api/content/studio-sessions/${resolvedSessionId}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json"
          },
          credentials: "same-origin",
          body: JSON.stringify({
            draftState: buildStudioDraftState({
              activeStudioStep,
              assemblyResult,
              connectedAccountForm,
              publishJob,
              renderBatch,
              renderJob,
              reviewTab,
              selectedConnectedAccountId,
              selectedScriptId,
              selectedTemplateId,
              templatePlan,
              templateScope
            }),
            lastLayer: "L0",
            rawBrief: buildStudioRawBrief(form, workflowMode),
            status: "draft",
            workflowMode
          })
        });
        const payload = await response.json().catch(() => null);

        if (response.ok) {
          setLastSavedAt(payload?.item?.updatedAt ?? new Date().toISOString());
        }
      } catch {
        // Remote autosave should stay silent and never block local work.
      }
    }, SERVER_AUTOSAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    activeStudioStep,
    assemblyResult,
    connectedAccountForm,
    form,
    isAuthenticated,
    publishJob,
    renderBatch,
    renderJob,
    reviewTab,
    selectedConnectedAccountId,
    selectedScriptId,
    selectedTemplateId,
    sessionResolved,
    storageReady,
    studioSessionId,
    templatePlan,
    templateScope,
    workflowMode
  ]);

  const trackStudioEvent = async (eventName, properties = {}) => {
    if (!studioSessionId || !isAuthenticated) {
      return;
    }

    try {
      await fetch("/api/events", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          eventName,
          locale,
          properties,
          sessionId: studioSessionId,
          surface: "web_app"
        })
      });
    } catch {
      // Analytics should never interrupt the studio flow.
    }
  };

  useEffect(() => {
    if (!storageReady || !studioSessionId || sessionStartedRef.current) {
      return;
    }

    sessionStartedRef.current = true;
    void trackStudioEvent("content.studio.session_started", {
      restored_draft: restoredDraft,
      workflow_mode: workflowMode
    });
  }, [restoredDraft, storageReady, studioSessionId, workflowMode]);

  const selectedScript =
    scripts.find((item) => item.id === selectedScriptId) ??
    scripts[0] ??
    createSampleScript(copy);

  const isSample = selectedScript.id === "sample";
  const effectiveReviewScript = reviewScriptDraft ?? selectedScript;
  const hasGeneratedScript = !isSample;
  const renderPreviewUrl = canReadRenderJobs ? getRenderOutputUrl(renderJob) : null;
  const renderPosterUrl = canReadRenderJobs ? getRenderPosterUrl(renderJob) : null;
  const modeCopy = copy.modeCheckpoints[workflowMode] ?? copy.modeCheckpoints.assisted;
  const superadminManagerCopy = {
    actions: copy.superadminActions,
    badge: copy.superadminBadge,
    body: copy.superadminBody,
    fields: copy.superadminFields,
    title: copy.superadminTitle
  };
  const workspaceManagerCopy = {
    actions: copy.workspaceManagerActions,
    badge: copy.workspaceManagerBadge,
    body: copy.workspaceManagerBody,
    fields: copy.workspaceManagerFields,
    title: copy.workspaceManagerTitle
  };
  const studioSteps = copy.studioSteps ?? [];
  const activeStepIndex = Math.max(0, STUDIO_STEP_ORDER.indexOf(activeStudioStep));
  const activeStepNumber = activeStepIndex + 1;
  const totalStudioSteps = STUDIO_STEP_ORDER.length;
  const stageProgressLabel = (copy.stageStepTemplate ?? "{{current}} / {{total}}")
    .replace("{{current}}", String(activeStepNumber))
    .replace("{{total}}", String(totalStudioSteps));

  useEffect(() => {
    setMaxReachedStepIndex((current) => Math.max(current, activeStepIndex));
  }, [activeStepIndex]);

  useEffect(() => {
    const allowedTabs = getReviewTabOptions(copy, workflowMode).map((tab) => tab.value);
    if (!allowedTabs.includes(reviewTab)) {
      setReviewTab(allowedTabs[0] ?? "validation");
    }
  }, [copy, reviewTab, workflowMode]);

  function moveToStep(nextStep) {
    if (!STUDIO_STEP_ORDER.includes(nextStep)) {
      return;
    }

    setActiveStudioStep(nextStep);
    setFeedback(null);
  }

  const stageSection = copy.stageSections?.[activeStudioStep] ?? {
    body: copy.generatorBody,
    eyebrow: copy.stageDefaultEyebrow,
    title: copy.pageTitle
  };
  const optionalPanelsTitle = locale === "id" ? "Panel tambahan (opsional)" : "Additional panels (optional)";
  const optionalPanelsBody = locale === "id"
    ? "Tampilkan panel ringkasan, draft terbaru, dan konfigurasi lanjutan hanya saat diperlukan."
    : "Show snapshots, recent drafts, and advanced controls only when needed.";
  const stageActions = [];

  if (activeStudioStep === "mode") {
    stageActions.push({
      label: copy.stageActions.startAi,
      onClick: () => moveToStep("brief"),
      variant: "primary"
    });
    stageActions.push({
      label: copy.stageActions.openManual,
      onClick: () => {
        setWorkflowMode("manual");
        moveToStep("brief");
      },
      variant: "secondary"
    });
  }

  if (activeStudioStep === "brief") {
    stageActions.push({
      label: copy.stageActions.openTemplates,
      onClick: () => moveToStep("templates"),
      variant: "secondary"
    });
  }

  if (activeStudioStep === "review") {
    stageActions.push({
      label: copy.stageActions.editBrief,
      onClick: () => moveToStep("brief"),
      variant: "secondary"
    });
  }

  if (activeStudioStep === "templates") {
    stageActions.push({
      label: copy.stageActions.backToBrief,
      onClick: () => moveToStep("brief"),
      variant: "secondary"
    });
  }

  if (activeStudioStep === "render") {
    stageActions.push({
      label: copy.stageActions.backToReview,
      onClick: () => moveToStep("review"),
      variant: "secondary"
    });
  }
  const reviewReady = Boolean(
    templatePlan?.templateRenderSpec &&
    effectiveReviewScript?.hook &&
    effectiveReviewScript?.body &&
    effectiveReviewScript?.cta
  );
  const renderInFlight =
    renderBatch?.status === "processing" ||
    renderBatch?.status === "queued" ||
    renderJob?.status === "queued" ||
    renderJob?.status === "processing";
  const savedLabel = formatDateLabel(locale, lastSavedAt);
  const canUploadAssets =
    isSuperadmin ||
    Boolean(sessionAuthorization?.permissions?.includes("assets.upload"));
  const recommendedTemplates = useMemo(() => {
    if (!Array.isArray(templates) || templates.length === 0) {
      return [];
    }

    const scoredTemplates = templates
      .map((template) => {
        let score = 0;

        if (template.niche === form.niche) {
          score += 5;
        }

        if (template.objective === form.objective) {
          score += 4;
        }

        if (workflowMode === "quick" && template.scope === "official") {
          score += 2;
        }

        if (template.variables?.brandTone && template.variables.brandTone === form.brandTone) {
          score += 1;
        }

        return {
          score,
          template
        };
      })
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 2)
      .map((item) => item.template);

    return scoredTemplates;
  }, [form.brandTone, form.niche, form.objective, templates, workflowMode]);

  useEffect(() => {
    setReviewScriptDraft(selectedScript);
  }, [
    selectedScript.body,
    selectedScript.createdAt,
    selectedScript.cta,
    selectedScript.hook,
    selectedScript.id,
    selectedScript.languageCode,
    selectedScript.sourceType,
    selectedScript.status,
    selectedScript.title
  ]);

  async function refreshTemplateCollections({
    libraryScope = templateScope,
    preferredLibraryId = null,
    preferredOfficialId = null,
    preferredWorkspaceId = null
  } = {}) {
    if (!isAuthenticated) {
      throw new Error(authRequiredMessage);
    }

    const [libraryResponse, superadminResponse, workspaceResponse] = await Promise.all([
      fetch(`/api/content/templates?scope=${libraryScope}`, {
        credentials: "same-origin"
      }),
      isSuperadmin
        ? fetch("/api/content/templates?scope=official&includeUnpublished=true", {
            credentials: "same-origin"
          })
        : Promise.resolve(null),
      canManageWorkspaceTemplates
        ? fetch("/api/content/templates?scope=workspace&includeUnpublished=true", {
            credentials: "same-origin"
          })
        : Promise.resolve(null)
    ]);

    const libraryPayload = await libraryResponse.json().catch(() => null);
    if (!libraryResponse.ok) {
      throw new Error(getRequestErrorMessage(libraryResponse, libraryPayload, copy.templateLoadError));
    }

    const libraryItems = Array.isArray(libraryPayload?.items) ? libraryPayload.items : [];
    setTemplates(libraryItems);
    setSelectedTemplateId((currentId) => (
      libraryItems.some((item) => item.id === (preferredLibraryId ?? currentId))
        ? preferredLibraryId ?? currentId
        : libraryItems[0]?.id ?? null
    ));

    if (superadminResponse) {
      const adminPayload = await superadminResponse.json().catch(() => null);
      if (!superadminResponse.ok) {
        throw new Error(getRequestErrorMessage(superadminResponse, adminPayload, copy.superadminLoadError));
      }

      const adminItems = Array.isArray(adminPayload?.items) ? adminPayload.items : [];
      setSuperadminTemplates(adminItems);
      const preferredTemplate =
        adminItems.find((item) => item.id === (preferredOfficialId ?? templateEditorForm.id)) ??
        adminItems[0] ??
        null;
      setTemplateEditorForm(createTemplateEditorForm(preferredTemplate));
    }

    if (workspaceResponse) {
      const workspacePayload = await workspaceResponse.json().catch(() => null);
      if (!workspaceResponse.ok) {
        throw new Error(getRequestErrorMessage(workspaceResponse, workspacePayload, copy.workspaceManagerLoadError));
      }

      const workspaceItems = Array.isArray(workspacePayload?.items) ? workspacePayload.items : [];
      setWorkspaceTemplates(workspaceItems);
      const preferredTemplate =
        workspaceItems.find((item) => item.id === (preferredWorkspaceId ?? workspaceTemplateEditorForm.id)) ??
        workspaceItems[0] ??
        null;
      setWorkspaceTemplateEditorForm(createTemplateEditorForm(preferredTemplate));
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleModeSelect(nextMode) {
    if (nextMode === workflowMode) {
      return;
    }

    setWorkflowMode(nextMode);
    const nextModeTabs = getReviewTabOptions(copy, nextMode);
    setReviewTab(nextModeTabs[0]?.value ?? "validation");
    setFeedback(null);
    void trackStudioEvent(
      "content.studio.mode_selected",
      createTrackedProperties(form, nextMode)
    );
    void ensureServerStudioSession(nextMode).catch(() => {
      // Mode switch should remain smooth even if remote sync fails.
    });
  }

  function handleTemplateEditorChange(event) {
    const { name, value } = event.target;
    setTemplateEditorForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleWorkspaceTemplateEditorChange(event) {
    const { name, value } = event.target;
    setWorkspaceTemplateEditorForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleCreateNewTemplate() {
    setTemplateEditorForm(createTemplateEditorForm(null));
    setFeedback(null);
  }

  function handleLoadSuperadminTemplate(templateId) {
    const selectedTemplate = superadminTemplates.find((item) => item.id === templateId) ?? null;
    setTemplateEditorForm(createTemplateEditorForm(selectedTemplate));
  }

  function handleCreateNewWorkspaceTemplate() {
    setWorkspaceTemplateEditorForm(createTemplateEditorForm(null));
    setFeedback(null);
  }

  function handleLoadWorkspaceTemplate(templateId) {
    const selectedTemplate = workspaceTemplates.find((item) => item.id === templateId) ?? null;
    setWorkspaceTemplateEditorForm(createTemplateEditorForm(selectedTemplate));
  }

  function handleTemplateScopeChange(nextScope) {
    if (nextScope === templateScope) {
      return;
    }

    setTemplateScope(nextScope);
    setPreviewTemplateId(null);
    setFeedback(null);
    void trackStudioEvent("content.template.scope_selected", {
      scope: nextScope,
      workflow_mode: workflowMode
    });
  }

  function handleTemplateQuickPreview(template) {
    if (!template?.id) {
      return;
    }

    if (templatePreviewTimerRef.current) {
      window.clearTimeout(templatePreviewTimerRef.current);
      templatePreviewTimerRef.current = null;
    }

    setPreviewTemplateId(template.id);
    templatePreviewTimerRef.current = window.setTimeout(() => {
      setPreviewTemplateId((current) => (current === template.id ? null : current));
      templatePreviewTimerRef.current = null;
    }, 3000);
    void trackStudioEvent("content.template.quick_preview", {
      template_id: template.id,
      template_key: template.key ?? null,
      template_scope: template.scope ?? null,
      workflow_mode: workflowMode
    });
  }

  function handleApplyTemplate(template) {
    setSelectedTemplateId(template.id);
    setPreviewTemplateId(null);
    setForm((current) => ({
      ...current,
      brandTone: template.variables.brandTone ?? current.brandTone,
      ctaText: template.variables.ctaText ?? current.ctaText,
      niche: template.niche,
      objective: template.objective,
      offerText: template.variables.offerText ?? current.offerText,
      presenterImageUrl: template.variables.presenterImageUrl ?? current.presenterImageUrl,
      productImageUrl: template.variables.productImageUrl ?? current.productImageUrl,
      priceText: template.variables.priceText ?? current.priceText,
      promptHint: template.variables.promptHint ?? current.promptHint,
      sourceType: template.variables.sourceType ?? current.sourceType,
      title: template.variables.title ?? current.title
    }));
    setTemplatePlan(null);
    setRenderJob(null);
    setRenderBatch(null);
    setAssemblyResult(null);
    setActiveStudioStep("brief");
    setFeedback({
      type: "success",
      message: copy.templateAppliedSuccess.replace("{{templateTitle}}", template.title)
    });
    void trackStudioEvent(
      "content.template.applied",
      createTrackedProperties(form, workflowMode, {
        template_id: template.id,
        template_key: template.key,
        template_scope: template.scope
      })
    );
  }

  async function handleCloneTemplate(template) {
    if (!ensureAuthenticated() || !canCloneTemplates) {
      return;
    }

    setTemplateLoading(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/content/templates/${template.id}/clone`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({})
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, result, copy.templateCloneError));
      }

      setTemplateScope("workspace");
      setSelectedTemplateId(result?.item?.id ?? null);
      setPreviewTemplateId(null);
      setForm((current) => ({
        ...current,
        brandTone: result?.item?.variables?.brandTone ?? current.brandTone,
        ctaText: result?.item?.variables?.ctaText ?? current.ctaText,
        niche: result?.item?.niche ?? current.niche,
        objective: result?.item?.objective ?? current.objective,
        offerText: result?.item?.variables?.offerText ?? current.offerText,
        presenterImageUrl: result?.item?.variables?.presenterImageUrl ?? current.presenterImageUrl,
        productImageUrl: result?.item?.variables?.productImageUrl ?? current.productImageUrl,
        priceText: result?.item?.variables?.priceText ?? current.priceText,
        promptHint: result?.item?.variables?.promptHint ?? current.promptHint,
        sourceType: result?.item?.variables?.sourceType ?? current.sourceType,
        title: result?.item?.variables?.title ?? current.title
      }));
      setTemplatePlan(null);
      setRenderJob(null);
      setRenderBatch(null);
      setAssemblyResult(null);
      setFeedback({
        type: "success",
        message: copy.templateCloneSuccess.replace("{{templateTitle}}", result?.item?.title ?? template.title)
      });
      await trackStudioEvent(
        "content.template.cloned",
        createTrackedProperties(form, workflowMode, {
          source_template_id: template.id,
          source_template_key: template.key
        })
      );
      await refreshTemplateCollections({
        libraryScope: "workspace",
        preferredLibraryId: result?.item?.id ?? null,
        preferredWorkspaceId: result?.item?.id ?? null
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : copy.templateCloneError
      });
    } finally {
      setTemplateLoading(false);
    }
  }

  async function handleDuplicateWorkspaceTemplate(template) {
    if (!ensureAuthenticated() || !canManageWorkspaceTemplates) {
      return;
    }

    setTemplateLoading(true);
    setWorkspaceTemplateSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/content/templates/${template.id}/duplicate`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({})
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, result, copy.workspaceManagerDuplicateError));
      }

      setTemplateScope("workspace");
      setSelectedTemplateId(result?.item?.id ?? null);
      setPreviewTemplateId(null);
      setWorkspaceTemplateEditorForm(createTemplateEditorForm(result?.item ?? null));
      setRenderJob(null);
      setRenderBatch(null);
      setAssemblyResult(null);
      setFeedback({
        type: "success",
        message: copy.workspaceManagerDuplicateSuccess.replace("{{templateTitle}}", result?.item?.title ?? template.title)
      });
      await trackStudioEvent(
        "content.template.duplicated",
        createTrackedProperties(form, workflowMode, {
          source_template_id: template.id,
          source_template_key: template.key,
          template_scope: template.scope
        })
      );
      await refreshTemplateCollections({
        libraryScope: "workspace",
        preferredLibraryId: result?.item?.id ?? null,
        preferredWorkspaceId: result?.item?.id ?? null
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : copy.workspaceManagerDuplicateError
      });
    } finally {
      setTemplateLoading(false);
      setWorkspaceTemplateSaving(false);
    }
  }

  async function handleSaveSuperadminTemplate() {
    if (!ensureAuthenticated()) {
      return;
    }

    if (!templateEditorForm.title.trim() || !templateEditorForm.key.trim()) {
      setFeedback({
        type: "error",
        message: copy.superadminValidation
      });
      return;
    }

    setSuperadminSaving(true);
    setFeedback(null);

    try {
      const payload = {
        body: templateEditorForm.body.trim(),
        key: templateEditorForm.key.trim(),
        niche: templateEditorForm.niche,
        objective: templateEditorForm.objective,
        scope: "official",
        status: templateEditorForm.status,
        title: templateEditorForm.title.trim(),
        useCaseBadge: templateEditorForm.useCaseBadge.trim(),
        variables: {
          brandTone: templateEditorForm.brandTone,
          ctaText: templateEditorForm.ctaText.trim(),
          offerText: templateEditorForm.offerText.trim(),
          presenterImageUrl: templateEditorForm.presenterImageUrl.trim(),
          productImageUrl: templateEditorForm.productImageUrl.trim(),
          priceText: templateEditorForm.priceText.trim(),
          promptHint: templateEditorForm.promptHint.trim(),
          sourceType: templateEditorForm.sourceType,
          title: templateEditorForm.variableTitle.trim()
        }
      };

      const response = await fetch(
        templateEditorForm.id
          ? `/api/content/templates/${templateEditorForm.id}`
          : "/api/content/templates",
        {
          method: templateEditorForm.id ? "PATCH" : "POST",
          headers: {
            "content-type": "application/json"
          },
          credentials: "same-origin",
          body: JSON.stringify(payload)
        }
      );
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, result, copy.superadminSaveError));
      }

      const savedTemplateId = result?.item?.id ?? templateEditorForm.id ?? null;
      await refreshTemplateCollections({
        preferredLibraryId: templateScope === "official" ? savedTemplateId : null,
        preferredOfficialId: savedTemplateId
      });
      setFeedback({
        type: "success",
        message: copy.superadminSaveSuccess
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : copy.superadminSaveError
      });
    } finally {
      setSuperadminSaving(false);
    }
  }

  async function handleChangeOfficialTemplateStatus(action) {
    if (!ensureAuthenticated() || !templateEditorForm.id) {
      return;
    }

    setSuperadminSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/content/templates/${templateEditorForm.id}/${action}`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({})
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, result, copy.superadminStatusError));
      }

      await refreshTemplateCollections({
        preferredLibraryId: templateScope === "official" ? templateEditorForm.id : null,
        preferredOfficialId: templateEditorForm.id
      });
      setFeedback({
        type: "success",
        message: action === "publish" ? copy.superadminPublishSuccess : copy.superadminArchiveSuccess
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : copy.superadminStatusError
      });
    } finally {
      setSuperadminSaving(false);
    }
  }

  async function handleSaveWorkspaceTemplate() {
    if (!ensureAuthenticated()) {
      return;
    }

    if (!workspaceTemplateEditorForm.title.trim() || !workspaceTemplateEditorForm.key.trim()) {
      setFeedback({
        type: "error",
        message: copy.workspaceManagerValidation
      });
      return;
    }

    setWorkspaceTemplateSaving(true);
    setFeedback(null);

    try {
      const payload = {
        body: workspaceTemplateEditorForm.body.trim(),
        key: workspaceTemplateEditorForm.key.trim(),
        niche: workspaceTemplateEditorForm.niche,
        objective: workspaceTemplateEditorForm.objective,
        scope: "workspace",
        status: workspaceTemplateEditorForm.status,
        title: workspaceTemplateEditorForm.title.trim(),
        useCaseBadge: workspaceTemplateEditorForm.useCaseBadge.trim(),
        variables: {
          brandTone: workspaceTemplateEditorForm.brandTone,
          ctaText: workspaceTemplateEditorForm.ctaText.trim(),
          offerText: workspaceTemplateEditorForm.offerText.trim(),
          presenterImageUrl: workspaceTemplateEditorForm.presenterImageUrl.trim(),
          productImageUrl: workspaceTemplateEditorForm.productImageUrl.trim(),
          priceText: workspaceTemplateEditorForm.priceText.trim(),
          promptHint: workspaceTemplateEditorForm.promptHint.trim(),
          sourceType: workspaceTemplateEditorForm.sourceType,
          title: workspaceTemplateEditorForm.variableTitle.trim()
        }
      };

      const response = await fetch(
        workspaceTemplateEditorForm.id
          ? `/api/content/templates/${workspaceTemplateEditorForm.id}`
          : "/api/content/templates",
        {
          method: workspaceTemplateEditorForm.id ? "PATCH" : "POST",
          headers: {
            "content-type": "application/json"
          },
          credentials: "same-origin",
          body: JSON.stringify(payload)
        }
      );
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, result, copy.workspaceManagerSaveError));
      }

      const savedTemplateId = result?.item?.id ?? workspaceTemplateEditorForm.id ?? null;
      await refreshTemplateCollections({
        preferredLibraryId: templateScope === "workspace" ? savedTemplateId : null,
        preferredWorkspaceId: savedTemplateId
      });
      setFeedback({
        type: "success",
        message: copy.workspaceManagerSaveSuccess
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : copy.workspaceManagerSaveError
      });
    } finally {
      setWorkspaceTemplateSaving(false);
    }
  }

  async function handleChangeWorkspaceTemplateStatus(action) {
    if (!ensureAuthenticated() || !workspaceTemplateEditorForm.id) {
      return;
    }

    setWorkspaceTemplateSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/content/templates/${workspaceTemplateEditorForm.id}/${action}`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({})
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, result, copy.workspaceManagerStatusError));
      }

      await refreshTemplateCollections({
        preferredLibraryId: templateScope === "workspace" ? workspaceTemplateEditorForm.id : null,
        preferredWorkspaceId: workspaceTemplateEditorForm.id
      });
      setFeedback({
        type: "success",
        message: action === "publish" ? copy.workspaceManagerPublishSuccess : copy.workspaceManagerArchiveSuccess
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : copy.workspaceManagerStatusError
      });
    } finally {
      setWorkspaceTemplateSaving(false);
    }
  }

  function handleConnectedAccountChange(event) {
    const { name, value } = event.target;
    setConnectedAccountForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function refreshConnectedAccounts(preferredId = null) {
    if (!isAuthenticated) {
      throw new Error(authRequiredMessage);
    }

    const response = await fetch("/api/publishing/connected-accounts?platformCode=tiktok", {
      credentials: "same-origin"
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(getRequestErrorMessage(response, payload, copy.publishAccountLoadError));
    }

    const items = Array.isArray(payload?.items) ? payload.items : [];
    setConnectedAccounts(items);
    setSelectedConnectedAccountId((currentId) => (
      items.some((item) => item.id === (preferredId ?? currentId)) ? preferredId ?? currentId : items[0]?.id ?? ""
    ));
  }

  async function handleCreateConnectedAccount() {
    if (!ensureAuthenticated()) {
      return;
    }

    if (!connectedAccountForm.accountLabel.trim()) {
      setFeedback({
        type: "error",
        message: copy.publishAccountValidation
      });
      return;
    }

    setConnectedAccountSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/publishing/connected-accounts", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          accountLabel: connectedAccountForm.accountLabel.trim(),
          externalAccountId: connectedAccountForm.externalAccountId.trim(),
          platformCode: connectedAccountForm.platformCode
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, payload, copy.publishAccountCreateError));
      }

      const accountId = payload?.account?.id ?? null;
      await refreshConnectedAccounts(accountId);
      setConnectedAccountForm(DEFAULT_CONNECTED_ACCOUNT_FORM);
      setFeedback({
        type: "success",
        message: copy.publishAccountCreateSuccess
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : copy.publishAccountCreateError
      });
    } finally {
      setConnectedAccountSubmitting(false);
    }
  }

  async function handleRenderPlan() {
    if (!ensureAuthenticated()) {
      return;
    }

    if (!templatePlan?.templateRenderSpec) {
      setFeedback({
        type: "error",
        message: copy.renderSubmitMissingPlan
      });
      return;
    }

    if (!canRenderVideos) {
      setFeedback({
        type: "error",
        message: copy.renderSubmitLocked
      });
      return;
    }

    const videoEngineConfig = getVideoEngineConfig(form.videoEngine);

    if (videoEngineConfig.readiness !== "ready") {
      setFeedback({
        type: "error",
        message: copy.renderEngineNotReady.replace("{{engine}}", copy.videoEngineLabels[form.videoEngine] ?? form.videoEngine)
      });
      return;
    }

    setRenderSubmitting(true);
    setFeedback(null);

    try {
      const sessionId = await ensureServerStudioSession(workflowMode);
      if (!sessionId) {
        throw new Error(copy.renderSubmitError);
      }

      const response = await fetch(`/api/content/studio-sessions/${sessionId}/render-batch`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          preferredProvider: videoEngineConfig.preferredProvider,
          scriptId: !isSample ? selectedScript.id : undefined
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, payload, copy.renderSubmitError));
      }

      if (payload?.renderBatch && typeof payload.renderBatch === "object") {
        setRenderBatch(payload.renderBatch);
      } else {
        setRenderBatch(null);
      }

      setAssemblyResult(null);
      setPublishJob(null);
      setRenderJob(payload?.primaryRenderJob ?? null);
      setActiveStudioStep("render");
      setFeedback({
        type: "success",
        message: copy.renderSubmitSuccess
      });
      await trackStudioEvent(
        "content.video_render.submitted",
        createTrackedProperties(form, workflowMode, {
          render_batch_id: payload?.renderBatch?.batchId ?? null,
          render_job_id: payload?.primaryRenderJob?.jobId ?? null,
          template_key: templatePlan?.templateRenderSpec?.templateKey ?? null
        })
      );
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : copy.renderSubmitError
      });
    } finally {
      setRenderSubmitting(false);
    }
  }

  async function assembleRenderBatch(sessionId, { silent = false } = {}) {
    if (!sessionId) {
      return null;
    }

    setAssemblySubmitting(true);

    try {
      const response = await fetch(`/api/content/studio-sessions/${sessionId}/assemble`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({})
      });
      const payload = await response.json().catch(() => null);

      if (response.status === 409) {
        if (payload?.renderBatch && typeof payload.renderBatch === "object") {
          setRenderBatch(payload.renderBatch);
        }
        return null;
      }

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, payload, copy.renderSubmitError));
      }

      if (payload?.renderBatch && typeof payload.renderBatch === "object") {
        setRenderBatch(payload.renderBatch);
      }

      if (payload?.primaryRenderJob && typeof payload.primaryRenderJob === "object") {
        setRenderJob(payload.primaryRenderJob);
      }

      if (payload?.assemblyResult && typeof payload.assemblyResult === "object") {
        setAssemblyResult(payload.assemblyResult);
      }

      await trackStudioEvent(
        "content.video_render.assembled",
        createTrackedProperties(form, workflowMode, {
          render_batch_id: payload?.renderBatch?.batchId ?? renderBatch?.batchId ?? null,
          render_job_id: payload?.primaryRenderJob?.jobId ?? renderJob?.jobId ?? null,
          video_asset_id: payload?.assemblyResult?.videoAssetId ?? payload?.primaryRenderJob?.outputAssetId ?? null
        })
      );

      return payload;
    } catch (error) {
      if (!silent) {
        setFeedback({
          type: "error",
          message: error instanceof Error ? error.message : copy.renderSubmitError
        });
      }

      return null;
    } finally {
      setAssemblySubmitting(false);
    }
  }

  async function handleQueuePublish() {
    if (!ensureAuthenticated()) {
      return;
    }

    if (!renderJob?.outputAssetId) {
      setFeedback({
        type: "error",
        message: copy.publishSubmitMissingAsset
      });
      return;
    }

    if (!canSubmitPublishJobs) {
      setFeedback({
        type: "error",
        message: copy.publishSubmitLocked
      });
      return;
    }

    setPublishSubmitting(true);

    try {
      const scheduledFor = new Date().toISOString();
      const response = await fetch("/api/publishing/publish-jobs", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          assetId: renderJob.outputAssetId,
          connectedAccountId: selectedConnectedAccountId || undefined,
          platformCode: "tiktok",
          scheduledFor
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, payload, copy.publishSubmitError));
      }

      setPublishJob(payload);
      setFeedback({
        type: "success",
        message: copy.publishSubmitSuccess
      });
      void trackStudioEvent("content.studio.publish_submitted", {
        platform_code: "tiktok",
        publish_job_id: payload?.jobId ?? null,
        render_job_id: renderJob.jobId
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : copy.publishSubmitError
      });
    } finally {
      setPublishSubmitting(false);
    }
  }

  function handleReset() {
    const nextSessionId = createStudioSessionId();

    sessionStartedRef.current = false;
    serverAutosaveInitRef.current = true;
    metadataLookupRef.current = "";
    setActiveStudioStep("brief");
    setMaxReachedStepIndex(STUDIO_STEP_ORDER.indexOf("brief"));
    setReviewTab(workflowMode === "quick" ? "validation" : "script");
    setForm(DEFAULT_FORM);
    setSelectedScriptId(null);
    setReviewScriptDraft(null);
    setTemplatePlan(null);
    setPublishJob(null);
    setRenderJob(null);
    setRenderBatch(null);
    setAssemblyResult(null);
    setProductAssetUploadState({
      assetId: null,
      fileName: "",
      previewUrl: "",
      uploading: false
    });
    setStudioSessionId(nextSessionId);
    setLastSavedAt(null);
    setRestoredDraft(false);
    setFeedback(null);
    void trackStudioEvent("content.studio.reset", {
      workflow_mode: workflowMode
    });
  }

  async function refreshScripts(preferredId) {
    if (!isAuthenticated) {
      throw new Error(authRequiredMessage);
    }

    const response = await fetch("/api/content/scripts?limit=8", {
      credentials: "same-origin"
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(getRequestErrorMessage(response, payload, copy.loadError));
    }

    const items = Array.isArray(payload?.items) ? payload.items : [];
    setScripts(items);
    setSelectedScriptId(preferredId ?? items[0]?.id ?? null);
    setFeedback(null);
  }

  async function refreshRecentStudioSessions() {
    if (!isAuthenticated) {
      throw new Error(authRequiredMessage);
    }

    const response = await fetch("/api/content/studio-sessions?limit=6", {
      credentials: "same-origin"
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(getRequestErrorMessage(response, payload, copy.loadError));
    }

    const items = Array.isArray(payload?.items) ? payload.items : [];
    setRecentStudioSessions(items);
  }

  function hydrateStudioSession(session) {
    const rawBrief = session?.rawBrief && typeof session.rawBrief === "object" ? session.rawBrief : {};
    const draftState = session?.draftState && typeof session.draftState === "object" ? session.draftState : {};
    const restoredWorkflowMode =
      typeof session?.workflowMode === "string" ? session.workflowMode : DEFAULT_WORKFLOW_MODE;
    const restoredForm = {
      ...DEFAULT_FORM,
      brandTone: typeof rawBrief.brandTone === "string" ? rawBrief.brandTone : DEFAULT_FORM.brandTone,
      ctaText: typeof rawBrief.ctaText === "string" ? rawBrief.ctaText : "",
      niche: typeof rawBrief.niche === "string" ? rawBrief.niche : DEFAULT_FORM.niche,
      objective: typeof rawBrief.objective === "string" ? rawBrief.objective : DEFAULT_FORM.objective,
      offerText: typeof rawBrief.offerText === "string" ? rawBrief.offerText : "",
      presenterImageUrl: typeof rawBrief.presenterImageUrl === "string" ? rawBrief.presenterImageUrl : "",
      priceText: typeof rawBrief.priceText === "string" ? rawBrief.priceText : "",
      productImageAssetIds: Array.isArray(rawBrief.productImageAssetIds) ? rawBrief.productImageAssetIds : [],
      productImageUrl: typeof rawBrief.productImageUrl === "string" ? rawBrief.productImageUrl : "",
      productUrl: typeof rawBrief.productUrl === "string" ? rawBrief.productUrl : "",
      promptHint: typeof rawBrief.promptHint === "string" ? rawBrief.promptHint : "",
      sourceType: typeof rawBrief.sourceType === "string" ? rawBrief.sourceType : DEFAULT_FORM.sourceType,
      title: typeof rawBrief.title === "string" ? rawBrief.title : "",
      videoEngine: typeof rawBrief.videoEngine === "string" ? rawBrief.videoEngine : DEFAULT_FORM.videoEngine,
      languageCode: typeof rawBrief.languageCode === "string" ? rawBrief.languageCode : DEFAULT_FORM.languageCode
    };
    if (!restoredForm.productImageUrl && restoredForm.productImageAssetIds.length > 0) {
      restoredForm.productImageUrl = buildAssetContentUrl(restoredForm.productImageAssetIds[0]);
    }
    const restoredActiveStep =
      typeof draftState.activeStudioStep === "string" && STUDIO_STEP_ORDER.includes(draftState.activeStudioStep)
        ? draftState.activeStudioStep
        : "brief";
    const restoredTemplatePlan = draftState.templatePlan && typeof draftState.templatePlan === "object"
      ? {
          ...draftState.templatePlan,
          renderSpecs: Array.isArray(session?.renderSpecs)
            ? session.renderSpecs
            : Array.isArray(draftState.templatePlan.renderSpecs)
              ? draftState.templatePlan.renderSpecs
              : [],
          scenePlan:
            session?.scenePlan && typeof session.scenePlan === "object"
              ? session.scenePlan
              : draftState.templatePlan.scenePlan ?? null
        }
      : session?.scenePlan && typeof session.scenePlan === "object"
        ? {
            renderSpecs: Array.isArray(session?.renderSpecs) ? session.renderSpecs : [],
            scenePlan: session.scenePlan,
            sceneSpecs: [],
            templateRenderSpec: null
          }
        : null;

    setStudioSessionId(session.id);
    setWorkflowMode(restoredWorkflowMode);
    setForm(restoredForm);
    setActiveStudioStep(restoredActiveStep);
    setMaxReachedStepIndex(Math.max(STUDIO_STEP_ORDER.indexOf(restoredActiveStep), 0));
    setReviewTab(
      typeof draftState.reviewTab === "string"
        ? draftState.reviewTab
        : restoredWorkflowMode === "quick"
          ? "validation"
          : "script"
    );
    setSelectedScriptId(typeof draftState.selectedScriptId === "string" ? draftState.selectedScriptId : null);
    setSelectedTemplateId(typeof draftState.selectedTemplateId === "string" ? draftState.selectedTemplateId : null);
    setTemplateScope(typeof draftState.templateScope === "string" ? draftState.templateScope : DEFAULT_TEMPLATE_SCOPE);
    setTemplatePlan(restoredTemplatePlan);
    setRenderJob(draftState.renderJob && typeof draftState.renderJob === "object" ? draftState.renderJob : null);
    setRenderBatch(draftState.renderBatch && typeof draftState.renderBatch === "object" ? draftState.renderBatch : null);
    setAssemblyResult(draftState.assemblyResult && typeof draftState.assemblyResult === "object" ? draftState.assemblyResult : null);
    setPublishJob(draftState.publishJob && typeof draftState.publishJob === "object" ? draftState.publishJob : null);
    setSelectedConnectedAccountId(
      typeof draftState.selectedConnectedAccountId === "string" ? draftState.selectedConnectedAccountId : ""
    );
    setConnectedAccountForm(
      draftState.connectedAccountForm && typeof draftState.connectedAccountForm === "object"
        ? {
            ...DEFAULT_CONNECTED_ACCOUNT_FORM,
            ...draftState.connectedAccountForm
          }
        : DEFAULT_CONNECTED_ACCOUNT_FORM
    );
    setProductAssetUploadState({
      assetId: Array.isArray(rawBrief.productImageAssetIds) ? rawBrief.productImageAssetIds[0] ?? null : null,
      fileName:
        Array.isArray(rawBrief.productImageAssetIds) && rawBrief.productImageAssetIds.length > 0
          ? locale === "id"
            ? `${rawBrief.productImageAssetIds.length} asset tersimpan`
            : `${rawBrief.productImageAssetIds.length} saved asset(s)`
          : "",
      previewUrl: "",
      uploading: false
    });
    setLastSavedAt(typeof session.updatedAt === "string" ? session.updatedAt : null);
    setRestoredDraft(true);
    setFeedback({
      type: "success",
      message: locale === "id" ? "Sesi studio berhasil dipulihkan." : "Studio session restored."
    });
  }

  async function handleProductAssetUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!ensureAuthenticated()) {
      return;
    }

    if (!canUploadAssets) {
      setFeedback({
        type: "error",
        message: locale === "id" ? "Akses upload asset belum tersedia." : "Asset upload access is not available."
      });
      return;
    }

    const previewUrl = window.URL.createObjectURL(file);
    setProductAssetUploadState({
      assetId: null,
      fileName: file.name,
      previewUrl,
      uploading: true
    });
    setFeedback(null);

    try {
      const response = await fetch("/api/assets/upload-url", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          assetType: "image",
          fileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type || "application/octet-stream"
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, payload, locale === "id" ? "Gagal menyiapkan upload asset." : "Unable to prepare asset upload."));
      }

      const uploadResponse = await fetch(payload.uploadUrl, {
        body: file,
        headers: {
          "content-type": file.type || "application/octet-stream"
        },
        method: "PUT",
        mode: "cors"
      });

      if (!uploadResponse.ok) {
        throw new Error(locale === "id" ? "Upload file gagal." : "File upload failed.");
      }

      setForm((current) => ({
        ...current,
        productImageAssetIds: payload?.assetId ? [payload.assetId] : current.productImageAssetIds,
        productImageUrl: payload?.assetId ? buildAssetContentUrl(payload.assetId) : current.productImageUrl
      }));
      setProductAssetUploadState({
        assetId: payload?.assetId ?? null,
        fileName: file.name,
        previewUrl,
        uploading: false
      });
      setFeedback({
        type: "success",
        message: locale === "id" ? "Foto produk berhasil di-upload." : "Product image uploaded."
      });
      await trackStudioEvent(
        "content.asset.product_uploaded",
        createTrackedProperties(form, workflowMode, {
          asset_id: payload?.assetId ?? null
        })
      );
    } catch (error) {
      setProductAssetUploadState({
        assetId: null,
        fileName: file.name,
        previewUrl,
        uploading: false
      });
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : (locale === "id" ? "Gagal upload asset." : "Asset upload failed.")
      });
    }
  }

  function handleScriptChange(field, value) {
    setReviewScriptDraft((current) => ({
      ...(current ?? selectedScript),
      [field]: value
    }));
  }

  function handleSceneTextChange(sceneId, value) {
    setTemplatePlan((current) => {
      if (!current?.scenePlan?.scenes?.length) {
        return current;
      }

      return {
        ...current,
        scenePlan: {
          ...current.scenePlan,
          scenes: current.scenePlan.scenes.map((scene) => (
            scene.id !== sceneId
              ? scene
              : {
                  ...scene,
                  textBlocks: Array.isArray(scene.textBlocks) && scene.textBlocks.length > 0
                    ? [
                        {
                          ...scene.textBlocks[0],
                          text: value
                        },
                        ...scene.textBlocks.slice(1)
                      ]
                    : [
                        {
                          style: "headline",
                          text: value
                        }
                      ]
                }
          ))
        }
      };
    });
  }

  async function handleSaveReview() {
    if (!ensureAuthenticated()) {
      return;
    }

    setReviewSaving(true);
    setFeedback(null);

    try {
      const sessionId = await ensureServerStudioSession(workflowMode);
      if (!sessionId) {
        throw new Error(locale === "id" ? "Sesi studio belum siap." : "Studio session is not ready.");
      }

      const tasks = [];

      if (!isSample && reviewTab === "script" && selectedScriptId && reviewScriptDraft) {
        tasks.push(
          fetch(`/api/content/scripts/${selectedScriptId}`, {
            method: "PATCH",
            headers: {
              "content-type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
              body: reviewScriptDraft.body ?? "",
              cta: reviewScriptDraft.cta ?? "",
              hook: reviewScriptDraft.hook ?? "",
              title: reviewScriptDraft.title ?? ""
            })
          }).then(async (response) => {
            const payload = await response.json().catch(() => null);
            if (!response.ok) {
              throw new Error(getRequestErrorMessage(response, payload, locale === "id" ? "Gagal menyimpan script." : "Unable to save script."));
            }

            if (payload?.item) {
              setScripts((current) => current.map((item) => (
                item.id === payload.item.id ? payload.item : item
              )));
              setReviewScriptDraft(payload.item);
            }
          })
        );
      }

      if (reviewTab === "videoPlan" && templatePlan?.scenePlan) {
        tasks.push(
          fetch(`/api/content/studio-sessions/${sessionId}`, {
            method: "PATCH",
            headers: {
              "content-type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({
              draftState: buildStudioDraftState({
                activeStudioStep,
                assemblyResult,
                connectedAccountForm,
                publishJob,
                renderBatch,
                renderJob,
                reviewTab,
                selectedConnectedAccountId,
                selectedScriptId,
                selectedTemplateId,
                templatePlan,
                templateScope
              }),
              lastLayer: "L4",
              renderSpecs: Array.isArray(templatePlan.renderSpecs) ? templatePlan.renderSpecs : [],
              scenePlan: templatePlan.scenePlan,
              status: renderInFlight ? "processing" : "draft",
              workflowMode
            })
          }).then(async (response) => {
            const payload = await response.json().catch(() => null);
            if (!response.ok) {
              throw new Error(getRequestErrorMessage(response, payload, locale === "id" ? "Gagal menyimpan scene plan." : "Unable to save scene plan."));
            }
          })
        );
      }

      if (tasks.length === 0) {
        throw new Error(locale === "id" ? "Belum ada perubahan yang bisa disimpan di tab ini." : "There are no edits to save on this tab.");
      }

      await Promise.all(tasks);
      setFeedback({
        type: "success",
        message: locale === "id" ? "Perubahan review berhasil disimpan." : "Review edits saved."
      });
      await trackStudioEvent("content.review.saved", {
        review_tab: reviewTab,
        session_id: sessionId,
        workflow_mode: workflowMode
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : (locale === "id" ? "Gagal menyimpan review." : "Unable to save review.")
      });
    } finally {
      setReviewSaving(false);
    }
  }

  async function handleRetrySceneRender(taskId) {
    if (!ensureAuthenticated()) {
      return;
    }

    if (!studioSessionId) {
      setFeedback({
        type: "error",
        message: locale === "id" ? "Sesi studio belum tersedia." : "Studio session is not available."
      });
      return;
    }

    setRetryingSceneTaskId(taskId);
    setFeedback(null);

    try {
      const response = await fetch(`/api/content/studio-sessions/${studioSessionId}/render-batch-jobs/${taskId}/retry`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          preferredProvider: getVideoEngineConfig(form.videoEngine).preferredProvider
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, payload, copy.renderSubmitError));
      }

      if (payload?.renderBatch && typeof payload.renderBatch === "object") {
        setRenderBatch(payload.renderBatch);
      }

      if (payload?.primaryRenderJob && typeof payload.primaryRenderJob === "object") {
        setRenderJob(payload.primaryRenderJob);
      }

      setAssemblyResult(null);
      setPublishJob(null);
      setFeedback({
        type: "success",
        message: locale === "id" ? "Scene dimasukkan ulang ke antrian render." : "Scene queued for retry."
      });
      await trackStudioEvent("content.video_render.scene_retried", {
        render_batch_id: renderBatch?.batchId ?? null,
        session_id: studioSessionId,
        task_id: taskId,
        workflow_mode: workflowMode
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : copy.renderSubmitError
      });
    } finally {
      setRetryingSceneTaskId(null);
    }
  }

  async function handleResumeStudioSession(sessionId) {
    if (!ensureAuthenticated()) {
      return;
    }

    setRestoringStudioSessionId(sessionId);
    setFeedback(null);

    try {
      const response = await fetch(`/api/content/studio-sessions/${sessionId}`, {
        credentials: "same-origin"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, payload, copy.loadError));
      }

      if (!payload?.item) {
        throw new Error(locale === "id" ? "Sesi studio tidak ditemukan." : "Studio session not found.");
      }

      hydrateStudioSession(payload.item);
      if (typeof payload.item?.draftState?.selectedScriptId === "string") {
        await refreshScripts(payload.item.draftState.selectedScriptId);
      }
      await refreshRecentStudioSessions();
      await trackStudioEvent("content.studio.resumed", {
        resumed_session_id: sessionId,
        workflow_mode: payload.item?.workflowMode ?? workflowMode
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : copy.loadError
      });
    } finally {
      setRestoringStudioSessionId(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!ensureAuthenticated()) {
      return;
    }

    if (!form.title.trim()) {
      setFeedback({
        type: "error",
        message: copy.validationTitle
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    await trackStudioEvent(
      "content.brief.submitted",
      createTrackedProperties(form, workflowMode)
    );

    try {
      const sessionId = await ensureServerStudioSession(workflowMode);
      if (!sessionId) {
        throw new Error(copy.generateError);
      }

      const rawBrief = buildStudioRawBrief(form, workflowMode);

      const extractionResponse = await fetch(`/api/content/studio-sessions/${sessionId}/extract-context`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          rawBrief
        })
      });
      const extractionPayload = await extractionResponse.json().catch(() => null);

      if (!extractionResponse.ok) {
        throw new Error(getRequestErrorMessage(extractionResponse, extractionPayload, copy.generateError));
      }

      if (extractionPayload?.readyToProceed === false) {
        const missingFields = Array.isArray(extractionPayload?.missingFields)
          ? extractionPayload.missingFields.join(", ")
          : "";
        throw new Error(
          missingFields
            ? `Brief belum cukup lengkap. Lengkapi: ${missingFields}`
            : copy.validationTitle
        );
      }

      const directorResponse = await fetch(`/api/content/studio-sessions/${sessionId}/director-scripts`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          angles: deriveDirectorAngles(form),
          languageCode: form.languageCode,
          rawBrief
        })
      });
      const directorPayload = await directorResponse.json().catch(() => null);

      if (!directorResponse.ok) {
        throw new Error(getRequestErrorMessage(directorResponse, directorPayload, copy.generateError));
      }

      const response = await fetch("/api/content/scripts", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          ...form,
          title: form.title.trim(),
          productUrl: form.productUrl.trim(),
          promptHint: form.promptHint.trim(),
          studioSessionId: sessionId,
          workflowMode
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, payload, copy.generateError));
      }

      await refreshScripts(payload?.scriptId ?? payload?.script?.id ?? null);
      setRenderJob(null);
      setRenderBatch(null);
      setAssemblyResult(null);
      setPublishJob(null);
      setReviewTab(workflowMode === "quick" ? "validation" : "script");
      setActiveStudioStep("review");
      setFeedback({
        type: "success",
        message: copy.generateSuccess
      });
      await trackStudioEvent(
        "content.script.generated",
        createTrackedProperties(form, workflowMode)
      );
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : copy.generateError
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePreviewPlan() {
    if (!ensureAuthenticated()) {
      return;
    }

    if (!form.title.trim()) {
      setFeedback({
        type: "error",
        message: copy.validationTitle
      });
      return;
    }

    setPlanning(true);
    setFeedback(null);

    try {
      const sessionId = await ensureServerStudioSession(workflowMode);
      if (!sessionId) {
        throw new Error(copy.planError);
      }

      const rawBrief = buildStudioRawBrief(form, workflowMode);
      const scenePlanResponse = await fetch(`/api/content/studio-sessions/${sessionId}/scene-plan`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          languageCode: form.languageCode,
          rawBrief
        })
      });
      const scenePlanPayload = await scenePlanResponse.json().catch(() => null);

      if (!scenePlanResponse.ok) {
        throw new Error(getRequestErrorMessage(scenePlanResponse, scenePlanPayload, copy.planError));
      }

      const renderSpecResponse = await fetch(`/api/content/studio-sessions/${sessionId}/render-specs`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          languageCode: form.languageCode,
          rawBrief,
          scenePlan: scenePlanPayload?.scenePlan
        })
      });
      const renderSpecPayload = await renderSpecResponse.json().catch(() => null);

      if (!renderSpecResponse.ok) {
        throw new Error(getRequestErrorMessage(renderSpecResponse, renderSpecPayload, copy.planError));
      }

      const payload = {
        renderSpecs: Array.isArray(renderSpecPayload?.renderSpecs) ? renderSpecPayload.renderSpecs : [],
        scenePlan: renderSpecPayload?.scenePlan ?? scenePlanPayload?.scenePlan ?? null,
        sceneSpecs: Array.isArray(scenePlanPayload?.sceneSpecs) ? scenePlanPayload.sceneSpecs : [],
        templateRenderSpec: renderSpecPayload?.templateRenderSpec ?? null
      };

      await fetch(`/api/content/studio-sessions/${sessionId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          lastLayer: "L4",
          renderSpecs: payload.renderSpecs,
          scenePlan: payload.scenePlan,
          status: "draft",
          workflowMode
        })
      }).catch(() => null);

      setTemplatePlan(payload);
      setRenderJob(null);
      setRenderBatch(null);
      setAssemblyResult(null);
      setReviewTab(workflowMode === "quick" ? "validation" : "videoPlan");
      setActiveStudioStep("review");
      setFeedback({
        type: "success",
        message: copy.planSuccess
      });
      await trackStudioEvent(
        "content.video_plan.previewed",
        createTrackedProperties(form, workflowMode, {
          scene_count: payload?.scenePlan?.scenes?.length ?? 0,
          session_id: sessionId
        })
      );
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : copy.planError
      });
    } finally {
      setPlanning(false);
    }
  }

  return (
    <ArgonPage pageTitle={copy.pageTitle} activeRoute="content">
      <div className="container-fluid py-4 cf-internal-page cf-content-page">
        <SessionPanel />
        <FeedbackAlert feedback={feedback} />

        <div className="row g-4">
          <div className="col-12">
            <HeroCard copy={copy} />
          </div>
        </div>

        <div className="row g-4 mt-1">
          <div className="col-12">
            <StudioFlowNav
              activeStep={activeStudioStep}
              copy={copy}
              maxReachedStepIndex={maxReachedStepIndex}
              workflowMode={workflowMode}
              steps={studioSteps}
              onSelectStep={moveToStep}
            />
          </div>
          <div className="col-12">
            <StageIntroCard
              actions={stageActions}
              body={stageSection.body}
              eyebrow={stageSection.eyebrow}
              progressLabel={stageProgressLabel}
              title={stageSection.title}
            />
          </div>
        </div>

        {activeStudioStep === "mode" ? (
          <>
            <div className="row g-4 mt-1">
              <div className="col-12">
                <ModeSelectorCard
                  copy={copy}
                  lastSavedAt={lastSavedAt}
                  locale={locale}
                  restoredDraft={restoredDraft}
                  workflowMode={workflowMode}
                  onSelectMode={handleModeSelect}
                />
              </div>
            </div>
            <OptionalPanels title={optionalPanelsTitle} body={optionalPanelsBody}>
              <div className="row g-4">
                <div className="col-12">
                  <PlaybookCard copy={copy} />
                </div>
              </div>
            </OptionalPanels>
          </>
        ) : null}

        {activeStudioStep === "brief" ? (
          <>
            <div className="row g-4 mt-1">
              <div className="col-12">
                <GeneratorCard
                  authLocked={!sessionResolved || !isAuthenticated}
                  authMessage={sessionResolved ? authRequiredMessage : copy.authCheckingMessage}
                  canUploadAssets={canUploadAssets}
                  copy={copy}
                  form={form}
                  locale={locale}
                  modeCopy={modeCopy}
                  onChange={handleChange}
                  onProductAssetUpload={handleProductAssetUpload}
                  onPreviewPlan={handlePreviewPlan}
                  onReset={handleReset}
                  onSwitchMode={handleModeSelect}
                  onSubmit={handleSubmit}
                  planning={planning}
                  productAssetUploadState={productAssetUploadState}
                  submitting={submitting}
                  workflowModes={copy.workflowModes}
                  workflowMode={workflowMode}
                />
              </div>
            </div>
            <OptionalPanels title={optionalPanelsTitle} body={optionalPanelsBody}>
              <div className="row g-4">
                <div className="col-xl-7">
                  <BriefSnapshotCard
                    copy={copy}
                    form={form}
                    hasGeneratedScript={hasGeneratedScript}
                    lastSavedAt={lastSavedAt}
                    locale={locale}
                    templatePlan={templatePlan}
                    workflowMode={workflowMode}
                  />
                </div>
                <div className="col-xl-5">
                  <RecentStudioSessionsCard
                    items={recentStudioSessions}
                    loading={recentStudioSessionsLoading}
                    locale={locale}
                    onResume={handleResumeStudioSession}
                    restoringStudioSessionId={restoringStudioSessionId}
                  />
                </div>
              </div>
            </OptionalPanels>
          </>
        ) : null}

        {activeStudioStep === "review" ? (
          <>
            <div className="row g-4 mt-1">
              <div className="col-12">
                <ReviewApproveCard
                  canRender={canRenderVideos}
                  copy={copy}
                  form={form}
                  isSample={isSample}
                  locale={locale}
                  loading={planning}
                  onEditBrief={() => moveToStep("brief")}
                  onSaveReview={handleSaveReview}
                  onSceneTextChange={handleSceneTextChange}
                  onScriptChange={handleScriptChange}
                  onRender={handleRenderPlan}
                  plan={templatePlan}
                  renderJob={renderJob}
                  renderSubmitting={renderSubmitting}
                  reviewSaving={reviewSaving}
                  reviewTab={reviewTab}
                  script={effectiveReviewScript}
                  workflowMode={workflowMode}
                  setReviewTab={setReviewTab}
                />
              </div>
            </div>
            <OptionalPanels title={optionalPanelsTitle} body={optionalPanelsBody}>
              <div className="row g-4">
                <div className="col-12">
                  <BriefSnapshotCard
                    copy={copy}
                    form={form}
                    hasGeneratedScript={hasGeneratedScript}
                    lastSavedAt={lastSavedAt}
                    locale={locale}
                    templatePlan={templatePlan}
                    workflowMode={workflowMode}
                  />
                </div>
              </div>
            </OptionalPanels>
          </>
        ) : null}

        {activeStudioStep === "templates" ? (
          <>
            <div className="row g-4 mt-1">
              <div className="col-12">
                <TemplateLibraryCard
                  canClone={canCloneTemplates}
                  canDuplicate={canManageWorkspaceTemplates}
                  copy={copy}
                  locale={locale}
                  loading={templateLoading}
                  onCloneTemplate={handleCloneTemplate}
                  onPreviewTemplate={handleTemplateQuickPreview}
                  onDuplicateTemplate={handleDuplicateWorkspaceTemplate}
                  previewTemplateId={previewTemplateId}
                  recommendedTemplates={recommendedTemplates}
                  scope={templateScope}
                  selectedTemplateId={selectedTemplateId}
                  templates={templates}
                  onApplyTemplate={handleApplyTemplate}
                  onChangeScope={handleTemplateScopeChange}
                />
              </div>
            </div>
            <OptionalPanels title={optionalPanelsTitle} body={optionalPanelsBody}>
              <div className="row g-4">
                <div className="col-12">
                  <BriefSnapshotCard
                    copy={copy}
                    form={form}
                    hasGeneratedScript={hasGeneratedScript}
                    lastSavedAt={lastSavedAt}
                    locale={locale}
                    templatePlan={templatePlan}
                    workflowMode={workflowMode}
                  />
                </div>
                <div className="col-12">
                  <TemplateAdminPanels
                    canManageWorkspaceTemplates={canManageWorkspaceTemplates}
                    copy={copy}
                    isSuperadmin={isSuperadmin}
                    locale={locale}
                    superadminLoading={superadminLoading}
                    superadminManagerCopy={superadminManagerCopy}
                    superadminSaving={superadminSaving}
                    superadminTemplates={superadminTemplates}
                    templateEditorForm={templateEditorForm}
                    workspaceManagerCopy={workspaceManagerCopy}
                    workspaceTemplateEditorForm={workspaceTemplateEditorForm}
                    workspaceTemplateLoading={workspaceTemplateLoading}
                    workspaceTemplateSaving={workspaceTemplateSaving}
                    workspaceTemplates={workspaceTemplates}
                    onChangeOfficial={handleTemplateEditorChange}
                    onChangeOfficialStatus={handleChangeOfficialTemplateStatus}
                    onChangeWorkspace={handleWorkspaceTemplateEditorChange}
                    onChangeWorkspaceStatus={handleChangeWorkspaceTemplateStatus}
                    onCreateNewOfficial={handleCreateNewTemplate}
                    onCreateNewWorkspace={handleCreateNewWorkspaceTemplate}
                    onDuplicateWorkspace={() => handleDuplicateWorkspaceTemplate(workspaceTemplateEditorForm)}
                    onLoadOfficial={handleLoadSuperadminTemplate}
                    onLoadWorkspace={handleLoadWorkspaceTemplate}
                    onSaveOfficial={handleSaveSuperadminTemplate}
                    onSaveWorkspace={handleSaveWorkspaceTemplate}
                  />
                </div>
              </div>
            </OptionalPanels>
          </>
        ) : null}

        {activeStudioStep === "render" ? (
          <>
            <div className="row g-4 mt-1">
              <div className="col-12">
                <PlanPreviewCard
                  assemblyResult={assemblyResult}
                  canManagePublishAccounts={canManagePublishAccounts}
                  canSubmitPublish={canSubmitPublishJobs}
                  canRender={canRenderVideos}
                  connectedAccountForm={connectedAccountForm}
                  connectedAccountLoading={connectedAccountLoading}
                  connectedAccounts={connectedAccounts}
                  copy={copy}
                  loading={planning}
                  locale={locale}
                  onConnectedAccountChange={handleConnectedAccountChange}
                  onCreateConnectedAccount={handleCreateConnectedAccount}
                  onPublish={handleQueuePublish}
                  onRender={handleRenderPlan}
                  onRetryScene={handleRetrySceneRender}
                  onSelectConnectedAccount={setSelectedConnectedAccountId}
                  plan={templatePlan}
                  publishJob={publishJob}
                  publishSubmitting={publishSubmitting}
                  renderBatch={renderBatch}
                  renderJob={renderJob}
                  renderPosterUrl={renderPosterUrl}
                  renderPreviewUrl={renderPreviewUrl}
                  renderSubmitting={renderSubmitting}
                  retryingSceneTaskId={retryingSceneTaskId}
                  selectedVideoEngine={form.videoEngine}
                  selectedConnectedAccountId={selectedConnectedAccountId}
                  submitConnectedAccount={connectedAccountSubmitting}
                />
              </div>
            </div>
            <OptionalPanels title={optionalPanelsTitle} body={optionalPanelsBody}>
              <div className="row g-4">
                <div className="col-12">
                  <BriefSnapshotCard
                    copy={copy}
                    form={form}
                    hasGeneratedScript={hasGeneratedScript}
                    lastSavedAt={lastSavedAt}
                    locale={locale}
                    templatePlan={templatePlan}
                    workflowMode={workflowMode}
                  />
                </div>
              </div>
            </OptionalPanels>
          </>
        ) : null}

        <StudioStickyActionBar
          activeStep={activeStudioStep}
          authLocked={!sessionResolved || !isAuthenticated}
          authMessage={sessionResolved ? authRequiredMessage : copy.authCheckingMessage}
          canRenderVideos={canRenderVideos}
          canSubmitPublishJobs={canSubmitPublishJobs}
          copy={copy}
          locale={locale}
          planning={planning}
          publishReady={Boolean(renderJob?.outputAssetId)}
          publishSubmitting={publishSubmitting}
          renderInFlight={renderInFlight}
          renderSubmitting={renderSubmitting}
          reviewReady={reviewReady}
          savedLabel={savedLabel}
          stepOrder={STUDIO_STEP_ORDER}
          submitting={submitting}
          workflowMode={workflowMode}
          onNextStep={moveToStep}
          onPreviewPlan={handlePreviewPlan}
          onPublish={handleQueuePublish}
          onRender={handleRenderPlan}
        />

        <ArgonFooter />
      </div>
    </ArgonPage>
  );
}
