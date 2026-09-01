import { redirect } from "next/navigation";

/** Notifications moved to the shared /notifications surface (W7). */
export default function PlayerNotificationsRedirect() {
  redirect("/notifications");
}
