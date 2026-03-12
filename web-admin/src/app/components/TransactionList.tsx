'use client';

import { useState } from 'react';

type Transaction = {
  id: string;
  user: string;
  amount: string;
  status: 'confirmed' | 'pending' | 'failed';
  time: string;
};

type TransactionListProps = {
  transactions: Transaction[];
};

export default function TransactionList({
  transactions: initialTransactions,
}: TransactionListProps) {
  const [transactions] = useState<Transaction[]>(initialTransactions);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success/20 text-success';
      case 'pending':
        return 'bg-warning/20 text-warning';
      case 'failed':
        return 'bg-danger/20 text-danger';
      default:
        return 'bg-foreground/20 text-foreground';
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 font-medium">Transaction</th>
              <th className="text-left py-3 px-2 font-medium">User</th>
              <th className="text-left py-3 px-2 font-medium">Amount</th>
              <th className="text-left py-3 px-2 font-medium">Status</th>
              <th className="text-left py-3 px-2 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr
                key={tx.id}
                className="border-b border-border last:border-b-0 hover:bg-border/5 transition-colors"
              >
                <td className="py-3 px-2 font-mono text-sm">{tx.id}</td>
                <td className="py-3 px-2">{tx.user}</td>
                <td className="py-3 px-2">{tx.amount}</td>
                <td className="py-3 px-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}
                  >
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </span>
                </td>
                <td className="py-3 px-2 text-foreground/70">{tx.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
