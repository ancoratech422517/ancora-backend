import { createContext, useState, useContext } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [ativar, setAtivar] = useState("conteiner6");
  const [dadosUsuario, setDadosUsuario] = useState(null);

  return (
    <AuthContext.Provider value={{ ativar, setAtivar, dadosUsuario, setDadosUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para facilitar o uso
export const useAuth = () => useContext(AuthContext);
