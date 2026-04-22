import type { AppUser } from "@/shared/lib/auth";

type HeaderUserAvatarProps = {
  user: AppUser;
};

export function HeaderUserAvatar({ user }: HeaderUserAvatarProps) {
  const letter = (user.displayName || user.email || "U")[0].toUpperCase();

  if (user.photoURL) {
    return <img src={user.photoURL} alt={letter} className="user-avatar__img" />;
  }

  return <span className="user-avatar__letter">{letter}</span>;
}
