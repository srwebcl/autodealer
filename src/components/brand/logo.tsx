import Image from "next/image";
import logo from "../../../public/brand/logo-autodealer-trim.png";

/**
 * Logo oficial (archivo suministrado por el cliente, solo recortado el margen
 * transparente). "AUTO" es blanco: usar siempre sobre fondo oscuro.
 */
export function Logo({ className = "", preload = false }: { className?: string; preload?: boolean }) {
  return (
    <Image
      src={logo}
      alt="AutoDealer"
      className={`h-auto ${className}`}
      sizes="(min-width: 1024px) 200px, 160px"
      preload={preload}
    />
  );
}
