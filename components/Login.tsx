import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuth';
import { KeyIcon, UserIcon } from './Icons';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const authContext = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Por favor, ingrese su nombre de usuario y contraseña.');
      return;
    }
    try {
      await authContext.login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      // The error from google.script.run might not be a true Error instance.
      // We check for a message property instead for robust error handling.
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as Error).message);
      } else {
        setError('Ocurrió un error inesperado al iniciar sesión.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-full px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <div className="inline-block mb-4">
                <img src="https://gdn.com.uy/wp-content/uploads/2024/07/image-62-e1721071072224-scaled-300x79.png" alt="GDNuy Logo" className="h-auto w-48 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-white mt-4">APP CDO</h2>
            <p className="text-zinc-400 mt-2">Por favor, inicie sesión para continuar.</p>
        </div>
        
        <div className="bg-zinc-800 shadow-2xl rounded-2xl p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="text-red-400 text-sm text-center p-3 bg-red-900/20 rounded-md">
                  {error}
                </div>
              )}

              <div>
                  <label htmlFor="username" className="sr-only">Nombre de Usuario</label>
                  <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <UserIcon className="h-5 w-5 text-zinc-400" />
                      </div>
                      <input
                          id="username"
                          name="username"
                          type="text"
                          autoComplete="username"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="block w-full text-base rounded-md border-zinc-600 bg-zinc-900 py-3 pl-10 pr-3 focus:border-sky-500 focus:ring-sky-500"
                          placeholder="Nombre de Usuario"
                      />
                  </div>
              </div>
               <div>
                  <label htmlFor="password"className="sr-only">Contraseña</label>
                  <div className="relative">
                       <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <KeyIcon className="h-5 w-5 text-zinc-400" />
                      </div>
                      <input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full text-base rounded-md border-zinc-600 bg-zinc-900 py-3 pl-10 pr-3 focus:border-sky-500 focus:ring-sky-500"
                          placeholder="Contraseña"
                      />
                  </div>
              </div>
              
              <div>
                <button
                    type="submit"
                    disabled={authContext.isAuthLoading}
                    className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:ring-offset-zinc-800 disabled:opacity-50 disabled:cursor-wait transition-colors"
                  >
                    {authContext.isAuthLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Verificando...</span>
                      </>
                    ) : (
                      <span>Iniciar Sesión</span>
                    )}
                  </button>
              </div>
            </form>
        </div>
        <p className="text-xs text-zinc-500 text-center mt-4">
            Asegúrese de tener permisos en la hoja de cálculo de la aplicación.
        </p>
      </div>
    </div>
  );
};