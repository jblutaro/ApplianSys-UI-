import { Route, Routes } from "react-router-dom";
import { AboutPage } from "@/features/about";
import { AdminPage } from "@/features/admin";
import { CartPage } from "@/features/cart";
import { CategoryPage } from "@/features/category";
import { OrdersPage } from "@/features/orders";
import { SearchPage } from "@/features/search";
import { SettingsPage } from "@/features/settings";
import type { AppUser } from "@/shared/lib/auth";

type AppRoutesProps = {
  onAuthOpen: () => void;
  user: AppUser | null;
};

export function AppRoutes({ onAuthOpen, user }: AppRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/cart" element={<CartPage user={user} onAuthOpen={onAuthOpen} />} />
      <Route path="/orders" element={<OrdersPage user={user} onAuthOpen={onAuthOpen} />} />
      <Route path="/settings" element={<SettingsPage user={user} onAuthOpen={onAuthOpen} />} />
      <Route path="/admin" element={<AdminPage user={user} onAuthOpen={onAuthOpen} />} />
      <Route path="/category/:categorySlug" element={<CategoryPage />} />
      <Route path="/category/:categorySlug/:subSlug" element={<CategoryPage />} />
    </Routes>
  );
}
