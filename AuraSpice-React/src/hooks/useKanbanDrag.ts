import { useState, useCallback } from 'react';
import type { OrderStatus } from '../types';

export function useKanbanDrag(onDropOrder: (orderId: string, newStatus: OrderStatus) => Promise<void> | void) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<OrderStatus | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, orderId: string) => {
    e.dataTransfer.setData('text/plain', orderId);
    e.dataTransfer.effectAllowed = 'move';
    // Use a tiny timeout to allow the drag image to clone before hiding the original
    setTimeout(() => setActiveDragId(orderId), 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    setActiveDragId(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, status: OrderStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  }, [dragOverColumn]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Only remove if we actually left the boundary
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverColumn(null);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>, status: OrderStatus) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('text/plain');
    setDragOverColumn(null);
    setActiveDragId(null);
    if (orderId && status) {
      await onDropOrder(orderId, status);
    }
  }, [onDropOrder]);

  return {
    activeDragId,
    dragOverColumn,
    dragProps: (orderId: string) => ({
      draggable: true,
      onDragStart: (e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, orderId),
      onDragEnd: handleDragEnd,
    }),
    dropProps: (status: OrderStatus) => ({
      onDragOver: (e: React.DragEvent<HTMLDivElement>) => handleDragOver(e, status),
      onDragLeave: handleDragLeave,
      onDrop: (e: React.DragEvent<HTMLDivElement>) => handleDrop(e, status),
    }),
  };
}
