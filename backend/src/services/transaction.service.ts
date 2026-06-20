export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  confidence: number;
}

export function parseTransaction(text: string): ParsedTransaction | null {
  let date: Date | null = null;
  let description = '';
  let amount = 0;
  let confidence = 0;

  // 1. Parse Date
  const dateRegex1 = /(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})/;
  const dateRegex2 = /(\d{2})\/(\d{2})\/(\d{2,4})/;
  const dateRegex3 = /(\d{4})-(\d{2})-(\d{2})/;

  let dateMatch = text.match(dateRegex1) || text.match(dateRegex2) || text.match(dateRegex3);
  let textWithoutDate = text;

  if (dateMatch) {
    textWithoutDate = text.replace(dateMatch[0], '');
    if (text.match(dateRegex1)) {
        date = new Date(`${dateMatch[1]} ${dateMatch[2]} ${dateMatch[3].length === 2 ? '20'+dateMatch[3] : dateMatch[3]} UTC`);
    } else if (text.match(dateRegex2)) {
        date = new Date(`${dateMatch[3].length === 2 ? '20'+dateMatch[3] : dateMatch[3]}-${dateMatch[1]}-${dateMatch[2]} UTC`);
    } else {
        date = new Date(`${dateMatch[0]} UTC`);
    }
    if (!isNaN(date.getTime())) confidence += 0.3;
  }

  // 2. Parse Amount
  const amountRegex = /(-?)(?:₹|Rs\.?|\$)\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/i;
  const fallbackAmountRegex = /(?:Amount:\s*)(-?[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/i;
  const trailingAmountRegex = /(-?[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)\s*(Dr|Cr|debited|credited)/i;

  let amtMatch = textWithoutDate.match(amountRegex) || textWithoutDate.match(fallbackAmountRegex) || textWithoutDate.match(trailingAmountRegex);
  
  if (amtMatch) {
    // If amountRegex was used, amtMatch[1] is the minus sign (if any), and amtMatch[2] is the number
    // For other regexes, amtMatch[1] is the number (possibly with minus)
    let numStr = amtMatch.length > 2 && amtMatch[2] !== undefined ? amtMatch[2] : amtMatch[1];
    let isNegativeMatch = amtMatch[1] === '-' || numStr.startsWith('-');
    
    let parsedAmount = parseFloat(numStr.replace(/,/g, ''));
    
    const isDebit = /debited|Dr/i.test(text) && !/credited|Cr|\+/i.test(text);
    const isCredit = /credited|Cr|\+/i.test(text);
    
    // Explicit negative check from fallback
    if (isNegativeMatch) {
        parsedAmount = -Math.abs(parsedAmount);
        confidence += 0.2;
    } else if (isDebit) {
      parsedAmount = -Math.abs(parsedAmount);
      confidence += 0.2;
    } else if (isCredit) {
      parsedAmount = Math.abs(parsedAmount);
      confidence += 0.2;
    }

    amount = parsedAmount;
    confidence += 0.4;
    
    textWithoutDate = textWithoutDate.replace(amtMatch[0], '');
  }

  // 3. Parse Description
  let cleanedText = textWithoutDate
    .replace(/(Date:|Description:|Amount:|debited|credited|Dr|Cr|txn\d+|→)/gi, '')
    .replace(/[^a-zA-Z0-9\s#.*-]/g, '')
    .trim()
    .replace(/\s+/g, ' ');

  if (cleanedText.length > 0) {
    description = cleanedText;
    confidence += 0.1;
  }

  if (!date || amount === 0 || !description || isNaN(date.getTime())) {
    return null;
  }

  confidence = Math.min(confidence, 1.0);

  return { date, description, amount, confidence };
}

export function parseTransactions(text: string): ParsedTransaction[] {
  // If the entire text contains only ONE date, treat it as a single transaction (handles multi-line samples like Sample 1 and 2)
  const dateRegex1G = /(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})/g;
  const dateRegex2G = /(\d{2})\/(\d{2})\/(\d{2,4})/g;
  const dateRegex3G = /(\d{4})-(\d{2})-(\d{2})/g;
  
  const allDates = [
    ...(text.match(dateRegex1G) || []),
    ...(text.match(dateRegex2G) || []),
    ...(text.match(dateRegex3G) || [])
  ];

  if (allDates.length === 1) {
    const parsed = parseTransaction(text.replace(/\r?\n/g, ' '));
    if (parsed && parsed.date && parsed.amount !== 0) {
      return [parsed];
    }
  }

  // Split by common line breaks
  const lines = text.split(/\r?\n|(?<=\d{2}\.\d{2}\s)/);
  const transactions: ParsedTransaction[] = [];
  
  // Also try splitting by date patterns if it's all on one line
  const dateRegex1 = /(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})/;
  const dateRegex2 = /(\d{2})\/(\d{2})\/(\d{2,4})/;
  const dateRegex3 = /(\d{4})-(\d{2})-(\d{2})/;
  
  let currentBlock = text;
  
  // Check if it's a giant single line bank statement chunk
  if (lines.length <= 2) {
    const tokens = text.split(/\s+/);
    let currentLineTokens: string[] = [];
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (dateRegex1.test(token) || dateRegex2.test(token) || dateRegex3.test(token)) {
            if (currentLineTokens.length > 0) {
                const parsed = parseTransaction(currentLineTokens.join(' '));
                if (parsed) transactions.push(parsed);
                currentLineTokens = [];
            }
        }
        currentLineTokens.push(token);
    }
    if (currentLineTokens.length > 0) {
        const parsed = parseTransaction(currentLineTokens.join(' '));
        if (parsed) transactions.push(parsed);
    }
    
    if (transactions.length > 0) {
        return transactions;
    }
  }

  // Process standard multiline text
  for (const line of lines) {
    if (!line.trim()) continue;
    const parsed = parseTransaction(line);
    if (parsed) {
      transactions.push(parsed);
    }
  }

  return transactions;
}
