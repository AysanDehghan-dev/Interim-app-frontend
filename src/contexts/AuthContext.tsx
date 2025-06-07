import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../config/api';

interface User {
  id: string;
  email: string;
  nom: string;
  prenom?: string;
  user_type: 'user' | 'company';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, userType: 'user' | 'company') => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
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
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configure api defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken();
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await api.get('/api/auth/verify');
      setUser({
        id: response.data.user_id,
        email: response.data.user_info.email,
        nom: response.data.user_info.nom,
        prenom: response.data.user_info.prenom,
        user_type: response.data.user_type
      });
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, userType: 'user' | 'company'): Promise<boolean> => {
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password,
        user_type: userType
      });

      const { token, user_info, user_type, user_id } = response.data;
      
      localStorage.setItem('token', token);
      
      setUser({
        id: user_id,
        email: user_info.email,
        nom: user_info.nom,
        prenom: user_info.prenom,
        user_type
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};