import type { Drivetrain, FuelType, Transmission, VehicleStatus } from "@/generated/prisma/enums";

export const fuelTypeLabels: Record<FuelType, string> = {
  GASOLINE: "Bencina",
  DIESEL: "Diésel",
  HYBRID: "Híbrido",
  PLUG_IN_HYBRID: "Híbrido enchufable",
  ELECTRIC: "Eléctrico",
  GAS: "Gas",
  OTHER: "Otro",
};

export const transmissionLabels: Record<Transmission, string> = {
  MANUAL: "Manual",
  AUTOMATIC: "Automática",
};

export const drivetrainLabels: Record<Drivetrain, string> = {
  FWD: "Delantera",
  RWD: "Trasera",
  AWD: "AWD",
  FOUR_WD: "4x4",
};

export const statusLabels: Record<VehicleStatus, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Reservado",
  SOLD: "Vendido",
  WITHDRAWN: "Retirado",
};
