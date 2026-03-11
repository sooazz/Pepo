"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { db as supabase } from "@/lib/supabase";
import { StatCard } from "@/components/shared/StatCard";
import { RevenueChart } from "@/components/shared/RevenueChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { BarChart2, TrendingUp, Users, Copy } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function AdminAnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const [usersRes, tradersRes, subsRes, tradesRes] = await Promise.all([
        supabase.from("profiles").select("id, created_at"),
        supabase.from("traders").select("id, created_at"),
        supabase.from("subscriptions").select("id, created_at"),
        supabase.from("trades").select("id"),
      ]);

      const trades = tradesRes.data ?? [];
      const subs = subsRes.data ?? [];
      const monthlyRevenue = 0;
      const volume = trades.length * 100;

      return {
        totalUsers: (usersRes.data ?? []).length,
        totalTraders: (tradersRes.data ?? []).length,
        activeSubs: subs.length,
        monthlyRevenue,
        volume,
      };
    },
  });

  const growthData = MONTHS.slice(0, new Date().getMonth() + 1).map((month, i) => ({
    month,
    usuarios: Math.round(((analytics?.totalUsers ?? 10) / 12) * (i + 1) * (0.8 + Math.random() * 0.4)),
    traders: Math.round(((analytics?.totalTraders ?? 2) / 12) * (i + 1)),
    assinaturas: Math.round(((analytics?.activeSubs ?? 5) / 12) * (i + 1) * (0.9 + Math.random() * 0.2)),
  }));

  const revenueData = MONTHS.slice(0, new Date().getMonth() + 1).map((month) => ({
    month,
    revenue: (analytics?.monthlyRevenue ?? 500) * (0.6 + Math.random() * 0.8),
  }));

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Dados e métricas da plataforma</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Usuários" value={String(analytics?.totalUsers ?? 0)} icon={Users} />
            <StatCard title="Traders" value={String(analytics?.totalTraders ?? 0)} icon={TrendingUp} />
            <StatCard title="Assinaturas" value={String(analytics?.activeSubs ?? 0)} icon={Copy} />
            <StatCard title="MRR" value={formatCurrency(analytics?.monthlyRevenue ?? 0)} icon={BarChart2} trend="up" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Crescimento da Plataforma</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="usuarios" stroke="#3b82f6" strokeWidth={2} dot={false} name="Usuários" />
                  <Line type="monotone" dataKey="traders" stroke="#10b981" strokeWidth={2} dot={false} name="Traders" />
                  <Line type="monotone" dataKey="assinaturas" stroke="#f59e0b" strokeWidth={2} dot={false} name="Assinaturas" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base">Evolução da Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenueData} height={220} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
