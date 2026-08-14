function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno requerida: ${name}. Configurala antes de iniciar el servidor.`
    );
  }
  return value;
}

export const JWT_SECRET = required('JWT_SECRET');
