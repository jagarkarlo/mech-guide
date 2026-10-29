import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrand, getCarsByBrand } from "@/data/catalog";

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand: brandId } = await params;
  const brand = getBrand(brandId);
  if (!brand) notFound();

  return (
    <section>
      <div className="hero">
        <p><Link href="/">← All brands</Link></p>
        <h1>{brand.name}</h1>
      </div>
      <div className="grid">
        {getCarsByBrand(brand.id).map((c) => (
          <Link key={c.id} href={`/cars/${c.id}`} className="card">
            <h2>{c.model} {c.generation}</h2>
            <p>{c.body} · {c.trim} · {c.engine}</p>
            <p className="muted">{c.years} · {c.components.length} repair jobs</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
