/* Admin logic */
(function () {
  var DB = window.StoreDB, tab = 'dash', editId = null, tmpImgs = [], tmpCatImg = '', tmpBanners = [];
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._x); t._x = setTimeout(function () { t.classList.remove('show'); }, 2200); }
  function authed() { return sessionStorage.getItem('bt_admin') === '1'; }

  function login() {
    var d = DB.load();
    if ($('#pass').value === (d.settings.adminPass || 'admin123')) { sessionStorage.setItem('bt_admin', '1'); boot(); }
    else toast('Wrong password');
  }

  function boot() {
    $('#lock').style.display = 'none'; $('#app').style.display = 'grid';
    var _s = DB.load().settings;
    $('#aname').textContent = _s.storeName;
    if (_s.logo) { $('#aname').innerHTML = '<img src="' + _s.logo + '" style="width:26px;height:26px;border-radius:8px;object-fit:cover;vertical-align:-7px;margin-right:6px">' + esc(_s.storeName); }
    document.querySelectorAll('.side a[data-t]').forEach(function (a) { a.onclick = function () { tab = a.dataset.t; document.querySelectorAll('.side a[data-t]').forEach(function (x) { x.classList.remove('on'); }); a.classList.add('on'); render(); }; });
    $('#logout').onclick = function () { sessionStorage.removeItem('bt_admin'); location.reload(); };
    $('#mclose').onclick = function () { $('#modal').classList.remove('show'); $('#ovl').classList.remove('show'); };
    $('#ovl').onclick = function () { $('#modal').classList.remove('show'); $('#ovl').classList.remove('show'); };
    render();
  }

  function stats() {
    var d = DB.load();
    var val = d.products.reduce(function (a, p) { return a + p.price * (Number(p.stock) || 0); }, 0);
    var low = d.products.filter(function (p) { return p.type === 'physical' && Number(p.stock) < 10; }).length;
    return { nP: d.products.length, nC: d.categories.length, nO: d.orders.length, val: val, low: low };
  }

  function render() {
    var v = $('#view');
    if (tab === 'dash') return vDash(v);
    if (tab === 'products') return vProds(v);
    if (tab === 'cats') return vCats(v);
    if (tab === 'orders') return vOrders(v);
    if (tab === 'coupons') return vCoupons(v);
    if (tab === 'settings') return vSettings(v);
    if (tab === 'data') return vData(v);
  }

  function vDash(v) {
    var s = stats(), d = DB.load();
    v.innerHTML = '<h1 style="font-family:var(--font-h)">Dashboard</h1><p style="color:var(--muted);font-size:.82rem">Static store • data saves in this browser (localStorage). Export backup before switching device.</p>'
      + '<div class="stat-grid"><div class="stat"><b>' + s.nP + '</b><small>Products</small></div><div class="stat"><b>' + s.nC + '</b><small>Categories</small></div><div class="stat"><b>' + s.nO + '</b><small>Orders / leads</small></div><div class="stat"><b>' + DB.money(s.val) + '</b><small>Inventory value</small></div></div>'
      + (s.low ? '<div class="pill" style="border-color:#dc2626;color:#dc2626">⚠ ' + s.low + ' products low stock (&lt;10)</div>' : '<div class="pill">✓ Stock healthy</div>')
      + '<h3 style="font-family:var(--font-h);margin:1rem 0 .5rem">Latest orders</h3>' + ordersTbl(d.orders.slice(0, 5))
      + '<h3 style="font-family:var(--font-h);margin:1rem 0 .5rem">Quick actions</h3><div style="display:flex;gap:.5rem;flex-wrap:wrap"><button class="btn btn-navy btn-sm" onclick="document.querySelector(\'.side a[data-t=products]\').click()">+ Add product</button><button class="btn btn-ghost btn-sm" onclick="document.querySelector(\'.side a[data-t=data]\').click()">Export backup</button><a class="btn btn-gold btn-sm" href="onlinestore.html" target="_blank">View store</a></div>';
    bindOrders(v);
  }

  function ordersTbl(list) {
    if (!list.length) return '<div class="empty">No orders yet. Checkout submissions from the store appear here on this device.</div>';
    return '<div style="overflow:auto"><table class="tbl"><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr>'
      + list.map(function (o) {
        return '<tr><td><b>' + esc(o.id) + '</b><br><small>' + esc(o.customer || '') + ' • ' + esc(o.via || '') + '</small></td><td><small>' + esc(o.date) + '</small></td><td><small>' + o.items.map(function (i) { return esc(i.name) + ' x' + i.qty; }).join('<br>') + '</small></td><td><b>' + DB.money(o.total) + '</b></td>'
          + '<td><select data-st="' + o.id + '">' + ['New', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map(function (s) { return '<option' + (o.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td>'
          + '<td><button class="btn btn-ghost btn-sm" data-del="' + o.id + '">Delete</button></td></tr>';
      }).join('') + '</table></div>';
  }
  function bindOrders(root) {
    root.querySelectorAll('[data-st]').forEach(function (s) { s.onchange = function () { var d = DB.load(); var o = d.orders.find(function (x) { return x.id === s.dataset.st; }); if (o) o.status = s.value; DB.save(d); toast('Status saved'); }; });
    root.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm('Delete order?')) return; var d = DB.load(); d.orders = d.orders.filter(function (x) { return x.id !== b.dataset.del; }); DB.save(d); render(); }; });
  }

  function vProds(v) {
    var d = DB.load();
    v.innerHTML = '<div style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap"><h1 style="font-family:var(--font-h);margin-right:auto">Products (' + d.products.length + ')</h1><input id="pq" class="inp" placeholder="Search…"><button class="btn btn-navy btn-sm" id="padd">+ Add product</button></div><div style="overflow:auto;margin-top:.8rem"><table class="tbl"><tr><th>Product</th><th>Cat</th><th>Type</th><th>Price</th><th>Stock</th><th>Featured</th><th></th></tr><tbody id="pb"></tbody></table></div>';
    function draw(q) {
      var list = d.products.filter(function (p) { return !q || (p.name + ' ' + (p.sku || '')).toLowerCase().indexOf(q.toLowerCase()) > -1; });
      $('#pb').innerHTML = list.map(function (p) {
        return '<tr><td><div style="display:flex;gap:.6rem;align-items:center"><img src="' + ((p.images && p.images[0]) || '') + '"><div><b>' + esc(p.name) + '</b><br><small>' + esc(p.sku || '') + ' • ★' + (p.rating || '') + '</small></div></div></td><td><small>' + esc((d.categories.find(function (c) { return c.id === p.cat; }) || {}).name || '') + '</small></td><td><small>' + p.type + '</small></td><td><b>' + DB.money(p.price) + '</b><br><small><s>' + DB.money(p.mrp) + '</s></small></td><td>' + esc(p.stock) + '</td><td>' + (p.featured ? '⭐' : '—') + '</td><td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" data-e="' + p.id + '">Edit</button> <button class="btn btn-ghost btn-sm" data-x="' + p.id + '">Delete</button></td></tr>';
      }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--muted)">No products</td></tr>';
      $('#pb').querySelectorAll('[data-e]').forEach(function (b) { b.onclick = function () { openProd(b.dataset.e); }; });
      $('#pb').querySelectorAll('[data-x]').forEach(function (b) { b.onclick = function () { if (!confirm('Delete product?')) return; var dd = DB.load(); dd.products = dd.products.filter(function (x) { return x.id !== b.dataset.x; }); DB.save(dd); vProds(v); }; });
    }
    draw('');
    $('#pq').oninput = function (e) { d = DB.load(); draw(e.target.value); };
    $('#padd').onclick = function () { openProd(null); };
  }

  function openProd(id) {
    var d = DB.load(), p = id ? d.products.find(function (x) { return x.id === id; }) : { name: '', cat: d.categories[0] ? d.categories[0].id : '', type: 'physical', price: 999, mrp: 1499, stock: 50, sku: '', rating: 4.5, sold: 0, featured: 0, badge: '', desc: '', link: '', specs: [] };
    editId = id; tmpImgs = (p.images || []).slice();
    $('#mbody').innerHTML = '<h2 style="font-family:var(--font-h)">' + (id ? 'Edit' : 'Add') + ' product</h2>'
      + '<label>Name *</label><input id="f_name" value="' + esc(p.name) + '">'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem"><div><label>Category</label><select id="f_cat">' + d.categories.map(function (c) { return '<option value="' + c.id + '"' + (p.cat === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('') + '</select></div><div><label>Type</label><select id="f_type"><option value="physical"' + (p.type === 'physical' ? ' selected' : '') + '>Physical (ships)</option><option value="digital"' + (p.type === 'digital' ? ' selected' : '') + '>Digital (WhatsApp delivery)</option></select></div></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.6rem"><div><label>Price ₹ *</label><input id="f_price" type="number" value="' + p.price + '"></div><div><label>MRP ₹</label><input id="f_mrp" type="number" value="' + (p.mrp || '') + '"></div><div><label>Stock</label><input id="f_stock" type="number" value="' + p.stock + '"></div></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.6rem"><div><label>SKU</label><input id="f_sku" value="' + esc(p.sku || '') + '"></div><div><label>Rating</label><input id="f_rate" type="number" step="0.1" min="1" max="5" value="' + (p.rating || 4.5) + '"></div><div><label>Badge</label><select id="f_badge"><option value="">—</option>' + ['NEW', 'SALE', 'BESTSELLER', 'HOT'].map(function (b) { return '<option' + (p.badge === b ? ' selected' : '') + '>' + b + '</option>'; }).join('') + '</select></div></div>'
      + '<label>Description</label><textarea id="f_desc">' + esc(p.desc || '') + '</textarea>'
      + '<label>Specs (one per line)</label><textarea id="f_specs" style="min-height:60px">' + esc((p.specs || []).join('\n')) + '</textarea>'
      + '<label>Digital file / demo link (URL, optional)</label><input id="f_link" value="' + esc(p.link || '') + '">'
      + '<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="f_feat" ' + (p.featured ? 'checked' : '') + ' style="width:auto"> Featured on homepage</label>'
      + '<label>Product images (upload — auto-compressed. First = cover. Click ☆ for cover.)</label><input type="file" id="f_imgs" accept="image/*" multiple class="inp" style="width:100%"><div id="upstat" style="font-size:.74rem;color:var(--muted);margin-top:.3rem"></div><div class="pgrid" id="pimgs" style="margin-top:.6rem"></div>'
      + '<div style="display:flex;gap:.5rem;margin-top:1rem"><button class="btn btn-navy" id="fsave">Save product</button><button class="btn btn-ghost" id="fcancel">Cancel</button></div>'
      + '<p style="font-size:.72rem;color:var(--muted);margin-top:.5rem" id="upnote"></p><div style="display:flex;gap:.5rem"><input id="f_url" class="inp" placeholder="Paste image URL + Add" style="flex:1"><button class="btn btn-ghost btn-sm" id="f_addurl">Add</button></div>';
    drawImgs();
    $('#upnote').textContent = DB.load().settings.imgbbKey ? '✓ imgbb connected — uploads go to imgbb URL (no browser storage used).' : 'No imgbb key — uploads stored as compressed base64 in browser. Add imgbb key in Settings for URL hosting.';
    $('#f_imgs').onchange = function (e) {
      var files = Array.prototype.slice.call(e.target.files || []).slice(0, 6);
      var useBb = !!((DB.load().settings.imgbbKey || '').trim());
      $('#upstat').textContent = useBb ? 'Uploading to imgbb… 0/' + files.length : 'Compressing images…';
      (function next(i) {
        if (i >= files.length) { drawImgs(); $('#upstat').textContent = useBb ? 'Uploaded ✓' : 'Compressed ✓'; return; }
        $('#upstat').textContent = (useBb ? 'Uploading to imgbb… ' : 'Compressing… ') + (i + 1) + '/' + files.length;
        var job = useBb ? DB.uploadToImgbb(files[i]) : DB.compressImage(files[i]);
        job.then(function (u) { tmpImgs.push(u); next(i + 1); }).catch(function (err) { toast('Upload failed: ' + (err && err.message || err)); next(i + 1); });
      })(0);
    };
    $('#f_addurl').onclick = function () { var u = $('#f_url').value.trim(); if (u) { tmpImgs.push(u); $('#f_url').value = ''; drawImgs(); } };
    $('#fcancel').onclick = closeM;
    $('#fsave').onclick = function () {
      var dd = DB.load();
      var obj = { id: id || DB.uid('p'), name: $('#f_name').value.trim(), cat: $('#f_cat').value, type: $('#f_type').value, price: +$('#f_price').value || 0, mrp: +$('#f_mrp').value || +$('#f_price').value || 0, stock: +$('#f_stock').value || 0, sku: $('#f_sku').value.trim(), rating: +$('#f_rate').value || 4.5, sold: p.sold || 0, badge: $('#f_badge').value, desc: $('#f_desc').value.trim(), specs: $('#f_specs').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean), link: $('#f_link').value.trim(), featured: $('#f_feat').checked ? 1 : 0, images: tmpImgs.length ? tmpImgs : [''] };
      if (!obj.name) { toast('Name required'); return; }
      if (id) { var ix = dd.products.findIndex(function (x) { return x.id === id; }); dd.products[ix] = obj; }
      else dd.products.unshift(obj);
      DB.save(dd); closeM(); render(); toast('Product saved ✓');
    };
    $('#modal').classList.add('show'); $('#ovl').classList.add('show');
  }
  function drawImgs() {
    var box = $('#pimgs'); if (!box) return;
    box.innerHTML = tmpImgs.map(function (s, i) { return '<div class="pimg"><img src="' + s + '"><button data-star="' + i + '" class="star">' + (i === 0 ? '★' : '☆') + '</button><button data-rm="' + i + '">✕</button></div>'; }).join('') || '<small style="color:var(--muted)">No images yet</small>';
    box.querySelectorAll('[data-rm]').forEach(function (b) { b.onclick = function () { tmpImgs.splice(+b.dataset.rm, 1); drawImgs(); }; });
    box.querySelectorAll('[data-star]').forEach(function (b) { b.onclick = function () { var i = +b.dataset.star, s = tmpImgs.splice(i, 1)[0]; tmpImgs.unshift(s); drawImgs(); }; });
  }
  function closeM() { $('#modal').classList.remove('show'); $('#ovl').classList.remove('show'); }

  function vCats(v) {
    var d = DB.load();
    v.innerHTML = '<div style="display:flex;gap:.6rem;align-items:center"><h1 style="font-family:var(--font-h);margin-right:auto">Categories (' + d.categories.length + ')</h1><button class="btn btn-navy btn-sm" id="cadd">+ Add category</button></div>' + (d.settings.imgbbKey ? '<div class="pill">✓ imgbb connected — category images upload to URL</div>' : '<div class="pill">No imgbb key — add it in Settings to host category images via URL</div>') + '<div style="overflow:auto;margin-top:.8rem"><table class="tbl"><tr><th>Image</th><th>Name</th><th>Products</th><th></th></tr>'
      + d.categories.map(function (c) { var n = d.products.filter(function (p) { return p.cat === c.id; }).length; var thumb = c.image ? '<img src="' + c.image + '" style="width:44px;height:44px;border-radius:10px;object-fit:cover">' : '<span style="font-size:1.4rem">' + esc(c.icon || '📦') + '</span>'; return '<tr><td>' + thumb + '</td><td><b>' + esc(c.name) + '</b><br><small>' + esc(c.desc || '') + '</small></td><td>' + n + '</td><td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" data-e="' + c.id + '">Edit</button> <button class="btn btn-ghost btn-sm" data-x="' + c.id + '">Delete</button></td></tr>'; }).join('') + '</table></div>';
    $('#cadd').onclick = function () { openCat(null); };
    v.querySelectorAll('[data-e]').forEach(function (b) { b.onclick = function () { openCat(b.dataset.e); }; });
    v.querySelectorAll('[data-x]').forEach(function (b) { b.onclick = function () { var dd = DB.load(); if (dd.products.some(function (p) { return p.cat === b.dataset.x; })) { toast('Move/delete its products first'); return; } if (!confirm('Delete category?')) return; dd.categories = dd.categories.filter(function (x) { return x.id !== b.dataset.x; }); DB.save(dd); render(); }; });
  }
  function openCat(id) {
    var d = DB.load(), c = id ? d.categories.find(function (x) { return x.id === id; }) : { name: '', icon: '📦', image: '', desc: '' };
    tmpCatImg = c.image || '';
    $('#mbody').innerHTML = '<h2 style="font-family:var(--font-h)">' + (id ? 'Edit' : 'Add') + ' category</h2><label>Name *</label><input id="c_name" value="' + esc(c.name) + '"><label>Icon (emoji fallback)</label><input id="c_icon" value="' + esc(c.icon || '📦') + '">'
      + '<label>Category image (imgbb URL preferred — shows in store instead of emoji)</label><div style="display:flex;gap:.6rem;align-items:center"><img id="c_prev" src="' + esc(tmpCatImg) + '" style="width:64px;height:64px;border-radius:14px;object-fit:cover;border:1px solid var(--line2);' + (tmpCatImg ? '' : 'display:none') + '"><div style="flex:1"><input type="file" id="c_file" accept="image/*" class="inp" style="width:100%"><div style="display:flex;gap:.4rem;margin-top:.4rem"><input id="c_url" class="inp" placeholder="…or paste image URL" style="flex:1" value="' + esc(tmpCatImg) + '"><button class="btn btn-ghost btn-sm" id="c_rm">Remove</button></div><div id="c_stat" style="font-size:.72rem;color:var(--muted)"></div></div></div>'
      + '<label>Description</label><input id="c_desc" value="' + esc(c.desc || '') + '"><div style="display:flex;gap:.5rem;margin-top:1rem"><button class="btn btn-navy" id="csave">Save</button><button class="btn btn-ghost" id="ccancel">Cancel</button></div>';
    $('#ccancel').onclick = closeM;
    $('#c_rm').onclick = function () { tmpCatImg = ''; $('#c_prev').style.display = 'none'; $('#c_url').value = ''; };
    $('#c_url').oninput = function (e) { tmpCatImg = e.target.value.trim(); if (tmpCatImg) { $('#c_prev').src = tmpCatImg; $('#c_prev').style.display = 'block'; } else $('#c_prev').style.display = 'none'; };
    $('#c_file').onchange = function (e) {
      var f = (e.target.files || [])[0]; if (!f) return;
      var useBb = !!((DB.load().settings.imgbbKey || '').trim());
      $('#c_stat').textContent = useBb ? 'Uploading to imgbb…' : 'Compressing…';
      var job = useBb ? DB.uploadToImgbb(f) : DB.compressImage(f, 600, 0.82);
      job.then(function (u) { tmpCatImg = u; $('#c_prev').src = u; $('#c_prev').style.display = 'block'; $('#c_url').value = u; $('#c_stat').textContent = useBb ? 'Uploaded to imgbb ✓' : 'Compressed locally ✓ (add imgbb key for URL hosting)'; }).catch(function (err) { $('#c_stat').textContent = 'Upload failed: ' + (err && err.message || err); });
    };
    $('#csave').onclick = function () {
      var dd = DB.load(), nm = $('#c_name').value.trim(); if (!nm) { toast('Name required'); return; }
      if (id) { var o = dd.categories.find(function (x) { return x.id === id; }); o.name = nm; o.icon = $('#c_icon').value; o.image = tmpCatImg; o.desc = $('#c_desc').value; }
      else dd.categories.push({ id: DB.uid('c'), name: nm, icon: $('#c_icon').value || '📦', image: tmpCatImg, desc: $('#c_desc').value });
      DB.save(dd); closeM(); render(); toast('Category saved ✓');
    };
    $('#modal').classList.add('show'); $('#ovl').classList.add('show');
  }

  function vOrders(v) {
    var d = DB.load();
    v.innerHTML = '<div style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap"><h1 style="font-family:var(--font-h);margin-right:auto">Orders (' + d.orders.length + ')</h1><button class="btn btn-ghost btn-sm" id="oexp">Export CSV</button><button class="btn btn-ghost btn-sm" id="oclr">Clear all</button></div><p style="color:var(--muted);font-size:.78rem">Leads captured on this device/browser from store checkouts. For multi-device sync, export CSV regularly.</p><div style="margin-top:.6rem">' + ordersTbl(d.orders) + '</div>';
    bindOrders(v);
    $('#oexp').onclick = function () {
      var rows = [['id', 'date', 'customer', 'items', 'total', 'status', 'via']].concat(d.orders.map(function (o) { return [o.id, o.date, o.customer || '', o.items.map(function (i) { return i.name + ' x' + i.qty; }).join('; '), o.total, o.status, o.via]; }));
      var csv = rows.map(function (r) { return r.map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'orders.csv'; a.click();
    };
    $('#oclr').onclick = function () { if (!confirm('Delete all orders?')) return; var dd = DB.load(); dd.orders = []; DB.save(dd); render(); };
  }

  function vCoupons(v) {
    var d = DB.load();
    v.innerHTML = '<div style="display:flex;gap:.6rem;align-items:center"><h1 style="font-family:var(--font-h);margin-right:auto">Coupons</h1><button class="btn btn-navy btn-sm" id="cpadd">+ Add coupon</button></div><div style="overflow:auto;margin-top:.8rem"><table class="tbl"><tr><th>Code</th><th>Off %</th><th>Min order</th><th>Active</th><th></th></tr>'
      + d.coupons.map(function (c, i) { return '<tr><td><b>' + esc(c.code) + '</b></td><td>' + c.off + '%</td><td>' + DB.money(c.min || 0) + '</td><td>' + (c.active ? 'Yes' : 'No') + '</td><td><button class="btn btn-ghost btn-sm" data-t="' + i + '">Toggle</button> <button class="btn btn-ghost btn-sm" data-x="' + i + '">Delete</button></td></tr>'; }).join('') + '</table></div>';
    $('#cpadd').onclick = function () {
      var code = prompt('Coupon code (e.g. DIWALI15):'); if (!code) return;
      var off = +prompt('Discount %:', '10') || 10, min = +prompt('Min order ₹:', '0') || 0;
      var dd = DB.load(); dd.coupons.push({ code: code.trim().toUpperCase(), off: off, min: min, active: 1 }); DB.save(dd); render();
    };
    v.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { var dd = DB.load(); dd.coupons[+b.dataset.t].active = dd.coupons[+b.dataset.t].active ? 0 : 1; DB.save(dd); render(); }; });
    v.querySelectorAll('[data-x]').forEach(function (b) { b.onclick = function () { var dd = DB.load(); dd.coupons.splice(+b.dataset.x, 1); DB.save(dd); render(); }; });
  }

  function vSettings(v) {
    var d = DB.load(), s = d.settings;
    tmpBanners = (s.banners || []).slice();
    v.innerHTML = '<h1 style="font-family:var(--font-h)">Settings</h1><div class="form" style="background:#fff;border:1px solid var(--line);border-radius:16px;padding:1.2rem;max-width:640px">'
      + '<label>Homepage banners (slider — empty = no banner shown)</label><div class="pgrid" id="bgrid" style="grid-template-columns:1fr"></div><div style="display:flex;gap:.5rem;margin-top:.5rem;flex-wrap:wrap"><input type="file" id="b_file" accept="image/*" class="inp"><input id="b_url" class="inp" placeholder="…or paste banner URL" style="flex:1;min-width:180px"><button class="btn btn-ghost btn-sm" id="b_add">Add</button></div><div id="b_stat" style="font-size:.72rem;color:var(--muted)">Wide images work best (e.g. 1600×500). Click banner to set link.</div>'
      + '<label>Store name</label><input id="s_name" value="' + esc(s.storeName) + '"><label>Tagline</label><input id="s_tag" value="' + esc(s.tagline) + '">'
      + '<label>Store logo (shows in header instead of icon)</label><div style="display:flex;gap:.6rem;align-items:center"><img id="s_logoPrev" src="' + esc(s.logo || '') + '" style="width:56px;height:56px;border-radius:14px;object-fit:cover;border:1px solid var(--line2);' + (s.logo ? '' : 'display:none') + '"><div style="flex:1"><input type="file" id="s_logoFile" accept="image/*" class="inp" style="width:100%"><div style="display:flex;gap:.4rem;margin-top:.4rem"><input id="s_logo" class="inp" placeholder="…or paste logo image URL" style="flex:1" value="' + esc(s.logo || '') + '"><button class="btn btn-ghost btn-sm" id="s_logoRm" type="button">Remove</button></div><div id="s_logoStat" style="font-size:.72rem;color:var(--muted)"></div></div></div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem"><div><label>WhatsApp number (with country code)</label><input id="s_wa" value="' + esc(s.whatsapp) + '"></div><div><label>Currency symbol</label><input id="s_cur" value="' + esc(s.currency) + '"></div></div>'
      + '<label>UPI ID</label><input id="s_upi" value="' + esc(s.upi || '') + '"><label>PayPal link (optional)</label><input id="s_pp" value="' + esc(s.paypal || '') + '">'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem"><div><label>Free shipping above ₹</label><input id="s_fs" type="number" value="' + s.freeShipAbove + '"></div><div><label>Flat shipping ₹</label><input id="s_sh" type="number" value="' + s.flatShip + '"></div></div>'
      + '<label>Announcement bar</label><input id="s_ann" value="' + esc(s.announcement || '') + '"><label>Hero title</label><input id="s_ht" value="' + esc(s.heroTitle || '') + '"><label>Hero subtitle</label><textarea id="s_hs">' + esc(s.heroSub || '') + '</textarea>'
      + '<label>imgbb API key (for image URL uploads — get free at imgbb.com)</label><input id="s_img" placeholder="e.g. 3f8a9c…" value="' + esc(s.imgbbKey || '') + '"><div style="font-size:.72rem;color:var(--muted)">With key: category + product uploads go to imgbb (permanent URLs, no storage limit). Without key: compressed base64 in browser (~5MB limit).</div>'
      + '<label>Admin password</label><input id="s_adm" value="' + esc(s.adminPass || 'admin123') + '">'
      + '<label style="display:flex;gap:9px;align-items:flex-start;background:#faf9f2;border:1px solid var(--line2);border-radius:12px;padding:.7rem .8rem;margin-top:.8rem;cursor:pointer"><input type="checkbox" id="s_hide" ' + (s.hidePrice ? 'checked' : '') + ' style="width:18px;height:18px;margin-top:2px;accent-color:#0a1128"><span><b>Hide prices on store</b><br><small style="color:var(--muted)">Cards, quick-view, cart & checkout show “Price on request”. Customers enquire on WhatsApp. Admin still sees prices here.</small></span></label>'
      + '<div style="display:flex;gap:.5rem;margin-top:1rem"><button class="btn btn-navy" id="ssave">Save settings</button><button class="btn btn-ghost" id="stest">Test imgbb key</button></div><div id="stestR" style="font-size:.76rem;margin-top:.4rem"></div></div>';
    $('#stest').onclick = function () {
      var k = $('#s_img').value.trim(); if (!k) { $('#stestR').textContent = 'Enter key first.'; return; }
      $('#stestR').textContent = 'Testing…';
      fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: (function () { var f = new FormData(); f.append('key', k); f.append('image', 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='); return f; })() }).then(function (r) { return r.json(); }).then(function (j) { $('#stestR').textContent = (j && j.success) ? '✓ Key works — connected to imgbb.' : '✕ Key failed: ' + ((j && j.error && j.error.message) || 'invalid key'); }).catch(function (e) { $('#stestR').textContent = '✕ Test failed: ' + e.message; });
    };
    function drawBanners() {
      var g = $('#bgrid'); if (!g) return;
      g.innerHTML = tmpBanners.map(function (b, i) {
        return '<div style="display:flex;gap:.6rem;align-items:center;border:1px solid var(--line);border-radius:12px;padding:.5rem"><img src="' + b.img + '" style="width:120px;height:56px;object-fit:cover;border-radius:8px"><div style="flex:1"><input data-bl="' + i + '" class="inp" placeholder="Click link (optional, e.g. #shop)" value="' + esc(b.link || '') + '" style="width:100%"><small style="color:var(--muted)">Banner ' + (i + 1) + '</small></div><div style="display:flex;gap:3px"><button class="btn btn-ghost btn-sm" data-bm="' + i + '">‹</button><button class="btn btn-ghost btn-sm" data-bp="' + i + '">›</button><button class="btn btn-ghost btn-sm" data-bx="' + i + '">Delete</button></div></div>';
      }).join('') || '<small style="color:var(--muted)">No banners — slider hidden on store.</small>';
      g.querySelectorAll('[data-bl]').forEach(function (inp) { inp.oninput = function () { tmpBanners[+inp.dataset.bl].link = inp.value.trim(); }; });
      g.querySelectorAll('[data-bx]').forEach(function (b) { b.onclick = function () { tmpBanners.splice(+b.dataset.bx, 1); drawBanners(); }; });
      g.querySelectorAll('[data-bm]').forEach(function (b) { b.onclick = function () { var i = +b.dataset.bm; if (i <= 0) return; var s = tmpBanners.splice(i, 1)[0]; tmpBanners.splice(i - 1, 0, s); drawBanners(); }; });
      g.querySelectorAll('[data-bp]').forEach(function (b) { b.onclick = function () { var i = +b.dataset.bp; if (i >= tmpBanners.length - 1) return; var s = tmpBanners.splice(i, 1)[0]; tmpBanners.splice(i + 1, 0, s); drawBanners(); }; });
    }
    drawBanners();
    $('#b_add').onclick = function () { var u = $('#b_url').value.trim(); if (!u) { toast('Paste URL or choose file'); return; } tmpBanners.push({ img: u, link: '' }); $('#b_url').value = ''; drawBanners(); };
    $('#b_file').onchange = function (e) {
      var f = (e.target.files || [])[0]; if (!f) return;
      var useBb = !!($('#s_img').value.trim() || (DB.load().settings.imgbbKey || '').trim());
      $('#b_stat').textContent = useBb ? 'Uploading banner…' : 'Compressing banner…';
      var job = useBb ? DB.uploadToImgbb(f) : DB.compressImage(f, 1600, 0.82);
      job.then(function (u) { tmpBanners.push({ img: u, link: '' }); $('#b_stat').textContent = 'Banner added ✓ (save settings)'; drawBanners(); }).catch(function (err) { $('#b_stat').textContent = 'Upload failed: ' + (err && err.message || err); });
    };
    $('#s_logoRm').onclick = function () { $('#s_logo').value = ''; $('#s_logoPrev').style.display = 'none'; };
    $('#s_logo').oninput = function (e) { var u = e.target.value.trim(); if (u) { $('#s_logoPrev').src = u; $('#s_logoPrev').style.display = 'block'; } else $('#s_logoPrev').style.display = 'none'; };
    $('#s_logoFile').onchange = function (e) {
      var f = (e.target.files || [])[0]; if (!f) return;
      var useBb = !!($('#s_img').value.trim() || (DB.load().settings.imgbbKey || '').trim());
      $('#s_logoStat').textContent = useBb ? 'Uploading logo to imgbb…' : 'Compressing logo…';
      var job = useBb ? DB.uploadToImgbb(f) : DB.compressImage(f, 400, 0.85);
      job.then(function (u) { $('#s_logo').value = u; $('#s_logoPrev').src = u; $('#s_logoPrev').style.display = 'block'; $('#s_logoStat').textContent = useBb ? 'Logo uploaded ✓ (save settings)' : 'Logo ready ✓ (save settings)'; }).catch(function (err) { $('#s_logoStat').textContent = 'Upload failed: ' + (err && err.message || err); });
    };
    $('#ssave').onclick = function () {
      var dd = DB.load();
      dd.settings = { storeName: $('#s_name').value.trim() || 'Bharat Store', tagline: $('#s_tag').value, logo: $('#s_logo').value.trim(), banners: tmpBanners.filter(function (b) { return b && b.img; }), whatsapp: $('#s_wa').value.replace(/\D/g, ''), currency: $('#s_cur').value || '₹', upi: $('#s_upi').value, paypal: $('#s_pp').value, freeShipAbove: +$('#s_fs').value || 999, flatShip: +$('#s_sh').value || 0, announcement: $('#s_ann').value, heroTitle: $('#s_ht').value, heroSub: $('#s_hs').value, imgbbKey: $('#s_img').value.trim(), hidePrice: $('#s_hide').checked ? 1 : 0, adminPass: $('#s_adm').value || 'admin123' };
      DB.save(dd); $('#aname').textContent = dd.settings.storeName; toast('Settings saved ✓');
    };
  }

  function vData(v) {
    var raw = localStorage.getItem(DB.KEY) || '';
    var kb = Math.round((raw.length / 1024));
    v.innerHTML = '<h1 style="font-family:var(--font-h)">Backup & data</h1><div class="stat-grid"><div class="stat"><b>' + kb + ' KB</b><small>Storage used (~5MB limit)</small></div></div>'
      + '<div style="display:flex;gap:.5rem;flex-wrap:wrap"><button class="btn btn-navy btn-sm" id="dexp">Export JSON backup</button><button class="btn btn-ghost btn-sm" id="dimp">Import JSON</button><button class="btn btn-ghost btn-sm" id="dreset">Reset demo data</button><button class="btn btn-ghost btn-sm" id="dwip" style="border-color:#dc2626;color:#dc2626">Delete everything</button></div>'
      + '<input type="file" id="dfile" accept=".json" style="display:none"><p style="font-size:.78rem;color:var(--muted);margin-top:.8rem">GitHub/Vercel is static hosting — products save per-browser. Workflow: manage here → Export JSON → keep backup in repo. Customers always see your exported defaults on first visit.</p>';
    $('#dexp').onclick = function () { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([localStorage.getItem(DB.KEY)], { type: 'application/json' })); a.download = 'store-backup.json'; a.click(); };
    $('#dimp').onclick = function () { $('#dfile').click(); };
    $('#dfile').onchange = function (e) { var f = e.target.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { try { var d = JSON.parse(r.result); if (!d.products || !d.settings) throw 0; DB.save(d); toast('Imported ✓'); render(); } catch (err) { toast('Invalid backup file'); } }; r.readAsText(f); };
    $('#dreset').onclick = function () { if (!confirm('Reset to demo data?')) return; DB.save(DB.seed()); render(); toast('Demo data restored'); };
    $('#dwip').onclick = function () { if (!confirm('Delete ALL store data?')) return; localStorage.removeItem(DB.KEY); render(); };
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (authed()) boot();
    else { $('#login').onclick = login; $('#pass').addEventListener('keydown', function (e) { if (e.key === 'Enter') login(); }); }
  });
})();
