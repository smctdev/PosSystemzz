"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Sales", href: "/sales", icon: ShoppingCart },
  { name: "Products", href: "/products", icon: Package },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

interface SidebarProps {
  isCollapsed: boolean;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r bg-blue-200 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo/Header */}
      <div className={cn(
        "flex h-16 items-center border-b transition-all",
        isCollapsed ? "justify-center px-2" : "px-6"
      )}>
        {isCollapsed ? (
          <div className="text-xl font-bold text-sidebar-foreground">P</div>
        ) : (
          <h1 className="text-xl font-bold text-sidebar-foreground">POS System</h1>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-colors",
                isCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

