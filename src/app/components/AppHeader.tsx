import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeaderNav } from "@/app/components/header/HeaderNav";
import { HeaderUserMenu } from "@/app/components/header/HeaderUserMenu";
import type { AppUser } from "@/shared/lib/auth";

type AppHeaderProps = {
  onAuthOpen: () => void;
  onSignOut: () => Promise<void>;
  user: AppUser | null;
};

export function AppHeader({ onAuthOpen, onSignOut, user }: AppHeaderProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      void navigate(`/?q=${encodeURIComponent(query)}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="header">
      <h1>ApplianSys</h1>

      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          placeholder="Search for appliances..."
          className="search-box"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      <HeaderNav user={user} onAuthOpen={onAuthOpen} />

      {user ? (
        <HeaderUserMenu user={user} onSignOut={onSignOut} />
      ) : (
        <button
          type="button"
          className="sign-in"
          onClick={onAuthOpen}
        >
          Sign in
        </button>
      )}
    </header>
  );
}
