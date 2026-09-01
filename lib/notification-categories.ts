import type { NotificationCategory, NotificationType } from "@prisma/client";

/** Client-safe: no DB import. `lib/notifications.ts` re-exports these. */

export const CATEGORY_FOR_TYPE: Record<NotificationType, NotificationCategory> = {
  TRAINING_CHANGE: "SCHEDULE",
  NEW_VIDEO: "VIDEOS",
  NEW_EVALUATION: "PERFORMANCE",
  NEW_FEEDBACK: "PERFORMANCE",
  ANNOUNCEMENT: "ANNOUNCEMENTS",
  REGISTRATION_UPDATE: "REGISTRATION",
};

export const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  SCHEDULE: "Schedule & RSVPs",
  ANNOUNCEMENTS: "Announcements",
  PERFORMANCE: "Evaluations & feedback",
  VIDEOS: "Training videos",
  REGISTRATION: "Registration updates",
  MESSAGES: "Messages",
};

export const NOTIFICATION_CATEGORIES = Object.keys(CATEGORY_LABEL) as NotificationCategory[];

export const CATEGORY_DEFAULTS: Record<NotificationCategory, { email: boolean; push: boolean }> = {
  SCHEDULE: { email: false, push: true },
  ANNOUNCEMENTS: { email: false, push: true },
  PERFORMANCE: { email: false, push: true },
  VIDEOS: { email: false, push: false },
  REGISTRATION: { email: false, push: true },
  MESSAGES: { email: false, push: true },
};
