"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/shared/StatCard";
import { RevenueChart } from "@/components/shared/RevenueChart";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Users, TrendingUp, CreditCard, Activity, BarChart3 } from "lucide-react";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, tradersRes, subsRes, withdrawalsRes] = await Promise.all([
        db.from("profiles").select("id", { count: "exact", head: true }),
        db.from("traders").select("id", { count: "exact", head: true }),
        db.from("subscriptions").select("id, plan_id").eq("status", "active"),
        db.from("withdrawals").select("amount").eq("status", "paid"),
      ]);

      const subs = subsRes.data ?? [];
      const monthlyRevenue = subs.length * 200;

      return {
        totalUsers: usersRes.count ?? 0,
        totalTraders: tradersRes.count ?? 0,
        activeSubscriptions: subs.length,
        monthlyRevenue,
        totalPaid: (withdrawalsRes.data ?? []).reduce((s, w) => s + w.amount, 0),
      };
    },
  });

  const revenueData = MONTHS.slice(0, new Date().getMonth() + 1).map((month) => ({
    month,
    revenue: (stats?.monthlyRevenue ?? 1000) * (0.5 + Math.random()),
  }));

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-1">Visão geral da plataforma</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Usuários" value={String(stats?.totalUsers ?? 0)} icon={Users} />
            <StatCard title="Total Traders" value={String(stats?.totalTraders ?? 0)} icon={TrendingUp} />
            <StatCard title="Assinaturas Ativas" value={String(stats?.activeSubscriptions ?? 0)} icon={CreditCard} />
            <StatCard title="Receita Mensal" value={formatCurrency(stats?.monthlyRevenue ?? 0)} icon={Activity} trend="up" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50 bg-card/80 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Receita Mensal da Plataforma</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenueData} height={220} />
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <p className="text-xs text-muted-foreground">MRR (Receita Recorrente)</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(stats?.monthlyRevenue ?? 0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Total Pago a Traders</p>
                <p className="text-xl font-bold">{formatCurrency(stats?.totalPaid ?? 0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
                <p className="text-xl font-bold">
                  {formatCurrency(stats?.activeSubscriptions ? (stats.monthlyRevenue / stats.activeSubscriptions) : 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: "/admin/users", label: "Gerenciar Usuários", icon: Users },
            { href: "/admin/traders", label: "Gerenciar Traders", icon: TrendingUp },
            { href: "/admin/subscriptions", label: "Assinaturas", icon: CreditCard },
            { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
          ].map((item) => (
            <a key={item.href} href={item.href}>
              <Card className="border-border/50 bg-card/80 hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="p-5 flex flex-col items-center gap-2 text-center">
                  <item.icon className="w-6 h-6 text-primary" />
                  <p className="text-sm font-medium">{item.label}</p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
