import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  size?: "nav" | "footer";
};

export function BrandLogo({ size = "nav" }: BrandLogoProps) {
  const dimensions =
    size === "footer"
      ? "h-[50px] w-[150px]"
      : "h-9 w-[110px] sm:h-11 sm:w-[140px]";

  return (
    <Link href="/" className="group relative inline-flex items-center" aria-label="LUVIPRO Startseite">
      <span className="pointer-events-none absolute -inset-2 rounded-full bg-ultraviolet/15 blur-lg transition duration-300 group-hover:bg-ultraviolet/22" />
      <span
        className={`relative flex ${dimensions} items-center justify-center overflow-hidden rounded-lg border border-pulse/20 bg-black/45 p-1 shadow-purple backdrop-blur-xl transition duration-300 group-hover:border-ultraviolet/45 group-hover:shadow-glow`}
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-pulse/10" />
        <span className="pointer-events-none absolute -left-1/2 top-0 h-full w-1/2 skew-x-[-18deg] bg-gradient-to-r from-transparent via-pulse/35 to-transparent blur-sm animate-logo-scan" />
        <Image
          src="/brand/luvipro-logo.png"
          alt="LUVIPRO"
          fill
          sizes={size === "footer" ? "150px" : "(max-width: 640px) 110px, 140px"}
          className="relative object-contain"
          priority={size === "nav"}
        />
      </span>
    </Link>
  );
}
