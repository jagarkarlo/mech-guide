import Link from "next/link";
import { brands, cars, getCarsByBrand } from "@/data/catalog";
import { coverage } from "@/lib/types";

export default function Home() {
  const jobs = cars.reduce((n, c) => n + c.components.length, 0);
  const values = cars.reduce((n, c) => n + c.components.reduce((m, k) => m + coverage(k).sourced, 0), 0);
  const live = brands.filter((b) => getCarsByBrand(b.id).length);
  const rest = brands.filter((b) => !getCarsByBrand(b.id).length);

  return (
    <section>
      <div className="hero">
        <h1>Every bolt. <span>Every spec. Sourced.</span></h1>
        <p>Pick a car, explore it in 3D, take parts off and see exactly how they go back on — with tightening values you can trace to their source.</p>
        <div className="stats">
          <div><b>{cars.length}</b><span>vehicles</span></div>
          <div><b>{jobs}</b><span>repair jobs</span></div>
          <div><b>{values}</b><span>sourced values</span></div>
        </div>
      </div>
      <h3 className="section-title">Available</h3>
      <div className="grid">
        {live.map((b) => (
          <Link key={b.id} href={`/brands/${b.id}`} className="card">
            <span className="badge live">{getCarsByBrand(b.id).length} vehicle(s)</span>
            <h2>{b.name}</h2>
            <p className="muted small">{b.country}</p>
          </Link>
        ))}
      </div>
      <h3 className="section-title">In the directory — data being collected</h3>
      <div className="grid">
        {rest.map((b) => (
          <div key={b.id} className="card off">
            <span className="badge">no data yet</span>
            <h2>{b.name}</h2>
            <p className="muted small">{b.country}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
