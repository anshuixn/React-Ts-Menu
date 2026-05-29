import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { safeLocalStorage } from '../lib/storage';
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('handles loadCartFromStorage with invalid JSON', () => {
    const getItemSpy = vi.spyOn(safeLocalStorage, 'getItem').mockReturnValue('{{invalid json');
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );
    expect(screen.getByTestId('qty')).toHaveTextContent('0');
    expect(getItemSpy).toHaveBeenCalled();
  });

  it('handles loadCartFromStorage with non-object JSON', () => {
    vi.spyOn(safeLocalStorage, 'getItem').mockReturnValue('12345');
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );
    expect(screen.getByTestId('qty')).toHaveTextContent('0');
  });

  it('handles loadCartFromStorage with missing or invalid fields in items', () => {
    const badData = {
      '1': { id: 1, name: 'Masala Dosa', price: 120 }, // missing qty
      '2': { id: 2, name: 'Idli', qty: 2, price: 60, calories: 150, image: '/idli.png', desc: 'Idli' }, // valid
      '3': { id: '3', name: 'Vada', qty: 1, price: 40 }, // id is string instead of number
    };
    vi.spyOn(safeLocalStorage, 'getItem').mockReturnValue(JSON.stringify(badData));
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );
    // Only item 2 is valid
    expect(screen.getByTestId('qty')).toHaveTextContent('2');
    expect(screen.getByTestId('price')).toHaveTextContent('120');
  });

  it('removes cart key from storage when cart is cleared', () => {
    const removeItemSpy = vi.spyOn(safeLocalStorage, 'removeItem');
    const setItemSpy = vi.spyOn(safeLocalStorage, 'setItem');
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );

    fireEvent.click(screen.getByText('Add'));
    expect(setItemSpy).toHaveBeenCalled();

    removeItemSpy.mockClear();
    fireEvent.click(screen.getByText('Clear'));
    expect(removeItemSpy).toHaveBeenCalledWith('auraspice_cart_v1');
  });

  it('handles localstorage quota exceeded error silently', () => {
    vi.spyOn(safeLocalStorage, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>,
    );
    expect(() => {
      fireEvent.click(screen.getByText('Add'));
    }).not.toThrow();
  });

  it('ignores REMOVE_ITEM and INCREASE_QTY actions for non-existent items', () => {
    function CustomProbe() {
      const { cart, dispatch } = useCart();
      return (
        <div>
          <span data-testid="keys">{Object.keys(cart).length}</span>
          <button type="button" onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: 999 })}>
            RemoveNonExistent
          </button>
          <button type="button" onClick={() => dispatch({ type: 'INCREASE_QTY', payload: 999 })}>
            IncreaseNonExistent
          </button>
          <button type="button" onClick={() => dispatch({ type: 'UNSUPPORTED' as any })}>
            UnsupportedAction
          </button>
        </div>
      );
    }

    render(
      <CartProvider>
        <CustomProbe />
      </CartProvider>,
    );

    fireEvent.click(screen.getByText('RemoveNonExistent'));
    expect(screen.getByTestId('keys')).toHaveTextContent('0');

    fireEvent.click(screen.getByText('IncreaseNonExistent'));
    expect(screen.getByTestId('keys')).toHaveTextContent('0');

    fireEvent.click(screen.getByText('UnsupportedAction'));
    expect(screen.getByTestId('keys')).toHaveTextContent('0');
  });
});
