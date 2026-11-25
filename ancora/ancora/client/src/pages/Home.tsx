import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Heart,
  Menu,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { formatKwanzas } from "../../../../src/utils/formatCurrency.js";

type Category = string;
type Product = {
  id: string | number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating?: number;
  reviews?: number;
  likes?: number;
  isFavorite?: boolean;
  seller?: string;
  badge?: string;
  image: string;
  tone: string;
  description: string;
  source?: Record<string, unknown>;
};

type CartLine = Product & { quantity: number };
type HomeProps = {
  products?: Product[];
  currency?: string;
  heroImage?: string;
  location?: string;
  onToggleFavorite?: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
  onCheckout?: (items: CartLine[]) => void;
};

const demoProducts: Product[] = [
  {
    id: 1,
    name: "Sérum Onda Calmante",
    category: "Bem-estar",
    price: 32,
    oldPrice: 38,
    rating: 4.9,
    reviews: 128,
    badge: "Mais vendido",
    image: "/assets/skincare.jpg",
    tone: "tone-sand",
    description: "Hidratação essencial com uma textura leve e confortável.",
  },
  {
    id: 2,
    name: "Fones Nórdicos H1",
    category: "Tecnologia",
    price: 89,
    rating: 4.8,
    reviews: 86,
    badge: "Escolha da casa",
    image: "/assets/headphones.jpg",
    tone: "tone-ink",
    description: "Som equilibrado, silêncio onde importa e design para durar.",
  },
  {
    id: 3,
    name: "Candeeiro Duna",
    category: "Casa",
    price: 74,
    rating: 4.7,
    reviews: 52,
    image: "/assets/home-decor.jpg",
    tone: "tone-teal",
    description: "Luz quente para criar uma divisão que sabe receber.",
  },
  {
    id: 4,
    name: "Óleo Facial Botânico",
    category: "Bem-estar",
    price: 24,
    rating: 4.6,
    reviews: 39,
    badge: "Novo",
    image: "/assets/serum.jpg",
    tone: "tone-rose",
    description: "Um ritual simples com ingredientes que fazem sentido.",
  },
  {
    id: 5,
    name: "Carteira Origami",
    category: "Estilo",
    price: 46,
    rating: 4.8,
    reviews: 31,
    image: "/assets/headphones.jpg",
    tone: "tone-stone",
    description: "Pequena por fora, pensada para acompanhar tudo.",
  },
  {
    id: 6,
    name: "Vaso Atlântico",
    category: "Casa",
    price: 58,
    rating: 4.9,
    reviews: 24,
    badge: "Edição limitada",
    image: "/assets/home-decor.jpg",
    tone: "tone-clay",
    description: "Uma peça escultural que dá presença ao essencial.",
  },
];

const formatPrice = (price: number, currency: string) => currency === "AOA"
  ? formatKwanzas(price)
  : `${price.toFixed(2).replace(".", ",")} €`;

const isCourse = (category: string) => {
  const normalized = category.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return normalized === "curso" || normalized === "cursos";
};

function Logo() {
  return (
    <a className="brand" href="#top" aria-label="Âncora Ecommerce — início">
      <span className="brand-mark" aria-hidden="true">
        <span />
      </span>
      <span className="brand-word">Âncora<span>.</span></span>
    </a>
  );
}

function Rating({ value, reviews }: { value: number; reviews: number }) {
  return (
    <span className="rating" aria-label={`${value} de 5 estrelas, ${reviews} avaliações`}>
      <Star size={13} fill="currentColor" strokeWidth={0} />
      {value.toFixed(1)} <small>({reviews})</small>
    </span>
  );
}

export default function Home({
  products = demoProducts,
  currency = "EUR",
  heroImage,
  location = "Portugal",
  onToggleFavorite,
  onSelectProduct,
  onCheckout,
}: HomeProps) {
  const [activeCategory, setActiveCategory] = useState<Category>("Todos");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Destaques");
  const [liked, setLiked] = useState<Array<string | number>>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [courseOnly, setCourseOnly] = useState(false);
  const maxAvailablePrice = Math.max(24, ...products.map((product) => product.price));
  const [priceMax, setPriceMax] = useState(maxAvailablePrice);
  const categories = useMemo(() => {
    const labels = [...new Set(products.map((product) => product.category.trim()).filter(Boolean))];
    return [
      { label: "Todos", count: `${products.length} produtos`, number: "01" },
      ...labels.map((label, index) => ({
        label,
        count: `${products.filter((product) => product.category === label).length} produtos`,
        number: String(index + 2).padStart(2, "0"),
      })),
    ];
  }, [products]);

  useEffect(() => {
    setPriceMax(maxAvailablePrice);
  }, [maxAvailablePrice]);

  const filteredProducts = useMemo(() => {
    const normalized = search.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const result = products.filter((product) => {
      const matchesCategory = courseOnly
        ? isCourse(product.category)
        : activeCategory === "Todos" || product.category === activeCategory;
      const searchableText = `${product.name} ${product.category} ${product.seller ?? ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const matchesSearch = !normalized || searchableText.includes(normalized);
      return matchesCategory && matchesSearch && product.price <= priceMax;
    });
    if (sort === "Preço mais baixo") return [...result].sort((a, b) => a.price - b.price);
    if (sort === "Preço mais alto") return [...result].sort((a, b) => b.price - a.price);
    if (sort === "Mais populares") return [...result].sort((a, b) => (b.likes ?? b.rating ?? 0) - (a.likes ?? a.rating ?? 0));
    return result;
  }, [activeCategory, courseOnly, priceMax, products, search, sort]);

  const isLiked = (product: Product) => onToggleFavorite
    ? Boolean(product.isFavorite)
    : liked.includes(product.id);
  const likedCount = onToggleFavorite
    ? products.filter(isLiked).length
    : liked.length;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const toggleLike = (product: Product) => {
    const wasLiked = isLiked(product);
    if (onToggleFavorite) {
      onToggleFavorite(product);
    } else {
      const id = product.id;
      setLiked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    }
    toast(wasLiked ? "Removido dos favoritos" : `${product.name} guardado nos favoritos`, { icon: wasLiked ? undefined : <Heart size={15} fill="currentColor" /> });
  };

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      return existing
        ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
    toast(`${product.name} adicionado ao carrinho`, { icon: <Check size={15} /> });
  };

  const changeQuantity = (id: string | number, delta: number) => {
    setCart((current) => current.flatMap((item) => {
      if (item.id !== id) return [item];
      const next = item.quantity + delta;
      return next > 0 ? [{ ...item, quantity: next }] : [];
    }));
  };

  const scrollToShop = () => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
  const startCheckout = () => {
    if (onCheckout) {
      onCheckout(cart);
      setCartOpen(false);
      return;
    }
    toast("Checkout preparado para a próxima fase", { icon: <Sparkles size={15} /> });
  };
  const mainImage = heroImage || products[0]?.image || demoProducts[0].image;

  return (
    <div className="site-shell" id="top">
      <Toaster position="top-center" />
      <div className="topline">
        <div className="container topline-inner">
          <span><Sparkles size={13} /> Curadoria nova todas as semanas</span>
          <span className="topline-right">{currency === "AOA" ? "Compra com vendedores da comunidade Âncora" : "Envio gratuito a partir de 50 €"} <ArrowRight size={13} /></span>
        </div>
      </div>

      <header className="site-header">
        <div className="container nav-wrap">
          <Logo />
          <nav className={`main-nav ${mobileOpen ? "is-open" : ""}`} aria-label="Navegação principal">
            <a href="#catalogo" onClick={() => { setCourseOnly(false); setActiveCategory("Todos"); setMobileOpen(false); }}>Comprar</a>
            <a href="#catalogo" onClick={(event) => { event.preventDefault(); setCourseOnly(true); setActiveCategory("Todos"); setSearch(""); setPriceMax(maxAvailablePrice); setSort("Destaques"); setMobileOpen(false); scrollToShop(); }}>Cursos</a>
            <a href="#categorias" onClick={() => { setCourseOnly(false); setActiveCategory("Todos"); setMobileOpen(false); }}>Categorias</a>
            <a href="#manifesto" onClick={() => setMobileOpen(false)}>Manifesto</a>
            <a href="#apoio" onClick={() => setMobileOpen(false)}>Apoio</a>
          </nav>
          <div className="nav-actions">
            <label className="nav-search">
              <Search size={17} />
              <input aria-label="Pesquisar produtos" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Procurar produto" />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-action mobile-search" aria-label="Pesquisar" onClick={() => document.querySelector<HTMLInputElement>(".nav-search input")?.focus()}><Search size={19} /></button>
            <button className="icon-action" aria-label="Ver favoritos" onClick={() => toast(`${likedCount} favorito${likedCount === 1 ? "" : "s"} guardado${likedCount === 1 ? "" : "s"}`)}><Heart size={19} /><span className="action-dot">{likedCount}</span></button>
            <button className="cart-action" aria-label={`Abrir carrinho com ${cartCount} itens`} onClick={() => setCartOpen(true)}><ShoppingBag size={18} /><span>Saco</span><b>{cartCount.toString().padStart(2, "0")}</b></button>
            <button className="menu-toggle" aria-label="Abrir menu" onClick={() => setMobileOpen((open) => !open)}>{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-line" /> Edição 04 · Inverno lento</div>
              <h1>Escolhas<br /><em>que ficam.</em></h1>
              <p className="hero-lead">Produtos com intenção, encontrados para acompanhar os dias bons — e tornar os outros um pouco melhores.</p>
              <div className="hero-actions"><button className="button button-dark" onClick={scrollToShop}>Explorar a edição <ArrowUpRight size={17} /></button><a className="text-link" href="#manifesto">Porque Âncora <ArrowRight size={15} /></a></div>
              <div className="hero-meta">{currency === "AOA" ? <span>{products.length} produtos disponíveis<br /><strong>na comunidade Âncora.</strong></span> : <><div className="avatar-stack"><span>AR</span><span>LM</span><span>+</span></div><span>Junta-te a 12.000<br /><strong>pessoas de bom gosto.</strong></span></>}</div>
            </div>
            <div className="hero-art">
              <div className="hero-image-wrap"><img src={mainImage} alt="Selecção de produtos do marketplace Âncora" /><span className="image-stamp">Escolha<br />Âncora<br /><i>{String(products.length).padStart(2, "0")} produtos</i></span></div>
              <div className="hero-caption"><span>01</span><span>Objectos que<br />fazem espaço</span><span className="caption-arrow">↗</span></div>
              <div className="hero-circle" aria-hidden="true">Âncora<br /><small>para viver</small></div>
            </div>
          </div>
        </section>

        <section className="ticker" aria-label="Benefícios Âncora"><div className="ticker-track"><span>DESCOBERTA SEM PRESSA</span><i>✳</i><span>ENVIO EM 24 / 48H</span><i>✳</i><span>ESCOLHAS COM INTENÇÃO</span><i>✳</i><span>DESCOBERTA SEM PRESSA</span><i>✳</i><span>ENVIO EM 24 / 48H</span><i>✳</i></div></section>

        <section className="category-section" id="categorias">
          <div className="container">
            <div className="section-heading"><div><span className="eyebrow">02 · Explora por intenção</span><h2>Encontra o teu<br /><em>próximo favorito.</em></h2></div><p>Uma selecção viva de coisas que tornam a casa mais tua, o corpo mais leve e os dias mais interessantes.</p></div>
            <div className="category-list">{categories.slice(1).map((category) => <button key={category.label} className={`category-row ${!courseOnly && activeCategory === category.label ? "active" : ""}`} onClick={() => { setCourseOnly(false); setActiveCategory(category.label); scrollToShop(); }}><span className="category-number">{category.number}</span><span className="category-name">{category.label}</span><span className="category-count">{category.count}</span><ArrowUpRight className="category-arrow" size={24} /></button>)}</div>
          </div>
        </section>

        <section className="catalog-section" id="catalogo">
          <div className="container">
            <div className="catalog-head"><div><span className="eyebrow">03 · A selecção</span><h2>O que nos está<br /><em>a inspirar agora.</em></h2></div><span className="catalog-note">{filteredProducts.length} de {products.length} produtos</span></div>
            <div className="catalog-toolbar">
              <div className="filter-tabs">{categories.map((category) => <button key={category.label} className={!courseOnly && activeCategory === category.label ? "active" : ""} onClick={() => { setCourseOnly(false); setActiveCategory(category.label); }}>{category.label}</button>)}</div>
              <div className="toolbar-controls">
                <label className="price-filter">Até {formatPrice(priceMax, currency)}<input aria-label="Preço máximo" type="range" min="0" max={maxAvailablePrice} step={Math.max(1, Math.ceil(maxAvailablePrice / 100))} value={Math.min(priceMax, maxAvailablePrice)} onChange={(event) => setPriceMax(Number(event.target.value))} /></label>
                <label className="sort-select"><span>Ordenar:</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Destaques</option><option>Mais populares</option><option>Preço mais baixo</option><option>Preço mais alto</option></select><ChevronDown size={15} /></label>
              </div>
            </div>
            {filteredProducts.length ? <div className="product-grid">{filteredProducts.map((product) => <article className="product-card" key={product.id}>
              <div className={`product-image ${product.tone}`}>
                <img src={product.image} alt={product.name} />
                {onSelectProduct && <button className="product-open" aria-label={`Ver detalhes de ${product.name}`} onClick={() => onSelectProduct(product)} />}
                <div className="product-image-overlay">
                  <span>{product.badge || product.category}</span>
                  <button aria-label={`${isLiked(product) ? "Remover" : "Guardar"} ${product.name} ${isLiked(product) ? "dos" : "nos"} favoritos`} className={`heart-button ${isLiked(product) ? "liked" : ""}`} onClick={() => toggleLike(product)}><Heart size={17} fill={isLiked(product) ? "currentColor" : "none"} /></button>
                </div>
                <button className="quick-add" onClick={() => addToCart(product)}>Adicionar <Plus size={15} /></button>
              </div>
              <div className="product-info"><div><span className="product-category">{product.category}</span><h3>{onSelectProduct ? <button className="product-title" onClick={() => onSelectProduct(product)}>{product.name}</button> : product.name}</h3></div><strong>{formatPrice(product.price, currency)}</strong></div>
              <div className="product-bottom">{product.likes !== undefined ? <span className="rating"><Heart size={13} fill="currentColor" /> {product.likes} favoritos</span> : <Rating value={product.rating ?? 0} reviews={product.reviews ?? 0} />}<span>{product.description}</span></div>
            </article>)}</div> : <div className="empty-state"><Search size={24} /><h3>{courseOnly ? "Ainda não há cursos publicados." : "Não encontrámos esse caminho."}</h3><p>{courseOnly ? "Volta mais tarde para descobrir os cursos da comunidade." : "Tenta outra palavra ou abre a selecção completa."}</p><button className="button button-dark" onClick={() => { setSearch(""); setPriceMax(maxAvailablePrice); setCourseOnly(false); setActiveCategory("Todos"); }}>Limpar filtros</button></div>}
            <div className="catalog-footer"><span>{courseOnly ? `${filteredProducts.length} cursos disponíveis` : `${products.length} produtos disponíveis`}</span><button className="text-link" onClick={() => { setCourseOnly(false); setActiveCategory("Todos"); setPriceMax(maxAvailablePrice); setSort("Destaques"); }}>Ver todos os produtos <ArrowRight size={15} /></button></div>
          </div>
        </section>

        <section className="manifesto-section" id="manifesto"><div className="container manifesto-grid"><div className="manifesto-statement"><span className="eyebrow eyebrow-light">04 · O nosso ponto de vista</span><h2>Comprar melhor<br />é viver <em>mais leve.</em></h2><span className="manifesto-number">04<span>/</span>24</span></div><div className="manifesto-copy"><p>Não acreditamos em encher por encher. A Âncora existe para aproximar-te de objectos úteis, bonitos e honestos — escolhidos por pessoas que reparam nos detalhes.</p><p>Uma loja online com menos ruído e mais critério. Para comprar uma vez, usar muito e guardar por perto.</p><a className="text-link light-link" href="#apoio">Conhece o nosso manifesto <ArrowUpRight size={15} /></a></div></div></section>

        <section className="trust-section" id="apoio"><div className="container"><div className="trust-intro"><span className="eyebrow">05 · Compra com confiança</span><h2>Estamos aqui<br /><em>para ficar.</em></h2></div><div className="trust-grid"><div className="trust-item"><span className="trust-icon"><Truck size={19} /></span><h3>Envio sem surpresas</h3><p>Combina a entrega diretamente com o vendedor.</p></div><div className="trust-item"><span className="trust-icon"><ShieldCheck size={19} /></span><h3>Pagamento na Âncora</h3><p>Finalize a compra através dos meios de pagamento disponíveis na plataforma.</p></div><div className="trust-item"><span className="trust-icon"><Clock3 size={19} /></span><h3>Fale com o vendedor</h3><p>Esclareça os detalhes do produto antes de concluir a encomenda.</p></div></div></div></section>

        <section className="newsletter-section"><div className="container newsletter-card"><div><span className="eyebrow eyebrow-light">A carta Âncora</span><h2>Coisas boas,<br /><em>sem spam.</em></h2></div><form onSubmit={(event) => { event.preventDefault(); toast("Estás na lista. Até já!", { icon: <Check size={15} /> }); }}><label htmlFor="newsletter-email">Recebe escolhas, histórias e novidades com espaço entre elas.</label><div className="newsletter-input"><input id="newsletter-email" type="email" required placeholder="o.teu@email.com" /><button type="submit" aria-label="Subscrever newsletter"><ArrowRight size={18} /></button></div><small>Ao subscrever, aceitas receber a carta Âncora. Podes sair quando quiseres.</small></form></div></section>
      </main>

      <footer className="site-footer"><div className="container footer-grid"><div><Logo /><p>Uma loja para escolhas<br />com intenção.</p></div><div className="footer-col"><span>Explorar</span><a href="#catalogo">Todos os produtos</a><a href="#categorias">Categorias</a><a href="#manifesto">Manifesto</a></div><div className="footer-col"><span>Ajuda</span><a href="#apoio">Envios & devoluções</a><a href="#apoio">Contactos</a><a href="#apoio">Perguntas frequentes</a></div><div className="footer-col"><span>Segue-nos</span><a href="#top">Instagram ↗</a><a href="#top">Pinterest ↗</a><a href="#top">TikTok ↗</a></div></div><div className="container footer-bottom"><span>© 2026 Âncora Ecommerce</span><span>Feito com tempo e intenção em {location}</span><span>Privacidade · Termos</span></div></footer>

      {cartOpen && <><button className="drawer-backdrop" aria-label="Fechar carrinho" onClick={() => setCartOpen(false)} /><aside className="cart-drawer" aria-label="Carrinho"><div className="drawer-head"><div><span className="eyebrow">O teu saco</span><h2>{cartCount} {cartCount === 1 ? "item" : "itens"}</h2></div><button className="close-button" onClick={() => setCartOpen(false)} aria-label="Fechar carrinho"><X size={20} /></button></div>{cart.length ? <><div className="cart-lines">{cart.map((item) => <div className="cart-line" key={item.id}><img src={item.image} alt="" /><div className="cart-line-copy"><span>{item.category}</span><h3>{item.name}</h3><strong>{formatPrice(item.price, currency)}</strong><div className="quantity-control"><button aria-label="Diminuir quantidade" onClick={() => changeQuantity(item.id, -1)}><Minus size={13} /></button><b>{item.quantity}</b><button aria-label="Aumentar quantidade" onClick={() => changeQuantity(item.id, 1)}><Plus size={13} /></button></div></div><button className="remove-line" aria-label={`Remover ${item.name}`} onClick={() => setCart((current) => current.filter((line) => line.id !== item.id))}><X size={15} /></button></div>)}</div><div className="drawer-footer"><div className="subtotal"><span>Subtotal</span><strong>{formatPrice(subtotal, currency)}</strong></div><p>{currency === "AOA" ? "A compra é finalizada pelo detalhe do produto e os pagamentos disponíveis na Âncora." : "Portes calculados no checkout. Envio gratuito acima de 50 €."}</p><button className="button button-dark checkout-button" onClick={startCheckout}>Continuar para checkout <ArrowRight size={17} /></button><button className="continue-button" onClick={() => setCartOpen(false)}>Continuar a explorar</button></div></> : <div className="cart-empty"><ShoppingBag size={30} /><h3>O saco está leve.</h3><p>Adiciona uma escolha e ela aparece aqui.</p><button className="button button-dark" onClick={() => { setCartOpen(false); scrollToShop(); }}>Explorar produtos</button></div>}</aside></>}
    </div>
  );
}
