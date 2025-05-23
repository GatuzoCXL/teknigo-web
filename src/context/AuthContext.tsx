'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, firestore } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { logout, UserType } from '@/firebase/auth';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  userType: UserType;
  isActive: boolean;
  profileComplete: boolean;
  photoURL: string | null;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  logOut: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: true,
  logOut: async () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Obtener datos del usuario de Firestore
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<UserProfile, 'uid' | 'email' | 'displayName' | 'photoURL'>;
            
            setUserProfile({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              ...userData
            });
            
            // Verificar si es administrador
            setIsAdmin(userData.userType === 'admin');
          } else {
            console.warn('No se encontró el perfil del usuario en Firestore');
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error al cargar datos del usuario:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logOut = async () => {
    try {
      await logout();
      return true;
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      return false;
    }
  };

  const value = {
    currentUser,
    userProfile,
    isAuthenticated: !!currentUser,
    isAdmin,
    loading,
    logOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
