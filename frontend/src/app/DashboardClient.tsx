"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { LogOut, Trash2, TrendingUp, TrendingDown, Sparkles, History } from "lucide-react";

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  confidence: number;
};

function NetSummary({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) return null;
  const credit = transactions.filter(t => t.type === "CREDIT").reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const debit  = transactions.filter(t => t.type === "DEBIT").reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const net = credit - debit;
  const isPositive = net >= 0;

  return (
    <div className={`flex items-center justify-between rounded-xl px-5 py-4 border-2 ${isPositive ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
      <div className="flex items-center gap-4 text-sm flex-wrap">
        <span className="font-semibold text-gray-600">NET BALANCE</span>
        <span className="text-emerald-700 font-medium">+₹{credit.toFixed(2)} credit</span>
        <span className="text-gray-400">−</span>
        <span className="text-rose-700 font-medium">₹{debit.toFixed(2)} debit</span>
      </div>
      <div className={`flex items-center gap-2 font-extrabold text-lg px-4 py-1.5 rounded-full border-2 ${isPositive ? "bg-emerald-100 border-emerald-300 text-emerald-700" : "bg-rose-100 border-rose-300 text-rose-700"}`}>
        {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
        {isPositive ? "+" : "-"}₹{Math.abs(net).toFixed(2)}
      </div>
    </div>
  );
}

function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) return null;
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-indigo-50 bg-white/50">
      <Table className="w-full min-w-[580px]">
        <TableHeader>
          <TableRow className="border-b-indigo-100 hover:bg-transparent">
            <TableHead className="text-indigo-900 font-semibold whitespace-nowrap w-32">Date</TableHead>
            <TableHead className="text-indigo-900 font-semibold">Description</TableHead>
            <TableHead className="text-right text-indigo-900 font-semibold whitespace-nowrap w-32">Amount</TableHead>
            <TableHead className="text-right text-indigo-900 font-semibold whitespace-nowrap w-24">Confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t, i) => (
            <TableRow key={t.id || i} className="border-b-indigo-50/50 hover:bg-indigo-50/30 transition-colors">
              <TableCell className="text-gray-500 whitespace-nowrap text-sm">
                {new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </TableCell>
              <TableCell className="font-medium text-gray-800 text-sm max-w-[300px] truncate">{t.description}</TableCell>
              <TableCell className={`text-right font-bold whitespace-nowrap ${t.type === "CREDIT" ? "text-emerald-600" : "text-rose-600"}`}>
                {t.type === "CREDIT" ? "+" : "-"}₹{Math.abs(Number(t.amount)).toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${t.confidence >= 0.8 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                  {(t.confidence * 100).toFixed(0)}%
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function DashboardClient({ initialData, initialCursor }: { initialData: Transaction[], initialCursor?: string }) {
  const [text, setText] = useState("");
  const [latestBatch, setLatestBatch] = useState<Transaction[]>([]);
  const [history, setHistory] = useState<Transaction[]>(initialData);
  const [cursor, setCursor] = useState<string | undefined>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const data = await fetchAPI("/api/transactions/extract", {
        method: "POST",
        body: JSON.stringify({ text }),
        headers: { "Content-Type": "application/json" },
      });

      if (data.data) {
        const batch = Array.isArray(data.data) ? data.data : [data.data];
        setLatestBatch(batch);
        setHistory(prev => [...batch, ...prev]);
        toast.success(`✨ Extracted ${batch.length} transaction${batch.length > 1 ? "s" : ""}!`);
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
        setHistory(prev => [...prev, ...data.data]);
        setCursor(data.nextCursor);
      }
    } catch {
      toast.error("Failed to load more transactions");
    } finally {
      setFetchingMore(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Sab transactions delete ho jayenge. Confirm?")) return;
    setClearing(true);
    try {
      await fetchAPI("/api/transactions", { method: "DELETE" });
      setHistory([]);
      setLatestBatch([]);
      setCursor(undefined);
      toast.success("All transactions cleared!");
    } catch {
      toast.error("Failed to clear transactions");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-white to-purple-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Vessify Finance
            </h1>
            <p className="text-gray-500 mt-1 text-sm font-medium">Extract and analyze your bank statements instantly.</p>
          </div>
          <Button variant="outline" className="backdrop-blur-sm bg-white/50 border-purple-200 hover:bg-purple-50 transition-all rounded-xl px-5" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>

        {/* Extract Card */}
        <Card className="bg-white/70 backdrop-blur-2xl border border-white/50 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border-b border-white/30 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
              <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg"><Sparkles className="h-4 w-4" /></span>
              Extract Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5 pb-5">
            <Textarea
              placeholder={"Paste your raw bank statement text here...\n\nExample:\n14 Mar 2024 Zomato ₹450.00 Dr\n15 Mar 2024 SALARY Rs.25000.00 Cr"}
              className="min-h-[130px] resize-y bg-white/60 border-indigo-100 focus:border-indigo-300 rounded-xl text-sm placeholder:text-gray-400 font-mono"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Button
              onClick={handleParse}
              disabled={loading || !text.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl px-8 shadow-md transition-all hover:scale-[1.02]"
            >
              {loading ? "Extracting..." : "⚡ Parse & Save"}
            </Button>
          </CardContent>
        </Card>

        {/* Latest Batch Result */}
        {latestBatch.length > 0 && (
          <Card className="bg-white/70 backdrop-blur-2xl border-2 border-indigo-200 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-indigo-800">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse inline-block" />
                Latest Parse — {latestBatch.length} transaction{latestBatch.length > 1 ? "s" : ""} extracted
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <TransactionTable transactions={latestBatch} />
              <NetSummary transactions={latestBatch} />
            </CardContent>
          </Card>
        )}

        {/* History */}
        <Card className="bg-white/60 backdrop-blur-2xl border border-white/40 shadow-lg rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/40 border-b border-white/20 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-indigo-900">
                <History className="h-4 w-4 text-indigo-500" />
                All Transactions History
                {history.length > 0 && (
                  <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{history.length} total</span>
                )}
              </CardTitle>
              {history.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={clearing}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg text-xs"
                >
                  <Trash2 className="mr-1.5 h-3 w-3" />
                  {clearing ? "Clearing..." : "Clear All"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-5 pb-5">
            {history.length === 0 ? (
              <div className="text-center py-14 text-gray-400">
                <div className="text-5xl mb-3 opacity-40">📭</div>
                <p className="text-sm">No transactions yet. Paste a bank statement above to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <TransactionTable transactions={history} />
                <NetSummary transactions={history} />
                {cursor && (
                  <div className="flex justify-center pt-2">
                    <Button variant="outline" onClick={loadMore} disabled={fetchingMore} className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-8 text-sm">
                      {fetchingMore ? "Loading..." : "Load More"}
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
