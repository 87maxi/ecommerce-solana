import { render, screen } from '@testing-library/react';

import { TransactionList } from '../../src/components/TransactionList';

describe('TransactionList', () => {
  const mockTransactions = [
    {
      id: '1',
      type: 'Registro de Empresa',
      amount: '-',
      from: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
      to: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      timestamp: 'Hace 2 horas',
      status: 'completed' as const,
    },
    {
      id: '2',
      type: 'Agregar Producto',
      amount: '-',
      from: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
      to: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      timestamp: 'Hace 5 horas',
      status: 'completed' as const,
    },
  ];

  it('renders transaction list with correct title', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        title="Actividad Reciente"
      />
    );
    expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
  });

  it('renders all transactions', () => {
    render(<TransactionList transactions={mockTransactions} />);
    expect(screen.getByText('Registro de Empresa')).toBeInTheDocument();
    expect(screen.getByText('Agregar Producto')).toBeInTheDocument();
  });

  it('renders empty state when no transactions', () => {
    render(<TransactionList transactions={[]} />);
    expect(
      screen.getByText('No hay transacciones recientes')
    ).toBeInTheDocument();
  });

  it('displays correct status colors', () => {
    render(<TransactionList transactions={mockTransactions} />);
    const statusElements = screen.getAllByText('completed');
    expect(statusElements[0]).toHaveClass('bg-green-100');
  });
  it('format of transaction data is preserved', () => {
    render(<TransactionList transactions={mockTransactions} />);

    // Check that addresses are displayed as monospace
    const addressElement = screen.getByText(
      '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4'
    );
    expect(addressElement).toHaveClass('font-mono');

    // Check that amounts are displayed correctly
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
