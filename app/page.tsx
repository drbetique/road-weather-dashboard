import { redirect } from "next/navigation";

/**
 * Landing route.
 *
 * The dashboard lives solely in app/dashboard/page.tsx. This file previously
 * held a near-identical copy of it, which had already drifted (the two
 * versions read different fields off the recommendation payload).
 *
 * middleware.ts intercepts "/" and redirects authenticated users to
 * /dashboard before this renders, so reaching this point means there is no
 * valid session: send the visitor to the login page. Redirecting to
 * /dashboard instead would bounce back here via the middleware and loop.
 */
export default function Home() {
  redirect("/login");
}
