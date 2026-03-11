"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Store, Copy, TrendingUp, Users, DollarSign,
  Settings, LogOut, Shield, ChevronRight, BarChart2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const userNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Marketplace", href: "/traders", icon: Store },
  { label: "Copy Settings", href: "/copy-settings", icon: Copy },
];

const traderNav = [
  { label: "Painel Trader", href: "/trader/dashboard", icon: TrendingUp },
  { label: "Planos", href: "/trader/plans", icon: DollarSign },
  { label: "Seguidores", href: "/trader/followers", icon: Users },
  { label: "Financeiro", href: "/trader/finance", icon: BarChart2 },
];

const adminNav = [
  { label: "Admin", href: "/admin/dashboard", icon: Shield },
];

interface NavItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

function NavItem({ href, icon: Icon, label }: NavItemProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
        active
          ? "bg-primary/15 text-primary font-medium"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
      {active && <ChevronRight className="w-3 h-3 ml-auto" />}
    </Link>
  );
}

export function Sidebar() {
  const { profile, signOut } = useAuth();

  return (
    <aside className="flex flex-col w-60 shrink-0 h-screen border-r border-border bg-card/50">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <TrendingUp className="w-6 h-6 text-primary" />
        <span className="font-bold text-lg">Pepo</span>
        <span className="text-xs text-muted-foreground ml-auto">Trading</span>
      </div>
      <Separator />

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Usuário
          </p>
          {userNav.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>

        {(profile?.role === "trader" || profile?.role === "admin") && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Trader
            </p>
            {traderNav.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </div>
        )}

        {profile?.role === "admin" && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Admin
            </p>
            {adminNav.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </div>
        )}
      </nav>

      <Separator />
      <div className="p-4 flex items-center gap-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{profile?.full_name ?? "Usuário"}</p>
          <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut} className="shrink-0">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </aside>
  );
}
