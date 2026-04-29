import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Начинается заполнение базы данных...\n');

    // Очистка существующих данных (опционально)
    // await prisma.booking.deleteMany();
    // await prisma.favorite.deleteMany();
    // await prisma.property.deleteMany();
    // await prisma.user.deleteMany();

    // 1. Создание LANDLORD пользователя
    console.log('👤 Создание LANDLORD пользователя...');
    const hashedPassword = await bcrypt.hash('landlord123', 10);
    const landlord = await prisma.user.upsert({
      where: { email: 'landlord@domrent.kz' },
      update: {},
      create: {
        email: 'landlord@domrent.kz',
        password: hashedPassword,
        name: 'Айбек Еремин',
        phone: '+7 700 123 45 67',
        role: 'LANDLORD',
        telegramId: null // Владелец может установить позже через Telegram бота
      }
    });
    console.log(`✅ LANDLORD создан: ${landlord.email}\n`);

    // 2. Создание Property объектов
    console.log('🏠 Создание объектов недвижимости...\n');

    const properties = [
      {
        title: 'Премиум квартира в центре Алматы',
        description: 'Современная квартира с панорамным видом на город. 2 спальни, балкон, полностью оборудованная кухня. Рядом парк и торговые центры.',
        price: 2500,
        type: 'квартира',
        city: 'Алматы',
        images: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
          'https://images.unsplash.com/photo-1545324418-cc1a9a6fded0?w=800'
        ]
      },
      {
        title: 'Уютная квартира в микрорайоне Саялы',
        description: '1-комнатная квартира на 8 этаже. Ремонт, мебель, техника. Есть паркинг. Спокойный район для отдыха.',
        price: 1500,
        type: 'квартира',
        city: 'Алматы',
        images: [
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
          'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800'
        ]
      },
      {
        title: 'Современный дом с садом в Чиланзаре',
        description: 'Просторный 3-этажный дом. 4 спальни, зал, кухня, гараж. Огороженный двор, озеленение. Идеально для семьи или больших компаний.',
        price: 4000,
        type: 'дом',
        city: 'Алматы',
        images: [
          'https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=800',
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
        ]
      },
      {
        title: 'Экономная комната в общежитии',
        description: 'Небольшая комната в центре города. Общая кухня и санузел. Подходит для студентов и молодых специалистов. Свободный доступ в любое время.',
        price: 800,
        type: 'комната',
        city: 'Алматы',
        images: [
          'https://images.unsplash.com/photo-1565183938294-7563f3ce68c5?w=800'
        ]
      },
      {
        title: 'Люкс апартаменты в центре Астаны',
        description: 'Шикарные апартаменты с дизайнерским ремонтом. 2 спальни, ванная, кухня-гостиная. Виды на Байтерек. Охрана, концьерж, фитнес-центр.',
        price: 3500,
        type: 'квартира',
        city: 'Астана',
        images: [
          'https://images.unsplash.com/photo-1512917774080-9e6e7236fba2?w=800',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
        ]
      },
      {
        title: 'Стильная квартира в новом жилом комплексе',
        description: '1-комнатная квартира в популярном комплексе "Нео Сити". Современный интерьер, техника, мебель. Доступ к бассейну и спортзалу.',
        price: 2000,
        type: 'квартира',
        city: 'Астана',
        images: [
          'https://images.unsplash.com/photo-1540932239986-310128078ceb?w=800',
          'https://images.unsplash.com/photo-1549887534-f3bbb6d32fa0?w=800'
        ]
      },
      {
        title: 'Коттедж в престижном районе Астаны',
        description: 'Современный коттедж в закрытом жилом комплексе. 3 спальни, кабинет, гостиная, кухня. Бассейн, гараж, охрана 24/7.',
        price: 5000,
        type: 'дом',
        city: 'Астана',
        images: [
          'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
          'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800'
        ]
      }
    ];

    // Создание всех объектов
    for (const property of properties) {
      const createdProperty = await prisma.property.create({
        data: {
          ...property,
          ownerId: landlord.id
        }
      });
      console.log(`✅ Создана: "${createdProperty.title}" (${createdProperty.city})`);
    }

    console.log('\n✨ Успешно! База данных наполнена.\n');
    console.log('📝 Данные для входа:');
    console.log(`  Email: ${landlord.email}`);
    console.log('  Password: landlord123\n');

  } catch (error) {
    console.error('❌ Ошибка при заполнении БД:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
