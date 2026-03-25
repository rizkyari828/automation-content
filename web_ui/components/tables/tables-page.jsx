import ArgonPage, { ArgonFooter } from "../layout/argon-page.jsx";

const AUTHORS = [
  {
    name: "John Michael",
    email: "john@creative-tim.com",
    role: "Manager",
    team: "Organization",
    status: "Online",
    statusClassName: "bg-gradient-success",
    employed: "23/04/18",
    image: "/assets/img/team-2.jpg"
  },
  {
    name: "Alexa Liras",
    email: "alexa@creative-tim.com",
    role: "Programator",
    team: "Developer",
    status: "Offline",
    statusClassName: "bg-gradient-secondary",
    employed: "11/01/19",
    image: "/assets/img/team-3.jpg"
  },
  {
    name: "Laurent Perrier",
    email: "laurent@creative-tim.com",
    role: "Executive",
    team: "Projects",
    status: "Online",
    statusClassName: "bg-gradient-success",
    employed: "19/09/17",
    image: "/assets/img/team-4.jpg"
  },
  {
    name: "Michael Levi",
    email: "michael@creative-tim.com",
    role: "Programator",
    team: "Developer",
    status: "Online",
    statusClassName: "bg-gradient-success",
    employed: "24/12/08",
    image: "/assets/img/team-3.jpg"
  },
  {
    name: "Richard Gran",
    email: "richard@creative-tim.com",
    role: "Manager",
    team: "Executive",
    status: "Offline",
    statusClassName: "bg-gradient-secondary",
    employed: "04/10/21",
    image: "/assets/img/team-2.jpg"
  },
  {
    name: "Miriam Eric",
    email: "miriam@creative-tim.com",
    role: "Programtor",
    team: "Developer",
    status: "Offline",
    statusClassName: "bg-gradient-secondary",
    employed: "14/09/20",
    image: "/assets/img/team-4.jpg"
  }
];

const PROJECTS = [
  {
    name: "Spotify",
    budget: "$2,500",
    status: "working",
    completion: 60,
    progressClassName: "bg-gradient-info",
    image: "/assets/img/small-logos/logo-spotify.svg"
  },
  {
    name: "Invision",
    budget: "$5,000",
    status: "done",
    completion: 100,
    progressClassName: "bg-gradient-success",
    image: "/assets/img/small-logos/logo-invision.svg"
  },
  {
    name: "Jira",
    budget: "$3,400",
    status: "canceled",
    completion: 30,
    progressClassName: "bg-gradient-danger",
    image: "/assets/img/small-logos/logo-jira.svg"
  },
  {
    name: "Slack",
    budget: "$1,000",
    status: "canceled",
    completion: 0,
    progressClassName: "bg-gradient-success",
    image: "/assets/img/small-logos/logo-slack.svg"
  },
  {
    name: "Webdev",
    budget: "$14,000",
    status: "working",
    completion: 80,
    progressClassName: "bg-gradient-info",
    image: "/assets/img/small-logos/logo-webdev.svg"
  },
  {
    name: "Adobe XD",
    budget: "$2,300",
    status: "done",
    completion: 100,
    progressClassName: "bg-gradient-success",
    image: "/assets/img/small-logos/logo-xd.svg"
  }
];

function AuthorsTable() {
  return (
    <div className="card mb-4">
      <div className="card-header pb-0">
        <h6>Authors table</h6>
      </div>
      <div className="card-body px-0 pt-0 pb-2">
        <div className="table-responsive p-0">
          <table className="table align-items-center mb-0">
            <thead>
              <tr>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Author</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Function</th>
                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Status</th>
                <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Employed</th>
                <th className="text-secondary opacity-7" />
              </tr>
            </thead>
            <tbody>
              {AUTHORS.map((author) => (
                <tr key={author.email}>
                  <td>
                    <div className="d-flex px-2 py-1">
                      <div>
                        <img src={author.image} className="avatar avatar-sm me-3" alt={author.name} />
                      </div>
                      <div className="d-flex flex-column justify-content-center">
                        <h6 className="mb-0 text-sm">{author.name}</h6>
                        <p className="text-xs text-secondary mb-0">{author.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-xs font-weight-bold mb-0">{author.role}</p>
                    <p className="text-xs text-secondary mb-0">{author.team}</p>
                  </td>
                  <td className="align-middle text-center text-sm">
                    <span className={`badge badge-sm ${author.statusClassName}`}>{author.status}</span>
                  </td>
                  <td className="align-middle text-center">
                    <span className="text-secondary text-xs font-weight-bold">{author.employed}</span>
                  </td>
                  <td className="align-middle">
                    <button type="button" className="btn btn-link text-secondary font-weight-bold text-xs mb-0 p-0">
                      Edit
                    </button>
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

function ProjectsTable() {
  return (
    <div className="card mb-4">
      <div className="card-header pb-0">
        <h6>Projects table</h6>
      </div>
      <div className="card-body px-0 pt-0 pb-2">
        <div className="table-responsive p-0">
          <table className="table align-items-center justify-content-center mb-0">
            <thead>
              <tr>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Project</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Budget</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">Status</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder text-center opacity-7 ps-2">Completion</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {PROJECTS.map((project) => (
                <tr key={project.name}>
                  <td>
                    <div className="d-flex px-2">
                      <div>
                        <img src={project.image} className="avatar avatar-sm rounded-circle me-2" alt={project.name} />
                      </div>
                      <div className="my-auto">
                        <h6 className="mb-0 text-sm">{project.name}</h6>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-sm font-weight-bold mb-0">{project.budget}</p>
                  </td>
                  <td>
                    <span className="text-xs font-weight-bold">{project.status}</span>
                  </td>
                  <td className="align-middle text-center">
                    <div className="d-flex align-items-center justify-content-center">
                      <span className="me-2 text-xs font-weight-bold">{project.completion}%</span>
                      <div>
                        <div className="progress">
                          <div
                            className={`progress-bar ${project.progressClassName}`}
                            role="progressbar"
                            aria-valuenow={project.completion}
                            aria-valuemin="0"
                            aria-valuemax="100"
                            style={{ width: `${project.completion}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="align-middle">
                    <button type="button" className="btn btn-link text-secondary mb-0">
                      <i className="fa fa-ellipsis-v text-xs" />
                    </button>
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

export default function TablesPage() {
  return (
    <ArgonPage pageTitle="Tables" activeRoute="tables">
      <div className="container-fluid py-4">
        <div className="row">
          <div className="col-12">
            <AuthorsTable />
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <ProjectsTable />
          </div>
        </div>
        <ArgonFooter />
      </div>
    </ArgonPage>
  );
}
