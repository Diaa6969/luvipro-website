import Image from "next/image";

export function CinemaVehicle({ priority = false }: { priority?: boolean }) {
  return <div className="cinema-vehicle" aria-hidden="true">
    <Image src="/brand/cinematic-vehicle.webp" alt="" fill sizes="(max-width: 760px) 100vw, 75vw" priority={priority} />
  </div>;
}
