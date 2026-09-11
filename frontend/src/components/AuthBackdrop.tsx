import React from 'react';

/** Fondo de las pantallas de acceso: halos de marca y los anillos de lente de la landing. */
const AuthBackdrop: React.FC = () => (
  <div className="auth-bg" aria-hidden="true">
    <svg className="auth-rings" viewBox="-550 -550 1100 1100">
      {[180, 260, 350, 450, 540].map(r => <circle key={r} r={r} />)}
    </svg>
  </div>
);

export default AuthBackdrop;
