import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Optic, AuthResponse } from '../types';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  optic: Optic | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [optic, setOptic] = useState<Optic | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedOptic = localStorage.getItem('optic');

      if (storedToken && storedUser && storedOptic) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setOptic(JSON.parse(storedOptic));
          
          // Verify token is still valid
          await authAPI.getProfile();
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('optic');
          setToken(null);
          setUser(null);
          setOptic(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const response: AuthResponse = await authAPI.login({ username, password });
      
      setToken(response.token);
      setUser(response.user);
      setOptic(response.optic);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('optic', JSON.stringify(response.optic));
      
      toast.success('¡Inicio de sesión exitoso!');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error al iniciar sesión';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    try {
      setLoading(true);
      const response = await authAPI.register(data);
      
      // Don't automatically log in the user since they need approval
      toast.success('¡Registro enviado exitosamente! Tu cuenta será revisada por un administrador antes de poder iniciar sesión.');
      
      // Return the response so the component can handle it
      return response;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error al registrar';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setOptic(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('optic');
    toast.success('Sesión cerrada');
  };

  const value: AuthContextType = {
    user,
    optic,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 