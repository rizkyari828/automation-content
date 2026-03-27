"use client";

import { useWebMessages } from "../i18n/web-locale.jsx";
import ArgonPage, { ArgonFooter } from "../layout/argon-page.jsx";

function PipelineTable({ copy }) {
  return (
    <div className="card mb-4 cf-surface-card">
      <div className="card-header pb-0">
        <h6 className="mb-1">{copy.pipelineTitle}</h6>
        <p className="text-sm mb-0">{copy.pipelineBody}</p>
      </div>
      <div className="card-body px-0 pt-0 pb-2">
        <div className="table-responsive p-0">
          <table className="table align-items-center mb-0">
            <thead>
              <tr>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                  {copy.pipelineLabels.channel}
                </th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">
                  {copy.pipelineLabels.campaign}
                </th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">
                  {copy.pipelineLabels.owner}
                </th>
                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                  {copy.pipelineLabels.drafts}
                </th>
                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                  {copy.pipelineLabels.stage}
                </th>
                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                  {copy.pipelineLabels.status}
                </th>
              </tr>
            </thead>
            <tbody>
              {copy.pipelineRows.map((item) => (
                <tr key={`${item.channel}-${item.campaign}`}>
                  <td>
                    <div className="d-flex align-items-center px-2 py-1">
                      <div
                        className="icon icon-shape icon-sm border-radius-md text-center me-2"
                        style={{ background: item.iconBackground }}
                      >
                        <i className={`${item.icon} text-sm`} style={{ color: item.iconColor }} />
                      </div>
                      <div>
                        <h6 className="mb-0 text-sm">{item.channel}</h6>
                        <p className="text-xs text-secondary mb-0">{item.slot}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-xs font-weight-bold mb-0">{item.campaign}</p>
                    <p className="text-xs text-secondary mb-0">{item.angle}</p>
                  </td>
                  <td>
                    <span className="text-xs text-secondary">{item.owner}</span>
                  </td>
                  <td className="align-middle text-center">
                    <span className="text-sm font-weight-bold">{item.drafts}</span>
                  </td>
                  <td className="align-middle text-center">
                    <span className="text-xs font-weight-bold">{item.stage}</span>
                  </td>
                  <td className="align-middle text-center">
                    <span className={`badge badge-sm ${item.statusClass}`}>{item.status}</span>
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

function ExperimentTable({ copy }) {
  return (
    <div className="card mb-4 cf-surface-card">
      <div className="card-header pb-0">
        <h6 className="mb-1">{copy.experimentsTitle}</h6>
        <p className="text-sm mb-0">{copy.experimentsBody}</p>
      </div>
      <div className="card-body px-0 pt-0 pb-2">
        <div className="table-responsive p-0">
          <table className="table align-items-center justify-content-center mb-0">
            <thead>
              <tr>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                  {copy.experimentsLabels.hypothesis}
                </th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">
                  {copy.experimentsLabels.variant}
                </th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">
                  {copy.experimentsLabels.owner}
                </th>
                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                  {copy.experimentsLabels.lift}
                </th>
                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                  {copy.experimentsLabels.decision}
                </th>
              </tr>
            </thead>
            <tbody>
              {copy.experiments.map((item) => (
                <tr key={`${item.hypothesis}-${item.variant}`}>
                  <td>
                    <div className="px-2">
                      <h6 className="mb-0 text-sm">{item.hypothesis}</h6>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs text-secondary">{item.variant}</span>
                  </td>
                  <td>
                    <span className="text-xs text-secondary">{item.owner}</span>
                  </td>
                  <td className="align-middle text-center">
                    <span className={`text-sm font-weight-bold ${item.liftClass}`}>{item.lift}</span>
                  </td>
                  <td className="align-middle text-center">
                    <span className={`badge badge-sm ${item.decisionClass}`}>{item.decision}</span>
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

function NextActions({ copy }) {
  return (
    <div className="card cf-surface-card">
      <div className="card-header pb-0">
        <h6 className="mb-1">{copy.actionsTitle}</h6>
        <p className="text-sm mb-0">{copy.actionsBody}</p>
      </div>
      <div className="card-body p-3">
        <ul className="list-group">
          {copy.actions.map((item, index) => (
            <li
              key={item.title}
              className={`list-group-item border-0 d-flex align-items-start px-0${index < copy.actions.length - 1 ? " mb-3" : ""}`}
            >
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
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function TablesPage() {
  const copy = useWebMessages().web.tablesPage;

  return (
    <ArgonPage pageTitle={copy.pageTitle} activeRoute="tables">
      <div className="container-fluid py-4 cf-internal-page cf-pipeline-page">
        <div className="row g-4">
          <div className="col-12">
            <PipelineTable copy={copy} />
          </div>
        </div>
        <div className="row g-4">
          <div className="col-lg-8">
            <ExperimentTable copy={copy} />
          </div>
          <div className="col-lg-4">
            <NextActions copy={copy} />
          </div>
        </div>
        <ArgonFooter />
      </div>
    </ArgonPage>
  );
}
