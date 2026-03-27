"use client";

import { useWebMessages } from "../i18n/web-locale.jsx";
import ArgonPage, { ArgonFooter } from "../layout/argon-page.jsx";

function PlanSummary({ copy }) {
  return (
    <div className="col-lg-7 mb-lg-0 mb-4">
      <div
        className="card h-100 shadow-xl border-0 cf-premium-card"
        style={{
          background:
            "linear-gradient(135deg, #123a55 0%, #168391 58%, #e9a05e 100%)"
        }}
      >
        <div className="card-body p-4 text-white">
          <p className="text-xs text-uppercase mb-2 opacity-8" style={{ letterSpacing: "0.16em" }}>
            {copy.planEyebrow}
          </p>
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
            <div>
              <h4 className="text-white mb-1">{copy.planName}</h4>
              <p className="mb-0 opacity-8">{copy.planNote}</p>
            </div>
            <span className="badge bg-white text-dark px-3 py-2">{copy.planStatus}</span>
          </div>

          <div className="row g-4">
            {copy.kpis.map((item) => (
              <div className="col-sm-4" key={item.label}>
                <div
                  className="border-radius-lg p-3 h-100"
                  style={{
                    background: "rgba(255, 255, 255, 0.14)",
                    border: "1px solid rgba(255, 255, 255, 0.2)"
                  }}
                >
                  <p className="text-xs text-uppercase mb-1 opacity-8" style={{ letterSpacing: "0.12em" }}>
                    {item.label}
                  </p>
                  <h5 className="text-white mb-1">{item.value}</h5>
                  <p className="text-sm mb-0 opacity-8">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RenewalCard({ copy }) {
  return (
    <div className="col-lg-5">
      <div className="card h-100 cf-surface-card">
        <div className="card-header pb-0 p-3">
          <h6 className="mb-1">{copy.renewalTitle}</h6>
          <p className="text-sm mb-0">{copy.renewalBody}</p>
        </div>
        <div className="card-body p-3 d-flex flex-column">
          <div className="d-flex align-items-center justify-content-between border-radius-lg bg-gray-100 px-3 py-3 mb-3">
            <div>
              <p className="text-xs text-uppercase text-secondary mb-1">{copy.nextChargeLabel}</p>
              <h5 className="mb-0">{copy.nextChargeValue}</h5>
            </div>
            <span className="badge bg-gradient-success">{copy.nextChargeBadge}</span>
          </div>
          <ul className="list-group mb-3">
            {copy.renewalHighlights.map((item) => (
              <li key={item} className="list-group-item border-0 px-0 py-2 text-sm text-secondary">
                <i className="ni ni-check-bold text-success me-2" />
                {item}
              </li>
            ))}
          </ul>
          <button type="button" className="btn bg-gradient-dark mt-auto mb-0">
            {copy.managePlanCta}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentMethods({ copy }) {
  return (
    <div className="col-lg-6">
      <div className="card h-100 cf-surface-card">
        <div className="card-header pb-0 p-3">
          <h6 className="mb-1">{copy.paymentTitle}</h6>
          <p className="text-sm mb-0">{copy.paymentBody}</p>
        </div>
        <div className="card-body p-3">
          <div className="list-group list-group-flush">
            {copy.paymentMethods.map((method) => (
              <div key={method.name} className="list-group-item border-0 px-0 py-3">
                <div className="d-flex justify-content-between gap-3">
                  <div className="d-flex">
                    <div
                      className="icon icon-shape icon-sm border-radius-md text-center me-3"
                      style={{ background: method.iconBackground }}
                    >
                      <i className={`${method.icon} text-sm`} style={{ color: method.iconColor }} />
                    </div>
                    <div>
                      <h6 className="mb-1 text-sm">{method.name}</h6>
                      <p className="text-xs text-secondary mb-1">{method.detail}</p>
                      <p className="text-xs mb-0">{method.note}</p>
                    </div>
                  </div>
                  <span className={`badge creatorflow-payment-badge ${method.badgeClass}`}>{method.badge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Invoices({ copy }) {
  return (
    <div className="col-lg-6">
      <div className="card h-100 cf-surface-card">
        <div className="card-header pb-0 p-3">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h6 className="mb-1">{copy.invoicesTitle}</h6>
              <p className="text-sm mb-0">{copy.invoicesBody}</p>
            </div>
            <button type="button" className="btn btn-outline-dark btn-sm mb-0">
              {copy.viewInvoicesCta}
            </button>
          </div>
        </div>
        <div className="card-body p-3">
          <ul className="list-group">
            {copy.invoices.map((invoice, index) => (
              <li
                key={invoice.code}
                className={`list-group-item border-0 d-flex justify-content-between align-items-start px-0${index < copy.invoices.length - 1 ? " mb-3" : ""}`}
              >
                <div>
                  <h6 className="mb-1 text-sm">{invoice.period}</h6>
                  <p className="text-xs text-secondary mb-0">{invoice.code}</p>
                </div>
                <div className="text-end">
                  <h6 className="mb-1 text-sm">{invoice.amount}</h6>
                  <p className="text-xs text-secondary mb-0">{invoice.status}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SeatManagement({ copy }) {
  return (
    <div className="col-lg-7">
      <div className="card h-100 cf-surface-card">
        <div className="card-header pb-0 p-3">
          <h6 className="mb-1">{copy.seatTitle}</h6>
          <p className="text-sm mb-0">{copy.seatBody}</p>
        </div>
        <div className="card-body p-3">
          <div className="table-responsive">
            <table className="table align-items-center mb-0">
              <thead>
                <tr>
                  <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                    {copy.seatTableLabels.member}
                  </th>
                  <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">
                    {copy.seatTableLabels.role}
                  </th>
                  <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-2">
                    {copy.seatTableLabels.usage}
                  </th>
                  <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                    {copy.seatTableLabels.status}
                  </th>
                </tr>
              </thead>
              <tbody>
                {copy.seats.map((seat) => (
                  <tr key={seat.member}>
                    <td>
                      <h6 className="mb-0 text-sm">{seat.member}</h6>
                      <p className="text-xs text-secondary mb-0">{seat.email}</p>
                    </td>
                    <td>
                      <span className="text-xs font-weight-bold">{seat.role}</span>
                    </td>
                    <td>
                      <span className="text-xs text-secondary">{seat.usage}</span>
                    </td>
                    <td className="align-middle text-center">
                      <span className={`badge badge-sm ${seat.statusClass}`}>{seat.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Transactions({ copy }) {
  return (
    <div className="col-lg-5">
      <div className="card h-100 cf-surface-card">
        <div className="card-header pb-0 p-3">
          <h6 className="mb-1">{copy.transactionsTitle}</h6>
          <p className="text-sm mb-0">{copy.transactionsBody}</p>
        </div>
        <div className="card-body p-3">
          <ul className="list-group">
            {copy.transactions.map((item, index) => (
              <li
                key={item.title}
                className={`list-group-item border-0 d-flex justify-content-between align-items-start px-0${index < copy.transactions.length - 1 ? " mb-3" : ""}`}
              >
                <div>
                  <h6 className="text-sm mb-1">{item.title}</h6>
                  <p className="text-xs text-secondary mb-0">{item.time}</p>
                </div>
                <div className="text-end">
                  <h6 className={`text-sm mb-1 ${item.amountClass}`}>{item.amount}</h6>
                  <p className="text-xs text-secondary mb-0">{item.note}</p>
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
  const copy = useWebMessages().web.billingPage;

  return (
    <ArgonPage pageTitle={copy.pageTitle} activeRoute="billing">
      <div className="container-fluid py-4 cf-internal-page cf-billing-page">
        <div className="row g-4">
          <PlanSummary copy={copy} />
          <RenewalCard copy={copy} />
        </div>
        <div className="row g-4 mt-2">
          <PaymentMethods copy={copy} />
          <Invoices copy={copy} />
        </div>
        <div className="row g-4 mt-2">
          <SeatManagement copy={copy} />
          <Transactions copy={copy} />
        </div>
        <ArgonFooter />
      </div>
    </ArgonPage>
  );
}
