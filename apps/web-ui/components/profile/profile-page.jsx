"use client";

import { useEffect, useState, useTransition } from "react";

import ArgonPage, { ArgonFooter } from "../layout/argon-page.jsx";
import { formatWebMessage, useWebMessages } from "../i18n/web-locale.jsx";

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function providerLabel(copy, providerCode) {
  return copy.providerNames?.[providerCode] ?? providerCode;
}

const DEFAULT_WORKSPACE_ROLE_OPTIONS = [
  { label: "Owner", value: "owner" },
  { label: "Admin", value: "admin" },
  { label: "Editor", value: "editor" },
  { label: "Viewer", value: "viewer" }
];

const FEATURE_LABELS = {
  assets: "Asset library",
  billing: "Billing",
  content: "Content generation",
  media: "Media rendering",
  publishing: "Publishing",
  sso: "Single sign-on",
  team: "Team management",
  trend: "Trend intelligence",
  workspace_settings: "Workspace settings"
};

function hasPermission(profile, permission) {
  return Boolean(profile?.authorization?.permissions?.includes(permission));
}

function hasEnabledFeature(profile, featureCode) {
  return Boolean(profile?.authorization?.enabledFeatureCodes?.includes(featureCode));
}

function featureLabel(copy, featureCode) {
  return copy.featureLabels?.[featureCode] ?? FEATURE_LABELS[featureCode] ?? featureCode;
}

function buildFallbackFeatureDetails(profile) {
  return (profile?.authorization?.features ?? []).map((feature) => ({
    code: feature.code,
    configuredByEmail: null,
    configuredByUserId: null,
    enabled: Boolean(feature.enabled),
    updatedAt: null
  }));
}

export default function ProfilePage() {
  const copy = useWebMessages().web.profilePage;
  const workspaceRoleOptions = copy.workspaceRoleOptions ?? DEFAULT_WORKSPACE_ROLE_OPTIONS;
  const [isPending, startTransition] = useTransition();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    aboutText: "",
    fullName: "",
    verificationCode: "",
    workspaceName: ""
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [accessLoading, setAccessLoading] = useState(false);
  const [featureDetails, setFeatureDetails] = useState([]);
  const [featureUpdatingCode, setFeatureUpdatingCode] = useState("");
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [memberUpdatingId, setMemberUpdatingId] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile(options = {}) {
    const silent = Boolean(options.silent);

    if (!silent) {
      setLoading(true);
    }
    setError("");

    try {
      const response = await fetch("/api/profile", {
        credentials: "same-origin"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? copy.loadError);
        return;
      }

      setProfile(payload);
      setForm((current) => ({
        ...current,
        aboutText: payload?.user?.aboutText ?? "",
        fullName: payload?.user?.fullName ?? "",
        workspaceName: payload?.workspace?.name ?? ""
      }));
      await loadWorkspaceAccess(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.loadError);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  async function loadWorkspaceAccess(nextProfile) {
    const canManageMembers =
      hasPermission(nextProfile, "members.manage") && hasEnabledFeature(nextProfile, "team");
    const canViewWorkspace = hasPermission(nextProfile, "workspace.view");

    if (!canManageMembers && !canViewWorkspace) {
      setWorkspaceMembers([]);
      setFeatureDetails(buildFallbackFeatureDetails(nextProfile));
      setAccessError("");
      return;
    }

    setAccessLoading(true);
    setAccessError("");

    try {
      const requests = [];

      if (canManageMembers) {
        requests.push(
          fetch("/api/workspace/members", {
            credentials: "same-origin"
          }).then(async (response) => ({
            payload: await response.json().catch(() => null),
            response,
            type: "members"
          }))
        );
      }

      if (canViewWorkspace) {
        requests.push(
          fetch("/api/workspace/features", {
            credentials: "same-origin"
          }).then(async (response) => ({
            payload: await response.json().catch(() => null),
            response,
            type: "features"
          }))
        );
      }

      const results = await Promise.all(requests);
      let nextMembers = [];
      let nextFeatures = buildFallbackFeatureDetails(nextProfile);

      for (const result of results) {
        if (result.type === "members") {
          if (!result.response.ok) {
            throw new Error(result.payload?.message ?? "Unable to load workspace members");
          }

          nextMembers = result.payload?.items ?? [];
        }

        if (result.type === "features") {
          if (!result.response.ok) {
            throw new Error(result.payload?.message ?? "Unable to load workspace features");
          }

          nextFeatures = result.payload?.items ?? nextFeatures;
        }
      }

      setWorkspaceMembers(nextMembers);
      setFeatureDetails(nextFeatures);
    } catch (loadError) {
      setWorkspaceMembers([]);
      setFeatureDetails(buildFallbackFeatureDetails(nextProfile));
      setAccessError(loadError instanceof Error ? loadError.message : "Unable to load workspace access");
    } finally {
      setAccessLoading(false);
    }
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function saveProfile(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    startTransition(async () => {
      const response = await fetch("/api/profile", {
        body: JSON.stringify({
          aboutText: form.aboutText,
          fullName: form.fullName,
          workspaceName: form.workspaceName
        }),
        credentials: "same-origin",
        headers: {
          "content-type": "application/json"
        },
        method: "PATCH"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? copy.saveError);
        return;
      }

      setProfile(payload);
      setForm((current) => ({
        ...current,
        workspaceName: payload?.workspace?.name ?? current.workspaceName
      }));
      setNotice(copy.savedSuccess);
      await loadWorkspaceAccess(payload);
    });
  }

  function requestVerificationCode() {
    setError("");
    setNotice("");

    startTransition(async () => {
      const response = await fetch("/api/auth/verify-email/request", {
        method: "POST"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? copy.sendCodeError);
        return;
      }

      setNotice(payload?.message ?? copy.codeSentSuccess);
      await loadProfile();
    });
  }

  function verifyEmailCode(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    startTransition(async () => {
      const response = await fetch("/api/auth/verify-email/confirm", {
        body: JSON.stringify({
          code: form.verificationCode
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message ?? copy.verifyError);
        return;
      }

      setForm((current) => ({
        ...current,
        verificationCode: ""
      }));
      setNotice(payload?.message ?? copy.verifySuccess);
      await loadProfile();
    });
  }

  function updateWorkspaceMemberRole(membershipId, roleCode) {
    setAccessError("");
    setNotice("");
    setMemberUpdatingId(membershipId);

    fetch(`/api/workspace/members/${membershipId}`, {
      body: JSON.stringify({
        roleCode
      }),
      credentials: "same-origin",
      headers: {
        "content-type": "application/json"
      },
      method: "PATCH"
    })
      .then(async (response) => ({
        payload: await response.json().catch(() => null),
        response
      }))
      .then(async ({ payload, response }) => {
        if (!response.ok) {
          setAccessError(payload?.message ?? copy.workspaceMembersUpdateError);
          return;
        }

        setNotice(payload?.message ?? copy.workspaceMembersUpdateSuccess);
        await loadProfile({ silent: true });
      })
      .catch((requestError) => {
        setAccessError(requestError instanceof Error ? requestError.message : copy.workspaceMembersUpdateError);
      })
      .finally(() => {
        setMemberUpdatingId("");
      });
  }

  function updateWorkspaceFeature(featureCode, enabled) {
    setAccessError("");
    setNotice("");
    setFeatureUpdatingCode(featureCode);

    fetch(`/api/workspace/features/${featureCode}`, {
      body: JSON.stringify({
        enabled
      }),
      credentials: "same-origin",
      headers: {
        "content-type": "application/json"
      },
      method: "PATCH"
    })
      .then(async (response) => ({
        payload: await response.json().catch(() => null),
        response
      }))
      .then(async ({ payload, response }) => {
        if (!response.ok) {
          setAccessError(payload?.message ?? copy.workspaceFeaturesUpdateError);
          return;
        }

        setNotice(payload?.message ?? copy.workspaceFeaturesUpdateSuccess);
        await loadProfile({ silent: true });
      })
      .catch((requestError) => {
        setAccessError(requestError instanceof Error ? requestError.message : copy.workspaceFeaturesUpdateError);
      })
      .finally(() => {
        setFeatureUpdatingCode("");
      });
  }

  const verificationBadgeClass = profile?.security?.emailVerified
    ? "badge badge-sm bg-gradient-success"
    : "badge badge-sm bg-gradient-warning";
  const canManageMembers = hasPermission(profile, "members.manage") && hasEnabledFeature(profile, "team");
  const canManageFeatures = hasPermission(profile, "features.manage");
  const canManageWorkspace = hasPermission(profile, "workspace.manage");
  const platformRoleLabel = profile?.authorization?.platformRoleCode ?? "workspace member";

  return (
    <ArgonPage
      pageTitle={copy.pageTitle}
      activeRoute="profile"
    >
      <div className="container-fluid py-4 cf-internal-page cf-profile-page">
        <div className="card shadow-lg border-0 mb-4 cf-premium-card">
          <div className="card-body p-4">
            <div className="row align-items-center gy-3">
              <div className="col-12 col-lg">
                <p className="text-sm text-uppercase text-muted mb-1">{copy.heroEyebrow}</p>
                <h4 className="mb-1">{profile?.user?.fullName || copy.fallbackName}</h4>
                <p className="text-sm text-muted mb-2">{profile?.user?.email ?? copy.loadingBody}</p>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <span className={verificationBadgeClass}>
                    {profile?.security?.emailVerified ? copy.verified : copy.unverified}
                  </span>
                  <span className="badge badge-sm bg-gradient-info">
                    {profile?.workspace?.name ?? copy.workspaceTitle}
                  </span>
                  <span className="badge badge-sm bg-gradient-secondary">
                    {profile?.workspace?.roleCode ?? copy.memberRole}
                  </span>
                </div>
              </div>
              <div className="col-12 col-lg-auto">
                <div className="text-lg-end">
                  <p className="mb-1 text-sm text-muted">{copy.lastLoginLabel}</p>
                  <p className="mb-0 fw-semibold">{formatDateTime(profile?.security?.lastLoginAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="card cf-surface-card">
            <div className="card-body">
              <h6 className="mb-1">{copy.loadingTitle}</h6>
              <p className="mb-0 text-sm">{copy.loadingBody}</p>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            <div className="col-12 col-xl-8">
              <div className="card mb-4 cf-surface-card">
                <div className="card-header pb-0">
                  <h6>{copy.editTitle}</h6>
                  <p className="text-sm mb-0">{copy.editBody}</p>
                </div>
                <div className="card-body">
                  <form onSubmit={saveProfile}>
                    <div className="row">
                      <div className="col-12 col-md-6">
                        <label className="form-control-label">{copy.fullNameLabel}</label>
                        <input
                          className="form-control"
                          type="text"
                          value={form.fullName}
                          onChange={(event) => updateField("fullName", event.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6 mt-3 mt-md-0">
                        <label className="form-control-label">{copy.emailLabel}</label>
                        <input className="form-control" type="email" value={profile?.user?.email ?? ""} disabled />
                      </div>
                      <div className="col-12 mt-3">
                        <label className="form-control-label">{copy.workspaceNameLabel}</label>
                        <input
                          className="form-control"
                          disabled={!canManageWorkspace}
                          type="text"
                          value={form.workspaceName}
                          onChange={(event) => updateField("workspaceName", event.target.value)}
                        />
                        {!canManageWorkspace ? (
                          <p className="text-xs text-muted mt-2 mb-0">
                            {copy.workspaceNameManageHint}
                          </p>
                        ) : null}
                      </div>
                      <div className="col-12 mt-3">
                        <label className="form-control-label">{copy.aboutLabel}</label>
                        <textarea
                          className="form-control"
                          rows="5"
                          value={form.aboutText}
                          onChange={(event) => updateField("aboutText", event.target.value)}
                        />
                      </div>
                    </div>
                    {notice ? <p className="text-sm text-success mt-3 mb-0">{notice}</p> : null}
                    {error ? <p className="text-sm text-danger mt-3 mb-0">{error}</p> : null}
                    <div className="d-flex justify-content-end mt-4">
                      <button type="submit" className="btn btn-primary mb-0" disabled={isPending}>
                        {isPending ? copy.saving : copy.save}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="card cf-surface-card">
                <div className="card-header pb-0">
                  <h6>{copy.verificationTitle}</h6>
                  <p className="text-sm mb-0">
                    {profile?.security?.emailVerified ? copy.verificationDoneBody : copy.verificationBody}
                  </p>
                </div>
                <div className="card-body">
                  {profile?.security?.emailVerified ? (
                    <div className="alert alert-success text-white mb-0" role="alert">
                      {formatWebMessage(copy.verifiedAtTemplate, {
                        date: formatDateTime(profile?.security?.emailVerifiedAt)
                      })}
                    </div>
                  ) : (
                    <form onSubmit={verifyEmailCode}>
                      <div className="row align-items-end">
                        <div className="col-12 col-lg-7">
                          <label className="form-control-label">{copy.verificationCodeLabel}</label>
                          <input
                            className="form-control"
                            type="text"
                            inputMode="numeric"
                            value={form.verificationCode}
                            onChange={(event) => updateField("verificationCode", event.target.value)}
                          />
                        </div>
                        <div className="col-12 col-lg-5 mt-3 mt-lg-0">
                          <div className="d-grid gap-2">
                            <button type="submit" className="btn btn-primary mb-0" disabled={isPending}>
                              {isPending ? copy.verifying : copy.verifyCode}
                            </button>
                            <button type="button" className="btn btn-outline-primary mb-0" disabled={isPending} onClick={requestVerificationCode}>
                              {isPending ? copy.sendingCode : copy.sendCode}
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {canManageMembers ? (
                <div className="card mt-4 cf-surface-card">
                  <div className="card-header pb-0">
                    <h6>{copy.workspaceMembersTitle}</h6>
                    <p className="text-sm mb-0">
                      {copy.workspaceMembersBody}
                    </p>
                  </div>
                  <div className="card-body">
                    {accessError ? <p className="text-sm text-danger mb-3">{accessError}</p> : null}
                    {accessLoading && !workspaceMembers.length ? (
                      <p className="text-sm text-muted mb-0">{copy.workspaceMembersLoading}</p>
                    ) : workspaceMembers.length ? (
                      <div className="list-group list-group-flush">
                        {workspaceMembers.map((member) => {
                          const roleLocked = member.roleCode === "owner";

                          return (
                            <div key={member.id} className="list-group-item border-0 px-0">
                              <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
                                <div>
                                  <h6 className="mb-1 text-sm">
                                    {member.fullName || member.email}
                                  </h6>
                                  <p className="mb-1 text-xs text-secondary">{member.email}</p>
                                  <div className="d-flex flex-wrap gap-2">
                                    <span className="badge badge-sm bg-gradient-light text-dark">
                                      {member.status}
                                    </span>
                                    <span className="badge badge-sm bg-gradient-secondary">
                                      {formatWebMessage(copy.joinedAtTemplate, {
                                        date: formatDateTime(member.joinedAt)
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <div className="d-flex flex-column align-items-stretch align-items-lg-end gap-2">
                                  <select
                                    className="form-select"
                                    value={member.roleCode}
                                    disabled={roleLocked || memberUpdatingId === member.id}
                                    onChange={(event) => updateWorkspaceMemberRole(member.id, event.target.value)}
                                  >
                                    {workspaceRoleOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                  {roleLocked ? (
                                    <span className="text-xs text-muted">{copy.workspaceOwnerLockHint}</span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted mb-0">{copy.workspaceMembersEmpty}</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="col-12 col-xl-4">
              <div className="card mb-4 cf-surface-card">
                <div className="card-header pb-0">
                  <h6>{copy.securityTitle}</h6>
                </div>
                <div className="card-body">
                  <p className="text-sm mb-2">
                    <strong>{copy.statusLabel}:</strong> {profile?.user?.status ?? "active"}
                  </p>
                  <p className="text-sm mb-2">
                    <strong>{copy.workspaceRoleLabel}:</strong> {profile?.workspace?.roleCode ?? copy.memberRole}
                  </p>
                  <p className="text-sm mb-2">
                    <strong>{copy.platformRoleLabel}:</strong> {platformRoleLabel}
                  </p>
                  <p className="text-sm mb-0">
                    <strong>{copy.lastLoginLabel}:</strong> {formatDateTime(profile?.security?.lastLoginAt)}
                  </p>
                </div>
              </div>
              <div className="card mb-4 cf-surface-card">
                <div className="card-header pb-0">
                  <h6>{copy.authorizationTitle}</h6>
                </div>
                <div className="card-body">
                  <p className="text-sm mb-2">
                    <strong>{copy.permissionsLabel}:</strong> {profile?.authorization?.permissions?.length ?? 0}
                  </p>
                  <div className="d-flex flex-wrap gap-2">
                    {(profile?.authorization?.permissions ?? []).map((permission) => (
                      <span key={permission} className="badge badge-sm bg-gradient-light text-dark">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card mb-4 cf-surface-card">
                <div className="card-header pb-0">
                  <h6>{copy.workspaceFeaturesTitle}</h6>
                  <p className="text-sm mb-0">
                    {canManageFeatures
                      ? copy.workspaceFeaturesManageBody
                      : copy.workspaceFeaturesReadBody}
                  </p>
                </div>
                <div className="card-body">
                  {accessError && !canManageMembers ? <p className="text-sm text-danger mb-3">{accessError}</p> : null}
                  {accessLoading && !featureDetails.length ? (
                    <p className="text-sm text-muted mb-0">{copy.workspaceFeaturesLoading}</p>
                  ) : featureDetails.length ? (
                    <div className="list-group list-group-flush">
                      {featureDetails.map((feature) => (
                        <div key={feature.code} className="list-group-item border-0 px-0">
                          <div className="d-flex flex-column gap-2">
                            <div className="d-flex flex-column flex-sm-row justify-content-between gap-2">
                              <div>
                                <h6 className="mb-1 text-sm">{featureLabel(copy, feature.code)}</h6>
                                <p className="mb-0 text-xs text-secondary">
                                  {feature.configuredByEmail
                                    ? formatWebMessage(copy.workspaceFeaturesUpdatedByTemplate, {
                                      email: feature.configuredByEmail
                                    })
                                    : copy.workspaceFeaturesDefaultSetting}
                                </p>
                              </div>
                              <div className="form-check form-switch mb-0">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  role="switch"
                                  checked={Boolean(feature.enabled)}
                                  disabled={!canManageFeatures || featureUpdatingCode === feature.code}
                                  onChange={(event) => updateWorkspaceFeature(feature.code, event.target.checked)}
                                />
                              </div>
                            </div>
                            <div className="d-flex flex-wrap gap-2 align-items-center">
                              <span className={`badge badge-sm ${feature.enabled ? "bg-gradient-success" : "bg-gradient-secondary"}`}>
                                {feature.enabled ? copy.enabled : copy.disabled}
                              </span>
                              {feature.updatedAt ? (
                                <span className="text-xs text-secondary">
                                  {formatWebMessage(copy.updatedAtTemplate, {
                                    date: formatDateTime(feature.updatedAt)
                                  })}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted mb-0">{copy.workspaceFeaturesEmpty}</p>
                  )}
                </div>
              </div>
              <div className="card cf-surface-card">
                <div className="card-header pb-0">
                  <h6>{copy.providersTitle}</h6>
                </div>
                <div className="card-body">
                  {profile?.providers?.length ? (
                    <div className="list-group">
                      {profile.providers.map((provider) => (
                        <div
                          key={provider.provider}
                          className="list-group-item border-0 px-0 d-flex justify-content-between align-items-start"
                        >
                          <div>
                            <h6 className="mb-1 text-sm">{providerLabel(copy, provider.provider)}</h6>
                            <p className="mb-1 text-xs text-secondary">
                              {provider.email || provider.username || copy.connectedLabel}
                            </p>
                            <p className="mb-0 text-xs text-secondary">
                              {formatWebMessage(copy.connectedAtTemplate, {
                                date: formatDateTime(provider.connectedAt)
                              })}
                            </p>
                          </div>
                          <span className="badge badge-sm bg-gradient-success">{copy.connectedLabel}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted mb-0">{copy.providersEmpty}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <ArgonFooter />
      </div>
    </ArgonPage>
  );
}
