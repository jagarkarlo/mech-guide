import Link from "next/link";
import { notFound } from "next/navigation";
import { getCar } from "@/data/catalog";
import PartsTree, { type TaxonomyGroup } from "@/components/PartsTree";
import taxonomy from "@/data/megane3/taxonomy.json";

export default async function PartsPage({ params }: { params: Promise<{ carId: string }> }) {
  const { carId } = await params;
  const car = getCar(carId);
  if (!car) notFound();
  return (
    <section className="page-wide">
      <div className="car-head">
        <Link href={`/cars/${car.id}`} className="crumb">← {car.model} {car.generation}</Link>
        <h1>Every replaceable part</h1>
        <span className="muted">Green: full guide with sourced specs · amber: a workshop-manual page exists · grey: no free source, needs licensed data</span>
      </div>
      <PartsTree car={car} taxonomy={taxonomy as TaxonomyGroup[]} />
    </section>
  );
}
