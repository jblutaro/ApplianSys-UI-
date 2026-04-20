import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type AdminSettings = {
  siteName: string;
  supportEmail: string;
  description: string;
  currency: string;
  taxRate: number;
  maintenanceMode: boolean;
  orderNotifications: boolean;
  emailCampaigns: boolean;
};

const DEFAULT_SETTINGS: AdminSettings = {
  siteName: "ApplianSys",
  supportEmail: "support@appliansys.com",
  description: "Premium appliances for every household.",
  currency: "PHP (PHP)",
  taxRate: 8.5,
  maintenanceMode: false,
  orderNotifications: true,
  emailCampaigns: true,
};

const settingsDir = path.resolve(process.cwd(), "data");
const settingsPath = path.join(settingsDir, "admin-settings.json");

async function ensureSettingsFile() {
  await mkdir(settingsDir, { recursive: true });

  try {
    await readFile(settingsPath, "utf8");
  } catch {
    await writeFile(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf8");
  }
}

export async function readAdminSettings() {
  await ensureSettingsFile();
  const file = await readFile(settingsPath, "utf8");
  return JSON.parse(file) as AdminSettings;
}

export async function writeAdminSettings(settings: AdminSettings) {
  await ensureSettingsFile();
  await writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf8");
  return settings;
}
