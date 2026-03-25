import Script from "next/script";

import IconRuntime from "../components/icons/icon-runtime.jsx";

export const metadata = {
  title: {
    default: "Automation Content UI",
    template: "%s | Automation Content UI"
  },
  description: "Next.js UI shell for automation-content-deployment microservices"
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
          href="https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700"
          rel="stylesheet"
        />
        <link href="/assets/css/nucleo-icons.css" rel="stylesheet" />
        <link href="/assets/css/nucleo-svg.css" rel="stylesheet" />
        <link id="pagestyle" href="/assets/css/argon-dashboard.css?v=2.1.0" rel="stylesheet" />
        <style>{`
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
        `}</style>
      </head>
      <body>
        {children}
        <IconRuntime />
        <Script src="https://kit.fontawesome.com/42d5adcbca.js" crossOrigin="anonymous" strategy="afterInteractive" />
        <Script src="/assets/js/core/popper.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/core/bootstrap.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/plugins/perfect-scrollbar.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/plugins/smooth-scrollbar.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/argon-dashboard.min.js?v=2.1.0" strategy="afterInteractive" />
      </body>
    </html>
  );
}
