import { parseTransaction } from './src/services/transaction.service';

const s1 = `Date: 11 Dec 2025\nDescription: STARBUCKS COFFEE MUMBAI\nAmount: -420.00`;
const s2 = `Uber Ride * Airport Drop\n12/11/2025 → ₹1,250.00 debited`;
const s3 = `txn123 2025-12-10 Amazon.in Order #403 ₹2,999 Dr`;

async function test() {
    console.log("S1", parseTransaction(s1));
    console.log("S2", parseTransaction(s2));
    console.log("S3", parseTransaction(s3));
}
test();
