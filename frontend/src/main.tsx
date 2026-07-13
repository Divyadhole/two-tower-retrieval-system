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

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8320";
const sampleQueries = ["wireless headphones", "desk lamp usb", "comfortable chair for desk", "mechanical keyboard"];

function App() {
  const [query, setQuery] = useState(sampleQueries[0]);
  const [segment, setSegment] = useState("electronics_enthusiast");
  const [category, setCategory] = useState("Electronics");
  const [priceSensitivity, setPriceSensitivity] = useState(0.4);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  const topResult = useMemo(() => results[0], [results]);

  async function runSearch(nextQuery = query) {
    setQuery(nextQuery);
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: nextQuery,
          segment,
          preferred_categories: category ? [category] : [],
          price_sensitivity: priceSensitivity,
          top_k: 5
        })
      });
      const payload = await response.json();
      setResults(payload.results ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSearch(sampleQueries[0]);
  }, []);

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
