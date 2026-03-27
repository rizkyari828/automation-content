"use client";

import { useWebMessages } from "../i18n/web-locale.jsx";
import ArgonPage, { ArgonFooter } from "../layout/argon-page.jsx";

function OpsHero({ copy }) {
  return (
    <div className="card shadow-xl border-0 mb-4 cf-premium-card">
      <div
        className="card-body p-4"
        style={{
          background:
            "linear-gradient(130deg, rgba(16, 44, 69, 0.98) 0%, rgba(10, 89, 112, 0.96) 55%, rgba(245, 154, 83, 0.82) 100%)",
          borderRadius: "1rem",
          color: "#fff"
        }}
      >
        <p className="text-xs text-uppercase mb-2 opacity-8" style={{ letterSpacing: "0.16em" }}>
          {copy.heroEyebrow}
        </p>
        <div className="row align-items-end g-3">
          <div className="col-lg-8">
            <h4 className="text-white mb-2">{copy.heroTitle}</h4>
            <p className="mb-0 opacity-8">{copy.heroBody}</p>
          </div>
          <div className="col-lg-4">
            <div className="d-flex flex-column gap-2">
              {copy.heroBadges.map((badge) => (
                <span key={badge} className="badge bg-white text-dark text-start creatorflow-ops-hero-badge">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertsCard({ copy }) {
  return (
    <div className="card h-100 cf-surface-card">
      <div className="card-header pb-0 p-3">
        <h6 className="mb-1">{copy.alertsTitle}</h6>
        <p className="text-sm mb-0">{copy.alertsBody}</p>
      </div>
      <div className="card-body p-3">
        <ul className="list-group">
          {copy.alerts.map((item, index) => (
            <li
              key={item.title}
              className={`list-group-item border-0 px-0${index < copy.alerts.length - 1 ? " mb-3" : ""}`}
            >
              <div className="d-flex justify-content-between gap-2">
                <div className="d-flex">
                  <div
                    className="icon icon-shape icon-sm border-radius-md text-center me-3"
                    style={{ background: item.iconBackground }}
                  >
                    <i className={`${item.icon} text-sm`} style={{ color: item.iconColor }} />
                  </div>
                  <div>
                    <h6 className="text-sm mb-1">{item.title}</h6>
                    <p className="text-xs text-secondary mb-0">{item.body}</p>
                  </div>
                </div>
                <span className={`badge creatorflow-ops-status-badge ${item.badgeClass}`}>{item.badge}</span>
              </div>
              <p className="text-xs text-secondary mb-0 mt-2">{item.time}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function QueueCard({ copy }) {
  return (
    <div className="card h-100 cf-surface-card">
      <div className="card-header pb-0 p-3">
        <h6 className="mb-1">{copy.queueTitle}</h6>
        <p className="text-sm mb-0">{copy.queueBody}</p>
      </div>
      <div className="card-body p-3">
        {copy.queues.map((item, index) => (
          <div
            key={item.channel}
            className={`border-radius-lg p-3${index < copy.queues.length - 1 ? " mb-3" : ""}`}
            style={{ background: "#f6f8fc", border: "1px solid #e6ebf3" }}
          >
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="text-sm mb-1">{item.channel}</h6>
                <p className="text-xs text-secondary mb-1">{item.window}</p>
              </div>
              <span className={`badge creatorflow-ops-status-badge ${item.statusClass}`}>{item.status}</span>
            </div>
            <p className="text-xs mb-0">{item.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistCard({ copy }) {
  return (
    <div className="card h-100 cf-surface-card">
      <div className="card-header pb-0 p-3">
        <h6 className="mb-1">{copy.checklistTitle}</h6>
        <p className="text-sm mb-0">{copy.checklistBody}</p>
      </div>
      <div className="card-body p-3">
        <ul className="list-group">
          {copy.checklist.map((item, index) => (
            <li
              key={item.task}
              className={`list-group-item border-0 d-flex justify-content-between align-items-center px-0${index < copy.checklist.length - 1 ? " mb-3" : ""}`}
            >
              <div>
                <h6 className="text-sm mb-1">{item.task}</h6>
                <p className="text-xs text-secondary mb-0">{item.owner}</p>
              </div>
              <span className={`badge creatorflow-ops-status-badge ${item.statusClass}`}>{item.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function VirtualRealityPage() {
  const copy = useWebMessages().web.virtualRealityPage;

  return (
    <ArgonPage pageTitle={copy.pageTitle} activeRoute="virtual-reality">
      <div className="container-fluid py-4 cf-internal-page cf-ops-page">
        <OpsHero copy={copy} />
        <div className="row g-4">
          <div className="col-lg-4">
            <AlertsCard copy={copy} />
          </div>
          <div className="col-lg-4">
            <QueueCard copy={copy} />
          </div>
          <div className="col-lg-4">
            <ChecklistCard copy={copy} />
          </div>
        </div>
        <ArgonFooter />
      </div>
    </ArgonPage>
  );
}
