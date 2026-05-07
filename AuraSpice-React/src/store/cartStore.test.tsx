import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CartProvider } from './cartStore';
import { useCart } from './useCart';

const sampleItem = {
  id: 1,
  name: 'Masala Dosa',
  category: 'south-indian' as const,
  price: 120,
  calories: 420,
  image: '/dosa.png',
  desc: 'Crisp dosa',
};

function CartProbe() {
  const { cart, dispatch, totalPrice, totalQty } = useCart();

  return (
    <div>
      <span data-testid="qty">{totalQty}</span>
      <span data-testid="price">{totalPrice}</span>
      <span data-testid="keys">{Object.keys(cart).length}</span>
      <button type="button" onClick={() => dispatch({ type: 'ADD_ITEM', payload: sampleItem })}>
        Add
      </button>
      <button type="button" onClick={() => dispatch({ type: 'INCREASE_QTY', payload: sampleItem.id })}>
        Increase
      </button>
      <button type="button" onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: sampleItem.id })}>
        Remove
      </button>
      <button type="button" onClick={() => dispatch({ type: 'CLEAR_CART' })}>
        Clear
      </button>
    </div>
  );
}

describe('CartProvider', () => {
  it('adds, increases, removes, and clears cart items', () => {
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );

    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByTestId('qty')).toHaveTextContent('1');
    expect(screen.getByTestId('price')).toHaveTextContent('120');

    fireEvent.click(screen.getByText('Increase'));
    expect(screen.getByTestId('qty')).toHaveTextContent('2');
    expect(screen.getByTestId('price')).toHaveTextContent('240');

    fireEvent.click(screen.getByText('Remove'));
    expect(screen.getByTestId('qty')).toHaveTextContent('1');

    fireEvent.click(screen.getByText('Clear'));
    expect(screen.getByTestId('qty')).toHaveTextContent('0');
    expect(screen.getByTestId('keys')).toHaveTextContent('0');
  });
});
