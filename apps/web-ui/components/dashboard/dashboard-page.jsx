"use client";

import ArgonChart from "../charts/argon-chart.jsx";
import SessionPanel from "../auth/session-panel.jsx";
import { useWebMessages } from "../i18n/web-locale.jsx";
import ArgonPage, { ArgonFooter } from "../layout/argon-page.jsx";

function DashboardStatCard({ stat, last }) {
  return (
    <div className={`col-xl-3 col-sm-6${last ? "" : " mb-xl-0 mb-4"}`}>
      <div className="card h-100 cf-surface-card">
        <div className="card-body p-3">
          <div className="row">
            <div className="col-8">
              <div className="numbers">
                <p className="text-sm mb-0 text-uppercase font-weight-bold">{stat.label}</p>
                <h5 className="font-weight-bolder mb-1">{stat.value}</h5>
                <p className="mb-0">
                  <span className={`${stat.changeClassName} text-sm font-weight-bolder`}>{stat.change}</span>
                  {" "}
                  {stat.suffix}
                </p>
              </div>
            </div>
            <div className="col-4 text-end">
              <div className={`icon icon-shape text-center rounded-circle ${stat.iconClassName}`}>
                <i className={`${stat.icon} text-lg opacity-10`} aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowSnapshotCard({ copy }) {
  return (
    <div className="card h-100 cf-surface-card">
      <div className="card-header pb-0 p-3">
        <h6 className="mb-1">{copy.workflowTitle}</h6>
        <p className="text-sm mb-0">{copy.workflowBody}</p>
      </div>
      <div className="card-body p-3">
        <ul className="list-group">
          {copy.workflowItems.map((item, index) => (
            <li
              key={item.label}
              className={`list-group-item border-0 d-flex align-items-start justify-content-between px-0${index < copy.workflowItems.length - 1 ? " mb-3" : ""}`}
            >
              <div className="me-3">
                <span className="text-xs text-uppercase font-weight-bolder text-secondary">
                  {item.label}
                </span>
                <h5 className="mb-1">{item.value}</h5>
                <p className="text-sm mb-0 text-secondary">{item.detail}</p>
              </div>
              <span className={`badge ${item.badgeClassName}`}>{item.badge}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ChannelQueueCard({ copy }) {
  return (
    <div className="card h-100 cf-surface-card">
      <div className="card-header pb-0 p-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1">{copy.channelsTitle}</h6>
            <p className="text-sm mb-0">{copy.channelsSubtitle}</p>
          </div>
          <span className="badge bg-gradient-dark">{copy.channelsBadge}</span>
        </div>
      </div>
      <div className="card-body p-3">
        <div className="table-responsive">
          <table className="table align-items-center mb-0">
            <thead>
              <tr>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                  {copy.channelLabels.channel}
                </th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">
                  {copy.channelLabels.format}
                </th>
                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                  {copy.channelLabels.drafts}
                </th>
                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                  {copy.channelLabels.status}
                </th>
              </tr>
            </thead>
            <tbody>
              {copy.channels.map((item) => (
                <tr key={item.channel}>
                  <td>
                    <div className="d-flex px-2 py-1">
                      <div>
                        <div className={`icon icon-shape icon-sm border-radius-md ${item.iconClassName}`}>
                          <i className={`${item.icon} text-white text-sm opacity-10`} />
                        </div>
                      </div>
                      <div className="d-flex flex-column justify-content-center ms-3">
                        <h6 className="mb-0 text-sm">{item.channel}</h6>
                        <p className="text-xs text-secondary mb-0">{item.owner}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-xs font-weight-bold mb-0">{item.format}</p>
                    <p className="text-xs text-secondary mb-0">{item.window}</p>
                  </td>
                  <td className="align-middle text-center text-sm">
                    <span className="font-weight-bold">{item.drafts}</span>
                  </td>
                  <td className="align-middle text-center">
                    <span className={`badge badge-sm ${item.statusClassName}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PlaybooksCard({ copy }) {
  return (
    <div className="card cf-surface-card">
      <div className="card-header pb-0 p-3">
        <h6 className="mb-0">{copy.playbooksTitle}</h6>
      </div>
      <div className="card-body p-3">
        <ul className="list-group">
          {copy.playbooks.map((item, index) => (
            <li
              key={item.title}
              className={`list-group-item border-0 d-flex align-items-start px-0${index < copy.playbooks.length - 1 ? " mb-3" : ""}`}
            >
              <div className={`icon icon-shape icon-sm shadow text-center rounded-circle ${item.iconClassName}`}>
                <i className={`${item.icon} text-white opacity-10`} />
              </div>
              <div className="ms-3">
                <h6 className="mb-1 text-sm">{item.title}</h6>
                <p className="text-xs text-secondary mb-1">{item.body}</p>
                <span className={`badge ${item.badgeClassName}`}>{item.badge}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CadenceCard({ copy }) {
  return (
    <div className="card mt-4 cf-surface-card">
      <div className="card-header pb-0 p-3">
        <h6 className="mb-1">{copy.cadenceTitle}</h6>
        <p className="text-sm mb-0">{copy.cadenceBody}</p>
      </div>
      <div className="card-body p-3">
        <ul className="list-group">
          {copy.cadenceItems.map((item, index) => (
            <li
              key={item.day}
              className={`list-group-item border-0 d-flex justify-content-between align-items-center px-0${index < copy.cadenceItems.length - 1 ? " mb-3" : ""}`}
            >
              <div>
                <span className="text-xs font-weight-bolder text-secondary text-uppercase">
                  {item.day}
                </span>
                <h6 className="mb-1 text-sm">{item.focus}</h6>
                <p className="text-xs text-secondary mb-0">{item.note}</p>
              </div>
              <span className={`badge ${item.badgeClassName}`}>{item.badge}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const copy = useWebMessages().web.dashboardPage;

  return (
    <ArgonPage pageTitle={copy.pageTitle} activeRoute="dashboard" includeChartJs>
      <div className="container-fluid py-4 cf-internal-page cf-dashboard-page">
        <SessionPanel />
        <div className="row g-4">
          {copy.stats.map((stat, index) => (
            <DashboardStatCard key={stat.label} stat={stat} last={index === copy.stats.length - 1} />
          ))}
        </div>

        <div className="row g-4 mt-1">
          <div className="col-lg-7 mb-lg-0 mb-4">
            <div className="card z-index-2 h-100 cf-surface-card">
              <div className="card-header pb-0 pt-3 bg-transparent">
                <h6 className="text-capitalize">{copy.velocityTitle}</h6>
                <p className="text-sm mb-0">
                  <i className="fa fa-arrow-up text-success" />
                  <span className="font-weight-bold">{copy.velocityChange}</span>
                </p>
              </div>
              <div className="card-body p-3">
                <div className="chart">
                  <ArgonChart variant="dashboard-line" height={300} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-5">
            <WorkflowSnapshotCard copy={copy} />
          </div>
        </div>

        <div className="row g-4 mt-1">
          <div className="col-lg-7 mb-lg-0 mb-4">
            <ChannelQueueCard copy={copy} />
          </div>
          <div className="col-lg-5">
            <PlaybooksCard copy={copy} />
            <CadenceCard copy={copy} />
          </div>
        </div>

        <ArgonFooter />
      </div>
    </ArgonPage>
  );
}
