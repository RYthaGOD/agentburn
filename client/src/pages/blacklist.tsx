import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Shield, Trash2, Plus, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useWallet } from "@solana/wallet-adapter-react";

interface BlacklistEntry {
  id: string;
  tokenMint: string;
  tokenSymbol: string | null;
  tokenName: string | null;
  reason: string;
  severity: "warning" | "critical";
  addedBy: string;
  notes: string | null;
  bundleDetectionScore: number | null;
  suspiciousWalletCount: number | null;
  avgTimeBetweenTxs: number | null;
  createdAt: string;
}

export default function Blacklist() {
  const { toast } = useToast();
  const { publicKey } = useWallet();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newToken, setNewToken] = useState({
    tokenMint: "",
    tokenSymbol: "",
    tokenName: "",
    reason: "manual",
    severity: "warning" as "warning" | "critical",
    notes: "",
  });

  // Fetch blacklisted tokens
  const { data: blacklist = [], isLoading } = useQuery<BlacklistEntry[]>({
    queryKey: ["/api/blacklist"],
  });

  // Remove from blacklist mutation
  const removeMutation = useMutation({
    mutationFn: async (tokenMint: string) => {
      return apiRequest("DELETE", `/api/blacklist/${tokenMint}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] });
      toast({
        title: "Token removed",
        description: "Token has been removed from the blacklist",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove token from blacklist",
        variant: "destructive",
      });
    },
  });

  // Add to blacklist mutation
  const addMutation = useMutation({
    mutationFn: async (data: typeof newToken) => {
      if (!publicKey) throw new Error("Wallet not connected");
      
      return apiRequest("POST", "/api/blacklist", {
        ...data,
        addedBy: publicKey.toBase58(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] });
      toast({
        title: "Token blacklisted",
        description: "Token has been added to the blacklist",
      });
      setIsAddDialogOpen(false);
      setNewToken({
        tokenMint: "",
        tokenSymbol: "",
        tokenName: "",
        reason: "manual",
        severity: "warning",
        notes: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add token to blacklist",
        variant: "destructive",
      });
    },
  });

  const handleRemove = (tokenMint: string) => {
    if (confirm("Are you sure you want to remove this token from the blacklist?")) {
      removeMutation.mutate(tokenMint);
    }
  };

  const handleAdd = () => {
    if (!newToken.tokenMint.trim()) {
      toast({
        title: "Error",
        description: "Token address is required",
        variant: "destructive",
      });
      return;
    }
    
    addMutation.mutate(newToken);
  };

  const getSeverityColor = (severity: string) => {
    return severity === "critical" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      bundle_activity: "Bundle Activity",
      rug_pull: "Rug Pull",
      scam: "Scam",
      poor_performance: "Poor Performance",
      manual: "Manual Block",
    };
    return labels[reason] || reason;
  };

  return (
    <div className="space-y-6" data-testid="page-blacklist">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Token Blacklist
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage tokens flagged for suspicious activity. The AI bot automatically avoids blacklisted tokens.
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-blacklist">
              <Plus className="h-4 w-4 mr-2" />
              Add Token
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Token to Blacklist</DialogTitle>
              <DialogDescription>
                Manually blacklist a token to prevent the AI bot from trading it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tokenMint">Token Address *</Label>
                <Input
                  id="tokenMint"
                  data-testid="input-token-mint"
                  placeholder="Enter Solana token address"
                  value={newToken.tokenMint}
                  onChange={(e) => setNewToken({ ...newToken, tokenMint: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="tokenSymbol">Symbol (optional)</Label>
                <Input
                  id="tokenSymbol"
                  data-testid="input-token-symbol"
                  placeholder="e.g. SOL"
                  value={newToken.tokenSymbol}
                  onChange={(e) => setNewToken({ ...newToken, tokenSymbol: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="tokenName">Name (optional)</Label>
                <Input
                  id="tokenName"
                  data-testid="input-token-name"
                  placeholder="e.g. Solana"
                  value={newToken.tokenName}
                  onChange={(e) => setNewToken({ ...newToken, tokenName: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Select value={newToken.reason} onValueChange={(value) => setNewToken({ ...newToken, reason: value })}>
                  <SelectTrigger data-testid="select-reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bundle_activity">Bundle Activity</SelectItem>
                    <SelectItem value="rug_pull">Rug Pull</SelectItem>
                    <SelectItem value="scam">Scam</SelectItem>
                    <SelectItem value="poor_performance">Poor Performance</SelectItem>
                    <SelectItem value="manual">Manual Block</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select value={newToken.severity} onValueChange={(value: "warning" | "critical") => setNewToken({ ...newToken, severity: value })}>
                  <SelectTrigger data-testid="select-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  data-testid="textarea-notes"
                  placeholder="Additional details about why this token is being blacklisted"
                  value={newToken.notes}
                  onChange={(e) => setNewToken({ ...newToken, notes: e.target.value })}
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleAdd} 
                disabled={addMutation.isPending || !publicKey}
                className="w-full"
                data-testid="button-submit-blacklist"
              >
                {addMutation.isPending ? "Adding..." : "Add to Blacklist"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blacklisted</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-blacklisted">{blacklist.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Threats</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-critical-count">
              {blacklist.filter(t => t.severity === "critical").length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bundle Activity Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-bundle-count">
              {blacklist.filter(t => t.reason === "bundle_activity").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blacklist Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blacklisted Tokens</CardTitle>
          <CardDescription>
            These tokens are automatically filtered out during AI bot scans
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : blacklist.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No tokens blacklisted yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {blacklist.map((entry) => (
                <Card key={entry.id} data-testid={`card-blacklist-${entry.tokenMint}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-mono text-sm truncate" data-testid={`text-token-mint-${entry.tokenMint}`}>
                            {entry.tokenMint}
                          </h3>
                          {entry.tokenSymbol && (
                            <Badge variant="outline">{entry.tokenSymbol}</Badge>
                          )}
                          <Badge className={getSeverityColor(entry.severity)}>
                            {entry.severity}
                          </Badge>
                          <Badge variant="outline">{getReasonLabel(entry.reason)}</Badge>
                        </div>
                        
                        {entry.tokenName && (
                          <p className="text-sm text-muted-foreground mb-2">{entry.tokenName}</p>
                        )}
                        
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground mb-2">{entry.notes}</p>
                        )}
                        
                        {/* Bundle Detection Metadata */}
                        {entry.bundleDetectionScore !== null && (
                          <div className="flex flex-wrap gap-4 mt-3 p-3 bg-muted/50 rounded-md">
                            <div>
                              <p className="text-xs text-muted-foreground">Bundle Score</p>
                              <p className="text-sm font-bold" data-testid={`text-bundle-score-${entry.tokenMint}`}>
                                {entry.bundleDetectionScore}/100
                              </p>
                            </div>
                            {entry.suspiciousWalletCount !== null && (
                              <div>
                                <p className="text-xs text-muted-foreground">Suspicious Wallets</p>
                                <p className="text-sm font-bold">{entry.suspiciousWalletCount}</p>
                              </div>
                            )}
                            {entry.avgTimeBetweenTxs !== null && (
                              <div>
                                <p className="text-xs text-muted-foreground">Avg Time Between Txs</p>
                                <p className="text-sm font-bold">
                                  {(entry.avgTimeBetweenTxs / 1000).toFixed(1)}s
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>Added by: {entry.addedBy === "system" ? "Auto-detected" : entry.addedBy.slice(0, 8) + "..."}</span>
                          <span>•</span>
                          <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(entry.tokenMint)}
                        disabled={removeMutation.isPending}
                        data-testid={`button-remove-${entry.tokenMint}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
