import { type useState } from 'react';
import api from '../api/axios';
import { type useNavigate } from 'react-router-dom';

export const RegisterPage = () => {
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
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Регистрация в DomRent</h2>
        <input 
          type="text" placeholder="Имя" className="w-full p-2 mb-4 border rounded"
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
        <input 
          type="email" placeholder="Email" className="w-full p-2 mb-4 border rounded" required
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
        <input 
          type="password" placeholder="Пароль" className="w-full p-2 mb-4 border rounded" required
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />
        <select 
          className="w-full p-2 mb-6 border rounded"
          onChange={(e) => setFormData({...formData, role: e.target.value})}
        >
          <option value="USER">Я хочу арендовать</option>
          <option value="LANDLORD">Я хочу сдавать жилье</option>
        </select>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Зарегистрироваться
        </button>
      </form>
    </div>
  );
};
