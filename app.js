// app.js - Логика стороны посетителя (клиентский функционал)

// Дожидаемся загрузки DOM
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

// Глобальное состояние текущей выбранной категории для бронирования
let currentSelectedCategory = "";

// Инициализация приложения
function initApp() {
    // Рендерим номера в галерее посетителя
    renderRooms();
    
    // Инициализируем даты по умолчанию в калькуляторе бронирования
    setupDefaultDates();

    // Слушатели скролла для подсветки активных ссылок в меню
    window.addEventListener("scroll", highlightActiveNavLink);
}

// Переключение разделов сайта (Visitor / Admin)
function showSection(section) {
    const visitorSection = document.getElementById("visitor-section");
    const adminSection = document.getElementById("admin-section");
    const visitorNav = document.getElementById("visitor-nav");
    const roleToggleBtn = document.getElementById("role-toggle-btn");
    const roleBtnText = document.getElementById("role-btn-text");

    if (section === "admin") {
        visitorSection.style.display = "none";
        adminSection.style.display = "block";
        visitorNav.style.visibility = "hidden";
        roleBtnText.textContent = "Вернуться на сайт";
        
        // Если уже авторизованы, перенаправляем на дашборд
        if (localStorage.getItem("admin_logged_in") === "true") {
            document.getElementById("admin-login-gate").style.display = "none";
            document.getElementById("admin-dashboard").style.display = "grid";
            // Инициализируем админ панель
            if (window.initAdminDashboard) {
                window.initAdminDashboard();
            }
        } else {
            document.getElementById("admin-login-gate").style.display = "flex";
            document.getElementById("admin-dashboard").style.display = "none";
        }
    } else {
        visitorSection.style.display = "block";
        adminSection.style.display = "none";
        visitorNav.style.visibility = "visible";
        roleBtnText.textContent = "Панель администратора";
        
        // Обновляем галерею на случай изменений статусов
        renderRooms();
    }
}

// Кнопка переключения роли в шапке
function toggleRole() {
    const visitorSection = document.getElementById("visitor-section");
    if (visitorSection.style.display !== "none") {
        showSection("admin");
    } else {
        showSection("visitor");
    }
}

// Подсветка активного пункта меню при прокрутке
function highlightActiveNavLink() {
    const sections = document.querySelectorAll("main > section");
    const navLinks = document.querySelectorAll(".nav-link");
    
    let currentSectionId = "";
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentSectionId = section.getAttribute("id");
        }
    });

    navLinks.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${currentSectionId}`) {
            link.classList.add("active");
        }
    });
}

// Рендеринг номеров посетителя (с фильтрацией)
function renderRooms(filter = 'all') {
    const roomsGrid = document.getElementById("rooms-grid");
    if (!roomsGrid) return;

    const allRooms = window.db.getRooms();
    
    // Группируем по уникальным категориям, чтобы посетитель бронировал тип номера
    const categoriesMap = {};

    allRooms.forEach(room => {
        if (!categoriesMap[room.category]) {
            categoriesMap[room.category] = {
                categoryName: room.category,
                capacity: room.capacity,
                priceLow: room.priceLow,
                priceHigh: room.priceHigh,
                description: room.description,
                features: room.features,
                image: room.image,
                totalRoomsCount: 0,
                freeRoomsCount: 0,
                roomsList: []
            };
        }
        categoriesMap[room.category].totalRoomsCount++;
        if (room.status === "Свободен") {
            categoriesMap[room.category].freeRoomsCount++;
        }
        categoriesMap[room.category].roomsList.push(room);
    });

    roomsGrid.innerHTML = "";

    // Фильтруем категории
    Object.values(categoriesMap).forEach(cat => {
        if (filter !== 'all' && !cat.categoryName.toLowerCase().includes(filter.toLowerCase())) {
            return;
        }

        const isAvailable = cat.freeRoomsCount > 0;
        const statusText = isAvailable ? `Доступно: ${cat.freeRoomsCount} комн.` : "Все заняты";
        const statusClass = isAvailable ? "status-free" : "status-busy";
        
        // Создаем карточку
        const cardHtml = `
            <div class="room-card animate-zoom">
                <div class="room-img-box">
                    <div class="room-img-placeholder" style="background-image: linear-gradient(rgba(10, 126, 140, 0.4), rgba(6, 18, 23, 0.85));">
                        <span class="room-badge badge-food">🍽️ 3-разовое питание</span>
                        <span class="room-badge badge-status ${statusClass}" style="top: 16px; right: 16px;">${statusText}</span>
                        <div class="title">${cat.categoryName}</div>
                    </div>
                </div>
                <div class="room-details">
                    <h3 class="room-category">${cat.categoryName}</h3>
                    <div class="room-capacity-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px; height:16px;">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        Размещение: до ${cat.capacity} человек + до 4 лет бесплатно
                    </div>
                    <p class="room-desc">${cat.description}</p>
                    <div class="room-features-list">
                        ${cat.features.slice(0, 4).map(f => `<span class="feature-tag">${f}</span>`).join('')}
                        ${cat.features.length > 4 ? `<span class="feature-tag">+ ещё ${cat.features.length - 4}</span>` : ''}
                    </div>
                    <div class="room-footer">
                        <div class="room-price-box">
                            <span class="room-price-title">Цена за номер в сутки:</span>
                            <span class="room-price-val">${cat.priceLow.toLocaleString()} - ${cat.priceHigh.toLocaleString()} ₸</span>
                            <span style="font-size:10px; color:var(--text-muted-light);">Включая 3-разовое питание</span>
                        </div>
                        <button class="btn btn-primary" onclick="openBookingModal('${cat.categoryName}')" ${isAvailable ? '' : 'disabled style="opacity: 0.6; cursor: not-allowed;"'}>
                            ${isAvailable ? 'Забронировать' : 'Нет свободных'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        roomsGrid.insertAdjacentHTML("beforeend", cardHtml);
    });
}

// Фильтрация номеров в галерее посетителя
function filterRooms(categoryType) {
    // Меняем активную кнопку в фильтрах
    const buttons = document.querySelectorAll("#rooms-filter-container .filter-btn");
    buttons.forEach(btn => btn.classList.remove("active"));
    
    // Ищем кнопку, которая вызвала функцию
    event.target.classList.add("active");

    renderRooms(categoryType);
}

// Настройка дефолтных дат (Заезд - завтра, выезд - через 3 дня)
function setupDefaultDates() {
    const checkInInput = document.getElementById("calc-checkin");
    const checkOutInput = document.getElementById("calc-checkout");
    
    if (!checkInInput || !checkOutInput) return;

    const today = new Date();
    
    // Заезд - завтра
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Выезд - через 3 дня
    const checkoutDate = new Date(tomorrow);
    checkoutDate.setDate(tomorrow.getDate() + 3);

    // Устанавливаем минимальную дату (сегодня)
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    checkInInput.min = `${yyyy}-${mm}-${dd}`;
    checkOutInput.min = `${yyyy}-${mm}-${dd}`;

    checkInInput.value = tomorrow.toISOString().split('T')[0];
    checkOutInput.value = checkoutDate.toISOString().split('T')[0];
}

// Открытие модального окна бронирования
function openBookingModal(categoryName) {
    currentSelectedCategory = categoryName;
    
    const modal = document.getElementById("booking-modal");
    const modalTitle = document.getElementById("modal-room-title");
    
    modalTitle.textContent = categoryName;
    modal.style.display = "flex";
    
    // Сбрасываем форму личных данных
    document.getElementById("booking-submit-form").reset();
    
    // Пересчитываем цену на основе дефолтных дат
    recalculatePrice();
}

// Закрытие модального окна бронирования
function closeBookingModal() {
    document.getElementById("booking-modal").style.display = "none";
}

// Динамический пересчёт стоимости бронирования (Калькулятор)
function recalculatePrice() {
    const checkInVal = document.getElementById("calc-checkin").value;
    const checkOutVal = document.getElementById("calc-checkout").value;
    const adults = parseInt(document.getElementById("calc-adults").value);
    const kids5to11 = parseInt(document.getElementById("calc-kids-5-11").value);
    const kidsUnder4 = parseInt(document.getElementById("calc-kids-under-4").value);
    
    const nightsCountEl = document.getElementById("calc-nights-count");
    const breakdownEl = document.getElementById("calc-breakdown-details");
    const totalPriceEl = document.getElementById("calc-total-price");

    // Защита: проверяем корректность дат
    if (!checkInVal || !checkOutVal) {
        nightsCountEl.textContent = "Выберите даты для расчёта";
        breakdownEl.innerHTML = "";
        totalPriceEl.textContent = "0 ₸";
        return;
    }

    const checkIn = new Date(checkInVal);
    const checkOut = new Date(checkOutVal);

    if (checkOut <= checkIn) {
        nightsCountEl.textContent = "⚠️ Дата выезда должна быть позже заезда!";
        breakdownEl.innerHTML = "";
        totalPriceEl.textContent = "0 ₸";
        return;
    }

    // Делаем расчёт через БД
    const details = window.db.calculateStayDetails(
        currentSelectedCategory,
        checkInVal,
        checkOutVal,
        adults,
        kidsUnder4,
        kids5to11
    );

    // Отрисовываем результаты
    nightsCountEl.textContent = `Период: ${details.nights} ${getNightsWord(details.nights)}`;

    breakdownEl.innerHTML = "";
    details.breakdown.forEach(day => {
        const row = document.createElement("div");
        row.className = "breakdown-day-row";
        row.innerHTML = `
            <span>📅 ${day.date} (${day.season} сезон)</span>
            <span>
                ${adults} взр. (${day.adultsCost.toLocaleString()} ₸) 
                ${kids5to11 > 0 ? `+ ${kids5to11} дет. (${day.kids5to11Cost.toLocaleString()} ₸)` : ''} 
                = <strong>${day.dayTotal.toLocaleString()} ₸</strong>
            </span>
        `;
        breakdownEl.appendChild(row);
    });

    totalPriceEl.textContent = `${details.total.toLocaleString()} ₸`;
}

// Отправка заполненной анкеты бронирования гостем
function submitBookingForm(event) {
    event.preventDefault();

    const guestName = document.getElementById("guest-name").value.trim();
    const guestPhone = document.getElementById("guest-phone").value.trim();
    const guestWishes = document.getElementById("guest-wishes").value.trim();
    const rulesAgree = document.getElementById("rules-agree").checked;

    const checkInVal = document.getElementById("calc-checkin").value;
    const checkOutVal = document.getElementById("calc-checkout").value;
    const adults = parseInt(document.getElementById("calc-adults").value);
    const kids5to11 = parseInt(document.getElementById("calc-kids-5-11").value);
    const kidsUnder4 = parseInt(document.getElementById("calc-kids-under-4").value);

    // Дополнительная валидация
    if (!guestName || !guestPhone) {
        showToast("Пожалуйста, заполните ФИО и номер телефона!", "danger");
        return;
    }

    if (!rulesAgree) {
        showToast("Необходимо согласиться с правилами пансионата!", "danger");
        return;
    }

    const checkIn = new Date(checkInVal);
    const checkOut = new Date(checkOutVal);
    if (checkOut <= checkIn) {
        showToast("Дата выезда должна быть позже даты заезда!", "danger");
        return;
    }

    // Рассчитываем итоговые детали проживания
    const details = window.db.calculateStayDetails(
        currentSelectedCategory,
        checkInVal,
        checkOutVal,
        adults,
        kidsUnder4,
        kids5to11
    );

    // Находим свободный номер этой категории в БД для автоматической привязки
    const rooms = window.db.getRooms();
    const freeRoom = rooms.find(r => r.category === currentSelectedCategory && r.status === "Свободен");
    
    let assignedRoomNumber = "Ожидает назначения";
    if (freeRoom) {
        assignedRoomNumber = freeRoom.number;
        // Резервируем комнату в системе (статус "Занят" окончательно подтвердится админом, 
        // но мы превентивно переводим в статус ожидания или оставляем Свободным до клика админа.
        // Для реалистичности пусть комната остается Свободна, а при подтверждении админом перейдет в Занята)
    } else {
        showToast("К сожалению, свободных номеров этой категории больше нет!", "danger");
        return;
    }

    // Собираем объект анкеты
    const booking = {
        guestName,
        guestPhone,
        roomCategory: currentSelectedCategory,
        roomNumber: assignedRoomNumber,
        checkIn: checkInVal,
        checkOut: checkOutVal,
        nights: details.nights,
        adults,
        kidsUnder4,
        kids5to11,
        totalPrice: details.total,
        wishes: guestWishes
    };

    // Записываем в localStorage через db.js
    window.db.addBooking(booking);

    // Выводим сообщение об успехе
    showToast("🎉 Ваша анкета успешно отправлена! Ожидайте звонка менеджера.", "success");
    
    // Сохраняем телефон в localStorage для удобства поиска личных броней
    localStorage.setItem("last_guest_phone", guestPhone);
    
    // Закрываем модалку
    closeBookingModal();

    // Обновляем список номеров (кол-во свободных)
    renderRooms();

    // Если гость находится на вкладке "Мои Бронирования", обновляем список
    const myBookingsSection = document.getElementById("my-bookings-section");
    if (myBookingsSection.style.display !== "none") {
        document.getElementById("my-bookings-phone").value = guestPhone;
        searchGuestBookings();
    }
}

// Открытие раздела "Мои Бронирования"
function openMyBookings() {
    const visitorSection = document.getElementById("visitor-section");
    const myBookingsSection = document.getElementById("my-bookings-section");
    
    // Показываем секцию
    myBookingsSection.style.display = "block";
    
    // Автоподстановка телефона, если гость уже бронировал
    const savedPhone = localStorage.getItem("last_guest_phone");
    if (savedPhone) {
        document.getElementById("my-bookings-phone").value = savedPhone;
        searchGuestBookings();
    }

    // Скролл к секции
    setTimeout(() => {
        myBookingsSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

// Поиск бронирований гостя по номеру телефона
function searchGuestBookings() {
    const phoneInput = document.getElementById("my-bookings-phone").value.trim();
    const listContainer = document.getElementById("guest-bookings-list");

    if (!phoneInput) {
        showToast("Введите номер телефона!", "warning");
        return;
    }

    const allBookings = window.db.getBookings();
    // Фильтруем по совпадению номера телефона (игнорируя пробелы/скобки)
    const cleanInput = phoneInput.replace(/\D/g, "");
    
    const guestBookings = allBookings.filter(b => {
        const cleanBookingPhone = b.guestPhone.replace(/\D/g, "");
        return cleanBookingPhone.includes(cleanInput) || cleanInput.includes(cleanBookingPhone);
    });

    listContainer.innerHTML = "";

    if (guestBookings.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state text-center">
                <p class="muted-text">Анкеты с номером телефона <strong>${phoneInput}</strong> не найдены.</p>
                <p class="text-sm muted-text mt-2">Попробуйте ввести номер в другом формате или оформите новое бронирование.</p>
            </div>
        `;
        return;
    }

    guestBookings.forEach(b => {
        let statusBadgeClass = "badge-new";
        let statusEmoji = "🛎️";
        if (b.status === "Подтверждена") {
            statusBadgeClass = "badge-approved";
            statusEmoji = "✅";
        } else if (b.status === "Отменена") {
            statusBadgeClass = "badge-cancelled";
            statusEmoji = "❌";
        }

        const dateCreated = new Date(b.createdAt).toLocaleDateString("ru-RU", {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });

        const card = document.createElement("div");
        card.className = "glass-panel flex-row justify-between align-center mb-3 animate-zoom";
        card.style.borderLeft = `5px solid ${b.status === 'Подтверждена' ? 'var(--color-success)' : b.status === 'Отменена' ? 'var(--color-danger)' : 'var(--color-pending)'}`;
        
        card.innerHTML = `
            <div class="booking-card-info">
                <div class="flex-row align-center gap-2 mb-2">
                    <span class="status-badge ${statusBadgeClass}">${statusEmoji} ${b.status}</span>
                    <span class="text-sm muted-text">Создана: ${dateCreated}</span>
                </div>
                <h4 style="font-size:18px; font-weight:700;">Категория: ${b.roomCategory}</h4>
                <p class="text-sm muted-text mt-1">
                    📅 Заезд: <strong>${formatDateRu(b.checkIn)}</strong> | Выезд: <strong>${formatDateRu(b.checkOut)}</strong> (${b.nights} суток)
                </p>
                <p class="text-sm muted-text">
                    👥 Состав: ${b.adults} взрослых ${b.kids5to11 > 0 ? `, ${b.kids5to11} детей (5-11 лет)` : ''} ${b.kidsUnder4 > 0 ? `, ${b.kidsUnder4} детей (до 4 лет)` : ''}
                </p>
                <p class="text-sm muted-text">
                    🔑 Номер в гостинице: <strong class="text-primary">${b.roomNumber}</strong>
                </p>
            </div>
            <div class="booking-card-price text-right">
                <span class="text-sm muted-text">Итоговая стоимость:</span>
                <div class="text-primary font-bold" style="font-size:22px;">${b.totalPrice.toLocaleString()} ₸</div>
                <span style="font-size:10px; color:var(--text-muted-light);">Включая 3-разовое питание</span>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

// Склонение слова "ночь"
function getNightsWord(number) {
    const cases = [2, 0, 1, 1, 1, 2];
    const words = ["ночь", "ночи", "ночей"];
    return words[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}

// Форматирование даты в русский формат
function formatDateRu(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: 'numeric', month: 'long', year: 'numeric' });
}

// Всплывающее Тост-уведомление
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let emoji = "ℹ️";
    if (type === "success") emoji = "✅";
    else if (type === "danger") emoji = "⚠️";
    else if (type === "warning") emoji = "🛎️";

    toast.innerHTML = `
        <span>${emoji}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Удаляем тост через 4 секунды
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(50px)";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// Делаем функции глобальными для HTML
window.showSection = showSection;
window.toggleRole = toggleRole;
window.filterRooms = filterRooms;
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.recalculatePrice = recalculatePrice;
window.submitBookingForm = submitBookingForm;
window.openMyBookings = openMyBookings;
window.searchGuestBookings = searchGuestBookings;
window.showToast = showToast;
