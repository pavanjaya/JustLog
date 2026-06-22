import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const NOTIF_ID = 1001;
const STORAGE_KEY = "jl_reminder";

export type ReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export function loadReminderSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: false, hour: 21, minute: 0 };
}

export function saveReminderSettings(s: ReminderSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const { display } = await LocalNotifications.requestPermissions();
  return display === "granted";
}

export async function scheduleReminder(hour: number, minute: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] });
  await LocalNotifications.schedule({
    notifications: [
      {
        id: NOTIF_ID,
        title: "JustLog 📝",
        body: "Don't forget to log your expenses today!",
        schedule: {
          on: { hour, minute },
          repeats: true,
          allowWhileIdle: true,
        },
        sound: undefined,
        smallIcon: "ic_stat_icon_config_sample",
      },
    ],
  });
}

export async function cancelReminder(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] });
}
