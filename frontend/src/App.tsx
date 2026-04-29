import { useEffect, useState } from 'react';
import api from './api/axios'; // проверь, что путь к axios правильный
import { type Property } from './types'; // импортируем твой интерфейс

function App() {
  // Указываем тип <Property[]>, чтобы TS знал, что это массив объектов недвижимости
  const [houses, setHouses] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/properties')
      .then(res => {
        setHouses(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Ошибка при загрузке:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 text-center">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-blue-600">DomRent</h1>
        <p className="text-gray-600">Найдите жилье своей мечты</p>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {houses.length > 0 ? (
            houses.map((house) => (
              <div key={house.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                <img 
                  src={house.images[0] || 'https://placeholder.com'} 
                  alt={house.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-blue-500 uppercase">{house.type}</span>
                    <span className="text-lg font-bold text-gray-900">{house.price.toLocaleString()} ₸</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">{house.title}</h2>
                  <p className="text-gray-500 text-sm">{house.city}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center col-span-full">Объектов пока нет.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;