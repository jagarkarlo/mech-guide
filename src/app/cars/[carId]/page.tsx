import Link from "next/link";
import { existsSync } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { getBrand, getCar } from "@/data/catalog";
import CarExplorer from "@/components/CarExplorer";

export default async function CarPage({ params }: { params: Promise<{ carId: string }> }) {
  const { carId } = await params;
  const car = getCar(carId);
  if (!car) notFound();
  const brand = getBrand(car.brandId);
  const modelFile = car.model3d?.file;
  const modelUrl = modelFile && existsSync(path.join(process.cwd(), "public", modelFile)) ? modelFile : null;

  return (
    <section>
      <div className="car-head">
        <Link href={`/brands/${car.brandId}`} className="crumb">← {brand?.name}</Link>
        <h1>{car.model} {car.generation} {car.body}</h1>
        <span className="muted">{car.trim} · {car.engine} · {car.years}</span>
        <nav className="car-links">
          <Link href={`/cars/${car.id}/torques`}>⚙ All torques</Link>
          <Link href={`/cars/${car.id}/parts`}>☰ Every part</Link>
        </nav>
      </div>
      <CarExplorer car={car} modelUrl={modelUrl} />
    </section>
  );
}
