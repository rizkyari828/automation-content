import Script from "next/script";

import ArgonChart from "../charts/argon-chart.jsx";
import DashboardBodyClass from "../dashboard/dashboard-body-class.jsx";
import DashboardConfigurator from "../dashboard/dashboard-configurator.jsx";

const RTL_STATS = [
  { label: "أموال اليوم", value: "$53,000", change: "+55%", changeClassName: "text-success", icon: "ni ni-money-coins" },
  { label: "مستخدمو اليوم", value: "2,300", change: "+33%", changeClassName: "text-success", icon: "ni ni-world" },
  { label: "عملاء جدد", value: "+3,462", change: "-2%", changeClassName: "text-danger", icon: "ni ni-paper-diploma" },
  { label: "مبيعات", value: "$103,430", change: "+5%", changeClassName: "text-success", icon: "ni ni-cart" }
];

const ACTIVE_USERS = [
  { label: "المستخدمون", value: "36K", progressClassName: "w-60", iconClassName: "bg-gradient-primary" },
  { label: "نقرات", value: "2m", progressClassName: "w-90", iconClassName: "bg-gradient-info" },
  { label: "مبيعات", value: "435$", progressClassName: "w-30", iconClassName: "bg-gradient-warning" },
  { label: "العناصر", value: "43", progressClassName: "w-50", iconClassName: "bg-gradient-danger" }
];

const RTL_PROJECTS = [
  { logo: "/assets/img/small-logos/logo-xd.svg", title: "Soft UI XD الإصدار", budget: "$14,000", completion: "60%", progressClassName: "w-60", members: ["/assets/img/team-1.jpg", "/assets/img/team-2.jpg", "/assets/img/team-3.jpg", "/assets/img/team-4.jpg"] },
  { logo: "/assets/img/small-logos/logo-atlassian.svg", title: "أضف مسار التقدم إلى التطبيق الداخلي", budget: "$3,000", completion: "10%", progressClassName: "w-10", members: ["/assets/img/team-2.jpg", "/assets/img/team-4.jpg"] },
  { logo: "/assets/img/small-logos/logo-slack.svg", title: "إصلاح أخطاء النظام الأساسي", budget: "غير مضبوط", completion: "100%", progressClassName: "w-100 bg-gradient-success", members: ["/assets/img/team-3.jpg", "/assets/img/team-1.jpg"] },
  { logo: "/assets/img/small-logos/logo-spotify.svg", title: "إطلاق تطبيق الهاتف المحمول الخاص بنا", budget: "$20,500", completion: "100%", progressClassName: "w-100 bg-gradient-success", members: ["/assets/img/team-4.jpg", "/assets/img/team-3.jpg", "/assets/img/team-4.jpg", "/assets/img/team-1.jpg"] },
  { logo: "/assets/img/small-logos/logo-jira.svg", title: "أضف صفحة التسعير الجديدة", budget: "$500", completion: "25%", progressClassName: "w-25", members: ["/assets/img/team-4.jpg"] },
  { logo: "/assets/img/small-logos/logo-invision.svg", title: "إعادة تصميم متجر جديد على الإنترنت", budget: "$2,000", completion: "40%", progressClassName: "w-40", members: ["/assets/img/team-1.jpg", "/assets/img/team-4.jpg"] }
];

const TIMELINE = [
  { icon: "ni ni-bell-55 text-success text-gradient", title: "$2400, تغييرات في التصميم", date: "22 DEC 7:20 PM" },
  { icon: "ni ni-html5 text-danger text-gradient", title: "طلب جديد #1832412", date: "21 DEC 11 PM" },
  { icon: "ni ni-cart text-info text-gradient", title: "مدفوعات الخادم لشهر أبريل", date: "21 DEC 9:34 PM" },
  { icon: "ni ni-credit-card text-warning text-gradient", title: "تمت إضافة بطاقة جديدة للطلب #4395133", date: "20 DEC 2:20 AM" },
  { icon: "ni ni-key-25 text-primary text-gradient", title: "فتح الحزم من أجل التطوير", date: "18 DEC 4:54 AM" },
  { icon: "ni ni-money-coins text-dark text-gradient", title: "طلب جديد #9583120", date: "17 DEC" }
];

function RtlSidebar() {
  return (
    <aside className="sidenav bg-white navbar navbar-vertical navbar-expand-xs border-0 border-radius-xl my-3 fixed-end me-4 rotate-caret" id="sidenav-main">
      <div className="sidenav-header">
        <i className="fas fa-times p-3 cursor-pointer text-secondary opacity-5 position-absolute start-0 top-0 d-none d-xl-none" aria-hidden="true" id="iconSidenav" />
        <a className="navbar-brand m-0" href="https://demos.creative-tim.com/argon-dashboard/pages/dashboard.html" target="_blank" rel="noreferrer">
          <img src="/assets/img/logo-ct-dark.png" width="26" height="26" className="navbar-brand-img h-100" alt="main logo" />
          <span className="me-1 font-weight-bold">Creative Tim</span>
        </a>
      </div>
      <hr className="horizontal dark mt-0" />
      <div className="collapse navbar-collapse px-0 w-auto" id="sidenav-collapse-main">
        <ul className="navbar-nav">
          <li className="nav-item"><a className="nav-link" href="/dashboard"><div className="icon icon-shape icon-sm border-radius-md text-center ms-2 d-flex align-items-center justify-content-center"><i className="ni ni-tv-2 text-primary text-sm opacity-10" /></div><span className="nav-link-text me-1">لوحة القيادة</span></a></li>
          <li className="nav-item"><a className="nav-link" href="/tables"><div className="icon icon-shape icon-sm border-radius-md text-center ms-2 d-flex align-items-center justify-content-center"><i className="ni ni-calendar-grid-58 text-warning text-sm opacity-10" /></div><span className="nav-link-text me-1">الجداول</span></a></li>
          <li className="nav-item"><a className="nav-link" href="/billing"><div className="icon icon-shape icon-sm border-radius-md text-center ms-2 d-flex align-items-center justify-content-center"><i className="ni ni-credit-card text-success text-sm opacity-10" /></div><span className="nav-link-text me-1">الفواتير</span></a></li>
          <li className="nav-item"><a className="nav-link" href="/virtual-reality"><div className="icon icon-shape icon-sm border-radius-md text-center ms-2 d-flex align-items-center justify-content-center"><i className="ni ni-app text-info text-sm opacity-10" /></div><span className="nav-link-text me-1">الواقع الافتراضي</span></a></li>
          <li className="nav-item"><a className="nav-link active" href="/rtl"><div className="icon icon-shape icon-sm border-radius-md text-center ms-2 d-flex align-items-center justify-content-center"><i className="ni ni-world-2 text-danger text-sm opacity-10" /></div><span className="nav-link-text me-1">RTL</span></a></li>
          <li className="nav-item mt-3"><h6 className="ps-4 me-4 pe-2 text-uppercase text-xs font-weight-bolder opacity-6">صفحات المرافق</h6></li>
          <li className="nav-item"><a className="nav-link" href="/profile"><div className="icon icon-shape icon-sm border-radius-md text-center ms-2 d-flex align-items-center justify-content-center"><i className="ni ni-single-02 text-dark text-sm opacity-10" /></div><span className="nav-link-text me-1">حساب تعريفي</span></a></li>
          <li className="nav-item"><a className="nav-link" href="/sign-in"><div className="icon icon-shape icon-sm border-radius-md text-center ms-2 d-flex align-items-center justify-content-center"><i className="ni ni-single-copy-04 text-warning text-sm opacity-10" /></div><span className="nav-link-text me-1">تسجيل الدخول</span></a></li>
          <li className="nav-item"><a className="nav-link" href="/sign-up"><div className="icon icon-shape icon-sm border-radius-md text-center ms-2 d-flex align-items-center justify-content-center"><i className="ni ni-collection text-info text-sm opacity-10" /></div><span className="nav-link-text me-1">اشتراك</span></a></li>
        </ul>
      </div>
      <div className="sidenav-footer mx-3">
        <div className="card card-plain shadow-none" id="sidenavCard">
          <img className="w-50 mx-auto" src="/assets/img/illustrations/icon-documentation.svg" alt="sidebar illustration" />
          <div className="card-body text-center p-3 w-100 pt-0">
            <div className="docs-info">
              <h6 className="mb-0 text-center">تحتاج مساعدة?</h6>
              <p className="text-xs font-weight-bold text-center mb-0">يرجى التحقق من مستنداتنا</p>
            </div>
          </div>
        </div>
        <a href="https://www.creative-tim.com/learning-lab/bootstrap/license/argon-dashboard" target="_blank" rel="noreferrer" className="btn btn-dark btn-sm w-100 mb-3">توثيق</a>
        <a className="btn btn-primary btn-sm mb-0 w-100" href="https://www.creative-tim.com/product/argon-dashboard-pro?ref=sidebarfree" target="_blank" rel="noreferrer">التطور للاحترافية</a>
      </div>
    </aside>
  );
}

function RtlPageContent() {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        {RTL_STATS.map((stat) => (
          <div key={stat.label} className="col-lg-3 col-sm-6 mb-lg-0 mb-4">
            <div className="card">
              <div className="card-body p-3">
                <div className="row">
                  <div className="col-8">
                    <div className="numbers">
                      <p className="text-sm mb-0 text-capitalize font-weight-bold">{stat.label}</p>
                      <h5 className="font-weight-bolder mb-0">
                        {stat.value}
                        <span className={`${stat.changeClassName} text-sm font-weight-bolder`}>{stat.change}</span>
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
        ))}
      </div>
      <div className="row mt-4">
        <div className="col-lg-7 mb-lg-0 mb-4">
          <div className="card">
            <div className="card-body p-3">
              <div className="row">
                <div className="col-lg-6 mb-lg-0 mb-4">
                  <div className="d-flex flex-column h-100">
                    <p className="mb-1 pt-2 text-bold">بناها المطورون</p>
                    <h5 className="font-weight-bolder">Soft UI Dashboard</h5>
                    <p className="mb-5">من الألوان والبطاقات والطباعة إلى العناصر المعقدة ، ستجد الوثائق الكاملة.</p>
                    <a className="text-dark font-weight-bold ps-1 mb-0 icon-move-left mt-auto" href="#!">
                      اقرأ المستندات
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
                  <h5 className="text-white font-weight-bolder mb-4 pt-2">العمل مع الصواريخ</h5>
                  <p className="text-white mb-5">تكوين الثروة هو لعبة تطوري حديثة ذات حصيلة إيجابية. الأمر كله يتعلق بمن يغتنم الفرصة أولاً هذه بطاقة بسيطة.</p>
                  <a className="text-white font-weight-bold ps-1 mb-0 icon-move-left mt-auto" href="#!">
                    اقرأ المستندات
                    <i className="fas fa-arrow-left text-sm ms-1" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row mt-4">
        <div className="col-lg-5 mb-lg-0 mb-4">
          <div className="card">
            <div className="card-body p-3">
              <div className="bg-gradient-dark border-radius-lg py-3 pe-1 mb-3">
                <div className="chart">
                  <ArgonChart variant="rtl-bars" height={170} />
                </div>
              </div>
              <h6 className="ms-2 mt-4 mb-0"> المستخدمين النشطين </h6>
              <p className="text-sm ms-2"> (<span className="font-weight-bolder">+23%</span>) من الأسبوع الماضي </p>
              <div className="container border-radius-lg">
                <div className="row">
                  {ACTIVE_USERS.map((item) => (
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
              <h6>نظرة عامة على المبيعات</h6>
              <p className="text-sm">
                <i className="fa fa-arrow-up text-success" />
                <span className="font-weight-bold">4% أكثر</span> في عام 2021
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
      <div className="row my-4">
        <div className="col-lg-8 col-md-6 mb-md-0 mb-4">
          <div className="card">
            <div className="card-header pb-0">
              <div className="row mb-3">
                <div className="col-6">
                  <h6>المشاريع</h6>
                  <p className="text-sm">
                    <i className="fa fa-check text-info" aria-hidden="true" />
                    <span className="font-weight-bold ms-1">30 انتهى</span> هذا الشهر
                  </p>
                </div>
                <div className="col-6 my-auto text-start">
                  <div className="dropdown float-start ps-4">
                    <a className="cursor-pointer" id="dropdownTable" data-bs-toggle="dropdown" aria-expanded="false">
                      <i className="fa fa-ellipsis-v text-secondary" />
                    </a>
                    <ul className="dropdown-menu px-2 py-3 me-n4" aria-labelledby="dropdownTable">
                      <li><a className="dropdown-item border-radius-md" href="#!">عمل</a></li>
                      <li><a className="dropdown-item border-radius-md" href="#!">عمل آخر</a></li>
                      <li><a className="dropdown-item border-radius-md" href="#!">شيء آخر هنا</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-0 pb-2">
              <div className="table-responsive">
                <table className="table align-items-center mb-0">
                  <thead>
                    <tr>
                      <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">المشروع</th>
                      <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">أعضاء</th>
                      <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">ميزانية</th>
                      <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">إكمال</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RTL_PROJECTS.map((project) => (
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
                              <a key={`${project.title}-${index}`} href="#!" className="avatar avatar-xs rounded-circle" data-bs-toggle="tooltip" data-bs-placement="bottom" title="Team member">
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
              <h6>نظرة عامة على الطلبات</h6>
              <p className="text-sm">
                <i className="fa fa-arrow-up text-success" aria-hidden="true" />
                <span className="font-weight-bold">24%</span> هذا الشهر
              </p>
            </div>
            <div className="card-body p-3">
              <div className="timeline timeline-one-side">
                {TIMELINE.map((item) => (
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
      <footer className="footer pt-3">
        <div className="container-fluid">
          <div className="row align-items-center justify-content-lg-between">
            <div className="col-lg-6 mb-lg-0 mb-4">
              <div className="copyright text-center text-sm text-muted text-lg-end">
                © {new Date().getFullYear()}, made with <i className="fa fa-heart" /> by{" "}
                <a href="https://www.creative-tim.com" className="font-weight-bold" target="_blank" rel="noreferrer">
                  Creative Tim
                </a>{" "}
                for a better web.
              </div>
            </div>
            <div className="col-lg-6">
              <ul className="nav nav-footer justify-content-center justify-content-lg-end">
                <li className="nav-item"><a href="https://www.creative-tim.com" className="nav-link text-muted" target="_blank" rel="noreferrer">Creative Tim</a></li>
                <li className="nav-item"><a href="https://www.creative-tim.com/presentation" className="nav-link text-muted" target="_blank" rel="noreferrer">About Us</a></li>
                <li className="nav-item"><a href="https://www.creative-tim.com/blog" className="nav-link text-muted" target="_blank" rel="noreferrer">Blog</a></li>
                <li className="nav-item"><a href="https://www.creative-tim.com/license" className="nav-link pe-0 text-muted" target="_blank" rel="noreferrer">License</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function RtlPage() {
  return (
    <>
      <DashboardBodyClass className="g-sidenav-show rtl bg-gray-100" />
      <Script src="/assets/js/plugins/chartjs.min.js" strategy="afterInteractive" />
      <Script src="https://buttons.github.io/buttons.js" strategy="afterInteractive" />
      <div className="min-height-300 bg-dark position-absolute w-100" />
      <RtlSidebar />
      <main className="main-content position-relative border-radius-lg overflow-hidden">
        <nav className="navbar navbar-main navbar-expand-lg px-0 mx-4 shadow-none border-radius-xl" id="navbarBlur" data-scroll="false">
          <div className="container-fluid py-1 px-3">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb bg-transparent mb-0 pb-0 pt-1 px-0">
                <li className="breadcrumb-item text-sm ps-2"><a className="opacity-5 text-white" href="#!">لوحات القيادة</a></li>
                <li className="breadcrumb-item text-sm text-white active" aria-current="page">RTL</li>
              </ol>
              <h6 className="font-weight-bolder text-white mb-0">RTL</h6>
            </nav>
            <div className="collapse navbar-collapse mt-sm-0 mt-2 px-0" id="navbar">
              <div className="ms-md-auto pe-md-3 d-flex align-items-center">
                <div className="input-group">
                  <span className="input-group-text text-body"><i className="fas fa-search" aria-hidden="true" /></span>
                  <input type="text" className="form-control" placeholder="أكتب هنا..." />
                </div>
              </div>
              <ul className="navbar-nav me-auto ms-0 justify-content-end">
                <li className="nav-item d-flex align-items-center">
                  <a href="/sign-in" className="nav-link text-white font-weight-bold px-0">
                    <i className="fa fa-user me-sm-1" />
                    <span className="d-sm-inline d-none">يسجل دخول</span>
                  </a>
                </li>
                <li className="nav-item d-xl-none pe-3 d-flex align-items-center">
                  <button type="button" className="nav-link text-white p-0 border-0 bg-transparent" id="iconNavbarSidenav">
                    <div className="sidenav-toggler-inner">
                      <i className="sidenav-toggler-line bg-white" />
                      <i className="sidenav-toggler-line bg-white" />
                      <i className="sidenav-toggler-line bg-white" />
                    </div>
                  </button>
                </li>
                <li className="nav-item px-3 d-flex align-items-center">
                  <button type="button" className="nav-link text-white p-0 fixed-plugin-button-nav border-0 bg-transparent">
                    <i className="fa fa-cog cursor-pointer" />
                  </button>
                </li>
                <li className="nav-item dropdown ps-2 d-flex align-items-center">
                  <button type="button" className="nav-link text-white p-0 border-0 bg-transparent" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                    <i className="fa fa-bell cursor-pointer" />
                  </button>
                  <ul className="dropdown-menu px-2 py-3 me-sm-n4" aria-labelledby="dropdownMenuButton">
                    <li className="mb-2"><a className="dropdown-item border-radius-md" href="#!"><div className="d-flex py-1"><div className="my-auto"><img src="/assets/img/team-2.jpg" className="avatar avatar-sm ms-3" alt="Laur" /></div><div className="d-flex flex-column justify-content-center"><h6 className="text-sm font-weight-normal mb-1"><span className="font-weight-bold">New message</span> from Laur</h6><p className="text-xs text-secondary mb-0"><i className="fa fa-clock me-1" />13 minutes ago</p></div></div></a></li>
                    <li className="mb-2"><a className="dropdown-item border-radius-md" href="#!"><div className="d-flex py-1"><div className="my-auto"><img src="/assets/img/small-logos/logo-spotify.svg" className="avatar avatar-sm bg-gradient-dark ms-3" alt="Spotify" /></div><div className="d-flex flex-column justify-content-center"><h6 className="text-sm font-weight-normal mb-1"><span className="font-weight-bold">New album</span> by Travis Scott</h6><p className="text-xs text-secondary mb-0"><i className="fa fa-clock me-1" />1 day</p></div></div></a></li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <RtlPageContent />
      </main>
      <DashboardConfigurator />
    </>
  );
}
