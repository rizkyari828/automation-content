"use client";

import { SiteFooter } from "../marketing/site-shell.jsx";
import SiteShell from "../marketing/site-shell.jsx";

export function AuthFooter() {
  return <SiteFooter />;
}

export default function AuthShell({ children, footer = <SiteFooter /> }) {
  return <SiteShell footer={footer}>{children}</SiteShell>;
}
