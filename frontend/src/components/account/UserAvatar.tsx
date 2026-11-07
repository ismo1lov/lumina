import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import type { User } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: Pick<User, "name" | "avatar">;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const avatarSrc =
    user.avatar && user.avatar.startsWith("/uploads") ? `${API_BASE}${user.avatar}` : user.avatar;
  const letter = (user.name.trim()[0] ?? "L").toUpperCase();

  useEffect(() => {
    setFailed(false);
  }, [user.avatar]);

  return (
    <div
      className={cn(
        "grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary font-sans text-base font-semibold text-primary-foreground",
        className,
      )}
    >
      {avatarSrc && !failed ? (
        <img
          src={avatarSrc}
          alt={user.name}
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{letter}</span>
      )}
    </div>
  );
}
