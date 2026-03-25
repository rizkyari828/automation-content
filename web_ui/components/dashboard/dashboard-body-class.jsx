"use client";

import { useEffect } from "react";

export default function DashboardBodyClass({ className }) {
  useEffect(() => {
    const previousClassName = document.body.className;

    document.body.className = className;

    return () => {
      document.body.className = previousClassName;
    };
  }, [className]);

  return null;
}
