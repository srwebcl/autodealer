import { ButtonLink } from "@/components/ui/button-link";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <Logo className="w-40" />
      <p className="mt-12 font-display text-8xl font-extrabold italic text-brand-yellow">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold uppercase italic">Página no encontrada</h1>
      <p className="mt-3 max-w-md text-mist">La página que buscas no existe o el vehículo ya no está publicado.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/vehiculos">Ver vehículos</ButtonLink>
        <ButtonLink href="/" variant="outline">
          Ir al inicio
        </ButtonLink>
      </div>
    </main>
  );
}
