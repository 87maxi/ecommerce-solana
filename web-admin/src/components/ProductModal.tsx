'use client';

import { useState } from 'react';

type ProductFormData = {
  name: string;
  description: string;
  price: string;
  imageHash: string;
  stock: string;
  isActive: boolean;
};

type ProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  initialData?: Partial<ProductFormData>;
  isSubmitting: boolean;
};

export default function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}: ProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    imageHash: initialData?.imageHash || '',
    stock: initialData?.stock || '',
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductFormData, string>>
  >({});

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
      isValid = false;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'El precio debe ser mayor a 0';
      isValid = false;
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'El stock debe ser un número mayor o igual a 0';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="relative w-full max-w-2xl bg-slate-800/95 backdrop-blur-md border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 rounded-2xl transform transition-all duration-300 scale-100 hover:shadow-cyan-500/30">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-cyan-500/20">
          <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            {initialData ? 'Editar Producto' : 'Agregar Producto'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-cyan-400 focus:outline-none transition-colors duration-200 p-2 rounded-lg hover:bg-slate-700/50"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre */}
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-300"
            >
              Nombre del Producto
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 bg-slate-900/50 border ${errors.name ? 'border-red-500/50' : 'border-cyan-500/30'} rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all duration-200`}
              placeholder="Nombre del producto"
              required
            />
            {errors.name && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.name}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-300"
            >
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all duration-200 resize-none"
              placeholder="Descripción del producto"
            />
          </div>

          {/* Precio y Stock en Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Precio */}
            <div className="space-y-2">
              <label
                htmlFor="price"
                className="block text-sm font-medium text-slate-300"
              >
                Precio (EURT)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-slate-900/50 border ${errors.price ? 'border-red-500/50' : 'border-cyan-500/30'} rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all duration-200`}
                placeholder="0.00"
                required
              />
              {errors.price && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.price}
                </p>
              )}
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <label
                htmlFor="stock"
                className="block text-sm font-medium text-slate-300"
              >
                Stock
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-slate-900/50 border ${errors.stock ? 'border-red-500/50' : 'border-cyan-500/30'} rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all duration-200`}
                placeholder="0"
                required
              />
              {errors.stock && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.stock}
                </p>
              )}
            </div>
          </div>

          {/* Image Hash */}
          <div className="space-y-2">
            <label
              htmlFor="imageHash"
              className="block text-sm font-medium text-slate-300"
            >
              Hash de Imagen (IPFS)
            </label>
            <input
              type="text"
              id="imageHash"
              name="imageHash"
              value={formData.imageHash}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all duration-200 font-mono text-sm"
              placeholder="Qm..."
            />
          </div>

          {/* Checkbox Producto Activo */}
          <div className="flex items-center p-4 bg-slate-900/30 rounded-lg border border-cyan-500/20">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={handleCheckboxChange}
              className="h-5 w-5 rounded border-cyan-500/30 bg-slate-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-0 transition-all cursor-pointer"
            />
            <label
              htmlFor="isActive"
              className="ml-3 block text-sm font-medium text-slate-300 cursor-pointer"
            >
              Producto Activo
            </label>
          </div>

          {/* Botones */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-cyan-500/20">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-cyan-500/30 rounded-lg text-sm font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 hover:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {initialData ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
