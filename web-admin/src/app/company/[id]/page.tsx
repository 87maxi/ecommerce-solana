'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useContract } from '../../../hooks/useContract';
import { useWallet } from '../../../hooks/useWallet';
import {
  normalizeCompany,
  normalizeProduct,
  normalizeArrayResponse,
} from '../../../lib/contractUtils';
import { formatAddress, formatDate } from '../../../lib/utils';
import { Company, Product } from '../../../types';

type ProductFormData = {
  name: string;
  description: string;
  price: string;
  imageHash: string;
  stock: string;
};

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.id as string;

  const { isConnected, provider, signer, chainId, address, switchNetwork } =
    useWallet();
  const ecommerceContract = useContract('Ecommerce', provider, signer, chainId);

  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFormData, setProductFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    imageHash: '',
    stock: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ecommerceContract || !companyId) return;

    const loadCompanyData = async () => {
      try {
        setLoading(true);

        console.log(`Loading data for company ${companyId}...`);

        // Load company details using normalization
        const companyResult = await ecommerceContract.getCompany(
          BigInt(companyId)
        );
        console.log('Company raw result:', companyResult);
        const normalizedCompany = normalizeCompany(companyResult, companyId);
        console.log('Company normalized:', normalizedCompany);
        setCompany(normalizedCompany);

        // Load company products
        const productIdsResult = await ecommerceContract.getProductsByCompany(
          BigInt(companyId)
        );
        console.log('Product IDs raw result:', productIdsResult);
        const productIds = normalizeArrayResponse(productIdsResult);
        console.log('Product IDs normalized:', productIds);
        const productData = await Promise.all(
          productIds.map(async (id: bigint) => {
            try {
              const productResult = await ecommerceContract.getProduct(id);
              console.log(`Product ${id} raw result:`, productResult);
              return normalizeProduct(productResult, id);
            } catch (e) {
              console.error(`Error loading product ${id}:`, e);
              return null;
            }
          })
        );

        const validProducts = productData.filter(
          (p): p is Product => p !== null
        );
        console.log('Final products list:', validProducts);
        setProducts(validProducts);
      } catch (err) {
        console.error('Error loading company data:', err);
        setError('Failed to load company data');
      } finally {
        setLoading(false);
      }
    };

    loadCompanyData();
  }, [ecommerceContract, companyId]);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ecommerceContract) {
      if (isConnected && chainId !== 31337 && chainId !== 1) {
        try {
          // Try to switch to local network first, if that fails, show error
          await switchNetwork(31337);
        } catch (err) {
          console.error('Failed to switch network:', err);
          setError(
            'Error al cambiar de red. Por favor, cambia manualmente a Localhost 8545 o Ethereum Mainnet.'
          );
        }
      }
      return;
    }
    if (!companyId) return;

    setSubmitting(true);
    setError(null);

    try {
      const tx = await ecommerceContract.addProduct(
        BigInt(companyId),
        productFormData.name,
        productFormData.description,
        BigInt(Math.floor(parseFloat(productFormData.price) * 1000000)), // Assuming 6 decimals
        productFormData.imageHash,
        BigInt(productFormData.stock)
      );
      await tx.wait();

      // Refresh products list
      const productIdsResult = await ecommerceContract.getProductsByCompany(
        BigInt(companyId)
      );
      const productIds = normalizeArrayResponse(productIdsResult);
      const productData = await Promise.all(
        productIds.map(async (id: bigint) => {
          const productResult = await ecommerceContract.getProduct(id);
          return normalizeProduct(productResult, id);
        })
      );

      setProducts(productData);
      setProductFormData({
        name: '',
        description: '',
        price: '',
        imageHash: '',
        stock: '',
      });
    } catch (err: any) {
      console.error('Error adding product:', err);
      setError(err.message || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  const isCompanyOwner =
    company && address && company.owner.toLowerCase() === address.toLowerCase();

  useEffect(() => {
    if (company && address) {
      console.log('Ownership Check Details:', {
        companyOwnerRaw: company.owner,
        companyOwnerLower: company.owner.toLowerCase(),
        walletAddressRaw: address,
        walletAddressLower: address.toLowerCase(),
        isMatch: isCompanyOwner,
      });
    }
  }, [company, address, isCompanyOwner]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-300">
            Cargando información de la empresa...
          </p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-slate-200">
            Empresa no encontrada
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            La empresa solicitada no existe o no tienes acceso a ella.
          </p>
          <div className="mt-8">
            <Link
              href="/companies"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Volver a Empresas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-200">
                {company.name}
              </h1>
              <p className="mt-2 text-slate-300">{company.description}</p>
              <div className="mt-2 text-sm text-slate-400 space-y-1">
                <p>ID: {company.id}</p>
                <p>Propietario: {formatAddress(company.owner)}</p>
                <p>Estado: {company.isActive ? 'Activa' : 'Inactiva'}</p>
                <p>Registrada: {formatDate(company.createdAt)}</p>
              </div>
            </div>
            <div className="flex space-x-4">
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
              <Link
                href="/companies"
                className="px-4 py-2 border border-cyan-500/30 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-900 flex items-center"
              >
                ← Volver
              </Link>
            </div>
          </div>
        </div>

        {!isCompanyOwner && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-8">
            <p className="text-yellow-800">
              Solo el propietario de esta empresa puede gestionar sus productos.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de Producto (solo para el propietario) */}
          {isCompanyOwner && (
            <div className="bg-[var(--card)] shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-200 mb-6">
                Agregar Producto
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleProductSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-slate-300"
                  >
                    Nombre del Producto
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={productFormData.name}
                    onChange={e =>
                      setProductFormData({
                        ...productFormData,
                        name: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-[var(--muted-light)] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--card)] text-[var(--foreground)]"
                    placeholder="Nombre del producto"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-slate-300"
                  >
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    value={productFormData.description}
                    onChange={e =>
                      setProductFormData({
                        ...productFormData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="mt-1 block w-full border border-[var(--muted-light)] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--card)] text-[var(--foreground)]"
                    placeholder="Descripción del producto"
                  />
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-slate-300"
                  >
                    Precio (EURT)
                  </label>
                  <input
                    type="number"
                    id="price"
                    step="0.01"
                    min="0"
                    value={productFormData.price}
                    onChange={e =>
                      setProductFormData({
                        ...productFormData,
                        price: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-[var(--muted-light)] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--card)] text-[var(--foreground)]"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="stock"
                    className="block text-sm font-medium text-slate-300"
                  >
                    Stock
                  </label>
                  <input
                    type="number"
                    id="stock"
                    min="0"
                    value={productFormData.stock}
                    onChange={e =>
                      setProductFormData({
                        ...productFormData,
                        stock: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-[var(--muted-light)] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--card)] text-[var(--foreground)]"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="imageHash"
                    className="block text-sm font-medium text-slate-300"
                  >
                    Hash de Imagen (IPFS)
                  </label>
                  <input
                    type="text"
                    id="imageHash"
                    value={productFormData.imageHash}
                    onChange={e =>
                      setProductFormData({
                        ...productFormData,
                        imageHash: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-[var(--muted-light)] rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--card)] text-[var(--foreground)]"
                    placeholder="Qm..."
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={submitting}
                                      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    !ecommerceContract && isConnected
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-[var(--primary)] hover:bg-[var(--primary-dark)]'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] disabled:opacity-50`}
                  >
                    {submitting
                      ? 'Procesando...'
                      : !ecommerceContract && isConnected
                        ? 'Cambiar a Red Soportada'
                        : 'Agregar Producto'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de Productos */}
          <div className="bg-[var(--card)] shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-200 mb-6">
              Productos de la Empresa
            </h2>

            {products.length === 0 ? (
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sección de Ventas (Solo para el propietario) */}
        {isCompanyOwner && (
          <div className="mt-8 bg-[var(--card)] shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-200 mb-6">
              Ventas de la Empresa
            </h2>
            <SalesList companyId={companyId} contract={ecommerceContract} />
          </div>
        )}
      </div>
    </div>
  );
}

function SalesList({
  companyId,
  contract,
}: {
  companyId: string;
  contract: any;
}) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSales = async () => {
      try {
        setLoading(true);
        const invoiceIdsResult = await contract.getCompanyInvoices(
          BigInt(companyId)
        );
        const invoiceIds = normalizeArrayResponse(invoiceIdsResult);

        const salesData = await Promise.all(
          invoiceIds.map(async (id: bigint) => {
            try {
              const invoice = await contract.getInvoice(id);
              const items = await contract.getInvoiceItems(id);
              return {
                id: id.toString(),
                customer: invoice.customerAddress,
                total: invoice.totalAmount.toString(),
                date: new Date(
                  Number(invoice.timestamp) * 1000
                ).toLocaleString(),
                items: items.map((item: any) => ({
                  productName: item.productName,
                  quantity: item.quantity.toString(),
                  totalPrice: item.totalPrice.toString(),
                })),
              };
            } catch (e) {
              console.error(`Error loading invoice ${id}:`, e);
              return null;
            }
          })
        );

        setInvoices(salesData.filter(s => s !== null).reverse());
      } catch (err) {
        console.error('Error loading sales:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, [companyId, contract]);

  if (loading) return <p className="text-slate-400">Cargando ventas...</p>;
  if (invoices.length === 0)
    return <p className="text-slate-400">No hay ventas registradas.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-slate-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Productos
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total (EURT)
            </th>
          </tr>
        </thead>
        <tbody className="bg-slate-800/30 divide-y divide-cyan-500/10">
          {invoices.map(sale => (
            <tr key={sale.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                {sale.date}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                {formatAddress(sale.customer)}
              </td>
              <td className="px-6 py-4 text-sm text-slate-400">
                <ul className="list-disc list-inside">
                  {sale.items.map((item: any, idx: number) => (
                    <li key={idx}>
                      {item.quantity}x {item.productName}
                    </li>
                  ))}
                </ul>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">
                {(Number(sale.total) / 100).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
