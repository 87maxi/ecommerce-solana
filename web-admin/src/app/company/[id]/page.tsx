'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

import { useContract } from '../../../hooks/useContract';
import {
  normalizeCompany,
  normalizeProduct,
  normalizeArrayResponse,
} from '../../../lib/contractUtils';
import { formatAddress, formatDate } from '../../../lib/utils';
import { Company, Product } from '../../../types';
import ProductModal from '../../../components/ProductModal';
import { RoleGuard } from '../../../components/RoleGuard';

export default function CompanyDetailPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'company_owner']}>
      <CompanyDetailContent />
    </RoleGuard>
  );
}

function CompanyDetailContent() {
  const params = useParams();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const ecommerceContract = useContract('Ecommerce', connection, { publicKey }, null);

  const companyIdParam = params?.id;
  const companyId = companyIdParam
    ? typeof companyIdParam === 'string'
      ? BigInt(companyIdParam)
      : BigInt(companyIdParam[0])
    : undefined;

  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Form states
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  // Product modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!ecommerceContract || !companyId || !publicKey) return;

    try {
      setLoading(true);
      setError(null);

      // Load Company Details
      const companyResult = await ecommerceContract.getCompany(companyId);
      const companyData = normalizeCompany(companyResult, companyId);
      setCompany(companyData);

      // Initialize form data
      setCompanyForm({
        name: companyData.name,
        description: companyData.description,
        isActive: companyData.isActive,
      });

      // Check ownership
      const userAddress = publicKey.toBase58().toLowerCase();
      setIsOwner(companyData.owner.toLowerCase() === userAddress);

      // Load Company Products
      const productIdsResult = await ecommerceContract.getCompanyProducts(companyId);
      const productIds = normalizeArrayResponse(productIdsResult);

      const productPromises = productIds.map(async (id: any) => {
        try {
          const productResult = await ecommerceContract.getProduct(id);
          return normalizeProduct(productResult, id);
        } catch (err) {
          console.error(`Error loading product ${id}:`, err);
          return null;
        }
      });

      const productResults = await Promise.all(productPromises);
      setProducts(productResults.filter((p): p is Product => p !== null));
    } catch (err) {
      console.error('Error loading company data:', err);
      setError(
        'Failed to load company data: ' + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && ecommerceContract) {
      loadData();
    } else if (!connected) {
      setLoading(false);
    }
  }, [connected, ecommerceContract, companyId, publicKey]);

  // Company Actions
  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ecommerceContract || !companyId) return;

    try {
      setIsSubmitting(true);
      // Asumimos que el contrato Anchor tiene updateCompany
      const tx = await ecommerceContract.updateCompany(
        companyId,
        companyForm.name,
        companyForm.description
      );
      if (tx && typeof tx.wait === 'function') await tx.wait();

      if (companyForm.isActive !== company?.isActive) {
        if (companyForm.isActive) {
          const txAct = await ecommerceContract.activateCompany(companyId);
          if (txAct && typeof txAct.wait === 'function') await txAct.wait();
        } else {
          const txDeact = await ecommerceContract.deactivateCompany(companyId);
          if (txDeact && typeof txDeact.wait === 'function') await txDeact.wait();
        }
      }

      await loadData();
      setIsEditingCompany(false);
    } catch (err: any) {
      console.error('Error updating company:', err);
      setError(err.message || 'Failed to update company');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Product Actions
  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (productData: any) => {
    if (!ecommerceContract || !companyId) return;

    try {
      if (editingProduct) {
        // En un contrato Anchor real, esto sería una instrucción update_product
        console.log('Updating product:', editingProduct.id, productData);
      } else {
        // En un contrato Anchor real, esto sería una instrucción add_product
        console.log('Adding product to company:', companyId, productData);
        const tx = await ecommerceContract.addProduct(
          companyId,
          productData.name,
          productData.description,
          productData.price,
          productData.stock,
          productData.image || ''
        );
        if (tx && typeof tx.wait === 'function') await tx.wait();
      }

      await loadData();
      setIsProductModalOpen(false);
    } catch (err: any) {
      console.error('Error saving product:', err);
      throw err; // El modal maneja el error
    }
  };

  if (!connected) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-slate-900 rounded-2xl border border-cyan-500/20 shadow-2xl">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
          Acceso Restringido
        </h2>
        <p className="text-slate-400 text-center max-w-md">
          Conecta tu billetera de Solana para ver los detalles de la empresa.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-400 font-medium">Cargando información de la empresa...</span>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-700/50 shadow-xl">
        <p className="text-xl font-medium text-slate-300">Empresa no encontrada</p>
        <Link
          href="/companies"
          className="mt-4 inline-block px-6 py-2.5 bg-slate-800 text-cyan-400 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Volver a Empresas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/companies"
          className="p-2 bg-slate-800/80 text-slate-400 hover:text-white rounded-xl border border-slate-700 hover:border-cyan-500/30 transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            {company.name}
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                company.isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}
            >
              {company.isActive ? 'ACTIVA' : 'INACTIVA'}
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-mono">ID: #{company.id.toString()}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Details Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/80">
              <h2 className="text-lg font-semibold text-white">Detalles</h2>
              {isOwner && !isEditingCompany && (
                <button
                  onClick={() => setIsEditingCompany(true)}
                  className="p-2 text-slate-400 hover:text-cyan-400 bg-slate-900/50 rounded-lg transition-colors"
                  title="Editar empresa"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              )}
            </div>

            <div className="p-6">
              {isEditingCompany ? (
                <form onSubmit={handleUpdateCompany} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={companyForm.name}
                      onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-cyan-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={companyForm.description}
                      onChange={e =>
                        setCompanyForm({ ...companyForm, description: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:border-cyan-500 text-sm resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      checked={companyForm.isActive}
                      onChange={e => setCompanyForm({ ...companyForm, isActive: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                    />
                    <label className="text-sm text-slate-300">Empresa Activa</label>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditingCompany(false)}
                      className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-3 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-500 transition-colors flex justify-center"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        'Guardar'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                      Propietario
                    </h3>
                    <p className="text-sm text-cyan-400 font-mono break-all bg-slate-900/50 p-2 rounded border border-slate-700/50">
                      {company.owner}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                      Descripción
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {company.description || 'Sin descripción'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                      Registro
                    </h3>
                    <p className="text-sm text-slate-300">{formatDate(company.createdAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden min-h-[400px]">
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/80">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-cyan-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                Productos ({products.length})
              </h2>
              {isOwner && (
                <button
                  onClick={handleAddProduct}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all shadow-md flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Añadir
                </button>
              )}
            </div>

            <div className="p-0">
              {products.length === 0 ? (
                <div className="text-center py-16">
                  <svg
                    className="mx-auto h-12 w-12 text-slate-600 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-16"
                    />
                  </svg>
                  <p className="text-slate-400">Esta empresa aún no tiene productos.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {products.map(product => (
                    <div
                      key={product.id.toString()}
                      className="p-4 hover:bg-slate-700/20 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-lg border border-slate-700 flex-shrink-0 overflow-hidden">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-3 text-sm text-slate-400 mt-0.5">
                            <span className="font-medium text-cyan-400">{product.price} EURT</span>
                            <span>Stock: {product.stock}</span>
                            {!product.isActive && (
                              <span className="text-xs bg-red-500/10 text-red-400 px-1.5 rounded">
                                Inactivo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-2 text-slate-500 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct || undefined}
      />
    </div>
  );
}
