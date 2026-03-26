import SignInPage from "../../components/auth/sign-in-page.jsx";

export const metadata = {
  title: "Sign In"
};

export default async function SignInRoute({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const nextPath = typeof resolvedSearchParams?.next === "string"
    ? resolvedSearchParams.next
    : "/dashboard";

  return <SignInPage nextPath={nextPath} />;
}
