// admin.js - Логика панели администратора

// Инициализируем при загрузке скрипта
document.addEventListener("DOMContentLoaded", () => {
    // Если уже залогинены, обновляем дашборд
    if (localStorage.getItem("admin_logged_in") === "true") {
        initAdminDashboard();
    }
});

// Обработка Входа Администратора
function handleAdminLogin(event) {
    event.preventDefault();
    
    const passwordInput = document.getElementById("admin-password");
    const errorMsg = document.getElementById("login-error-msg");
    
    if (passwordInput.value.trim() === "admin") {
        // Успешный логин
        localStorage.setItem("admin_logged_in", "true");
        errorMsg.style.display = "none";
        passwordInput.value = "";
        
        // Переключаем экраны логина и дашборда
        document.getElementById("admin-login-gate").style.display = "none";
        document.getElementById("admin-dashboard").style.display = "grid";
        
        // Инициализируем дашборд
        initAdminDashboard();
        showToast("🔓 Успешный вход в панель администратора", "success");
    } else {
        // Ошибка логина
        errorMsg.style.display = "block";
        passwordInput.value = "";
        showToast("⚠️ Неверный пароль администратора!", "danger");
    }
}

// Обработка Выхода Администратора
function handleAdminLogout() {
    localStorage.removeItem("admin_logged_in");
    
    // Переключаем экраны обратно
    document.getElementById("admin-login-gate").style.display = "flex";
    document.getElementById("admin-dashboard").style.display = "none";
    
    // Возвращаем роль посетителя
    showSection("visitor");
    showToast("🔒 Вы вышли из панели управления", "info");
}

// Переключение вкладок в админке
function switchAdminTab(tabName) {
    // Скрываем все вкладки
    const tabs = document.querySelectorAll(".admin-tab-content");
    tabs.forEach(tab => tab.style.display = "none");
    
    // Показываем нужную вкладку
    document.getElementById(`admin-tab-${tabName}`).style.display = "block";
    
    // Подсвечиваем активный пункт бокового меню
    const menuLinks = document.querySelectorAll(".admin-menu-link");
    menuLinks.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("onclick").includes(tabName)) {
            link.classList.add("active");
        }
    });

    // Перерисовываем нужные списки при переходе
    if (tabName === "overview") {
        refreshDashboardStats();
    } else if (tabName === "bookings") {
        renderBookings();
    } else if (tabName === "rooms") {
        renderRoomsAdmin();
    }
}

// Инициализация Дашборда
function initAdminDashboard() {
    refreshDashboardStats();
    renderBookings();
    renderRoomsAdmin();
}

// Обновление всей аналитической статистики Дашборда
function refreshDashboardStats() {
    const rooms = window.db.getRooms();
    const bookings = window.db.getBookings();

    // 1. Подсчет анкет
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === "Новая").length;
    
    document.getElementById("stat-total-bookings").textContent = totalBookings;
    document.getElementById("stat-pending-bookings").textContent = pendingBookings;
    
    // Обновляем оранжевый значок в боковом меню анкет
    const badge = document.getElementById("bookings-counter-badge");
    if (badge) {
        badge.textContent = pendingBookings;
        badge.style.display = pendingBookings > 0 ? "inline-block" : "none";
    }

    // 2. Подсчет свободных номеров
    const freeRooms = rooms.filter(r => r.status === "Свободен").length;
    const totalRooms = rooms.length;
    
    document.getElementById("stat-free-rooms").textContent = freeRooms;
    document.getElementById("stat-total-rooms-desc").textContent = `из ${totalRooms} номеров в фонде`;

    // 3. Выручка от подтвержденных броней
    const confirmedBookings = bookings.filter(b => b.status === "Подтверждена");
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    
    document.getElementById("stat-revenue").textContent = `${totalRevenue.toLocaleString()} ₸`;

    // 4. Процент загрузки фонда (Занят / Всего)
    const occupiedRooms = rooms.filter(r => r.status === "Занят").length;
    const occupancyPercent = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    
    const percentBar = document.getElementById("occupancy-percent-bar");
    if (percentBar) {
        percentBar.style.width = `${occupancyPercent}%`;
        // Красим в оранжевый при высокой нагрузке
        if (occupancyPercent > 80) {
            percentBar.className = "progress-fill green";
            percentBar.style.backgroundColor = "var(--color-danger)";
        } else {
            percentBar.style.backgroundColor = "var(--color-success)";
        }
    }
    
    document.getElementById("occupancy-text").textContent = `Занято номеров: ${occupancyPercent}%`;
    document.getElementById("occupancy-count").textContent = `${occupiedRooms} из ${totalRooms} номеров`;

    // 5. Отрисовываем номера на обслуживании
    const cleaningRooms = rooms.filter(r => r.status === "На обслуживании");
    const cleaningContainer = document.getElementById("cleaning-rooms-container");
    
    if (cleaningContainer) {
        cleaningContainer.innerHTML = "";
        if (cleaningRooms.length === 0) {
            cleaningContainer.innerHTML = `<p class="muted-text text-sm">В данный момент нет номеров на обслуживании/уборке.</p>`;
        } else {
            cleaningRooms.forEach(r => {
                const tag = document.createElement("span");
                tag.className = "cleaning-tag";
                tag.innerHTML = `🧹 Номер ${r.number} (${r.category.split(' ')[0]})`;
                cleaningContainer.appendChild(tag);
            });
        }
    }
}

// Отрисовка таблицы анкет бронирования с фильтрацией
function renderBookings() {
    const tableBody = document.getElementById("bookings-table-body");
    const emptyState = document.getElementById("bookings-empty-state");
    
    if (!tableBody) return;

    const allBookings = window.db.getBookings();
    
    // Получаем фильтры
    const searchQuery = document.getElementById("admin-bookings-search").value.toLowerCase();
    const statusFilter = document.getElementById("admin-bookings-filter-status").value;

    // Фильтруем данные
    const filteredBookings = allBookings.filter(b => {
        const matchesSearch = b.guestName.toLowerCase().includes(searchQuery) || b.guestPhone.includes(searchQuery);
        const matchesStatus = statusFilter === "all" || b.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    tableBody.innerHTML = "";

    if (filteredBookings.length === 0) {
        emptyState.style.display = "block";
        return;
    }
    emptyState.style.display = "none";

    filteredBookings.forEach(b => {
        let statusBadgeClass = "badge-new";
        if (b.status === "Подтверждена") statusBadgeClass = "badge-approved";
        else if (b.status === "Отменена") statusBadgeClass = "badge-cancelled";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div class="font-bold">${b.guestName}</div>
                <div class="text-sm muted-text">${b.guestPhone}</div>
            </td>
            <td>
                <div>${b.roomCategory}</div>
                <div class="text-sm text-primary font-bold">Комната: ${b.roomNumber}</div>
            </td>
            <td>
                <div>${formatDateRuShort(b.checkIn)} - ${formatDateRuShort(b.checkOut)}</div>
                <div class="text-sm muted-text">Суток: ${b.nights}</div>
            </td>
            <td>
                <div class="text-sm">
                    👨 ${b.adults} взр. 
                    ${b.kids5to11 > 0 ? `<br>👦 ${b.kids5to11} дет. (5-11)` : ''}
                    ${b.kidsUnder4 > 0 ? `<br>👶 ${b.kidsUnder4} дет. (<4)` : ''}
                </div>
            </td>
            <td class="font-bold text-primary" style="font-size:15px;">
                ${b.totalPrice.toLocaleString()} ₸
            </td>
            <td>
                <span class="status-badge ${statusBadgeClass}">${b.status}</span>
            </td>
            <td class="actions-cell">
                ${b.status === "Новая" ? `
                    <button class="btn btn-sm btn-primary" onclick="changeBookingStatus('${b.id}', 'Подтверждена')" title="Подтвердить бронь">✅ Да</button>
                    <button class="btn btn-sm btn-outline text-red" onclick="changeBookingStatus('${b.id}', 'Отменена')" title="Отклонить">❌ Нет</button>
                ` : b.status === "Новая" ? '' : b.status === "Подтверждена" ? `
                    <button class="btn btn-sm btn-outline text-red" onclick="changeBookingStatus('${b.id}', 'Отменена')" title="Отменить бронь">Отменить</button>
                ` : `
                    <button class="btn btn-sm btn-primary" onclick="changeBookingStatus('${b.id}', 'Подтверждена')" title="Восстановить">Восстановить</button>
                `}
                <button class="btn btn-sm btn-secondary" onclick="deleteBooking('${b.id}')" title="Удалить анкету" style="padding: 8px 10px; color: var(--color-danger);">
                    🗑️
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Применение фильтров поиска по анкетам
function applyBookingsFilter() {
    renderBookings();
}

// Изменение статуса анкеты (Подтверждена / Отменена)
function changeBookingStatus(bookingId, newStatus) {
    const success = window.db.updateBookingStatus(bookingId, newStatus);
    if (success) {
        showToast(`Статус анкеты обновлен: "${newStatus}"`, "success");
        initAdminDashboard();
        
        // Перерисовываем список номеров посетителя (т.к. занятость комнат могла измениться)
        if (window.renderRooms) {
            window.renderRooms();
        }
    } else {
        showToast("Не удалось обновить статус!", "danger");
    }
}

// Удаление анкеты из базы данных
function deleteBooking(bookingId) {
    if (confirm("Вы действительно хотите окончательно удалить эту анкету гостя из базы данных? Это действие необратимо.")) {
        window.db.deleteBooking(bookingId);
        showToast("Анкета гостя удалена из базы", "info");
        initAdminDashboard();
    }
}

// Очистить все анкеты и сбросить к дефолту
function resetBookingsToDefault() {
    if (confirm("Внимание! Это сбросит базу данных анкет и номеров к демонстрационному дефолтному состоянию. Вы уверены?")) {
        localStorage.removeItem("alakol_bookings");
        localStorage.removeItem("alakol_rooms");
        window.db.init(); // Переинициализация
        initAdminDashboard();
        if (window.renderRooms) {
            window.renderRooms();
        }
        showToast("База данных успешно сброшена!", "success");
    }
}

// Отрисовка вносимого фонда номеров для администратора
function renderRoomsAdmin() {
    const grid = document.getElementById("admin-rooms-grid");
    if (!grid) return;

    const rooms = window.db.getRooms();
    grid.innerHTML = "";

    rooms.forEach(room => {
        // Описание цвета статуса
        let statusColor = "var(--color-success)";
        if (room.status === "Занят") statusColor = "var(--color-danger)";
        else if (room.status === "На обслуживании") statusColor = "var(--color-info)";

        const card = document.createElement("div");
        card.className = "admin-room-card animate-zoom";
        card.innerHTML = `
            <div class="flex-row justify-between align-center">
                <span class="admin-room-number">№ ${room.number}</span>
                <span class="status-badge" style="background-color: ${statusColor}1A; color: ${statusColor};">${room.status}</span>
            </div>
            <div class="admin-room-category">${room.category}</div>
            
            <div class="input-row-half" style="margin-top: 10px;">
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:10px; color:var(--text-muted-dark);">Низкий сезон:</label>
                    <input type="number" class="form-input text-sm" value="${room.priceLow}" onchange="updateRoomPricesInline('${room.id}', this.value, null)" style="padding: 6px 8px;">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label style="font-size:10px; color:var(--text-muted-dark);">Высокий сезон:</label>
                    <input type="number" class="form-input text-sm" value="${room.priceHigh}" onchange="updateRoomPricesInline('${room.id}', null, this.value)" style="padding: 6px 8px;">
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
                <label style="font-size:11px; color:var(--text-muted-dark);">Изменить статус комнаты:</label>
                <select class="form-input text-sm" onchange="changeRoomStatus('${room.id}', this.value)" style="padding: 8px 12px; margin-top:4px;">
                    <option value="Свободен" ${room.status === 'Свободен' ? 'selected' : ''}>🔑 Свободен</option>
                    <option value="Занят" ${room.status === 'Занят' ? 'selected' : ''}>🔒 Занят</option>
                    <option value="На обслуживании" ${room.status === 'На обслуживании' ? 'selected' : ''}>🧹 На обслуживании</option>
                </select>
            </div>

            <button class="btn btn-outline text-red btn-sm mt-3" onclick="deleteRoom('${room.id}')" style="border-color: rgba(231,76,60,0.2); width:100%;">
                🗑️ Удалить комнату
            </button>
        `;
        grid.appendChild(card);
    });
}

// Быстрое изменение цены номера прямо из инпута таблицы админа
function updateRoomPricesInline(roomId, lowPrice, highPrice) {
    const rooms = window.db.getRooms();
    const room = rooms.find(r => r.id === roomId);
    
    if (room) {
        if (lowPrice !== null) room.priceLow = parseInt(lowPrice) || room.priceLow;
        if (highPrice !== null) room.priceHigh = parseInt(highPrice) || room.priceHigh;
        
        // Для кастомных номеров этой же категории обновляем цены для консистентности
        rooms.forEach(r => {
            if (r.category === room.category) {
                if (lowPrice !== null) r.priceLow = parseInt(lowPrice) || r.priceLow;
                if (highPrice !== null) r.priceHigh = parseInt(highPrice) || r.priceHigh;
            }
        });

        window.db.saveRooms(rooms);
        showToast("Цены комнат данной категории сохранены!", "success");
        initAdminDashboard();
        
        if (window.renderRooms) {
            window.renderRooms();
        }
    }
}

// Изменение статуса комнаты
function changeRoomStatus(roomId, newStatus) {
    window.db.updateRoomStatus(roomId, newStatus);
    showToast("Статус комнаты успешно изменен", "success");
    initAdminDashboard();
    
    if (window.renderRooms) {
        window.renderRooms();
    }
}

// Удаление комнаты из фонда
function deleteRoom(roomId) {
    if (confirm("Вы уверены, что хотите удалить эту конкретную комнату из номерного фонда зоны отдыха?")) {
        window.db.deleteRoom(roomId);
        showToast("Комната удалена из номерного фонда", "info");
        initAdminDashboard();
        
        if (window.renderRooms) {
            window.renderRooms();
        }
    }
}

// Открытие модального окна добавления номера
function openAddRoomModal() {
    document.getElementById("add-room-modal").style.display = "flex";
    document.getElementById("add-room-form").reset();
    adjustAddRoomDefaultPrices();
}

// Закрытие модального окна добавления номера
function closeAddRoomModal() {
    document.getElementById("add-room-modal").style.display = "none";
}

// Автоподбор дефолтных цен при выборе категории в форме добавления номера
function adjustAddRoomDefaultPrices() {
    const category = document.getElementById("add-room-category").value;
    const priceLowEl = document.getElementById("add-room-price-low");
    const priceHighEl = document.getElementById("add-room-price-high");
    
    if (category.includes("2-х")) {
        priceLowEl.value = 40000;
        priceHighEl.value = 60000;
    } else if (category.includes("3-х")) {
        priceLowEl.value = 51000;
        priceHighEl.value = 72000;
    } else if (category.includes("4-х")) {
        priceLowEl.value = 64000;
        priceHighEl.value = 92000;
    }
}

// Добавление новой комнаты
function submitAddRoomForm(event) {
    event.preventDefault();

    const roomNumber = document.getElementById("add-room-number").value.trim();
    const category = document.getElementById("add-room-category").value;
    const priceLow = parseInt(document.getElementById("add-room-price-low").value);
    const priceHigh = parseInt(document.getElementById("add-room-price-high").value);
    const description = document.getElementById("add-room-description").value.trim();
    const status = document.getElementById("add-room-status").value;

    // Собираем отмеченные удобства
    const featuresCheckboxes = document.querySelectorAll("input[name='add-room-feature']:checked");
    const features = Array.from(featuresCheckboxes).map(cb => cb.value);

    // Защита от дублей по номеру комнаты
    const rooms = window.db.getRooms();
    if (rooms.some(r => r.number === roomNumber)) {
        showToast(`Комната с номером № ${roomNumber} уже существует в фонде!`, "danger");
        return;
    }

    // Определяем вместимость
    let capacity = 2;
    let mockImage = "images/room_2_bed.jpg";

    if (category.includes("3-х")) {
        capacity = 3;
        mockImage = "images/room_3_bed.jpg";
    } else if (category.includes("4-х")) {
        capacity = 4;
        mockImage = "images/room_4_bed.jpg";
    }

    // Собираем объект
    const newRoom = {
        number: roomNumber,
        category,
        capacity,
        priceLow,
        priceHigh,
        status,
        description,
        features,
        image: mockImage
    };

    // Сохраняем
    window.db.addRoom(newRoom);

    // Обновляем UI
    showToast(`🎉 Номер ${roomNumber} (${category}) успешно добавлен в фонд!`, "success");
    closeAddRoomModal();
    initAdminDashboard();
    
    if (window.renderRooms) {
        window.renderRooms();
    }
}

// Форматирование дат для таблицы (например, "21 июн")
function formatDateRuShort(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: 'numeric', month: 'short' });
}

// Экспортируем функции в глобальную область видимости
window.handleAdminLogin = handleAdminLogin;
window.handleAdminLogout = handleAdminLogout;
window.switchAdminTab = switchAdminTab;
window.changeBookingStatus = changeBookingStatus;
window.deleteBooking = deleteBooking;
window.resetBookingsToDefault = resetBookingsToDefault;
window.changeRoomStatus = changeRoomStatus;
window.updateRoomPricesInline = updateRoomPricesInline;
window.deleteRoom = deleteRoom;
window.openAddRoomModal = openAddRoomModal;
window.closeAddRoomModal = closeAddRoomModal;
window.adjustAddRoomDefaultPrices = adjustAddRoomDefaultPrices;
window.submitAddRoomForm = submitAddRoomForm;
