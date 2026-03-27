import SignUpPage from "../../components/auth/sign-up-page.jsx";

export const metadata = {
  title: "Create Workspace"
};

export default async function SignUpRoute({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const initialError = typeof resolvedSearchParams?.error === "string"
    ? resolvedSearchParams.error
    : "";

  return <SignUpPage initialError={initialError} />;
}
