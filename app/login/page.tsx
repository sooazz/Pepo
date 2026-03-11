"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db as supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { TrendingUp, User, BarChart2, ShieldCheck } from "lucide-react";

const DEMO_USERS = [
  {
    label: "Cliente",
    email: "cliente@pepo.com",
    password: "pepo1234",
    icon: User,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20",
    badge: "bg-blue-500/20 text-blue-300",
  },
  {
    label: "Trader",
    email: "trader@pepo.com",
    password: "pepo1234",
    icon: BarChart2,
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20",
    badge: "bg-emerald-500/20 text-emerald-300",
  },
  {
    label: "Gestor",
    email: "gestor@pepo.com",
    password: "pepo1234",
    icon: ShieldCheck,
    color: "bg-violet-500/10 text-violet-400 border-violet-500/30 hover:bg-violet-500/20",
    badge: "bg-violet-500/20 text-violet-300",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function fillDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Erro ao entrar: " + error.message);
    } else {
      toast.success("Login realizado!");
      router.push("/dashboard");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="w-8 h-8" />
            <span className="text-2xl font-bold">Pepo</span>
          </div>
          <p className="text-muted-foreground text-sm">Copy Trading Esportivo</p>
        </div>

        {/* Acesso rápido demo */}
        <div className="space-y-2">
          <p className="text-xs text-center text-muted-foreground uppercase tracking-wider">
            Acesso rápido — demo
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_USERS.map(({ label, email: de, password: dp, icon: Icon, color }) => (
              <button
                key={label}
                type="button"
                onClick={() => fillDemo(de, dp)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs font-medium transition-colors ${color}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Entrar na plataforma</CardTitle>
            <CardDescription>Acesse sua conta para continuar</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              <p className="text-sm text-muted-foreground">
                Não tem conta?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Criar conta
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
