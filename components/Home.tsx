import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuth';
import { UploadIcon } from './Icons';

const Home: React.FC = () => {
    const { currentUser } = useAuthContext();

    const NavCard: React.FC<{ to: string, icon: React.ReactNode, title: string, description: string }> = ({ to, icon, title, description }) => (
        <Link to={to} className="block group bg-zinc-800 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transform transition-all duration-300 p-8">
            <div className="flex items-center justify-center h-20 w-20 rounded-full bg-sky-900/50 mb-8 group-hover:bg-sky-800/80 transition-colors duration-300">
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-zinc-100 mb-2">{title}</h3>
            <p className="text-lg text-zinc-400">{description}</p>
        </Link>
    );

    return (
        <div className="p-6 sm:p-8">
            <div className="mb-12">
                <h1 className="text-4xl font-extrabold text-white">APP CDO</h1>
                <p className="text-xl text-zinc-400 mt-2">Bienvenido, {currentUser?.name || 'Usuario'}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <NavCard 
                    to="/imports"
                    icon={<UploadIcon className="h-10 w-10 text-sky-400" />}
                    title="Descarga de importaciones"
                    description="Cree y gestione tareas de descarga de archivos de importación."
                />
            </div>
        </div>
    );
};

export default Home;