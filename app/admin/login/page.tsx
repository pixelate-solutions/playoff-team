"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Invalid password");
      }

      toast.success("Welcome, commissioner.");
      router.push("/admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container flex min-h-[70vh] items-center justify-center">
      <Card className="glass-card w-full max-w-md">
        <CardHeader>
          <Badge variant="secondary">Admin</Badge>
          <CardTitle>Commissioner Login</CardTitle>
          <CardDescription>Enter the shared admin password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleLogin();
            }}
          >
            <Input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button className="w-full" type="submit" disabled={!password || loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
