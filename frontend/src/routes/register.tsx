import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/register")({
  component: () => null,
  beforeLoad: () => {
    throw redirect({ to: "/login", search: { mode: "register" } });
  },
});
