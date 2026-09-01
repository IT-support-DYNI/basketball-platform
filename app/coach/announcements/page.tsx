import { redirect } from "next/navigation";

/** Announcements moved to the shared /announcements surface (W7). */
export default function CoachAnnouncementsRedirect() {
  redirect("/announcements");
}
