'use client';

import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';

// Assignment to break down ethers for the specific imports needed
type EthersType = typeof ethers;
const { providers, utils }: { providers: EthersType['providers'], utils: EthersType['utils'] } = ethers as any;
import EcommerceABI from '@/contracts/abis/EcommerceABI.json';
import { useWallet } from './useWallet';

// Dirección del contrato (debería venir de variables de entorno)
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '';

export function useContract() {
  const { provider: walletProvider, account: walletAccount } = useWallet();
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializationAttempted = useRef(false);

  // Inicializar el contrato cuando haya un provider disponible
  useEffect(() => {
    // Prevent multiple initializations or initialize without provider
    if (isInitialized || !walletProvider || !walletAccount || initializationAttempted.current) {
      return;
    }

    const initContract = async () => {
      initializationAttempted.current = true;
      try {
        console.log('[useContract] Initializing contract with shared provider...');
        const web3Signer = walletProvider.getSigner();

        setSigner(web3Signer);
        setAccount(walletAccount);

        const ecommerceContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          EcommerceABI,
          web3Signer
        );

        setContract(ecommerceContract);
        setIsInitialized(true);

        // Verificar si el cliente está registrado y registrarlo si no lo está
        // REMOVED: Auto-registration causes unwanted wallet popups on redirect.
        // Registration should be lazy (on action) or manual.
        // await checkAndRegisterCustomer(ecommerceContract, walletAccount);
      } catch (error) {
        console.error('[useContract] Error initializing contract:', error);
        // Do NOT reset isInitialized to false here, as it causes a loop.
        // Instead, we leave it as is (or handle error state).
        // If we want to retry, we should have a manual retry mechanism.
        setIsInitialized(false);
        // Actually, if we set it to false, we must ensure initializationAttempted prevents the loop.
        // But if we want to allow retry on account change, we need to reset initializationAttempted when account changes.
      }
    };

    initContract();
  }, [walletProvider, walletAccount, isInitialized]);

  // Reset initialization attempt when account changes
  useEffect(() => {
    initializationAttempted.current = false;
    setIsInitialized(false);
  }, [walletAccount]);

  // Función para verificar y registrar al cliente si no está registrado
  const checkAndRegisterCustomer = async (contract: ethers.Contract, account: string): Promise<boolean> => {
    try {
      const isRegistered = await contract.isCustomerRegistered(account);

      if (!isRegistered) {
        console.log('[Customer Registration] Customer not registered, registering...', account);
        const tx = await contract.registerCustomer();
        console.log('[Customer Registration] Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('[Customer Registration] Transaction mined in block:', receipt.blockNumber);
        console.log('[Customer Registration] Customer registered successfully');
        return true;
      } else {
        console.log('[Customer Registration] Customer already registered');
        return true;
      }
    } catch (error) {
      console.error('[Customer Registration] Error verifying/registering customer:', error);
      throw error; // Re-throw to let caller handle the error
    }
  };

  // Función para obtener todos los productos
  const getAllProducts = async () => {
    if (!contract) return [];

    try {
      const productIds = await contract.getAllProducts();
      const products = [];

      for (const productId of productIds) {
        const product = await contract.getProduct(productId);
        products.push({
          id: product.id.toNumber(),
          companyId: product.companyId.toNumber(),
          name: product.name,
          description: product.description,
          price: ethers.utils.formatUnits(product.price, 18),
          stock: product.stock.toNumber(),
          image: product.image,
          active: product.active
        });
      }

      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  // Función para obtener el carrito del usuario
  const getCart = async () => {
    if (!contract || !account) return [];

    try {
      // Verificar que el cliente esté registrado antes de obtener el carrito
      const isRegistered = await contract.isCustomerRegistered(account);
      if (!isRegistered) {
        console.log('[Get Cart] Customer not registered, attempting registration...');
        try {
          await checkAndRegisterCustomer(contract, account);

          // Verify registration succeeded
          const isNowRegistered = await contract.isCustomerRegistered(account);
          if (!isNowRegistered) {
            console.error('[Get Cart] Registration failed, customer still not registered');
            return [];
          }
        } catch (regError) {
          console.error('[Get Cart] Failed to register customer:', regError);
          return [];
        }
      }

      const cartItems = await contract.getCart();
      const items = [];

      for (const item of cartItems) {
        const product = await contract.getProduct(item.productId);
        items.push({
          productId: item.productId.toNumber(),
          quantity: item.quantity.toNumber(),
          product: {
            id: product.id.toNumber(),
            companyId: product.companyId.toNumber(),
            name: product.name,
            description: product.description,
            price: ethers.utils.formatUnits(product.price, 18),
            stock: product.stock.toNumber(),
            image: product.image,
            active: product.active
          }
        });
      }

      return items;
    } catch (error) {
      console.error('[Get Cart] Error fetching cart:', error);
      return [];
    }
  };

  // Función para agregar producto al carrito
  const addToCart = async (productId: number, quantity: number) => {
    if (!contract) return false;

    try {
      const tx = await contract.addToCart(productId, quantity);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  };

  // Función para remover producto del carrito
  const removeFromCart = async (productId: number) => {
    if (!contract) return false;

    try {
      const tx = await contract.removeFromCart(productId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  };

  // Función para actualizar cantidad en carrito
  const updateQuantity = async (productId: number, quantity: number) => {
    if (!contract) return false;

    try {
      const tx = await contract.updateQuantity(productId, quantity);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error updating quantity:', error);
      return false;
    }
  };

  // Función para calcular total del carrito
  const calculateTotal = async () => {
    if (!contract) return '0';

    try {
      const total = await contract.calculateTotal();
      return ethers.utils.formatUnits(total, 18);
    } catch (error) {
      console.error('Error calculating total:', error);
      return '0';
    }
  };

  // Función para crear una factura (invoice)
  const createInvoice = async (companyId: number) => {
    if (!contract) return null;

    try {
      const tx = await contract.createInvoice(companyId);
      const receipt = await tx.wait();

      // Obtener el ID de la factura del evento
      const invoiceCreatedEvent = receipt.events?.find((event: any) => event.event === 'InvoiceCreated');
      const invoiceId = invoiceCreatedEvent?.args?.invoiceId;

      return invoiceId ? invoiceId.toNumber() : null;
    } catch (error) {
      console.error('Error creating invoice:', error);
      return null;
    }
  };

  // Función para limpiar el carrito
  const clearCart = async () => {
    if (!contract) return false;

    try {
      const tx = await contract.clearCart();
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  };

  // Función para obtener facturas del cliente
  const getCustomerInvoices = async (customerAddress: string) => {
    if (!contract) return [];

    try {
      const invoiceIds = await contract.getCustomerInvoices(customerAddress);
      const invoices = [];

      for (const invoiceId of invoiceIds) {
        const invoice = await contract.getInvoice(invoiceId);
        const items = await contract.getInvoiceItems(invoiceId);

        invoices.push({
          id: invoice.invoiceId.toNumber(),
          companyId: invoice.companyId.toNumber(),
          customerAddress: invoice.customerAddress,
          totalAmount: ethers.utils.formatUnits(invoice.totalAmount, 18),
          timestamp: new Date(invoice.timestamp.toNumber() * 1000).toLocaleDateString(),
          isPaid: invoice.isPaid,
          paymentTxHash: invoice.paymentTxHash,
          items: items.map((item: any) => ({
            productId: item.productId.toNumber(),
            productName: item.productName,
            quantity: item.quantity.toNumber(),
            unitPrice: ethers.utils.formatUnits(item.unitPrice, 18),
            totalPrice: ethers.utils.formatUnits(item.totalPrice, 18)
          }))
        });
      }

      return invoices;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  };

  // Función para obtener la cantidad de items en el carrito
  const getCartItemCount = async () => {
    if (!contract || !account) return 0;

    try {
      // Verificar que el cliente esté registrado
      const isRegistered = await contract.isCustomerRegistered(account);
      if (!isRegistered) {
        console.log('[Get Cart Count] Customer not registered, attempting registration...');
        try {
          await checkAndRegisterCustomer(contract, account);

          // Verify registration succeeded
          const isNowRegistered = await contract.isCustomerRegistered(account);
          if (!isNowRegistered) {
            console.error('[Get Cart Count] Registration failed, customer still not registered');
            return 0;
          }
        } catch (regError) {
          console.error('[Get Cart Count] Failed to register customer:', regError);
          return 0;
        }
      }

      const items = await getCart();
      return items.reduce((acc: number, item: any) => acc + item.quantity, 0);
    } catch (error) {
      console.error('[Get Cart Count] Error getting cart count:', error);
      return 0;
    }
  };

  return {
    contract,
    account,
    getAllProducts,
    getCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    calculateTotal,
    createInvoice,
    clearCart,
    getCustomerInvoices,
    getCartItemCount
  };
}