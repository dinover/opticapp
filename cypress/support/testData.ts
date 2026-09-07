/**
 * Genera nombres/usernames únicos por corrida para no chocar entre ejecuciones
 * en paralelo y para poder identificar (y limpiar) fácilmente los datos que
 * crea cada suite. `run()` es el run id de GitHub Actions cuando corre en CI,
 * o un timestamp local en desarrollo.
 */
const runId = Cypress.env('runId') || Date.now().toString(36);

export function uniqueName(prefix: string): string {
  return `${prefix}_${runId}_${Math.random().toString(36).slice(2, 7)}`;
}
