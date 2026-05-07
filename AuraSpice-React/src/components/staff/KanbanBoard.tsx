import { useKanbanDrag } from '../../hooks/useKanbanDrag';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { Order, OrderStatus } from '../../types';

const STATUSES: { id: OrderStatus; title: string; color: string }[] = [
  { id: 'new', title: 'Pending', color: 'var(--status-new)' },
  { id: 'cooking', title: 'In Progress', color: 'var(--status-cooking)' },
  { id: 'ready', title: 'Ready to Serve', color: 'var(--status-ready)' },
  { id: 'completed', title: 'Completed', color: 'var(--text-dim)' },
];

function OrderCard({ order, dragProps, onAction, disableDrag, isBeingDragged }: {
  order: Order;
  dragProps: React.HTMLAttributes<HTMLDivElement>;
  onAction: (id: string, s: OrderStatus) => void;
  disableDrag: boolean;
  isBeingDragged: boolean;
}) {
  const time = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={`order-card ${disableDrag ? '' : 'draggable'} ${isBeingDragged ? 'dragging' : ''}`}
      data-status={order.status}
      {...(disableDrag ? {} : dragProps)}
    >
      <div className="order-header">
        <span className="table-number">
          <img src="/icons/table.png" alt="" style={{ width: 18, height: 18, objectFit: 'cover', borderRadius: '50%', verticalAlign: 'middle', marginRight: 4 }} draggable={false} />
          Table {order.table}
        </span>
        <span className="order-time">{time}</span>
      </div>
      <ul className="order-items">
        {order.items.map((item, idx) => (
          <li key={`${item.id}-${idx}`}>
            <span><span className="item-qty">{item.qty}x</span> {item.name}</span>
          </li>
        ))}
      </ul>
      <div className="total-price">₹{Math.round(order.total)}</div>

      {order.status === 'new' && (
        <button className="status-action-btn start-cooking" onClick={() => onAction(order.id, 'cooking')} aria-label={`Start cooking order for table ${order.table}`}>▶ Start Cooking</button>
      )}
      {order.status === 'cooking' && (
        <button className="status-action-btn mark-ready" onClick={() => onAction(order.id, 'ready')} aria-label={`Mark order for table ${order.table} as ready`}>✓ Mark Ready</button>
      )}
      {order.status === 'ready' && (
        <button className="status-action-btn mark-complete" onClick={() => onAction(order.id, 'completed')} aria-label={`Complete order for table ${order.table}`}>✓ Complete & Bill</button>
      )}
    </div>
  );
}

export function KanbanBoard({ orders, onUpdateStatus }: { orders: Order[]; onUpdateStatus: (id: string, status: OrderStatus) => void }) {
  const { activeDragId, dragOverColumn, dragProps, dropProps } = useKanbanDrag(onUpdateStatus);
  const isMobile = useIsMobile();

  return (
    <div className="board-container">
      {STATUSES.map((col) => {
        // Sort ascending by timestamp so oldest (most urgent) orders appear first
        const colOrders = orders.filter((o) => o.status === col.id).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return (
          <div
            key={col.id}
            className={`kanban-column ${dragOverColumn === col.id ? 'drag-over' : ''}`}
            {...dropProps(col.id)}
          >
            <div className="col-header">
              <h3 className="col-title" style={{ borderLeft: `4px solid ${col.color}` }}>{col.title}</h3>
              <span className="col-count">{colOrders.length}</span>
            </div>
            <div className="kanban-cards">
              {colOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  dragProps={dragProps(order.id)}
                  onAction={onUpdateStatus}
                  disableDrag={isMobile}
                  isBeingDragged={activeDragId === order.id}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
