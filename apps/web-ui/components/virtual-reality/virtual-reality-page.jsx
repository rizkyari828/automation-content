import ArgonPage, { ArgonFooter } from "../layout/argon-page.jsx";

const AGENDA = [
  { time: "08:00", title: "Synk up with Mark", subtitle: "Hangouts" },
  { time: "09:30", title: "Gym", subtitle: "World Class" },
  { time: "11:00", title: "Design Review", subtitle: "Zoom" }
];

const QUICK_ACTIONS = [
  { image: "/assets/img/team-1.jpg", title: "My Profile", type: "avatar" },
  { icon: "fas fa-home", title: "Home" },
  { icon: "fas fa-search", title: "Search" },
  { icon: "fas fa-ellipsis-h", title: "Minimize" }
];

const MESSAGE_AVATARS = [
  { image: "/assets/img/team-1.jpg", title: "2 New Messages" },
  { image: "/assets/img/team-2.jpg", title: "1 New Message" },
  { image: "/assets/img/team-3.jpg", title: "13 New Messages" },
  { image: "/assets/img/team-4.jpg", title: "7 New Messages" }
];

function VirtualRealityPanel() {
  return (
    <div
      className="border-radius-xl mt-4 mx-4 position-relative"
      style={{ backgroundImage: "url('/assets/img/vr-bg.jpg')", backgroundSize: "cover" }}
    >
      <section className="section min-vh-85 position-relative transform-scale-0 transform-scale-md-7">
        <div className="container">
          <div className="row pt-10">
            <div className="col-lg-1 col-md-1 pt-5 pt-lg-0 ms-lg-5 text-center">
              {QUICK_ACTIONS.map((action, index) =>
                action.type === "avatar" ? (
                  <a
                    key={action.title}
                    href="#!"
                    className="avatar avatar-md border-0 d-block mb-2"
                    data-bs-toggle="tooltip"
                    data-bs-placement="left"
                    title={action.title}
                  >
                    <img className="border-radius-lg" alt={action.title} src={action.image} />
                  </a>
                ) : (
                  <button
                    key={action.title}
                    className={`btn btn-white border-radius-lg p-2 d-block${index === 1 ? " mt-0 mt-md-2" : ""}${index > 1 ? " ms-2 ms-md-0" : " mx-2 mx-md-0"}`}
                    type="button"
                    data-bs-toggle="tooltip"
                    data-bs-placement="left"
                    title={action.title}
                  >
                    <i className={`${action.icon} p-2`} />
                  </button>
                )
              )}
            </div>
            <div className="col-lg-8 col-md-11">
              <div className="d-flex">
                <div className="me-auto">
                  <h1 className="display-1 font-weight-bold mb-0">12°C</h1>
                  <h6 className="text-uppercase mb-0 ms-1">Cloudy</h6>
                </div>
                <div className="ms-auto">
                  <img className="w-50 float-end mt-md-n5" src="/assets/img/small-logos/icon-sun-cloud.png" alt="sun cloud" />
                </div>
              </div>
              <div className="row mt-4">
                <div className="col-lg-4 col-md-4">
                  <div className="card move-on-hover overflow-hidden">
                    <div className="card-body">
                      {AGENDA.map((item, index) => (
                        <div key={item.time}>
                          <div className="d-flex">
                            <h6 className="mb-0 me-3">{item.time}</h6>
                            <h6 className="mb-0">
                              {item.title}
                              <small className="text-secondary font-weight-normal d-block">{item.subtitle}</small>
                            </h6>
                          </div>
                          {index < AGENDA.length - 1 ? <hr className="horizontal dark" /> : null}
                        </div>
                      ))}
                    </div>
                    <a href="#!" className="bg-gray-100 w-100 text-center py-1" data-bs-toggle="tooltip" data-bs-placement="top" title="Show More">
                      <i className="fas fa-chevron-down text-primary" />
                    </a>
                  </div>
                </div>
                <div className="col-lg-4 col-md-4 mt-4 mt-sm-0">
                  <div className="card bg-gradient-dark move-on-hover">
                    <div className="card-body">
                      <div className="d-flex">
                        <h5 className="mb-0 text-white">To Do</h5>
                        <div className="ms-auto">
                          <h1 className="text-white text-end mb-0 mt-n2">7</h1>
                          <p className="text-sm mb-0 text-white">items</p>
                        </div>
                      </div>
                      <p className="text-white mb-0">Shopping</p>
                      <p className="mb-0 text-white">Meeting</p>
                    </div>
                    <a href="#!" className="w-100 text-center py-1" data-bs-toggle="tooltip" data-bs-placement="top" title="Show More">
                      <i className="fas fa-chevron-down text-white" />
                    </a>
                  </div>
                  <div className="card move-on-hover mt-4">
                    <div className="card-body">
                      <div className="d-flex">
                        <p className="mb-0">Emails (21)</p>
                        <a href="#!" className="ms-auto" data-bs-toggle="tooltip" data-bs-placement="top" title="Check your emails">
                          Check
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4 col-md-4 mt-4 mt-sm-0">
                  <div className="card card-background card-background-mask-primary move-on-hover align-items-start">
                    <div className="cursor-pointer">
                      <div
                        className="full-background"
                        style={{
                          backgroundImage:
                            "url('https://images.unsplash.com/photo-1518609878373-06d740f60d8b?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=2370&q=80')"
                        }}
                      />
                      <div className="card-body">
                        <h5 className="text-white mb-0">Some Kind Of Blues</h5>
                        <p className="text-white text-sm">Deftones</p>
                        <div className="d-flex mt-5">
                          <button className="btn btn-outline-white rounded-circle p-2 mb-0" type="button" data-bs-toggle="tooltip" data-bs-placement="top" title="Prev">
                            <i className="fas fa-backward p-2" />
                          </button>
                          <button className="btn btn-outline-white rounded-circle p-2 mx-2 mb-0" type="button" data-bs-toggle="tooltip" data-bs-placement="top" title="Pause">
                            <i className="fas fa-play p-2" />
                          </button>
                          <button className="btn btn-outline-white rounded-circle p-2 mb-0" type="button" data-bs-toggle="tooltip" data-bs-placement="top" title="Next">
                            <i className="fas fa-forward p-2" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card move-on-hover mt-4 mb-4 mb-md-0 mt-md-4">
                    <div className="card-body">
                      <div className="d-flex">
                        <p className="my-auto">Messages</p>
                        <div className="ms-auto">
                          <div className="avatar-group">
                            {MESSAGE_AVATARS.map((avatar) => (
                              <a
                                key={avatar.title}
                                href="#!"
                                className="avatar avatar-sm border-0 rounded-circle"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title={avatar.title}
                              >
                                <img alt={avatar.title} src={avatar.image} />
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function VirtualRealityPage() {
  return (
    <ArgonPage
      pageTitle="Virtual Reality"
      activeRoute="virtual-reality"
      bodyClass="g-sidenav-show bg-gray-100 virtual-reality"
      background={null}
      topbarProps={{
        className: "navbar navbar-main navbar-expand-lg px-0 mx-4 shadow-none border-radius-xl mt-3 mx-3 bg-primary"
      }}
    >
      <VirtualRealityPanel />
      <ArgonFooter />
    </ArgonPage>
  );
}
