/* Bharat Technologies — Static Store DB (localStorage, no backend) */
(function (global) {
  var DB_KEY = 'bt_store_v1';

  function svgImg(bg1, bg2, emoji, label) {
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'>"
      + "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>"
      + "<stop offset='0' stop-color='" + bg1 + "'/><stop offset='1' stop-color='" + bg2 + "'/>"
      + "</linearGradient></defs><rect width='600' height='600' fill='url(#g)'/>"
      + "<text x='300' y='290' font-size='150' text-anchor='middle'>" + emoji + "</text>"
      + "<text x='300' y='420' font-size='34' font-family='Arial' font-weight='bold' fill='white' text-anchor='middle'>" + label + "</text></svg>";
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function seed() {
    return {
      settings: {
        storeName: 'Bharat Store',
        tagline: 'Digital + Physical • Trusted by 10,000+ developers',
        whatsapp: '919175016427',
        upi: 'bharat@upi',
        paypal: '',
        currency: '₹',
        freeShipAbove: 999,
        flatShip: 49,
        announcement: 'Festive Sale — Extra 10% off with code WELCOME10 • Free shipping above ₹999',
        heroTitle: 'Everything you need, delivered fast.',
        heroSub: 'Extensions, guides, gadgets & essentials — order in 1 tap on WhatsApp. No login needed.',
        adminPass: 'admin123',
        imgbbKey: '',
        gcsKey: '',
        gcsCx: '',
        hidePrice: 0,
        logo: '',
        banners: []
      },
      categories: [
        { id: 'c-ext', name: 'Extensions', icon: '🧩', image: '', desc: 'Digital downloads + WhatsApp delivery' },
        { id: 'c-guides', name: 'Guides & Ebooks', icon: '📘', image: '', desc: 'PDF guides on WhatsApp' },
        { id: 'c-gadgets', name: 'Gadgets', icon: '🎧', image: '', desc: 'Physical, shipped to you' },
        { id: 'c-home', name: 'Home Essentials', icon: '🏠', image: '', desc: 'Physical, shipped to you' }
      ],
      products: [
        { id: 'p-admob', name: 'AdMob Ads Pro Extension', cat: 'c-ext', type: 'digital', price: 1299, mrp: 1999, stock: 999, sku: 'DIG-ADMOB', rating: 4.9, sold: 1200, featured: 1, badge: 'BESTSELLER', desc: 'Banner, Interstitial, Rewarded, App Open, Native + AdManager with mediation adapters. Trial .aix included.', specs: ['SDK v25.4', '1.6 MB', 'MIT / Kodular / Niotron'], images: [svgImg('#0a1128', '#2563eb', '📢', 'AdMob Pro')], link: '' },
        { id: 'p-billing', name: 'Play Billing Extension v9.1', cat: 'c-ext', type: 'digital', price: 1299, mrp: 1799, stock: 999, sku: 'DIG-BILL', rating: 4.8, sold: 900, featured: 1, badge: 'NEW', desc: 'In-app products & subscriptions with Billing Library v9.1. Play compliant.', specs: ['Billing v9.1', 'Subscriptions', 'Play compliant'], images: [svgImg('#0b5e2f', '#10b981', '💳', 'Billing')], link: '' },
        { id: 'p-policy', name: 'Play Safety Guide Bundle (PDF)', cat: 'c-guides', type: 'digital', price: 499, mrp: 999, stock: 999, sku: 'DIG-GUIDE', rating: 4.9, sold: 2000, featured: 1, badge: '', desc: '6 field manuals: Ads policy, permissions, WebView, billing, checklist. PDF on WhatsApp.', specs: ['6 PDFs', 'Lifetime access', 'Free updates'], images: [svgImg('#7c3aed', '#ec4899', '📘', 'Guides')], link: '' },
        { id: 'p-buds', name: 'Wireless Earbuds Pro', cat: 'c-gadgets', type: 'physical', price: 1499, mrp: 2999, stock: 40, sku: 'PHY-BUDS', rating: 4.5, sold: 350, featured: 1, badge: 'SALE', desc: 'ENC calls, 45h case battery, low-latency game mode. COD available.', specs: ['Bluetooth 5.3', '45h battery', '1yr warranty'], images: [svgImg('#0a1128', '#c9a227', '🎧', 'Earbuds')], link: '' },
        { id: 'p-watch', name: 'Smart Watch Fit X', cat: 'c-gadgets', type: 'physical', price: 1999, mrp: 3999, stock: 25, sku: 'PHY-WATCH', rating: 4.4, sold: 210, featured: 0, badge: '', desc: '1.85" display, BT calling, SpO2 + heart tracking, 7-day battery.', specs: ['1.85 inch', 'BT calling', 'IP68'], images: [svgImg('#2563eb', '#7c3aed', '⌚', 'Watch X')], link: '' },
        { id: 'p-lamp', name: 'LED Desk Lamp', cat: 'c-home', type: 'physical', price: 799, mrp: 1299, stock: 60, sku: 'PHY-LAMP', rating: 4.3, sold: 180, featured: 0, badge: '', desc: 'Eye-care dimmable lamp with USB charging port.', specs: ['3 color modes', 'Stepless dimming', 'USB port'], images: [svgImg('#d97706', '#0b5e2f', '💡', 'Lamp')], link: '' },
        { id: 'p-bottle', name: 'Steel Bottle 1L', cat: 'c-home', type: 'physical', price: 499, mrp: 899, stock: 100, sku: 'PHY-BOT', rating: 4.6, sold: 500, featured: 0, badge: '', desc: 'Vacuum insulated, 24h hot/cold, leakproof.', specs: ['1 litre', '24h insulation', 'BPA free'], images: [svgImg('#0b5e2f', '#2563eb', '🍶', 'Bottle 1L')], link: '' },
        { id: 'p-lottie', name: 'Lottie Animation Pack', cat: 'c-ext', type: 'digital', price: 399, mrp: 799, stock: 999, sku: 'DIG-LOT', rating: 4.7, sold: 650, featured: 0, badge: '', desc: 'Advance Lottie extension + 50 premium animations.', specs: ['Offline + online', 'Custom colors', '50 files'], images: [svgImg('#7c3aed', '#0a1128', '✨', 'Lottie')], link: '' }
      ],
      coupons: [
        { code: 'WELCOME10', off: 10, min: 0, active: 1 },
        { code: 'SAVE20', off: 20, min: 1999, active: 1 }
      ],
      vendors: [],
      orders: []
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(DB_KEY);
      if (!raw) { var s = seed(); save(s); return s; }
      var d = JSON.parse(raw);
      if (!d.settings || !d.products || !d.categories) throw 0;
      if (typeof d.settings.imgbbKey === 'undefined') d.settings.imgbbKey = '';
      if (typeof d.settings.gcsKey === 'undefined') d.settings.gcsKey = '';
      if (typeof d.settings.gcsCx === 'undefined') d.settings.gcsCx = '';
      if (typeof d.settings.hidePrice === 'undefined') d.settings.hidePrice = 0;
      if (typeof d.settings.logo === 'undefined') d.settings.logo = '';
      if (!Array.isArray(d.settings.banners)) d.settings.banners = [];
      if (!Array.isArray(d.vendors)) d.vendors = [];
      if (!Array.isArray(d.coupons)) d.coupons = [];
      if (!Array.isArray(d.orders)) d.orders = [];
      d.categories.forEach(function (c) { if (typeof c.image === 'undefined') c.image = ''; if (typeof c.icon === 'undefined') c.icon = '📦'; });
      var vmap = {};
      d.vendors.forEach(function (v) { vmap[v.id] = v.name; });
      d.products.forEach(function (p) {
        if (typeof p.vendorId === 'undefined' || !p.vendorId) p.vendorId = 'admin';
        if (!p.vendorName) p.vendorName = vmap[p.vendorId] || (p.vendorId === 'admin' ? 'Store' : '');
      });
      return d;
    } catch (e) { var s2 = seed(); save(s2); return s2; }
  }
  function save(d) { try { localStorage.setItem(DB_KEY, JSON.stringify(d)); } catch (e) {} }
  function uid(p) { return (p || 'id') + '-' + Date.now().toString(36) + Math.floor(Math.random() * 999); }
  function money(n) {
    var d = load(); var c = (d.settings && d.settings.currency) || '₹';
    n = Number(n) || 0;
    try { return c + n.toLocaleString('en-IN'); } catch (e) { return c + n; }
  }
  function waLink(msg) {
    var d = load(); var ph = (d.settings.whatsapp || '').replace(/\D/g, '');
    return 'https://wa.me/' + ph + '?text=' + encodeURIComponent(msg);
  }
  function compressImage(file, maxDim, quality) {
    maxDim = maxDim || 900; quality = quality || 0.82;
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () {
        var img = new Image();
        img.onload = function () {
          var w = img.width, h = img.height, k = Math.min(1, maxDim / Math.max(w, h));
          var cw = Math.round(w * k), ch = Math.round(h * k);
          var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
          cv.getContext('2d').drawImage(img, 0, 0, cw, ch);
          res(cv.toDataURL('image/jpeg', quality));
        };
        img.onerror = rej; img.src = r.result;
      };
      r.onerror = rej; r.readAsDataURL(file);
    });
  }

  function uploadToImgbb(file) {
    var key = (load().settings.imgbbKey || '').trim();
    if (!key) return Promise.reject(new Error('no-key'));
    return compressImage(file, 1000, 0.85).then(function (dataUrl) {
      var b64 = String(dataUrl).split(',')[1] || '';
      var fd = new FormData(); fd.append('key', key); fd.append('image', b64);
      return fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: fd }).then(function (r) { return r.json(); }).then(function (j) {
        if (j && j.success && j.data && j.data.display_url) return j.data.display_url;
        throw new Error((j && j.error && j.error.message) || 'imgbb upload failed');
      });
    });
  }

  function catExists(name, exceptId) {
    var d = load(), n = String(name || '').trim().toLowerCase();
    return d.categories.some(function (c) { return String(c.name || '').trim().toLowerCase() === n && c.id !== exceptId; });
  }
  function vendorName(id) {
    if (!id || id === 'admin') return 'Store';
    var d = load(), v = d.vendors.filter(function (x) { return x.id === id; })[0];
    return v ? v.name : 'Vendor';
  }

  global.StoreDB = { KEY: DB_KEY, load: load, save: save, uid: uid, money: money, waLink: waLink, compressImage: compressImage, uploadToImgbb: uploadToImgbb, catExists: catExists, vendorName: vendorName, seed: seed };
})(window);
