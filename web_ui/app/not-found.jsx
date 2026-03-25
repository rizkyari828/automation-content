export default function NotFound() {
  return (
    <main className="main-content mt-0">
      <section className="min-vh-100 d-flex align-items-center bg-gray-100">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6 text-center">
              <div className="card shadow-lg border-0">
                <div className="card-body p-5">
                  <h1 className="display-1 text-gradient text-primary">404</h1>
                  <h3 className="mb-3">Route not found</h3>
                  <p className="text-sm mb-4">
                    This UI shell only exposes the migrated dashboard routes.
                  </p>
                  <a href="/dashboard" className="btn btn-primary">
                    Back to dashboard
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
