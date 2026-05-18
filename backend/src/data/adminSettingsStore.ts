import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type AdminSettings = {
  siteName: string;
  supportEmail: string;
  description: string;
  currency: string;
  baseDeliveryFee: number;
  deliveryRatePerKm: number;
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
  baseDeliveryFee: 50,
  deliveryRatePerKm: 7.51,
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
  return { ...DEFAULT_SETTINGS, ...(JSON.parse(file) as Partial<AdminSettings>) };
}

export async function writeAdminSettings(settings: AdminSettings) {
  await ensureSettingsFile();
  const nextSettings = {
    ...DEFAULT_SETTINGS,
    ...settings,
    baseDeliveryFee: Number.isFinite(Number(settings.baseDeliveryFee))
      ? Math.max(0, Number(settings.baseDeliveryFee))
      : DEFAULT_SETTINGS.baseDeliveryFee,
    deliveryRatePerKm: Number.isFinite(Number(settings.deliveryRatePerKm))
      ? Math.max(0, Number(settings.deliveryRatePerKm))
      : DEFAULT_SETTINGS.deliveryRatePerKm,
  };
  await writeFile(settingsPath, JSON.stringify(nextSettings, null, 2), "utf8");
  return nextSettings;
}
