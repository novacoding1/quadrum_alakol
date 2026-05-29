// db.js - Модуль базы данных зоны отдыха QUADRUM ALAKOL (localStorage)

// Дефолтные номера в соответствии с прайс-листом
const DEFAULT_ROOMS = [
    {
        id: "room_101",
        number: "101",
        category: "2-х местный номер",
        capacity: 2,
        priceLow: 40000,  // 20.06-30.06 и 11.08-20.08
        priceHigh: 60000, // 01.07-10.08
        status: "Свободен",
        description: "Комфортный двухместный номер со всеми удобствами и 3-разовым питанием. Отлично подходит для пар или семей с маленьким ребенком.",
        features: ["Двуспальная кровать (180х200)", "Собственный душ и туалет", "Кондиционер", "Телевизор", "Холодильник", "Набор полотенец", "Гардеробный шкаф"],
        image: "images/room_2_bed.jpg"
    },
    {
        id: "room_102",
        number: "102",
        category: "2-х местный номер",
        capacity: 2,
        priceLow: 40000,
        priceHigh: 60000,
        status: "Занят",
        description: "Уютный двухместный номер с видом на внутренний двор. Включает в себя 3-разовое комплексное питание.",
        features: ["Двуспальная кровать (180х200)", "Собственный душ и туалет", "Кондиционер", "Телевизор", "Холодильник", "Набор полотенец", "Гардеробный шкаф"],
        image: "images/room_2_bed.jpg"
    },
    {
        id: "room_201",
        number: "201",
        category: "3-х местный номер",
        capacity: 3,
        priceLow: 51000,  // 20.06-30.06 и 11.08-20.08
        priceHigh: 72000, // 01.07-10.08
        status: "Свободен",
        description: "Просторный трехместный номер с кондиционером и 3-разовым питанием. Идеальный выбор для небольшой семьи или компании друзей.",
        features: ["Двуспальная кровать (180х200)", "Односпальная кровать (90х200)", "Душ и туалет в номере", "Телевизор", "Холодильник", "Кондиционер", "Журнальный столик"],
        image: "images/room_3_bed.jpg"
    },
    {
        id: "room_202",
        number: "202",
        category: "3-х местный номер",
        capacity: 3,
        priceLow: 51000,
        priceHigh: 72000,
        status: "На обслуживании",
        description: "Светлый трехместный номер с полным комплектом удобств и трехразовым питанием на каждого гостя.",
        features: ["Двуспальная кровать (180х200)", "Односпальная кровать (90х200)", "Душ и туалет в номере", "Телевизор", "Холодильник", "Кондиционер", "Набор полотенец"],
        image: "images/room_3_bed.jpg"
    },
    {
        id: "room_301",
        number: "301",
        category: "4-х местный номер",
        capacity: 4,
        priceLow: 64000,  // 20.06-30.06 и 11.08-20.08
        priceHigh: 92000, // 01.07-10.08
        status: "Свободен",
        description: "Максимально просторный семейный номер. Полное оснащение для комфортного отдыха 4 человек, включая 3-разовое питание.",
        features: ["Двуспальная кровать (180х200)", "Односпальная кровать (90х200)", "Комфортный диван", "Кондиционер", "Телевизор", "Холодильник", "Душ и туалет", "Набор полотенец"],
        image: "images/room_4_bed.jpg"
    }
];

// Дефолтные анкеты бронирования для демонстрации в админке
const DEFAULT_BOOKINGS = [
    {
        id: "book_1",
        guestName: "Аскар Сериков",
        guestPhone: "+7 (707) 123-4567",
        roomCategory: "3-х местный номер",
        roomNumber: "201",
        checkIn: "2026-06-21",
        checkOut: "2026-06-26",
        nights: 5,
        adults: 2,
        kidsUnder4: 1,
        kids5to11: 1,
        totalPrice: 225250, // ((2*17000) + (1*17000*0.65) + 0) * 5 ночей = (34000 + 11050) * 5 = 45050 * 5 = 225250 KZT
        status: "Новая",
        wishes: "Нужна детская коляска и номер на солнечной стороне.",
        createdAt: "2026-05-28T14:32:00.000Z"
    },
    {
        id: "book_2",
        guestName: "Динара Ахметова",
        guestPhone: "+7 (777) 987-6543",
        roomCategory: "2-х местный номер",
        roomNumber: "102",
        checkIn: "2026-07-05",
        checkOut: "2026-07-10",
        nights: 5,
        adults: 2,
        kidsUnder4: 0,
        kids5to11: 0,
        totalPrice: 300000, // Высокий сезон: (2 * 30000) * 5 ночей = 300000 KZT
        status: "Подтверждена",
        wishes: "Пожалуйста, предоставьте тихий номер.",
        createdAt: "2026-05-27T09:15:00.000Z"
    }
];

// Класс для работы с Базой Данных
class AlakolDB {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem("alakol_rooms")) {
            localStorage.setItem("alakol_rooms", JSON.stringify(DEFAULT_ROOMS));
        }
        if (!localStorage.getItem("alakol_bookings")) {
            localStorage.setItem("alakol_bookings", JSON.stringify(DEFAULT_BOOKINGS));
        }
    }

    // --- Методы для Номеров ---
    getRooms() {
        return JSON.parse(localStorage.getItem("alakol_rooms"));
    }

    saveRooms(rooms) {
        localStorage.setItem("alakol_rooms", JSON.stringify(rooms));
    }

    addRoom(room) {
        const rooms = this.getRooms();
        // Генерируем уникальный ID
        room.id = "room_" + Date.now();
        rooms.push(room);
        this.saveRooms(rooms);
        return room;
    }

    updateRoom(updatedRoom) {
        const rooms = this.getRooms();
        const index = rooms.findIndex(r => r.id === updatedRoom.id);
        if (index !== -1) {
            rooms[index] = { ...rooms[index], ...updatedRoom };
            this.saveRooms(rooms);
            return true;
        }
        return false;
    }

    updateRoomStatus(roomId, newStatus) {
        const rooms = this.getRooms();
        const room = rooms.find(r => r.id === roomId);
        if (room) {
            room.status = newStatus;
            this.saveRooms(rooms);
            return true;
        }
        return false;
    }

    deleteRoom(roomId) {
        let rooms = this.getRooms();
        rooms = rooms.filter(r => r.id !== roomId);
        this.saveRooms(rooms);
    }

    // --- Методы для Бронирований (Анкет) ---
    getBookings() {
        const bookings = JSON.parse(localStorage.getItem("alakol_bookings"));
        // Сортировка: сначала новые заявки, затем по дате создания (новые сверху)
        return bookings.sort((a, b) => {
            if (a.status === "Новая" && b.status !== "Новая") return -1;
            if (a.status !== "Новая" && b.status === "Новая") return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }

    saveBookings(bookings) {
        localStorage.setItem("alakol_bookings", JSON.stringify(bookings));
    }

    addBooking(booking) {
        const bookings = this.getBookings();
        booking.id = "book_" + Date.now();
        booking.status = "Новая";
        booking.createdAt = new Date().toISOString();
        bookings.push(booking);
        this.saveBookings(bookings);
        return booking;
    }

    updateBookingStatus(bookingId, newStatus) {
        const bookings = this.getBookings();
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
            booking.status = newStatus;
            
            // Если бронь подтверждена, мы можем обновить статус комнаты
            if (newStatus === "Подтверждена" && booking.roomNumber) {
                const rooms = this.getRooms();
                const room = rooms.find(r => r.number === booking.roomNumber);
                if (room) {
                    room.status = "Занят";
                    this.saveRooms(rooms);
                }
            } else if (newStatus === "Отменена" && booking.roomNumber) {
                // Если отменили бронь, освобождаем комнату (если она была занята)
                const rooms = this.getRooms();
                const room = rooms.find(r => r.number === booking.roomNumber);
                if (room && room.status === "Занят") {
                    room.status = "Свободен";
                    this.saveRooms(rooms);
                }
            }

            this.saveBookings(bookings);
            return true;
        }
        return false;
    }

    deleteBooking(bookingId) {
        let bookings = this.getBookings();
        bookings = bookings.filter(b => b.id !== bookingId);
        this.saveBookings(bookings);
    }

    // --- Калькулятор Стоимости ---
    // Метод определяет сезон для конкретной даты
    getSeasonForDate(date) {
        const month = date.getMonth(); // 0 - Январь, 5 - Июнь, 6 - Июль, 7 - Август
        const day = date.getDate();

        // Высокий сезон: с 01.07 по 10.08
        if (month === 6) { // Июль полностью
            return "high";
        }
        if (month === 7 && day <= 10) { // Первые 10 дней августа
            return "high";
        }
        
        // Низкий сезон 1 (20.06 - 30.06) и Низкий сезон 2 (11.08 - 20.08)
        // Для дат вне этих промежутков тоже отдаем тариф низкого сезона
        return "low";
    }

    // Расчет стоимости на 1 человека в сутки на основе категории номера и даты
    getPricePerPersonForDate(category, capacity, date) {
        const season = this.getSeasonForDate(date);
        
        // По умолчанию ищем в дефолтных настройках цен для категорий
        let priceLow = 40000;
        let priceHigh = 60000;

        if (category.includes("3-х")) {
            priceLow = 51000;
            priceHigh = 72000;
        } else if (category.includes("4-х")) {
            priceLow = 64000;
            priceHigh = 92000;
        } else {
            // Для кастомных категорий, если админ добавил новый номер, 
            // попробуем взять цену из существующей базы комнат
            const rooms = this.getRooms();
            const matchingRoom = rooms.find(r => r.category === category);
            if (matchingRoom) {
                priceLow = matchingRoom.priceLow;
                priceHigh = matchingRoom.priceHigh;
                capacity = matchingRoom.capacity;
            }
        }

        const roomPrice = (season === "high") ? priceHigh : priceLow;
        return roomPrice / capacity; // Стоимость на 1 человека в сутки
    }

    // Полный детальный расчет стоимости проживания посуточно
    calculateStayDetails(category, checkInStr, checkOutStr, adults, kidsUnder4, kids5to11) {
        if (!checkInStr || !checkOutStr) return { total: 0, nights: 0, breakdown: [] };

        const checkIn = new Date(checkInStr);
        const checkOut = new Date(checkOutStr);
        
        // Разница в днях
        const timeDiff = checkOut.getTime() - checkIn.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (nights <= 0 || isNaN(nights)) {
            return { total: 0, nights: 0, breakdown: [] };
        }

        // Вместимость категории для расчета цены на человека
        let capacity = 2;
        if (category.includes("3-х")) capacity = 3;
        else if (category.includes("4-х")) capacity = 4;
        else {
            const rooms = this.getRooms();
            const room = rooms.find(r => r.category === category);
            if (room) capacity = room.capacity;
        }

        let totalPrice = 0;
        const breakdown = [];

        // Считаем посуточно
        for (let i = 0; i < nights; i++) {
            const currentDate = new Date(checkIn);
            currentDate.setDate(checkIn.getDate() + i);

            const basePricePerPerson = this.getPricePerPersonForDate(category, capacity, currentDate);
            
            // Расчет для гостей на этот день:
            const adultsCost = adults * basePricePerPerson;
            const kids5to11Cost = kids5to11 * (basePricePerPerson * 0.65); // Скидка 35%
            const kidsUnder4Cost = 0; // Бесплатно

            const dayTotal = adultsCost + kids5to11Cost;
            totalPrice += dayTotal;

            // Логируем разбивку дня для детализации
            breakdown.push({
                date: currentDate.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
                season: this.getSeasonForDate(currentDate) === "high" ? "Высокий" : "Низкий",
                basePrice: basePricePerPerson,
                adultsCost,
                kids5to11Cost,
                dayTotal
            });
        }

        return {
            total: Math.round(totalPrice),
            nights,
            breakdown
        };
    }
}

// Экспортируем БД в глобальную область видимости для простоты доступа в других скриптах
window.db = new AlakolDB();
console.log("QUADRUM DB initialized successfully!");
