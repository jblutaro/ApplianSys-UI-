import { useEffect, useState } from "react";
import {
  createProduct,
  deleteProduct,
  fetchAdminDashboard,
  fetchSalesReport,
  patchOrderStatus,
  updateAdminSettings,
  type Order,
  type OrderStatus,
  type Product,
  type ReportPeriod,
  type RevenuePoint,
  type SalesReportRow,
  type AdminSettings,
} from "../lib/adminApi";
import { EMPTY_PRODUCT_DRAFT, EMPTY_SETTINGS } from "../lib/adminConstants";

type UseAdminDashboardOptions = {
  enabled: boolean;
};

export function useAdminDashboard({ enabled }: UseAdminDashboardOptions) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(EMPTY_SETTINGS);
  const [revenueOverTime, setRevenueOverTime] = useState<RevenuePoint[]>([]);
  const [reportRows, setReportRows] = useState<SalesReportRow[]>([]);
  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [productDraft, setProductDraft] = useState<Product>(EMPTY_PRODUCT_DRAFT);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchAdminDashboard(period);
        if (cancelled) return;

        setProducts(response.dashboard.products);
        setOrders(response.dashboard.orders);
        setSettings(response.dashboard.settings);
        setRevenueOverTime(response.dashboard.revenueOverTime);
        setReportRows(response.dashboard.report);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load admin data.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [enabled, period]);

  const handleAddProduct = () => {
    if (!productDraft.name.trim() || !productDraft.category.trim()) return;

    void (async () => {
      try {
        const response = await createProduct({
          name: productDraft.name,
          category: productDraft.category,
          price: productDraft.price,
          stock: productDraft.stock,
        });

        setProducts(response.products);
        setProductDraft(EMPTY_PRODUCT_DRAFT);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to create product.");
      }
    })();
  };

  const handleDeleteProduct = (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;

    void (async () => {
      try {
        const response = await deleteProduct(product.dbId);
        setProducts(response.products);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to delete product.");
      }
    })();
  };

  const handleOrderStatusChange = (id: string, status: OrderStatus) => {
    const order = orders.find((item) => item.id === id);
    if (!order) return;

    void (async () => {
      try {
        const response = await patchOrderStatus(order.dbId, status);
        setOrders(response.orders);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to update order status.");
      }
    })();
  };

  const handleSaveSettings = () => {
    void (async () => {
      setIsSavingSettings(true);

      try {
        const response = await updateAdminSettings(settings);
        setSettings(response.settings);

        const reportResponse = await fetchSalesReport(period);
        setReportRows(reportResponse.report);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to save settings.");
      } finally {
        setIsSavingSettings(false);
      }
    })();
  };

  return {
    errorMessage,
    handleAddProduct,
    handleDeleteProduct,
    handleOrderStatusChange,
    handleSaveSettings,
    isLoading,
    isSavingSettings,
    orders,
    period,
    productDraft,
    products,
    reportRows,
    revenueOverTime,
    setPeriod,
    setProductDraft,
    setSettings,
    settings,
  };
}
