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
  const router = useRouter();

  const validateEmail = (email: string) => {
    return email.includes('@');
  };

  const validatePassword = (password: string) => {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasLength = password.length >= 8;
    return hasUpper && hasLower && hasLength;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setMensagem('');

    // Validações
    if (!validateEmail(email)) {
      setErro('Email inválido. Deve conter "@"');
      return;
    }

    if (!validatePassword(password)) {
      setErro('A senha deve conter pelo menos 8 caracteres, uma letra maiúscula e uma minúscula.');
      return;
    }

    try {
      const response = await axios.post('https://backend-express-postgresql.vercel.app/users/register', {
        name,
        email,
        password
      });

      if (response.status === 201 || response.status === 200) {
        setMensagem('Cadastro realizado com sucesso!');
        setName('');
        setEmail('');
        setPassword('');
        alert("Cadastro realizado com sucesso!");
        router.push("/login");
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
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-400">Cadastro</h2>

      {mensagem && <p className="text-green-600 text-sm mb-4">{mensagem}</p>}
      {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}

      <div className="mb-4">
        <label htmlFor="nome" className="block text-sm font-medium text-black">Nome</label>
        <input
          type="text"
          id="nome"
          value={name}
          onChange={e => setName(e.target.value)}
          className="mt-1 p-2 w-full border rounded-md text-gray-500"
          required
        />
      </div>

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
        className="w-full bg-blue-400 text-white p-2 rounded hover:bg-blue-800 transition"
      >
        Cadastrar
      </button>
    </form>
  );
}
