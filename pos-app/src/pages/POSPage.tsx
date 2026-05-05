import { useState, useEffect, useDeferredValue, useOptimistic, useTransition, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useCartStore } from "@/stores/cartStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useFavoritesStore } from "@/stores/favoritesStore";
import { useNotification } from "@/hooks/useNotification";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useMobileLayout } from "@/hooks/useMediaQuery";
import { usePermission } from "@/hooks/usePermission";
import { getServices } from "@/services";
import { formatCurrency } from "@/utils";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { CustomerSearch } from "@/components/pos/CustomerSearch";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { CameraScanModal } from "@/components/pos/CameraScanModal";
import { HeldCartsModal } from "@/components/pos/HeldCartsModal";
import { CouponInput } from "@/components/pos/CouponInput";
import { MobileCartSheet } from "@/components/pos/MobileCartSheet";
import { QuickNumpad } from "@/components/pos/QuickNumpad";
import { ProductForm } from "@/components/products/ProductForm";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ProductImage } from "@/components/products/ProductImage";
import {
  ShoppingCart, Search, Trash2, Plus, Minus,
  Barcode, CreditCard, Tag, StickyNote, PercentCircle,
  Camera, Pause, List, Star, Monitor
} from "lucide-react";
import type { Product, Category } from "@/types";

interface OptimisticCartItem {
  productId: string;
  name: string;
  price: number;
  adding?: boolean;
}
function ProductGrid({ sortedFiltered, isMobile, cart, optimisticItems, favorites, handleTapProduct }: { 
  sortedFiltered: Product[]; 
  isMobile: boolean; 
  cart: any; 
  optimisticItems: OptimisticCartItem[];
  favorites: any;
  handleTapProduct: (p: Product) => void;
}) {
  return (
    <div className={`grid gap-2 ${isMobile ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"}`}>
      {sortedFiltered.map((p) => {
        const inCart = cart.items.find((i: any) => i.product.id === p.id);
        const isAdding = optimisticItems.find(o => o.productId === p.id && o.adding);
        const isFav = favorites.isFavorite(p.id);
        
        return (
          <div key={p.id} className="relative">
            <button
              onClick={() => handleTapProduct(p)}
              disabled={p.stock === 0}
              className={`relative bg-white border-2 rounded-2xl p-3 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 w-full ${
                inCart || isAdding ? "border-blue-400 bg-blue-50 shadow-md" : "border-gray-100 hover:border-blue-300 hover:shadow-sm"
              } ${isAdding ? "scale-95" : ""}`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  favorites.toggleFavorite(p.id);
                }}
                className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10 ${
                  isFav ? "bg-amber-500 text-white shadow-md" : "bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-500"
                }`}
              >
                <Star className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
              </button>

              {(inCart || isAdding) && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow">
                  <span className="text-white text-xs font-bold">{inCart?.quantity ?? "…"}</span>
                </div>
              )}
              
              <ProductImage
                  product={p}
                  className={`mb-2 w-full border border-gray-100 bg-white ${isMobile ? "aspect-square" : "aspect-square"}`}
                  iconClassName="h-8 w-8"
                />
              <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{p.name}</p>
              <p className={`font-bold text-blue-600 mt-1 ${isMobile ? "text-base" : "text-sm"}`}>{formatCurrency(p.price)}</p>
              <p className={`text-xs mt-0.5 ${p.stock === 0 ? "text-red-500" : p.stock <= p.minStock ? "text-orange-500 font-medium" : "text-gray-400"}`}>
                {p.stock === 0 ? "Out of stock" : p.stock <= p.minStock ? `⚠ ${p.stock}` : `${p.stock}`}
              </p>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function POSPage() {
  const { t } = useTranslation();
  const [products, setProducts]         = useState<Product[]>([]);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [activeCat, setActiveCat]       = useState("favorites");
  const [search, setSearch]             = useState("");
  const [loading, setLoading]           = useState(true);
  const [paymentOpen, setPaymentOpen]   = useState(false);
  const [cameraOpen, setCameraOpen]     = useState(false);
  const [heldOpen, setHeldOpen]         = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [numpadProduct, setNumpadProduct] = useState<Product | null>(null);
  const [holdNamePrompt, setHoldNamePrompt] = useState(false);
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [missingBarcode, setMissingBarcode] = useState("");
  const [, startTransition]             = useTransition();
  const deferredSearch = useDeferredValue(search);

  const cart   = useCartStore();
  const { settings } = useSettingsStore();
  const favorites = useFavoritesStore();
  const notify = useNotification();
  const { isMobile } = useMobileLayout();
  const { can } = usePermission();

  useOfflineSync({ syncProducts: true, syncQueue: true });

  // Sync settings to cart
  useEffect(() => {
    cart.setTaxConfig(settings.taxEnabled, settings.taxRate);
  }, [settings.taxEnabled, settings.taxRate, cart.setTaxConfig]);

  const [optimisticItems, addOptimisticItem] = useOptimistic<OptimisticCartItem[], OptimisticCartItem>(
    cart.items.map(i => ({ productId: i.product.id, name: i.product.name, price: i.product.price })),
    (state, newItem) => {
      if (state.find(i => i.productId === newItem.productId)) return state;
      return [...state, { ...newItem, adding: true }];
    }
  );

  useEffect(() => {
    (async () => {
      const { productService } = await getServices();
      const [res, cats] = await Promise.all([
        productService.getProducts({ pageSize: 200 }),
        productService.getCategories(),
      ]);
      setProducts(res.data.filter((p: Product) => p.isActive));
      setCategories(cats);
      setLoading(false);
    })();
  }, []);

  const openMissingProductModal = useCallback((barcode: string) => {
    setCameraOpen(false);
    setMissingBarcode(barcode);
    setCreateProductOpen(true);
  }, []);

  const handleCreateProductSuccess = async (product: Product) => {
    setCreateProductOpen(false);
    setMissingBarcode("");
    setProducts((current) => {
      if (current.some((item) => item.id === product.id)) return current;
      return product.isActive ? [product, ...current] : current;
    });
    startTransition(() => {
      addOptimisticItem({ productId: product.id, name: product.name, price: product.price });
    });
    cart.addItem(product);
    notify.success(`Created and added: ${product.name}`);
  };

  const handleBarcode = useCallback(async (barcode: string) => {
    const { productService } = await getServices();
    const product = await productService.getProductByBarcode(barcode);
    if (product) {
      if (isMobile) {
        setCameraOpen(false);
        setNumpadProduct(product);
      } else {
        startTransition(() => {
          addOptimisticItem({ productId: product.id, name: product.name, price: product.price });
        });
        cart.addItem(product);
        notify.success(`Added: ${product.name}`);
      }
      return;
    }

    if (can("admin", "manager")) {
      notify.info(`Barcode not found. Opening product form: ${barcode}`);
      openMissingProductModal(barcode);
      return;
    }

    notify.warning(`Not found: ${barcode}`);
  }, [addOptimisticItem, can, cart, isMobile, notify, openMissingProductModal, setCameraOpen, setNumpadProduct, startTransition]);

  useBarcodeScanner(handleBarcode);

  const handleTapProduct = useCallback((product: Product) => {
    if (isMobile) {
      setNumpadProduct(product);
    } else {
      startTransition(() => {
        addOptimisticItem({ productId: product.id, name: product.name, price: product.price });
      });
      cart.addItem(product);
    }
  }, [addOptimisticItem, cart, isMobile]);

  const handleHoldCart = () => {
    if (cart.items.length === 0) {
      notify.warning(t("pos.emptyCart"));
      return;
    }
    setHoldNamePrompt(true);
  };

  const openCustomerDisplay = () => {
    window.open("/customer-display", "customer-display", "popup=yes,width=1440,height=900");
  };

  const confirmHoldCart = (name?: string) => {
    const id = cart.holdCart(name);
    if (id) {
      notify.success(t("pos.cartHeldSuccess"));
      setHoldNamePrompt(false);
    }
  };

  const filtered = products.filter(p => {
    const q = deferredSearch.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.barcode.includes(q);
    
    if (activeCat === "favorites") {
      return matchesSearch && favorites.isFavorite(p.id);
    }
    return matchesSearch && (activeCat === "all" || p.categoryId === activeCat);
  });

  const sortedFiltered = activeCat === "favorites"
    ? [...filtered].sort((a, b) => favorites.getFavoriteOrder(a.id) - favorites.getFavoriteOrder(b.id))
    : filtered;

  const createProductModal = (
    <Modal
      open={createProductOpen}
      onClose={() => { setCreateProductOpen(false); setMissingBarcode(""); }}
      title={`Add Product for ${missingBarcode || "Scanned Barcode"}`}
      size="lg"
    >
      <ProductForm
        categories={categories}
        initialValues={{ barcode: missingBarcode }}
        onSuccess={handleCreateProductSuccess}
        onCancel={() => { setCreateProductOpen(false); setMissingBarcode(""); }}
      />
    </Modal>
  );

  if (loading) return <PageLoader />;

  // ─── MOBILE LAYOUT ────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="flex flex-col h-[100dvh] bg-gray-50">
        {/* Mobile header */}
        <div className="bg-white border-b border-gray-200 px-3 pt-3 pb-0"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}>
          {/* Search + camera */}
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <Input placeholder="Search or scan..." prefix={<Search className="w-4 h-4" />}
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={openCustomerDisplay} title="Open Customer Screen" className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-cyan-600 hover:border-cyan-300 transition-colors">
              <Monitor className="w-5 h-5" />
            </button>
            <button onClick={() => setCameraOpen(true)}
              className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0 active:scale-95">
              <Camera className="w-5 h-5" />
            </button>
          </div>

          {/* Category tabs — horizontal scroll */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide">
            <button onClick={() => setActiveCat("favorites")}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                activeCat === "favorites" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600"
              }`}>
              <Star className="w-3 h-3" />
              {t("pos.favorites")} {favorites.favorites.length > 0 && `(${favorites.favorites.length})`}
            </button>
            {[{ id: "all", name: t("pos.allCategories") }, ...categories].map(c => (
              <button key={c.id} onClick={() => setActiveCat(c.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCat === c.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                }`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid — scrollable */}
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-300">
              <Search className="w-12 h-12 mb-2" />
              <p className="text-sm">No products found</p>
            </div>
          ) : <ProductGrid sortedFiltered={sortedFiltered} isMobile={isMobile} cart={cart} optimisticItems={optimisticItems} favorites={favorites} handleTapProduct={handleTapProduct} />}
          </div>
        {/* Mobile cart sheet (bottom drawer) */}
        <MobileCartSheet 
          onCheckout={() => setPaymentOpen(true)} 
          onHoldCart={handleHoldCart}
          onViewHeld={() => setHeldOpen(true)}
        />

        {/* Modals */}
        <QuickNumpad product={numpadProduct} onClose={() => setNumpadProduct(null)} />
        <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} />
        <CameraScanModal open={cameraOpen} onClose={() => setCameraOpen(false)} onScan={handleBarcode} />
        <HeldCartsModal open={heldOpen} onClose={() => setHeldOpen(false)} />
        {createProductModal}
      </div>
    );
  }

  // ─── DESKTOP LAYOUT ───────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-3.5rem)] gap-3 -m-4 p-3 bg-gray-100">
      {/* Left: Product browser */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3 border-b border-gray-100 flex gap-2 items-center">
          <div className="flex-1">
            <Input placeholder="Search products or scan barcode..."
              prefix={<Search className="w-4 h-4" />}
              suffix={<Barcode className="w-4 h-4" />}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={openCustomerDisplay} title="Open Customer Screen" className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-cyan-600 hover:border-cyan-300 transition-colors">
              <Monitor className="w-5 h-5" />
            </button>
            <button onClick={() => setCameraOpen(true)} title="Camera Scanner"
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-colors">
            <Camera className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-gray-50">
          <button onClick={() => setActiveCat("favorites")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
              activeCat === "favorites" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            <Star className="w-3 h-3" />
            {t("pos.favorites")} {favorites.favorites.length > 0 && `(${favorites.favorites.length})`}
          </button>
          {[{ id: "all", name: t("pos.allCategories") }, ...categories].map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCat === c.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>{c.name}</button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden relative">
          {["favorites", "all", ...categories.map(c => c.id)].map(catId => {
            const catProducts = catId === "favorites" 
              ? sortedFiltered 
              : catId === "all" 
                ? filtered 
                : filtered.filter(p => p.categoryId === catId);
            const isActive = activeCat === catId;
            return (
              <div key={catId}
                style={{ position:"absolute", inset:0, visibility: isActive ? "visible" : "hidden", pointerEvents: isActive ? "auto" : "none" }}
                className="overflow-y-auto p-3">
                {catProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-300">
                    <Search className="w-10 h-10 mb-2" />
                    <p className="text-sm">
                      {catId === "favorites" ? t("pos.noFavoritesYet") : t("products.searchByNameOrBarcode")}
                    </p>
                  </div>
                ) : <ProductGrid sortedFiltered={catProducts} isMobile={isMobile} cart={cart} optimisticItems={optimisticItems} favorites={favorites} handleTapProduct={handleTapProduct} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Desktop cart panel */}
      <div className="w-80 shrink-0 flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-gray-800">{t("pos.cart")}</h2>
          {cart.itemCount() > 0 && (
            <span className="ml-auto bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{cart.itemCount()}</span>
          )}
        </div>

        {/* Hold Bills and View Held Bills buttons */}
        <div className="px-3 py-2 border-b border-gray-50 flex gap-2">
          <button
            onClick={handleHoldCart}
            disabled={cart.items.length === 0}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title={t("pos.holdCart")}
          >
            <Pause className="w-4 h-4" />
            {t("pos.holdBills")}
          </button>
          <button
            onClick={() => setHeldOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 relative transition-colors"
            title={t("pos.viewHeldBills")}
          >
            <List className="w-4 h-4" />
            {cart.savedCarts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cart.savedCarts.length}</span>
            )}
          </button>
          {cart.items.length > 0 && (
            <button onClick={cart.clearCart} className="px-2 text-xs text-red-400 hover:text-red-600">{t("common.clear")}</button>
          )}
        </div>

        <div className="px-3 py-2 border-b border-gray-50">
          <CustomerSearch selected={cart.customer} onSelect={cart.setCustomer} />
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-300">
              <ShoppingCart className="w-10 h-10 mb-2" /><p className="text-sm">Scan or tap to add items</p>
            </div>
          ) : cart.items.map(item => (
            <div key={item.product.id} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-start justify-between gap-1">
                <p className="text-xs font-semibold text-gray-800 flex-1 leading-tight">{item.product.name}</p>
                <button onClick={() => cart.removeItem(item.product.id)} className="text-gray-300 hover:text-red-500 shrink-0 ml-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 gap-2">
                <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-0.5">
                  <button onClick={() => cart.updateQuantity(item.product.id, item.quantity - 1)} className="w-6 h-6 rounded text-gray-500 hover:bg-gray-100 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                  <span className="w-7 text-center text-sm font-bold text-gray-700">{item.quantity}</span>
                  <button onClick={() => cart.updateQuantity(item.product.id, item.quantity + 1)} className="w-6 h-6 rounded text-gray-500 hover:bg-gray-100 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                </div>
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-gray-400" />
                  <input type="number" min={0} max={100} value={item.discount}
                    onChange={e => cart.updateItemDiscount(item.product.id, Number(e.target.value))}
                    className="w-12 text-xs text-center border border-gray-200 rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  <span className="text-xs text-gray-400">%</span>
                </div>
                <span className="text-sm font-bold text-blue-600 shrink-0">{formatCurrency(item.total)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="px-3 py-2 border-t border-gray-50 space-y-2">
          <button onClick={() => setShowDiscount(v => !v)} className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 transition-colors">
            <PercentCircle className="w-3.5 h-3.5" />
            Order discount {cart.orderDiscount > 0 && <span className="text-blue-600 font-medium">({cart.orderDiscount}%)</span>}
          </button>
          {showDiscount && (
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={50} step={5} value={cart.orderDiscount}
                onChange={e => cart.setOrderDiscount(Number(e.target.value))} className="flex-1 accent-blue-600" />
              <span className="text-sm font-bold text-blue-600 w-10 text-right">{cart.orderDiscount}%</span>
            </div>
          )}
          <CouponInput />
          <div className="flex items-start gap-2">
            <StickyNote className="w-3.5 h-3.5 text-gray-400 mt-1.5" />
            <input type="text" placeholder="Add note..." value={cart.note}
              onChange={e => cart.setNote(e.target.value)}
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400" />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-1">
          <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>{formatCurrency(cart.subtotal())}</span></div>
          {cart.orderDiscount > 0 && <div className="flex justify-between text-xs text-green-600"><span>Order Discount ({cart.orderDiscount}%)</span><span>-{formatCurrency(cart.subtotal() * cart.orderDiscount / 100)}</span></div>}
          {cart.couponDiscount > 0 && <div className="flex justify-between text-xs text-green-600"><span>Coupon ({cart.couponCode})</span><span>-{formatCurrency(cart.couponDiscount)}</span></div>}
          {cart.taxEnabled && <div className="flex justify-between text-xs text-gray-500"><span>Tax ({cart.taxRate * 100}%)</span><span>{formatCurrency(cart.taxAmount())}</span></div>}
          <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t border-gray-200">
            <span>Total</span><span className="text-blue-600">{formatCurrency(cart.total())}</span>
          </div>
        </div>

        <div className="p-3">
          <button onClick={() => setPaymentOpen(true)} disabled={cart.items.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm">
            <CreditCard className="w-5 h-5" />
            Checkout · {formatCurrency(cart.total())}
          </button>
        </div>
      </div>

      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} />
      <CameraScanModal open={cameraOpen} onClose={() => setCameraOpen(false)} onScan={handleBarcode} />
      <HeldCartsModal open={heldOpen} onClose={() => setHeldOpen(false)} />
      <HoldNamePrompt open={holdNamePrompt} onClose={() => setHoldNamePrompt(false)} onConfirm={confirmHoldCart} />
    </div>
  );
}

// Hold name prompt component
function HoldNamePrompt({ open, onClose, onConfirm }: { 
  open: boolean; 
  onClose: () => void; 
  onConfirm: (name?: string) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const { savedCarts } = useCartStore();
  
  const handleSubmit = () => {
    onConfirm(name.trim() || undefined);
    setName("");
  };

  return (
    <Modal open={open} onClose={onClose} title={t("pos.holdCurrentCart")} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t("pos.giveCartName")}
        </p>
        <Input
          placeholder={t("pos.cartNamePlaceholder", { number: savedCarts.length + 1 })}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"
          >
            {t("pos.holdCart")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
