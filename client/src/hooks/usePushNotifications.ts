import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const { data: statusData } = trpc.pushNotifications.getStatus.useQuery(undefined, {
    retry: false,
  });

  const subscribeMutation = trpc.pushNotifications.subscribe.useMutation();
  const unsubscribeMutation = trpc.pushNotifications.unsubscribe.useMutation();
  const sendTestMutation = trpc.pushNotifications.sendTest.useMutation();

  useEffect(() => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (statusData) {
      setIsSubscribed(statusData.subscribed);
    }
  }, [statusData]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !VAPID_PUBLIC_KEY) {
      toast.error("Push notifications are not supported on this device");
      return false;
    }

    setIsLoading(true);
    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        toast.error("Notification permission denied. Please enable in browser settings.");
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });

      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Invalid subscription object");
      }

      // Save to backend
      await subscribeMutation.mutateAsync({
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        userAgent: navigator.userAgent,
      });

      setIsSubscribed(true);
      toast.success("🔔 Push notifications enabled! You'll receive trend alerts.");
      return true;
    } catch (err) {
      console.error("[PushNotifications] Subscribe error:", err);
      toast.error("Failed to enable push notifications. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, subscribeMutation]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await unsubscribeMutation.mutateAsync({ endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      toast.success("Push notifications disabled");
    } catch (err) {
      console.error("[PushNotifications] Unsubscribe error:", err);
      toast.error("Failed to disable push notifications");
    } finally {
      setIsLoading(false);
    }
  }, [unsubscribeMutation]);

  const sendTest = useCallback(async () => {
    try {
      await sendTestMutation.mutateAsync();
      toast.success("Test notification sent! Check your device.");
    } catch (err) {
      toast.error("Failed to send test notification. Make sure notifications are enabled.");
    }
  }, [sendTestMutation]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTest,
  };
}
