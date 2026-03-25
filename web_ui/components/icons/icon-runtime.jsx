"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const ICONS = {
  "ni-tv-2":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
  "ni-calendar-grid-58":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>',
  "ni-credit-card":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/></svg>',
  "ni-app":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
  "ni-world-2":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>',
  "ni-single-02":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
  "ni-single-copy-04":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="10" height="11" rx="2"/><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></svg>',
  "ni-collection":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M7 4h10M7 10h10M4 13h16M7 16h10M7 19h10"/></svg>',
  "ni-money-coins":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="6" ry="3"/><path d="M6 6v8c0 1.7 2.7 3 6 3s6-1.3 6-3V6"/><path d="M6 10c0 1.7 2.7 3 6 3s6-1.3 6-3"/></svg>',
  "ni-world":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.6-4-9s1.5-6.6 4-9"/></svg>',
  "ni-paper-diploma":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="14" rx="2"/><path d="M8 7h8M8 11h5M10 17l-1 4 3-2 3 2-1-4"/></svg>',
  "ni-cart":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.6 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L21 8H7"/></svg>',
  "ni-camera-compact":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-2h6l2 2h3v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><circle cx="12" cy="13" r="3"/></svg>',
  "ni-bulb-61":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M8.5 14.5C7 13.3 6 11.4 6 9.2A6 6 0 0 1 18 9.2c0 2.2-1 4.1-2.5 5.3-.7.6-1.5 1.7-1.5 2.5h-4c0-.8-.8-1.9-1.5-2.5Z"/></svg>',
  "ni-trophy":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v3a4 4 0 0 1-8 0Z"/><path d="M8 5H5a2 2 0 0 0 2 4h1M16 5h3a2 2 0 0 1-2 4h-1M12 11v4M9 21h6M8 17h8"/></svg>',
  "ni-mobile-button":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2.5" width="8" height="19" rx="2"/><path d="M11 18.5h2"/></svg>',
  "ni-tag":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13 11 22l-9-9V4h9z"/><circle cx="7.5" cy="8.5" r="1.2"/></svg>',
  "ni-box-2":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 6v12l8 4 8-4V6Z"/><path d="M4 6l8 4 8-4M12 10v12"/></svg>',
  "ni-satisfied":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M8.5 14c1 1.5 2.4 2 3.5 2s2.5-.5 3.5-2"/></svg>',
  "ni-bold-right":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  "ni-email-83":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
  "ni-settings-gear-65":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.7Z"/></svg>',
  "ni-bell-55":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>',
  "ni-html5":
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3h14l-1.2 14.5L12 21l-5.8-3.5L5 3Zm2.8 3 .5 6.7H15l-.2 2.7-2.8.8-2.7-.8-.1-1.4H6.8l.3 3.1 4.9 1.5 4.9-1.5.7-8.9H8.4L8.2 6h7.1l.1-1.5H7.8Z"/></svg>',
  "ni-key-25":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M12 15h9M18 12v6M21 13v4"/></svg>',
  "fa-chart-pie":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12A9 9 0 1 1 12 3"/><path d="M12 3v9h9"/></svg>',
  "fa-user":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
  "fa-key":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="3.5"/><path d="M11 15.5H21M18 12.5v6M15 13.5v4"/></svg>',
  "fa-user-circle":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="9" r="3"/><path d="M6.5 18a6.5 6.5 0 0 1 11 0"/></svg>',
  "fa-apple":
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.2 3.3c.7-.8 1.2-1.9 1.1-3-1 .1-2.1.7-2.8 1.5-.6.7-1.1 1.8-.9 2.9 1.1.1 2-.5 2.6-1.4ZM19.7 16.9c-.5 1.2-.8 1.7-1.5 2.7-1 1.4-2.3 3.1-4 3.1-1.5 0-1.9-1-3.9-1-2 0-2.5 1-4 1-1.6 0-2.8-1.5-3.8-2.9C-.4 15.4 0 10.1 2.6 7.3 3.9 5.9 5.6 5.1 7.1 5.1c1.6 0 2.6 1 4 1 1.4 0 2.3-1 4-1 1.4 0 2.9.8 4.2 2.2-3.6 2-3 7 .4 9.6Z"/></svg>',
  "fa-facebook-f":
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.7-1.6h1.5V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H8v3h2.5v8h3Z"/></svg>',
  "fa-google":
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.8 12.2c0-.6-.1-1.1-.2-1.7H12v3.2h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.2c1.9-1.7 3.1-4.2 3.1-7.1Z"/><path d="M12 22c2.7 0 5-.9 6.7-2.5l-3.2-2.5c-.9.6-2 .9-3.5.9-2.7 0-4.9-1.8-5.7-4.2H3v2.6A10 10 0 0 0 12 22Z"/><path d="M6.3 13.7A6 6 0 0 1 6 12c0-.6.1-1.2.3-1.7V7.7H3A10 10 0 0 0 2 12c0 1.5.4 2.9 1 4.3l3.3-2.6Z"/><path d="M12 6.1c1.5 0 2.8.5 3.8 1.4l2.8-2.8A10 10 0 0 0 3 7.7l3.3 2.6C7.1 7.9 9.3 6.1 12 6.1Z"/></svg>',
  "fa-paypal":
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.7 20H5.4c-.3 0-.5-.3-.4-.6L7.7 4.6c.1-.3.3-.5.6-.5h6.1c2.3 0 4 .4 5 1.4 1 .9 1.3 2.1.9 3.8-.6 2.7-2.6 4.2-5.5 4.5l-1.8.2c-.3 0-.5.2-.6.5L11 19.4c-.1.4-.4.6-.7.6h-.1c1.1-7.3.9-6.3.9-6.3h2.3c3.8 0 6.5-1.6 7.2-5.6.1-.5.1-.9.1-1.3.7.9.9 2.1.6 3.5-.8 3.9-3.4 5.9-7.4 5.9h-1.8L11 20H8.7Z"/></svg>',
  "fa-arrow-down":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></svg>',
  "fa-arrow-up":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m6 11 6-6 6 6"/></svg>',
  "fa-exclamation":
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 3h-2l.5 11h1L13 3Zm-1 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/></svg>',
  "fa-file-pdf":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M8 16h2a1.5 1.5 0 0 0 0-3H8v5M13 18v-5h2M15 15h-2M18 18v-5l2 5 2-5"/></svg>',
  "fa-landmark":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10h18"/><path d="M4 20h16"/><path d="M6 10v7M10 10v7M14 10v7M18 10v7"/><path d="m12 3 9 4H3l9-4Z"/></svg>',
  "fa-pencil-alt":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 3.8-1 10-10a2.1 2.1 0 1 0-3-3l-10 10L3 21Z"/></svg>',
  "fa-plus":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  "fa-wifi":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9a11 11 0 0 1 14 0"/><path d="M8 12a7 7 0 0 1 8 0"/><path d="M11 15a3 3 0 0 1 2 0"/><circle cx="12" cy="19" r="1"/></svg>',
  "fa-close":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  "fa-cog":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.7Z"/></svg>',
  "fa-facebook-square":
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-5.2v-6.9H17l.4-2.7h-2.6V9.7c0-.8.3-1.4 1.5-1.4h1.2V5.9c-.2 0-1-.1-2-.1-2 0-3.3 1.2-3.3 3.5v2h-2.3V14h2.3V21H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/></svg>',
  "fa-twitter":
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.9c-.7.3-1.5.5-2.3.6.8-.5 1.4-1.2 1.7-2.1-.8.5-1.7.8-2.6 1-1.6-1.7-4.4-1.4-5.7.7-.6 1-.7 2.1-.3 3.1-3.2-.2-6.1-1.7-8.1-4.1-1 1.8-.5 4 1.1 5.2-.6 0-1.3-.2-1.8-.5 0 1.9 1.4 3.6 3.3 4-.6.2-1.2.2-1.8.1.5 1.6 2 2.7 3.8 2.8A8.6 8.6 0 0 1 3 18.5a12.1 12.1 0 0 0 6.6 1.9c8 0 12.5-6.8 12.2-12.9.9-.6 1.6-1.2 2.2-2Z"/></svg>',
  "fa-bell":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>',
  "fa-clock":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  "fa-heart":
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 20.4-1.3-1.2C5.2 14.2 2 11.3 2 7.8 2 5 4.2 3 7 3c1.6 0 3.1.8 4 2 1-1.2 2.4-2 4-2 2.8 0 5 2 5 4.8 0 3.5-3.2 6.4-8.7 11.4L12 20.4Z"/></svg>',
  "fa-search":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/></svg>',
  "fa-times":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  "fa-check":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>',
  "fa-ellipsis-v":
    '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
  "fa-arrow-left":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></svg>',
  "fa-backward":
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 12 19 6v12l-8-6ZM5 6h2v12H5z"/></svg>',
  "fa-chevron-down":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  "fa-ellipsis-h":
    '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  "fa-forward":
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m13 12-8 6V6l8 6Zm6-6h-2v12h2z"/></svg>',
  "fa-home":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
  "fa-play":
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m8 5 11 7-11 7V5Z"/></svg>'
};

function getSupportedIconClass(classList) {
  return Array.from(classList).find((className) => className.startsWith("ni-") || className.startsWith("fa-"));
}

function applyIcons(root = document) {
  const elements = [];

  if (root instanceof Element && root.matches("i")) {
    elements.push(root);
  }

  elements.push(...root.querySelectorAll("i"));

  for (const element of elements) {
    const iconClass = getSupportedIconClass(element.classList);

    if (!iconClass || !ICONS[iconClass]) {
      continue;
    }

    if (element.dataset.iconReady === iconClass) {
      continue;
    }

    element.innerHTML = ICONS[iconClass];
    element.dataset.iconReady = iconClass;
    element.classList.add("svg-icon-ready");
  }
}

export default function IconRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    applyIcons();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) {
            continue;
          }

          applyIcons(node);
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
