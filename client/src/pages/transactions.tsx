import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Transaction } from "@shared/schema";
import { ExternalLink, Download } from "lucide-react";
import { format } from "date-fns";

export default function Transactions() {
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-transactions">Transaction History</h1>
          <p className="text-muted-foreground">View all buyback and burn transactions</p>
        </div>
        <Button variant="outline" data-testid="button-export">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            {transactions?.length || 0} total transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No transactions yet</p>
              <p className="text-sm mt-2">Transactions will appear here once your projects start running</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-semibold text-sm">Date/Time</th>
                    <th className="pb-3 font-semibold text-sm">Type</th>
                    <th className="pb-3 font-semibold text-sm">Amount</th>
                    <th className="pb-3 font-semibold text-sm">Token Amount</th>
                    <th className="pb-3 font-semibold text-sm">Transaction</th>
                    <th className="pb-3 font-semibold text-sm">Status</th>
                    <th className="pb-3 font-semibold text-sm"></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-border last:border-0 hover-elevate"
                      data-testid={`transaction-row-${tx.id}`}
                    >
                      <td className="py-4 text-sm">
                        {format(new Date(tx.createdAt), "MMM dd, yyyy HH:mm")}
                      </td>
                      <td className="py-4">
                        <span className="capitalize text-sm font-medium">{tx.type}</span>
                      </td>
                      <td className="py-4 text-sm font-mono">
                        {tx.amount} SOL
                      </td>
                      <td className="py-4 text-sm font-mono">
                        {tx.tokenAmount || "—"}
                      </td>
                      <td className="py-4">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {tx.txSignature.slice(0, 8)}...{tx.txSignature.slice(-6)}
                        </code>
                      </td>
                      <td className="py-4">
                        <Badge
                          variant={
                            tx.status === 'completed'
                              ? 'default'
                              : tx.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          data-testid={`button-view-tx-${tx.id}`}
                        >
                          <a
                            href={`https://solscan.io/tx/${tx.txSignature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
