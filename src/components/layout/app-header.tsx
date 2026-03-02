"use client";

import Link from "next/link";
import { MessageSquareMore } from "lucide-react";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/demo/offers", label: "Offer Generator" },
  { href: "/demo/offers/logs", label: "Logs" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/demo/offers" className="flex items-center gap-2 font-semibold">
            <MessageSquareMore className="h-5 w-5 text-primary" />
            <span>Hotel CommerceCo</span>
            <Badge variant="outline" className="text-xs">
              beta
            </Badge>
          </Link>
        </div>

        <nav className="flex items-center gap-1 text-sm">
          {links.map((link) => (
            <Button
              key={link.href}
              asChild
              variant={
                pathname === link.href || pathname?.startsWith(link.href)
                  ? "secondary"
                  : "ghost"
              }
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
