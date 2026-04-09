import { useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-dashboard-api";
import {
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/use-mutations";
import { formatDistanceToNow } from "date-fns";
import type { AppNotification } from "@/types/api";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/lib/socket";

const typeColors: Record<string, string> = {
  info: "bg-primary",
  warning: "bg-destructive",
  success: "bg-chart-2",
};

export default function NotificationBell() {
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();

  const unreadCount = notifications.filter(
    (n: AppNotification) => !n.read
  ).length;

  const handleMarkRead = (id: string) => {
    markRead.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    // ✅ Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    // OPTIONAL: register user (if backend expects it)
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user) {
      socket.emit("register", {
        userId: user._id,
        role: user.role,
      });
    }

    // SINGLE NOTIFICATION UPDATE
    socket.on("notificationUpdated", (updatedNotification) => {
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return [];
        return old.map((n: any) =>
          n._id === updatedNotification._id ? updatedNotification : n
        );
      });
    });

    // ALL NOTIFICATIONS CLEARED
    socket.on("notificationsCleared", () => {
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return [];
        return old.map((n: any) => ({
          ...n,
          read: true,
        }));
      });
    });

    return () => {
      socket.off("notificationUpdated");
      socket.off("notificationsCleared");
    };
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.map((n: AppNotification) => (
            <DropdownMenuItem
              key={n._id}
              className={cn(
                "flex items-start gap-3 p-3 cursor-pointer",
                !n.read && "bg-accent/50"
              )}
              onClick={() => !n.read && handleMarkRead(n._id)}
            >
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  typeColors[n.type]
                )}
              />

              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-medium leading-tight">
                  {n.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {n.description}
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  {formatTime(n.createdAt)}
                </p>
              </div>

              {!n.read && (
                <Badge variant="secondary" className="shrink-0 text-[10px] h-5">
                  New
                </Badge>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}