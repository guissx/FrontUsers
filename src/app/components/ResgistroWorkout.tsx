'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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

const WorkoutCreationPage = () => {
  const navigate = useNavigate();
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

  // Verificação do token ao carregar o componente
  useEffect(() => {
    const validateToken = () => {
      setIsLoading(true);
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        navigate('/login');
        return;
      }

      try {
        const decoded = jwtDecode<JwtPayload>(storedToken);
        
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        setToken(storedToken);
        setDecodedToken(decoded);
      } catch (error) {
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [navigate]);

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
      navigate('/login');
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
        '/api/workouts',
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
          navigate('/login');
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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Criar Novo Treino</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
          <p>Treino criado com sucesso!</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Título do Treino*</label>
          <input
            type="text"
            name="title"
            value={workout.title}
            onChange={handleWorkoutChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Treino de Peito, Lower Body"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Data*</label>
          <input
            type="date"
            name="date"
            value={workout.date}
            onChange={handleWorkoutChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Adicionar Exercício</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Nome do Exercício*</label>
            <input
              type="text"
              name="name"
              value={newExercise.name}
              onChange={handleExerciseChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Supino Reto, Agachamento"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Séries*</label>
            <input
              type="number"
              name="sets"
              min="1"
              value={newExercise.sets}
              onChange={handleExerciseChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Repetições*</label>
            <input
              type="number"
              name="reps"
              min="1"
              value={newExercise.reps}
              onChange={handleExerciseChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">Peso (kg)</label>
            <input
              type="number"
              name="weight"
              min="0"
              step="0.5"
              value={newExercise.weight || ''}
              onChange={handleExerciseChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Observações</label>
          <textarea
            name="notes"
            value={newExercise.notes || ''}
            onChange={handleExerciseChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Dicas, variações, etc."
            rows={2}
          />
        </div>
        
        <button
          onClick={addExercise}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Adicionar Exercício
        </button>
      </div>

      {workout.exercises.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Exercícios ({workout.exercises.length})</h2>
            <span className="text-sm text-gray-500">Clique em um exercício para remover</span>
          </div>
          
          <div className="space-y-3">
            {workout.exercises.map((exercise, index) => (
              <div 
                key={index} 
                onClick={() => removeExercise(index)}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-800">{exercise.name}</h3>
                    <p className="text-gray-600">
                      {exercise.sets} séries × {exercise.reps} repetições
                      {exercise.weight ? ` × ${exercise.weight}kg` : ''}
                    </p>
                    {exercise.notes && (
                      <p className="text-gray-500 mt-1 text-sm">Obs: {exercise.notes}</p>
                    )}
                  </div>
                  <button
                    className="text-red-500 hover:text-red-700 p-1"
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

      <div className="flex justify-end">
        <button
          onClick={submitWorkout}
          disabled={isSubmitting || workout.exercises.length === 0}
          className={`px-6 py-3 rounded-lg text-white font-medium ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : workout.exercises.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 transition-colors duration-200'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Salvando...
            </span>
          ) : 'Salvar Treino'}
        </button>
      </div>
    </div>
  );
};

export default WorkoutCreationPage;