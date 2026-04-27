import { createContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/app/providers/firebase';
import { authService } from '../api/auth.service';
import { UserProfile } from '../types/user.model';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>; 
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const[firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  const reloadUser = useCallback(async () => {
  try {
    const profile = await authService.getMe();
    setUser(profile);
  } catch (error) {
    console.error("Error recargando el perfil de Django:", error);
  }
  }, []);

  const value = useMemo(() => ({
  user,
  firebaseUser,
  isLoading,
  logout,
  reloadUser
  }), [user, firebaseUser, isLoading, reloadUser]);


  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
    try {
      if (currentFirebaseUser) {
        setFirebaseUser(prev => {
          if (prev?.uid === currentFirebaseUser.uid) return prev;
          return currentFirebaseUser;
        });

        const profile = await authService.getMe();

        setUser(prev => {
          if (prev?.id === profile.id &&
              prev?.terms_accepted_at === profile.terms_accepted_at &&
              prev?.password_changed === profile.password_changed) {
            return prev;
          }
          return profile;
        });

      } else {
        setFirebaseUser(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Error de conexión con el backend:", error);
      setUser(null); 
    } finally {
      setIsLoading(false);
    }
  });

  return () => unsubscribe();
}, []);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};