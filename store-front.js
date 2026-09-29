/* Storefront logic */
(function () {
  var DB = window.StoreDB;
  var state = { cat: 'all', q: '', sort: 'featured', cart: [], wish: [] };
  try { state.cart = JSON.parse(localStorage.getItem('bt_cart') || '[]'); } catch (e) {}
  try { state.wish = JSON.parse(localStorage.getItem('bt_wish') || '[]'); } catch (e) {}
  function saveCart() { localStorage.setItem('bt_cart', JSON.stringify(state.cart)); }
  function saveWish() { localStorage.setItem('bt_wish', JSON.stringify(state.wish)); }
  function $ (s) { return document.querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._x); t._x = setTimeout(function () { t.classList.remove('show'); }, 2200); }
  function prod(id) { return DB.load().products.find(function (p) { return p.id === id; }); }
  function catName(id) { var c = DB.load().categories.find(function (x) { return x.id === id; }); return c ? c.name : ''; }
  function hideP() { try { return DB.load().settings.hidePrice == 1; } catch (e) { return false; } }

  function renderCats() {
    var d = DB.load();
    var el = $('#chips'); if (!el) return;
    var h = '<button class="chip' + (state.cat === 'all' ? ' on' : '') + '" data-c="all">All</button>';
    d.categories.forEach(function (c) {
      var face = c.image ? '<img src="' + c.image + '" alt="" style="width:20px;height:20px;border-radius:50%;object-fit:cover">' : esc(c.icon || '');
      h += '<button class="chip' + (state.cat === c.id ? ' on' : '') + '" data-c="' + c.id + '">' + face + ' ' + esc(c.name) + '</button>';
    });
    el.innerHTML = h;
    el.querySelectorAll('.chip').forEach(function (b) { b.onclick = function () { state.cat = b.dataset.c; renderCats(); renderGrid(); }; });
  }

  function filtered() {
    var d = DB.load(), list = d.products.slice();
    if (state.cat !== 'all') list = list.filter(function (p) { return p.cat === state.cat; });
    if (state.q) { var q = state.q.toLowerCase(); list = list.filter(function (p) { return (p.name + ' ' + (p.desc || '') + ' ' + (p.sku || '')).toLowerCase().indexOf(q) > -1; }); }
    if (state.sort === 'low') list.sort(function (a, b) { return a.price - b.price; });
    else if (state.sort === 'high') list.sort(function (a, b) { return b.price - a.price; });
    else if (state.sort === 'rating') list.sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); });
    else if (state.sort === 'new') list.sort(function (a, b) { return String(b.id).localeCompare(String(a.id)); });
    else list.sort(function (a, b) { return (b.featured || 0) - (a.featured || 0); });
    return list;
  }

  function renderGrid() {
    var g = $('#grid'); if (!g) return;
    var list = filtered();
    $('#count').textContent = list.length + ' products';
    if (!list.length) { g.innerHTML = '<div class="empty" style="grid-column:1/-1">No products found. Try another search.</div>'; return; }
    g.innerHTML = list.map(function (p) {
      var img = (p.images && p.images[0]) || '';
      var off = (!hideP() && p.mrp > p.price) ? Math.round((1 - p.price / p.mrp) * 100) : 0;
      var out = (p.type === 'physical' && Number(p.stock) <= 0);
      var priceHtml = hideP() ? '<div class="price" style="color:var(--muted);font-size:.82rem">Price on request</div>' : '<div class="price">' + DB.money(p.price) + (p.mrp > p.price ? '<s>' + DB.money(p.mrp) + '</s>' : '') + '</div>';
      return '<div class="card"><div class="im" data-v="' + p.id + '">'
        + (p.badge ? '<span class="badge' + (p.badge === 'SALE' ? ' sale' : '') + '">' + esc(p.badge) + '</span>' : (off ? '<span class="badge sale">-' + off + '%</span>' : ''))
        + '<span class="dtype">' + (p.type === 'digital' ? 'DIGITAL' : 'PHYSICAL') + '</span>'
        + '<img loading="lazy" src="' + img + '" alt="' + esc(p.name) + '"></div>'
        + '<div class="bd"><div class="cat">' + esc(catName(p.cat)) + '</div><h3 data-v="' + p.id + '">' + esc(p.name) + '</h3>'
        + '<div class="stars">★★★★★ <span>' + (p.rating || 4.5) + ' (' + (p.sold || 0) + ')</span></div>'
        + '<div style="font-size:.66rem;color:var(--muted)">Sold by <b>' + esc(p.vendorName || DB.vendorName(p.vendorId)) + '</b></div>'
        + priceHtml
        + '<div class="row"><button class="btn btn-navy btn-sm" data-add="' + p.id + '"' + (out ? ' disabled' : '') + '>' + (out ? 'Out of stock' : 'Add to Cart') + '</button>'
        + '<button class="btn btn-ghost btn-sm" data-v="' + p.id + '">View</button></div></div></div>';
    }).join('');
    g.querySelectorAll('[data-add]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); addCart(b.dataset.add, 1); }; });
    g.querySelectorAll('[data-v]').forEach(function (b) { b.onclick = function () { openView(b.dataset.v); }; });
  }

  function addCart(id, qty) {
    var p = prod(id); if (!p) return;
    if (p.type === 'physical' && Number(p.stock) <= 0) { toast('Out of stock'); return; }
    var it = state.cart.find(function (x) { return x.id === id; });
    if (it) it.qty = Math.min(it.qty + qty, p.type === 'physical' ? Number(p.stock) || 99 : 99);
    else state.cart.push({ id: id, qty: qty });
    saveCart(); renderCart(); toast('Added to cart ✓');
    openDrawer(true);
  }

  function cartTotals() {
    var d = DB.load(), sub = 0, hasPhy = false;
    state.cart.forEach(function (x) { var p = prod(x.id); if (!p) return; sub += p.price * x.qty; if (p.type === 'physical') hasPhy = true; });
    var ship = 0;
    if (hasPhy) ship = sub >= d.settings.freeShipAbove ? 0 : d.settings.flatShip;
    var code = (localStorage.getItem('bt_coupon') || '').toUpperCase();
    var cp = d.coupons.find(function (c) { return c.code === code && c.active; });
    var disc = 0;
    if (cp && sub >= (cp.min || 0)) disc = Math.round(sub * cp.off / 100);
    return { sub: sub, ship: ship, disc: disc, total: sub - disc + ship, code: code, hasPhy: hasPhy };
  }

  function renderCart() {
    var d = DB.load();
    var n = state.cart.reduce(function (a, x) { return a + x.qty; }, 0);
    $('#cartN').textContent = n; $('#wishN').textContent = state.wish.length;
    var box = $('#citems'); if (!box) return;
    if (!state.cart.length) { box.innerHTML = '<div class="empty">Cart is empty.<br><br><button class="btn btn-navy btn-sm" onclick="document.getElementById(\'drawer\').classList.remove(\'open\');document.getElementById(\'ovl\').classList.remove(\'show\')">Continue shopping</button></div>'; }
    else box.innerHTML = state.cart.map(function (x) {
      var p = prod(x.id); if (!p) return '';
      var sub = hideP() ? 'Price on request' : DB.money(p.price);
      return '<div class="ditem"><img src="' + ((p.images && p.images[0]) || '') + '"><div style="flex:1"><b style="font-size:.8rem">' + esc(p.name) + '</b><div style="font-size:.72rem;color:var(--muted)">' + sub + ' • ' + (p.type === 'digital' ? 'Digital' : 'Physical') + '</div><div class="qty"><button data-d="' + p.id + '">−</button><b>' + x.qty + '</b><button data-i="' + p.id + '">+</button><button class="btn btn-ghost btn-sm" data-r="' + p.id + '" style="margin-left:auto">Remove</button></div></div></div>';
    }).join('');
    box.querySelectorAll('[data-d]').forEach(function (b) { b.onclick = function () { chQty(b.dataset.d, -1); }; });
    box.querySelectorAll('[data-i]').forEach(function (b) { b.onclick = function () { chQty(b.dataset.i, 1); }; });
    box.querySelectorAll('[data-r]').forEach(function (b) { b.onclick = function () { state.cart = state.cart.filter(function (x) { return x.id !== b.dataset.r; }); saveCart(); renderCart(); }; });
    var t = cartTotals();
    if (hideP()) {
      $('#ctotal').innerHTML = '<div class="line"><span>Items</span><span>' + state.cart.reduce(function (a, x) { return a + x.qty; }, 0) + '</span></div>'
        + '<div class="total"><span>Total</span><span style="font-size:.85rem;color:var(--muted)">On request</span></div>'
        + '<div style="font-size:.72rem;color:var(--muted)">Final price confirmed on WhatsApp.</div>';
      return;
    }
    $('#ctotal').innerHTML = '<div class="line"><span>Subtotal</span><span>' + DB.money(t.sub) + '</span></div>'
      + (t.disc ? '<div class="line"><span>Coupon ' + esc(t.code) + '</span><span>−' + DB.money(t.disc) + '</span></div>' : '')
      + '<div class="line"><span>Shipping' + (t.ship === 0 && t.hasPhy ? ' (FREE)' : '') + '</span><span>' + (t.hasPhy ? DB.money(t.ship) : '—') + '</span></div>'
      + '<div class="total"><span>Total</span><span>' + DB.money(t.total) + '</span></div>';
  }
  function chQty(id, dlt) {
    var it = state.cart.find(function (x) { return x.id === id; }); if (!it) return;
    var p = prod(id);
    it.qty += dlt;
    if (it.qty <= 0) state.cart = state.cart.filter(function (x) { return x.id !== id; });
    if (p && p.type === 'physical') it.qty = Math.min(it.qty, Number(p.stock) || 99);
    saveCart(); renderCart();
  }

  var viewId = null, viewImg = 0;
  function openView(id) {
    var p = prod(id); if (!p) return;
    viewId = id; viewImg = 0;
    var off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
    var priceBlock = hideP() ? '<div class="price" style="font-size:1rem;margin:.4rem 0;color:var(--muted)">Price on request</div>' : '<div class="price" style="font-size:1.4rem;margin:.4rem 0">' + DB.money(p.price) + (p.mrp > p.price ? '<s>' + DB.money(p.mrp) + '</s> <span class="pill">' + off + '% OFF</span>' : '') + '</div>';
    $('#mbody').innerHTML = '<div class="mi zoomable" id="mstage"><img id="mimg" src="' + ((p.images && p.images[0]) || '') + '" title="Tap to view fullscreen"><span class="zoom-hint">⤢ Tap to zoom</span>'
      + ((p.images || []).length > 1 ? '<div class="thumbs" style="padding:.6rem">' + p.images.map(function (s, i) { return '<img src="' + s + '" data-t="' + i + '" class="' + (i === 0 ? 'on' : '') + '">'; }).join('') + '</div>' : '') + '</div>'
      + '<div class="mt"><div class="cat" style="font-size:.62rem;font-weight:800;letter-spacing:1.2px;color:var(--blue)">' + esc(catName(p.cat)) + ' • ' + (p.type === 'digital' ? 'DIGITAL DELIVERY' : 'PHYSICAL SHIPPING') + '</div>'
      + '<h2 style="font-family:var(--font-h);font-size:1.3rem;margin:.3rem 0">' + esc(p.name) + '</h2>'
      + '<div class="stars">★★★★★ <span>' + (p.rating || 4.5) + ' • ' + (p.sold || 0) + ' sold • SKU ' + esc(p.sku || '') + '</span></div>'
      + '<div style="font-size:.74rem;color:var(--muted)">Sold by <b>' + esc(p.vendorName || DB.vendorName(p.vendorId)) + '</b></div>'
      + priceBlock
      + '<p style="font-size:.84rem;color:var(--muted)">' + esc(p.desc || '') + '</p>'
      + ((p.specs || []).length ? '<div style="margin:.6rem 0">' + p.specs.map(function (s) { return '<span class="pill">✓ ' + esc(s) + '</span>'; }).join(' ') + '</div>' : '')
      + '<div style="font-size:.78rem;margin:.4rem 0"><b>Stock:</b> ' + (p.type === 'digital' ? 'Instant delivery' : esc(p.stock)) + ' &nbsp; ' + (p.type === 'physical' && Number(p.stock) <= 0 ? '<b style="color:var(--red)">Out of stock</b>' : '<b style="color:var(--green)">In stock</b>') + '</div>'
      + '<div style="display:flex;gap:.5rem;align-items:center;margin:.7rem 0"><div class="qty"><button id="mqd">−</button><b id="mqv">1</b><button id="mqi">+</button></div><button class="btn btn-ghost btn-sm" id="mwh">♡ Wishlist</button></div>'
      + '<div style="display:flex;gap:.5rem;flex-wrap:wrap"><button class="btn btn-navy" id="madd">Add to Cart</button><button class="btn btn-green" id="mbuy">' + (hideP() ? 'Enquire on WhatsApp' : 'Buy on WhatsApp') + '</button></div>'
      + (hideP() ? '<div style="font-size:.72rem;color:var(--muted);margin-top:.7rem">📩 Price shared on WhatsApp • 🚚 Shipping confirmed on chat</div>' : '<div style="font-size:.72rem;color:var(--muted);margin-top:.7rem">🚚 Free shipping above ' + DB.money(DB.load().settings.freeShipAbove) + ' • 💳 UPI / PayPal • 📩 Digital items delivered on WhatsApp</div>') + '</div>';
    $('#modal').classList.add('show');
    var q = 1;
    $('#mqd').onclick = function () { q = Math.max(1, q - 1); $('#mqv').textContent = q; };
    $('#mqi').onclick = function () { q++; $('#mqv').textContent = q; };
    $('#madd').onclick = function () { addCart(id, q); closeModal(); };
    $('#mbuy').onclick = function () { quickBuy(id, q); };
    $('#mwh').onclick = function () { toggleWish(id); };
    var th = document.querySelectorAll('#mbody [data-t]');
    th.forEach(function (t) { t.onclick = function () { viewImg = +t.dataset.t; $('#mimg').src = p.images[viewImg]; th.forEach(function (x) { x.classList.remove('on'); }); t.classList.add('on'); openLb(p.images, viewImg); }; });
    $('#mimg').onclick = function () { openLb(p.images, viewImg); };
  }
  function closeModal() { $('#modal').classList.remove('show'); }

  /* Fullscreen lightbox with zoom + pan */
  var lbImgs = [], lbIdx = 0, lbZoom = 1, lbX = 0, lbY = 0, lbDrag = null, lbPinch = 0;
  function lbApply() {
    var im = $('#lbImg'); if (!im) return;
    im.style.transform = 'translate(' + lbX + 'px,' + lbY + 'px) scale(' + lbZoom + ')';
    var c = $('#lbCount'); if (c) c.textContent = lbImgs.length > 1 ? ((lbIdx + 1) + ' / ' + lbImgs.length) : '';
  }
  function lbShow(i) {
    if (!lbImgs.length) return;
    lbIdx = (i + lbImgs.length) % lbImgs.length; lbZoom = 1; lbX = 0; lbY = 0;
    $('#lbImg').src = lbImgs[lbIdx]; lbApply();
  }
  function openLb(imgs, i) {
    lbImgs = (imgs || []).filter(Boolean); if (!lbImgs.length) return;
    lbShow(i || 0);
    $('#lightbox').classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() { var l = $('#lightbox'); if (l) l.classList.remove('show'); document.body.style.overflow = ''; }
  function lbZoomBy(f) { lbZoom = Math.min(4, Math.max(1, lbZoom * f)); if (lbZoom === 1) { lbX = 0; lbY = 0; } lbApply(); }
  function bindLb() {
    var st = $('#lbStage'); if (!st || st._bound) return; st._bound = true;
    $('#lbClose').onclick = closeLb;
    $('#lightbox').addEventListener('click', function (e) { if (e.target.id === 'lightbox' || e.target.id === 'lbStage') closeLb(); });
    $('#lbPrev').onclick = function (e) { e.stopPropagation(); lbShow(lbIdx - 1); };
    $('#lbNext').onclick = function (e) { e.stopPropagation(); lbShow(lbIdx + 1); };
    $('#lbPlus').onclick = function () { lbZoomBy(1.4); };
    $('#lbMinus').onclick = function () { lbZoomBy(1 / 1.4); };
    $('#lbReset').onclick = function () { lbZoom = 1; lbX = 0; lbY = 0; lbApply(); };
    st.addEventListener('wheel', function (e) { e.preventDefault(); lbZoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15); }, { passive: false });
    $('#lbImg').addEventListener('dblclick', function () { if (lbZoom > 1) { lbZoom = 1; lbX = 0; lbY = 0; } else lbZoom = 2.5; lbApply(); });
    st.addEventListener('pointerdown', function (e) { lbDrag = { x: e.clientX - lbX, y: e.clientY - lbY }; $('#lbImg').classList.add('grabbing'); try { st.setPointerCapture(e.pointerId); } catch (err) {} });
    st.addEventListener('pointermove', function (e) { if (!lbDrag || e.pointerType === 'touch') return; if (lbZoom <= 1) return; lbX = e.clientX - lbDrag.x; lbY = e.clientY - lbDrag.y; lbApply(); });
    window.addEventListener('pointerup', function () { lbDrag = null; var im = $('#lbImg'); if (im) im.classList.remove('grabbing'); });
    var tx = 0, lastD = 0;
    st.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) { lastD = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); lbPinch = lbZoom; }
      else if (e.touches.length === 1) tx = e.touches[0].clientX;
    }, { passive: true });
    st.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (lastD) { lbZoom = Math.min(4, Math.max(1, lbPinch * d / lastD)); if (lbZoom === 1) { lbX = 0; lbY = 0; } lbApply(); }
      } else if (e.touches.length === 1 && lbZoom > 1) { e.preventDefault(); }
    }, { passive: false });
    st.addEventListener('touchend', function (e) {
      if (e.changedTouches.length === 1 && lbZoom === 1 && lbImgs.length > 1) {
        var dx = e.changedTouches[0].clientX - tx;
        if (Math.abs(dx) > 50) lbShow(lbIdx + (dx < 0 ? 1 : -1));
      }
      lastD = 0;
    });
    document.addEventListener('keydown', function (e) {
      var l = $('#lightbox'); if (!l || !l.classList.contains('show')) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowRight') lbShow(lbIdx + 1);
      else if (e.key === 'ArrowLeft') lbShow(lbIdx - 1);
    });
  }
  function quickBuy(id, qty) {
    var p = prod(id); if (!p) return;
    var msg = hideP() ? 'Hi ' + DB.load().settings.storeName + '! I want price for:%0A• ' + p.name + ' x' + qty + '%0AEnquiry via website.' : 'Hi ' + DB.load().settings.storeName + '! I want to buy:%0A• ' + p.name + ' x' + qty + ' = ' + DB.money(p.price * qty) + '%0AOrder via website.';
    window.open(DB.waLink(decodeURIComponent(msg)), '_blank');
    pushOrder([{ id: id, qty: qty }], 'WhatsApp direct');
  }
  function toggleWish(id) {
    var i = state.wish.indexOf(id);
    if (i > -1) state.wish.splice(i, 1); else state.wish.push(id);
    saveWish(); renderCart(); toast(i > -1 ? 'Removed from wishlist' : 'Saved to wishlist ♡');
  }
  function pushOrder(items, via) {
    var d = DB.load();
    var t = cartTotals();
    d.orders.unshift({ id: DB.uid('ORD'), date: new Date().toLocaleString('en-IN'), items: items.map(function (x) { var p = prod(x.id) || {}; return { id: x.id, vendorId: p.vendorId || 'admin', name: p.name || x.id, qty: x.qty, price: p.price || 0 }; }), total: t.total || items.reduce(function (a, x) { var p = prod(x.id) || { price: 0 }; return a + p.price * x.qty; }, 0), via: via, status: 'New', customer: document.getElementById('coName') ? document.getElementById('coName').value : '' });
    d.products.forEach(function (p) { var it = items.find(function (x) { return x.id === p.id; }); if (it && p.type === 'physical') p.stock = Math.max(0, Number(p.stock) - it.qty); });
    DB.save(d);
  }

  function checkout() {
    if (!state.cart.length) { toast('Cart is empty'); return; }
    var name = ($('#coName').value || '').trim(), phone = ($('#coPhone').value || '').trim(), addr = ($('#coAddr').value || '').trim(), note = ($('#coNote').value || '').trim();
    if (!name || !phone) { toast('Enter name + phone'); return; }
    var t = cartTotals();
    if (t.hasPhy && !addr) { toast('Address needed for physical items'); return; }
    var lines = state.cart.map(function (x, i) { var p = prod(x.id); return hideP() ? ((i + 1) + '. ' + p.name + ' x' + x.qty) : ((i + 1) + '. ' + p.name + ' x' + x.qty + ' = ' + DB.money(p.price * x.qty)); });
    var msg = hideP() ? ('Price enquiry — ' + DB.load().settings.storeName + '\nName: ' + name + '\nPhone: ' + phone + (addr ? '\nAddress: ' + addr : '') + '\n\n' + lines.join('\n') + (note ? '\nNote: ' + note : '') + '\n\nPlease share price + delivery details.') : ('New order — ' + DB.load().settings.storeName + '\nName: ' + name + '\nPhone: ' + phone + (addr ? '\nAddress: ' + addr : '') + '\n\n' + lines.join('\n') + '\n\nSubtotal: ' + DB.money(t.sub) + (t.disc ? '\nDiscount: -' + DB.money(t.disc) : '') + '\nShipping: ' + (t.hasPhy ? DB.money(t.ship) : '—') + '\nTotal: ' + DB.money(t.total) + (note ? '\nNote: ' + note : ''));
    pushOrder(state.cart.slice(), 'Cart checkout');
    state.cart = []; saveCart(); renderCart();
    window.open(DB.waLink(msg), '_blank');
    toast('Order sent! Continue on WhatsApp ✓');
    openDrawer(false);
  }

  function openDrawer(o) { $('#drawer').classList.toggle('open', o); $('#ovl').classList.toggle('show', o); }

  var sIdx = 0, sTimer = null;
  function renderBanners() {
    var box = $('#bannerBox'); if (!box) return;
    var d = DB.load(), list = (d.settings.banners || []).filter(function (b) { return b && b.img; });
    if (!list.length) { box.innerHTML = ''; box.style.display = 'none'; return; }
    box.style.display = 'block';
    sIdx = 0;
    box.innerHTML = '<div class="slider"><div class="slides" id="slides">' + list.map(function (b, i) {
      var im = '<img src="' + b.img + '" alt="banner ' + (i + 1) + '" draggable="false">';
      return '<div class="slide">' + (b.link ? '<a href="' + b.link + '"' + (/^https?:/.test(b.link) ? ' target="_blank" rel="noopener"' : '') + '>' + im + '</a>' : im) + '</div>';
    }).join('') + '</div>' + (list.length > 1 ? '<button class="sarrow l" id="sPrev">‹</button><button class="sarrow r" id="sNext">›</button><div class="sdots" id="sDots">' + list.map(function (_, i) { return '<i data-d="' + i + '" class="' + (i === 0 ? 'on' : '') + '"></i>'; }).join('') + '</div>' : '') + '</div>';
    if (list.length < 2) return;
    function go(i) {
      sIdx = (i + list.length) % list.length;
      $('#slides').style.transform = 'translateX(-' + (sIdx * 100) + '%)';
      document.querySelectorAll('#sDots i').forEach(function (dt, k) { dt.classList.toggle('on', k === sIdx); });
    }
    function auto() { clearInterval(sTimer); sTimer = setInterval(function () { go(sIdx + 1); }, 4000); }
    $('#sPrev').onclick = function (e) { e.stopPropagation(); go(sIdx - 1); auto(); };
    $('#sNext').onclick = function (e) { e.stopPropagation(); go(sIdx + 1); auto(); };
    document.querySelectorAll('#sDots i').forEach(function (dt) { dt.onclick = function () { go(+dt.dataset.d); auto(); }; });
    var sx = null;
    box.querySelector('.slider').addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; clearInterval(sTimer); }, { passive: true });
    box.querySelector('.slider').addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(sIdx + (dx < 0 ? 1 : -1)); auto(); sx = null; });
    auto();
  }

  function init() {
    var d = DB.load();
    document.title = d.settings.storeName + ' — Online Store';
    $('#yr').textContent = new Date().getFullYear();
    $('#announce').innerHTML = esc(d.settings.announcement || '');
    $('#sname').textContent = d.settings.storeName; $('#stag').textContent = d.settings.tagline;
    var ht = $('#heroT'); if (ht) ht.textContent = d.settings.heroTitle || '';
    var hs = $('#heroS'); if (hs) hs.textContent = d.settings.heroSub || '';
    var lb = $('#logoBox');
    if (lb) { if (d.settings.logo) { lb.innerHTML = '<img src="' + d.settings.logo + '" alt="logo" style="width:100%;height:100%;object-fit:cover;border-radius:12px">'; lb.style.overflow = 'hidden'; lb.style.padding = '0'; } else { lb.innerHTML = '<i class="fas fa-store"></i>'; } }
    $('#fname').textContent = d.settings.storeName; $('#ffoot').textContent = d.settings.tagline + ' • WhatsApp: +' + (d.settings.whatsapp || '');
    if (hideP()) { var so = $('#sort'); if (so) { Array.prototype.slice.call(so.options).forEach(function (o) { if (o.value === 'low' || o.value === 'high') o.remove(); }); } var cp = $('#coupon'); if (cp) cp.style.display = 'none'; var ap = $('#applyCp'); if (ap) ap.style.display = 'none'; }
    renderBanners(); renderCats(); renderGrid(); renderCart(); bindLb();
    $('#q').addEventListener('input', function (e) { state.q = e.target.value; renderGrid(); });
    $('#sort').addEventListener('change', function (e) { state.sort = e.target.value; renderGrid(); });
    $('#cartBtn').onclick = function () { openDrawer(true); };
    $('#wishBtn').onclick = function () {
      if (!state.wish.length) { toast('Wishlist is empty'); return; }
      var names = state.wish.map(function (id) { var p = prod(id); return p ? p.name : id; }).join('\n• ');
      toast('Wishlist:\n• ' + names);
    };
    $('#closeD').onclick = function () { openDrawer(false); };
    $('#ovl').onclick = function () { openDrawer(false); closeModal(); };
    $('#mclose').onclick = closeModal;
    $('#checkout').onclick = checkout;
    $('#applyCp').onclick = function () { localStorage.setItem('bt_coupon', ($('#coupon').value || '').trim().toUpperCase()); renderCart(); toast('Coupon applied'); };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var l = $('#lightbox'); if (l && l.classList.contains('show')) return; openDrawer(false); closeModal(); } });
  }
  document.addEventListener('DOMContentLoaded', init);
})();
