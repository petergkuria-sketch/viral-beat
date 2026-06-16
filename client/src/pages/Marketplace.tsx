import { useState } from "react";
import { BackToDashboard } from "@/components/BackToDashboard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { showTokenNotification } from "@/lib/tokenNotifications";
import { Loader2, ShoppingCart, Check, Sparkles, TrendingUp, Award, Percent, Headphones, Star, Coins } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const categoryIcons = {
  analytics: TrendingUp,
  boost: Sparkles,
  badge: Award,
  discount: Percent,
  support: Headphones,
};

const categoryColors = {
  analytics: "from-blue-500 to-cyan-500",
  boost: "from-purple-500 to-pink-500",
  badge: "from-yellow-500 to-orange-500",
  discount: "from-green-500 to-emerald-500",
  support: "from-red-500 to-rose-500",
};

export default function Marketplace() {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  const { data: items, isLoading } = trpc.marketplace.getItems.useQuery();
  const { data: purchases, refetch: refetchPurchases } = trpc.marketplace.getUserPurchases.useQuery();
  const { data: balance } = trpc.tokens.getBalance.useQuery();

  const purchaseMutation = trpc.marketplace.purchaseItem.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully purchased: ${data.item.name}!`);
      
      // Show token notification
      if (balance && selectedItem) {
        showTokenNotification("spend_marketplace", {
          amount: -selectedItem.cost,
          newBalance: balance.balance - selectedItem.cost,
          description: selectedItem.name,
        });
      }
      
      refetchPurchases();
      setShowPurchaseDialog(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handlePurchaseClick = (item: any) => {
    setSelectedItem(item);
    setShowPurchaseDialog(true);
  };

  const confirmPurchase = () => {
    if (selectedItem) {
      purchaseMutation.mutate({ itemId: selectedItem.id });
    }
  };

  const isOwned = (itemId: number) => {
    return purchases?.some(p => p.itemId === itemId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050b1a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b1a] text-white">
      <BackToDashboard />
      
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div>
          <Breadcrumb />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Token Marketplace
              </h1>
              <p className="text-gray-400 mt-2">
                Unlock premium features and boost your experience with VB Tokens
              </p>
            </div>
            <Card className="bg-[#0d1e36] border-[#1e3a5f]">
              <CardContent className="p-4 flex items-center gap-3">
                <Coins className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Your Balance</p>
                  <p className="text-2xl font-bold">{balance?.balance || 0} VBT</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Owned Items */}
        {purchases && purchases.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-400" />
              Your Unlocked Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchases.map((purchase) => {
                const Icon = categoryIcons[purchase.itemCategory as keyof typeof categoryIcons];
                const gradient = categoryColors[purchase.itemCategory as keyof typeof categoryColors];
                const isExpired = purchase.expiresAt && new Date(purchase.expiresAt) < new Date();
                
                return (
                  <Card key={purchase.id} className="bg-[#0d1e36] border-[#1e3a5f] relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full`} />
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Check className="w-3 h-3 mr-1" />
                          Owned
                        </Badge>
                      </div>
                      <CardTitle className="mt-4">{purchase.itemName}</CardTitle>
                      <CardDescription>{purchase.itemDescription}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      {purchase.expiresAt ? (
                        <p className="text-sm text-gray-400">
                          {isExpired ? "Expired" : `Expires: ${new Date(purchase.expiresAt).toLocaleDateString()}`}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">Permanent</p>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Items */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-purple-400" />
            Available Items
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items?.map((item) => {
              const Icon = categoryIcons[item.category as keyof typeof categoryIcons];
              const gradient = categoryColors[item.category as keyof typeof categoryColors];
              const owned = isOwned(item.id);
              
              return (
                <Card key={item.id} className="bg-[#0d1e36] border-[#1e3a5f] relative overflow-hidden hover:border-[#2e4a6f] transition-colors">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full`} />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      {owned && (
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Check className="w-3 h-3 mr-1" />
                          Owned
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-4">{item.name}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-yellow-400" />
                      <span className="text-2xl font-bold">{item.cost}</span>
                      <span className="text-gray-400">VBT</span>
                    </div>
                    <Button
                      onClick={() => handlePurchaseClick(item)}
                      disabled={owned || purchaseMutation.isPending}
                      className={`bg-gradient-to-r ${gradient}`}
                    >
                      {owned ? "Owned" : "Purchase"}
                    </Button>
                  </CardFooter>
                  {item.duration && (
                    <div className="px-6 pb-4">
                      <p className="text-xs text-gray-400">Duration: {item.duration} days</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="bg-[#0d1e36] border-[#1e3a5f] text-white">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to purchase this item?
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <Card className="bg-[#050b1a] border-[#1e3a5f]">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Item:</span>
                    <span className="font-semibold">{selectedItem.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Cost:</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      {selectedItem.cost} VBT
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Your Balance:</span>
                    <span className="font-semibold">{balance?.balance || 0} VBT</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#1e3a5f] pt-2">
                    <span className="text-gray-400">After Purchase:</span>
                    <span className={`font-semibold ${(balance?.balance || 0) - selectedItem.cost < 0 ? "text-red-400" : "text-green-400"}`}>
                      {(balance?.balance || 0) - selectedItem.cost} VBT
                    </span>
                  </div>
                </CardContent>
              </Card>
              {(balance?.balance || 0) < selectedItem.cost && (
                <p className="text-sm text-red-400">
                  Insufficient tokens! You need {selectedItem.cost - (balance?.balance || 0)} more VBT.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPurchaseDialog(false)}
              className="border-[#1e3a5f] hover:bg-[#1e3a5f]"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPurchase}
              disabled={purchaseMutation.isPending || (balance?.balance || 0) < (selectedItem?.cost || 0)}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              {purchaseMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
