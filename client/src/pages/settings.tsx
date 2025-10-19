import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet-button";

export default function Settings() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-settings">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wallet Connection</CardTitle>
          <CardDescription>Connect your Solana wallet to manage projects</CardDescription>
        </CardHeader>
        <CardContent>
          <WalletButton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Address</CardTitle>
          <CardDescription>Solana address where service fees should be sent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-address">Treasury Address</Label>
            <Input
              id="payment-address"
              value="BurnBotTreasury11111111111111111111111111111"
              readOnly
              className="font-mono text-sm"
              data-testid="input-payment-address"
            />
            <p className="text-sm text-muted-foreground">
              Send your monthly service fee to this address to keep your projects active
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Configure how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              data-testid="input-email"
            />
          </div>
          <Button data-testid="button-save-settings">Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
