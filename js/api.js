/* Task 05: REST API client, dynamic DOM filtering, sorting and local state. */
(() => {
  'use strict';

  const API_URL = 'https://fakestoreapi.com/products';
  const CACHE_KEY = 'eadProductsCache';
  const CART_KEY = 'eadProductCart';
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  const state = { products: [], category: 'all', query: '', sort: 'default' };

  const el = {
    search: document.getElementById('product-search'),
    sort: document.getElementById('product-sort'),
    tabs: document.getElementById('category-tabs'),
    grid: document.getElementById('product-grid'),
    loading: document.getElementById('product-loading'),
    status: document.getElementById('api-status'),
    error: document.getElementById('api-error'),
    empty: document.getElementById('empty-state'),
    count: document.getElementById('product-count'),
    cartCount: document.getElementById('cart-count'),
    refresh: document.getElementById('refresh-products')
  };

  function readStorage(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value === null ? fallback : value;
    } catch (error) {
      console.warn(`Could not read ${key} from localStorage.`, error);
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (error) { console.warn(`Could not save ${key} to localStorage.`, error); }
  }

  function getCart() {
    const cart = readStorage(CART_KEY, []);
    return Array.isArray(cart) ? cart : [];
  }

  function updateCartCount() {
    el.cartCount.textContent = getCart().reduce((sum, item) => sum + item.quantity, 0);
  }

  function setLoading(isLoading) {
    el.loading.hidden = !isLoading;
    el.refresh.disabled = isLoading;
    if (isLoading) el.status.textContent = 'Loading products from the REST API…';
  }

  function showError(message) {
    el.error.textContent = message;
    el.error.hidden = false;
  }

  function hideError() {
    el.error.hidden = true;
    el.error.textContent = '';
  }

  async function fetchProducts(forceRefresh = false) {
    hideError();
    if (!forceRefresh) {
      const cached = readStorage(CACHE_KEY, null);
      if (cached && Array.isArray(cached.products) && Date.now() - cached.savedAt < CACHE_TTL) {
        state.products = cached.products;
        el.status.textContent = 'Showing recently cached API data.';
        renderCategories();
        renderProducts();
        return;
      }
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Server responded with ${response.status} ${response.statusText}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('The API returned an unexpected data format.');
      state.products = data;
      writeStorage(CACHE_KEY, { products: data, savedAt: Date.now() });
      el.status.textContent = `Successfully loaded ${data.length} products from the live API.`;
      renderCategories();
      renderProducts();
    } catch (error) {
      console.error('Product API request failed:', error);
      const cached = readStorage(CACHE_KEY, null);
      if (cached && Array.isArray(cached.products)) {
        state.products = cached.products;
        el.status.textContent = 'The API is unavailable. Showing previously cached data.';
        showError('Could not refresh live data. Your saved catalogue is displayed instead. Check your internet connection and try again.');
        renderCategories();
        renderProducts();
      } else {
        state.products = [];
        el.status.textContent = 'Products could not be loaded.';
        showError('Unable to connect to the product API. Check your internet connection, then select “Refresh data” to try again.');
        renderProducts();
      }
    } finally {
      setLoading(false);
    }
  }

  function renderCategories() {
    const categories = [...new Set(state.products.map(product => product.category).filter(Boolean))].sort();
    el.tabs.replaceChildren();
    const all = [['all', 'All products'], ...categories.map(category => [category, category])];
    all.forEach(([value, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `category-tab${state.category === value ? ' active' : ''}`;
      button.dataset.category = value;
      button.setAttribute('aria-pressed', String(state.category === value));
      button.textContent = label;
      el.tabs.append(button);
    });
  }

  function getVisibleProducts() {
    let products = state.products.filter(product => {
      const matchesCategory = state.category === 'all' || product.category === state.category;
      const text = `${product.title} ${product.description} ${product.category}`.toLowerCase();
      return matchesCategory && text.includes(state.query.toLowerCase());
    });

    products = [...products];
    switch (state.sort) {
      case 'name-asc': products.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'price-asc': products.sort((a, b) => a.price - b.price); break;
      case 'price-desc': products.sort((a, b) => b.price - a.price); break;
      case 'rating-desc': products.sort((a, b) => (b.rating?.rate || 0) - (a.rating?.rate || 0)); break;
    }
    return products;
  }

  function createProductCard(product) {
    const article = document.createElement('article');
    article.className = 'product-card';

    const image = document.createElement('img');
    image.src = product.image;
    image.alt = product.title;
    image.loading = 'lazy';
    image.addEventListener('error', () => { image.hidden = true; });

    const category = document.createElement('p');
    category.className = 'product-category';
    category.textContent = product.category;

    const title = document.createElement('h3');
    title.textContent = product.title;

    const description = document.createElement('p');
    description.className = 'product-description';
    description.textContent = product.description;

    const meta = document.createElement('div');
    meta.className = 'product-meta';
    const price = document.createElement('strong');
    price.textContent = `$${Number(product.price).toFixed(2)}`;
    const rating = document.createElement('span');
    rating.textContent = `★ ${product.rating?.rate ?? 'N/A'} (${product.rating?.count ?? 0})`;
    meta.append(price, rating);

    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'btn primary add-to-cart';
    add.textContent = 'Add to cart';
    add.setAttribute('aria-label', `Add ${product.title} to cart`);
    add.addEventListener('click', () => addToCart(product));

    article.append(image, category, title, description, meta, add);
    return article;
  }

  function renderProducts() {
    const products = getVisibleProducts();
    el.grid.replaceChildren(...products.map(createProductCard));
    el.count.textContent = products.length;
    el.empty.hidden = products.length !== 0;
    if (state.products.length && products.length === 0) el.status.textContent = 'No matching products found.';
    updateCartCount();
  }

  function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ id: product.id, title: product.title, price: product.price, quantity: 1 });
    writeStorage(CART_KEY, cart);
    updateCartCount();
    if (window.EAD?.notify) window.EAD.notify(`${product.title} added to your cart.`);
    else el.status.textContent = `${product.title} added to your cart.`;
  }

  el.search.addEventListener('input', event => {
    state.query = event.target.value.trim();
    renderProducts();
  });
  el.sort.addEventListener('change', event => {
    state.sort = event.target.value;
    renderProducts();
  });
  el.tabs.addEventListener('click', event => {
    const button = event.target.closest('button[data-category]');
    if (!button) return;
    state.category = button.dataset.category;
    renderCategories();
    renderProducts();
  });
  el.refresh.addEventListener('click', () => fetchProducts(true));

  updateCartCount();
  fetchProducts();
})();
