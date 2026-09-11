export type Lang = 'es' | 'en';

const LANG_KEY = 'opticapp.lang';

/** Idioma guardado por el visitante; si no hay, el del navegador (cualquier variante de español → es). */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'es' || saved === 'en') return saved;
  } catch {
    /* storage bloqueado: seguimos con el navegador */
  }
  return (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* sin storage el idioma no se recuerda, nada más */
  }
}

const es = {
  meta: { title: 'OpticApp — Software de gestión para ópticas' },
  nav: {
    features: 'Funciones',
    how: 'Cómo funciona',
    tour: 'Recorrido',
    trial: 'Prueba gratis',
    faq: 'Preguntas',
    login: 'Iniciar sesión',
    signup: 'Crear cuenta',
    toDark: 'Activar modo oscuro',
    toLight: 'Activar modo claro',
    lang: 'Idioma',
    menu: 'Secciones',
  },
  hero: {
    badgePill: 'Gratis',
    badge: '7 días de prueba · sin tarjeta',
    line1: 'Tu óptica,',
    line2: 'en perfecto foco.',
    sub: 'Clientes, fichas ópticas, stock, ventas y reportes en un solo lugar. El sistema de gestión pensado para ópticas: simple desde el primer día, completo cuando crecés.',
    ctaPrimary: 'Crear cuenta gratis',
    ctaSecondary: 'Ya tengo cuenta',
    note: 'Tu cuenta se crea al instante e incluye 7 días de prueba con todas las funciones.',
  },
  float: {
    rx: 'Ficha óptica',
    sale: 'Venta registrada',
    report: 'Reporte exportado',
    file: 'ventas_agosto.xlsx',
  },
  marquee: [
    'Fichas ópticas',
    'Control de stock',
    'Ventas',
    'Comprobantes',
    'Reportes en Excel',
    'Proveedores',
    'Importación desde Excel',
    'Multiusuario',
    'Modo oscuro',
    'Pesos y dólares',
  ],
  features: {
    eyebrow: 'Funciones',
    title: 'Todo lo que tu óptica necesita.',
    titleAccent: 'Nada que sobre.',
    sub: 'Pensado para el día a día del mostrador: sin planillas sueltas, sin cuadernos, sin vueltas.',
    items: {
      rx: {
        title: 'Ficha óptica en cada venta',
        desc: 'Esfera, cilindro, eje y adición de cada ojo, guardados junto a la venta y al cliente.',
      },
      clients: {
        title: 'Clientes siempre a mano',
        desc: 'Documento, contacto, nacimiento y notas. Encontrá a cualquiera en segundos.',
      },
      stock: {
        title: 'Catálogo y stock',
        desc: 'Armazones y productos con precio, stock e imagen, en grilla o en lista.',
      },
      receipt: {
        title: 'Ventas con comprobante',
        desc: 'Armá la venta con varios productos y generá el comprobante listo para imprimir.',
      },
      reports: {
        title: 'Reportes que se entienden',
        desc: 'Ventas por período, ranking de productos y armazones por proveedor. En pantalla o en Excel.',
      },
      import: {
        title: 'Importá tu catálogo',
        desc: '¿Tenés tus armazones en una planilla? Subí el Excel y listo.',
      },
      team: {
        title: 'Tu equipo, cada uno con su usuario',
        desc: 'Sumá empleados con acceso propio. Vos seguís siendo el dueño de la óptica.',
      },
      custom: {
        title: 'A tu manera',
        desc: 'Modo claro u oscuro, pesos o dólares, y un dashboard que muestra lo que vos querés ver.',
      },
    },
  },
  how: {
    eyebrow: 'Cómo funciona',
    title: 'Empezá hoy, en tres pasos.',
    sub: 'Sin instalaciones ni configuraciones eternas. Si sabés usar una planilla, sabés usar OpticApp.',
    steps: [
      {
        title: 'Creá tu cuenta',
        desc: 'Elegí un usuario, tu email y el nombre de tu óptica. Entrás al instante.',
        tag: '7 días gratis',
      },
      {
        title: 'Cargá tu información',
        desc: 'Importá tus armazones desde Excel, sumá proveedores y registrá a tus clientes.',
        tag: '',
      },
      {
        title: 'Vendé y medí',
        desc: 'Registrá ventas con ficha óptica, imprimí comprobantes y seguí tus números en el dashboard.',
        tag: '',
      },
    ],
  },
  tour: {
    eyebrow: 'Recorrido',
    title: 'Mirala por dentro.',
    sub: 'Así se ve OpticApp en el día a día de una óptica.',
    tabs: ['Dashboard', 'Clientes', 'Nueva venta', 'Reportes'],
  },
  trial: {
    eyebrow: 'Prueba gratis',
    title: 'Una semana entera, gratis.',
    sub: 'Creá tu cuenta y usá OpticApp completo durante 7 días. Sin tarjeta y sin compromiso.',
    bullets: [
      'Tu cuenta queda activa al instante',
      'Todas las funciones, sin límites',
      'No te pedimos tarjeta de crédito',
      'Lo que cargues queda guardado cuando activás tu licencia',
    ],
    cta: 'Empezar mi prueba gratis',
    fine: 'Cuando termina la prueba, activamos tu licencia mensual y seguís trabajando con todos tus datos.',
    days: 'días gratis',
  },
  faq: {
    eyebrow: 'Preguntas frecuentes',
    title: '¿Dudas? Te las sacamos.',
    items: [
      {
        q: '¿Tengo que instalar algo?',
        a: 'No. OpticApp funciona en el navegador: desde la computadora del local, una notebook o el celular.',
      },
      {
        q: '¿Qué incluye la prueba gratis?',
        a: 'Durante 7 días tenés acceso a todas las funciones: clientes, fichas ópticas, productos, ventas, reportes, importación y equipo. No te pedimos tarjeta.',
      },
      {
        q: '¿Qué pasa cuando termina la prueba?',
        a: 'Activamos tu licencia mensual y seguís trabajando con toda la información que cargaste. Si no la activás, el acceso queda en pausa.',
      },
      {
        q: '¿Puedo traer mis datos?',
        a: 'Sí. Podés importar tu listado de armazones desde un archivo Excel y cargar clientes y proveedores en minutos.',
      },
      {
        q: '¿Pueden usarla mis empleados?',
        a: 'Sí. Como dueño de la óptica podés crear usuarios para tu equipo, cada uno con su propio acceso.',
      },
      {
        q: '¿Mis datos están separados de otras ópticas?',
        a: 'Sí. Cada óptica trabaja en su propio espacio: solo tu equipo ve tus clientes, ventas y productos.',
      },
    ],
  },
  cta: {
    title: 'Tu óptica merece verse así de bien.',
    sub: 'Creá tu cuenta en un minuto y empezá hoy tu semana de prueba gratis.',
    primary: 'Crear cuenta gratis',
    secondary: 'Iniciar sesión',
  },
  footer: {
    tagline: 'Gestión de ópticas, simplificada.',
    product: 'Producto',
    account: 'Cuenta',
    rights: 'Todos los derechos reservados.',
    made: 'Hecho para ópticas de Latinoamérica.',
  },
  /** Textos de las pantallas de muestra: calcan la UI real de la app. */
  mock: {
    optics: 'Óptica Central',
    user: 'lucia',
    logout: 'Salir',
    trial: 'Modo de prueba · 7 días restantes',
    nav: {
      dashboard: 'Dashboard',
      clients: 'Clientes',
      products: 'Productos',
      sales: 'Ventas',
      suppliers: 'Proveedores',
      import: 'Importar',
      reports: 'Reportes',
      team: 'Equipo',
      settings: 'Ajustes',
    },
    dash: {
      title: 'Dashboard',
      sub: 'Resumen de tu negocio',
      totalSales: 'Total ventas',
      totalRevenue: 'Total ingresos',
      clients: 'Clientes',
      products: 'Productos',
      thisMonth: 'este mes',
      activeClients: 'clientes activos',
      inCatalog: 'en catálogo',
      topProducts: 'Productos más vendidos',
      recentSales: 'Ventas recientes',
      units: 'unidades vendidas',
    },
    products: [
      'Cristal antirreflejo 1.56',
      'Armazón acetato Milano',
      'Aviador metal clásico',
      'Lentes de sol polarizados',
      'Armazón infantil flex',
    ],
    clients: {
      title: 'Clientes',
      sub: '862 clientes registrados',
      search: 'Buscar por nombre, email, teléfono…',
      add: 'Nuevo cliente',
      cols: ['Cliente', 'Documento', 'Contacto', 'Alta', 'Acciones'],
    },
    sale: {
      page: 'Ventas',
      pageSub: '1.284 ventas registradas',
      title: 'Nueva venta',
      client: 'Cliente',
      date: 'Fecha',
      rx: 'Ficha óptica (opcional)',
      rxShort: 'Ficha óptica',
      od: 'OD',
      oi: 'OI',
      rxCols: ['Esf', 'Cil', 'Eje', 'Add'],
      products: 'Productos',
      total: 'Total',
      cancel: 'Cancelar',
      save: 'Crear venta',
    },
    reports: {
      title: 'Reportes',
      sub: 'Mirá o descargá información de tu óptica en Excel',
      byPeriod: 'Ventas por período',
      byPeriodDesc: 'Facturación agrupada por mes',
      billed: 'Facturado',
      sales: 'Ventas',
      avg: 'Ticket prom.',
      view: 'Ver',
      download: 'Descargar Excel',
      ranking: 'Ranking de productos vendidos',
      months: ['mar', 'abr', 'may', 'jun', 'jul', 'ago'],
    },
    feat: {
      saved: 'Guardada en la ficha de María',
      typed: 'Mar',
      stock: 'Stock',
      noStock: 'Sin stock',
      receipt: 'Comprobante de venta',
      receiptNo: 'N.º 000482',
      thanks: '¡Gracias por tu compra!',
      file: 'armazones.xlsx',
      importing: 'Importando armazones…',
      imported: 'armazones importados',
      report: 'reporte_ventas.xlsx',
      owner: 'Dueño',
      employee: 'Empleado',
      addEmployee: 'Nuevo empleado',
      theme: 'Tema',
      currency: 'Moneda',
      revenue: 'Total ingresos',
    },
  },
};

export type Copy = typeof es;

const en: Copy = {
  meta: { title: 'OpticApp — Management software for optical stores' },
  nav: {
    features: 'Features',
    how: 'How it works',
    tour: 'Tour',
    trial: 'Free trial',
    faq: 'FAQ',
    login: 'Log in',
    signup: 'Sign up',
    toDark: 'Switch to dark mode',
    toLight: 'Switch to light mode',
    lang: 'Language',
    menu: 'Sections',
  },
  hero: {
    badgePill: 'Free',
    badge: '7-day trial · no credit card',
    line1: 'Your optical store,',
    line2: 'in perfect focus.',
    sub: 'Clients, prescriptions, stock, sales and reports in one place. The management system built for optical stores: simple from day one, complete as you grow.',
    ctaPrimary: 'Create free account',
    ctaSecondary: 'I have an account',
    note: 'Your account is created instantly and includes a 7-day trial with every feature.',
  },
  float: {
    rx: 'Prescription',
    sale: 'Sale recorded',
    report: 'Report exported',
    file: 'sales_august.xlsx',
  },
  marquee: [
    'Prescriptions',
    'Stock control',
    'Sales',
    'Receipts',
    'Excel reports',
    'Suppliers',
    'Excel import',
    'Multi-user',
    'Dark mode',
    'Pesos & dollars',
  ],
  features: {
    eyebrow: 'Features',
    title: 'Everything your store needs.',
    titleAccent: 'Nothing it doesn’t.',
    sub: 'Built for everyday work at the counter: no scattered spreadsheets, no notebooks, no hassle.',
    items: {
      rx: {
        title: 'A prescription with every sale',
        desc: 'Sphere, cylinder, axis and add for each eye, saved with the sale and the client.',
      },
      clients: {
        title: 'Clients at your fingertips',
        desc: 'ID, contact info, birthday and notes. Find anyone in seconds.',
      },
      stock: {
        title: 'Catalog & stock',
        desc: 'Frames and products with price, stock and image, in grid or list view.',
      },
      receipt: {
        title: 'Sales with receipts',
        desc: 'Build a sale with multiple products and get a print-ready receipt.',
      },
      reports: {
        title: 'Reports that make sense',
        desc: 'Sales by period, product rankings and frames by supplier. On screen or in Excel.',
      },
      import: {
        title: 'Import your catalog',
        desc: 'Got your frames in a spreadsheet? Upload the Excel file and you’re done.',
      },
      team: {
        title: 'Your team, each with their own login',
        desc: 'Add employees with their own access. You stay the owner of the store.',
      },
      custom: {
        title: 'Your way',
        desc: 'Light or dark mode, pesos or dollars, and a dashboard that shows what you care about.',
      },
    },
  },
  how: {
    eyebrow: 'How it works',
    title: 'Get started today, in three steps.',
    sub: 'No installs, no endless setup. If you can use a spreadsheet, you can use OpticApp.',
    steps: [
      {
        title: 'Create your account',
        desc: 'Pick a username, your email and your store’s name. You’re in instantly.',
        tag: '7 days free',
      },
      {
        title: 'Load your data',
        desc: 'Import your frames from Excel, add suppliers and register your clients.',
        tag: '',
      },
      {
        title: 'Sell and track',
        desc: 'Record sales with prescriptions, print receipts and follow your numbers on the dashboard.',
        tag: '',
      },
    ],
  },
  tour: {
    eyebrow: 'Tour',
    title: 'Take a look inside.',
    sub: 'This is what OpticApp looks like in an optical store’s day-to-day.',
    tabs: ['Dashboard', 'Clients', 'New sale', 'Reports'],
  },
  trial: {
    eyebrow: 'Free trial',
    title: 'A whole week, on us.',
    sub: 'Create your account and use all of OpticApp for 7 days. No credit card, no commitment.',
    bullets: [
      'Your account is active instantly',
      'Every feature, no limits',
      'No credit card required',
      'Everything you load stays when you activate your license',
    ],
    cta: 'Start my free trial',
    fine: 'When the trial ends, we activate your monthly license and you keep working with all your data.',
    days: 'days free',
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Questions? We’ve got answers.',
    items: [
      {
        q: 'Do I need to install anything?',
        a: 'No. OpticApp runs in your browser: on the store’s computer, a laptop or your phone.',
      },
      {
        q: 'What does the free trial include?',
        a: 'For 7 days you get every feature: clients, prescriptions, products, sales, reports, import and team. No credit card needed.',
      },
      {
        q: 'What happens when the trial ends?',
        a: 'We activate your monthly license and you keep working with everything you’ve loaded. If you don’t activate it, access is paused.',
      },
      {
        q: 'Can I bring my existing data?',
        a: 'Yes. You can import your frames list from an Excel file and add clients and suppliers in minutes.',
      },
      {
        q: 'Can my employees use it?',
        a: 'Yes. As the store owner you can create users for your team, each with their own login.',
      },
      {
        q: 'Is my data kept separate from other stores?',
        a: 'Yes. Each store works in its own space: only your team sees your clients, sales and products.',
      },
    ],
  },
  cta: {
    title: 'Your store deserves to look this good.',
    sub: 'Create your account in a minute and start your free trial week today.',
    primary: 'Create free account',
    secondary: 'Log in',
  },
  footer: {
    tagline: 'Optical store management, simplified.',
    product: 'Product',
    account: 'Account',
    rights: 'All rights reserved.',
    made: 'Made for optical stores across Latin America.',
  },
  mock: {
    optics: 'Central Optical',
    user: 'lucia',
    logout: 'Log out',
    trial: 'Trial mode · 7 days left',
    nav: {
      dashboard: 'Dashboard',
      clients: 'Clients',
      products: 'Products',
      sales: 'Sales',
      suppliers: 'Suppliers',
      import: 'Import',
      reports: 'Reports',
      team: 'Team',
      settings: 'Settings',
    },
    dash: {
      title: 'Dashboard',
      sub: 'Your business at a glance',
      totalSales: 'Total sales',
      totalRevenue: 'Total revenue',
      clients: 'Clients',
      products: 'Products',
      thisMonth: 'this month',
      activeClients: 'active clients',
      inCatalog: 'in catalog',
      topProducts: 'Best-selling products',
      recentSales: 'Recent sales',
      units: 'units sold',
    },
    products: [
      '1.56 anti-glare lens',
      'Milano acetate frame',
      'Classic metal aviator',
      'Polarized sunglasses',
      'Kids flex frame',
    ],
    clients: {
      title: 'Clients',
      sub: '862 registered clients',
      search: 'Search by name, email, phone…',
      add: 'New client',
      cols: ['Client', 'ID', 'Contact', 'Added', 'Actions'],
    },
    sale: {
      page: 'Sales',
      pageSub: '1,284 recorded sales',
      title: 'New sale',
      client: 'Client',
      date: 'Date',
      rx: 'Prescription (optional)',
      rxShort: 'Prescription',
      od: 'OD',
      oi: 'OS',
      rxCols: ['Sph', 'Cyl', 'Axis', 'Add'],
      products: 'Products',
      total: 'Total',
      cancel: 'Cancel',
      save: 'Create sale',
    },
    reports: {
      title: 'Reports',
      sub: 'View or download your store’s data in Excel',
      byPeriod: 'Sales by period',
      byPeriodDesc: 'Revenue grouped by month',
      billed: 'Revenue',
      sales: 'Sales',
      avg: 'Avg. ticket',
      view: 'View',
      download: 'Download Excel',
      ranking: 'Best-selling products ranking',
      months: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    },
    feat: {
      saved: 'Saved to María’s record',
      typed: 'Mar',
      stock: 'Stock',
      noStock: 'Out of stock',
      receipt: 'Sales receipt',
      receiptNo: 'No. 000482',
      thanks: 'Thank you for your purchase!',
      file: 'frames.xlsx',
      importing: 'Importing frames…',
      imported: 'frames imported',
      report: 'sales_report.xlsx',
      owner: 'Owner',
      employee: 'Employee',
      addEmployee: 'New employee',
      theme: 'Theme',
      currency: 'Currency',
      revenue: 'Total revenue',
    },
  },
};

export const COPY: Record<Lang, Copy> = { es, en };
