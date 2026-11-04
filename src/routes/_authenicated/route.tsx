import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getSession } from "@/lib/auth/functions";

// Component Layout Wrapper for authenticated pages

export const Route = createFileRoute("/_authenicated")({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    return { user: session.user };
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
