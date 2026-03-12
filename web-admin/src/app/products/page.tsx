'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

import ProductModal from '../../components/ProductModal';
import { useContract } from '../../hooks/useContract';
import { useWallet } from '../../hooks/useWallet';
import {
  normalizeProduct,
  normalizeArrayResponse,
} from '../../lib/contractUtils';
import { formatAddress } from '../../lib/utils';
import { Product } from '../../types';

export default function ProductsPage() {
  const { isConnected, provider, signer, chainId, address } = useWallet();
  const ecommerceContract = useContract('Ecommerce', provider, signer, chainId);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCompanyOwner, setIsCompanyOwner] = useState(false);

  useEffect(() => {
    if (!ecommerceContract) {
      setLoading(false);
      return;
    }

    const loadProducts = async () => {
      try {
        setLoading(true);
        console.log('Loading all products...');

        const productIdsResult = await ecommerceContract.getAllProducts();
        console.log('All product IDs raw:', productIdsResult);

        const productIds = normalizeArrayResponse(productIdsResult);
        console.log('All product IDs normalized:', productIds);

        const productData = await Promise.all(
          productIds.map(async (id: bigint) => {
            try {
              const productResult = await ecommerceContract.getProduct(id);
              return normalizeProduct(productResult, id);
            } catch (err) {
              console.error(`Error loading product ${id}:`, err);
              return null;
            }
          })
        );

        const validProducts = productData.filter(
          (p: Product | null): p is Product => p !== null
        );
        console.log('Final products list:', validProducts);
        setProducts(validProducts);

        // Intentar obtener información de la empresa para verificación de rol
        if (validProducts.length > 0 && address) {
          try {
            const companyResult = await ecommerceContract.getCompany(
              validProducts[0].companyId
            );
            const companyOwner =
              companyResult.owner?.toString() ||
              companyResult[1]?.toString() ||
              '';
            setIsCompanyOwner(
              companyOwner.toLowerCase() === address.toLowerCase()
            );
          } catch (err) {
            console.error('Error verificando propietario de empresa:', err);
            setIsCompanyOwner(false);
          }
        }
      } catch (err) {
        console.error('Error loading products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [ecommerceContract]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-200">
            Acceso Restringido
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Por favor, conecta tu billetera para acceder al panel de
            administración.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Conectar Billetera
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleUpdateProduct = async (formData: any) => {
    if (!ecommerceContract || !editingProduct) return;

    try {
      // Actualizar producto
      const tx = await ecommerceContract.updateProduct(
        BigInt(editingProduct.id),
        formData.name,
        formData.description,
        BigInt(Math.floor(parseFloat(formData.price) * 1000000)), // Convertir a unidades de 6 decimales
        formData.imageHash
      );
      await tx.wait();

      // Actualizar stock
      const tx2 = await ecommerceContract.updateStock(
        BigInt(editingProduct.id),
        BigInt(formData.stock)
      );
      await tx2.wait();

      // Si el estado cambió
      if (formData.isActive !== editingProduct.isActive) {
        if (formData.isActive) {
          await ecommerceContract.activateProduct(BigInt(editingProduct.id));
        } else {
          await ecommerceContract.deactivateProduct(BigInt(editingProduct.id));
        }
      }

      // Actualizar producto en la lista local
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === editingProduct.id ? { ...p, ...formData } : p
        )
      );
    } catch (err: any) {
      console.error('Error updating product:', err);
      setError(err.message || 'Failed to update product');
    } finally {
      setIsModalOpen(false);
      setEditingProduct(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-200">
              Gestión de Productos
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Gestiona todos los productos registrados en el e-commerce
              descentralizado.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-cyan-500/30 rounded-md shadow-sm text-sm font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5 text-slate-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            Actualizar
          </button>
        </div>

        <div className="bg-[var(--card)] shadow rounded-lg p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-slate-300">Cargando productos...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <p className="text-yellow-800">{error}</p>
              </div>
              <Link
                href="/companies"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Ver Empresas
              </Link>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-16"
                />
              </svg>
              <p className="mt-2">No hay productos registrados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map(product => (
                <div
                  key={product.id}
                  className="border border-[var(--border)] rounded-lg p-4 hover:bg-[var(--muted-light)]"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-200">
                        {product.name}
                      </h3>
                      <p className="text-sm text-slate-300 mt-1">
                        {product.description}
                      </p>
                      <div className="mt-2 text-xs text-slate-400 space-y-1">
                        <p>ID: {product.id}</p>
                        <p>Empresa: {product.companyId}</p>
                        <p>Precio: {product.price} EURT</p>
                        <p>Stock: {product.stock}</p>
                        <p>
                          Estado: {product.isActive ? 'Activo' : 'Inactivo'}
                        </p>
                        {product.imageHash && (
                          <p>Imagen: {product.imageHash.slice(0, 12)}...</p>
                        )}
                      </div>
                    </div>
                    {isCompanyOwner && (
                      <div className="ml-4 flex-shrink-0">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          Editar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={editingProduct ? handleUpdateProduct : () => {}}
        initialData={
          editingProduct
            ? {
                name: editingProduct.name,
                description: editingProduct.description,
                price: editingProduct.price,
                imageHash: editingProduct.imageHash,
                stock: editingProduct.stock.toString(),
                isActive: editingProduct.isActive,
              }
            : undefined
        }
        isSubmitting={false}
      />
    </div>
  );
}
