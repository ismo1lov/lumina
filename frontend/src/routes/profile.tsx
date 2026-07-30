import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { LogOut, Package, MapPin } from "lucide-react";

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
}

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user) return;
    api.get<Order[]>("/orders").then(setOrders).catch(() => {});
  }, [user]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/login" });
  };

  return (
    <div className="mx-auto max-w-4xl px-6 pt-36 pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl">My Profile</h1>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <LogOut size={15} /> Sign Out
        </button>
      </div>

      <div className="border p-6 mb-8">
        <p className="font-display text-lg">{user.name}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="flex gap-1 border-b mb-8">
        <Link to="/dashboard" className="flex items-center gap-2 px-5 py-3 text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">
          <Package size={14} />
          My Orders
        </Link>
        <Link to="/dashboard?tab=addresses" className="flex items-center gap-2 px-5 py-3 text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors">
          <MapPin size={14} />
          Addresses
        </Link>
      </div>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package size={40} className="mx-auto mb-4 opacity-30" />
            <p>No orders yet</p>
            <Link to="/catalog" className="mt-3 inline-block text-sm underline underline-offset-4">Start shopping</Link>
          </div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="border p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                <p className="font-display text-sm mt-1 capitalize">{o.status}</p>
              </div>
              <div className="text-right">
                <p className="font-display">{new Intl.NumberFormat("en-US").format(o.total)} UZS</p>
                <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
