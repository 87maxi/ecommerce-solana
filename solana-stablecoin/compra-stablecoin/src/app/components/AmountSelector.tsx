"use client";

import { FC, useState, useEffect } from 'react';

interface AmountSelectorProps {
    amount: number;
    onChange: (amount: number) => void;
    min?: number;
    max?: number;
}

const AmountSelector: FC<AmountSelectorProps> = ({
    amount,
    onChange,
    min = 10,
    max = 10000
}) => {
    const [inputValue, setInputValue] = useState(amount.toString());
    const [error, setError] = useState<string | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const quickAmounts = [50, 100, 250, 500, 1000];

    useEffect(() => {
        setInputValue(amount.toString());
    }, [amount]);

    const handleQuickAmount = (value: number) => {
        setIsAnimating(true);
        onChange(value);
        setInputValue(value.toString());
        setError(null);

        setTimeout(() => setIsAnimating(false), 300);
    };

    const handleInputChange = (value: string) => {
        setInputValue(value);

        const numValue = parseFloat(value);

        if (value === '' || isNaN(numValue)) {
            setError(null);
            return;
        }

        if (numValue < min) {
            setError(`El monto mínimo es €${min}`);
        } else if (numValue > max) {
            setError(`El monto máximo es €${max.toLocaleString()}`);
        } else {
            setError(null);
            onChange(numValue);
        }
    };

    const handleInputBlur = () => {
        const numValue = parseFloat(inputValue);
        if (isNaN(numValue) || inputValue === '') {
            setInputValue(amount.toString());
            setError(null);
        } else if (numValue < min) {
            setInputValue(min.toString());
            onChange(min);
            setError(null);
        } else if (numValue > max) {
            setInputValue(max.toString());
            onChange(max);
            setError(null);
        }
    };

    return (
        <div className="space-y-5">
            {/* Quick Amount Buttons */}
            <div>
                <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">
                    Montos Rápidos
                </label>
                <div className="grid grid-cols-5 gap-2">
                    {quickAmounts.map((quickAmount) => (
                        <button
                            key={quickAmount}
                            type="button"
                            onClick={() => handleQuickAmount(quickAmount)}
                            className={`
                py-2.5 px-2 rounded-lg font-semibold text-sm transition-all duration-200
                ${amount === quickAmount
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white border border-slate-700/50 hover:border-indigo-500/30'
                                }
              `}
                        >
                            €{quickAmount}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Amount Input */}
            <div>
                <label htmlFor="custom-amount" className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        Monto Personalizado
                    </span>
                    <span className="text-xs text-slate-500">
                        Mín: €{min} | Máx: €{max.toLocaleString()}
                    </span>
                </label>

                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10">
                        <span className={`
              text-2xl transition-all duration-300
              ${error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-indigo-400'}
            `}>
                            €
                        </span>
                        <div className="h-6 w-px bg-slate-700"></div>
                    </div>

                    <input
                        id="custom-amount"
                        type="number"
                        min={min}
                        max={max}
                        step="0.01"
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onBlur={handleInputBlur}
                        className={`
              w-full pl-14 pr-4 py-4 bg-slate-900/60 rounded-xl text-white text-3xl font-mono
              transition-all duration-300 outline-none placeholder:text-slate-700
              ${error
                                ? 'border-2 border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                : 'border border-slate-600/50 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500'
                            }
            `}
                        placeholder="0.00"
                    />

                    {/* Animated indicator */}
                    {!error && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <div className={`
                transition-all duration-300
                ${isAnimating ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
              `}>
                                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mt-2 flex items-center gap-2 text-red-400 text-sm animate-in slide-in-from-top-1 duration-200">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Amount Preview */}
            <div className="flex justify-between items-center p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                        Invertirás
                    </span>
                    <span className="text-white font-mono font-bold text-lg">
                        €{amount.toFixed(2)}
                    </span>
                </div>

                <div className="text-slate-500 px-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </div>

                <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                        Recibirás
                    </span>
                    <div className={`
            flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20
            transition-all duration-300
            ${isAnimating ? 'scale-110' : 'scale-100'}
          `}>
                        <strong className="text-emerald-400 text-lg font-mono tracking-tight">
                            {amount.toFixed(2)}
                        </strong>
                        <span className="text-emerald-500/70 text-xs font-bold">EURT</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AmountSelector;
