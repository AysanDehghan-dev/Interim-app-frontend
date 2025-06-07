import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

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

  // Configure axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      verifyToken();
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await axios.get('/api/auth/verify');
      setUser({
        id: response.data.user_id,
        email: response.data.user_info.email,
        nom: response.data.user_info.nom,
        prenom: response.data.user_info.prenom,
        user_type: response.data.user_type
      });
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, userType: 'user' | 'company'): Promise<boolean> => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
        user_type: userType
      });

      const { token, user_info, user_type, user_id } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
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
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};