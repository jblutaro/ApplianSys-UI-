import "@/shared/styles/Admin.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { AppUser } from "@/shared/lib/auth";
import { AdminAccessState } from "../components/AdminAccessState";
import { AdminAccountSection } from "../components/AdminAccountSection";
import { DashboardSection } from "../components/DashboardSection";
import { OrdersSection } from "../components/OrdersSection";
import { ProductsSection } from "../components/ProductsSection";
import { SettingsSection } from "../components/SettingsSection";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import { isAdminUser } from "../lib/adminAccess";
import { NAV_ITEMS, type AdminSection } from "../lib/adminConstants";
import { downloadExcelReport } from "../lib/adminUtils";

type AdminPageProps = {
  user: AppUser | null;
  onAuthOpen: () => void;
};

function getNavItems(user: AppUser) {
  if (user.role === "staff") {
    return NAV_ITEMS.filter((item) => item.key !== "platform");
  }

  return NAV_ITEMS;
}

function getSection(sectionParam: string | null, navItems: typeof NAV_ITEMS): AdminSection {
  return navItems.some((item) => item.key === sectionParam)
    ? (sectionParam as AdminSection)
    : "dashboard";
}

function renderSectionContent({
  section,
  state,
  user,
}: {
  section: AdminSection;
  state: ReturnType<typeof useAdminDashboard>;
  user: AppUser;
}) {
  switch (section) {
    case "products":
      return (
        <ProductsSection
          products={state.products}
          categories={state.categories}
          categoryDraft={state.categoryDraft}
          draft={state.productDraft}
          setDraft={state.setProductDraft}
          setCategoryDraft={state.setCategoryDraft}
          onAddProduct={state.handleAddProduct}
          onAddCategory={state.handleAddCategory}
          onAddSubSubcategory={state.handleAddSubSubcategory}
          onCancelEdit={state.handleCancelEditProduct}
          onDeleteProduct={state.handleDeleteProduct}
          onDeleteSubcategory={state.handleDeleteSubcategory}
          onDeleteSubSubcategory={state.handleDeleteSubSubcategory}
          onEditProduct={state.handleEditProduct}
          isEditing={state.editingProductId !== null}
          canManageCategories={user.role === "admin"}
        />
      );
    case "orders":
      return (
        <OrdersSection
          orders={state.orders}
          onChangeStatus={state.handleOrderStatusChange}
        />
      );
    case "platform":
      return (
        <SettingsSection
          settings={state.settings}
          setSettings={state.setSettings}
          onSave={state.handleSaveSettings}
          isSaving={state.isSavingSettings}
        />
      );
    case "settings":
      return <AdminAccountSection enabled />;
    case "dashboard":
    default:
      return (
        <DashboardSection
          orders={state.orders}
          products={state.products}
          period={state.period}
          setPeriod={state.setPeriod}
          revenueOverTime={state.revenueOverTime}
          reportRows={state.reportRows}
        />
      );
  }
}

function AdminPage({ user, onAuthOpen }: AdminPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAllowed = isAdminUser(user);

  const state = useAdminDashboard({
    enabled: Boolean(user && isAllowed),
  });

  if (!user) {
    return (
      <AdminAccessState
        title="Panel sign-in required"
        body="Sign in with your admin or staff account to manage products, orders, reports, and controls."
        actionLabel="Sign in"
        onAction={onAuthOpen}
        showBackLink
      />
    );
  }

  if (!isAllowed) {
    return (
      <AdminAccessState
        title="Admin or staff access only"
        body={
          <>
            Your current account is signed in, but it is not marked as admin or staff. Add the email to
            <code> VITE_ADMIN_EMAILS </code>
            or use an email that starts with <code>admin</code>.
          </>
        }
        actionLabel="Return home"
        onAction={() => {
          void navigate("/");
        }}
      />
    );
  }

  const navItems = getNavItems(user);
  const section = getSection(searchParams.get("section"), navItems);
  const currentSectionLabel =
    navItems.find((item) => item.key === section)?.label ?? "Dashboard";

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__top">
          <div className="admin-brand">
            <h1 className="admin-brand__title">ApplianSys Panel</h1>
            <span className="admin-brand__text">
              Control the storefront, orders, products, and account tools.
            </span>
          </div>

          <nav className="admin-sidebar__nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`admin-sidebar__link${section === item.key ? " admin-sidebar__link--active" : ""}`}
                onClick={() => setSearchParams({ section: item.key })}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <span className="admin-sidebar__user-label">Signed in as</span>
            <span className="admin-sidebar__user-value">{user.email}</span>
          </div>

          <Link to="/" className="admin-sidebar__back">
            Back to Storefront
          </Link>
        </div>
      </aside>

      <main className="admin-content">
        <header className="admin-toolbar">
          <div>
            <h1 className="admin-toolbar__title">{currentSectionLabel}</h1>
            <p className="admin-toolbar__sub">
              Management tools for shaping the live ApplianSys storefront.
            </p>
          </div>

          <div className="admin-toolbar__actions">
            <span className="admin-chip">
              {state.settings.maintenanceMode ? "Maintenance mode on" : "Storefront live"}
            </span>
            {section === "dashboard" ? (
              <button
                type="button"
                className="admin-primary-btn"
                onClick={() =>
                  downloadExcelReport(state.period, state.orders, state.reportRows)
                }
              >
                Export Excel Report
              </button>
            ) : null}
          </div>
        </header>

        {state.errorMessage ? (
          <div className="admin-note" style={{ marginBottom: 18 }}>
            {state.errorMessage}
          </div>
        ) : null}

        {state.isLoading ? (
          <div className="admin-note" style={{ marginBottom: 18 }}>
            Loading admin data...
          </div>
        ) : null}

        {renderSectionContent({ section, state, user })}
      </main>
    </div>
  );
}

export default AdminPage;
