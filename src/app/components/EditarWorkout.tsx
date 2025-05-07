'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

interface JwtPayload {
  userId: string;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

interface EditarTreinoProps {
  workoutId: string; // Adicione esta interface
}


export default function EditarWorkout({ workoutId }: EditarTreinoProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const router = useRouter();
  const params = useParams();


  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const validateToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return null;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        router.push('/login');
        return null;
      }
      return token;
    } catch (error) {
      localStorage.removeItem('token');
      router.push('/login');
      return null;
    }
  };

  const fetchWorkout = async () => {
    try {
      const validToken = validateToken();
      if (!validToken || !workoutId) return;

      const response = await axios.get(
        `https://mongo-api-model-guissxs-projects.vercel.app/Workout/${workoutId}`,
        {
          headers: {
            'Authorization': `Bearer ${validToken}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
          validateStatus: (status) => status < 500
        }
      );

      if (response.status === 404) {
        setErro('Treino não encontrado');
        return;
      }

      if (!response.data.success) {
        setErro(response.data.message || 'Erro ao carregar treino');
        return;
      }

      const workout = response.data.data;
      setTitle(workout.title);
      setDate(new Date(workout.date).toISOString().split('T')[0]);
      setExercises(workout.exercises || []);
    } catch (error: any) {
      console.error("Erro ao carregar treino:", error);
      setErro(error.response?.data?.message || "Erro ao carregar treino. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workoutId) {
      fetchWorkout();
    }
  }, [workoutId]);

  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', sets: 0, reps: 0, weight: 0 }]);
    setHasChanges(true);
  };

  const handleRemoveExercise = (index: number) => {
    const newExercises = exercises.filter((_, i) => i !== index);
    setExercises(newExercises);
    setHasChanges(true);
  };

  const handleExerciseChange = (index: number, field: keyof Exercise, value: string | number) => {
    const newExercises = exercises.map((ex, i) => 
      i === index ? { ...ex, [field]: value } : ex
    );
    setExercises(newExercises);
    setHasChanges(true);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    const today = new Date();
    
    if (selectedDate > today) {
      setErro('A data não pode ser no futuro');
      return;
    }
    
    setDate(e.target.value);
    setHasChanges(true);
    setErro('');
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!title.trim()) errors.push('O título é obrigatório');
    if (exercises.length === 0) errors.push('Adicione pelo menos um exercício');
    
    exercises.forEach((ex, index) => {
      if (!ex.name.trim()) errors.push(`Exercício ${index + 1}: Nome é obrigatório`);
      if (ex.sets <= 0) errors.push(`Exercício ${index + 1}: Número de séries inválido`);
      if (ex.reps <= 0) errors.push(`Exercício ${index + 1}: Número de repetições inválido`);
      if (ex.weight < 0) errors.push(`Exercício ${index + 1}: Peso inválido`);
    });

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setMensagem('');

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErro(validationErrors.join('\n'));
      return;
    }

    const validToken = validateToken();
    if (!validToken || !workoutId) return;

    try {
      const response = await axios.put(
        `https://mongo-api-model-guissxs-projects.vercel.app/Workout/${workoutId}`,
        {
          title,
          date,
          exercises
        },
        {
          headers: {
            'Authorization': `Bearer ${validToken}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );

      if (response.status === 200) {
        setMensagem('Treino atualizado com sucesso!');
        setHasChanges(false);
        setTimeout(() => {
          router.push('/treinos');
        }, 2000);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setErro('Treino não encontrado (o ID pode ser inválido)');
      } else {
        setErro(error.response?.data?.message || "Erro ao atualizar treino. Verifique os dados e tente novamente.");
      }
      console.error("Erro na atualização:", error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Editar Treino</h2>

        {mensagem && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md whitespace-pre-line">
            {erro}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-black mb-1">
            Título do Treino *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasChanges(true);
            }}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="date" className="block text-sm font-medium text-black mb-1">
            Data *
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={handleDateChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
            required
          />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700">Exercícios *</h3>
            <button
              type="button"
              onClick={handleAddExercise}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
            >
              Adicionar Exercício
            </button>
          </div>

          {exercises.length === 0 ? (
            <p className="text-gray-500 text-sm italic">Nenhum exercício adicionado</p>
          ) : (
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-black">Exercício {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(index)}
                      className="text-red-600 hover:text-red-800 text-sm "
                    >
                      Remover
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-black mb-1">Nome *</label>
                      <input
                        type="text"
                        value={exercise.name}
                        onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-black"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-black mb-1">Séries *</label>
                      <input
                        type="number"
                        min="1"
                        value={exercise.sets}
                        onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-md text-black"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-black mb-1">Repetições *</label>
                      <input
                        type="number"
                        min="1"
                        value={exercise.reps}
                        onChange={(e) => handleExerciseChange(index, 'reps', parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-md text-black"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-black mb-1">Peso (kg) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={exercise.weight}
                        onChange={(e) => handleExerciseChange(index, 'weight', parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded-md text-black"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
            disabled={!hasChanges}
          >
            Salvar Alterações
          </button>

          <button
            type="button"
            onClick={() => {
              if (hasChanges && !confirm('Tem alterações não salvas. Deseja realmente cancelar?')) return;
              router.push('/workouts');
            }}
            className="flex-1 py-2 px-4 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}