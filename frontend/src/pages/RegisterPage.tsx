import { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'USER'
  });
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      alert('Регистрация успешна! Теперь войдите.');
      navigate('/login');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      alert(axiosError.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Регистрация</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ваше имя</label>
            <input 
              type="text" 
              placeholder="Иван Иванов" 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              placeholder="example@mail.com" 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
              required
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" 
              required
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Кто вы?</label>
            <select 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="USER">Я хочу арендовать жилье</option>
              <option value="LANDLORD">Я хочу сдавать жилье</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold mt-8 hover:bg-blue-700 transition shadow-md"
        >
          Создать аккаунт
        </button>
      </form>
    </div>
  );
};

export { RegisterPage };
