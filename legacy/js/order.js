// ============================================
// AURA & SPICE — order.js
// Cart System, Table Selector, Live Status Tracker
// ============================================

const menuData = [
  // ===== CHINESE (8) =====
  { id: 1,  name: "Dim Sum Platter",   category: "chinese", price: 249, calories: 320, image: "./assets/menu/chinese/dimsum.png",          desc: "Steamed crystal-skin dumplings filled with prawn and truffle, served with chili oil" },
  { id: 2,  name: "Kung Pao Chicken",  category: "chinese", price: 289, calories: 450, image: "./assets/menu/chinese/kungpao.png",         desc: "Wok-fired chicken with roasted peanuts, dried chilies, and Wok Hei finish" },
  { id: 3,  name: "Chilli Paneer",     category: "chinese", price: 229, calories: 380, image: "./assets/menu/chinese/chilli-paneer.png",   desc: "Crispy paneer cubes tossed in a fiery Indo-Chinese chili garlic sauce" },
  { id: 4,  name: "Hakka Noodles",     category: "chinese", price: 199, calories: 420, image: "./assets/menu/chinese/hakka-noodles.png",   desc: "Wok-tossed egg noodles with julienned vegetables and soy glaze" },
  { id: 5,  name: "Veg Manchurian",    category: "chinese", price: 209, calories: 350, image: "./assets/menu/chinese/veg-manchurian.png",  desc: "Deep-fried veggie balls in a tangy Manchurian gravy with spring onions" },
  { id: 6,  name: "Spring Rolls",      category: "chinese", price: 179, calories: 280, image: "./assets/menu/chinese/spring-rolls.png",    desc: "Golden crispy rolls stuffed with cabbage, carrots, and glass noodles" },
  { id: 7,  name: "Fried Rice",        category: "chinese", price: 219, calories: 480, image: "./assets/menu/chinese/fried-rice.png",      desc: "Classic wok-fried rice with egg, vegetables, and a hint of sesame" },
  { id: 8,  name: "Pepper Steak",      category: "chinese", price: 399, calories: 520, image: "./assets/menu/chinese/steak.png",           desc: "Seared steak strips in a black pepper sauce with bell peppers" },

  // ===== NORTH INDIAN (5) =====
  { id: 9,  name: "Butter Chicken",       category: "north-indian", price: 349, calories: 550, image: "./assets/menu/north-indian/butter-chicken.png",       desc: "Tandoori chicken in a rich, creamy tomato-butter gravy — the undisputed classic" },
  { id: 10, name: "Paneer Butter Masala", category: "north-indian", price: 299, calories: 480, image: "./assets/menu/north-indian/paneer-butter-masala.png", desc: "Soft paneer cubes in a velvety makhani gravy with a touch of cream" },
  { id: 11, name: "Chicken Biryani",      category: "north-indian", price: 329, calories: 620, image: "./assets/menu/north-indian/chicken-biryani.png",      desc: "Dum-cooked basmati rice layered with spiced chicken, saffron, and caramelized onions" },
  { id: 12, name: "Dal Makhani",          category: "north-indian", price: 249, calories: 380, image: "./assets/menu/north-indian/dal-makhani.png",          desc: "Black lentils slow-cooked overnight with butter and cream — pure comfort" },
  { id: 13, name: "Garlic Naan",          category: "north-indian", price: 69,  calories: 260, image: "./assets/menu/north-indian/garlic-naan.png",          desc: "Soft tandoori naan brushed with garlic butter and fresh coriander" },

  // ===== SOUTH INDIAN (5) =====
  { id: 14, name: "Masala Dosa",    category: "south-indian", price: 149, calories: 350, image: "./assets/menu/south-indian/masala-dosa.png",   desc: "Crispy rice-batter crepe filled with spiced potato masala, served with chutneys" },
  { id: 15, name: "Idli Sambar",    category: "south-indian", price: 119, calories: 220, image: "./assets/menu/south-indian/idli-sambar.png",   desc: "Fluffy steamed rice cakes served with hot sambar and coconut chutney" },
  { id: 16, name: "Medu Vada",      category: "south-indian", price: 99,  calories: 280, image: "./assets/menu/south-indian/medu-vada.png",     desc: "Crispy urad dal fritters — golden on the outside, soft and fluffy inside" },
  { id: 17, name: "Uttapam",        category: "south-indian", price: 139, calories: 310, image: "./assets/menu/south-indian/uttapam.png",       desc: "Thick rice pancake topped with onions, tomatoes, and green chilies" },
  { id: 18, name: "Filter Coffee",  category: "south-indian", price: 79,  calories: 80,  image: "./assets/menu/south-indian/filter-coffee.png", desc: "Traditional South Indian filter coffee — strong, frothy, and aromatic" },

  // ===== FAST FOOD (6) =====
  { id: 19, name: "Classic Smash Burger", category: "fast-food", price: 279, calories: 680, image: "./assets/menu/fast-food/burger.png",       desc: "Double-smashed beef patty with cheddar, caramelized onions, and house sauce" },
  { id: 20, name: "Loaded Fries",         category: "fast-food", price: 179, calories: 450, image: "./assets/menu/fast-food/french-fries.png", desc: "Crispy golden fries topped with cheese sauce, jalapeños, and crispy bacon bits" },
  { id: 21, name: "Steamed Momos",        category: "fast-food", price: 149, calories: 300, image: "./assets/menu/fast-food/momos.png",        desc: "Juicy chicken momos steamed in bamboo baskets, served with spicy red chutney" },
  { id: 22, name: "Penne Arrabiata",      category: "fast-food", price: 249, calories: 520, image: "./assets/menu/fast-food/pasta.png",        desc: "Al dente penne in a spicy tomato-garlic arrabiata sauce with fresh basil" },
  { id: 23, name: "Loaded Pizza",         category: "fast-food", price: 329, calories: 750, image: "./assets/menu/fast-food/pizza.png",        desc: "Hand-tossed crust loaded with mozzarella, pepperoni, olives, and jalapeños" },
  { id: 24, name: "Club Sandwich",        category: "fast-food", price: 219, calories: 480, image: "./assets/menu/fast-food/sandwich.png",     desc: "Triple-decker with grilled chicken, bacon, lettuce, tomato, and herb mayo" },

  // ===== BEVERAGES (5) =====
  { id: 25, name: "Virgin Mojito",    category: "beverages", price: 159, calories: 120, image: "./assets/menu/beverages/mojito.png",          desc: "Fresh lime, mint leaves, and soda — shaken and chilled to perfection" },
  { id: 26, name: "Cold Coffee",      category: "beverages", price: 149, calories: 200, image: "./assets/menu/beverages/cold-coffee.png",     desc: "Creamy blended cold coffee with a frothy top and a hint of vanilla" },
  { id: 27, name: "Mango Shake",      category: "beverages", price: 129, calories: 280, image: "./assets/menu/beverages/mango-shake.png",     desc: "Thick and luscious Alphonso mango shake made with real fruit pulp" },
  { id: 28, name: "Masala Chai",      category: "beverages", price: 49,  calories: 80,  image: "./assets/menu/beverages/masala-chai.png",     desc: "Spiced Indian tea with ginger, cardamom, and cloves — brewed fresh" },
  { id: 29, name: "Fresh Lime Soda",  category: "beverages", price: 89,  calories: 60,  image: "./assets/menu/beverages/fresh-lime-soda.png", desc: "Tangy lime juice with soda, cumin salt, and a touch of mint" },
];

// ============================================
// AUDIO & HAPTIC ENGINE
// ============================================
const AudioEngine = {
  ctx: null,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  playSwoosh() {
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch(e) {}
  },
  playChime() {
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.8);
      
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.8);
    } catch(e) {}
  },
  vibrateClick() {
    if (navigator.vibrate) {
      navigator.vibrate([20, 30, 20]);
    }
  }
};

let cart = {};
let tableNumber = "01";
let currentOrderId = null;
let statusPollInterval = null;

// --- Agent 4: Vanilla Proxy State Manager ---
const OrbState = {
  cartOpen: false,
  statusOpen: false,
  orderState: 'none'
};

const OrbStore = new Proxy(OrbState, {
  set: (target, key, value) => {
    if (target[key] !== value) {
      // Interceptor to ensure mutual exclusivity
      if (key === 'cartOpen' && value === true) target.statusOpen = false;
      if (key === 'statusOpen' && value === true) target.cartOpen = false;
      
      target[key] = value;
      
      if (key === 'cartOpen' || key === 'statusOpen') {
        handleOrbRender();
      }
      if (key === 'orderState') {
        handleOrbStateStyles(value);
        if (value === 'cooking' || value === 'ready' || value === 'completed') {
          AudioEngine.playChime();
        }
      }
    }
    return true;
  }
});

let scrollbarWidth = 0; // For Agent 5

document.addEventListener("DOMContentLoaded", () => {
  // 1. Table Selection — from URL param or dropdown
  const params = new URLSearchParams(window.location.search);
  const selector = document.getElementById('table-selector');

  // Populate dropdown with tables 1-20
  for (let i = 1; i <= 20; i++) {
    const opt = document.createElement('option');
    opt.value = String(i).padStart(2, '0');
    opt.textContent = String(i).padStart(2, '0');
    selector.appendChild(opt);
  }

  // Set from URL param if available
  if (params.has('table')) {
    tableNumber = params.get('table');
    selector.value = tableNumber;
  }

  // Listen for table change
  selector.addEventListener('change', () => {
    tableNumber = selector.value;
  });

  // 2. Render Menu Based on Parameter (Agent 1 & 2 Routing)
  let initialFilter = 'all';
  if (params.has('filter')) {
    initialFilter = params.get('filter');
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    const targetTab = document.querySelector(`.filter-tab[data-filter="${initialFilter}"]`);
    if(targetTab) targetTab.classList.add('active');
  }
  renderMenu(initialFilter);

  // 3. Filter Tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderMenu(tab.dataset.filter);
    });
  });

  // 4. Orb Drawer Interactions (Agent 4 & 5)
  setupOrbInteractions();

  // 5. Checkout
  document.getElementById('checkout-btn').addEventListener('click', submitOrder);

  // 6. Live status tracking — cross-tab + continuous polling
  window.addEventListener('storage', checkOrderStatus);

  // 7. Check status on load (in case page was reloaded)
  const savedOrderId = sessionStorage.getItem('currentOrderId');
  if (savedOrderId) {
    currentOrderId = savedOrderId;
    checkOrderStatus();
    startStatusPolling();
  }
});

// ============================================
// Agent 4, 5, 6 & 7: ORB DOM PHYSICS & EVENTS
// ============================================
function setupOrbInteractions() {
  const statusOrb = document.getElementById('status-orb');
  const cartOrb = document.getElementById('cart-orb');
  const statusDrawer = document.getElementById('status-drawer');
  const cartDrawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('orb-backdrop');
  
  // Agent 5: Calculate scrollbar width
  scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  // Toggle handlers — Agent 6: init() + playSwoosh() fire synchronously BEFORE
  // state mutation so sound is back-to-back with the physical click.
  statusOrb.addEventListener('click', () => {
    AudioEngine.init();
    AudioEngine.playSwoosh();
    OrbStore.statusOpen = true;
  });
  
  cartOrb.addEventListener('click', () => {
    AudioEngine.init();
    AudioEngine.playSwoosh();
    OrbStore.cartOpen = true;
  });

  // Close triggers
  document.querySelectorAll('.close-drawer').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (e.target.dataset.close === 'status') OrbStore.statusOpen = false;
      if (e.target.dataset.close === 'cart') OrbStore.cartOpen = false;
    });
  });

  backdrop.addEventListener('click', () => {
    OrbStore.statusOpen = false;
    OrbStore.cartOpen = false;
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      OrbStore.statusOpen = false;
      OrbStore.cartOpen = false;
    }
  });

  // Agent 6: Mobile Fluid Touch (Dual-Directional)
  setupTouchPhysics(statusDrawer, 'left');
  setupTouchPhysics(cartDrawer, 'right');
}

function setupTouchPhysics(drawer, direction) {
  let startX = 0;
  let isDragging = false;

  drawer.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
    drawer.style.transition = 'none';
  }, {passive: true});

  drawer.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - startX;
    
    if (direction === 'left' && deltaX < 0) {
      requestAnimationFrame(() => drawer.style.transform = `translateX(${deltaX}px)`);
    } else if (direction === 'right' && deltaX > 0) {
      requestAnimationFrame(() => drawer.style.transform = `translateX(${deltaX}px)`);
    }
  }, {passive: true});

  drawer.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    drawer.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';

    const deltaX = e.changedTouches[0].clientX - startX;
    const velocity = Math.abs(deltaX);

    if (direction === 'left' && (deltaX < -80 || velocity > 150)) {
      OrbStore.statusOpen = false;
      AudioEngine.vibrateClick();
    } else if (direction === 'right' && (deltaX > 80 || velocity > 150)) {
      OrbStore.cartOpen = false;
      AudioEngine.vibrateClick();
    } else {
      drawer.style.transform = ''; // snap back
    }
  });
}

function handleOrbRender() {
  const statusDrawer = document.getElementById('status-drawer');
  const cartDrawer = document.getElementById('cart-drawer');
  const backdrop = document.getElementById('orb-backdrop');
  const statusOrb = document.getElementById('status-orb');
  const cartOrb = document.getElementById('cart-orb');
  
  const anyOpen = OrbStore.cartOpen || OrbStore.statusOpen;

  // Cart
  if (OrbStore.cartOpen) {
    cartDrawer.classList.add('open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    cartOrb.setAttribute('aria-expanded', 'true');
    cartDrawer.style.transform = '';
  } else {
    cartDrawer.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    cartOrb.setAttribute('aria-expanded', 'false');
  }

  // Status
  if (OrbStore.statusOpen) {
    statusDrawer.classList.add('open');
    statusDrawer.setAttribute('aria-hidden', 'false');
    statusOrb.setAttribute('aria-expanded', 'true');
    statusDrawer.style.transform = '';
  } else {
    statusDrawer.classList.remove('open');
    statusDrawer.setAttribute('aria-hidden', 'true');
    statusOrb.setAttribute('aria-expanded', 'false');
  }

  // Global Backdrop & Scroll Lock (Agent 11 Anomaly Failsafes)
  if (anyOpen) {
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0 && !document.body.style.paddingRight) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  } else {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
}

function handleOrbStateStyles(state) {
  const statusGlow = document.querySelector('.status-glow');
  const badge = document.getElementById('status-badge');
  const emptyView = document.getElementById('status-empty');
  const liveTracker = document.getElementById('live-tracker');
  
  if (state !== 'none' && state !== 'completed') {
    statusGlow.classList.add('active');
    badge.style.display = 'flex';
    emptyView.style.display = 'none';
    if(liveTracker) liveTracker.style.display = 'flex';
  } else {
    statusGlow.classList.remove('active');
    badge.style.display = 'none';
    if (state === 'none') {
      emptyView.style.display = 'block';
      if(liveTracker) liveTracker.style.display = 'none';
    }
  }
}

function renderMenu(filter) {
  const container = document.getElementById('menu-items');
  container.innerHTML = "";

  const items = filter === 'all' ? menuData : menuData.filter(i => i.category === filter);

  items.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'menu-card reveal';
    card.style.transitionDelay = `${idx * 0.08}s`;

    const qtyInCart = cart[item.id] ? cart[item.id].qty : 0;

    card.innerHTML = `
      <div class="card-image">
        <img src="${item.image}" alt="${item.name}" loading="lazy">
      </div>
      <div class="card-content">
        <h3 class="card-title">${item.name}</h3>
        <p class="card-desc">${item.desc}</p>
        <div style="font-size: 0.75rem; color: var(--text-dim); margin-top: 6px;">${item.calories} cal</div>
        <div class="card-footer">
          <span class="price">₹${item.price}</span>
          <button class="btn-primary btn-add btn-magnetic" id="add-btn-${item.id}" onclick="addToCart(${item.id}, this)">${qtyInCart > 0 ? `Add (+${qtyInCart})` : 'Add'}</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  requestAnimationFrame(() => {
    container.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
    
    // Agent 2: Re-attach magnetic physics to new buttons
    setupMagneticPhysics();
  });
}

function setupMagneticPhysics() {
  document.querySelectorAll('.btn-magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      // Gentle pull mechanics
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) scale(1.05)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

function addToCart(id, btnEl) {
  const item = menuData.find(i => i.id === id);
  if (!item) return;

  if (!cart[id]) {
    cart[id] = { ...item, qty: 1 };
  } else {
    cart[id].qty++;
  }

  updateCartUI();

  if (btnEl) {
    btnEl.classList.add('added');
    btnEl.textContent = '✓ Added';
    
    // Agent 7: Flying Particle Collision Geometry
    spawnMagneticParticle(btnEl);

    setTimeout(() => {
      btnEl.classList.remove('added');
      btnEl.textContent = `Add (+${cart[id].qty})`;
    }, 800);
  }

  const badge = document.getElementById('cart-badge');
  badge.classList.remove('badge-bounce');
  void badge.offsetWidth;
  badge.classList.add('badge-bounce');

  // Cart Glow Pulse (Agent 2)
  const cartGlow = document.querySelector('.cart-glow');
  cartGlow.classList.remove('active');
  void cartGlow.offsetWidth;
  cartGlow.classList.add('active');
  setTimeout(() => cartGlow.classList.remove('active'), 2000);
}

// ============================================
// Agent 7: Choreography & Motion Particle Engine
// ============================================
function spawnMagneticParticle(buttonEl) {
  const rect = buttonEl.getBoundingClientRect();
  const cartOrb = document.getElementById('cart-orb').getBoundingClientRect();

  const particle = document.createElement('div');
  particle.className = 'add-particle';
  
  // Set initial coordinates
  particle.style.left = `${rect.left + rect.width / 2}px`;
  particle.style.top = `${rect.top + rect.height / 2}px`;
  
  document.body.appendChild(particle);

  // Trigger animation next frame to target orb
  requestAnimationFrame(() => {
    particle.style.transform = `translate(${cartOrb.left - rect.left - rect.width / 2 + 15}px, ${cartOrb.top - rect.top - rect.height / 2 + 15}px) scale(0)`;
  });

  // Cleanup DOM
  setTimeout(() => {
    particle.remove();
    AudioEngine.playSwoosh(); // subtle pop upon arrival
  }, 600);
}

function removeFromCart(id) {
  if (!cart[id]) return;
  cart[id].qty--;
  if (cart[id].qty <= 0) {
    delete cart[id];
    // Agent 8: Reset the menu-grid button text when qty drops to zero
    const menuBtn = document.getElementById(`add-btn-${id}`);
    if (menuBtn) {
      menuBtn.textContent = 'Add';
      menuBtn.classList.remove('added');
    }
  }
  updateCartUI();
  const btn = document.getElementById(`add-btn-${id}`);
  if (btn) {
    const qty = cart[id] ? cart[id].qty : 0;
    btn.textContent = qty > 0 ? `Add (+${qty})` : 'Add';
  }
}

function increaseQty(id) {
  if (cart[id]) {
    cart[id].qty++;
    updateCartUI();
    const btn = document.getElementById(`add-btn-${id}`);
    if (btn) btn.textContent = `Add (+${cart[id].qty})`;
  }
}

function updateCartUI() {
  const cartContainer = document.getElementById('cart-items');
  const badge = document.getElementById('cart-badge');
  const totalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');

  const items = Object.values(cart);
  let totalQty = 0;
  let totalPrice = 0;

  // 1. Calculate Totals first
  items.forEach(item => {
    totalQty += item.qty;
    totalPrice += item.price * item.qty;
  });

  // 2. Global UI updates
  if (badge) badge.textContent = totalQty;
  if (totalEl) totalEl.textContent = `₹${totalPrice}`;

  if (checkoutBtn) {
    const isEmpty = items.length === 0;
    checkoutBtn.disabled = isEmpty;
    checkoutBtn.style.opacity = isEmpty ? '0.5' : '1';
    checkoutBtn.style.cursor = isEmpty ? 'not-allowed' : 'pointer';
  }

  // 3. Handle Empty State
  if (items.length === 0) {
    cartContainer.innerHTML = '<p class="cart-empty-fade" style="color: var(--text-muted); text-align: center; padding: 20px 0; margin: 0;">Your cart is empty.</p>';
    return;
  }

  // 4. Remove Empty Message if present
  cartContainer.querySelectorAll('.cart-empty-fade').forEach(el => el.remove());

  // 5. Surgical Sync (Agent 1, 2, 5)
  const activeIds = items.map(i => i.id.toString());
  
  // Clean up stale rows
  const existingRows = Array.from(cartContainer.querySelectorAll('.cart-item-premium'));
  existingRows.forEach(row => {
    const rowId = row.getAttribute('data-id');
    if (!activeIds.includes(rowId)) {
      row.remove();
    }
  });

  // Update or Create rows
  items.forEach(item => {
    const itemIdStr = item.id.toString();
    let row = cartContainer.querySelector(`.cart-item-premium[data-id="${itemIdStr}"]`);
    
    if (row) {
      // Just update values for existing row
      row.querySelector('.cart-qty-num').textContent = item.qty;
      row.querySelector('.cart-item-total').textContent = `₹${item.price * item.qty}`;
    } else {
      // Build new premium card
      row = document.createElement('div');
      row.className = 'cart-item-premium';
      row.setAttribute('data-id', itemIdStr);
      row.innerHTML = `
        <div class="cart-image-wrapper">
          <img src="${item.image}" class="cart-item-image">
        </div>
        <div class="cart-item-details">
          <h4 class="cart-item-title">${item.name}</h4>
          <span class="cart-item-unit-price">₹${item.price}</span>
        </div>
        <div class="cart-item-actions">
          <span class="cart-item-total">₹${item.price * item.qty}</span>
          <div class="cart-qty-pill">
            <button class="cart-qty-btn" onclick="removeFromCart(${item.id})">−</button>
            <span class="cart-qty-num">${item.qty}</span>
            <button class="cart-qty-btn" onclick="increaseQty(${item.id})">+</button>
          </div>
        </div>
      `;
      cartContainer.appendChild(row);
    }
  });
}

async function submitOrder() {
  const items = Object.values(cart);
  if (items.length === 0) {
    return; // Agent 4: Do nothing, button is natively disabled via updateCartUI
  }

  // Get the current table from the selector
  tableNumber = document.getElementById('table-selector').value;

  const orderId = `ORD-${Date.now()}`;
  currentOrderId = orderId;
  sessionStorage.setItem('currentOrderId', orderId);

  const order = {
    id: orderId,
    table: tableNumber,
    items: items.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
    total: items.reduce((sum, item) => sum + item.price * item.qty, 0),
    status: 'new',
    timestamp: new Date().toISOString()
  };

  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
  } catch(err) {
    console.error("Failed to submit order", err);
  }

  cart = {};
  updateCartUI();
  
  // Close the cart drawer — user can manually open status tracker anytime
  OrbStore.cartOpen = false;

  const overlay = document.getElementById('success-overlay');
  overlay.classList.add('active');
  setTimeout(() => {
    overlay.classList.remove('active');
    showTracker('new');
    startStatusPolling();
  }, 2500);

  const activeFilter = document.querySelector('.filter-tab.active');
  renderMenu(activeFilter ? activeFilter.dataset.filter : 'all');
}

// ============================================
// LIVE STATUS TRACKER — Continuous Polling
// ============================================
function startStatusPolling() {
  // Clear any existing interval
  if (statusPollInterval) clearInterval(statusPollInterval);

  // Poll every 2 seconds to check for status changes
  statusPollInterval = setInterval(() => {
    checkOrderStatus();
  }, 2000);
}

async function checkOrderStatus() {
  if (!currentOrderId) return;
  
  try {
    const res = await fetch(`/api/orders/${currentOrderId}`);
    if (!res.ok) return;
    const myOrder = await res.json();

    if (myOrder && myOrder.status) {
      if (OrbStore.orderState !== myOrder.status) {
        OrbStore.orderState = myOrder.status; // Mutate proxy
      }
      showTracker(myOrder.status);
    }
  } catch (e) {
    console.error("Error fetching order status", e);
  }
}

function showTracker(status) {
  const tracker = document.getElementById('live-tracker');
  const statusEl = document.getElementById('tracker-status');
  const descEl = document.getElementById('tracker-desc');
  const dot = document.getElementById('tracker-dot');

  tracker.classList.add('visible');

  const table = document.getElementById('table-selector').value;

  const states = {
    new: {
      title: '🍽️ Order Received!',
      desc: 'The kitchen has received your order and will start preparing it shortly.',
      color: 'var(--status-new)'
    },
    cooking: {
      title: '👨‍🍳 Chef is Cooking!',
      desc: 'Your meal is being prepared with care and passion.',
      color: 'var(--status-cooking)'
    },
    ready: {
      title: '✨ Your Meal is on the Way!',
      desc: `A waiter is bringing your food to Table ${table}. Bon appétit!`,
      color: 'var(--status-ready)'
    },
    completed: {
      title: '😊 Enjoy Your Meal!',
      desc: 'We hope you love it. Let us know if you need anything else.',
      color: 'var(--text-muted)'
    }
  };

  const s = states[status] || states.new;
  statusEl.textContent = s.title;
  statusEl.style.color = s.color;
  descEl.textContent = s.desc;
  dot.style.background = s.color;
  dot.style.boxShadow = `0 0 12px ${s.color}`;

  // ---- Update step-by-step progress circles ----
  const stepOrder = ['new', 'cooking', 'ready', 'completed'];
  const currentIndex = stepOrder.indexOf(status);

  const stepColors = {
    new: 'var(--status-new)',
    cooking: 'var(--status-cooking)',
    ready: 'var(--status-ready)',
    completed: 'var(--text-muted)'
  };

  // Update step circles (Agent 8 Photograph System)
  document.querySelectorAll('.tracker-step').forEach(step => {
    const stepName = step.dataset.step;
    const stepIndex = stepOrder.indexOf(stepName);
    const circle = step.querySelector('.step-circle');
    const img = step.querySelector('.step-img');

    if (stepIndex <= currentIndex) {
      // Active/completed step
      circle.style.border = `2px solid ${stepColors[stepName]}`;
      circle.style.boxShadow = `0 0 16px ${stepColors[stepName]}`;
      if(img) {
        img.style.opacity = '1';
        img.style.filter = 'none';
      }
    } else {
      // Inactive step
      circle.style.border = '2px solid var(--glass-border)';
      circle.style.boxShadow = 'none';
      if(img) {
        img.style.opacity = '0.4';
        img.style.filter = 'grayscale(80%)';
      }
    }
  });

  // Update connecting lines
  const lines = document.querySelectorAll('.step-line');
  lines.forEach((line, idx) => {
    if (idx < currentIndex) {
      line.style.background = stepColors[stepOrder[idx + 1]];
    } else {
      line.style.background = 'var(--glass-border)';
    }
  });

  // Stop polling when completed
  if (status === 'completed' && statusPollInterval) {
    setTimeout(() => {
      clearInterval(statusPollInterval);
      statusPollInterval = null;
    }, 5000);
  }
}
