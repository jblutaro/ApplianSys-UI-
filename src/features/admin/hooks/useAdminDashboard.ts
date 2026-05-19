import { useEffect, useState } from "react";
import {
  createProduct,
  createCategory,
  createSubSubcategory,
  deleteProduct,
  deleteSubcategory,
  deleteSubSubcategory,
  fetchAdminCategories,
  fetchAdminDashboard,
  fetchPickupReleaseOrders,
  fetchSalesReport,
  patchOrderStatus,
  releasePickupOrder,
  updateAdminSettings,
  updateProduct,
  type Order,
  type OrderStatus,
  type Product,
  type PickupReleaseOrder,
  type ReportPeriod,
  type RevenuePoint,
  type ItemSalesRow,
  type SalesReportRow,
  type AdminSettings,
  type CategoryOption,
} from "../lib/adminApi";
import { EMPTY_PRODUCT_DRAFT, EMPTY_SETTINGS } from "../lib/adminConstants";

type UseAdminDashboardOptions = {
  enabled: boolean;
};

export function useAdminDashboard({ enabled }: UseAdminDashboardOptions) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryDraft, setCategoryDraft] = useState({
    categoryName: "",
    subcategoryId: 0,
    subcategoryName: "",
    subSubcategoryName: "",
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [pickupReleaseOrders, setPickupReleaseOrders] = useState<PickupReleaseOrder[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(EMPTY_SETTINGS);
  const [revenueOverTime, setRevenueOverTime] = useState<RevenuePoint[]>([]);
  const [reportRows, setReportRows] = useState<SalesReportRow[]>([]);
  const [itemSalesRows, setItemSalesRows] = useState<ItemSalesRow[]>([]);
  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isReleasingPickup, setIsReleasingPickup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [productDraft, setProductDraft] = useState<Product>(EMPTY_PRODUCT_DRAFT);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [response, categoriesResponse, pickupReleaseResponse] = await Promise.all([
          fetchAdminDashboard(period),
          fetchAdminCategories(),
          fetchPickupReleaseOrders(),
        ]);
        if (cancelled) return;

        setProducts(response.dashboard.products);
        setCategories(categoriesResponse.categories);
        setOrders(response.dashboard.orders);
        setSettings(response.dashboard.settings);
        setRevenueOverTime(response.dashboard.revenueOverTime);
        setReportRows(response.dashboard.report);
        setItemSalesRows(response.dashboard.itemSales);
        setPickupReleaseOrders(pickupReleaseResponse.orders);
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
    if (!productDraft.name.trim() || !productDraft.category.trim() || !productDraft.subcategory.trim()) return;

    void (async () => {
      try {
        const payload = {
          name: productDraft.name,
          category: productDraft.category,
          subcategory: productDraft.subcategory,
          subSubcategory: productDraft.subSubcategory,
          description: productDraft.description,
          image: productDraft.image,
          price: productDraft.price,
          stock: productDraft.stock,
        };
        const response = editingProductId
          ? await updateProduct(editingProductId, payload)
          : await createProduct(payload);

        setProducts(response.products);
        setProductDraft(EMPTY_PRODUCT_DRAFT);
        setEditingProductId(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to save product.");
      }
    })();
  };

  const handleAddCategory = () => {
    if (!categoryDraft.categoryName.trim() || !categoryDraft.subcategoryName.trim()) return;

    void (async () => {
      try {
        const response = await createCategory({
          categoryName: categoryDraft.categoryName,
          subcategoryName: categoryDraft.subcategoryName,
        });

        setCategories(response.categories);
        setCategoryDraft({
          categoryName: "",
          subcategoryId: 0,
          subcategoryName: "",
          subSubcategoryName: "",
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to create category.");
      }
    })();
  };

  const handleAddSubSubcategory = () => {
    if (!categoryDraft.subcategoryId || !categoryDraft.subSubcategoryName.trim()) return;

    void (async () => {
      try {
        const response = await createSubSubcategory(categoryDraft.subcategoryId, {
          subSubcategoryName: categoryDraft.subSubcategoryName,
        });

        setCategories(response.categories);
        setCategoryDraft({ ...categoryDraft, subcategoryId: 0, subSubcategoryName: "" });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to create sub-subcategory.");
      }
    })();
  };

  const handleDeleteSubcategory = (subcategoryId: number) => {
    void (async () => {
      try {
        const response = await deleteSubcategory(subcategoryId);
        setCategories(response.categories);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to delete subcategory.");
      }
    })();
  };

  const handleDeleteSubSubcategory = (subSubcategoryId: number) => {
    void (async () => {
      try {
        const response = await deleteSubSubcategory(subSubcategoryId);
        setCategories(response.categories);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to delete sub-subcategory.");
      }
    })();
  };

  const handleEditProduct = (id: string) => {
    const product = products.find((item) => item.id === id);
    if (!product) return;

    setProductDraft(product);
    setEditingProductId(product.dbId);
  };

  const handleCancelEditProduct = () => {
    setProductDraft(EMPTY_PRODUCT_DRAFT);
    setEditingProductId(null);
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
        const pickupResponse = await fetchPickupReleaseOrders();
        setPickupReleaseOrders(pickupResponse.orders);
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
        setItemSalesRows(reportResponse.itemSales);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to save settings.");
      } finally {
        setIsSavingSettings(false);
      }
    })();
  };

  const handleReleasePickupOrder = (
    orderId: number,
    confirmPaymentReceived: boolean,
  ) => {
    void (async () => {
      setIsReleasingPickup(true);
      setErrorMessage("");

      try {
        const response = await releasePickupOrder(orderId, confirmPaymentReceived);
        setPickupReleaseOrders(response.orders);
        const dashboardResponse = await fetchAdminDashboard(period);
        setOrders(dashboardResponse.dashboard.orders);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to release pickup order.");
      } finally {
        setIsReleasingPickup(false);
      }
    })();
  };

  return {
    categories,
    categoryDraft,
    errorMessage,
    handleAddCategory,
    handleAddSubSubcategory,
    handleAddProduct,
    handleCancelEditProduct,
    handleDeleteProduct,
    handleDeleteSubcategory,
    handleDeleteSubSubcategory,
    handleEditProduct,
    handleOrderStatusChange,
    handleReleasePickupOrder,
    handleSaveSettings,
    isLoading,
    isReleasingPickup,
    isSavingSettings,
    editingProductId,
    orders,
    period,
    pickupReleaseOrders,
    productDraft,
    products,
    itemSalesRows,
    reportRows,
    revenueOverTime,
    setPeriod,
    setCategoryDraft,
    setProductDraft,
    setSettings,
    settings,
  };
}
