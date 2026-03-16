'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAVIGATION, ROUTES } from '../lib/routes';
import { WalletInfo } from './WalletInfo';
import { ConnectWalletButton } from './ConnectWalletButton';
import { useState, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRole } from '../contexts/RoleContext';
import { useIsMounted } from '../hooks/useIsMounted';
import {
  LayoutDashboard,
  Building,
  ShoppingBag,
  Users,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

export function Sidebar() {
  const isMounted = useIsMounted();
  const pathname = usePathname();
  const { connected } = useWallet();
  const { roleInfo } = useRole();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filtrar y mejorar navegación según el rol del usuario
  const filteredNavigation = useMemo(() => {
    // Definición base de navegación filtrada por rol
    let nav = [...NAVIGATION].filter(item => {
      if (!item.roles || item.roles.length === 0) return true;
      if (roleInfo.role === 'admin') return true;
      return item.roles.includes(roleInfo.role as any);
    });

    // Si es dueño de empresa, añadir acceso directo a su empresa específica
    if (roleInfo.role === 'company_owner' && roleInfo.companyId) {
      const companyIndex = nav.findIndex(item => item.name === 'Productos');
      const myCompanyItem = {
        name: 'Mi Empresa',
        href: ROUTES.COMPANY_DETAIL(roleInfo.companyId),
        icon: (props: any) => <Building {...props} />,
        roles: ['company_owner'] as any[],
      };

      // Insertar antes de productos para mejorar el flujo UX del dueño
      if (companyIndex !== -1) {
        nav.splice(companyIndex, 0, myCompanyItem);
      } else {
        nav.push(myCompanyItem);
      }
    }

    return nav;
  }, [roleInfo]);

  // Pantalla de estado desconectado (Evita hydration mismatch)
  if (!isMounted || !connected) {
    return (
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 bg-slate-900 border-r border-cyan-500/10">
        <div className="flex flex-col flex-grow justify-center items-center p-8">
          <div className="w-20 h-20 mb-8 relative">
            <div className="absolute inset-0 bg-cyan-500 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
            <div className="w-full h-full bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-2xl relative z-10">
              <ShieldCheck className="w-10 h-10 text-cyan-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 text-center tracking-tight">
            Acceso Restringido
          </h2>
          <p className="text-slate-500 text-center mb-10 text-xs leading-relaxed">
            Conecta tu billetera Solana para autenticarte en el panel de control.
          </p>
          <div className="w-full">
            <ConnectWalletButton />
          </div>
        </div>
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-center space-x-2 text-[10px] uppercase tracking-widest font-bold text-slate-600">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
            <span>Protocolo de Seguridad</span>
          </div>
        </div>
      </div>
    );
  }

  const NavLink = ({ item, onClick }: { item: any; onClick?: () => void }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={`
          group flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200
          ${
            isActive
              ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-400 border border-cyan-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
              : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-200'
          }
        `}
      >
        <Icon
          className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`}
        />
        {item.name}
        {isActive && <ChevronRight className="ml-auto w-4 h-4 text-cyan-400/50" />}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Header/Menu Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-30 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-slate-900" />
          </div>
          <span className="font-black text-white tracking-tighter">ADMIN.</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-slate-400 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <div className={`md:hidden fixed inset-0 z-40 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 w-80 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl">
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
            <span className="text-xl font-black text-white tracking-tight italic">PANEL</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-2">
            {filteredNavigation.map(item => (
              <NavLink key={item.name} item={item} onClick={() => setIsMobileMenuOpen(false)} />
            ))}
          </div>
          <div className="p-6 border-t border-slate-800 bg-slate-900/50">
            <WalletInfo />
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 bg-slate-900 border-r border-slate-800 z-20">
        <div className="flex flex-col flex-grow pt-10 overflow-y-auto scrollbar-hide">
          <div className="flex items-center flex-shrink-0 px-8 mb-10">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300 transform group-hover:-rotate-3">
                <LayoutDashboard className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter text-white">
                  ADMIN<span className="text-cyan-500">.</span>
                </h1>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold -mt-1">
                  Solana Core
                </p>
              </div>
            </Link>
          </div>

          <div className="px-6 mb-8">
            <WalletInfo />
          </div>

          <div className="flex-grow flex flex-col px-4 space-y-1.5">
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 px-4">
              Navegación Principal
            </div>
            {filteredNavigation.map(item => (
              <NavLink key={item.name} item={item} />
            ))}
          </div>
        </div>

        {/* Network Status Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span>Mainnet: Solana Devnet</span>
          </div>
        </div>
      </div>
    </>
  );
}
