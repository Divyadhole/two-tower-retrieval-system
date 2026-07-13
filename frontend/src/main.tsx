import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Boxes, BrainCircuit, Gauge, Search, SlidersHorizontal, Star } from "lucide-react";
import "./styles.css";

type Product = {
  product_id: string;
  title: string;
  category: string;
  price: number;
  rating: number;
  review_count: number;
  popularity: number;
};

type Result = {
  product: Product;
  score: number;
  signals: {
    semantic: number;
    metadata: number;
    category: string;
    rating: number;
    popularity: number;
  };
};

const sampleQueries = ["wireless headphones", "desk lamp usb", "comfortable chair for desk", "mechanical keyboard"];
const catalog: Product[] = [
  {
    product_id: "B001",
    title: "Wireless Noise Cancelling Headphones",
    category: "Electronics",
    price: 129.99,
    rating: 4.6,
    review_count: 18420,
    popularity: 0.92
  },
  {
    product_id: "B002",
    title: "Bluetooth Earbuds with Charging Case",
    category: "Electronics",
    price: 39.99,
    rating: 4.4,
    review_count: 9320,
    popularity: 0.83
  },
  { product_id: "B003", title: "Stainless Steel Water Bottle 32 oz", category: "Home", price: 21.99, rating: 4.8, review_count: 22310, popularity: 0.89 },
  { product_id: "B004", title: "Organic Cotton Yoga Pants", category: "Fashion", price: 48, rating: 4.5, review_count: 7100, popularity: 0.74 },
  { product_id: "B005", title: "Ergonomic Office Chair with Lumbar Support", category: "Furniture", price: 219, rating: 4.3, review_count: 5120, popularity: 0.77 },
  { product_id: "B006", title: "Running Shoes for Road Training", category: "Sports", price: 86.5, rating: 4.5, review_count: 12100, popularity: 0.81 },
  { product_id: "B007", title: "Smart LED Desk Lamp with USB Port", category: "Home", price: 34.99, rating: 4.2, review_count: 3820, popularity: 0.64 },
  {
    product_id: "B008",
    title: "Mechanical Keyboard RGB Blue Switches",
    category: "Electronics",
    price: 74.5,
    rating: 4.7,
    review_count: 15800,
    popularity: 0.88
  }
];

function tokenize(text: string) {
  return text.toLowerCase().match(/[a-z0-9]+/g)?.filter((token) => token.length > 1) ?? [];
}

function priceBucket(price: number) {
  if (price < 25) return "budget";
  if (price < 100) return "mid";
  return "premium";
}

function featureVector(features: string[], dimensions = 96) {
  const vector = Array.from({ length: dimensions }, () => 0);
  for (const feature of features) {
    let hash = 2166136261;
    for (let index = 0; index < feature.length; index += 1) {
      hash ^= feature.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    const slot = Math.abs(hash) % dimensions;
    const sign = (hash >>> 8) % 2 === 0 ? 1 : -1;
    vector[slot] += sign;
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return norm === 0 ? vector : vector.map((value) => value / norm);
}

function encodeQuery(searchQuery: string, segment: string, preferredCategory: string, priceSensitivity: number) {
  const tokens = tokenize(searchQuery);
  const features = tokens.map((token) => `term:${token}`);
  features.push(...tokens.map((token) => `q:${token}`));
  features.push(...tokens.map((token) => `seg:${segment}:${token}`));
  if (preferredCategory) features.push(`pref:${preferredCategory.toLowerCase()}`);
  features.push(`price_sensitivity:${priceSensitivity.toFixed(1)}`);
  return featureVector(features);
}

function encodeProduct(product: Product) {
  const tokens = tokenize(product.title);
  const features = tokens.map((token) => `term:${token}`);
  features.push(...tokens.map((token) => `title:${token}`));
  features.push(`category:${product.category.toLowerCase()}`);
  features.push(`price_bucket:${priceBucket(product.price)}`);
  features.push(`rating_bucket:${Math.floor(product.rating)}`);
  features.push(`reviews_bucket:${Math.min(Math.floor(product.review_count / 500), 10)}`);
  features.push(`popularity:${product.popularity.toFixed(1)}`);
  return featureVector(features);
}

function dot(left: number[], right: number[]) {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

function metadataBoost(product: Product, preferredCategory: string, priceSensitivity: number) {
  const quality = (product.rating - 4) * 0.05 + product.popularity * 0.08;
  const categoryMatch = product.category === preferredCategory ? 0.12 : 0;
  const priceAlignment = (1 - Math.min(product.price / 250, 1)) * priceSensitivity * 0.08;
  return quality + categoryMatch + priceAlignment;
}

function retrieveProducts(searchQuery: string, segment: string, preferredCategory: string, priceSensitivity: number) {
  const queryEmbedding = encodeQuery(searchQuery, segment, preferredCategory, priceSensitivity);
  return catalog
    .map((product) => {
      const semantic = dot(queryEmbedding, encodeProduct(product));
      const metadata = metadataBoost(product, preferredCategory, priceSensitivity);
      return {
        product,
        score: Number((semantic + metadata).toFixed(4)),
        signals: {
          semantic: Number(semantic.toFixed(4)),
          metadata: Number(metadata.toFixed(4)),
          category: product.category,
          rating: product.rating,
          popularity: product.popularity
        }
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
}

function App() {
  const [query, setQuery] = useState(sampleQueries[0]);
  const [segment, setSegment] = useState("electronics_enthusiast");
  const [category, setCategory] = useState("Electronics");
  const [priceSensitivity, setPriceSensitivity] = useState(0.4);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  const topResult = useMemo(() => results[0], [results]);

  function runSearch(nextQuery = query) {
    setQuery(nextQuery);
    setLoading(true);
    window.setTimeout(() => {
      setResults(retrieveProducts(nextQuery, segment, category, priceSensitivity));
      setLoading(false);
    }, 120);
  }

  useEffect(() => {
    runSearch(sampleQueries[0]);
  }, []);

  useEffect(() => {
    setResults(retrieveProducts(query, segment, category, priceSensitivity));
  }, [segment, category, priceSensitivity]);

  return (
    <main className="app-shell">
      <aside className="rail">
        <div className="brand-mark"><BrainCircuit size={28} /></div>
        <button title="Search"><Search size={22} /></button>
        <button title="Ranking"><Gauge size={22} /></button>
        <button title="Catalog"><Boxes size={22} /></button>
        <button title="Controls"><SlidersHorizontal size={22} /></button>
      </aside>

      <section className="workbench">
        <header className="header">
          <div>
            <p className="eyebrow">Scalable Retrieval System</p>
            <h1>Two-Tower Product Search</h1>
          </div>
          <div className="status-pill">ANN-ready embeddings</div>
        </header>

        <section className="controls">
          <div className="search-box">
            <Search size={20} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} />
            <button onClick={() => runSearch()}>{loading ? "Ranking" : "Search"}</button>
          </div>
          <div className="quick-queries">
            {sampleQueries.map((item) => (
              <button key={item} onClick={() => runSearch(item)}>{item}</button>
            ))}
          </div>
          <div className="personalization">
            <label>
              Segment
              <select value={segment} onChange={(event) => setSegment(event.target.value)}>
                <option>electronics_enthusiast</option>
                <option>home_office</option>
                <option>budget_shopper</option>
                <option>fitness</option>
              </select>
            </label>
            <label>
              Preferred category
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option>Electronics</option>
                <option>Home</option>
                <option>Furniture</option>
                <option>Sports</option>
                <option>Fashion</option>
              </select>
            </label>
            <label>
              Price sensitivity
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={priceSensitivity}
                onChange={(event) => setPriceSensitivity(Number(event.target.value))}
              />
            </label>
          </div>
        </section>

        <section className="summary">
          <article>
            <span>Top match</span>
            <strong>{topResult?.product.title ?? "--"}</strong>
          </article>
          <article>
            <span>Top score</span>
            <strong>{topResult ? topResult.score.toFixed(3) : "--"}</strong>
          </article>
          <article>
            <span>Catalog size</span>
            <strong>8 demo items</strong>
          </article>
        </section>

        <section className="results">
          <div className="section-title">
            <h2>Ranked Products</h2>
            <p>Semantic match plus item metadata and personalization signals.</p>
          </div>
          {results.map((result, index) => (
            <article className="result-row" key={result.product.product_id}>
              <div className="rank">{index + 1}</div>
              <div className="product-copy">
                <strong>{result.product.title}</strong>
                <span>{result.product.category} · ${result.product.price.toFixed(2)} · {result.product.review_count.toLocaleString()} reviews</span>
              </div>
              <div className="stars"><Star size={16} /> {result.product.rating}</div>
              <div className="score-bars">
                <label>Semantic <meter min="0" max="1" value={Math.max(result.signals.semantic, 0)} /></label>
                <label>Metadata <meter min="0" max="0.3" value={result.signals.metadata} /></label>
              </div>
              <strong className="score">{result.score.toFixed(3)}</strong>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
