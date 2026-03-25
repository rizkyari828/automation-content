import ArgonPage, { ArgonFooter } from "../layout/argon-page.jsx";

const PROFILE_BACKGROUND = (
  <div
    className="position-absolute w-100 min-height-300 top-0"
    style={{
      backgroundImage:
        "url('https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-dashboard-pro/assets/img/profile-layout-header.jpg')",
      backgroundPositionY: "50%"
    }}
  >
    <span className="mask bg-primary opacity-6" />
  </div>
);

const PROFILE_FIELDS = [
  {
    title: "User Information",
    fields: [
      { label: "Username", type: "text", defaultValue: "lucky.jesse", colClassName: "col-md-6" },
      { label: "Email address", type: "email", defaultValue: "jesse@example.com", colClassName: "col-md-6" },
      { label: "First name", type: "text", defaultValue: "Jesse", colClassName: "col-md-6" },
      { label: "Last name", type: "text", defaultValue: "Lucky", colClassName: "col-md-6" }
    ]
  },
  {
    title: "Contact Information",
    fields: [
      {
        label: "Address",
        type: "text",
        defaultValue: "Bld Mihail Kogalniceanu, nr. 8 Bl 1, Sc 1, Ap 09",
        colClassName: "col-md-12"
      },
      { label: "City", type: "text", defaultValue: "New York", colClassName: "col-md-4" },
      { label: "Country", type: "text", defaultValue: "United States", colClassName: "col-md-4" },
      { label: "Postal code", type: "text", defaultValue: "437300", colClassName: "col-md-4" }
    ]
  },
  {
    title: "About me",
    fields: [
      {
        label: "About me",
        type: "text",
        defaultValue: "A beautiful Dashboard for Bootstrap 5. It is Free and Open Source.",
        colClassName: "col-md-12"
      }
    ]
  }
];

function ProfileSummaryCard() {
  return (
    <div className="card shadow-lg mx-4 card-profile-bottom">
      <div className="card-body p-3">
        <div className="row gx-4">
          <div className="col-auto">
            <div className="avatar avatar-xl position-relative">
              <img src="/assets/img/team-1.jpg" alt="profile" className="w-100 border-radius-lg shadow-sm" />
            </div>
          </div>
          <div className="col-auto my-auto">
            <div className="h-100">
              <h5 className="mb-1">Sayo Kravits</h5>
              <p className="mb-0 font-weight-bold text-sm">Public Relations</p>
            </div>
          </div>
          <div className="col-lg-4 col-md-6 my-sm-auto ms-sm-auto me-sm-0 mx-auto mt-3">
            <div className="nav-wrapper position-relative end-0">
              <ul className="nav nav-pills nav-fill p-1" role="tablist">
                <li className="nav-item">
                  <button type="button" className="nav-link mb-0 px-0 py-1 active d-flex align-items-center justify-content-center">
                    <i className="ni ni-app" />
                    <span className="ms-2">App</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button type="button" className="nav-link mb-0 px-0 py-1 d-flex align-items-center justify-content-center">
                    <i className="ni ni-email-83" />
                    <span className="ms-2">Messages</span>
                  </button>
                </li>
                <li className="nav-item">
                  <button type="button" className="nav-link mb-0 px-0 py-1 d-flex align-items-center justify-content-center">
                    <i className="ni ni-settings-gear-65" />
                    <span className="ms-2">Settings</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileEditor() {
  return (
    <div className="col-md-8">
      <div className="card">
        <div className="card-header pb-0">
          <div className="d-flex align-items-center">
            <p className="mb-0">Edit Profile</p>
            <button type="button" className="btn btn-primary btn-sm ms-auto">
              Settings
            </button>
          </div>
        </div>
        <div className="card-body">
          {PROFILE_FIELDS.map((section, sectionIndex) => (
            <div key={section.title}>
              <p className="text-uppercase text-sm">{section.title}</p>
              <div className="row">
                {section.fields.map((field) => (
                  <div key={field.label} className={field.colClassName}>
                    <div className="form-group">
                      <label className="form-control-label">{field.label}</label>
                      <input className="form-control" type={field.type} defaultValue={field.defaultValue} />
                    </div>
                  </div>
                ))}
              </div>
              {sectionIndex < PROFILE_FIELDS.length - 1 ? <hr className="horizontal dark" /> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileCard() {
  return (
    <div className="col-md-4">
      <div className="card card-profile">
        <img src="/assets/img/bg-profile.jpg" alt="Profile background" className="card-img-top" />
        <div className="row justify-content-center">
          <div className="col-4 col-lg-4 order-lg-2">
            <div className="mt-n4 mt-lg-n6 mb-4 mb-lg-0">
              <button type="button" className="border-0 bg-transparent p-0">
                <img
                  src="/assets/img/team-2.jpg"
                  className="rounded-circle img-fluid border border-2 border-white"
                  alt="Mark Davis"
                />
              </button>
            </div>
          </div>
        </div>
        <div className="card-header text-center border-0 pt-0 pt-lg-2 pb-4 pb-lg-3">
          <div className="d-flex justify-content-between">
            <button type="button" className="btn btn-sm btn-info mb-0 d-none d-lg-block">
              Connect
            </button>
            <button type="button" className="btn btn-sm btn-info mb-0 d-block d-lg-none">
              <i className="ni ni-collection" />
            </button>
            <button type="button" className="btn btn-sm btn-dark float-right mb-0 d-none d-lg-block">
              Message
            </button>
            <button type="button" className="btn btn-sm btn-dark float-right mb-0 d-block d-lg-none">
              <i className="ni ni-email-83" />
            </button>
          </div>
        </div>
        <div className="card-body pt-0">
          <div className="row">
            <div className="col">
              <div className="d-flex justify-content-center">
                <div className="d-grid text-center">
                  <span className="text-lg font-weight-bolder">22</span>
                  <span className="text-sm opacity-8">Friends</span>
                </div>
                <div className="d-grid text-center mx-4">
                  <span className="text-lg font-weight-bolder">10</span>
                  <span className="text-sm opacity-8">Photos</span>
                </div>
                <div className="d-grid text-center">
                  <span className="text-lg font-weight-bolder">89</span>
                  <span className="text-sm opacity-8">Comments</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-4">
            <h5>
              Mark Davis<span className="font-weight-light">, 35</span>
            </h5>
            <div className="h6 font-weight-300">
              <i className="ni location_pin mr-2" />
              Bucharest, Romania
            </div>
            <div className="h6 mt-4">
              <i className="ni business_briefcase-24 mr-2" />
              Solution Manager - Creative Tim Officer
            </div>
            <div>
              <i className="ni education_hat mr-2" />
              University of Computer Science
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ArgonPage
      pageTitle="Profile"
      activeRoute="profile"
      background={PROFILE_BACKGROUND}
      mainClassName="main-content position-relative max-height-vh-100 h-100"
      showNavbarFixed={false}
      topbarProps={{
        className:
          "navbar navbar-main navbar-expand-lg bg-transparent shadow-none position-absolute px-4 w-100 z-index-2 mt-n11",
        containerClassName: "container-fluid py-1",
        breadcrumbClassName: "breadcrumb bg-transparent mb-0 pb-0 pt-1 ps-2 me-sm-6 me-5",
        titleClassName: "text-white font-weight-bolder ms-2",
        dropdownMenuClassName: "ms-n4",
        mobileNavItemClassName: "nav-item d-xl-none ps-3 pe-0 d-flex align-items-center"
      }}
    >
      <ProfileSummaryCard />
      <div className="container-fluid py-4">
        <div className="row">
          <ProfileEditor />
          <ProfileCard />
        </div>
        <ArgonFooter />
      </div>
    </ArgonPage>
  );
}
