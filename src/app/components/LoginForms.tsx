'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function LoginForms() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    try {
      const response = await axios.post('https://mongo-api-model-guissxs-projects.vercel.app/auth/login', {
        email,
        password
      });

      if (response.status === 201 || response.status === 200) {
        localStorage.setItem('token', response.data.token);
        router.push("/treinos");
      }
    } catch (error: any) {
      if (error.response && error.response.data?.message) {
        setErro(error.response.data.message);
      } else {
        setErro("Erro ao cadastrar. Verifique os dados e tente novamente.");
      }
      console.error("Erro no cadastro:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-lg">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-400">Login</h2>

        {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-black">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="mt-1 p-2 w-full border rounded-md text-gray-500"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="senha" className="block text-sm font-medium text-black">Senha</label>
          <input
            type="password"
            id="senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="mt-1 p-2 w-full border rounded-md text-gray-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-400 text-white p-2 rounded hover:bg-blue-800 transition cursor-pointer"
        >
          Entrar
        </button>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <button
              type="button"
              onClick={() => router.push('/cadastro')}
              className="text-blue-500 hover:text-blue-700 font-medium cursor-pointer  transition"
            >
              Cadastre-se aqui
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}