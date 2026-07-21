import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { safeLocalStorage } from '../lib/storage';
import { CartProvider, cartStorageKey } from './cartStore';
import { useCart } from './useCart';

// All tests use a fixed table number.
const TEST_TABLE = '01';

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

// Helper to render CartProbe inside a CartProvider for a given table
function renderWithProvider(tableNumber = TEST_TABLE) {
  return render(
    <CartProvider tableNumber={tableNumber}>
      <CartProbe />
    </CartProvider>,
  );
}

describe('CartProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // Clear storage between tests to prevent state bleed-over
    safeLocalStorage.clear();
  });

  it('adds, increases, removes, and clears cart items', () => {
    renderWithProvider();

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
    renderWithProvider();
    expect(screen.getByTestId('qty')).toHaveTextContent('0');
    expect(getItemSpy).toHaveBeenCalled();
  });

  it('handles loadCartFromStorage with non-object JSON', () => {
    vi.spyOn(safeLocalStorage, 'getItem').mockReturnValue('12345');
    renderWithProvider();
    expect(screen.getByTestId('qty')).toHaveTextContent('0');
  });

  it('handles loadCartFromStorage with missing or invalid fields in items', () => {
    const badData = {
      '1': { id: 1, name: 'Masala Dosa', price: 120 }, // missing qty
      '2': { id: 2, name: 'Idli', qty: 2, price: 60, calories: 150, image: '/idli.png', desc: 'Idli' }, // valid
      '3': { id: '3', name: 'Vada', qty: 1, price: 40 }, // id is string instead of number
    };
    vi.spyOn(safeLocalStorage, 'getItem').mockReturnValue(JSON.stringify(badData));
    renderWithProvider();
    // Only item 2 is valid
    expect(screen.getByTestId('qty')).toHaveTextContent('2');
    expect(screen.getByTestId('price')).toHaveTextContent('120');
  });

  it('removes the per-table cart key from storage when cart is cleared', () => {
    const removeItemSpy = vi.spyOn(safeLocalStorage, 'removeItem');
    const setItemSpy = vi.spyOn(safeLocalStorage, 'setItem');
    renderWithProvider(TEST_TABLE);

    fireEvent.click(screen.getByText('Add'));
    expect(setItemSpy).toHaveBeenCalled();

    removeItemSpy.mockClear();
    fireEvent.click(screen.getByText('Clear'));
    // The key must be the per-table namespaced key, not the legacy bare key
    expect(removeItemSpy).toHaveBeenCalledWith(cartStorageKey(TEST_TABLE));
  });

  it('uses separate localStorage keys for different tables', () => {
    const setItemSpy = vi.spyOn(safeLocalStorage, 'setItem');

    // Render table 01
    const { unmount: unmount01 } = render(
      <CartProvider tableNumber="01">
        <CartProbe />
      </CartProvider>,
    );
    fireEvent.click(screen.getByText('Add'));
    unmount01();

    // Render table 05
    render(
      <CartProvider tableNumber="05">
        <CartProbe />
      </CartProvider>,
    );
    fireEvent.click(screen.getByText('Add'));

    const calledKeys = setItemSpy.mock.calls.map(([key]) => key);
    expect(calledKeys).toContain(cartStorageKey('01'));
    expect(calledKeys).toContain(cartStorageKey('05'));
    // They must be different
    expect(cartStorageKey('01')).not.toEqual(cartStorageKey('05'));
  });

  it('handles localstorage quota exceeded error silently', () => {
    vi.spyOn(safeLocalStorage, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    renderWithProvider();
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
          <button type="button" onClick={() => dispatch({ type: 'UNSUPPORTED' as never })}>
            UnsupportedAction
          </button>
        </div>
      );
    }

    render(
      <CartProvider tableNumber={TEST_TABLE}>
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

  it('cartStorageKey returns the correct namespaced key', () => {
    expect(cartStorageKey('01')).toBe('auraspice_cart_v1:01');
    expect(cartStorageKey('15')).toBe('auraspice_cart_v1:15');
  });
});
