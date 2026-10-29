import Link from "next/link";
import { notFound } from "next/navigation";
import { getCar } from "@/data/catalog";
import TorqueTable from "@/components/TorqueTable";

export default async function TorquesPage({ params }: { params: Promise<{ carId: string }> }) {
  const { carId } = await params;
  const car = getCar(carId);
  if (!car) notFound();
  return (
    <section className="page-wide">
      <div className="car-head">
        <Link href={`/cars/${car.id}`} className="crumb">← {car.model} {car.generation}</Link>
        <h1>Tightening torques</h1>
        <span className="muted">{car.engine} · every fastener with its source</span>
      </div>
      <TorqueTable car={car} />
    </section>
  );
}
