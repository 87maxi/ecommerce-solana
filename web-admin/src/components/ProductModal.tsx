'use client';

import { useState, useEffect } from 'react';
import { Product } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: any) => Promise<void>;
  product?: Product;
}

export default function ProductModal({ isOpen, onClose, onSave, product }: ProductModalProps) {
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
    if (product) {
      setFormData({
        companyId: product.companyId.toString(),
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        stock: product.stock.toString(),
        image: product.image || '',
        isActive: product.isActive,
      });
    } else {
      setFormData({
        companyId: '',
        name: '',
        description: '',
        price: '',
        stock: '',
        image: '',
        isActive: true,
      });
    }
    setError(null);
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (
        !formData.name ||
        !formData.price ||
        !formData.stock ||
        (!product && !formData.companyId)
      ) {
        throw new Error('Por favor completa los campos obligatorios');
      }

      await onSave({
        ...formData,
        companyId: product ? product.companyId : parseInt(formData.companyId, 10),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
      });

      onClose();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onClose : undefined}
      ></div>

      {/* Modal */}
      <div className="relative bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/80">
          <h2 className="text-xl font-bold text-white">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {!product && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                ID de la Empresa <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.companyId}
                onChange={e => setFormData({ ...formData, companyId: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                placeholder="Ej: 1"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Nombre del Producto <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
              placeholder="Nombre llamativo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Descripción</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 resize-none"
              placeholder="Detalles del producto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Precio (EURT) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Stock <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                placeholder="Cant. disponible"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              URL de la Imagen
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={e => setFormData({ ...formData, image: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
              placeholder="https://..."
            />
          </div>

          {product && (
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900/50 text-cyan-500 focus:ring-cyan-500/50"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-slate-300">
                Producto Activo (Visible en tienda)
              </label>
            </div>
          )}

          <div className="pt-4 mt-6 border-t border-slate-700/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/25 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Guardando...
                </>
              ) : (
                'Guardar Producto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
