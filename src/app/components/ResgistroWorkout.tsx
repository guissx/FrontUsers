'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
}

interface WorkoutForm {
  title: string;
  date: string;
  exercises: Exercise[];
}

interface JwtPayload {
  userId: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

export default function RegistroDeTreinos() {
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutForm>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    exercises: []
  });

  const [newExercise, setNewExercise] = useState<Exercise>({
    name: '',
    sets: 3,
    reps: 10,
    weight: undefined,
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = () => {
      setIsLoading(true);
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
      } catch (error) {
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [router]);

  const handleWorkoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWorkout(prev => ({ 
      ...prev, 
      [name]: name === 'date' && !value ? new Date().toISOString().split('T')[0] : value 
    }));
    setError(null);
  };

  const handleExerciseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewExercise(prev => ({
      ...prev,
      [name]: name === 'sets' || name === 'reps' || name === 'weight' 
        ? Number(value) 
        : value
    }));
    setError(null);
  };

  const addExercise = () => {
    if (!newExercise.name.trim()) {
      setError('O nome do exercício é obrigatório');
      return;
    }

    if (newExercise.sets <= 0 || newExercise.reps <= 0) {
      setError('Séries e repetições devem ser maiores que zero');
      return;
    }

    if (newExercise.weight && newExercise.weight < 0) {
      setError('O peso não pode ser negativo');
      return;
    }
    
    setWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
    
    setNewExercise({
      name: '',
      sets: 3,
      reps: 10,
      weight: undefined,
      notes: ''
    });
  };

  const removeExercise = (index: number) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const submitWorkout = async () => {
    if (!token || !decodedToken) {
      router.push('/login');
      return;
    }

    if (!workout.title.trim()) {
      setError('O título do treino é obrigatório');
      return;
    }

    if (workout.exercises.length === 0) {
      setError('Adicione pelo menos um exercício');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.post(
        'https://mongo-api-model-guissxs-projects.vercel.app/Workout/',
        {
          title: workout.title,
          date: workout.date || new Date().toISOString().split('T')[0],
          exercises: workout.exercises
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setWorkout({
          title: '',
          date: new Date().toISOString().split('T')[0],
          exercises: []
        });
        
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.data.message || 'Erro ao criar treino');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        setError(err.response?.data?.message || 'Erro ao criar treino');
      } else {
        setError('Ocorreu um erro inesperado');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Criar Novo Treino</h1>
  
      {error && (
        <div className="bg-red-100 border-l-4 border-red-600 text-red-800 p-4 mb-6 rounded-lg shadow-sm">
          <p className="font-medium">{error}</p>
        </div>
      )}
  
      {success && (
        <div className="bg-green-100 border-l-4 border-green-600 text-green-800 p-4 mb-6 rounded-lg shadow-sm">
          <p className="font-medium">Treino criado com sucesso!</p>
        </div>
      )}
  
      {/* Informações do treino */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="mb-6">
          <label className="block text-gray-800 font-semibold text-lg mb-2">Título do Treino*</label>
          <input
            type="text"
            name="title"
            value={workout.title}
            onChange={handleWorkoutChange}
            className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none text-base placeholder-gray-400"
            placeholder="Ex: Treino de Peito, Lower Body"
            required
          />
        </div>
  
        <div className="mb-4">
          <label className="block text-gray-800 font-semibold text-lg mb-2">Data*</label>
          <input
            type="date"
            name="date"
            value={workout.date}
            onChange={handleWorkoutChange}
            className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none text-base"
            required
          />
        </div>
      </div>
  
      {/* Adicionar exercício */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-900">Adicionar Exercício</h2>
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-800 font-medium mb-2">Nome do Exercício*</label>
            <input
              type="text"
              name="name"
              value={newExercise.name}
              onChange={handleExerciseChange}
              className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none text-base placeholder-gray-400"
              placeholder="Ex: Supino Reto, Agachamento"
              required
            />
          </div>
  
          <div>
            <label className="block text-gray-800 font-medium mb-2">Séries*</label>
            <input
              type="number"
              name="sets"
              min="1"
              value={newExercise.sets}
              onChange={handleExerciseChange}
              className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none text-base"
              required
            />
          </div>
  
          <div>
            <label className="block text-gray-800 font-medium mb-2">Repetições*</label>
            <input
              type="number"
              name="reps"
              min="1"
              value={newExercise.reps}
              onChange={handleExerciseChange}
              className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none text-base"
              required
            />
          </div>
  
          <div>
            <label className="block text-gray-800 font-medium mb-2">Peso (kg)</label>
            <input
              type="number"
              name="weight"
              min="0"
              step="0.5"
              value={newExercise.weight || ''}
              onChange={handleExerciseChange}
              className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none text-base"
            />
          </div>
        </div>
  
        <div className="mb-4">
          <label className="block text-gray-800 font-medium mb-2">Observações</label>
          <textarea
            name="notes"
            value={newExercise.notes || ''}
            onChange={handleExerciseChange}
            className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none text-base placeholder-gray-400"
            placeholder="Dicas, variações, etc."
            rows={3}
          />
        </div>
  
        <button
          onClick={addExercise}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition duration-200"
        >
          Adicionar Exercício
        </button>
      </div>
  
      {/* Lista de exercícios */}
      {workout.exercises.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Exercícios ({workout.exercises.length})</h2>
            <span className="text-sm text-gray-500">Clique em um exercício para remover</span>
          </div>
  
          <div className="space-y-4">
            {workout.exercises.map((exercise, index) => (
              <div
                key={index}
                onClick={() => removeExercise(index)}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{exercise.name}</h3>
                    <p className="text-gray-600">
                      {exercise.sets} séries × {exercise.reps} repetições
                      {exercise.weight ? ` × ${exercise.weight}kg` : ''}
                    </p>
                    {exercise.notes && (
                      <p className="text-sm text-gray-500 mt-1">Obs: {exercise.notes}</p>
                    )}
                  </div>
                  <button
                    className="text-red-500 hover:text-red-700 text-xl font-bold"
                    aria-label="Remover exercício"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
  
      {/* Botão de salvar treino */}
      <div className="flex justify-end">
        <button
          onClick={submitWorkout}
          disabled={isSubmitting || workout.exercises.length === 0}
          className={`px-6 py-3 rounded-lg text-white font-semibold transition-colors duration-200 ${
            isSubmitting || workout.exercises.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
              </svg>
              Salvando...
            </span>
          ) : (
            'Salvar Treino'
          )}
        </button>
      </div>
    </div>
  );
  

}