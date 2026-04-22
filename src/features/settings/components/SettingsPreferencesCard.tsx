import type {
  BudgetRange,
  PreferredCategory,
  UserSettings,
} from "@/features/settings/hooks/useUserSettings";

type SettingsPreferencesCardProps = {
  onReset: () => void;
  onUpdateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  settings: UserSettings;
};

type SettingsToggleRowProps = {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
};

const CATEGORY_OPTIONS: PreferredCategory[] = [
  "Kitchen",
  "Laundry",
  "Cooling",
  "Entertainment",
  "Cleaning",
];

const BUDGET_OPTIONS: BudgetRange[] = [
  "Any",
  "Budget",
  "Mid-range",
  "Premium",
];

function SettingsToggleRow({
  checked,
  description,
  label,
  onChange,
}: SettingsToggleRowProps) {
  return (
    <label className="settings-toggle">
      <span className="settings-toggle__content">
        <span className="settings-toggle__label">{label}</span>
        <span className="settings-toggle__description">{description}</span>
      </span>
      <span className="settings-toggle__control">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="settings-toggle__track" aria-hidden />
      </span>
    </label>
  );
}

export function SettingsPreferencesCard({
  onReset,
  onUpdateSetting,
  settings,
}: SettingsPreferencesCardProps) {
  return (
    <section className="settings-card">
      <div className="settings-card__header">
        <span className="settings-card__eyebrow">Preferences</span>
        <h2 className="settings-card__title">Notifications and shopping defaults</h2>
      </div>

      <p className="settings-card__note">
        These settings are currently saved in this browser for your signed-in account.
      </p>

      <div className="settings-preferences__group">
        <h3 className="settings-preferences__heading">Alerts</h3>
        <SettingsToggleRow
          checked={settings.orderUpdates}
          description="Receive order progress updates and delivery reminders."
          label="Order updates"
          onChange={(value) => onUpdateSetting("orderUpdates", value)}
        />
        <SettingsToggleRow
          checked={settings.restockAlerts}
          description="Get notified when saved appliances are back in stock."
          label="Restock alerts"
          onChange={(value) => onUpdateSetting("restockAlerts", value)}
        />
        <SettingsToggleRow
          checked={settings.wishlistReminders}
          description="Occasional reminders for items you have been eyeing."
          label="Wishlist reminders"
          onChange={(value) => onUpdateSetting("wishlistReminders", value)}
        />
        <SettingsToggleRow
          checked={settings.marketingEmails}
          description="Promotions, seasonal sales, and new product highlights."
          label="Marketing emails"
          onChange={(value) => onUpdateSetting("marketingEmails", value)}
        />
      </div>

      <div className="settings-preferences__grid">
        <label className="settings-field">
          <span className="settings-field__label">Preferred category</span>
          <select
            className="settings-field__input"
            value={settings.preferredCategory}
            onChange={(event) =>
              onUpdateSetting("preferredCategory", event.target.value as PreferredCategory)
            }
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="settings-field">
          <span className="settings-field__label">Budget focus</span>
          <select
            className="settings-field__input"
            value={settings.budgetRange}
            onChange={(event) =>
              onUpdateSetting("budgetRange", event.target.value as BudgetRange)
            }
          >
            {BUDGET_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="settings-preferences__footer">
        <button type="button" className="settings-reset-button" onClick={onReset}>
          Reset to defaults
        </button>
      </div>
    </section>
  );
}
