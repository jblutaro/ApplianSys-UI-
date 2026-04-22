import { HeaderNav } from "@/app/components/header/HeaderNav";
import { HeaderUserMenu } from "@/app/components/header/HeaderUserMenu";
import type { AppUser } from "@/shared/lib/auth";

type AppHeaderProps = {
  onAuthOpen: () => void;
  onSignOut: () => Promise<void>;
  user: AppUser | null;
};

export function AppHeader({ onAuthOpen, onSignOut, user }: AppHeaderProps) {
  return (
    <header className="header">
      <h1>ApplianSys</h1>

      <input
        type="text"
        placeholder="Search for appliances..."
        className="search-box"
      />

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
