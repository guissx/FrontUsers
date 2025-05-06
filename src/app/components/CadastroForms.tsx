'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function CadastroForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasLength = password.length >= 8;
    return hasUpper && hasLower && hasNumber && hasLength;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setMensagem('');
    setIsLoading(true);

    if (!validateEmail(email)) {
      setErro('Por favor, insira um email válido (exemplo@dominio.com)');
      setIsLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setErro('A senha deve conter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um número.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('https://mongo-api-model-guissxs-projects.vercel.app/users/register', {
        name,
        email,
        password
      });

      if (response.status === 201 || response.status === 200) {
        setMensagem('Cadastro realizado com sucesso! Redirecionando para login...');
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 409) {
          setErro('Este email já está cadastrado.');
        } else if (error.response.data?.message) {
          setErro(error.response.data.message);
        } else {
          setErro("Ocorreu um erro no servidor. Tente novamente mais tarde.");
        }
      } else {
        setErro("Erro de conexão. Verifique sua internet e tente novamente.");
      }
      console.error("Erro no cadastro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Criar Conta</h2>

        {mensagem && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {erro}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo
          </label>
          <input
            type="text"
            id="nome"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            required
            placeholder="Seu nome"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            required
            placeholder="seu@email.com"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <input
            type="password"
            id="senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            required
            placeholder="••••••••"
          />
          <p className="text-xs text-gray-500 mt-1">
            Mínimo 8 caracteres com letras maiúsculas, minúsculas e números
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium mb-4 ${
            isLoading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 transition-colors'
          }`}
        >
          {isLoading ? 'Cadastrando...' : 'Cadastrar'}
        </button>

        <div className="text-center text-sm text-gray-600">
          <p>Já tem uma conta?{' '}
            <button
              type="button"
              onClick={navigateToLogin}
              className="text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
            >
              Faça login aqui
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}