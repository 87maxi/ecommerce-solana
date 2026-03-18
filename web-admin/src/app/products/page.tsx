'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import {
  Plus,
  Search,
  Filter,
  Package,
  Loader2,
  RefreshCw,
  Edit3,
  Trash2,
  AlertCircle,
} from 'lucide-react';

import { useContract } from '../../hooks/useContract';
import { useRole } from '../../contexts/RoleContext';
import { normalizeArrayResponse } from '../../lib/contractUtils';
import { formatAddress } from '../../lib/utils';
import { Product } from '../../types';
import { RoleGuard } from '../../components/RoleGuard';
import ProductModal from '../../components/ProductModal';

export default function ProductsPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'company_owner']}>
      <ProductsPageContent />
    </RoleGuard>
  );
}

function ProductsPageContent() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { roleInfo, isLoading: roleLoading } = useRole();

  const signer = useMemo(
    () =>
      publicKey && signTransaction && signAllTransactions
        ? { publicKey, signTransaction, signAllTransactions }
        : null,
    [publicKey, signTransaction, signAllTransactions]
  );
  const ecommerceContract = useContract('Ecommerce', connection, signer, null);

  console.log('[ProductsPage] Depuración:', {
    wallet: publicKey?.toBase58(),
    contractReady: !!ecommerceContract,
    role: roleInfo.role,
    companyId: roleInfo.companyId,
    companyNumericId: roleInfo.companyNumericId,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    if (!ecommerceContract) return;

    try {
      setLoading(true);
      setError(null);
      console.log('[ProductsPage] Solicitando productos a la blockchain...');

      // Get products from the contract (optimized for bulk fetching)
      const productsResult = await ecommerceContract.getAllProducts();
      const allProductsData = normalizeArrayResponse(productsResult);
      console.log('[ProductsPage] Datos crudos recibidos:', allProductsData);

      const filteredProducts: Product[] = allProductsData
        .filter((product: any) => {
          if (!product) return false;

          // Relajamos el filtro para asegurar que los datos cargados se visualicen
          if (roleInfo.role === 'admin' || roleInfo.role === 'loading' || !roleInfo.role) {
            return true;
          } else if (roleInfo.role === 'company_owner' && roleInfo.companyNumericId) {
            return product.companyId === roleInfo.companyNumericId;
          }
          return true; // Fallback para depuración
        })
        .map((p: any) => {
          // Normalize price (Assuming 6 decimals for EURT) if it's still raw
          let price = p.price;
          if (typeof price === 'string' && price.length > 6) {
            price = (parseFloat(price) / 1000000).toFixed(2);
          }

          return {
            id: p.id,
            companyId: p.companyId,
            name: p.name || '',
            description: p.description || '',
            price: price,
            stock: Number(p.stock || 0),
            imageHash: p.image || '',
            isActive: p.active ?? true,
          } as Product;
        });

      console.log('[ProductsPage] Productos listos para mostrar:', filteredProducts);
      setProducts(filteredProducts);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Error al cargar el catálogo de productos');
    } finally {
      setLoading(false);
    }
  }, [ecommerceContract, roleInfo]);

  useEffect(() => {
    if (!roleLoading) {
      loadProducts();
    }
  }, [loadProducts, roleLoading]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (productId: any) => {
    if (!ecommerceContract) return;

    try {
      setLoading(true);
      setError(null);
      console.log('[ProductsPage] Cambiando estado del producto:', productId);

      const tx = await ecommerceContract.toggleProductStatus(productId);
      await tx.wait();
      await loadProducts();
    } catch (err: any) {
      console.error('Error toggling product status:', err);
      setError(err.message || 'Error al cambiar el estado del producto');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    alert(
      'Funcionalidad de eliminación pendiente de implementación en contrato. Usa "Editar" para desactivarlo.'
    );
  };

  const handleSaveProduct = async (productData: any) => {
    if (!ecommerceContract) return;

    try {
      setLoading(true);
      setError(null);

      if (editingProduct) {
        // Actualizar producto existente
        const tx = await ecommerceContract.updateProduct(
          editingProduct.id,
          editingProduct.companyId,
          productData.name,
          productData.description,
          productData.price,
          productData.stock
        );
        await tx.wait();
      } else {
        // Añadir nuevo producto
        const tx = await ecommerceContract.addProduct(
          productData.companyId,
          productData.name,
          productData.description,
          productData.price,
          productData.stock
        );
        await tx.wait();
      }
      await loadProducts();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Inventario de Productos</h1>
          <p className="text-slate-400 mt-2 font-medium">
            {roleInfo.role === 'admin'
              ? 'Gestión global de inventario de todas las empresas'
              : `Gestionando productos de ${roleInfo.companyName || 'mi empresa'}`}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadProducts}
            disabled={loading}
            className="p-3 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
            title="Refrescar"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleAddProduct}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-cyan-500/20 transition-all transform hover:-translate-y-1 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Añadir Producto</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all backdrop-blur-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <select className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none transition-all cursor-pointer backdrop-blur-sm">
            <option>Todos los estados</option>
            <option>Activos</option>
            <option>Agotados</option>
            <option>Inactivos</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 flex items-center gap-4 text-rose-300">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Main Content */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div
              key={i}
              className="h-96 bg-slate-800/40 rounded-3xl border border-slate-700/50 animate-pulse"
            />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-3xl p-20 text-center backdrop-blur-sm">
          <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-12 h-12 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No se encontraron productos</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            {searchTerm
              ? `No hay resultados para "${searchTerm}". Prueba con otros términos.`
              : 'Aún no hay productos registrados. Comienza añadiendo el primero.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="group relative bg-slate-800/40 rounded-3xl border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 overflow-hidden backdrop-blur-sm flex flex-col h-full"
            >
              <div className="relative aspect-square overflow-hidden bg-slate-900/50">
                {product.imageHash ? (
                  <img
                    src={product.imageHash}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <Package className="w-20 h-20 opacity-20" />
                  </div>
                )}

                <div className="absolute top-4 left-4">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      product.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}
                  >
                    {product.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4">
                  <div className="bg-slate-900/80 backdrop-blur-md border border-white/5 px-3 py-1.5 rounded-xl flex items-center gap-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${product.stock > 0 ? 'bg-cyan-400' : 'bg-rose-500'}`}
                    />
                    <span className="text-xs font-bold text-white">{product.stock} en stock</span>
                  </div>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <span className="text-xl font-black text-cyan-400 font-mono">
                    €{product.price}
                  </span>
                </div>
                <p className="text-slate-400 text-xs line-clamp-2 mb-6 font-medium leading-relaxed h-8">
                  {product.description || 'Sin descripción disponible'}
                </p>

                <div className="mt-auto space-y-4">
                  {roleInfo.role === 'admin' && (
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-900/30 p-3 rounded-xl border border-white/5">
                      <span>Empresa</span>
                      <span className="text-slate-300 font-mono">
                        {formatAddress(product.companyId)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-600/50 transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleStatus(product.id)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        product.isActive
                          ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20'
                          : 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20'
                      }`}
                      title={product.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {product.isActive ? (
                        <Trash2 className="w-4 h-4" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProduct}
          product={editingProduct || undefined}
          companyId={roleInfo.companyNumericId}
        />
      )}
    </div>
  );
}
