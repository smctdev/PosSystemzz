"use client";

import { Calendar, Clock, Menu, X, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiService } from "@/lib/api/apiService";

interface HeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function Header({ isSidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  /** null until client mount — avoids SSR vs client `new Date()` hydration mismatch */
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Auto-close logout dialog after 2 seconds and redirect
  useEffect(() => {
    if (logoutDialogOpen) {
      const timer = setTimeout(() => {
        setLogoutDialogOpen(false);
        // Clear user data from localStorage
        localStorage.removeItem("user");
        router.push("/login");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [logoutDialogOpen, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Call logout API
      await apiService.auth.logout();
      
      // Show success dialog
      setIsLoggingOut(false);
      setLogoutDialogOpen(true);
    } catch (error) {
      // Even if API fails, still logout locally
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      setLogoutDialogOpen(true);
    }
  };

  useEffect(() => {
    const tick = () => setCurrentTime(new Date());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-blue-600 px-6 text-white">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-9 w-9 bg-white hover:bg-gray-100"
        >
          {isSidebarCollapsed ? (
            <Menu className="h-5 w-5 text-gray-900" />
          ) : (
            <X className="h-5 w-5 text-gray-900" />
          )}
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-white">
            <Calendar className="h-4 w-4" />
            <span className="inline-block min-w-[12rem] tabular-nums">
              {currentTime ? formatDate(currentTime) : "\u00A0"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white">
            <Clock className="h-4 w-4" />
            <span className="inline-block min-w-[7ch] tabular-nums">
              {currentTime ? formatTime(currentTime) : "\u00A0"}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-white">Store Name</p>
          <p className="text-xs text-white/80">Welcome back!</p>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="gap-2 text-white bg-red-500 hover:bg-red-600"
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <>
              <Spinner className="h-4 w-4" size="sm" />
              Logging out...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              Logout
            </>
          )}
        </Button>
      </div>

      {/* Logout Success Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="inline-flex items-center justify-center">
                <Image
                  src="/logout.gif"
                  alt="Logout"
                  width={80}
                  height={80}
                  className="rounded-full"
                  unoptimized
                />
              </div>
              <DialogTitle className="text-2xl">Logged Out Successfully!</DialogTitle>
              <DialogDescription className="text-base">
                You have been logged out. Redirecting to login page...
              </DialogDescription>
              <p className="text-lg text-blue-500 font-bold mt-1">
                Please wait
              </p>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </header>
  );
}

