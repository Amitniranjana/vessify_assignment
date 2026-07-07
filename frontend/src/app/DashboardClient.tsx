"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export default function DashboardClient({ initialData, initialCursor }: { initialData: any[], initialCursor?: string }) {
  const totalCredit = (txns: any[]) => txns.filter(t => t.type === 'CREDIT').reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const totalDebit  = (txns: any[]) => txns.filter(t => t.type === 'DEBIT').reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const [text, setText] = useState("");
  const [transactions, setTransactions] = useState<any[]>(initialData);
  const [cursor, setCursor] = useState<string | undefined>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const data = await fetchAPI("/api/transactions/extract", {
        method: "POST",
        body: JSON.stringify({ text }),
        headers: { "Content-Type": "application/json" }
      });

      if (data.data) {
        if (Array.isArray(data.data)) {
          setTransactions([...data.data, ...transactions]);
          toast.success(`Successfully extracted ${data.data.length} transactions!`);
        } else {
          setTransactions([data.data, ...transactions]);
          toast.success("Transaction extracted successfully!");
        }
        setText("");
      } else {
        toast.error(data.error || "Failed to extract");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!cursor) return;
    setFetchingMore(true);
    try {
      const data = await fetchAPI(`/api/transactions?limit=20&cursor=${cursor}`);
      if (data.data) {
        setTransactions([...transactions, ...data.data]);
        setCursor(data.nextCursor);
      }
    } catch (err: any) {
      toast.error("Failed to load more transactions");
    } finally {
      setFetchingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-white to-purple-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Vessify Finance
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Extract and analyze your statements magically.</p>
          </div>
          <Button variant="outline" className="backdrop-blur-sm bg-white/50 border-purple-200 hover:bg-purple-50 transition-all rounded-xl px-6" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>

        <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/40 border-b border-white/20 pb-4">
            <CardTitle className="text-xl flex items-center text-indigo-950">
              <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg mr-3">✨</span>
              Extract Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Textarea 
              placeholder="Paste your raw bank statement text here... (e.g. 05/01/26 STARBUCKS -$5.40)" 
              className="min-h-[140px] resize-y bg-white/50 border-indigo-100 focus:border-indigo-300 focus:ring-indigo-200 rounded-xl text-base placeholder:text-gray-400"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Button 
              onClick={handleParse} 
              disabled={loading || !text.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl px-8 shadow-md transition-all hover:scale-[1.02]"
            >
              {loading ? "Extracting..." : "Parse & Save Magic"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/40 border-b border-white/20 pb-4">
            <CardTitle className="text-xl text-indigo-950">Your Transactions</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 p-0 sm:p-6">
            {transactions.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-6xl mb-4 opacity-50">📭</div>
                <p className="text-lg">No transactions found. Paste a statement above to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-full overflow-x-auto rounded-xl border border-indigo-50 bg-white/50">
                  <Table className="w-full min-w-[600px]">
                    <TableHeader>
                      <TableRow className="border-b-indigo-100 hover:bg-transparent">
                        <TableHead className="text-indigo-900 font-semibold whitespace-nowrap">Date</TableHead>
                        <TableHead className="text-indigo-900 font-semibold w-full">Description</TableHead>
                        <TableHead className="text-right text-indigo-900 font-semibold whitespace-nowrap">Amount</TableHead>
                        <TableHead className="text-right text-indigo-900 font-semibold whitespace-nowrap">Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((t, i) => (
                        <TableRow key={t.id || i} className="group border-b-indigo-50/50 hover:bg-indigo-50/30 transition-colors animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                          <TableCell className="text-gray-600 whitespace-nowrap">{new Date(t.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</TableCell>
                        <TableCell className="font-medium text-gray-900 whitespace-normal break-all max-w-[150px] sm:max-w-[350px] md:max-w-[500px] overflow-hidden">{t.description}</TableCell>
                          <TableCell className={`text-right font-bold tracking-tight whitespace-nowrap ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'CREDIT' ? '+' : '-'}₹{Math.abs(t.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm border ${t.confidence >= 0.8 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {(t.confidence * 100).toFixed(0)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                      {/* NET SUMMARY ROW */}
                      {transactions.length > 0 && (() => {
                        const credit = totalCredit(transactions);
                        const debit  = totalDebit(transactions);
                        const net    = credit - debit;
                        const isPositive = net >= 0;
                        return (
                          <TableRow className="border-t-2 border-indigo-200 bg-indigo-50/60 font-bold">
                            <TableCell className="text-indigo-900 font-bold text-sm whitespace-nowrap">NET BALANCE</TableCell>
                            <TableCell className="text-indigo-700 text-xs">
                              <span className="inline-flex gap-3">
                                <span className="text-emerald-600">+₹{credit.toFixed(2)} credit</span>
                                <span className="text-gray-400">−</span>
                                <span className="text-rose-600">₹{debit.toFixed(2)} debit</span>
                              </span>
                            </TableCell>
                            <TableCell className={`text-right text-base font-extrabold tracking-tight whitespace-nowrap ${
                              isPositive ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${
                                isPositive
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                  : 'bg-rose-50 border-rose-300 text-rose-700'
                              }`}>
                                {isPositive ? '▲' : '▼'} {isPositive ? '+' : '-'}₹{Math.abs(net).toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        );
                      })()}
                  </TableBody>
                </Table>
                </div>
                {cursor && (
                  <div className="flex justify-center pt-8 pb-4">
                    <Button variant="outline" onClick={loadMore} disabled={fetchingMore} className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-8">
                      {fetchingMore ? "Loading..." : "Load More Transactions"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
