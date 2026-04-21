import type { AdminSettings } from "../lib/adminApi";

type SettingsSectionProps = {
  isSaving: boolean;
  onSave: () => void;
  setSettings: (value: AdminSettings) => void;
  settings: AdminSettings;
};

export function SettingsSection({
  isSaving,
  onSave,
  setSettings,
  settings,
}: SettingsSectionProps) {
  return (
    <section className="admin-settings-grid">
      <article className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">Platform Settings</h2>
            <p className="admin-card__sub">Configure global application settings and preferences.</p>
          </div>
        </div>

        <div className="admin-form-grid">
          <div className="admin-field">
            <label htmlFor="site-name">Site Name</label>
            <input
              id="site-name"
              className="admin-input"
              value={settings.siteName}
              onChange={(event) => setSettings({ ...settings, siteName: event.target.value })}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="support-email">Support Email</label>
            <input
              id="support-email"
              className="admin-input"
              type="email"
              value={settings.supportEmail}
              onChange={(event) => setSettings({ ...settings, supportEmail: event.target.value })}
            />
          </div>

          <div className="admin-field--full">
            <label htmlFor="site-description">Site Description</label>
            <textarea
              id="site-description"
              className="admin-textarea"
              value={settings.description}
              onChange={(event) => setSettings({ ...settings, description: event.target.value })}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="currency">Default Currency</label>
            <input
              id="currency"
              className="admin-input"
              value={settings.currency}
              onChange={(event) => setSettings({ ...settings, currency: event.target.value })}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="tax-rate">Base Tax Rate (%)</label>
            <input
              id="tax-rate"
              className="admin-input"
              type="number"
              min="0"
              step="0.1"
              value={settings.taxRate}
              onChange={(event) => setSettings({ ...settings, taxRate: Number(event.target.value) })}
            />
          </div>
        </div>

        <button type="button" className="admin-primary-btn" onClick={onSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </article>

      <article className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">System Preferences</h2>
            <p className="admin-card__sub">Feature flags that alter how the platform behaves.</p>
          </div>
        </div>

        <div className="admin-toggle-list">
          {[
            {
              key: "maintenanceMode",
              title: "Enable Maintenance Mode",
              body: "Temporarily pause storefront activity while you update the platform.",
            },
            {
              key: "orderNotifications",
              title: "New Order Notifications",
              body: "Keep admins informed when new orders come in.",
            },
            {
              key: "emailCampaigns",
              title: "Enable Email Campaigns",
              body: "Allow scheduled promotional email pushes from the platform.",
            },
          ].map((item) => {
            const value = settings[item.key as keyof AdminSettings] as boolean;
            return (
              <div key={item.key} className="admin-toggle">
                <div className="admin-toggle__text">
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </div>
                <button
                  type="button"
                  className={`admin-switch${value ? " admin-switch--on" : ""}`}
                  aria-pressed={value}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      [item.key]: !value,
                    })
                  }
                />
              </div>
            );
          })}
        </div>

        <div className="admin-note">
          Important warning: enabling maintenance mode will log out storefront users and hide
          checkout actions until it is turned off again.
        </div>
      </article>
    </section>
  );
}
