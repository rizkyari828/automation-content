import ArgonPage, { ArgonFooter } from "../layout/argon-page.jsx";

const PAYMENT_METHODS = [
  { brand: "mastercard", image: "/assets/img/logos/mastercard.png", number: "****   ****   ****   7852" },
  { brand: "visa", image: "/assets/img/logos/visa.png", number: "****   ****   ****   5248" }
];

const INVOICES = [
  { date: "March, 01, 2020", code: "#MS-415646", amount: "$180" },
  { date: "February, 10, 2021", code: "#RV-126749", amount: "$250" },
  { date: "April, 05, 2020", code: "#FB-212562", amount: "$560" },
  { date: "June, 25, 2019", code: "#QW-103578", amount: "$120" },
  { date: "March, 01, 2019", code: "#AR-803481", amount: "$300" }
];

const BILLING_INFORMATION = [
  {
    name: "Oliver Liam",
    company: "Viking Burrito",
    email: "oliver@burrito.com",
    vatNumber: "FRB1235476"
  },
  {
    name: "Lucas Harper",
    company: "Stone Tech Zone",
    email: "lucas@stone-tech.com",
    vatNumber: "FRB1235476"
  },
  {
    name: "Ethan James",
    company: "Fiber Notion",
    email: "ethan@fiber.com",
    vatNumber: "FRB1235476"
  }
];

const TRANSACTIONS = {
  newest: [
    {
      name: "Netflix",
      time: "27 March 2020, at 12:30 PM",
      amount: "- $ 2,500",
      amountClassName: "text-danger text-gradient",
      buttonClassName: "btn-outline-danger",
      icon: "fas fa-arrow-down"
    },
    {
      name: "Apple",
      time: "27 March 2020, at 04:30 AM",
      amount: "+ $ 2,000",
      amountClassName: "text-success text-gradient",
      buttonClassName: "btn-outline-success",
      icon: "fas fa-arrow-up"
    }
  ],
  yesterday: [
    {
      name: "Stripe",
      time: "26 March 2020, at 13:45 PM",
      amount: "+ $ 750",
      amountClassName: "text-success text-gradient",
      buttonClassName: "btn-outline-success",
      icon: "fas fa-arrow-up"
    },
    {
      name: "HubSpot",
      time: "26 March 2020, at 12:30 PM",
      amount: "+ $ 1,000",
      amountClassName: "text-success text-gradient",
      buttonClassName: "btn-outline-success",
      icon: "fas fa-arrow-up"
    },
    {
      name: "Creative Tim",
      time: "26 March 2020, at 08:30 AM",
      amount: "+ $ 2,500",
      amountClassName: "text-success text-gradient",
      buttonClassName: "btn-outline-success",
      icon: "fas fa-arrow-up"
    },
    {
      name: "Webflow",
      time: "26 March 2020, at 05:00 AM",
      amount: "Pending",
      amountClassName: "text-dark",
      buttonClassName: "btn-outline-dark",
      icon: "fas fa-exclamation"
    }
  ]
};

function BillingOverview() {
  return (
    <div className="col-lg-8">
      <div className="row">
        <div className="col-xl-6 mb-xl-0 mb-4">
          <div className="card bg-transparent shadow-xl">
            <div
              className="overflow-hidden position-relative border-radius-xl"
              style={{
                backgroundImage:
                  "url('https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-dashboard-pro/assets/img/card-visa.jpg')"
              }}
            >
              <span className="mask bg-gradient-dark" />
              <div className="card-body position-relative z-index-1 p-3">
                <i className="fas fa-wifi text-white p-2" />
                <h5 className="text-white mt-4 mb-5 pb-2">4562   1122   4594   7852</h5>
                <div className="d-flex">
                  <div className="d-flex">
                    <div className="me-4">
                      <p className="text-white text-sm opacity-8 mb-0">Card Holder</p>
                      <h6 className="text-white mb-0">Jack Peterson</h6>
                    </div>
                    <div>
                      <p className="text-white text-sm opacity-8 mb-0">Expires</p>
                      <h6 className="text-white mb-0">11/22</h6>
                    </div>
                  </div>
                  <div className="ms-auto w-20 d-flex align-items-end justify-content-end">
                    <img className="w-60 mt-2" src="/assets/img/logos/mastercard.png" alt="Mastercard" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-6">
          <div className="row">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header mx-4 p-3 text-center">
                  <div className="icon icon-shape icon-lg bg-gradient-primary shadow text-center border-radius-lg">
                    <i className="fas fa-landmark opacity-10" />
                  </div>
                </div>
                <div className="card-body pt-0 p-3 text-center">
                  <h6 className="text-center mb-0">Salary</h6>
                  <span className="text-xs">Belong Interactive</span>
                  <hr className="horizontal dark my-3" />
                  <h5 className="mb-0">+$2000</h5>
                </div>
              </div>
            </div>
            <div className="col-md-6 mt-md-0 mt-4">
              <div className="card">
                <div className="card-header mx-4 p-3 text-center">
                  <div className="icon icon-shape icon-lg bg-gradient-primary shadow text-center border-radius-lg">
                    <i className="fab fa-paypal opacity-10" />
                  </div>
                </div>
                <div className="card-body pt-0 p-3 text-center">
                  <h6 className="text-center mb-0">Paypal</h6>
                  <span className="text-xs">Freelance Payment</span>
                  <hr className="horizontal dark my-3" />
                  <h5 className="mb-0">$455.00</h5>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-12 mb-lg-0 mb-4">
          <div className="card mt-4">
            <div className="card-header pb-0 p-3">
              <div className="row">
                <div className="col-6 d-flex align-items-center">
                  <h6 className="mb-0">Payment Method</h6>
                </div>
                <div className="col-6 text-end">
                  <button type="button" className="btn bg-gradient-dark mb-0">
                    <i className="fas fa-plus" />
                    &nbsp;&nbsp;Add New Card
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body p-3">
              <div className="row">
                {PAYMENT_METHODS.map((method, index) => (
                  <div key={method.brand} className={`col-md-6${index === 0 ? " mb-md-0 mb-4" : ""}`}>
                    <div className="card card-body border card-plain border-radius-lg d-flex align-items-center flex-row">
                      <img className="w-10 me-3 mb-0" src={method.image} alt={method.brand} />
                      <h6 className="mb-0">{method.number}</h6>
                      <i className="fas fa-pencil-alt ms-auto text-dark cursor-pointer" title="Edit Card" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingInvoices() {
  return (
    <div className="col-lg-4">
      <div className="card h-100">
        <div className="card-header pb-0 p-3">
          <div className="row">
            <div className="col-6 d-flex align-items-center">
              <h6 className="mb-0">Invoices</h6>
            </div>
            <div className="col-6 text-end">
              <button type="button" className="btn btn-outline-primary btn-sm mb-0">
                View All
              </button>
            </div>
          </div>
        </div>
        <div className="card-body p-3 pb-0">
          <ul className="list-group">
            {INVOICES.map((invoice, index) => (
              <li
                key={invoice.code}
                className={`list-group-item border-0 d-flex justify-content-between ps-0 border-radius-lg${index < INVOICES.length - 1 ? " mb-2" : ""}`}
              >
                <div className="d-flex flex-column">
                  <h6 className="mb-1 text-dark font-weight-bold text-sm">{invoice.date}</h6>
                  <span className="text-xs">{invoice.code}</span>
                </div>
                <div className="d-flex align-items-center text-sm">
                  {invoice.amount}
                  <button type="button" className="btn btn-link text-dark text-sm mb-0 px-0 ms-4">
                    <i className="fas fa-file-pdf text-lg me-1" />
                    PDF
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function BillingInformation() {
  return (
    <div className="col-md-7 mt-4">
      <div className="card">
        <div className="card-header pb-0 px-3">
          <h6 className="mb-0">Billing Information</h6>
        </div>
        <div className="card-body pt-4 p-3">
          <ul className="list-group">
            {BILLING_INFORMATION.map((entry, index) => (
              <li
                key={entry.email}
                className={`list-group-item border-0 d-flex p-4 bg-gray-100 border-radius-lg${index === 0 ? " mb-2" : " mb-2 mt-3"}`}
              >
                <div className="d-flex flex-column">
                  <h6 className="mb-3 text-sm">{entry.name}</h6>
                  <span className="mb-2 text-xs">
                    Company Name:
                    <span className="text-dark font-weight-bold ms-sm-2">{entry.company}</span>
                  </span>
                  <span className="mb-2 text-xs">
                    Email Address:
                    <span className="text-dark ms-sm-2 font-weight-bold">{entry.email}</span>
                  </span>
                  <span className="text-xs">
                    VAT Number:
                    <span className="text-dark ms-sm-2 font-weight-bold">{entry.vatNumber}</span>
                  </span>
                </div>
                <div className="ms-auto text-end">
                  <button type="button" className="btn btn-link text-danger text-gradient px-3 mb-0">
                    <i className="far fa-trash-alt me-2" />
                    Delete
                  </button>
                  <button type="button" className="btn btn-link text-dark px-3 mb-0">
                    <i className="fas fa-pencil-alt text-dark me-2" aria-hidden="true" />
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function TransactionList({ title, items }) {
  return (
    <>
      <h6 className="text-uppercase text-body text-xs font-weight-bolder mb-3">{title}</h6>
      <ul className="list-group">
        {items.map((item, index) => (
          <li
            key={`${title}-${item.name}`}
            className={`list-group-item border-0 d-flex justify-content-between ps-0 border-radius-lg${index < items.length - 1 ? " mb-2" : ""}`}
          >
            <div className="d-flex align-items-center">
              <button
                type="button"
                className={`btn btn-icon-only btn-rounded ${item.buttonClassName} mb-0 me-3 btn-sm d-flex align-items-center justify-content-center`}
              >
                <i className={item.icon} />
              </button>
              <div className="d-flex flex-column">
                <h6 className="mb-1 text-dark text-sm">{item.name}</h6>
                <span className="text-xs">{item.time}</span>
              </div>
            </div>
            <div className={`d-flex align-items-center text-sm font-weight-bold ${item.amountClassName}`}>
              {item.amount}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function BillingTransactions() {
  return (
    <div className="col-md-5 mt-4">
      <div className="card h-100 mb-4">
        <div className="card-header pb-0 px-3">
          <div className="row">
            <div className="col-md-6">
              <h6 className="mb-0">Your Transaction&apos;s</h6>
            </div>
            <div className="col-md-6 d-flex justify-content-end align-items-center">
              <i className="far fa-calendar-alt me-2" />
              <small>23 - 30 March 2020</small>
            </div>
          </div>
        </div>
        <div className="card-body pt-4 p-3">
          <TransactionList title="Newest" items={TRANSACTIONS.newest} />
          <h6 className="text-uppercase text-body text-xs font-weight-bolder my-3">Yesterday</h6>
          <ul className="list-group">
            {TRANSACTIONS.yesterday.map((item, index) => (
              <li
                key={item.name}
                className={`list-group-item border-0 d-flex justify-content-between ps-0 border-radius-lg${index < TRANSACTIONS.yesterday.length - 1 ? " mb-2" : ""}`}
              >
                <div className="d-flex align-items-center">
                  <button
                    type="button"
                    className={`btn btn-icon-only btn-rounded ${item.buttonClassName} mb-0 me-3 btn-sm d-flex align-items-center justify-content-center`}
                  >
                    <i className={item.icon} />
                  </button>
                  <div className="d-flex flex-column">
                    <h6 className="mb-1 text-dark text-sm">{item.name}</h6>
                    <span className="text-xs">{item.time}</span>
                  </div>
                </div>
                <div className={`d-flex align-items-center text-sm font-weight-bold ${item.amountClassName}`}>
                  {item.amount}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <ArgonPage pageTitle="Billing" activeRoute="billing">
      <div className="container-fluid py-4">
        <div className="row">
          <BillingOverview />
          <BillingInvoices />
        </div>
        <div className="row">
          <BillingInformation />
          <BillingTransactions />
        </div>
        <ArgonFooter />
      </div>
    </ArgonPage>
  );
}
