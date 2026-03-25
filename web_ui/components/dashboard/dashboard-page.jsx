import ArgonChart from "../charts/argon-chart.jsx";
import ArgonPage, { ArgonFooter } from "../layout/argon-page.jsx";

const STATS = [
  {
    label: "Today's Money",
    value: "$53,000",
    change: "+55%",
    changeClassName: "text-success",
    suffix: "since yesterday",
    icon: "ni ni-money-coins",
    iconClassName: "bg-gradient-primary shadow-primary"
  },
  {
    label: "Today's Users",
    value: "2,300",
    change: "+3%",
    changeClassName: "text-success",
    suffix: "since last week",
    icon: "ni ni-world",
    iconClassName: "bg-gradient-danger shadow-danger"
  },
  {
    label: "New Clients",
    value: "+3,462",
    change: "-2%",
    changeClassName: "text-danger",
    suffix: "since last quarter",
    icon: "ni ni-paper-diploma",
    iconClassName: "bg-gradient-success shadow-success"
  },
  {
    label: "Sales",
    value: "$103,430",
    change: "+5%",
    changeClassName: "text-success",
    suffix: "than last month",
    icon: "ni ni-cart",
    iconClassName: "bg-gradient-warning shadow-warning"
  }
];

const CAROUSEL_SLIDES = [
  {
    image: "/assets/img/carousel-1.jpg",
    icon: "ni ni-camera-compact",
    title: "Get started with Argon",
    description: "There’s nothing I really wanted to do in life that I wasn’t able to get good at."
  },
  {
    image: "/assets/img/carousel-2.jpg",
    icon: "ni ni-bulb-61",
    title: "Faster way to create web pages",
    description: "That’s my skill. I’m not really specifically talented at anything except for the ability to learn."
  },
  {
    image: "/assets/img/carousel-3.jpg",
    icon: "ni ni-trophy",
    title: "Share with us your design tips!",
    description: "Don’t be afraid to be wrong because you can’t learn anything from a compliment."
  }
];

const COUNTRIES = [
  {
    flag: "/assets/img/icons/flags/US.png",
    name: "United States",
    sales: "2500",
    value: "$230,900",
    bounce: "29.9%"
  },
  {
    flag: "/assets/img/icons/flags/DE.png",
    name: "Germany",
    sales: "3.900",
    value: "$440,000",
    bounce: "40.22%"
  },
  {
    flag: "/assets/img/icons/flags/GB.png",
    name: "Great Britain",
    sales: "1.400",
    value: "$190,700",
    bounce: "23.44%"
  },
  {
    flag: "/assets/img/icons/flags/BR.png",
    name: "Brasil",
    sales: "562",
    value: "$143,960",
    bounce: "32.14%"
  }
];

const CATEGORIES = [
  {
    title: "Devices",
    description: (
      <>
        250 in stock, <span className="font-weight-bold">346+ sold</span>
      </>
    ),
    icon: "ni ni-mobile-button"
  },
  {
    title: "Tickets",
    description: (
      <>
        123 closed, <span className="font-weight-bold">15 open</span>
      </>
    ),
    icon: "ni ni-tag"
  },
  {
    title: "Error logs",
    description: (
      <>
        1 is active, <span className="font-weight-bold">40 closed</span>
      </>
    ),
    icon: "ni ni-box-2"
  },
  {
    title: "Happy users",
    description: <span className="font-weight-bold">+ 430</span>,
    icon: "ni ni-satisfied"
  }
];

function DashboardStatCard({ stat, last }) {
  return (
    <div className={`col-xl-3 col-sm-6${last ? "" : " mb-xl-0 mb-4"}`}>
      <div className="card">
        <div className="card-body p-3">
          <div className="row">
            <div className="col-8">
              <div className="numbers">
                <p className="text-sm mb-0 text-uppercase font-weight-bold">{stat.label}</p>
                <h5 className="font-weight-bolder">{stat.value}</h5>
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

function DashboardCarousel() {
  return (
    <div className="card card-carousel overflow-hidden h-100 p-0">
      <div id="carouselExampleCaptions" className="carousel slide h-100" data-bs-ride="carousel">
        <div className="carousel-inner border-radius-lg h-100">
          {CAROUSEL_SLIDES.map((slide, index) => (
            <div
              key={slide.title}
              className={`carousel-item h-100${index === 0 ? " active" : ""}`}
              style={{ backgroundImage: `url('${slide.image}')`, backgroundSize: "cover" }}
            >
              <div className="carousel-caption d-none d-md-block bottom-0 text-start start-0 ms-5">
                <div className="icon icon-shape icon-sm bg-white text-center border-radius-md mb-3">
                  <i className={`${slide.icon} text-dark opacity-10`} />
                </div>
                <h5 className="text-white mb-1">{slide.title}</h5>
                <p>{slide.description}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          className="carousel-control-prev w-5 me-3"
          type="button"
          data-bs-target="#carouselExampleCaptions"
          data-bs-slide="prev"
        >
          <span className="carousel-control-prev-icon" aria-hidden="true" />
          <span className="visually-hidden">Previous</span>
        </button>
        <button
          className="carousel-control-next w-5 me-3"
          type="button"
          data-bs-target="#carouselExampleCaptions"
          data-bs-slide="next"
        >
          <span className="carousel-control-next-icon" aria-hidden="true" />
          <span className="visually-hidden">Next</span>
        </button>
      </div>
    </div>
  );
}

function DashboardCountryTable() {
  return (
    <div className="card">
      <div className="card-header pb-0 p-3">
        <div className="d-flex justify-content-between">
          <h6 className="mb-2">Sales by Country</h6>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table align-items-center">
          <tbody>
            {COUNTRIES.map((country) => (
              <tr key={country.name}>
                <td className="w-30">
                  <div className="d-flex px-2 py-1 align-items-center">
                    <div>
                      <img src={country.flag} alt={`${country.name} flag`} />
                    </div>
                    <div className="ms-4">
                      <p className="text-xs font-weight-bold mb-0">Country:</p>
                      <h6 className="text-sm mb-0">{country.name}</h6>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="text-center">
                    <p className="text-xs font-weight-bold mb-0">Sales:</p>
                    <h6 className="text-sm mb-0">{country.sales}</h6>
                  </div>
                </td>
                <td>
                  <div className="text-center">
                    <p className="text-xs font-weight-bold mb-0">Value:</p>
                    <h6 className="text-sm mb-0">{country.value}</h6>
                  </div>
                </td>
                <td className="align-middle text-sm">
                  <div className="col text-center">
                    <p className="text-xs font-weight-bold mb-0">Bounce:</p>
                    <h6 className="text-sm mb-0">{country.bounce}</h6>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DashboardCategoriesCard() {
  return (
    <div className="card">
      <div className="card-header pb-0 p-3">
        <h6 className="mb-0">Categories</h6>
      </div>
      <div className="card-body p-3">
        <ul className="list-group">
          {CATEGORIES.map((category, index) => (
            <li
              key={category.title}
              className={`list-group-item border-0 d-flex justify-content-between ps-0 border-radius-lg${index < CATEGORIES.length - 1 ? " mb-2" : ""}`}
            >
              <div className="d-flex align-items-center">
                <div className="icon icon-shape icon-sm me-3 bg-gradient-dark shadow text-center">
                  <i className={`${category.icon} text-white opacity-10`} />
                </div>
                <div className="d-flex flex-column">
                  <h6 className="mb-1 text-dark text-sm">{category.title}</h6>
                  <span className="text-xs">{category.description}</span>
                </div>
              </div>
              <div className="d-flex">
                <button className="btn btn-link btn-icon-only btn-rounded btn-sm text-dark icon-move-right my-auto" type="button">
                  <i className="ni ni-bold-right" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ArgonPage pageTitle="Dashboard" activeRoute="dashboard" includeChartJs>
      <div className="container-fluid py-4">
        <div className="row">
          {STATS.map((stat, index) => (
            <DashboardStatCard key={stat.label} stat={stat} last={index === STATS.length - 1} />
          ))}
        </div>
        <div className="row mt-4">
          <div className="col-lg-7 mb-lg-0 mb-4">
            <div className="card z-index-2 h-100">
              <div className="card-header pb-0 pt-3 bg-transparent">
                <h6 className="text-capitalize">Sales overview</h6>
                <p className="text-sm mb-0">
                  <i className="fa fa-arrow-up text-success" />
                  <span className="font-weight-bold">4% more</span> in 2021
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
            <DashboardCarousel />
          </div>
        </div>
        <div className="row mt-4">
          <div className="col-lg-7 mb-lg-0 mb-4">
            <DashboardCountryTable />
          </div>
          <div className="col-lg-5">
            <DashboardCategoriesCard />
          </div>
        </div>
        <ArgonFooter />
      </div>
    </ArgonPage>
  );
}
