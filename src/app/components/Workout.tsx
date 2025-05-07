'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
}

interface Workout {
  _id: string;
  userId: string;
  title: string;
  date: string;
  exercises: Exercise[];
  createdAt: string;
  updatedAt: string;
}

interface JwtPayload {
  userId: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

export default function VisualizarTreinos() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<JwtPayload | null>(null);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterTitle, setFilterTitle] = useState<string>('');

  useEffect(() => {
    const validateToken = () => {
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        router.push('/login');
        return;
      }

      try {
        const decoded = jwtDecode<JwtPayload>(storedToken);
        
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        setToken(storedToken);
        setDecodedToken(decoded);
        fetchWorkouts(storedToken);
      } catch (error) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    };

    const fetchWorkouts = async (token: string) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const userId = decoded.userId;
    
        const response = await axios.get(
          `https://mongo-api-model-guissxs-projects.vercel.app/Workout/user/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
    
        if (response.data.success) {
          setWorkouts(response.data.data || response.data.workouts || []);
        } else {
          setError(response.data.message || 'Erro ao carregar treinos');
        }
      } catch (err) {
        console.error('Erro ao carregar treinos:', err);
        
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
          } else {
            setError(err.response?.data?.message || 'Erro ao carregar treinos');
          }
        } else {
          setError('Ocorreu um erro inesperado');
        }
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [router]);

  const deleteWorkout = async (workoutId: string) => {
    if (!token) {
      router.push('/login');
      return;
    }
  
    if (!confirm('Tem certeza que deseja excluir este treino?')) {
      return;
    }
  
    try {
      const response = await axios.delete(
        `https://mongo-api-model-guissxs-projects.vercel.app/Workout/${workoutId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (response.data.success) {
        setWorkouts(prev => prev.filter(w => w._id !== workoutId));
        alert('Treino excluído com sucesso!');
      } else {
        setError(response.data.message || 'Erro ao excluir treino');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Erro ao excluir treino');
      } else {
        setError('Ocorreu um erro inesperado');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const filteredWorkouts = workouts.filter(workout => {
    const matchesDate = filterDate ? workout.date.includes(filterDate) : true;
    const matchesTitle = filterTitle 
      ? workout.title.toLowerCase().includes(filterTitle.toLowerCase()) 
      : true;
    return matchesDate && matchesTitle;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!token || !decodedToken) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600">Meus Treinos</h1>
        <Link 
          href="/RegistroDeTreinos"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition duration-200"
        >
          Criar Novo Treino
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-600 text-red-800 p-4 mb-6 rounded-lg shadow-sm">
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Filtrar Treinos</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-800 font-medium mb-2">Data</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none text-base"
            />
          </div>
          
          <div>
            <label className="block text-gray-800 font-medium mb-2">Título</label>
            <input
              type="text"
              value={filterTitle}
              onChange={(e) => setFilterTitle(e.target.value)}
              className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none text-base placeholder-gray-400"
              placeholder="Pesquisar por título"
            />
          </div>
        </div>
      </div>

      {filteredWorkouts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-600 text-lg mb-4">
            {workouts.length === 0 
              ? 'Você ainda não registrou nenhum treino.'
              : 'Nenhum treino encontrado com os filtros atuais.'}
          </p>
          <Link 
            href="/RegistroDeTreinos"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition duration-200"
          >
            Criar Primeiro Treino
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredWorkouts
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(workout => (
              <div key={workout._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-800">{workout.title}</h2>
                      <p className="text-gray-600 mt-1">
                        <span className="font-medium">Data:</span> {formatDate(workout.date)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/edicaotreinos/${workout._id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => deleteWorkout(workout._id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Exercícios ({workout.exercises.length})</h3>
                  
                  <div className="space-y-4">
                    {workout.exercises.map((exercise, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-800">{exercise.name}</h4>
                            <p className="text-gray-600 mt-1">
                              {exercise.sets} séries × {exercise.reps} repetições
                              {exercise.weight ? ` × ${exercise.weight}kg` : ''}
                            </p>
                            {exercise.notes && (
                              <p className="text-sm text-gray-500 mt-2">
                                <span className="font-medium">Observações:</span> {exercise.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}