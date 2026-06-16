import { Bell, BellOff, BellRing, Smartphone, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushNotificationSettings() {
  const { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe, sendTest } =
    usePushNotifications();

  if (!isSupported) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Smartphone className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription className="text-amber-600 dark:text-amber-500">
            Your browser does not support push notifications. Try Chrome, Edge, or Firefox on desktop,
            or install the app on your mobile device.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Push Notifications
          </CardTitle>
          <Badge
            variant={isSubscribed ? "default" : "secondary"}
            className={isSubscribed ? "bg-green-500 hover:bg-green-600" : ""}
          >
            {isSubscribed ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Inactive
              </span>
            )}
          </Badge>
        </div>
        <CardDescription>
          Receive proactive trend alerts, ViralMind insights, and daily briefings directly on your
          device — even when the app is closed.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* What you'll receive */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-medium">You'll receive notifications for:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <BellRing className="h-3.5 w-3.5 text-primary shrink-0" />
              🔥 Trend alerts when viral opportunities match your niche
            </li>
            <li className="flex items-center gap-2">
              <BellRing className="h-3.5 w-3.5 text-primary shrink-0" />
              📊 Daily briefings with personalized content ideas
            </li>
            <li className="flex items-center gap-2">
              <BellRing className="h-3.5 w-3.5 text-primary shrink-0" />
              🤖 ViralMind proactive insights and suggestions
            </li>
            <li className="flex items-center gap-2">
              <BellRing className="h-3.5 w-3.5 text-primary shrink-0" />
              🏆 Token rewards and milestone achievements
            </li>
          </ul>
        </div>

        {/* Permission status */}
        {permission === "denied" && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <strong>Notifications blocked.</strong> Please enable them in your browser settings:
            <br />
            <span className="text-xs opacity-80">
              Click the lock icon in the address bar → Notifications → Allow
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {!isSubscribed ? (
            <Button
              onClick={subscribe}
              disabled={isLoading || permission === "denied"}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              {isLoading ? "Enabling..." : "Enable Notifications"}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={sendTest}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <BellRing className="h-4 w-4" />
                Send Test Alert
              </Button>
              <Button
                variant="ghost"
                onClick={unsubscribe}
                disabled={isLoading}
                className="flex items-center gap-2 text-muted-foreground hover:text-destructive"
              >
                <BellOff className="h-4 w-4" />
                {isLoading ? "Disabling..." : "Disable"}
              </Button>
            </>
          )}
        </div>

        {/* Install hint for mobile */}
        <p className="text-xs text-muted-foreground">
          💡 <strong>Tip:</strong> For the best experience on mobile, install Viral Beat as an app:
          tap <em>Share → Add to Home Screen</em> on iOS, or <em>Menu → Install App</em> on Android.
        </p>
      </CardContent>
    </Card>
  );
}
