"use client";

import ArgonChart from "../charts/argon-chart.jsx";
import { useWebMessages } from "../i18n/web-locale.jsx";
import ArgonPage, { ArgonFooter } from "../layout/argon-page.jsx";

function StatCard({ stat }) {
  return (
    <div className="col-lg-3 col-sm-6 mb-lg-0 mb-4">
      <div className="card">
        <div className="card-body p-3">
          <div className="row">
            <div className="col-8">
              <div className="numbers">
                <p className="text-sm mb-0 text-capitalize font-weight-bold">{stat.label}</p>
                <h5 className="font-weight-bolder mb-0">
                  {stat.value}
                  <span className={`${stat.changeClassName} text-sm font-weight-bolder`}> {stat.change}</span>
                </h5>
              </div>
            </div>
            <div className="col-4 text-start">
              <div className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                <i className={`${stat.icon} text-lg opacity-10`} aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCards({ copy }) {
  return (
    <div className="row mt-4">
      <div className="col-lg-7 mb-lg-0 mb-4">
        <div className="card">
          <div className="card-body p-3">
            <div className="row">
              <div className="col-lg-6 mb-lg-0 mb-4">
                <div className="d-flex flex-column h-100">
                  <p className="mb-1 pt-2 text-bold">{copy.heroEyebrow}</p>
                  <h5 className="font-weight-bolder">{copy.heroTitle}</h5>
                  <p className="mb-5">{copy.heroBody}</p>
                  <a className="text-dark font-weight-bold ps-1 mb-0 icon-move-left mt-auto" href="#!">
                    {copy.readDocs}
                    <i className="fas fa-arrow-left text-sm ms-1" aria-hidden="true" />
                  </a>
                </div>
              </div>
              <div className="col-lg-4 me-auto ms-0 text-center">
                <div className="bg-gradient-primary border-radius-lg min-height-200">
                  <img src="/assets/img/shapes/waves-white.svg" className="position-absolute h-100 top-0 d-md-block d-none" alt="waves" />
                  <div className="position-relative pt-5 pb-4">
                    <img className="max-width-500 w-100 position-relative z-index-2" src="/assets/img/illustrations/rocket-white.png" alt="rocket" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-lg-5">
        <div className="card h-100 p-3">
          <div className="overflow-hidden position-relative border-radius-lg bg-cover h-100" style={{ backgroundImage: "url('/assets/img/ivancik.jpg')" }}>
            <span className="mask bg-gradient-dark" />
            <div className="card-body position-relative z-index-1 p-3 h-100">
              <div className="d-flex flex-column h-100">
                <h5 className="text-white font-weight-bolder mb-4 pt-2">{copy.storyTitle}</h5>
                <p className="text-white mb-5">{copy.storyBody}</p>
                <a className="text-white font-weight-bold ps-1 mb-0 icon-move-left mt-auto" href="#!">
                  {copy.readDocs}
                  <i className="fas fa-arrow-left text-sm ms-1" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartsRow({ copy }) {
  return (
    <div className="row mt-4">
      <div className="col-lg-5 mb-lg-0 mb-4">
        <div className="card">
          <div className="card-body p-3">
            <div className="bg-gradient-dark border-radius-lg py-3 pe-1 mb-3">
              <div className="chart">
                <ArgonChart variant="rtl-bars" height={170} />
              </div>
            </div>
            <h6 className="ms-2 mt-4 mb-0">{copy.activeUsers}</h6>
            <p className="text-sm ms-2">
              <span className="font-weight-bolder">{copy.activeUsersChange}</span>
            </p>
            <div className="container border-radius-lg">
              <div className="row">
                {copy.activeUsersItems.map((item) => (
                  <div key={item.label} className="col-3 py-3 ps-0">
                    <div className="d-flex mb-2">
                      <div className={`icon icon-shape icon-xxs shadow border-radius-sm text-center ms-2 d-flex align-items-center justify-content-center ${item.iconClassName}`}>
                        <span className="text-white text-xs font-weight-bold">{item.label.slice(0, 1)}</span>
                      </div>
                      <p className="text-xs mt-1 mb-0 font-weight-bold">{item.label}</p>
                    </div>
                    <h4 className="font-weight-bolder">{item.value}</h4>
                    <div className="progress w-75">
                      <div className={`progress-bar bg-dark ${item.progressClassName}`} role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-lg-7">
        <div className="card">
          <div className="card-header pb-0">
            <h6>{copy.salesOverview}</h6>
            <p className="text-sm">
              <i className="fa fa-arrow-up text-success" />
              <span className="font-weight-bold"> {copy.salesOverviewChange}</span>
            </p>
          </div>
          <div className="card-body p-3">
            <div className="chart">
              <ArgonChart variant="rtl-line" height={300} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectsAndTimeline({ copy }) {
  return (
    <div className="row my-4">
      <div className="col-lg-8 col-md-6 mb-md-0 mb-4">
        <div className="card">
          <div className="card-header pb-0">
            <div className="row mb-3">
              <div className="col-6">
                <h6>{copy.projectsTitle}</h6>
                <p className="text-sm">
                  <i className="fa fa-check text-info" aria-hidden="true" />
                  <span className="font-weight-bold ms-1">{copy.projectsSummary}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="card-body p-0 pb-2">
            <div className="table-responsive">
              <table className="table align-items-center mb-0">
                <thead>
                  <tr>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">{copy.tableHeaders.project}</th>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">{copy.tableHeaders.members}</th>
                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">{copy.tableHeaders.budget}</th>
                    <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">{copy.tableHeaders.completion}</th>
                  </tr>
                </thead>
                <tbody>
                  {copy.projects.map((project) => (
                    <tr key={project.title}>
                      <td>
                        <div className="d-flex px-2 py-1">
                          <div><img src={project.logo} className="avatar avatar-sm ms-3" alt={project.title} /></div>
                          <div className="d-flex flex-column justify-content-center">
                            <h6 className="mb-0 text-sm">{project.title}</h6>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="avatar-group mt-2">
                          {project.members.map((member, index) => (
                            <a key={`${project.title}-${index}`} href="#!" className="avatar avatar-xs rounded-circle" data-bs-toggle="tooltip" data-bs-placement="bottom" title={copy.teamMember}>
                              <img alt="member" src={member} />
                            </a>
                          ))}
                        </div>
                      </td>
                      <td className="align-middle text-center text-sm">
                        <span className="text-xs font-weight-bold">{project.budget}</span>
                      </td>
                      <td className="align-middle">
                        <div className="progress-wrapper w-75 mx-auto">
                          <div className="progress-info">
                            <div className="progress-percentage">
                              <span className="text-xs font-weight-bold">{project.completion}</span>
                            </div>
                          </div>
                          <div className="progress">
                            <div className={`progress-bar bg-gradient-info ${project.progressClassName}`} role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="col-lg-4 col-md-6">
        <div className="card h-100">
          <div className="card-header pb-0">
            <h6>{copy.ordersOverview}</h6>
            <p className="text-sm">
              <i className="fa fa-arrow-up text-success" aria-hidden="true" />
              <span className="font-weight-bold"> {copy.ordersSummary}</span>
            </p>
          </div>
          <div className="card-body p-3">
            <div className="timeline timeline-one-side">
              {copy.timeline.map((item) => (
                <div key={item.title} className="timeline-block mb-3">
                  <span className="timeline-step">
                    <i className={item.icon} />
                  </span>
                  <div className="timeline-content">
                    <h6 className="text-dark text-sm font-weight-bold mb-0">{item.title}</h6>
                    <p className="text-secondary font-weight-bold text-xs mt-1 mb-0">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RtlPage() {
  const copy = useWebMessages().web.rtlPage;

  return (
    <ArgonPage
      pageTitle={copy.pageTitle}
      activeRoute="rtl"
      bodyClass="g-sidenav-show rtl bg-gray-100"
      includeChartJs
    >
      <div className="container-fluid py-4">
        <div className="row">
          {copy.stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>
        <HeroCards copy={copy} />
        <ChartsRow copy={copy} />
        <ProjectsAndTimeline copy={copy} />
        <ArgonFooter />
      </div>
    </ArgonPage>
  );
}
