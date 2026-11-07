import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/components/account/AccountPage";

export const Route = createFileRoute("/account/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  return <AccountPage tab="notifications" />;
}
