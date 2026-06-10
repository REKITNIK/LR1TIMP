const fs = require('fs');

// Читаем текущую БД
let db;
try {
  db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
} catch (error) {
  db = { users: [], pendingUsers: [] };
}

// 15 новых пользователей с разными ролями и атрибутами
const newUsers = [
  {
    name: "Елена Владимировна Соколова",
    email: "elena.sokolova@hospital.ru",
    password: "doctor123",
    role: "doctor",
    position: "Врач-терапевт",
    department: "Терапевтическое отделение",
    phone: "+7 (916) 123-45-67",
    avatar: "Е",
    isApproved: true,
    doctorAttributes: {
      specialization: "Терапия",
      experience: 12,
      education: "Московский государственный медицинский университет",
      qualification: "Высшая категория",
      cabinet: 101,
      schedule: "ПН-ПТ 9:00-18:00",
      patientsPerDay: 20,
      rating: 4.8,
      biography: "Опытный врач-терапевт, специализируется на лечении заболеваний внутренних органов",
      certificates: ["Терапия", "Кардиология"],
      languages: ["Русский", "Английский"]
    }
  },
  {
    name: "Михаил Андреевич Козлов",
    email: "mikhail.kozlov@hospital.ru",
    password: "doctor123",
    role: "doctor",
    position: "Врач-хирург",
    department: "Хирургическое отделение",
    phone: "+7 (916) 234-56-78",
    avatar: "М",
    isApproved: true,
    doctorAttributes: {
      specialization: "Хирургия",
      experience: 15,
      education: "Санкт-Петербургский медицинский университет",
      qualification: "Высшая категория",
      cabinet: 205,
      schedule: "ПН,СР,ПТ 10:00-16:00",
      patientsPerDay: 10,
      rating: 4.9,
      biography: "Ведущий хирург, провел более 1000 успешных операций",
      certificates: ["Хирургия", "Лапароскопия"],
      languages: ["Русский"]
    }
  },
  {
    name: "Анна Сергеевна Морозова",
    email: "anna.morozova@hospital.ru",
    password: "nurse123",
    role: "nurse",
    position: "Медицинская сестра",
    department: "Терапевтическое отделение",
    phone: "+7 (916) 345-67-89",
    avatar: "А",
    isApproved: true
  },
  {
    name: "Дмитрий Петрович Новиков",
    email: "dmitry.novikov@hospital.ru",
    password: "doctor123",
    role: "doctor",
    position: "Врач-педиатр",
    department: "Педиатрическое отделение",
    phone: "+7 (916) 456-78-90",
    avatar: "Д",
    isApproved: true,
    doctorAttributes: {
      specialization: "Педиатрия",
      experience: 8,
      education: "Российский национальный исследовательский медицинский университет",
      qualification: "Первая категория",
      cabinet: 308,
      schedule: "ПН-ПТ 8:00-17:00",
      patientsPerDay: 25,
      rating: 4.7,
      biography: "Детский врач с большим опытом работы",
      certificates: ["Педиатрия", "Неонатология"],
      languages: ["Русский"]
    }
  },
  {
    name: "Ольга Игоревна Федорова",
    email: "olga.fedorova@hospital.ru",
    password: "doctor123",
    role: "doctor",
    position: "Врач-кардиолог",
    department: "Кардиологическое отделение",
    phone: "+7 (916) 567-89-01",
    avatar: "О",
    isApproved: true,
    doctorAttributes: {
      specialization: "Кардиология",
      experience: 10,
      education: "Московский медицинский университет им. Сеченова",
      qualification: "Высшая категория",
      cabinet: 112,
      schedule: "ПН,ВТ,ЧТ 9:00-15:00",
      patientsPerDay: 12,
      rating: 4.9,
      biography: "Кардиолог, специалист по лечению сердечно-сосудистых заболеваний",
      certificates: ["Кардиология", "УЗИ сердца"],
      languages: ["Русский", "Английский"]
    }
  },
  {
    name: "Алексей Викторович Павлов",
    email: "alexey.pavlov@hospital.ru",
    password: "doctor123",
    role: "doctor",
    position: "Врач-невролог",
    department: "Неврологическое отделение",
    phone: "+7 (916) 678-90-12",
    avatar: "А",
    isApproved: true,
    doctorAttributes: {
      specialization: "Неврология",
      experience: 7,
      education: "Санкт-Петербургский медицинский университет им. Павлова",
      qualification: "Первая категория",
      cabinet: 406,
      schedule: "ВТ-СБ 10:00-17:00",
      patientsPerDay: 14,
      rating: 4.6,
      biography: "Невролог, лечение головных болей и неврологических расстройств",
      certificates: ["Неврология", "ЭЭГ"],
      languages: ["Русский"]
    }
  },
  {
    name: "Наталья Дмитриевна Васильева",
    email: "natalia.vasilyeva@hospital.ru",
    password: "nurse123",
    role: "nurse",
    position: "Старшая медицинская сестра",
    department: "Хирургическое отделение",
    phone: "+7 (916) 789-01-23",
    avatar: "Н",
    isApproved: true
  },
  {
    name: "Сергей Николаевич Егоров",
    email: "sergey.egorov@hospital.ru",
    password: "doctor123",
    role: "doctor",
    position: "Врач-ортопед",
    department: "Травматологическое отделение",
    phone: "+7 (916) 890-12-34",
    avatar: "С",
    isApproved: true,
    doctorAttributes: {
      specialization: "Ортопедия",
      experience: 9,
      education: "Новосибирский медицинский университет",
      qualification: "Вторая категория",
      cabinet: 222,
      schedule: "ПН-ПТ 9:00-17:00",
      patientsPerDay: 11,
      rating: 4.5,
      biography: "Травматолог-ортопед, лечение заболеваний опорно-двигательного аппарата",
      certificates: ["Ортопедия", "Травматология"],
      languages: ["Русский"]
    }
  },
  {
    name: "Татьяна Владимировна Макарова",
    email: "tatiana.makarova@hospital.ru",
    password: "doctor123",
    role: "doctor",
    position: "Врач-офтальмолог",
    department: "Офтальмологическое отделение",
    phone: "+7 (916) 901-23-45",
    avatar: "Т",
    isApproved: true,
    doctorAttributes: {
      specialization: "Офтальмология",
      experience: 11,
      education: "Казанский медицинский университет",
      qualification: "Первая категория",
      cabinet: 314,
      schedule: "ПН-СР 10:00-18:00",
      patientsPerDay: 18,
      rating: 4.8,
      biography: "Врач-офтальмолог, коррекция зрения и лечение глазных заболеваний",
      certificates: ["Офтальмология", "Лазерная коррекция"],
      languages: ["Русский", "Английский"]
    }
  },
  {
    name: "Иван Алексеевич Кузнецов",
    email: "ivan.kuznetsov@hospital.ru",
    password: "nurse123",
    role: "nurse",
    position: "Фельдшер",
    department: "Скорая помощь",
    phone: "+7 (916) 012-34-56",
    avatar: "И",
    isApproved: true
  },
  {
    name: "Светлана Михайловна Белова",
    email: "svetlana.belova@hospital.ru",
    password: "doctor123",
    role: "doctor",
    position: "Врач-гастроэнтеролог",
    department: "Гастроэнтерологическое отделение",
    phone: "+7 (916) 123-45-78",
    avatar: "С",
    isApproved: true,
    doctorAttributes: {
      specialization: "Гастроэнтерология",
      experience: 10,
      education: "Московский медицинский университет",
      qualification: "Высшая категория",
      cabinet: 155,
      schedule: "ПН-ПТ 9:00-17:00",
      patientsPerDay: 16,
      rating: 4.7,
      biography: "Гастроэнтеролог, лечение заболеваний ЖКТ",
      certificates: ["Гастроэнтерология", "Эндоскопия"],
      languages: ["Русский"]
    }
  },
  {
    name: "Павел Андреевич Титов",
    email: "pavel.titov@hospital.ru",
    password: "doctor123",
    role: "doctor",
    position: "Врач-уролог",
    department: "Урологическое отделение",
    phone: "+7 (916) 234-56-89",
    avatar: "П",
    isApproved: true,
    doctorAttributes: {
      specialization: "Урология",
      experience: 13,
      education: "Санкт-Петербургский медицинский университет",
      qualification: "Высшая категория",
      cabinet: 421,
      schedule: "ПН,СР,ПТ 10:00-18:00",
      patientsPerDay: 12,
      rating: 4.8,
      biography: "Врач-уролог, лечение урологических заболеваний",
      certificates: ["Урология", "Андрология"],
      languages: ["Русский"]
    }
  },
  {
    name: "Екатерина Петровна Григорьева",
    email: "ekaterina.grigoryeva@hospital.ru",
    password: "nurse123",
    role: "nurse",
    position: "Операционная медсестра",
    department: "Хирургическое отделение",
    phone: "+7 (916) 345-67-90",
    avatar: "Е",
    isApproved: true
  },
  {
    name: "Владимир Игоревич Захаров",
    email: "vladimir.zakharov@hospital.ru",
    password: "doctor123",
    role: "doctor",
    position: "Врач-анестезиолог",
    department: "Анестезиологическое отделение",
    phone: "+7 (916) 456-78-01",
    avatar: "В",
    isApproved: true,
    doctorAttributes: {
      specialization: "Анестезиология",
      experience: 14,
      education: "Московский медицинский университет",
      qualification: "Высшая категория",
      cabinet: 501,
      schedule: "ПН-ПТ 8:00-20:00",
      patientsPerDay: 8,
      rating: 4.9,
      biography: "Врач-анестезиолог, обеспечение безопасности операций",
      certificates: ["Анестезиология", "Реаниматология"],
      languages: ["Русский", "Английский"]
    }
  },
  {
    name: "Мария Александровна Сорокина",
    email: "maria.sorokina@hospital.ru",
    password: "doctor123",
    role: "doctor",
    position: "Врач-эндокринолог",
    department: "Эндокринологическое отделение",
    phone: "+7 (916) 567-89-12",
    avatar: "М",
    isApproved: true,
    doctorAttributes: {
      specialization: "Эндокринология",
      experience: 9,
      education: "Российский медицинский университет",
      qualification: "Первая категория",
      cabinet: 603,
      schedule: "ПН-ПТ 9:00-18:00",
      patientsPerDay: 15,
      rating: 4.6,
      biography: "Эндокринолог, лечение гормональных нарушений",
      certificates: ["Эндокринология", "Диабетология"],
      languages: ["Русский"]
    }
  }
];

// Находим максимальный ID
let maxId = 0;
db.users.forEach(user => {
  const id = parseInt(user.id);
  if (!isNaN(id) && id > maxId) maxId = id;
});

console.log('🔄 Начинаем создание пользователей...\n');

let createdCount = 0;
let skippedCount = 0;

// Добавляем новых пользователей
for (const user of newUsers) {
  // Проверяем, нет ли уже такого email
  const exists = db.users.some(u => u.email === user.email);
  
  if (!exists) {
    maxId++;
    const newUser = {
      id: maxId.toString(),
      ...user,
      createdAt: new Date().toISOString(),
      isApproved: true
    };
    
    db.users.push(newUser);
    createdCount++;
    console.log(`✅ Создан пользователь ${createdCount}: ${user.name} - ${user.position || user.role}`);
  } else {
    skippedCount++;
    console.log(`⏭️ Пропущен: ${user.email} уже существует`);
  }
}

// Сохраняем БД
fs.writeFileSync('db.json', JSON.stringify(db, null, 2));

console.log(`\n📊 ИТОГО:`);
console.log(`✅ Создано новых пользователей: ${createdCount}`);
console.log(`⏭️ Пропущено (уже существуют): ${skippedCount}`);
console.log(`📋 Всего пользователей в БД: ${db.users.length}`);
console.log(`⏳ Ожидают подтверждения: ${db.pendingUsers.length}`);

// Выводим список созданных пользователей
console.log(`\n📋 СПИСОК СОЗДАННЫХ ПОЛЬЗОВАТЕЛЕЙ:`);
db.users.forEach(user => {
  if (newUsers.some(u => u.email === user.email)) {
    console.log(`   • ${user.name} - ${user.email} (${user.role})`);
  }
});

console.log(`\n🎉 Готово! 15 пользователей успешно созданы!`);
console.log(`\n💡 Тестовые данные для входа:`);
console.log(`   👨‍⚕️ Врачи: любой email из списка / password: doctor123`);
console.log(`   👩‍⚕️ Медсестры: любой email из списка / password: nurse123`);
