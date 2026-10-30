import { z } from "zod";

/**
 * Variables de entorno de servidor. Se validan al usarse (no al importar) para que
 * las fases que aún no tienen credenciales no rompan el build.
 * Nunca registrar los valores: los mensajes de error solo nombran la variable.
 */
const databaseEnvSchema = z.object({
  DATABASE_URL: z
    .string({ error: "DATABASE_URL no está definida" })
    .refine((v) => /^postgres(ql)?:\/\//.test(v), "DATABASE_URL debe ser una URL postgres://"),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

export function getDatabaseEnv(source: Record<string, string | undefined> = process.env): DatabaseEnv {
  const result = databaseEnvSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Configuración de base de datos inválida (${issues})`);
  }
  return result.data;
}
