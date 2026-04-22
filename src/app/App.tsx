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

  const handleAuthenticated = (authenticatedUser: AppUser | null) => {
    if (authenticatedUser?.role === "admin") {
      void navigate("/admin");
    }
  };

  return (
    <div>
      {!isAdminRoute ? (
        <AppHeader
          onAuthOpen={() => setAuthOpen(true)}
          onSignOut={signOutUser}
          user={user}
        />
      ) : null}

      <main className={isAdminRoute ? "app-main app-main--admin" : "app-main"}>
        <AppRoutes user={user} onAuthOpen={() => setAuthOpen(true)} />
      </main>

      {!isAdminRoute ? <ChatGPTBot /> : null}

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
