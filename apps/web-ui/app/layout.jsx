import Script from "next/script";

import IconRuntime from "../components/icons/icon-runtime.jsx";
import { WebLocaleProvider } from "../components/i18n/web-locale.jsx";

export const metadata = {
  title: {
    default: "CreatorFlow",
    template: "%s | CreatorFlow"
  },
  description: "CreatorFlow adalah AI content commerce platform untuk seller, affiliate, dan tim kecil yang ingin workflow konten lebih cepat, rapi, dan konsisten."
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  shrinkToFit: "no"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="76x76" href="/assets/img/apple-icon.png" />
        <link rel="icon" type="image/png" href="/assets/img/favicon.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link href="/assets/css/nucleo-icons.css" rel="stylesheet" />
        <link href="/assets/css/nucleo-svg.css" rel="stylesheet" />
        <link id="pagestyle" href="/assets/css/argon-dashboard.css?v=2.1.0" rel="stylesheet" />
        <style>{`
          :root {
            color-scheme: light;
          }

          html {
            scroll-behavior: smooth;
          }

          body {
            background: #f5f7fb;
            color: #172b4d;
            font-family: "Manrope", sans-serif;
          }

          h1,
          h2,
          h3,
          h4,
          h5,
          h6,
          .h1,
          .h2,
          .h3,
          .h4,
          .h5,
          .h6 {
            font-family: "Plus Jakarta Sans", sans-serif;
          }

          a {
            color: inherit;
          }

          ::selection {
            background: rgba(21, 115, 124, 0.18);
          }

          body.creatorflow-public-shell {
            background: #081420;
          }

          .svg-icon-ready {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            vertical-align: middle;
          }

          .svg-icon-ready::before {
            content: none !important;
          }

          .svg-icon-ready > svg {
            width: 1em;
            height: 1em;
            flex-shrink: 0;
          }

          .creatorflow-internal-sidenav {
            backdrop-filter: blur(8px);
            overflow: hidden;
          }

          .creatorflow-internal-topbar {
            margin-top: 1.25rem;
            background:
              radial-gradient(circle at 12% 40%, rgba(15, 133, 144, 0.34), transparent 28%),
              radial-gradient(circle at 88% 22%, rgba(245, 154, 83, 0.24), transparent 20%),
              linear-gradient(135deg, rgba(8, 20, 32, 0.9) 0%, rgba(10, 29, 45, 0.94) 48%, rgba(22, 83, 101, 0.88) 100%);
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 20px 44px rgba(8, 20, 32, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.04);
            backdrop-filter: blur(10px);
            position: relative;
            z-index: 1200;
            overflow: visible !important;
          }

          .creatorflow-topbar-heading {
            min-width: 220px;
          }

          .creatorflow-topbar-page-title {
            font-size: 1.32rem;
            line-height: 1.04;
            letter-spacing: -0.01em;
          }

          .creatorflow-topbar-chips {
            margin-right: 0.75rem;
          }

          .creatorflow-topbar-chip {
            border-radius: 0.72rem;
            font-size: 0.68rem;
            letter-spacing: 0.04em;
          }

          .creatorflow-topbar-profile-btn {
            min-width: 108px;
          }

          .creatorflow-notify-menu {
            border: 1px solid #e4ebf4;
            border-radius: 0.95rem;
            box-shadow: 0 24px 46px rgba(16, 44, 69, 0.16);
            position: absolute !important;
            z-index: 4000 !important;
            overflow: hidden;
          }

          .creatorflow-internal-main .dropdown .creatorflow-notify-menu:before,
          .creatorflow-internal-main .dropdown .creatorflow-notify-menu:after,
          .creatorflow-notify-menu::before,
          .creatorflow-notify-menu::after {
            content: none !important;
            border: 0 !important;
            display: none !important;
            font-size: 0 !important;
            opacity: 0 !important;
            visibility: hidden !important;
          }

          .creatorflow-sidenav-body {
            min-height: 0;
            width: 100%;
          }

          .creatorflow-internal-sidenav .nav-link {
            margin: 0.22rem auto;
            padding: 0.68rem 0.9rem;
            width: calc(100% - 0.36rem);
          }

          .creatorflow-internal-sidenav .navbar-nav {
            width: 100%;
            padding: 0 0.72rem;
            margin-bottom: 0;
          }

          .creatorflow-internal-sidenav .nav-item {
            width: 100%;
          }

          .creatorflow-internal-sidenav .nav-link-text {
            font-weight: 600;
            letter-spacing: -0.01em;
          }

          .creatorflow-internal-sidenav .creatorflow-sidenav-link {
            border-radius: 0.95rem;
            box-sizing: border-box;
            justify-content: flex-start;
          }

          .creatorflow-internal-sidenav .creatorflow-sidenav-link.active {
            background: #f4f7fb !important;
            box-shadow: 0 14px 28px rgba(16, 44, 69, 0.08) !important;
          }

          .creatorflow-sidenav-promo {
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .creatorflow-sidenav-promo h6 {
            font-size: 1.05rem;
            line-height: 1.45;
          }

          .creatorflow-sidenav-promo-body {
            line-height: 1.6;
          }

          .creatorflow-sidenav-promo-cta {
            border-radius: 0.68rem;
          }

          .creatorflow-internal-main {
            padding-top: 0.5rem;
          }

          .creatorflow-internal-main,
          .creatorflow-internal-main .navbar-nav,
          .creatorflow-internal-main .nav-item.dropdown,
          .creatorflow-internal-main .dropdown-menu {
            overflow: visible !important;
          }

          .creatorflow-internal-main .container-fluid {
            max-width: 1380px;
            padding-left: 1.4rem;
            padding-right: 1.4rem;
          }

          .cf-internal-page .row {
            align-items: stretch;
          }

          .cf-content-hero-body {
            max-width: 56ch;
            line-height: 1.75;
          }

          .cf-content-stat {
            background: rgba(255, 255, 255, 0.09);
            border: 1px solid rgba(255, 255, 255, 0.16);
            border-radius: 0.95rem;
            padding: 0.95rem 1rem;
          }

          .cf-content-output-block + .cf-content-output-block {
            margin-top: 1rem;
          }

          .cf-content-draft-item {
            background: #f8fafc;
            border: 1px solid #e4ebf4;
            border-radius: 1rem;
            padding: 1rem 1rem 0.95rem;
            transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
          }

          .cf-content-draft-item.is-active,
          .cf-content-draft-item:hover {
            border-color: rgba(15, 133, 144, 0.36);
            box-shadow: 0 18px 34px rgba(16, 44, 69, 0.08);
            transform: translateY(-1px);
          }

          .cf-content-mini-stat {
            background: #f8fafc;
            border: 1px solid #e4ebf4;
            border-radius: 0.9rem;
            padding: 0.9rem 1rem;
          }

          .cf-content-mode-grid {
            display: grid;
            gap: 0.9rem;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          }

          .cf-content-flow-nav {
            display: grid;
            gap: 0.85rem;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          }

          .cf-content-flow-step {
            align-content: start;
            background: #f8fafc;
            border: 1px solid #e4ebf4;
            border-radius: 1rem;
            color: #67748e;
            display: grid;
            gap: 0.28rem;
            min-width: 0;
            padding: 0.95rem 1rem;
            text-align: left;
            transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
          }

          .cf-content-flow-step strong {
            color: #102c45;
            font-size: 0.92rem;
            line-height: 1.35;
          }

          .cf-content-flow-step span {
            font-size: 0.76rem;
            line-height: 1.45;
          }

          .cf-content-flow-step-index {
            color: #94a3b8;
            font-size: 0.69rem !important;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .cf-content-flow-step.is-active,
          .cf-content-flow-step:hover {
            border-color: rgba(15, 133, 144, 0.28);
            box-shadow: 0 18px 34px rgba(16, 44, 69, 0.08);
            transform: translateY(-1px);
          }

          .cf-content-review-tabs {
            border-bottom: 1px solid #e4ebf4;
            display: flex;
            flex-wrap: wrap;
            gap: 0.45rem;
          }

          .cf-content-review-tab {
            background: transparent;
            border: 0;
            border-bottom: 2px solid transparent;
            color: #67748e;
            font-size: 0.85rem;
            font-weight: 700;
            margin-bottom: -1px;
            padding: 0.7rem 0.2rem 0.85rem;
            transition: color 180ms ease, border-color 180ms ease;
          }

          .cf-content-review-tab.is-active {
            border-bottom-color: #0f8590;
            color: #102c45;
          }

          .cf-content-validation-row {
            align-items: center;
            border-bottom: 1px solid #e4ebf4;
            display: flex;
            gap: 0.75rem;
            font-size: 0.88rem;
            line-height: 1.55;
            padding: 0.75rem 0;
          }

          .cf-content-validation-row:last-child {
            border-bottom: 0;
            padding-bottom: 0;
          }

          .cf-content-validation-icon {
            align-items: center;
            border-radius: 999px;
            display: inline-flex;
            flex-shrink: 0;
            font-size: 0.74rem;
            font-weight: 800;
            height: 1.35rem;
            justify-content: center;
            width: 1.35rem;
          }

          .cf-content-validation-icon.is-ok {
            background: rgba(55, 201, 177, 0.14);
            color: #0f8590;
          }

          .cf-content-validation-icon.is-warn {
            background: rgba(245, 154, 83, 0.14);
            color: #f59a53;
          }

          .cf-content-mode-card {
            align-content: start;
            background:
              radial-gradient(circle at top right, rgba(55, 201, 177, 0.08), transparent 34%),
              #f8fafc;
            border: 1px solid #e4ebf4;
            border-radius: 1rem;
            display: grid;
            gap: 0.75rem;
            min-width: 0;
            padding: 1rem;
            transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
          }

          .cf-content-mode-card .badge {
            display: inline-flex;
            justify-content: center;
            line-height: 1.2;
            max-width: 100%;
            text-align: center;
            white-space: normal;
          }

          .cf-content-mode-card h6,
          .cf-content-mode-card p {
            min-width: 0;
          }

          .cf-content-mode-card.is-selected,
          .cf-content-mode-card:hover {
            box-shadow: 0 18px 34px rgba(16, 44, 69, 0.08);
            transform: translateY(-1px);
          }

          .cf-content-session-note,
          .cf-content-checkpoint,
          .cf-content-snapshot {
            background: #f8fafc;
            border: 1px solid #e4ebf4;
            border-radius: 1rem;
            padding: 1rem;
          }

          .cf-content-session-note {
            align-items: flex-start;
            display: flex;
            gap: 0.75rem;
            justify-content: space-between;
          }

          .cf-content-snapshot-row + .cf-content-snapshot-row {
            margin-top: 0.85rem;
            padding-top: 0.85rem;
            border-top: 1px solid #e4ebf4;
          }

          .cf-content-snapshot-row span {
            color: #67748e;
            display: block;
            font-size: 0.76rem;
            margin-bottom: 0.22rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .cf-content-snapshot-row strong {
            color: #102c45;
            display: block;
            font-size: 0.92rem;
            line-height: 1.55;
          }

          .cf-content-progress-item {
            align-items: center;
            display: flex;
            gap: 0.75rem;
          }

          .cf-content-progress-dot {
            background: #d7e0eb;
            border-radius: 999px;
            height: 0.75rem;
            width: 0.75rem;
            box-shadow: inset 0 0 0 4px rgba(255, 255, 255, 0.72);
          }

          .cf-content-progress-dot.is-done {
            background: linear-gradient(135deg, #0f8590 0%, #37c9b1 100%);
          }

          .cf-content-advanced {
            border: 1px dashed #d6e1ee;
            border-radius: 1rem;
            padding: 0.85rem 1rem 1rem;
          }

          .cf-content-advanced summary {
            color: #102c45;
            cursor: pointer;
            font-size: 0.82rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            list-style: none;
            text-transform: uppercase;
          }

          .cf-content-advanced summary::-webkit-details-marker {
            display: none;
          }

          .creatorflow-internal-main .card {
            border: 1px solid #e4ebf4;
            border-radius: 1rem;
            box-shadow: 0 14px 30px rgba(16, 44, 69, 0.08);
            transition: transform 220ms ease, box-shadow 220ms ease;
            animation: cfCardIn 420ms ease both;
          }

          .creatorflow-internal-main .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 18px 36px rgba(16, 44, 69, 0.12);
          }

          .creatorflow-internal-main .card .card-header {
            padding-left: 1.25rem;
            padding-right: 1.25rem;
          }

          .creatorflow-internal-main .card .card-body {
            padding-left: 1.25rem;
            padding-right: 1.25rem;
          }

          .creatorflow-internal-main .btn-primary,
          .creatorflow-internal-main .bg-gradient-primary {
            background: linear-gradient(135deg, #0f8590 0%, #37c9b1 100%) !important;
            border-color: transparent !important;
            box-shadow: 0 14px 28px rgba(15, 133, 144, 0.22) !important;
            color: #ffffff !important;
          }

          .creatorflow-internal-main .btn-primary:hover,
          .creatorflow-internal-main .btn-primary:focus,
          .creatorflow-internal-main .bg-gradient-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 18px 32px rgba(15, 133, 144, 0.26) !important;
          }

          .creatorflow-internal-main .btn-outline-primary {
            border-color: #0f8590 !important;
            color: #0f8590 !important;
            background: rgba(15, 133, 144, 0.04) !important;
          }

          .creatorflow-internal-main .btn-outline-primary:hover,
          .creatorflow-internal-main .btn-outline-primary:focus {
            background: linear-gradient(135deg, #0f8590 0%, #37c9b1 100%) !important;
            border-color: transparent !important;
            color: #ffffff !important;
          }

          .creatorflow-internal-main .bg-gradient-info {
            background: linear-gradient(135deg, #102c45 0%, #1f7ff0 100%) !important;
          }

          .creatorflow-internal-main .bg-gradient-success {
            background: linear-gradient(135deg, #0f8590 0%, #37c9b1 100%) !important;
          }

          .creatorflow-internal-main .bg-gradient-warning {
            background: linear-gradient(135deg, #f59a53 0%, #ff7a45 100%) !important;
          }

          .creatorflow-internal-main .bg-gradient-secondary {
            background: linear-gradient(135deg, #6f82a6 0%, #8ba0c7 100%) !important;
          }

          .creatorflow-internal-main .bg-gradient-dark {
            background: linear-gradient(135deg, #102c45 0%, #081420 100%) !important;
          }

          .creatorflow-internal-main .badge {
            border-radius: 999px;
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.03em;
            padding: 0.52rem 0.82rem;
          }

          .creatorflow-internal-main .creatorflow-payment-badge {
            align-items: center;
            align-self: center;
            display: inline-flex;
            font-size: 0.66rem;
            justify-content: center;
            letter-spacing: 0.04em;
            line-height: 1;
            min-height: 2.55rem;
            min-width: 7.35rem;
            padding: 0.42rem 0.88rem;
            text-align: center;
            white-space: nowrap;
          }

          .creatorflow-internal-main .creatorflow-ops-hero-badge {
            align-items: center;
            background: rgba(255, 255, 255, 0.96) !important;
            border-radius: 999px;
            box-shadow: 0 10px 24px rgba(16, 44, 69, 0.1);
            color: #334e73 !important;
            display: inline-flex;
            font-size: 0.66rem;
            font-weight: 800;
            justify-content: flex-start;
            letter-spacing: 0.03em;
            min-height: 2.45rem;
            padding: 0.46rem 1rem !important;
            width: 100%;
          }

          .creatorflow-internal-main .creatorflow-ops-status-badge {
            align-items: center;
            align-self: flex-start;
            display: inline-flex;
            font-size: 0.64rem;
            font-weight: 800;
            justify-content: center;
            letter-spacing: 0.04em;
            line-height: 1;
            min-height: 2.15rem;
            min-width: 6.25rem;
            padding: 0.38rem 0.74rem;
            text-align: center;
            white-space: nowrap;
          }

          .cf-premium-card {
            box-shadow: 0 24px 52px rgba(16, 44, 69, 0.18) !important;
          }

          .cf-surface-card {
            overflow: hidden;
          }

          .cf-internal-page .table > thead th {
            letter-spacing: 0.08em;
            font-size: 0.64rem;
          }

          .cf-internal-page .table > tbody td {
            vertical-align: middle;
            padding-top: 0.92rem;
            padding-bottom: 0.92rem;
          }

          .cf-dashboard-page .chart {
            min-height: 280px;
          }

          .cf-dashboard-page .card-header h6,
          .cf-billing-page .card-header h6,
          .cf-pipeline-page .card-header h6,
          .cf-ops-page .card-header h6,
          .cf-profile-page .card-header h6 {
            font-size: 1.09rem;
            letter-spacing: -0.012em;
          }

          .cf-dashboard-page .numbers h5 {
            font-size: 2rem;
            margin-bottom: 0.22rem;
          }

          .cf-profile-page .form-control,
          .cf-profile-page .form-select {
            border-radius: 0.72rem;
          }

          .cf-profile-page .badge {
            font-weight: 600;
          }

          .cf-ops-page .list-group-item .creatorflow-ops-status-badge {
            margin-left: 0.75rem;
          }

          @keyframes cfCardIn {
            from {
              opacity: 0;
              transform: translateY(8px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (max-width: 1199.98px) {
            .creatorflow-internal-main .container-fluid {
              padding-left: 1rem;
              padding-right: 1rem;
            }

            .creatorflow-internal-main .card:hover {
              transform: none;
            }

            .creatorflow-topbar-chip-secondary {
              display: none;
            }
          }

          @media (max-width: 991.98px) {
            .creatorflow-internal-topbar {
              margin-top: 0.4rem;
              backdrop-filter: none;
            }

            .creatorflow-internal-main .card {
              box-shadow: 0 10px 24px rgba(16, 44, 69, 0.08);
            }

            .creatorflow-topbar-page-title {
              font-size: 1.35rem;
            }

            .creatorflow-topbar-chips {
              display: none !important;
            }

            .creatorflow-topbar-profile-btn {
              min-width: auto;
              padding-left: 0.75rem;
              padding-right: 0.75rem;
            }
          }

          @media (max-height: 860px) {
            .creatorflow-sidenav-promo-body {
              display: none;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .creatorflow-internal-main .card {
              animation: none;
              transition: none;
            }
          }
        `}</style>
      </head>
      <body>
        <WebLocaleProvider>
          {children}
          <IconRuntime />
          <Script src="/assets/js/core/popper.min.js" strategy="afterInteractive" />
          <Script src="/assets/js/core/bootstrap.min.js" strategy="afterInteractive" />
        </WebLocaleProvider>
      </body>
    </html>
  );
}
