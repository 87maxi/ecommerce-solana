'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

import ProductModal from '../../components/ProductModal';
import { useContract } from '../../hooks/useContract';
import { normalizeProduct, normalizeArrayResponse } from '../../lib/contractUtils';
import { formatAddress } from '../../lib/utils';
import { Product } from '../../types';
import { RoleGuard } from '../../components/RoleGuard';

export default function ProductsPage() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const ecommerceContract = useContract('Ecommerce', connection, { publicKey }, null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCompanyOwner, setIsCompanyOwner] = useState(false);

  const loadProducts = async () => {
    if (!ecommerceContract || !publicKey) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Loading products...');

      // 1. Verificar si el usuario es dueño de alguna empresa
      let userIsOwner = false;
      try {
        const companyIdsResult = await ecommerceContract.getAllCompanies();
        const companyIds = normalizeArrayResponse(companyIdsResult);

        for (const id of companyIds) {
          const company = await ecommerceContract.getCompany(id);
          if (company.owner.toLowerCase() === publicKey.toBase58().toLowerCase()) {
            userIsOwner = true;
            break;
          }
        }
        setIsCompanyOwner(userIsOwner);
      } catch (err) {
        console.warn('Error checking company ownership:', err);
        // Continuar de todos modos para cargar productos
      }

      // 2. Cargar todos los productos
      const productIdsResult = await ecommerceContract.getAllProducts();
      const productIds = normalizeArrayResponse(productIdsResult);

      if (productIds.length === 0) {
        setProducts([]);
        return;
      }

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
      const validProducts = productResults.filter((p): p is Product => p !== null);

      setProducts(validProducts);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && ecommerceContract) {
      loadProducts();
    } else if (!connected) {
      setLoading(false);
    }
  }, [connected, ecommerceContract, publicKey]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (productData: any) => {
    if (!ecommerceContract) return;

    try {
      setLoading(true);
      setError(null);

      // We need to pass the transaction wait promise to the modal
      // This is a simplified mock for the transition
      const mockWait = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { status: 1 };
      };

      if (editingProduct) {
        // En un contrato real, habría una función updateProduct
        console.log('Updating product:', productData);
        // Mock update
        await mockWait();
      } else {
        console.log('Adding product:', productData);
        // En nuestro contrato original, addProduct no tomaba todos estos parámetros
        // Pero asumimos que la interfaz de Anchor lo hará
        const tx = await ecommerceContract.addProduct(
          productData.companyId,
          productData.name,
          productData.description,
          productData.price, // Convertir a BigInt o BN si es necesario
          productData.stock,
          productData.image || ''
        );
        // If it's a real anchor program, it returns a tx signature string
        console.log('Transaction sent:', tx);
      }

      await loadProducts();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Failed to save product');
      throw err; // Re-throw para que el modal maneje el error
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-slate-900 rounded-2xl border border-cyan-500/20 shadow-2xl">
        <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 mb-6 animate-pulse">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4 text-center">
          Acceso Restringido
        </h2>
        <p className="text-slate-400 text-center max-w-md mb-8">
          Por favor, conecta tu billetera de Solana para acceder a la gestión de productos del
          E-Commerce.
        </p>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin', 'company_owner']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Catálogo de Productos</h1>
            <p className="text-slate-400 mt-1">
              Gestiona el inventario, precios y disponibilidad de los productos.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadProducts}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2 border border-slate-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Actualizar
            </button>
            <button
              onClick={handleAddProduct}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-purple-500 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/25"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nuevo Producto
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-400 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-700/50 text-xs uppercase tracking-wider text-slate-400">
                  <th className="p-4 font-semibold">Producto</th>
                  <th className="p-4 font-semibold">Empresa ID</th>
                  <th className="p-4 font-semibold text-right">Precio (EURT)</th>
                  <th className="p-4 font-semibold text-center">Stock</th>
                  <th className="p-4 font-semibold text-center">Estado</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading && products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-400">Cargando catálogo...</p>
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <svg
                          className="w-16 h-16 mb-4 opacity-50"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                        <p className="text-lg font-medium text-slate-300">
                          No hay productos registrados
                        </p>
                        <p className="text-sm mt-1">
                          Añade el primer producto para comenzar a vender.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map(product => (
                    <tr key={product.id} className="hover:bg-slate-700/20 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg
                                className="w-6 h-6 text-slate-500"
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
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{product.name}</div>
                            <div
                              className="text-xs text-slate-400 line-clamp-1 max-w-xs"
                              title={product.description}
                            >
                              {product.description || 'Sin descripción'}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                              ID: {product.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          #{product.companyId}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-cyan-400">{product.price}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            product.stock > 10
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : product.stock > 0
                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                            product.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                          title="Editar producto"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isModalOpen && (
          <ProductModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveProduct}
            product={editingProduct || undefined}
          />
        )}
      </div>
    </RoleGuard>
  );
}
