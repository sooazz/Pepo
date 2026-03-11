"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { db as supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function AdminSubscriptionsPage() {
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*, profiles(full_name, email), traders(display_name), plans(name, price)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Assinaturas</h1>
          <p className="text-muted-foreground mt-1">{subscriptions.length} assinaturas no total</p>
        </div>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Trader</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Renovação</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : subscriptions.map((sub) => {
                      const profile = sub.profiles as unknown as { full_name: string; email: string } | null;
                      const trader = sub.traders as unknown as { display_name: string } | null;
                      const plan = sub.plans as unknown as { name: string; price: number } | null;
                      return (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{profile?.full_name ?? "—"}</p>
                              <p className="text-xs text-muted-foreground">{profile?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{trader?.display_name ?? "—"}</TableCell>
                          <TableCell>{plan?.name ?? "—"}</TableCell>
                          <TableCell className="text-right font-mono">{plan ? formatCurrency(plan.price) : "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(sub.renewal_date)}</TableCell>
                          <TableCell>
                            <Badge variant={sub.status === "active" ? "default" : sub.status === "cancelled" ? "destructive" : "secondary"}>
                              {sub.status === "active" ? "Ativo" : sub.status === "cancelled" ? "Cancelado" : "Expirado"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
