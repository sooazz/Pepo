"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { db as supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users } from "lucide-react";

export default function TraderFollowersPage() {
  const { user } = useAuth();

  const { data: trader } = useQuery({
    queryKey: ["my-trader-id", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("traders").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["trader-subscriptions", trader?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*, profiles(full_name, email), plans(name, price, max_stake), copy_settings(stake_value, stake_type)")
        .eq("trader_id", trader!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!trader?.id,
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">Seguidores</h1>
            <p className="text-muted-foreground mt-1">
              {subscriptions.length} assinante{subscriptions.length !== 1 ? "s" : ""} ativos
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-muted-foreground">
            <Users className="w-5 h-5" />
            <span className="text-2xl font-bold text-foreground">{subscriptions.length}</span>
          </div>
        </div>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded" />)}
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                Nenhum seguidor ainda. Publique seus planos no Marketplace!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-right">Stake Configurada</TableHead>
                    <TableHead>Renovação</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => {
                    const profile = sub.profiles as unknown as { full_name: string; email: string } | null;
                    const plan = sub.plans as unknown as { name: string; price: number; max_stake: number } | null;
                    const copySettings = sub.copy_settings as unknown as { stake_value: number; stake_type: string } | null;
                    return (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{profile?.full_name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{profile?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{plan?.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{plan ? formatCurrency(plan.price) + "/mês" : ""}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {copySettings
                            ? copySettings.stake_type === "fixed"
                              ? formatCurrency(copySettings.stake_value)
                              : `${copySettings.stake_value}%`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(sub.renewal_date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            sub.status === "active" ? "default" :
                            sub.status === "cancelled" ? "destructive" : "secondary"
                          }>
                            {sub.status === "active" ? "Ativo" : sub.status === "cancelled" ? "Cancelado" : "Expirado"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
