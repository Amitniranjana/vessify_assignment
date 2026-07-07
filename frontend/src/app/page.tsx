import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Pass session token securely from server to the client component
  // Usually the client component can fetch it, but passing it directly can be faster
  const initialTransactions = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080'}/api/transactions?limit=20`, {
    headers: {
      Authorization: `Bearer ${(session as any).sessionToken}`
    }
  }).then(res => res.json()).catch(() => ({ data: [], nextCursor: undefined }));

  return (
    <DashboardClient 
      initialData={initialTransactions.data || []} 
      initialCursor={initialTransactions.nextCursor} 
    />
  );
}
