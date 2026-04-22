import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAdminUser } from "@/features/admin";
import type { AppUser } from "@/shared/lib/auth";

type HeaderNavProps = {
  onAuthOpen: () => void;
  user: AppUser | null;
};

function HeaderCartLink({ onAuthOpen, user }: HeaderNavProps) {
  const navigate = useNavigate();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!user) {
      event.preventDefault();
      onAuthOpen();
      return;
    }

    event.preventDefault();
    void navigate("/cart");
  };

  return (
    <Link to="/cart" className="cartButton" onClick={handleClick}>
      Cart
    </Link>
  );
}

export function HeaderNav({ onAuthOpen, user }: HeaderNavProps) {
  const showCart = !isAdminUser(user);

  return (
    <nav className="navButton">
      <Link to="/" className="homeButton">Home</Link>
      {" | "}
      <Link to="/about" className="aboutButton">About</Link>
      {showCart ? (
        <>
          {" | "}
          <HeaderCartLink user={user} onAuthOpen={onAuthOpen} />
        </>
      ) : null}
    </nav>
  );
}
