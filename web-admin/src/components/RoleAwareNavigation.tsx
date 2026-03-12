'use client';

import Link from 'next/link';
import { useRole } from '../contexts/RoleContext';

export function RoleAwareNavigation() {
  const { roleInfo } = useRole();

  // Navigation items for different roles
  const navigationItems = {
    admin: [
      { name: 'Empresas', href: '/companies', description: 'Gestionar todas las empresas' },
      { name: 'Productos', href: '/products', description: 'Gestionar todos los productos' },
      { name: 'Clientes', href: '/customers', description: 'Gestionar todos los clientes' },
    ],
    company_owner: [
      {
        name: 'Mi Empresa',
        href: roleInfo.companyId ? `/company/${roleInfo.companyId}` : '/companies',
        description: 'Gestionar tu empresa y productos'
      },
    ],
    customer: [
      { name: 'Productos', href: '/products', description: 'Ver y comprar productos' },
      { name: 'Mis Órdenes', href: '/orders', description: 'Ver tus órdenes' },
    ],
    unregistered: [
      { name: 'Empresas', href: '/companies', description: 'Ver empresas registradas' },
      { name: 'Productos', href: '/products', description: 'Ver productos disponibles' },
    ]
  };

  // Determine which navigation items to show based on role
  const currentRole = roleInfo.role as keyof typeof navigationItems;
  const items = navigationItems[currentRole] || navigationItems.unregistered;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {items.map((item) => (
        <div key={item.name} className="lg:col-span-1">
          <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">{item.name}</h2>
          <Link
            href={item.href}
            className="block p-6 border-2 border-cyan-500/30 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30">
                {getIconForSection(item.name)}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-cyan-300">{item.name}</h3>
                <p className="text-sm text-slate-400">{item.description}</p>
              </div>
            </div>
          </Link>
        </div>
      ))}

      {/* Recent activity for all users */}
      <div className="lg:col-span-2">
        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">Actividad Reciente</h2>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 shadow-lg shadow-cyan-500/10 overflow-hidden rounded-xl">
          <div className="px-6 py-5 border-b border-cyan-500/20">
            <h3 className="text-lg leading-6 font-medium text-slate-200 flex items-center">
              <svg className="w-5 h-5 text-cyan-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Transacciones Recientes
            </h3>
          </div>
          <ul className="divide-y divide-cyan-500/10">
            <li className="px-6 py-12 text-center">
              <svg className="mx-auto h-16 w-16 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium text-slate-400">No hay transacciones recientes</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Helper function to get appropriate icon for each section
function getIconForSection(sectionName: string) {
  switch (sectionName) {
    case 'Empresas':
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'Productos':
    case 'Mi Empresa':
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case 'Clientes':
    case 'Mis Órdenes':
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    default:
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
  }
}