import "@/shared/styles/Admin.css";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { AppUser } from "@/shared/lib/auth";
import { AdminAccessState } from "../components/AdminAccessState";
import { AdminAccountSection } from "../components/AdminAccountSection";
import { CategoryManagerModal } from "../components/CategoryManagerModal";
import { CreateProductModal } from "../components/CreateProductModal";
import { DashboardSection } from "../components/DashboardSection";
import { OrdersSection } from "../components/OrdersSection";
import { ProductsSection } from "../components/ProductsSection";
import { SettingsSection } from "../components/SettingsSection";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import { isAdminUser } from "../lib/adminAccess";
import { NAV_ITEMS, type AdminSection } from "../lib/adminConstants";

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
  onEditProduct,
}: {
  section: AdminSection;
  state: ReturnType<typeof useAdminDashboard>;
  onEditProduct: (id: string) => void;
}) {
  switch (section) {
    case "products":
      return (
        <ProductsSection
          products={state.products}
          categories={state.categories}
          onDeleteProduct={state.handleDeleteProduct}
          onEditProduct={onEditProduct}
        />
      );
    case "orders":
      return (
        <OrdersSection
          mode="active"
          orders={state.orders}
          onChangeStatus={state.handleOrderStatusChange}
          isReleasing={state.isReleasingPickup}
          pickupOrders={state.pickupReleaseOrders}
          onReleaseOrder={state.handleReleasePickupOrder}
        />
      );
    case "orderArchives":
      return (
        <OrdersSection
          mode="archive"
          orders={state.orders}
          onChangeStatus={state.handleOrderStatusChange}
          isReleasing={state.isReleasingPickup}
          pickupOrders={state.pickupReleaseOrders}
          onReleaseOrder={state.handleReleasePickupOrder}
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
          itemSalesRows={state.itemSalesRows}
        />
      );
  }
}

function AdminPage({ user, onAuthOpen }: AdminPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const isAllowed = isAdminUser(user);

  const state = useAdminDashboard({    enabled: Boolean(user && isAllowed),
  });
  const navItems = user ? getNavItems(user) : NAV_ITEMS;
  const section = getSection(searchParams.get("section"), navItems);
  const currentSectionLabel =
    navItems.find((item) => item.key === section)?.label ?? "Dashboard";
  const editProductId = searchParams.get("edit");

  /* eslint-disable react-hooks/set-state-in-effect -- syncs ?edit= URL state into the product modal. */
  useEffect(() => {
    if (editProductId && section === "products" && !isProductModalOpen && !state.isLoading && state.products.length > 0) {
      state.handleEditProduct(editProductId);
      setIsProductModalOpen(true);
      // Clear the edit param from URL to prevent re-triggering
      setSearchParams({ section: "products" });
    }
  }, [editProductId, section, isProductModalOpen, state.isLoading, state.products.length, state, setSearchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__top">
          <div className="admin-brand">
            <div className="admin-brand__row">
              <h1 className="admin-brand__title">ApplianSys Panel</h1>
            </div>
          </div>

          <nav className="admin-sidebar__nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`admin-sidebar__link${section === item.key ? " admin-sidebar__link--active" : ""}`}
                onClick={() => setSearchParams({ section: item.key })}
                title={item.label}
              >
                <span className="admin-sidebar__link-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <span className="admin-sidebar__user-label">Signed in as</span>
            <span className="admin-sidebar__user-value">{user.email}</span>
          </div>

          <Link to="/" className="admin-sidebar__back" title="Back to Storefront">
            <span className="admin-sidebar__link-label">Back to Storefront</span>
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
            {section === "products" ? (
              <button
                type="button"
                className="admin-primary-btn"
                onClick={() => setIsProductModalOpen(true)}
              >
                + Add Product
              </button>
            ) : null}
            {section === "products" && user.role === "admin" ? (
              <button
                type="button"
                className="admin-secondary-btn"
                onClick={() => setIsCategoryModalOpen(true)}
              >
                Add Category
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

        {renderSectionContent({ section, state, onEditProduct: (id) => {
          state.handleEditProduct(id);
          setIsProductModalOpen(true);
        } })}

        <CreateProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            state.handleCancelEditProduct();
          }}
          draft={state.productDraft}
          setDraft={state.setProductDraft}
          categories={state.categories}
          isEditing={state.editingProductId !== null}
          onAddProduct={state.handleAddProduct}
          onCancelEdit={state.handleCancelEditProduct}
        />

        {user.role === "admin" ? (
          <CategoryManagerModal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            categories={state.categories}
            categoryDraft={state.categoryDraft}
            setCategoryDraft={state.setCategoryDraft}
            onAddCategory={state.handleAddCategory}
            onAddSubSubcategory={state.handleAddSubSubcategory}
            onDeleteSubcategory={state.handleDeleteSubcategory}
            onDeleteSubSubcategory={state.handleDeleteSubSubcategory}
          />
        ) : null}
      </main>
    </div>
  );
}

export default AdminPage;
