import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { Bell } from "lucide-react";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    socket.on("notification:new", (data) => {
      setNotifications((prev) => [data, ...prev]);
    });

    return () => {
      socket.off("notification:new");
    };
  }, []);

  return (
    <div className="relative">
      {/* ICON */}
      <button onClick={() => setOpen(!open)} className="relative">
        <Bell className="w-5 h-5" />

        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded">
            {notifications.length}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border rounded shadow-lg z-50">
          <div className="p-2 font-semibold border-b">Notifications</div>

          {notifications.length === 0 ? (
            <p className="p-3 text-sm text-gray-500">
              No notifications
            </p>
          ) : (
            notifications.map((n, i) => (
              <div key={i} className="p-3 border-b text-sm">
                <p className="font-medium">{n.title}</p>
                <p className="text-gray-500">{n.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;