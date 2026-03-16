'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Euro,
  Box,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Product } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: any) => Promise<void>;
  product?: Product;
  companyId?: string; // Optional predefined company ID (for owners)
}

/**
 * ProductModal Component
 *
 * Modern UI for adding or editing products in the Solana E-commerce ecosystem.
 * Supports string-based Solana PublicKeys for company identification.
 */
export default function ProductModal({
  isOpen,
  onClose,
  onSave,
  product,
  companyId: predefinedCompanyId,
}: ProductModalProps) {
  const [formData, setFormData] = useState({
    companyId: '',
    name: '',
    description: '',
    price: '',
    stock: '',
    image: '',
    isActive: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({
          companyId: product.companyId.toString(),
          name: product.name,
          description: product.description || '',
          price: product.price.toString(),
          stock: product.stock.toString(),
          image: (product as any).image || (product as any).imageHash || '',
          isActive: (product as any).active ?? (product as any).isActive ?? true,
        });
      } else {
        setFormData({
          companyId: predefinedCompanyId || '',
          name: '',
          description: '',
          price: '',
          stock: '',
          image: '',
          isActive: true,
        });
      }
      setError(null);
    }
  }, [product, isOpen, predefinedCompanyId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name || !formData.price || !formData.stock) {
        throw new Error('Por favor completa todos los campos obligatorios');
      }

      if (!product && !formData.companyId) {
        throw new Error('El ID de la empresa es obligatorio para nuevos productos');
      }

      // Convert price to smallest units for the contract (6 decimals for EURT)
      const numericPrice = parseFloat(formData.price);
      if (isNaN(numericPrice)) throw new Error('Precio inválido');

      // If price is already formatted (contains .), we treat it as EUR.
      // If it looks like a raw big number, we might need different logic,
      // but here we assume the UI always shows EUR.
      const priceInUnits = Math.round(numericPrice * 1000000).toString();

      await onSave({
        ...formData,
        price: priceInUnits,
        stock: parseInt(formData.stock, 10),
      });

      onClose();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Error al procesar la transacción en Solana');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal Container */}
      <div className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {product ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                Solana Inventory System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all disabled:opacity-30"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide"
        >
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm animate-pulse">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="font-bold">{error}</p>
            </div>
          )}

          {/* Company ID Field (Required for Admin adding products for others) */}
          {!product && !predefinedCompanyId && (
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                ID Empresa (Solana Pubkey)
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={formData.companyId}
                  onChange={e => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono text-sm"
                  placeholder="Ej: Frt4M98tMn4vF1rm5..."
                />
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
              Nombre del Producto
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-bold"
              placeholder="Ej: Laptop Pro M3"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
              Descripción
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none text-sm leading-relaxed"
              placeholder="Breve descripción del producto..."
            />
          </div>

          {/* Price & Stock Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                Precio (EURT)
              </label>
              <div className="relative">
                <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono font-bold"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                Stock
              </label>
              <div className="relative">
                <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono font-bold"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
              URL de Imagen (Opcional)
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="url"
                value={formData.image}
                onChange={e => setFormData({ ...formData, image: e.target.value })}
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-xs"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
          </div>

          {/* Active Status Switch */}
          {product && (
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                formData.isActive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800 border-white/5 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className={`w-5 h-5 ${formData.isActive ? 'text-emerald-400' : 'text-slate-600'}`}
                />
                <span className="text-sm font-bold uppercase tracking-tight">Producto Activo</span>
              </div>
              <div
                className={`w-10 h-5 rounded-full relative transition-colors ${formData.isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <div
                  className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${formData.isActive ? 'left-6' : 'left-1'}`}
                />
              </div>
            </button>
          )}

          {/* Footer Actions */}
          <div className="pt-6 mt-4 border-t border-white/5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sincronizando...</span>
                </div>
              ) : (
                <span>{product ? 'Actualizar Producto' : 'Lanzar Producto'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
