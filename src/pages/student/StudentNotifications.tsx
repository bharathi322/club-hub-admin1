import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotifications } from "@/hooks/use-dashboard-api";
import { useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/use-mutations";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle } from "lucide-react";
import type { AppNotification } from "@/types/api";
import { cn } from "@/lib/utils";
import { socket } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const typeConfig: Record<string, { icon: typeof Info; color: string; label: string }> = {
  info: { icon: Info, color: "text-primary", label: "Info" },
  warning: { icon: AlertTriangle, color: "text-destructive", label: "Warning" },
  success: { icon: CheckCircle, color: "text-chart-2", label: "Success" },
};

const StudentNotifications = () => {
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = notifications.filter((n: AppNotification) => {
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (statusFilter === "unread" && n.read) return false;
    if (statusFilter === "read" && !n.read) return false;
    return true;
  });

  const unreadCount = notifications.filter((n: AppNotification) => !n.read).length;

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };
const queryClient = useQueryClient();
useEffect(() => {
  // NEW OR UPDATED NOTIFICATION
  socket.on("notificationUpdated", (updatedNotification) => {
    queryClient.setQueryData(["notifications"], (old: any) => {
      if (!old) return [updatedNotification];

      const exists = old.find((n: any) => n._id === updatedNotification._id);

      if (exists) {
        return old.map((n: any) =>
          n._id === updatedNotification._id ? updatedNotification : n
        );
      }

      // NEW notification → add on top
      return [updatedNotification, ...old];
    });
  });

  // MARK ALL READ
  socket.on("notificationsCleared", () => {
    queryClient.setQueryData(["notifications"], (old: any) => {
      if (!old) return [];
      return old.map((n: any) => ({ ...n, read: true }));
    });
  });

  return () => {
    socket.off("notificationUpdated");
    socket.off("notificationsCleared");
  };
}, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notification list */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : filtered.length ? (
          filtered.map((n: AppNotification, i: number) => {
            const config = typeConfig[n.type] || typeConfig.info;
            const Icon = config.icon;
            return (
              <motion.div
                key={n._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  className={cn(
                    "shadow-card cursor-pointer transition-colors hover:bg-accent/30",
                    !n.read && "border-l-4 border-l-primary"
                  )}
                  onClick={() => { if (!n.read) markRead.mutate(n._id); }}
                >
                  <CardContent className="pt-4 flex items-start gap-4">
                    <div className={cn("mt-0.5 p-2 rounded-full bg-muted shrink-0", config.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{n.title}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="text-[10px] capitalize">{config.label}</Badge>
                          {!n.read && <Badge className="text-[10px] bg-primary text-primary-foreground">New</Badge>}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.description}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{formatTime(n.createdAt)}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-16">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No notifications match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentNotifications;
