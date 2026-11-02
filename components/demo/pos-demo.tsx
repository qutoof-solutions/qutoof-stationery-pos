"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, Boxes, ChevronDown, CircleAlert, LayoutDashboard, Minus, PackagePlus, Plus, Printer, ReceiptText, Search, ShoppingCart, Trash2, X, Zap } from "lucide-react";

type View = "dashboard" | "pos" | "inventory" | "sales";
type Product = { id: string; barcode: string; name: string; price: number; stock: number };
type CartItem = Product & { quantity: number };
type Sale = { id: string; createdAt: string; items: CartItem[]; total: number };

const STORAGE = { products: "qutoof-demo-products", sales: "qutoof-demo-sales" } as const;
const MAX_PRODUCTS = 25;
const MAX_SALES = 20;
const LIMIT_MESSAGE = "عفواً، لقد استنفدت الحد الأقصى للنسخة التجريبية. يرجى التواصل مع QUTOOF لشراء النسخة الكاملة.";
const INITIAL_PRODUCTS: Product[] = [
  { id: "101", barcode: "101", name: "كشكول سلك 100 ورقة", price: 35, stock: 18 },
  { id: "102", barcode: "102", name: "قلم جاف أزرق بيك", price: 5, stock: 60 },
  { id: "103", barcode: "103", name: "رزمة ورق تصوير A4", price: 250, stock: 12 },
  { id: "104", barcode: "104", name: "طقم ألوان خشب فابر كاستل", price: 85, stock: 20 },
  { id: "105", barcode: "105", name: "آلة حاسبة كاسيو", price: 450, stock: 8 },
  { id: "106", barcode: "106", name: "صمغ يوهو صغير", price: 15, stock: 30 },
];

const money = (value: number) => new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(value);

export function DemoApp({ initialView }: { initialView: View }) {
  const [view, setView] = useState<View>(initialView);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const storedProducts = window.localStorage.getItem(STORAGE.products);
      const storedSales = window.localStorage.getItem(STORAGE.sales);
      if (storedProducts) setProducts(JSON.parse(storedProducts) as Product[]);
      if (storedSales) setSales(JSON.parse(storedSales) as Sale[]);
    } catch { setProducts(INITIAL_PRODUCTS); }
  }, []);
  useEffect(() => { window.localStorage.setItem(STORAGE.products, JSON.stringify(products)); }, [products]);
  useEffect(() => { window.localStorage.setItem(STORAGE.sales, JSON.stringify(sales)); }, [sales]);
  useEffect(() => { if (view === "pos") window.setTimeout(() => barcodeRef.current?.focus(), 50); }, [view, cart.length]);
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined); }, []);

  const go = (next: View) => { setView(next); if (next === "pos") window.setTimeout(() => barcodeRef.current?.focus(), 70); };
  const addToCart = useCallback((product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      const quantity = existing ? existing.quantity + 1 : 1;
      if (quantity > product.stock) { setNotice("الكمية المطلوبة أكبر من الرصيد المتاح لهذا الصنف."); return current; }
      return existing ? current.map((item) => item.id === product.id ? { ...item, quantity } : item) : [...current, { ...product, quantity }];
    });
  }, []);
  const scan = (event: React.FormEvent) => {
    event.preventDefault();
    const product = products.find((item) => item.barcode === barcode.trim());
    if (!product) { if (barcode.trim()) setNotice("لم يتم العثور على صنف بهذا الباركود."); setBarcode(""); return; }
    addToCart(product); setBarcode("");
  };
  const changeQty = (id: string, delta: number) => setCart((current) => current.flatMap((item) => {
    if (item.id !== id) return [item];
    const next = item.quantity + delta;
    return next <= 0 ? [] : next > item.stock ? [item] : [{ ...item, quantity: next }];
  }));
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const completeSale = () => {
    if (!cart.length) { setNotice("أضف صنفاً واحداً على الأقل قبل الدفع."); return; }
    if (sales.length >= MAX_SALES) { setNotice(LIMIT_MESSAGE); return; }
    const sale: Sale = { id: `INV-${String(sales.length + 1).padStart(3, "0")}`, createdAt: new Date().toISOString(), items: cart, total };
    setSales((current) => [sale, ...current]);
    setProducts((current) => current.map((product) => { const item = cart.find((entry) => entry.id === product.id); return item ? { ...product, stock: product.stock - item.quantity } : product; }));
    setCart([]); setNotice("تم حفظ الفاتورة بنجاح. ستفتح نافذة الطباعة الآن.");
    window.setTimeout(() => window.print(), 150);
  };
  const todaySales = sales.filter((sale) => new Date(sale.createdAt).toDateString() === new Date().toDateString());
  const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);

  return <div className="demo-app">
    <Sidebar view={view} onNavigate={go} />
    <main className="demo-main">
      <header className="demo-topbar"><div><p className="eyebrow">QUTOOF • DEMO MODE</p><h1>{view === "dashboard" ? "لوحة التحكم" : view === "pos" ? "الكاشير / نقطة البيع" : view === "inventory" ? "المخزن" : "المبيعات اليومية"}</h1></div><div className="topbar-status"><span className="status-dot" /> يعمل محلياً <span className="topbar-date">{new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date())}</span></div></header>
      {view === "dashboard" && <Dashboard products={products} sales={todaySales} todayTotal={todayTotal} onNavigate={go} />}
      {view === "pos" && <POS products={products} cart={cart} total={total} barcode={barcode} setBarcode={setBarcode} barcodeRef={barcodeRef} onScan={scan} onAddProduct={addToCart} onChangeQty={changeQty} onRemove={(id) => setCart((current) => current.filter((item) => item.id !== id))} onPay={completeSale} />}
      {view === "inventory" && <Inventory products={products} search={search} setSearch={setSearch} onAdd={(product) => { if (products.length >= MAX_PRODUCTS) setNotice(LIMIT_MESSAGE); else setProducts((current) => [...current, product]); }} />}
      {view === "sales" && <Sales sales={sales} />}
    </main>
    {notice && <div className="notice-backdrop" role="dialog" aria-modal="true"><div className="notice-card"><button className="icon-button notice-close" onClick={() => setNotice("")} aria-label="إغلاق"><X size={18} /></button><div className="notice-icon"><CircleAlert size={28} /></div><h2>{notice === LIMIT_MESSAGE ? "انتهت حدود النسخة التجريبية" : "تنبيه"}</h2><p>{notice}</p><button className="primary-button" onClick={() => setNotice("")}>حسناً</button></div></div>}
    <div className="receipt-print" aria-hidden="true"><h2>QUTOOF Stationery</h2><p>فاتورة بيع</p>{cart.map((item) => <p key={item.id}>{item.name} × {item.quantity} — {money(item.price * item.quantity)} ج.م</p>)}<strong>الإجمالي: {money(total)} ج.م</strong></div>
  </div>;
}

function Sidebar({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  const links: { id: View; label: string; icon: typeof LayoutDashboard }[] = [["dashboard", "لوحة التحكم", LayoutDashboard], ["pos", "الكاشير / نقطة البيع", ShoppingCart], ["inventory", "المخزن", Boxes], ["sales", "المبيعات اليومية", BarChart3]].map(([id, label, icon]) => ({ id: id as View, label: label as string, icon: icon as typeof LayoutDashboard }));
  return <aside className="sidebar"><div className="brand"><div className="brand-mark">Q</div><div><strong>QUTOOF</strong><span>STATIONERY POS</span></div></div><div className="demo-badge"><Zap size={14} /> نسخة ديمو محلية</div><nav>{links.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "nav-item active" : "nav-item"} onClick={() => onNavigate(id)}><Icon size={20} /><span>{label}</span>{id === "pos" && <kbd>F2</kbd>}</button>)}</nav><div className="sidebar-footer"><span className="status-dot" /> البيانات محفوظة على هذا الجهاز</div></aside>;
}

function Dashboard({ products, sales, todayTotal, onNavigate }: { products: Product[]; sales: Sale[]; todayTotal: number; onNavigate: (view: View) => void }) { return <section className="content"><div className="hero-card"><div><span className="hero-kicker">صباح الخير، الكاشير جاهز</span><h2>بيع أسرع. مخزون أوضح.</h2><p>امسح الباركود وخلّ النظام يتولى الباقي.</p><button className="primary-button" onClick={() => onNavigate("pos")}><ShoppingCart size={18} /> فتح نقطة البيع</button></div><div className="hero-orbit"><ReceiptText size={58} /></div></div><div className="stats-grid"><Stat label="مبيعات اليوم" value={`${money(todayTotal)} ج.م`} icon={BarChart3} tone="green" /><Stat label="فواتير اليوم" value={sales.length} icon={ReceiptText} tone="gold" /><Stat label="أصناف المخزن" value={`${products.length} / 25`} icon={Boxes} tone="blue" /></div><div className="section-heading"><div><span className="eyebrow">نظرة سريعة</span><h2>جاهز للعمل</h2></div><button className="text-button" onClick={() => onNavigate("inventory")}>إدارة المخزون <ChevronDown size={16} /></button></div><div className="quick-grid"><button onClick={() => onNavigate("pos")}><ShoppingCart /><strong>ابدأ فاتورة جديدة</strong><span>الباركود في انتظارك</span></button><button onClick={() => onNavigate("inventory")}><PackagePlus /><strong>راجع المخزن</strong><span>{products.filter((item) => item.stock < 10).length} أصناف منخفضة الرصيد</span></button><button onClick={() => onNavigate("sales")}><BarChart3 /><strong>تابع المبيعات</strong><span>عرض آخر الفواتير</span></button></div></section>; }
function Stat({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof BarChart3; tone: string }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={20} /></div><div><span>{label}</span><strong>{value}</strong></div></div>; }

function POS({ products, cart, total, barcode, setBarcode, barcodeRef, onScan, onAddProduct, onChangeQty, onRemove, onPay }: { products: Product[]; cart: CartItem[]; total: number; barcode: string; setBarcode: (value: string) => void; barcodeRef: React.RefObject<HTMLInputElement | null>; onScan: (event: React.FormEvent) => void; onAddProduct: (product: Product) => void; onChangeQty: (id: string, delta: number) => void; onRemove: (id: string) => void; onPay: () => void }) { return <section className="content pos-layout"><div className="pos-catalog"><div className="panel-heading"><div><span className="eyebrow">إدخال سريع</span><h2>الباركود</h2></div><span className="shortcut-hint">Enter للإضافة</span></div><form className="barcode-form" onSubmit={onScan}><Search size={22} /><input ref={barcodeRef} autoFocus value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="امسح أو اكتب كود الصنف..." aria-label="الباركود" /><kbd>ENTER</kbd></form><div className="catalog-header"><h3>الأصناف السريعة</h3><span>{products.length} صنف</span></div><div className="product-grid">{products.map((product) => <button className="product-tile" key={product.id} onClick={() => onAddProduct(product)}><span className="product-code">{product.barcode}</span><strong>{product.name}</strong><span>{money(product.price)} ج.م <small>• مخزون {product.stock}</small></span></button>)}</div></div><div className="cart-panel"><div className="panel-heading"><div><span className="eyebrow">الفاتورة الحالية</span><h2>سلة المشتريات</h2></div><span className="cart-count">{cart.reduce((sum, item) => sum + item.quantity, 0)} أصناف</span></div><div className="cart-list">{cart.length === 0 ? <div className="empty-state"><ShoppingCart size={38} /><strong>السلة فارغة</strong><span>امسح باركوداً لإضافة أول صنف</span></div> : cart.map((item) => <div className="cart-row" key={item.id}><div className="cart-item-info"><strong>{item.name}</strong><span>{money(item.price)} ج.م للوحدة</span></div><div className="quantity"><button onClick={() => onChangeQty(item.id, -1)} aria-label="تقليل الكمية"><Minus size={15} /></button><b>{item.quantity}</b><button onClick={() => onChangeQty(item.id, 1)} aria-label="زيادة الكمية"><Plus size={15} /></button></div><strong className="line-total">{money(item.price * item.quantity)}</strong><button className="remove-button" onClick={() => onRemove(item.id)} aria-label="حذف الصنف"><Trash2 size={16} /></button></div>)}</div><div className="cart-footer"><div className="total-line"><span>الإجمالي</span><strong>{money(total)} <small>ج.م</small></strong></div><button className="pay-button" onClick={onPay}><Printer size={20} /> دفع وطباعة <span>Ctrl + Enter</span></button></div></div></section>; }

function Inventory({ products, search, setSearch, onAdd }: { products: Product[]; search: string; setSearch: (value: string) => void; onAdd: (product: Product) => void }) { const [adding, setAdding] = useState(false); const [draft, setDraft] = useState({ name: "", barcode: "", price: "", stock: "" }); return <section className="content"><div className="section-heading inventory-heading"><div><span className="eyebrow">المخزون المحلي</span><h2>كل الأصناف</h2></div><button className="primary-button" onClick={() => setAdding((value) => !value)}><Plus size={18} /> إضافة صنف</button></div>{adding && <form className="add-form" onSubmit={(event) => { event.preventDefault(); onAdd({ id: draft.barcode, barcode: draft.barcode, name: draft.name, price: Number(draft.price), stock: Number(draft.stock) }); setAdding(false); setDraft({ name: "", barcode: "", price: "", stock: "" }); }}><input required placeholder="اسم الصنف" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /><input required placeholder="الباركود" value={draft.barcode} onChange={(e) => setDraft({ ...draft, barcode: e.target.value })} /><input required type="number" min="0" placeholder="السعر" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /><input required type="number" min="0" placeholder="الكمية" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} /><button className="primary-button" type="submit">حفظ الصنف</button></form>}<div className="table-tools"><div className="search-box"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الباركود..." /></div><span className="limit-label">{products.length} من {MAX_PRODUCTS} صنف</span></div><div className="data-table"><div className="table-row table-head"><span>الصنف</span><span>الباركود</span><span>السعر</span><span>المخزون</span></div>{products.filter((product) => `${product.name} ${product.barcode}`.includes(search.trim())).map((product) => <div className="table-row" key={product.id}><strong>{product.name}</strong><span className="muted-code">{product.barcode}</span><span>{money(product.price)} ج.م</span><span className={product.stock < 10 ? "stock-low" : "stock-ok"}>{product.stock} وحدة</span></div>)}</div></section>; }
function Sales({ sales }: { sales: Sale[] }) { return <section className="content"><div className="section-heading"><div><span className="eyebrow">سجل محلي</span><h2>المبيعات اليومية</h2></div><span className="limit-label">{sales.length} من {MAX_SALES} فاتورة</span></div><div className="sales-list">{sales.length === 0 ? <div className="empty-state sales-empty"><ReceiptText size={42} /><strong>لا توجد فواتير بعد</strong><span>ستظهر مبيعاتك هنا فور إتمام أول عملية دفع.</span></div> : sales.map((sale) => <div className="sale-card" key={sale.id}><div><strong>{sale.id}</strong><span>{new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(sale.createdAt))}</span></div><span>{sale.items.length} أصناف</span><strong className="sale-total">{money(sale.total)} ج.م</strong></div>)}</div></section>; }
