'use client';

import { useParams } from 'next/navigation';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import {
  Building,
  ArrowLeft,
  Edit,
  Plus,
  Package,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ClipboardCopy,
} from 'lucide-react';

import { useContract } from '../../../hooks/useContract';
import { Company, Product } from '../../../types';
import ProductModal from '../../../components/ProductModal';
import { RoleGuard } from '../../../components/RoleGuard';
import { formatAddress } from '../../../lib/utils';

function CompanyDetailContent() {
  const params = useParams();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const signer = useMemo(
    () =>
      publicKey && signTransaction && signAllTransactions
        ? { publicKey, signTransaction, signAllTransactions }
        : null,
    [publicKey, signTransaction, signAllTransactions]
  );
  const ecommerceContract = useContract('Ecommerce', connection, signer, null);

  const companyId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;

  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [copied, setCopied] = useState('');

  const loadData = useCallback(async () => {
    if (!ecommerceContract || !companyId) {
      setLoading(false);
      setError('Invalid company ID or contract not ready.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [companyData, productsData] = await Promise.all([
        ecommerceContract.getCompany(companyId),
        ecommerceContract.getCompanyProducts(companyId),
      ]);

      if (companyData) {
        setCompany(companyData);
        if (publicKey) {
          setIsOwner(companyData.owner.toLowerCase() === publicKey.toBase58().toLowerCase());
        }
      } else {
        throw new Error('Company not found. It may not be registered on this network.');
      }

      const validProducts = productsData.filter((p: any) => p != null);
      setProducts(validProducts);
    } catch (err: any) {
      setError(err.message || 'Error loading company data.');
    } finally {
      setLoading(false);
    }
  }, [ecommerceContract, companyId, publicKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
        <p className="mt-4 text-slate-400 font-bold">Loading Company Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 p-8 rounded-2xl text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <p className="text-rose-300 font-bold">{error}</p>
        <Link
          href="/companies"
          className="mt-6 inline-block text-sm font-bold text-slate-300 underline"
        >
          Back to Companies List
        </Link>
      </div>
    );
  }

  if (!company) {
    return <p>Company not found.</p>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link
            href="/companies"
            className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Building className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">{company.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div
                className={`flex h-2 w-2 rounded-full ${
                  company.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              ></div>
              <p
                className={`text-sm font-bold uppercase tracking-wider ${
                  company.isActive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {company.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl border border-slate-700 text-sm font-bold hover:bg-slate-700 transition-colors">
              <Edit className="w-4 h-4" />
              Edit Details
            </button>
            <button
              onClick={handleAddProduct}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-xl text-sm font-bold hover:bg-cyan-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Product
            </button>
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4 bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50">
          <h3 className="text-lg font-bold text-white">Description</h3>
          <p className="text-slate-400 leading-relaxed">{company.description}</p>
        </div>
        <div className="space-y-4 bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50">
          <h3 className="text-lg font-bold text-white">On-Chain Info</h3>
          <div className="text-xs space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase">Company ID</span>
              <button
                onClick={() => copyToClipboard(company.id, 'companyId')}
                className="flex items-center gap-2 font-mono text-slate-300 hover:text-cyan-400"
              >
                {formatAddress(company.id)}
                <ClipboardCopy className="w-3 h-3" />
                {copied === 'companyId' && <span className="text-cyan-400 text-xs">Copied!</span>}
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase">Owner</span>
              <button
                onClick={() => copyToClipboard(company.owner.toBase58(), 'owner')}
                className="flex items-center gap-2 font-mono text-cyan-400 hover:text-white"
              >
                {formatAddress(company.owner.toBase58())}
                <ShieldCheck className="w-3 h-3" />
                {copied === 'owner' && <span className="text-cyan-400 text-xs">Copied!</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Products ({products.length})</h2>
        {products.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/30 rounded-3xl border-dashed border-2 border-slate-700">
            <Package className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-500 font-medium">This company has no products yet.</p>
            {isOwner && (
              <button
                onClick={handleAddProduct}
                className="mt-6 px-6 py-2 bg-cyan-600 text-white text-sm font-bold rounded-xl"
              >
                Add First Product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div
                key={product.id}
                className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50"
              >
                <div className="flex justify-between">
                  <h3 className="font-bold text-white">{product.name}</h3>
                  <span className="font-mono font-bold text-cyan-400">{product.price} EURT</span>
                </div>
                <p className="text-sm text-slate-400 mt-1">Stock: {product.stock}</p>
                {isOwner && (
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="mt-4 text-xs font-bold text-cyan-400 hover:underline"
                  >
                    Edit Product
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isProductModalOpen && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSave={loadData}
          product={editingProduct || undefined}
          companyId={company.id}
        />
      )}
    </div>
  );
}

export default function CompanyDetailPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'company_owner']}>
      <CompanyDetailContent />
    </RoleGuard>
  );
}
