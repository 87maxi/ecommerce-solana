'use client';

import { ReactNode } from 'react';
import { useRole } from '../contexts/RoleContext';
import { UserRole } from '../hooks/useUserRole';
import Link from 'next/link';

type RoleGuardProps = {
    children: ReactNode;
    allowedRoles: UserRole[];
};

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { roleInfo, isLoading } = useRole();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Verificando permisos...</span>
            </div>
        );
    }

    if (!allowedRoles.includes(roleInfo.role)) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-red-500/30 py-8 px-4 shadow-xl shadow-red-500/10 rounded-2xl sm:px-10 text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-red-500/20 to-rose-500/20 border-2 border-red-500/30 mb-4">
                            <svg
                                className="h-8 w-8 text-red-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                            Acceso Denegado
                        </h2>
                        <p className="text-slate-400 mb-6">
                            No tienes permisos para ver esta página.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-lg text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-200"
                        >
                            Volver al Inicio
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
