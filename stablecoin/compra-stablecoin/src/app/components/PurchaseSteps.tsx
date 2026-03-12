"use client";

import { FC } from 'react';

export type StepStatus = 'pending' | 'current' | 'completed';

export interface Step {
    id: number;
    name: string;
    description: string;
    status: StepStatus;
    icon: JSX.Element;
}

interface PurchaseStepsProps {
    currentStep: number;
}

const PurchaseSteps: FC<PurchaseStepsProps> = ({ currentStep }) => {
    const steps: Step[] = [
        {
            id: 1,
            name: 'Monto',
            description: 'Selecciona cantidad',
            status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'pending',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
            ),
        },
        {
            id: 2,
            name: 'Wallet',
            description: 'Conecta MetaMask',
            status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'pending',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
        },
        {
            id: 3,
            name: 'Pago',
            description: 'Completa pago',
            status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'pending',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
        },
        {
            id: 4,
            name: 'Confirmación',
            description: 'Recibe tokens',
            status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'current' : 'pending',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
            ),
        },
    ];

    const getStepStyles = (status: StepStatus) => {
        switch (status) {
            case 'completed':
                return {
                    circle: 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]',
                    text: 'text-emerald-400',
                    description: 'text-emerald-500/70',
                    icon: 'text-white',
                };
            case 'current':
                return {
                    circle: 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.6)] animate-pulse',
                    text: 'text-indigo-300 font-bold',
                    description: 'text-indigo-400',
                    icon: 'text-white',
                };
            case 'pending':
            default:
                return {
                    circle: 'bg-slate-800/50 border-slate-600',
                    text: 'text-slate-500',
                    description: 'text-slate-600',
                    icon: 'text-slate-500',
                };
        }
    };

    const getConnectorStyles = (fromStatus: StepStatus, toStatus: StepStatus) => {
        if (fromStatus === 'completed') {
            return 'bg-gradient-to-r from-emerald-500 to-emerald-500';
        }
        if (fromStatus === 'current' && toStatus === 'pending') {
            return 'bg-gradient-to-r from-indigo-500 via-indigo-500/50 to-slate-700';
        }
        return 'bg-slate-700';
    };

    return (
        <div className="w-full py-8">
            {/* Desktop/Tablet View - Horizontal */}
            <div className="hidden sm:block">
                <div className="flex items-center justify-between max-w-3xl mx-auto px-4">
                    {steps.map((step, index) => {
                        const styles = getStepStyles(step.status);
                        return (
                            <div key={step.id} className="flex items-center flex-1">
                                {/* Step Circle */}
                                <div className="flex flex-col items-center relative z-10">
                                    <div
                                        className={`
                      w-14 h-14 rounded-full border-2 flex items-center justify-center
                      transition-all duration-500 ease-out
                      ${styles.circle}
                    `}
                                    >
                                        <div className={`transition-colors duration-300 ${styles.icon}`}>
                                            {step.icon}
                                        </div>
                                    </div>
                                    <div className="mt-3 text-center">
                                        <div className={`text-sm font-semibold transition-colors duration-300 ${styles.text}`}>
                                            {step.name}
                                        </div>
                                        <div className={`text-xs mt-0.5 transition-colors duration-300 ${styles.description}`}>
                                            {step.description}
                                        </div>
                                    </div>
                                </div>

                                {/* Connector Line */}
                                {index < steps.length - 1 && (
                                    <div className="flex-1 h-1 mx-2 relative top-[-32px]">
                                        <div
                                            className={`
                        h-full rounded-full transition-all duration-700 ease-out
                        ${getConnectorStyles(step.status, steps[index + 1]?.status || 'pending')}
                      `}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mobile View - Vertical Compact */}
            <div className="sm:hidden">
                <div className="flex items-center justify-center space-x-3 px-4">
                    {steps.map((step, index) => {
                        const styles = getStepStyles(step.status);
                        return (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`
                      w-10 h-10 rounded-full border-2 flex items-center justify-center
                      transition-all duration-500 ease-out
                      ${styles.circle}
                    `}
                                    >
                                        <div className={`transition-colors duration-300 ${styles.icon} scale-75`}>
                                            {step.icon}
                                        </div>
                                    </div>
                                    <div className={`text-[10px] font-semibold mt-1.5 transition-colors duration-300 ${styles.text}`}>
                                        {step.name}
                                    </div>
                                </div>

                                {index < steps.length - 1 && (
                                    <div className="w-8 h-0.5 mx-1 mb-6">
                                        <div
                                            className={`
                        h-full rounded-full transition-all duration-700 ease-out
                        ${getConnectorStyles(step.status, steps[index + 1]?.status || 'pending')}
                      `}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PurchaseSteps;
