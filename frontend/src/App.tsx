import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import { RegisterPage } from './pages/RegisterPage';
import LoginPage from "./pages/LoginPage";
import PropertyPage from "./pages/PropertyPage";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Внутренний Navbar, который имеет доступ к AuthContext
const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center px-10">
      <Link to="/" className="text-2xl font-bold text-blue-600">
        DomRent
      </Link>
      <div className="flex items-center space-x-6">
        <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium">
          Главная
        </Link>
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-gray-800 font-semibold">
              Привет, {user.name}!
            </span>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Выйти
            </button>
          </div>
        ) : (
          <div className="space-x-4">
            <Link to="/login" className="text-blue-600 hover:underline">
              Вход
            </Link>
            <Link
              to="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Регистрация
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

// Главный компонент со всеми обертками
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="max-w-7xl mx-auto py-10 px-4">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/property/:id" element={<PropertyPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}


export { RegisterPage };
export { App };
