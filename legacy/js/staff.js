// ============================================
// AURA & SPICE — staff.js
// Key-Gated Registration + Employee Management
// + Kanban Board + Real-Time Sync
// ============================================

// ---- SERVER-SIDE KEY ONLY ACCESSIBLE BY ADMIN (for UI display) ----
async function getEstablishmentKey() {
  try {
    const res = await fetch('/api/key');
    const data = await res.json();
    return data.key || 'Hidden';
  } catch (e) {
    return 'Hidden';
  }
}

async function setEstablishmentKey(newKey) {
  try {
    await fetch('/api/key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: newKey })
    });
  } catch (e) {
    console.error(e);
  }
}

// ==== Default accounts removed — handled purely server-side now ====

async function getRegisteredAccounts() {
  try {
    const res = await fetch('/api/staff');
    return await res.json();
  } catch(e) {
    return [];
  }
}

let previousOrderCount = 0;
let pollInterval = null;
let clearPending = false;
let currentStaff = null;

// ============================================
// AUTH TAB SWITCHER
// ============================================
function switchAuthTab(tab) {
  document.getElementById('tab-signin').classList.toggle('active', tab === 'signin');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('signin-form').classList.toggle('active', tab === 'signin');
  document.getElementById('register-form').classList.toggle('active', tab === 'register');
  document.getElementById('signin-error').textContent = '';
  document.getElementById('register-error').textContent = '';
  document.getElementById('register-success').textContent = '';
}

// ============================================
// LOGIN / KEY-GATED REGISTRATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Restore session
  const session = sessionStorage.getItem('auraStaffSession');
  if (session) {
    currentStaff = JSON.parse(session);
    unlockDashboard(currentStaff.name, currentStaff.id);
  }

  // ---- SIGN IN ----
  document.getElementById('signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const staffId = document.getElementById('staff-id').value.trim();
    const password = document.getElementById('staff-pass').value;
    const errorEl = document.getElementById('signin-error');

    try {
      const res = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: staffId, password: password })
      });
      const data = await res.json();

      if (data.success) {
        currentStaff = data.account;
        sessionStorage.setItem('auraStaffSession', JSON.stringify(data.account));
        errorEl.textContent = '';
        unlockDashboard(data.account.name, data.account.id);
      } else {
        errorEl.textContent = `❌ ${data.message}`;
        shakeLoginCard();
      }
    } catch(e) {
      errorEl.textContent = '❌ Network Error';
    }
  });

  // ---- REGISTER (KEY-GATED) ----
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const staffId = document.getElementById('reg-id').value.trim();
    const password = document.getElementById('reg-pass').value;
    const key = document.getElementById('reg-key').value.trim();
    const errorEl = document.getElementById('register-error');
    const successEl = document.getElementById('register-success');

    errorEl.textContent = '';
    successEl.textContent = '';

    // Validations
    if (!name || !staffId || !password || !key) {
      errorEl.textContent = '❌ All fields are required';
      return;
    }
    if (password.length < 4) {
      errorEl.textContent = '❌ Password must be at least 4 characters';
      return;
    }
    if (staffId.includes(' ')) {
      errorEl.textContent = '❌ Staff ID cannot contain spaces';
      return;
    }

    // Save (Key is now strictly verified backend only!)
    const newAccount = {
      id: staffId,
      password: password,
      name: name,
      role: 'Staff',
      registeredAt: new Date().toISOString()
    };
    
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: newAccount, key: key })
      });
      const data = await res.json();
      
      if (!data.success) {
        errorEl.textContent = data.message;
        shakeLoginCard();
        return;
      }
    } catch(e) {
      errorEl.textContent = '❌ Network error';
      return;
    }

    successEl.textContent = `✅ Account created! Sign in with ID: ${staffId}`;
    document.getElementById('reg-name').value = '';
    document.getElementById('reg-id').value = '';
    document.getElementById('reg-pass').value = '';
    document.getElementById('reg-key').value = '';

    // Auto-switch to sign-in after 1.5s
    setTimeout(() => {
      switchAuthTab('signin');
      document.getElementById('staff-id').value = staffId;
      document.getElementById('staff-id').focus();
    }, 1500);
  });

  // ---- LOGOUT ----
  document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('auraStaffSession');
    currentStaff = null;
    document.getElementById('login-overlay').classList.remove('hidden');
    document.getElementById('staff-name-badge').textContent = '';
    document.getElementById('manage-emp-btn').style.display = 'none';
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = null;
  });

  // ---- EMPLOYEE MANAGEMENT MODAL ----
  document.getElementById('manage-emp-btn').addEventListener('click', openEmployeeModal);
  document.getElementById('close-emp-modal').addEventListener('click', closeEmployeeModal);
  document.getElementById('employee-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('employee-modal')) closeEmployeeModal();
  });
  
  document.getElementById('change-key-btn').addEventListener('click', async () => {
    const newKey = document.getElementById('new-est-key').value.trim();
    if (!newKey || newKey.length < 4) {
      alert('Key must be at least 4 characters.');
      return;
    }
    await setEstablishmentKey(newKey);
    document.getElementById('current-est-key').textContent = newKey;
    document.getElementById('new-est-key').value = '';
  });
});

function shakeLoginCard() {
  const card = document.querySelector('.login-card');
  card.style.animation = 'none';
  void card.offsetWidth;
  card.style.animation = 'shake 0.4s ease';
}

function unlockDashboard(staffName, staffId) {
  document.getElementById('login-overlay').classList.add('hidden');
  document.getElementById('staff-name-badge').textContent = `👨‍🍳 ${staffName}`;

  // Show admin button only for admin
  const isAdmin = staffId && staffId.toLowerCase() === 'admin';
  document.getElementById('manage-emp-btn').style.display = isAdmin ? 'inline-block' : 'none';

  initKanban();
}

// ============================================
// EMPLOYEE MANAGEMENT
// ============================================
async function openEmployeeModal() {
  await renderEmployeeTable();
  document.getElementById('current-est-key').textContent = await getEstablishmentKey();
  document.getElementById('employee-modal').classList.add('active');
}

function closeEmployeeModal() {
  document.getElementById('employee-modal').classList.remove('active');
}

async function renderEmployeeTable() {
  // Removed defaults render list here because they are secluded on the server.
  // Instead, just note it on the UI for admins.
  defaultBody.innerHTML = '<tr><td colspan="4" class="emp-empty" style="padding: 1rem;">Administrators and built-in Chef roles are hidden and securely protected on the server layer.</td></tr>';

  // Registered accounts table
  const customBody = document.getElementById('custom-emp-body');
  customBody.innerHTML = '';
  const registered = await getRegisteredAccounts();

  if (registered.length === 0) {
    customBody.innerHTML = '<tr><td colspan="4" class="emp-empty">No registered employees yet</td></tr>';
    return;
  }

  registered.forEach((acc, idx) => {
    const regDate = acc.registeredAt
      ? new Date(acc.registeredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="color: var(--text-light); font-weight: 500;">${acc.name}</td>
      <td><code style="background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; font-size: 0.85rem;">${acc.id}</code></td>
      <td><span class="emp-badge-custom">${regDate}</span></td>
      <td><button class="emp-remove-btn" onclick="removeEmployee(${idx})">🗑 Remove</button></td>
    `;
    customBody.appendChild(tr);
  });
}

async function removeEmployee(index) {
  const registered = await getRegisteredAccounts();
  const emp = registered[index];
  if (!emp) return;

  const confirmed = confirm(`Remove "${emp.name}" (${emp.id}) from the employee list?\n\nThey will no longer be able to sign in.`);
  if (!confirmed) return;

  await fetch(`/api/staff/${index}`, { method: 'DELETE' });
  await renderEmployeeTable();
}

// ============================================
// KANBAN BOARD
// ============================================
function initKanban() {
  if (pollInterval) clearInterval(pollInterval);

  renderKanban();
  setupDragAndDrop();

  // Poll for orders every 2s
  pollInterval = setInterval(() => {
    if (!clearPending) renderKanban();
  }, 2000);

  // Clear all — two-click confirm
  const clearBtn = document.getElementById('clear-all-btn');
  let clearTimer = null;
  const newClearBtn = clearBtn.cloneNode(true);
  clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);

  newClearBtn.addEventListener('click', async () => {
    if (clearPending) {
      clearPending = false;
      await fetch('/api/orders', { method: 'DELETE' });
      previousOrderCount = 0;
      await renderKanban();
      newClearBtn.textContent = 'Clear All';
      newClearBtn.style.background = 'transparent';
      newClearBtn.style.color = '#ff4757';
      if (clearTimer) clearTimeout(clearTimer);
    } else {
      clearPending = true;
      newClearBtn.textContent = '⚠ Confirm Clear';
      newClearBtn.style.background = '#ff4757';
      newClearBtn.style.color = 'white';
      clearTimer = setTimeout(() => {
        clearPending = false;
        newClearBtn.textContent = 'Clear All';
        newClearBtn.style.background = 'transparent';
        newClearBtn.style.color = '#ff4757';
      }, 3000);
    }
  });
}

async function renderKanban() {
  let orders = [];
  try {
    const res = await fetch('/api/orders');
    orders = await res.json();
  } catch(e) {}
  
  const lists = ['new', 'cooking', 'ready', 'completed'];
  lists.forEach(s => { 
    const el = document.getElementById(`list-${s}`);
    if(el) el.innerHTML = ''; 
  });
  
  const counts = { new: 0, cooking: 0, ready: 0, completed: 0 };
  const sorted = [...orders].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  sorted.forEach(order => {
    if (!order.status) order.status = 'new';
    if(counts[order.status] !== undefined) {
      counts[order.status]++;
      const listEl = document.getElementById(`list-${order.status}`);
      if(listEl) listEl.appendChild(createOrderCard(order));
    }
  });

  lists.forEach(s => { 
    const countEl = document.getElementById(`count-${s}`);
    if(countEl) countEl.textContent = counts[s]; 
  });

  if (orders.length > previousOrderCount && previousOrderCount > 0) playNotificationSound();
  previousOrderCount = orders.length;
}

function createOrderCard(order) {
  const card = document.createElement('div');
  card.className = 'order-card';
  card.draggable = true;
  card.dataset.id = order.id;
  card.dataset.status = order.status;

  const time = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  let itemsHtml = '';
  if (order.items && Array.isArray(order.items)) {
    itemsHtml = order.items.map(i => `<li><span><span class="item-qty">${i.qty}x</span> ${i.name}</span></li>`).join('');
  }

  let actionHtml = '';
  if (order.status === 'new') actionHtml = `<button class="status-action-btn start-cooking" onclick="moveOrder('${order.id}', 'cooking')">▶ Start Cooking</button>`;
  else if (order.status === 'cooking') actionHtml = `<button class="status-action-btn mark-ready" onclick="moveOrder('${order.id}', 'ready')">✓ Mark Ready</button>`;
  else if (order.status === 'ready') actionHtml = `<button class="status-action-btn mark-complete" onclick="moveOrder('${order.id}', 'completed')">✓ Complete & Bill</button>`;

  card.innerHTML = `
    <div class="order-header">
      <span class="table-number">🪑 Table ${order.table}</span>
      <span class="order-time">${time}</span>
    </div>
    <ul class="order-items">${itemsHtml}</ul>
    <div class="total-price">₹${order.total ? Math.round(order.total) : '0'}</div>
    ${actionHtml}
  `;
  return card;
}

async function moveOrder(id, newStatus) {
  await updateOrderStatus(id, newStatus);
  await renderKanban();
}

function setupDragAndDrop() {
  const container = document.querySelector('.board-container');
  container.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('order-card')) {
      e.dataTransfer.setData('text/plain', e.target.dataset.id);
      setTimeout(() => e.target.classList.add('dragging'), 0);
    }
  });
  container.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('order-card')) e.target.classList.remove('dragging');
    document.querySelectorAll('.kanban-column').forEach(col => col.classList.remove('drag-over'));
  });

  document.querySelectorAll('.kanban-column').forEach(col => {
    const list = col.querySelector('.kanban-cards');
    col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('drag-over'); });
    col.addEventListener('dragleave', (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove('drag-over'); });
    col.addEventListener('drop', async (e) => {
      e.preventDefault(); 
      col.classList.remove('drag-over');
      const orderId = e.dataTransfer.getData('text/plain');
      const newStatus = list.dataset.status;
      if (orderId && newStatus) { 
        await updateOrderStatus(orderId, newStatus); 
        await renderKanban();
      }
    });
  });
}

async function updateOrderStatus(id, newStatus) {
  try {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
  } catch(e) {}
}

function playNotificationSound() {
  try { const a = document.getElementById('notif-sound'); if (a) { a.currentTime = 0; a.play().catch(() => {}); } } catch (e) {}
}

// Shake animation
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `@keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-10px); } 40% { transform: translateX(10px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(6px); } }`;
document.head.appendChild(shakeStyle);
