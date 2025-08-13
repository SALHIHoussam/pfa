// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // ✅ Correct

const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decoded = jwtDecode(token);

        // Vérifier l’expiration du token
        const now = Date.now() / 1000;
        if (decoded.exp < now) {
          console.log('[AUTH] Token expiré');
          localStorage.removeItem('token');
          setUser(null);
        } else {
          setUser(decoded);
        }
      } catch (err) {
        console.error('[AUTH] Token invalide', err);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
  }, []);

  return { user };
};

export default useAuth;
