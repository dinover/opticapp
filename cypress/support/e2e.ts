import './commands';

// La interfaz toma el idioma del navegador (el de Cypress suele estar en
// inglés) y los tests verifican textos en español: se fija el español antes
// de que cargue cada página.
Cypress.on('window:before:load', (win) => {
  win.localStorage.setItem('opticapp.lang', 'es');
});
