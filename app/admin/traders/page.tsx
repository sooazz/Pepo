"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db as supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPercent, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import type { TraderWithStats } from "@/types";

export default function AdminTradersPage() {
  const qc = useQueryClient();

  const { data: traders = [], isLoading } = useQuery({
    queryKey: ["admin-traders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("traders")
        .select("*, trader_stats(*), plans(*)")
        .order("created_at", { ascending: false });
      return (data ?? []) as TraderWithStats[];
    },
  });

  const toggleVerified = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase.from("traders").update({ verified }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-traders"] }); toast.success("Atualizado!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePublic = useMutation({
    mutationFn: async ({ id, is_public }: { id: string; is_public: boolean }) => {
      const { error } = await supabase.from("traders").update({ is_public }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-traders"] }); toast.success("Atualizado!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Traders</h1>
          <p className="text-muted-foreground mt-1">{traders.length} traders cadastrados</p>
        </div>
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status Copy</TableHead>
                  <TableHead className="text-right">ROI Mensal</TableHead>
                  <TableHead className="text-right">Seguidores</TableHead>
                  <TableHead className="text-right">Planos</TableHead>
                  <TableHead>Visibilidade</TableHead>
                  <TableHead>Verificado</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : traders.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.display_name}</TableCell>
                        <TableCell>
                          <Badge variant={t.copy_status === "ACTIVE" ? "default" : t.copy_status === "PAUSING" ? "secondary" : "destructive"}>
                            {t.copy_status}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-mono ${(t.trader_stats?.roi_monthly ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {formatPercent(t.trader_stats?.roi_monthly ?? 0)}
                        </TableCell>
                        <TableCell className="text-right font-mono">{t.trader_stats?.followers_count ?? 0}</TableCell>
                        <TableCell className="text-right font-mono">{t.plans?.length ?? 0}</TableCell>
                        <TableCell>
                          <Badge variant={t.is_public ? "default" : "secondary"}>
                            {t.is_public ? "Público" : "Privado"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {t.verified
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            : <XCircle className="w-4 h-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="text-xs h-7"
                              onClick={() => togglePublic.mutate({ id: t.id, is_public: !t.is_public })}>
                              {t.is_public ? "Privatizar" : "Publicar"}
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-7"
                              onClick={() => toggleVerified.mutate({ id: t.id, verified: !t.verified })}>
                              {t.verified ? "Desverificar" : "Verificar"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
