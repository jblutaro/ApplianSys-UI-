import "@/shared/styles/App.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/app/components/AppHeader";
import { AppRoutes } from "@/app/components/AppRoutes";
import { useAuthUser } from "@/app/hooks/useAuthUser";
import { AuthModal } from "@/shared/components/AuthModal";
import ChatGPTBot from "@/shared/components/ChatGPTBot";
import { signOutUser, type AppUser } from "@/shared/lib/auth";
import { useLocation } from "react-router-dom";

function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const user = useAuthUser();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isStandaloneRoute = isAdminRoute || location.pathname.startsWith("/mock-gcash-payment");

  const handleAuthenticated = (authenticatedUser: AppUser | null) => {
    if (authenticatedUser?.role === "admin") {
      void navigate("/admin");
    }
  };

  return (
    <div>
      {!isStandaloneRoute ? (
        <AppHeader
          onAuthOpen={() => setAuthOpen(true)}
          onSignOut={signOutUser}
          user={user}
        />
      ) : null}

      <main className={isAdminRoute ? "app-main app-main--admin" : "app-main"}>
        <AppRoutes user={user} onAuthOpen={() => setAuthOpen(true)} />
      </main>

      {!isStandaloneRoute ? <ChatGPTBot /> : null}

      <AuthModal
        open={authOpen}
        onAuthenticated={handleAuthenticated}
        onClose={() => setAuthOpen(false)}
        user={user}
      />
    </div>
  );
}

export default App;
