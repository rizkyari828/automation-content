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

function StudioFlowNav({ activeStep, copy, onSelectStep, steps, workflowMode }) {
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
        <div className="cf-content-flow-nav mt-3">
          {steps.map((step, index) => {
            const active = step.value === activeStep;

            return (
              <button
                key={step.value}
                type="button"
                className={`cf-content-flow-step${active ? " is-active" : ""}`}
                onClick={() => onSelectStep(step.value)}
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
  copy,
  form,
  modeCopy,
  onChange,
  onPreviewPlan,
  onReset,
  onSubmit,
  planning,
  submitting,
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
      </div>
      <div className="card-body p-3">
        <div className="cf-content-checkpoint mb-4">
          <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
            {modeCopy.eyebrow}
          </p>
          <h6 className="text-sm mb-1">{modeCopy.title}</h6>
          <p className="text-xs text-secondary mb-0">{modeCopy.body}</p>
        </div>

        <form onSubmit={onSubmit}>
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
              <details className="cf-content-advanced">
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
            <strong>{form.productImageUrl.trim() ? copy.snapshotStatus.done : copy.snapshotStatus.next}</strong>
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
  loading,
  onEditBrief,
  onRender,
  plan,
  renderJob,
  renderSubmitting,
  reviewTab,
  script,
  workflowMode,
  setReviewTab
}) {
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
      state: form.productImageUrl.trim() ? "ok" : "warn",
      text: form.productImageUrl.trim()
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
          {copy.reviewTabs.map((tab) => {
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
              <div className="d-flex flex-wrap gap-2 mt-3">
                <span className={`badge ${isSample ? "bg-light text-dark border" : STATUS_BADGE_CLASS[script.status] ?? "bg-gradient-dark"}`}>
                  {isSample ? copy.sampleBadge : copy.statusLabels[script.status] ?? script.status}
                </span>
                <span className="badge bg-light text-dark border">{copy.workflowModeLabels[workflowMode] ?? workflowMode}</span>
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
                      <h6 className="mb-0 mt-1">{copy.nicheLabels[plan.templateRenderSpec.niche]}</h6>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="cf-content-mini-stat">
                      <span className="text-xs text-uppercase text-secondary">{copy.planMeta.objective}</span>
                      <h6 className="mb-0 mt-1">{copy.objectiveLabels[plan.templateRenderSpec.objective]}</h6>
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
                            <h6 className="text-sm mb-1 mt-1">{scene.textBlocks?.[0]?.text ?? copy.planFallbackText}</h6>
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
        </div>
      </div>
      <div className="card-footer pt-0 border-0 bg-transparent">
        <div className="cf-content-session-note">
          <div>
            <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
              {copy.reviewApproveTitle}
            </p>
            <p className="text-sm mb-0">{copy.reviewApproveBody}</p>
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
                disabled={renderSubmitting || loading || !plan?.templateRenderSpec}
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
  canRender,
  canManagePublishAccounts,
  connectedAccountForm,
  connectedAccountLoading,
  connectedAccounts,
  canSubmitPublish,
  copy,
  loading,
  onConnectedAccountChange,
  onCreateConnectedAccount,
  onPublish,
  onRender,
  onSelectConnectedAccount,
  plan,
  publishJob,
  publishSubmitting,
  renderJob,
  renderPosterUrl,
  renderPreviewUrl,
  renderSubmitting,
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
                  <h6 className="mb-0 mt-1">{copy.nicheLabels[plan.templateRenderSpec.niche]}</h6>
                </div>
              </div>
              <div className="col-md-4">
                <div className="cf-content-mini-stat">
                  <span className="text-xs text-uppercase text-secondary">{copy.planMeta.objective}</span>
                  <h6 className="mb-0 mt-1">{copy.objectiveLabels[plan.templateRenderSpec.objective]}</h6>
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
                    <span className="badge bg-light text-dark border">{scene.durationFrames}f</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4 pt-3 border-top">
              <div>
                <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">{copy.renderCardTitle}</p>
                <p className="text-sm mb-0">{renderStatusBody}</p>
                <p className="text-xs text-secondary mb-0 mt-2">
                  {copy.renderEngineActive.replace("{{engine}}", copy.videoEngineLabels[selectedVideoEngine] ?? selectedVideoEngine)}
                </p>
              </div>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                {renderJob?.jobId ? (
                  <span className={`badge ${renderJob.status === "failed" ? "bg-gradient-danger" : renderJob.status === "completed" ? "bg-gradient-success" : "bg-light text-dark border"}`}>
                    {renderStatus}
                  </span>
                ) : null}
                {canRender ? (
                  <button type="button" className="btn btn-primary mb-0" onClick={onRender} disabled={renderSubmitting || loading}>
                    {renderSubmitting ? copy.renderActions.submitting : copy.renderActions.submit}
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
            {renderJob?.jobId ? (
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
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="badge bg-gradient-dark">
                      {copy.renderDurationLabel.replace("{{duration}}", durationLabel)}
                    </span>
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
                    {canSubmitPublish ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary mb-0"
                        disabled={publishSubmitting}
                        onClick={onPublish}
                      >
                        {publishSubmitting ? copy.publishActions.submitting : copy.publishActions.queue}
                      </button>
                    ) : (
                      <span className="badge bg-light text-dark border">{copy.publishActions.locked}</span>
                    )}
                  </div>
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
                <div className="mt-3 cf-content-checkpoint">
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
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function RecentDraftsCard({ copy, scripts, selectedScriptId, setSelectedScriptId, loading }) {
  return (
    <div className="card h-100 cf-surface-card">
      <div className="card-header pb-0">
        <h6 className="mb-1">{copy.recentTitle}</h6>
        <p className="text-sm mb-0">{copy.recentBody}</p>
      </div>
      <div className="card-body p-3">
        {loading ? (
          <p className="text-sm text-secondary mb-0">{copy.loading}</p>
        ) : scripts.length === 0 ? (
          <p className="text-sm text-secondary mb-0">{copy.recentEmpty}</p>
        ) : (
          <div className="cf-content-draft-list d-flex flex-column gap-3">
            {scripts.map((script) => {
              const active = script.id === selectedScriptId;

              return (
                <button
                  key={script.id}
                  type="button"
                  className={`text-start border-0 bg-transparent p-0${active ? " active" : ""}`}
                  onClick={() => setSelectedScriptId(script.id)}
                >
                  <div className={`cf-content-draft-item${active ? " is-active" : ""}`}>
                    <div className="d-flex justify-content-between gap-3 align-items-start">
                      <div>
                        <h6 className="text-sm mb-1">{script.title}</h6>
                        <p className="text-xs text-secondary mb-2">{script.hook}</p>
                      </div>
                      <span className={`badge ${STATUS_BADGE_CLASS[script.status] ?? "bg-gradient-dark"}`}>
                        {copy.statusLabels[script.status] ?? script.status}
                      </span>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <span className="badge bg-light text-dark border">{copy.sourceTypeLabels[script.sourceType] ?? script.sourceType}</span>
                      <span className="badge bg-light text-dark border">{script.languageCode.toUpperCase()}</span>
                    </div>
                  </div>
                </button>
              );
            })}
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
  loading,
  onCloneTemplate,
  onDuplicateTemplate,
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
          <p className="text-sm text-secondary mb-0">{copy.templateLoading}</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-secondary mb-0">{copy.templateEmpty}</p>
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
		                      <button type="button" className={`btn btn-sm mb-0 ${active ? "btn-outline-dark" : "btn-outline-primary"}`} onClick={() => onApplyTemplate(template)}>
		                        {active ? copy.templateActions.applied : copy.templateActions.use}
		                      </button>
	                    </div>
	                  </div>
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

function LaunchPadCard({ copy, form }) {
  return (
    <div className="card h-100 cf-surface-card">
      <div className="card-header pb-0">
        <h6 className="mb-1">{copy.launchPadTitle}</h6>
        <p className="text-sm mb-0">{copy.launchPadBody}</p>
      </div>
      <div className="card-body p-3">
        <ul className="list-group mb-3">
          {copy.workflowItems.map((item, index) => (
            <li
              key={item.title}
              className={`list-group-item border-0 px-0${index < copy.workflowItems.length - 1 ? " mb-3" : ""}`}
            >
              <div className="d-flex justify-content-between gap-3 align-items-start">
                <div>
                  <span className="text-xs text-uppercase font-weight-bolder text-secondary">{item.step}</span>
                  <h6 className="text-sm mb-1 mt-1">{item.title}</h6>
                  <p className="text-xs text-secondary mb-0">{item.body}</p>
                </div>
                <span className="badge bg-light text-dark border">{item.badge}</span>
              </div>
            </li>
          ))}
        </ul>
        <div className="cf-content-checkpoint">
          <p className="text-xs text-uppercase font-weight-bolder text-secondary mb-1">
            {copy.renderReadyTitle}
          </p>
          <h6 className="text-sm mb-1">{copy.nicheLabels[form.niche]} · {copy.objectiveLabels[form.objective]}</h6>
          <p className="text-xs text-secondary mb-0">{copy.renderReadyBody}</p>
          <p className="text-xs text-secondary mb-0 mt-2">
            {copy.renderEngineActive.replace("{{engine}}", copy.videoEngineLabels[form.videoEngine] ?? form.videoEngine)}
          </p>
        </div>
      </div>
    </div>
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
  const [form, setForm] = useState(DEFAULT_FORM);
  const [scripts, setScripts] = useState([]);
  const [selectedScriptId, setSelectedScriptId] = useState(null);
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
  const [superadminTemplates, setSuperadminTemplates] = useState([]);
  const [superadminLoading, setSuperadminLoading] = useState(true);
  const [superadminSaving, setSuperadminSaving] = useState(false);
  const [templateEditorForm, setTemplateEditorForm] = useState(() => createTemplateEditorForm(null));
  const [workspaceTemplates, setWorkspaceTemplates] = useState([]);
  const [workspaceTemplateLoading, setWorkspaceTemplateLoading] = useState(true);
  const [workspaceTemplateSaving, setWorkspaceTemplateSaving] = useState(false);
  const [workspaceTemplateEditorForm, setWorkspaceTemplateEditorForm] = useState(() => createTemplateEditorForm(null));
  const [renderJob, setRenderJob] = useState(null);
  const [renderSubmitting, setRenderSubmitting] = useState(false);
  const [publishJob, setPublishJob] = useState(null);
  const [publishSubmitting, setPublishSubmitting] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [connectedAccountLoading, setConnectedAccountLoading] = useState(false);
  const [selectedConnectedAccountId, setSelectedConnectedAccountId] = useState("");
  const [connectedAccountForm, setConnectedAccountForm] = useState(DEFAULT_CONNECTED_ACCOUNT_FORM);
  const [connectedAccountSubmitting, setConnectedAccountSubmitting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const sessionStartedRef = useRef(false);
  const initialRestoreRef = useRef(true);

  useEffect(() => {
    try {
      const savedRaw = window.localStorage.getItem(STUDIO_STORAGE_KEY);
      const saved = savedRaw ? JSON.parse(savedRaw) : null;

      if (saved?.form && typeof saved.form === "object") {
        setForm((current) => ({
          ...current,
          ...saved.form
        }));
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
          saved?.templatePlan?.scenePlan?.scenes?.length
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
      connectedAccountForm,
      form,
      publishJob,
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
  }, [activeStudioStep, connectedAccountForm, form, publishJob, renderJob, reviewTab, selectedConnectedAccountId, selectedScriptId, selectedTemplateId, storageReady, studioSessionId, templatePlan, templateScope, workflowMode]);

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
    setFeedback(null);
    void trackStudioEvent(
      "content.studio.mode_selected",
      createTrackedProperties(form, nextMode)
    );
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
    setFeedback(null);
    void trackStudioEvent("content.template.scope_selected", {
      scope: nextScope,
      workflow_mode: workflowMode
    });
  }

  function handleApplyTemplate(template) {
    setSelectedTemplateId(template.id);
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
      setWorkspaceTemplateEditorForm(createTemplateEditorForm(result?.item ?? null));
      setRenderJob(null);
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
      const response = await fetch("/api/media/render-jobs", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          aspectRatio: templatePlan?.templateRenderSpec?.aspectRatio,
          durationSeconds: templatePlan?.templateRenderSpec?.durationSeconds,
          preferredProvider: videoEngineConfig.preferredProvider,
          renderMode: videoEngineConfig.renderMode,
          scriptId: !isSample ? selectedScript.id : undefined,
          templateRenderSpec: templatePlan.templateRenderSpec
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, payload, copy.renderSubmitError));
      }

      setRenderJob(payload);
      setActiveStudioStep("render");
      setFeedback({
        type: "success",
        message: copy.renderSubmitSuccess
      });
      await trackStudioEvent(
        "content.video_render.submitted",
        createTrackedProperties(form, workflowMode, {
          render_job_id: payload?.jobId ?? null,
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
    setActiveStudioStep("brief");
    setReviewTab("script");
    setForm(DEFAULT_FORM);
    setSelectedScriptId(null);
    setTemplatePlan(null);
    setPublishJob(null);
    setRenderJob(null);
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
          promptHint: form.promptHint.trim()
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, payload, copy.generateError));
      }

      await refreshScripts(payload?.scriptId ?? payload?.script?.id ?? null);
      setReviewTab("script");
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
      const activeScript = !isSample ? selectedScript : createSampleScript(copy);
      const response = await fetch("/api/content/template-plans", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          brandTone: form.brandTone,
          niche: form.niche,
          objective: form.objective,
          product: {
            ctaText: form.ctaText.trim(),
            description: form.promptHint.trim(),
            imageUrl: form.productImageUrl.trim(),
            offerText: form.offerText.trim(),
            presenterImageUrl: form.presenterImageUrl.trim(),
            priceText: form.priceText.trim(),
            subtitle: form.promptHint.trim(),
            title: form.title.trim()
          },
          script: {
            body: activeScript.body,
            cta: activeScript.cta,
            hook: activeScript.hook,
            subtitleLines: [activeScript.hook, activeScript.body, activeScript.cta]
          }
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, payload, copy.planError));
      }

      setTemplatePlan(payload);
      setRenderJob(null);
      setReviewTab("videoPlan");
      setActiveStudioStep("review");
      setFeedback({
        type: "success",
        message: copy.planSuccess
      });
      await trackStudioEvent(
        "content.video_plan.previewed",
        createTrackedProperties(form, workflowMode, {
          scene_count: payload?.scenePlan?.scenes?.length ?? 0
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
          <div className="row g-4 mt-1">
            <div className="col-xl-8">
              <ModeSelectorCard
                copy={copy}
                lastSavedAt={lastSavedAt}
                locale={locale}
                restoredDraft={restoredDraft}
                workflowMode={workflowMode}
                onSelectMode={handleModeSelect}
              />
            </div>
            <div className="col-xl-4">
              <PlaybookCard copy={copy} />
            </div>
          </div>
        ) : null}

        {activeStudioStep === "brief" ? (
          <div className="row g-4 mt-1">
            <div className="col-xl-7">
              <GeneratorCard
                authLocked={!sessionResolved || !isAuthenticated}
                authMessage={sessionResolved ? authRequiredMessage : copy.authCheckingMessage}
                copy={copy}
                form={form}
                modeCopy={modeCopy}
                onChange={handleChange}
                onPreviewPlan={handlePreviewPlan}
                onReset={handleReset}
                onSubmit={handleSubmit}
                planning={planning}
                submitting={submitting}
                workflowMode={workflowMode}
              />
            </div>
            <div className="col-xl-5">
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
        ) : null}

        {activeStudioStep === "review" ? (
          <>
            <div className="row g-4 mt-1">
              <div className="col-xl-8">
                <ReviewApproveCard
                  canRender={canRenderVideos}
                  copy={copy}
                  form={form}
                  isSample={isSample}
                  loading={planning}
                  onEditBrief={() => moveToStep("brief")}
                  onRender={handleRenderPlan}
                  plan={templatePlan}
                  renderJob={renderJob}
                  renderSubmitting={renderSubmitting}
                  reviewTab={reviewTab}
                  script={selectedScript}
                  workflowMode={workflowMode}
                  setReviewTab={setReviewTab}
                />
              </div>
              <div className="col-xl-4">
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
            <div className="row g-4 mt-1">
              <div className="col-12">
                <RecentDraftsCard
                  copy={copy}
                  scripts={scripts}
                  selectedScriptId={selectedScriptId}
                  setSelectedScriptId={setSelectedScriptId}
                  loading={loading}
                />
              </div>
            </div>
          </>
        ) : null}

        {activeStudioStep === "templates" ? (
          <>
            <div className="row g-4 mt-1">
              <div className="col-xl-7">
                <TemplateLibraryCard
                  canClone={canCloneTemplates}
                  canDuplicate={canManageWorkspaceTemplates}
                  copy={copy}
                  loading={templateLoading}
                  onCloneTemplate={handleCloneTemplate}
                  onDuplicateTemplate={handleDuplicateWorkspaceTemplate}
                  scope={templateScope}
                  selectedTemplateId={selectedTemplateId}
                  templates={templates}
                  onApplyTemplate={handleApplyTemplate}
                  onChangeScope={handleTemplateScopeChange}
                />
              </div>
              <div className="col-xl-5">
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
                    onChange={handleWorkspaceTemplateEditorChange}
                    onCreateNew={handleCreateNewWorkspaceTemplate}
                    onDuplicate={() => handleDuplicateWorkspaceTemplate(workspaceTemplateEditorForm)}
                    onLoadTemplate={handleLoadWorkspaceTemplate}
                    onPublish={() => handleChangeWorkspaceTemplateStatus("publish")}
                    onArchive={() => handleChangeWorkspaceTemplateStatus("archive")}
                    duplicateEnabled
                    onSave={handleSaveWorkspaceTemplate}
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
                    onChange={handleTemplateEditorChange}
                    onCreateNew={handleCreateNewTemplate}
                    onDuplicate={undefined}
                    onLoadTemplate={handleLoadSuperadminTemplate}
                    onPublish={() => handleChangeOfficialTemplateStatus("publish")}
                    onArchive={() => handleChangeOfficialTemplateStatus("archive")}
                    onSave={handleSaveSuperadminTemplate}
                  />
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {activeStudioStep === "render" ? (
          <>
            <div className="row g-4 mt-1">
              <div className="col-xl-8">
                <PlanPreviewCard
                  canManagePublishAccounts={canManagePublishAccounts}
                  canSubmitPublish={canSubmitPublishJobs}
                  canRender={canRenderVideos}
                  connectedAccountForm={connectedAccountForm}
                  connectedAccountLoading={connectedAccountLoading}
                  connectedAccounts={connectedAccounts}
                  copy={copy}
                  loading={planning}
                  onConnectedAccountChange={handleConnectedAccountChange}
                  onCreateConnectedAccount={handleCreateConnectedAccount}
                  onPublish={handleQueuePublish}
                  onRender={handleRenderPlan}
                  onSelectConnectedAccount={setSelectedConnectedAccountId}
                  plan={templatePlan}
                  publishJob={publishJob}
                  publishSubmitting={publishSubmitting}
                  renderJob={renderJob}
                  renderPosterUrl={renderPosterUrl}
                  renderPreviewUrl={renderPreviewUrl}
                  renderSubmitting={renderSubmitting}
                  selectedVideoEngine={form.videoEngine}
                  selectedConnectedAccountId={selectedConnectedAccountId}
                  submitConnectedAccount={connectedAccountSubmitting}
                />
              </div>
              <div className="col-xl-4">
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
            <div className="row g-4 mt-1">
              <div className="col-xl-7">
                <RecentDraftsCard
                  copy={copy}
                  scripts={scripts}
                  selectedScriptId={selectedScriptId}
                  setSelectedScriptId={setSelectedScriptId}
                  loading={loading}
                />
              </div>
              <div className="col-xl-5">
                <LaunchPadCard copy={copy} form={form} />
              </div>
            </div>
          </>
        ) : null}

        <ArgonFooter />
      </div>
    </ArgonPage>
  );
}
