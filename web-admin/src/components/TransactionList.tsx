'use client';

import React from 'react';

type Transaction = {
  id: string;
  type: string;
  amount: string;
  from: string;
  to: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
};

type TransactionListProps = {
  transactions: Transaction[];
  title?: string;
};

export function TransactionList({
  transactions,
  title = 'Transacciones Recientes',
}: TransactionListProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20',
          text: 'text-emerald-300',
          border: 'border-emerald-500/30',
        };
      case 'pending':
        return {
          bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20',
          text: 'text-yellow-300',
          border: 'border-yellow-500/30',
        };
      case 'failed':
        return {
          bg: 'bg-gradient-to-r from-red-500/20 to-rose-500/20',
          text: 'text-red-300',
          border: 'border-red-500/30',
        };
      default:
        return {
          bg: 'bg-slate-700/50',
          text: 'text-slate-400',
          border: 'border-slate-600/30',
        };
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '0x000...0000';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Ordenar transacciones por fecha (más recientes primero)
  const sortedTransactions = [...transactions].sort((a, b) => {
    // Aquí podrías implementar un ordenamiento real si tuvieras timestamps reales
    return -1; // Mantener el orden actual
  });

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 shadow-lg shadow-cyan-500/10 overflow-hidden rounded-xl transition-all duration-200 hover:shadow-cyan-500/20 hover:border-cyan-500/30">
      <div className="px-6 py-5 border-b border-cyan-500/20">
        <h3 className="text-lg leading-6 font-semibold text-slate-200 flex items-center">
          <svg
            className="w-5 h-5 text-cyan-400 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9v6m14-6v-2a2 2 0 00-2-2H9a2 2 0 00-2 2"
            />
          </svg>
          {title}
        </h3>
      </div>
      <ul className="divide-y divide-cyan-500/10">
        {transactions.length === 0 ? (
          <li className="px-6 py-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-slate-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm font-medium text-slate-400">
              No hay transacciones recientes
            </p>
          </li>
        ) : (
          sortedTransactions.map(transaction => {
            const statusConfig = getStatusConfig(transaction.status);
            return (
              <li
                key={transaction.id}
                className="transition-all duration-200 hover:bg-slate-700/30"
              >
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-cyan-400 truncate">
                        {transaction.type}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                    <div className="flex-shrink-0">
                      <p className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        {transaction.amount}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      <p className="flex items-center text-sm text-slate-400">
                        <span className="text-xs px-2 py-1 rounded-md bg-slate-700/50 border border-slate-600/30 text-slate-500">
                          De
                        </span>
                        <span className="ml-2 font-mono text-slate-300">
                          {formatAddress(transaction.from)}
                        </span>
                      </p>
                      <p className="flex items-center text-sm text-slate-400">
                        <span className="text-xs px-2 py-1 rounded-md bg-slate-700/50 border border-slate-600/30 text-slate-500">
                          Para
                        </span>
                        <span className="ml-2 font-mono text-slate-300">
                          {formatAddress(transaction.to)}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center text-sm text-slate-500">
                      <svg
                        className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <time dateTime={transaction.timestamp} className="text-xs">
                        {transaction.timestamp}
                      </time>
                    </div>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
