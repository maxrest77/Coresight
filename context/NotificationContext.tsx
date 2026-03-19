"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { listenToNotifications, markAllNotificationsRead, markNotificationRead, AppNotification } from "@/lib/firestoreService";

interface NotificationContextProps {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps>({
  notifications: [],
  unreadCount: 0,
  markAllRead: async () => {},
  markAsRead: async () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsubscribe = listenToNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.uid);
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    await markNotificationRead(user.uid, id);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
