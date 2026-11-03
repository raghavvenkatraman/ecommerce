import { useEffect, useMemo, useState } from 'react'
import './App.css'

const categories = ['All pieces', 'Living', 'Lighting', 'Objects', 'Textiles']
const freeShippingThreshold = 12750
const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function Icon({ name, size = 20 }) {
  const paths = {
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    heart: <path d="M20.8 8.7c0 4.2-8.8 10-8.8 10s-8.8-5.8-8.8-10a4.7 4.7 0 0 1 8.8-2.2 4.7 4.7 0 0 1 8.8 2.2Z" />,
    check: <path d="m5 12 4 4L19 6" />,
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function ProductCard({ product, onAdd, isFavorite, onFavorite }) {
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img className="product-image" src={product.imageUrl} alt={product.name} />
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button
          className={`favorite-button${isFavorite ? ' is-favorite' : ''}`}
          type="button"
          aria-label={`${isFavorite ? 'Remove' : 'Add'} ${product.name} ${isFavorite ? 'from' : 'to'} favorites`}
          onClick={() => onFavorite(product.id)}
        >
          <Icon name="heart" size={18} />
        </button>
        <button className="quick-add" type="button" disabled={product.stock < 1} onClick={() => onAdd(product)}>
          {product.stock < 1 ? 'Sold out' : <>Add to bag <Icon name="plus" size={16} /></>}
        </button>
      </div>
      <div className="product-details">
        <div>
          <p className="product-category">{product.category}</p>
          <h3>{product.name}</h3>
        </div>
        <p className="product-price">{currency.format(product.price)}</p>
      </div>
    </article>
  )
}

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeCategory, setActiveCategory] = useState('All pieces')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('featured')
  const [cart, setCart] = useState([])
  const [favorites, setFavorites] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkout, setCheckout] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [account, setAccount] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [checkoutAfterAuth, setCheckoutAfterAuth] = useState(false)

  async function getCsrfToken() {
    const response = await fetch('/api/auth/csrf')
    if (!response.ok) throw new Error('Could not start a secure session. Please try again.')
    return (await response.json()).token
  }

  async function postWithCsrf(url, body) {
    const token = await getCsrfToken()
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': token },
      body: JSON.stringify(body),
    })
  }

  function fetchProducts() {
    return fetch('/api/products').then((response) => {
      if (!response.ok) throw new Error('The shop is having trouble loading. Please try again.')
      return response.json()
    })
  }

  useEffect(() => {
    let active = true
    getCsrfToken()
      .then(() => fetch('/api/auth/me'))
      .then(async (response) => {
        if (response.ok && active) setAccount(await response.json())
      })
      .catch(() => {
        if (active) setAuthError('Could not check your sign-in status.')
      })
    fetchProducts()
      .then((data) => {
        if (active) setProducts(data)
      })
      .catch((error) => {
        if (active) setLoadError(error.message || 'Could not connect to the shop. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  function loadProducts() {
    fetchProducts()
      .then(setProducts)
      .catch((error) => setLoadError(error.message || 'Could not connect to the shop. Please try again.'))
      .finally(() => setLoading(false))
  }

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    const results = products.filter((product) => {
      const categoryMatches = activeCategory === 'All pieces' || product.category === activeCategory
      const searchMatches = !query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query)
      return categoryMatches && searchMatches
    })

    if (sort === 'price-low') results.sort((first, second) => first.price - second.price)
    if (sort === 'price-high') results.sort((first, second) => second.price - first.price)
    if (sort === 'name') results.sort((first, second) => first.name.localeCompare(second.name))
    return results
  }, [products, activeCategory, search, sort])

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  function addToCart(product) {
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id)
      if (existing) {
        return items.map((item) => item.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
          : item)
      }
      return [...items, { ...product, quantity: 1 }]
    })
  }

  function updateQuantity(productId, amount) {
    setCart((items) => items
      .map((item) => item.id === productId
        ? { ...item, quantity: Math.min(item.quantity + amount, item.stock) }
        : item)
      .filter((item) => item.quantity > 0))
  }

  function toggleFavorite(productId) {
    setFavorites((items) => items.includes(productId)
      ? items.filter((id) => id !== productId)
      : [...items, productId])
  }

  async function submitAuth(event) {
    event.preventDefault()
    setAuthSubmitting(true)
    setAuthError('')
    const formData = new FormData(event.currentTarget)
    const registering = authMode === 'register'
    const body = {
      email: formData.get('email'),
      password: formData.get('password'),
      ...(registering ? { name: formData.get('name') } : {}),
    }

    try {
      const response = await postWithCsrf(`/api/auth/${registering ? 'register' : 'login'}`, body)
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Could not sign in.')
      setAccount(result)
      setAuthOpen(false)
      await getCsrfToken()
      if (checkoutAfterAuth && cart.length > 0) {
        setCartOpen(true)
        setCheckout(true)
        setCheckoutAfterAuth(false)
      }
    } catch (error) {
      setAuthError(error.message || 'Could not connect to the shop. Please try again.')
    } finally {
      setAuthSubmitting(false)
    }
  }

  async function logout() {
    setAuthSubmitting(true)
    setAuthError('')
    try {
      const response = await postWithCsrf('/api/auth/logout', {})
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message || 'Could not sign out.')
      }
      setAccount(null)
      setAuthOpen(false)
      await getCsrfToken()
    } catch (error) {
      setAuthError(error.message || 'Could not connect to the shop. Please try again.')
    } finally {
      setAuthSubmitting(false)
    }
  }

  async function submitOrder(event) {
    event.preventDefault()
    if (!account) {
      setAuthOpen(true)
      setAuthMode('login')
      return
    }
    setSubmitting(true)
    setOrderError('')

    const formData = new FormData(event.currentTarget)
    const order = {
      address: formData.get('address'),
      items: cart.map(({ id, quantity }) => ({ productId: id, quantity })),
    }

    try {
      const response = await postWithCsrf('/api/orders', order)
      const result = await response.json()
      if (!response.ok) {
        if (response.status === 401) {
          setAccount(null)
          setCheckoutAfterAuth(true)
          setAuthMode('login')
          setAuthError('Your session expired. Sign in again to place your order.')
          setAuthOpen(true)
        }
        throw new Error(result.message || 'Your order could not be placed.')
      }
      setProducts((items) => items.map((product) => {
        const orderedItem = cart.find((item) => item.id === product.id)
        return orderedItem
          ? { ...product, stock: Math.max(0, product.stock - orderedItem.quantity) }
          : product
      }))
      setOrderComplete(true)
      setCart([])
    } catch (error) {
      setOrderError(error.message || 'Could not connect to the shop. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function closeCart() {
    setCartOpen(false)
    setCheckout(false)
    setOrderComplete(false)
    setOrderError('')
  }

  return (
    <div className="storefront">
      <div className="announcement">
        Thoughtful things for everyday living <span>—</span> complimentary shipping over ₹12,750
      </div>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Forma home">forma<span>.</span></a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#collection">Shop all</a>
          <a href="#collection" onClick={() => setActiveCategory('Living')}>Living</a>
          <a href="#collection" onClick={() => setActiveCategory('Lighting')}>Lighting</a>
          <a href="#story">Our story</a>
        </nav>
        <div className="header-actions">
          <label className="search-box">
            <Icon name="search" size={18} />
            <input
              aria-label="Search products"
              placeholder="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <button className="account-button" type="button" onClick={() => {
            setCheckoutAfterAuth(false)
            setAuthError('')
            setAuthOpen(true)
          }}>
            {account ? `Hi, ${account.name.split(' ')[0]}` : 'Sign in'}
          </button>
          <button className="bag-button" type="button" onClick={() => setCartOpen(true)} aria-label={`Shopping bag, ${cartCount} items`}>
            <Icon name="bag" size={20} />
            <span>Bag</span><span className="bag-count">{cartCount}</span>
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Objects for the considered home</p>
            <h1>Make room<br />for <em>good things.</em></h1>
            <p className="hero-description">A thoughtful collection of useful, beautiful things. Made to be lived with and loved for a long time.</p>
            <a className="button button-dark" href="#collection">Explore the collection <Icon name="arrow" size={16} /></a>
            <div className="hero-note"><span className="note-star">✳</span> Less, but better. Always.</div>
          </div>
          <div className="hero-visual">
            <img
              src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85"
              alt="Warm, sunlit living room with natural textures and considered furniture"
            />
            <div className="hero-image-label"><span>01 / 04</span><span>The Sunday Edit</span></div>
          </div>
          <div className="hero-side-label">DESIGNED FOR SLOWER DAYS</div>
        </section>

        <section className="promise-strip" aria-label="Our values">
          <span>Made with intention</span><i>✳</i>
          <span>Materials that matter</span><i>✳</i>
          <span>Good things, for longer</span><i>✳</i>
          <span>Made with intention</span>
        </section>

        <section className="collection section-shell" id="collection">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A few of our favorites</p>
              <h2>Considered <em>essentials.</em></h2>
            </div>
            <p className="section-aside">Everyday pieces, elevated.<br />Thoughtfully sourced, made to stay.</p>
          </div>
          <div className="collection-toolbar">
            <div className="category-tabs" aria-label="Filter by category">
              {categories.map((category) => (
                <button
                  className={activeCategory === category ? 'category-tab active' : 'category-tab'}
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <label className="sort-control">
              <span>Sort by</span>
              <select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>

          {loading && <div className="catalog-message">Gathering the good things...</div>}
          {!loading && loadError && (
            <div className="catalog-message error-message">
              <p>{loadError}</p><button className="text-button" type="button" onClick={() => {
                setLoading(true)
                setLoadError('')
                loadProducts()
              }}>Try again</button>
            </div>
          )}
          {!loading && !loadError && visibleProducts.length === 0 && (
            <div className="catalog-message">No pieces found. Try a different search.</div>
          )}
          {!loading && !loadError && visibleProducts.length > 0 && (
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                  isFavorite={favorites.includes(product.id)}
                  onFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </section>

        <section className="story-section" id="story">
          <div className="story-image">
            <img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85" alt="A calm, naturally styled home interior" />
          </div>
          <div className="story-copy">
            <p className="eyebrow">A little more meaning</p>
            <h2>Good design<br />feels like <em>coming home.</em></h2>
            <p>We believe the things we live with should earn their place. So we look for thoughtful design, honest materials, and makers who care about the details.</p>
            <a className="text-link" href="#collection">Get to know Forma <Icon name="arrow" size={16} /></a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="wordmark footer-wordmark" href="#top">forma<span>.</span></a>
        <p>Make yourself at home.</p>
        <span>© Forma Goods</span>
      </footer>

      {cartOpen && (
        <div className="drawer-backdrop" role="presentation" onClick={(event) => {
          if (event.target === event.currentTarget) closeCart()
        }}>
          <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <div className="drawer-heading">
              <div>
                <p className="eyebrow">{orderComplete ? 'All taken care of' : checkout ? 'Almost yours' : `${cartCount} ${cartCount === 1 ? 'good thing' : 'good things'}`}</p>
                <h2 id="cart-title">{orderComplete ? 'Thank you.' : checkout ? 'Your details.' : 'Your bag.'}</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Close bag" onClick={closeCart}><Icon name="close" /></button>
            </div>

            {orderComplete ? (
              <div className="order-success">
                <span className="success-icon"><Icon name="check" size={28} /></span>
                <h3>Your order is in good hands.</h3>
                <p>We’ll send a confirmation with all the details shortly.</p>
                <button className="button button-dark drawer-submit" type="button" onClick={closeCart}>Keep browsing</button>
              </div>
            ) : cart.length === 0 ? (
              <div className="empty-cart">
                <p>Your bag is taking a quiet moment.</p>
                <button className="button button-dark" type="button" onClick={closeCart}>Find something lovely</button>
              </div>
            ) : checkout ? (
              <form className="checkout-form" onSubmit={submitOrder}>
                <p className="checkout-intro">Signed in as {account?.email}. Add your shipping address and these good things will be on their way.</p>
                <label>Shipping address<textarea name="address" autoComplete="street-address" rows="3" required maxLength="500" /></label>
                {orderError && <p className="form-error" role="alert">{orderError}</p>}
                <div className="drawer-total"><span>Total</span><strong>{currency.format(subtotal)}</strong></div>
                <button className="button button-dark drawer-submit" type="submit" disabled={submitting}>
                  {submitting ? 'Placing your order...' : 'Place order'} <Icon name="arrow" size={16} />
                </button>
                <button className="back-to-bag" type="button" onClick={() => setCheckout(false)}>Back to your bag</button>
              </form>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <img src={item.imageUrl} alt="" />
                      <div className="cart-item-info">
                        <p className="product-category">{item.category}</p>
                        <h3>{item.name}</h3>
                        <strong>{currency.format(item.price)}</strong>
                        <div className="quantity-control">
                          <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => updateQuantity(item.id, -1)}><Icon name="minus" size={14} /></button>
                          <span>{item.quantity}</span>
                          <button type="button" aria-label={`Add one ${item.name}`} disabled={item.quantity >= item.stock} onClick={() => updateQuantity(item.id, 1)}><Icon name="plus" size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-bottom">
                  <p className="shipping-note">
                    {subtotal >= freeShippingThreshold
                      ? 'Complimentary shipping is on us.'
                      : `You’re ${currency.format(freeShippingThreshold - subtotal)} away from complimentary shipping.`}
                  </p>
                  <div className="drawer-total"><span>Subtotal</span><strong>{currency.format(subtotal)}</strong></div>
                  <p className="tax-note">Shipping and taxes calculated at checkout.</p>
                  <button className="button button-dark drawer-submit" type="button" onClick={() => {
                    if (account) {
                      setCheckout(true)
                    } else {
                      setCheckoutAfterAuth(true)
                      setAuthMode('login')
                      setAuthError('')
                      setAuthOpen(true)
                    }
                  }}>Continue to checkout <Icon name="arrow" size={16} /></button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {authOpen && (
        <div className="drawer-backdrop auth-backdrop" role="presentation" onClick={(event) => {
          if (event.target === event.currentTarget) {
            setAuthOpen(false)
            setCheckoutAfterAuth(false)
          }
        }}>
          <section className="auth-panel" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <div className="drawer-heading">
              <div>
                <p className="eyebrow">{account ? 'Welcome back' : authMode === 'register' ? 'A place of your own' : 'Good to see you'}</p>
                <h2 id="auth-title">{account ? 'Your account.' : authMode === 'register' ? 'Join Forma.' : 'Sign in.'}</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Close account" onClick={() => {
                setAuthOpen(false)
                setCheckoutAfterAuth(false)
              }}><Icon name="close" /></button>
            </div>

            {account ? (
              <div className="account-content">
                <p>You’re signed in as <strong>{account.name}</strong>.</p>
                <p className="account-email">{account.email}</p>
                {authError && <p className="form-error" role="alert">{authError}</p>}
                <button className="button button-dark drawer-submit" type="button" onClick={logout} disabled={authSubmitting}>
                  {authSubmitting ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            ) : (
              <form className="auth-form" onSubmit={submitAuth}>
                <p className="checkout-intro">
                  {authMode === 'register'
                    ? 'Create an account to keep your orders and checkout details together.'
                    : 'Sign in to continue to checkout and place your order.'}
                </p>
                {authMode === 'register' && (
                  <label>Your name<input name="name" autoComplete="name" required maxLength="120" /></label>
                )}
                <label>Email address<input name="email" type="email" autoComplete="email" required maxLength="254" /></label>
                <label>Password<input name="password" type="password" autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} required minLength={authMode === 'register' ? 10 : 1} maxLength="72" /></label>
                {authMode === 'register' && <p className="password-hint">Use at least 10 characters.</p>}
                {authError && <p className="form-error" role="alert">{authError}</p>}
                <button className="button button-dark drawer-submit" type="submit" disabled={authSubmitting}>
                  {authSubmitting ? 'One moment...' : authMode === 'register' ? 'Create account' : 'Sign in'}
                  {!authSubmitting && <Icon name="arrow" size={16} />}
                </button>
                <p className="auth-switch">
                  {authMode === 'register' ? 'Already have an account?' : 'New to Forma?'}
                  <button type="button" onClick={() => {
                    setAuthMode(authMode === 'register' ? 'login' : 'register')
                    setAuthError('')
                  }}>
                    {authMode === 'register' ? 'Sign in' : 'Create an account'}
                  </button>
                </p>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default App
