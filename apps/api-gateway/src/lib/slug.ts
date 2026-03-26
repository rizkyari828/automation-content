export function createWorkspaceSlug(workspaceName: string): string {
  const normalized = workspaceName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const base = normalized || "workspace";
  const suffix = Math.random().toString(36).slice(2, 8);

  return `${base}-${suffix}`;
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
