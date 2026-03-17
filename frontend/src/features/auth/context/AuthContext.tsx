import { createContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/app/providers/firebase';
import { authService } from '../api/auth.service';
import { UserProfile } from '../types/user.model';

// Definimos la "forma" de los datos que estarán disponibles en toda la app
interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Función para cerrar sesión que se compartirá en el contexto
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  useEffect(() => {
    // Escuchamos los cambios de sesión de Firebase en tiempo real
    const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      setFirebaseUser(currentFirebaseUser);
      
      if (currentFirebaseUser) {
        try {
          // Si Firebase lo reconoce, pedimos el perfil completo a Django
          const profile = await authService.getMe();
          setUser(profile);
        } catch (error) {
          console.error("Error obteniendo el perfil de Django:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(false); 
    });

    return () => unsubscribe();
  }, []); 

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};