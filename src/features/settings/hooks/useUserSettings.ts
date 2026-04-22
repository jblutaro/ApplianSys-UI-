import { useEffect, useState } from "react";
import type { AppUser } from "@/shared/lib/auth";

export type PreferredCategory =
  | "Kitchen"
  | "Laundry"
  | "Cooling"
  | "Entertainment"
  | "Cleaning";

export type BudgetRange = "Any" | "Budget" | "Mid-range" | "Premium";

export type UserSettings = {
  budgetRange: BudgetRange;
  marketingEmails: boolean;
  orderUpdates: boolean;
  preferredCategory: PreferredCategory;
  restockAlerts: boolean;
  wishlistReminders: boolean;
};

const DEFAULT_SETTINGS: UserSettings = {
  budgetRange: "Any",
  marketingEmails: true,
  orderUpdates: true,
  preferredCategory: "Kitchen",
  restockAlerts: true,
  wishlistReminders: false,
};

function getStorageKey(accountId: string) {
  return `appliansys:user-settings:${accountId}`;
}

export function useUserSettings(user: AppUser | null) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      return;
    }

    try {
      const raw = window.localStorage.getItem(getStorageKey(user.accountId));
      if (!raw) {
        setSettings(DEFAULT_SETTINGS);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<UserSettings>;
      setSettings({ ...DEFAULT_SETTINGS, ...parsed });
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    window.localStorage.setItem(getStorageKey(user.accountId), JSON.stringify(settings));
  }, [settings, user]);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    resetSettings,
    settings,
    updateSetting,
  };
}
