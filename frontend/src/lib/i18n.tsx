import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "uz" | "ru";

type Entry = { uz: string; ru: string };

/**
 * Translation keys are the English source strings. This keeps the dictionary
 * easy to extend and lets any untranslated string gracefully fall back to
 * English instead of showing a raw key.
 */
const translations: Record<string, Entry> = {
  // ── Navigation / global ────────────────────────────────────────────────
  Home: { uz: "Bosh sahifa", ru: "Главная" },
  Catalog: { uz: "Katalog", ru: "Каталог" },
  Categories: { uz: "Toifalar", ru: "Категории" },
  "About Us": { uz: "Biz haqimizda", ru: "О нас" },
  Contact: { uz: "Aloqa", ru: "Контакты" },
  "Sign In": { uz: "Kirish", ru: "Войти" },
  "Sign Out": { uz: "Chiqish", ru: "Выйти" },
  "Create Account": { uz: "Hisob yaratish", ru: "Создать аккаунт" },
  "My Account": { uz: "Mening hisobim", ru: "Мой аккаунт" },
  "Admin Panel": { uz: "Admin panel", ru: "Админ-панель" },
  "Go to Admin Panel": { uz: "Admin panelga o‘tish", ru: "Перейти в админ-панель" },
  "Admin accounts use the admin panel": {
    uz: "Admin hisoblari admin panel orqali ishlaydi",
    ru: "Админ-аккаунты работают через админ-панель",
  },
  Loading: { uz: "Yuklanmoqda", ru: "Загрузка" },
  "Loading…": { uz: "Yuklanmoqda…", ru: "Загрузка…" },
  Search: { uz: "Qidirish", ru: "Поиск" },
  Wishlist: { uz: "Sevimlilar", ru: "Избранное" },
  Account: { uz: "Hisob", ru: "Аккаунт" },
  "Open menu": { uz: "Menyuni ochish", ru: "Открыть меню" },
  "Close menu": { uz: "Menyuni yopish", ru: "Закрыть меню" },
  "Close search": { uz: "Qidiruvni yopish", ru: "Закрыть поиск" },
  "Open cart": { uz: "Savatni ochish", ru: "Открыть корзину" },
  "Close cart": { uz: "Savatni yopish", ru: "Закрыть корзину" },
  "Close wishlist": { uz: "Sevimlilarni yopish", ru: "Закрыть избранное" },
  "Search chairs, tables, beds…": {
    uz: "Kreslo, stol, karavot qidirish…",
    ru: "Искать кресла, столы, кровати…",
  },
  "Language": { uz: "Til", ru: "Язык" },
  "Uzbek": { uz: "O‘zbekcha", ru: "Узбекский" },
  "Russian": { uz: "Ruscha", ru: "Русский" },

  // ── Footer ─────────────────────────────────────────────────────────────
  "Hand-crafted furniture for modern sanctuaries. Made slowly, in small batches, from responsibly sourced hardwood.":
    {
      uz: "Zamonaviy uylar uchun qo‘lda ishlangan mebel. Mas’uliyatli manbalardan olingan qattiq yog‘ochdan kichik partiyalarda, shoshilmasdan tayyorlanadi.",
      ru: "Мебель ручной работы для современных интерьеров. Создаётся небольшими партиями из ответственно заготовленной древесины.",
    },
  Shop: { uz: "Do‘kon", ru: "Магазин" },
  "All furniture": { uz: "Barcha mebel", ru: "Вся мебель" },
  "New arrivals": { uz: "Yangi kolleksiya", ru: "Новинки" },
  Company: { uz: "Kompaniya", ru: "Компания" },
  "About us": { uz: "Biz haqimizda", ru: "О нас" },
  "Delivery & returns": { uz: "Yetkazib berish va qaytarish", ru: "Доставка и возврат" },
  Newsletter: { uz: "Yangiliklar", ru: "Рассылка" },
  "Notes on craft, new pieces, and studio openings. Once a month.":
    {
      uz: "Hunarmandchilik, yangi kolleksiyalar va studiya yangiliklari. Oyiga bir marta.",
      ru: "О ремесле, новинках и событиях студии. Раз в месяц.",
    },
  "Your email": { uz: "Email manzilingiz", ru: "Ваш email" },
  "Thank you — you're on the list.": {
    uz: "Rahmat — ro‘yxatga qo‘shildingiz.",
    ru: "Спасибо — вы в списке.",
  },
  "Payment methods": { uz: "To‘lov usullari", ru: "Способы оплаты" },
  "We accept": { uz: "Biz qabul qilamiz", ru: "Мы принимаем" },
  "© {year} Lumina Home. Tashkent, Uzbekistan.": {
    uz: "© {year} Lumina Home. Toshkent, O‘zbekiston.",
    ru: "© {year} Lumina Home. Ташкент, Узбекистан.",
  },

  // ── Cart / wishlist / auth dialog ──────────────────────────────────────
  "Your cart": { uz: "Savat", ru: "Корзина" },
  "Your cart is quietly empty.": {
    uz: "Savatingiz hozircha bo‘sh.",
    ru: "Ваша корзина пока пуста.",
  },
  "Browse the collection": { uz: "Kolleksiyani ko‘rish", ru: "Смотреть коллекцию" },
  "Remove {name}": { uz: "{name}ni olib tashlash", ru: "Удалить {name}" },
  "+ Home assembly ({price})": {
    uz: "+ Uyda yig‘ish ({price})",
    ru: "+ Сборка на дому ({price})",
  },
  Subtotal: { uz: "Jami mahsulotlar", ru: "Промежуточный итог" },
  "Proceed to checkout": { uz: "To‘lovga o‘tish", ru: "Перейти к оформлению" },
  "Delivery and assembly calculated at checkout.": {
    uz: "Yetkazib berish va yig‘ish to‘lovda hisoblanadi.",
    ru: "Доставка и сборка рассчитываются при оформлении.",
  },
  "Decrease quantity": { uz: "Miqdorni kamaytirish", ru: "Уменьшить количество" },
  "Increase quantity": { uz: "Miqdorni oshirish", ru: "Увеличить количество" },
  "Your wishlist is empty.": {
    uz: "Sevimlilar ro‘yxati bo‘sh.",
    ru: "В избранном пока пусто.",
  },
  "Registration required": { uz: "Ro‘yxatdan o‘tish kerak", ru: "Требуется регистрация" },
  "You are not signed in yet. Please create an account to continue shopping.":
    {
      uz: "Siz hali tizimga kirmagansiz. Xaridni davom ettirish uchun avval ro‘yxatdan o‘ting.",
      ru: "Вы ещё не вошли. Чтобы продолжить покупки, создайте аккаунт.",
    },
  "Create an account": { uz: "Ro‘yxatdan o‘tish", ru: "Создать аккаунт" },

  // ── Home ───────────────────────────────────────────────────────────────
  "Crafted Comfort for Your Modern Sanctuary": {
    uz: "Zamonaviy uyingiz uchun qulaylik",
    ru: "Комфорт для вашего современного дома",
  },
  "Cozy, hand-finished furniture shaped from solid walnut and oak. Each piece is oiled by hand, built to soften with time, and delivered ready to live in.":
    {
      uz: "Qattiq yong‘oq va eman daraxtidan qo‘lda ishlangan, issiq va qulay mebel. Har bir buyum qo‘lda moylanadi, vaqt o‘tishi bilan yanada chiroyli bo‘ladi va uyingizga tayyor holda yetkaziladi.",
      ru: "Уютная мебель ручной работы из массива ореха и дуба. Каждое изделие вручную покрывается маслом, со временем становится только красивее и доставляется готовым к использованию.",
    },
  "Explore Collection": { uz: "Kolleksiyani ko‘rish", ru: "Смотреть коллекцию" },
  "Contact Us": { uz: "Biz bilan bog‘lanish", ru: "Связаться с нами" },
  Featured: { uz: "Tanlangan", ru: "Избранное" },
  "Nordic Walnut Chair": { uz: "Nordic yong‘oq kreslosi", ru: "Кресло Nordic из ореха" },
  "View piece": { uz: "Buyumni ko‘rish", ru: "Смотреть товар" },
  Scroll: { uz: "Pastga", ru: "Вниз" },
  "Browse by room": { uz: "Xona bo‘yicha tanlang", ru: "Выбрать по комнате" },
  "Rooms that breathe, pieces that stay": {
    uz: "Nafas oladigan xonalar, uzoq yashaydigan buyumlar",
    ru: "Комнаты, в которых легко дышится, и вещи, которые остаются",
  },
  "All categories": { uz: "Barcha toifalar", ru: "Все категории" },
  "Shop {category}": { uz: "{category} uchun xarid", ru: "Купить для: {category}" },
  "{category} furniture": { uz: "{category} mebeli", ru: "Мебель для: {category}" },
  "Best sellers": { uz: "Eng ko‘p sotilganlar", ru: "Хиты продаж" },
  "Loved in many homes": { uz: "Ko‘plab uylarda sevilgan", ru: "Любимые во многих домах" },
  "Shop all": { uz: "Barchasini ko‘rish", ru: "Смотреть всё" },
  "Scroll left": { uz: "Chapga surish", ru: "Прокрутить влево" },
  "Scroll right": { uz: "O‘ngga surish", ru: "Прокрутить вправо" },
  "Why Lumina Home": { uz: "Nega Lumina Home?", ru: "Почему Lumina Home?" },
  "Crafted with care, delivered with heart": {
    uz: "Mehr bilan yaratilgan, mehr bilan yetkaziladi",
    ru: "Создано с заботой, доставлено с любовью",
  },
  "Every piece we make is built to last — from materials that matter, by hands that care, for homes that deserve the best.":
    {
      uz: "Biz yaratgan har bir buyum uzoq yashaydi — muhim materiallardan, mehrli qo‘llar bilan, eng yaxshisiga loyiq uylar uchun.",
      ru: "Каждое изделие создаётся надолго — из достойных материалов, заботливыми руками, для домов, которые заслуживают лучшего.",
    },
  "Free Delivery": { uz: "Bepul yetkazib berish", ru: "Бесплатная доставка" },
  "On every order across Uzbekistan.": {
    uz: "O‘zbekiston bo‘ylab har bir buyurtmaga.",
    ru: "На каждый заказ по Узбекистану.",
  },
  "2-Year Warranty": { uz: "2 yillik kafolat", ru: "Гарантия 2 года" },
  "Joinery and finish fully covered.": {
    uz: "Birlashmalar va qoplama to‘liq kafolatlangan.",
    ru: "Соединения и отделка полностью покрыты гарантией.",
  },
  "Sustainable Wood": { uz: "Barqaror yog‘och", ru: "Ответственная древесина" },
  "FSC-certified walnut and oak.": {
    uz: "FSC sertifikatiga ega yong‘oq va eman.",
    ru: "Орех и дуб с сертификатом FSC.",
  },
  "Custom Dimensions": { uz: "Individual o‘lchamlar", ru: "Индивидуальные размеры" },
  "Made to your room, assembled at home.": {
    uz: "Xonangizga moslab tayyorlanadi, uyda yig‘iladi.",
    ru: "Изготавливается под вашу комнату, собирается на дому.",
  },

  // ── Categories / catalog ───────────────────────────────────────────────
  "The collection": { uz: "Kolleksiya", ru: "Коллекция" },
  "Every piece, one place": { uz: "Barcha buyumlar bir joyda", ru: "Все изделия в одном месте" },
  "{count} pieces, hand-finished in our Tashkent workshop.": {
    uz: "Toshkent ustaxonamizda qo‘lda ishlangan {count} ta buyum.",
    ru: "{count} изделий ручной работы из нашей мастерской в Ташкенте.",
  },
  Category: { uz: "Toifa", ru: "Категория" },
  Price: { uz: "Narx", ru: "Цена" },
  "Up to {price}": { uz: "{price} gacha", ru: "До {price}" },
  Material: { uz: "Material", ru: "Материал" },
  Availability: { uz: "Mavjudligi", ru: "Наличие" },
  "In stock": { uz: "Omborda bor", ru: "В наличии" },
  "Pre-order": { uz: "Oldindan buyurtma", ru: "Предзаказ" },
  "{count} results": { uz: "{count} ta natija", ru: "{count} результатов" },
  "Quick view": { uz: "Tezkor ko‘rish", ru: "Быстрый просмотр" },
  "No pieces match these filters yet.": {
    uz: "Bu filtrlash bo‘yicha buyum topilmadi.",
    ru: "По этим фильтрам пока ничего не найдено.",
  },
  "View full details": { uz: "To‘liq ma’lumot", ru: "Подробнее" },
  "Close quick view": { uz: "Tezkor ko‘rishni yopish", ru: "Закрыть быстрый просмотр" },
  "Maximum price": { uz: "Maksimal narx", ru: "Максимальная цена" },
  "Four rooms, one quiet language": {
    uz: "To‘rt xona, bitta sokin til",
    ru: "Четыре комнаты, один спокойный язык",
  },
  "{count} pieces": { uz: "{count} ta buyum", ru: "{count} изделий" },
  "Living Room": { uz: "Mehmonxona", ru: "Гостиная" },
  Bedroom: { uz: "Yotoqxona", ru: "Спальня" },
  "Dining Room": { uz: "Oshxona", ru: "Столовая" },
  "Home Office": { uz: "Uy ofisi", ru: "Домашний офис" },
  "Low seating, soft bouclé and warm walnut for slow evenings.": {
    uz: "Sekin oqshomlar uchun past o‘rindiqlar, yumshoq bukle va issiq yong‘oq.",
    ru: "Низкая посадка, мягкий букле и тёплый орех для неспешных вечеров.",
  },
  "Quiet platform beds and linen armchairs built for deep rest.": {
    uz: "Chuqur dam olish uchun sokin platformali karavotlar va zig‘ir kreslolar.",
    ru: "Тихие кровати-платформы и льняные кресла для глубокого отдыха.",
  },
  "Oval oak tables and slatted storage made for long dinners.": {
    uz: "Uzoq kechki ovqatlar uchun oval eman stollar va panjarali saqlash mebellari.",
    ru: "Овальные дубовые столы и реечные системы хранения для долгих ужинов.",
  },
  "Focused desks and saddle-leather seating for daylight hours.": {
    uz: "Kunduzgi ish uchun qulay stollar va saddle-charm o‘rindiqlar.",
    ru: "Удобные столы и кресла из седельной кожи для работы при дневном свете.",
  },

  // ── Product page ───────────────────────────────────────────────────────
  Photos: { uz: "Rasmlar", ru: "Фото" },
  "3D view": { uz: "3D ko‘rinish", ru: "3D-вид" },
  "360° view loading": { uz: "360° ko‘rinish yuklanmoqda", ru: "Загрузка 360°-вида" },
  "Dimensions & specifications": {
    uz: "O‘lchamlar va xususiyatlar",
    ru: "Размеры и характеристики",
  },
  "Width × Height × Depth: {width} × {height} × {depth} cm": {
    uz: "Kenglik × Balandlik × Chuqurlik: {width} × {height} × {depth} sm",
    ru: "Ширина × Высота × Глубина: {width} × {height} × {depth} см",
  },
  "Primary material: {material}": {
    uz: "Asosiy material: {material}",
    ru: "Основной материал: {material}",
  },
  "Frame: kiln-dried hardwood, mortise-and-tenon joinery": {
    uz: "Karkas: pechda quritilgan qattiq yog‘och, mortise-tenon birikmasi",
    ru: "Каркас: высушенная в печи древесина, соединение шип-паз",
  },
  "Finish: plant-based hardwax oil": {
    uz: "Qoplama: o‘simlik asosidagi qattiq moy",
    ru: "Отделка: масло-воск на растительной основе",
  },
  "Care instructions": { uz: "Parvarish bo‘yicha ko‘rsatma", ru: "Уход" },
  "Dust with a dry cloth. Wipe spills immediately and re-oil the wood once a year. Keep out of direct sunlight and away from radiators to protect the grain.":
    {
      uz: "Quruq mato bilan changini oling. To‘kilgan suyuqlikni darhol artib tashlang va yiliga bir marta yog‘ochni moylang. Yog‘och teksturasini himoya qilish uchun to‘g‘ridan-to‘g‘ri quyosh nuri va radiatorlardan uzoqroq saqlang.",
      ru: "Протирайте сухой тканью. Сразу убирайте пролитое и раз в год обновляйте масло. Берегите от прямых солнечных лучей и радиаторов.",
    },
  "In stock · ships in 3–5 days": {
    uz: "Omborda bor · 3–5 kunda yetkaziladi",
    ru: "В наличии · доставка за 3–5 дней",
  },
  "Pre-order · ships in 4 weeks": {
    uz: "Oldindan buyurtma · 4 haftada yetkaziladi",
    ru: "Предзаказ · доставка через 4 недели",
  },
  "Wood finish": { uz: "Yog‘och qoplamasi", ru: "Отделка дерева" },
  "Fabric / colour — {name}": { uz: "Mato / rang — {name}", ru: "Ткань / цвет — {name}" },
  "Add Home Assembly (+{price})": {
    uz: "Uyda yig‘ishni qo‘shish (+{price})",
    ru: "Добавить сборку на дому (+{price})",
  },
  "Add to cart": { uz: "Savatga qo‘shish", ru: "В корзину" },
  "Buy now": { uz: "Hozir sotib olish", ru: "Купить сейчас" },
  "Free delivery across Uzbekistan · 2-year warranty": {
    uz: "O‘zbekiston bo‘ylab bepul yetkazib berish · 2 yillik kafolat",
    ru: "Бесплатная доставка по Узбекистану · гарантия 2 года",
  },
  "Delivery information": { uz: "Yetkazib berish ma’lumoti", ru: "Информация о доставке" },
  "Free standard delivery in 3–5 working days within Tashkent, 5–9 days elsewhere in Uzbekistan. Express with in-home assembly available at checkout.":
    {
      uz: "Toshkent ichida 3–5 ish kunida bepul standart yetkazib berish, O‘zbekistonning boshqa hududlariga 5–9 kun. Tezkor yetkazib berish va uyda yig‘ish to‘lovda mavjud.",
      ru: "Бесплатная стандартная доставка по Ташкенту за 3–5 рабочих дней, по остальному Узбекистану — 5–9 дней. Экспресс-доставка со сборкой доступна при оформлении.",
    },
  Reviews: { uz: "Sharhlar", ru: "Отзывы" },
  "{rating} out of 5": { uz: "5 dan {rating}", ru: "{rating} из 5" },
  "{count} verified buyers": { uz: "{count} ta tasdiqlangan xaridor", ru: "{count} проверенных покупателей" },
  "View image {index}": { uz: "{index}-rasmni ko‘rish", ru: "Посмотреть изображение {index}" },
  "Add to wishlist": { uz: "Sevimlilarga qo‘shish", ru: "Добавить в избранное" },
  "Remove from wishlist": { uz: "Sevimlilardan olib tashlash", ru: "Удалить из избранного" },
  "{count} reviews": { uz: "{count} ta sharh", ru: "{count} отзывов" },

  // ── Checkout ───────────────────────────────────────────────────────────
  Checkout: { uz: "To‘lov", ru: "Оформление" },
  "Almost home": { uz: "Uyingizga bir qadam", ru: "Почти дома" },
  "Shipping details": { uz: "Yetkazib berish ma’lumotlari", ru: "Данные доставки" },
  "First name": { uz: "Ism", ru: "Имя" },
  "Last name": { uz: "Familiya", ru: "Фамилия" },
  Email: { uz: "Email", ru: "Email" },
  "Your account email": { uz: "Hisobingiz emaili", ru: "Email вашего аккаунта" },
  Address: { uz: "Manzil", ru: "Адрес" },
  City: { uz: "Shahar", ru: "Город" },
  "Pin your location on map": { uz: "Joylashuvingizni xaritada belgilang", ru: "Отметьте местоположение на карте" },
  "Click or drag the marker": { uz: "Xaritani bosing yoki markerni torting", ru: "Нажмите на карту или перетащите маркер" },
  "Delivery method": { uz: "Yetkazib berish usuli", ru: "Способ доставки" },
  "Standard delivery": { uz: "Standart yetkazib berish", ru: "Стандартная доставка" },
  "3–5 working days": { uz: "3–5 ish kuni", ru: "3–5 рабочих дней" },
  "Express + assembly": { uz: "Tezkor + yig‘ish", ru: "Экспресс + сборка" },
  "Next day, assembled in home": { uz: "Ertasi kuni, uyda yig‘iladi", ru: "На следующий день, со сборкой на дому" },
  Free: { uz: "Bepul", ru: "Бесплатно" },
  "Place order · {total}": { uz: "Buyurtma berish · {total}", ru: "Оформить заказ · {total}" },
  "Placing order…": { uz: "Buyurtma yaratilmoqda…", ru: "Оформляем заказ…" },
  "Order summary": { uz: "Buyurtma tafsilotlari", ru: "Детали заказа" },
  "Your cart is empty.": { uz: "Savatingiz bo‘sh.", ru: "Ваша корзина пуста." },
  Delivery: { uz: "Yetkazib berish", ru: "Доставка" },
  Total: { uz: "Jami", ru: "Итого" },
  Payment: { uz: "To‘lov", ru: "Оплата" },
  Click: { uz: "Click", ru: "Click" },
  Payme: { uz: "Payme", ru: "Payme" },
  "Cash on delivery": { uz: "Yetkazib berishda naqd pul", ru: "Наличными при доставке" },
  "Card payment": { uz: "Karta orqali to‘lov", ru: "Оплата картой" },
  "Pay online": { uz: "Onlayn to‘lash", ru: "Оплатить онлайн" },
  "Order placed": { uz: "Buyurtma qabul qilindi", ru: "Заказ оформлен" },
  "Thank you. Our workshop will call you within a few hours to confirm delivery and assembly.":
    {
      uz: "Rahmat. Ustaxonamiz yetkazib berish va yig‘ishni tasdiqlash uchun bir necha soat ichida siz bilan bog‘lanadi.",
      ru: "Спасибо. Наша мастерская свяжется с вами в течение нескольких часов, чтобы подтвердить доставку и сборку.",
    },
  "Continue shopping": { uz: "Xaridni davom ettirish", ru: "Продолжить покупки" },
  "Failed to place order": { uz: "Buyurtma yaratilmadi", ru: "Не удалось оформить заказ" },
  "Online payment is not configured yet.": {
    uz: "Onlayn to‘lov hali sozlanmagan.",
    ru: "Онлайн-оплата пока не настроена.",
  },
  "Choose another payment method or contact us.": {
    uz: "Boshqa to‘lov usulini tanlang yoki biz bilan bog‘laning.",
    ru: "Выберите другой способ оплаты или свяжитесь с нами.",
  },
  "Payment status": { uz: "To‘lov holati", ru: "Статус оплаты" },
  "Awaiting payment": { uz: "To‘lov kutilmoqda", ru: "Ожидает оплаты" },
  Paid: { uz: "To‘langan", ru: "Оплачено" },
  Unpaid: { uz: "To‘lanmagan", ru: "Не оплачено" },
  Failed: { uz: "Muvaffaqiyatsiz", ru: "Ошибка" },
  Refunded: { uz: "Qaytarilgan", ru: "Возвращено" },
  "Payment successful": { uz: "To‘lov muvaffaqiyatli", ru: "Оплата прошла успешно" },
  "Payment failed": { uz: "To‘lov amalga oshmadi", ru: "Оплата не прошла" },
  "Payment pending": { uz: "To‘lov kutilmoqda", ru: "Оплата ожидается" },
  "We are checking your payment. This page will update automatically.": {
    uz: "To‘lovingiz tekshirilmoqda. Sahifa avtomatik yangilanadi.",
    ru: "Проверяем оплату. Страница обновится автоматически.",
  },
  "Your order has been paid. We will contact you to confirm delivery.": {
    uz: "Buyurtmangiz to‘landi. Yetkazib berishni tasdiqlash uchun bog‘lanamiz.",
    ru: "Заказ оплачен. Мы свяжемся с вами для подтверждения доставки.",
  },
  "The payment was not completed. You can try again from your account.": {
    uz: "To‘lov tugallanmadi. Hisobingizdan qayta urinib ko‘rishingiz mumkin.",
    ru: "Оплата не завершена. Вы можете повторить попытку из личного кабинета.",
  },
  "Order number": { uz: "Buyurtma raqami", ru: "Номер заказа" },
  "Amount": { uz: "Summa", ru: "Сумма" },
  "Back to account": { uz: "Hisobga qaytish", ru: "Вернуться в аккаунт" },
  "Back to catalog": { uz: "Katalogga qaytish", ru: "Вернуться в каталог" },
  "Pay with Click": { uz: "Click orqali to‘lash", ru: "Оплатить через Click" },
  "Pay with Payme": { uz: "Payme orqali to‘lash", ru: "Оплатить через Payme" },
  "Continue with cash on delivery": {
    uz: "Naqd pul bilan davom etish",
    ru: "Продолжить с оплатой наличными",
  },
  "Online payment": { uz: "Onlayn to‘lov", ru: "Онлайн-оплата" },
  "Visa / bank card": { uz: "Visa / bank kartasi", ru: "Visa / банковская карта" },
  "Payments are processed securely by the selected provider.": {
    uz: "To‘lovlar tanlangan provayder tomonidan xavfsiz amalga oshiriladi.",
    ru: "Платежи безопасно обрабатываются выбранным провайдером.",
  },

  // ── Login / register ───────────────────────────────────────────────────
  "Welcome back to Lumina": { uz: "Lumina’ga xush kelibsiz", ru: "С возвращением в Lumina" },
  Password: { uz: "Parol", ru: "Пароль" },
  "Signing in...": { uz: "Kirilmoqda…", ru: "Входим…" },
  "Don't have an account?": { uz: "Hisobingiz yo‘qmi?", ru: "Нет аккаунта?" },
  "Create one": { uz: "Ro‘yxatdan o‘ting", ru: "Создайте его" },
  "Join the Lumina family": { uz: "Lumina oilasiga qo‘shiling", ru: "Присоединяйтесь к семье Lumina" },
  Name: { uz: "Ism", ru: "Имя" },
  "Creating account...": { uz: "Hisob yaratilmoqda…", ru: "Создаём аккаунт…" },
  "Already have an account?": { uz: "Hisobingiz bormi?", ru: "Уже есть аккаунт?" },
  "Sign in": { uz: "Kirish", ru: "Войти" },
  "Admin accounts cannot sign in here": {
    uz: "Admin hisoblari bu yerga kira olmaydi",
    ru: "Админ-аккаунты не могут входить здесь",
  },
  "Admin accounts cannot be created here": {
    uz: "Admin hisoblarini bu yerda yaratib bo‘lmaydi",
    ru: "Админ-аккаунты нельзя создать здесь",
  },
  "Login failed": { uz: "Kirish amalga oshmadi", ru: "Не удалось войти" },
  "Sign in with Google": { uz: "Google orqali kirish", ru: "Войти через Google" },
  "Sign up with Google": { uz: "Google orqali hisob yarating", ru: "Зарегистрироваться через Google" },
  "Or": { uz: "Yoki", ru: "Ile" },
  "Google sign-in failed": { uz: "Google orqali kirish amalga oshmadi", ru: "Не удалось войти через Google" },
  "Registration failed": { uz: "Ro‘yxatdan o‘tish amalga oshmadi", ru: "Не удалось зарегистрироваться" },
  "Invalid login or password": {
    uz: "Login yoki parol noto‘g‘ri",
    ru: "Неверный логин или пароль",
  },
  "Admin accounts must use the admin login": {
    uz: "Admin hisoblari admin kirish sahifasidan foydalanishi kerak",
    ru: "Админ-аккаунты должны входить через админ-страницу",
  },
  "Email already registered": {
    uz: "Bu email allaqachon ro‘yxatdan o‘tgan",
    ru: "Этот email уже зарегистрирован",
  },
  "Current password is incorrect": {
    uz: "Joriy parol noto‘g‘ri",
    ru: "Текущий пароль неверен",
  },
  "Password is incorrect": { uz: "Parol noto‘g‘ri", ru: "Неверный пароль" },
  "User not found": { uz: "Foydalanuvchi topilmadi", ru: "Пользователь не найден" },
  "Email is required": { uz: "Email kiritilishi shart", ru: "Укажите email" },
  "Please enter a valid email address": {
    uz: "Iltimos, to‘g‘ri email manzil kiriting",
    ru: "Введите корректный адрес email",
  },
  "Order can no longer be cancelled": {
    uz: "Buyurtmani endi bekor qilib bo‘lmaydi",
    ru: "Заказ больше нельзя отменить",
  },
  "Paid orders cannot be cancelled online. Please contact us to arrange a refund.": {
    uz: "To‘langan buyurtmalarni onlayn bekor qilib bo‘lmaydi. Pulni qaytarish uchun biz bilan bog‘laning.",
    ru: "Оплаченные заказы нельзя отменить онлайн. Свяжитесь с нами для возврата средств.",
  },
  "Cancelled orders cannot be paid": {
    uz: "Bekor qilingan buyurtma uchun to‘lov qilib bo‘lmaydi",
    ru: "Отменённый заказ нельзя оплатить",
  },
  "This order has already been paid": {
    uz: "Bu buyurtma allaqachon to‘langan",
    ru: "Этот заказ уже оплачен",
  },
  "This order does not use online payment": {
    uz: "Bu buyurtma onlayn to‘lovdan foydalanmaydi",
    ru: "Этот заказ не использует онлайн-оплату",
  },
  "Payme is not configured yet": {
    uz: "Payme hali sozlanmagan",
    ru: "Payme ещё не настроен",
  },
  "Click is not configured yet": {
    uz: "Click hali sozlanmagan",
    ru: "Click ещё не настроен",
  },
  "Invalid product in order": {
    uz: "Buyurtmada noto‘g‘ri mahsulot bor",
    ru: "В заказе указан неверный товар",
  },
  "Internal server error": {
    uz: "Serverda xatolik yuz berdi. Iltimos, keyinroq urinib ko‘ring.",
    ru: "Внутренняя ошибка сервера. Попробуйте позже.",
  },
  "Bringing Warmth to Every Home": {
    uz: "Har bir uyga iliqlik olib kelamiz",
    ru: "Приносим тепло в каждый дом",
  },
  "Handcrafted hardwood furniture for modern sanctuaries — sofas, beds, dining tables and more.":
    {
      uz: "Zamonaviy uylar uchun qo‘lda ishlangan qattiq yog‘och mebel — divanlar, karavotlar, ovqat stollari va boshqalar.",
      ru: "Мебель ручной работы из массива для современных интерьеров — диваны, кровати, обеденные столы и другое.",
    },
  "Join the Lumina Family": { uz: "Lumina oilasiga qo‘shiling", ru: "Присоединяйтесь к семье Lumina" },
  "Create your account and explore our handcrafted collection.": {
    uz: "Hisob yarating va qo‘lda ishlangan kolleksiyamizni kashf eting.",
    ru: "Создайте аккаунт и откройте нашу коллекцию ручной работы.",
  },

  // ── Contact ────────────────────────────────────────────────────────────
  "Come sit with the wood": { uz: "Yog‘och bilan birga dam oling", ru: "Проведите время с деревом" },
  Showroom: { uz: "Showroom", ru: "Шоурум" },
  Call: { uz: "Qo‘ng‘iroq", ru: "Звонок" },
  "Custom work": { uz: "Individual buyurtma", ru: "Индивидуальный заказ" },
  "Send your room dimensions and we'll draft a piece scaled to the space, usually within five working days.":
    {
      uz: "Xonangiz o‘lchamlarini yuboring — biz odatda besh ish kuni ichida joyga mos buyum loyihasini tayyorlaymiz.",
      ru: "Отправьте размеры комнаты — обычно в течение пяти рабочих дней мы подготовим проект изделия под ваше пространство.",
    },
  Message: { uz: "Xabar", ru: "Сообщение" },
  "Sending…": { uz: "Yuborilmoqda…", ru: "Отправляем…" },
  "Send message": { uz: "Xabar yuborish", ru: "Отправить сообщение" },
  "Thank you — we'll reply within one working day.": {
    uz: "Rahmat — bir ish kuni ichida javob beramiz.",
    ru: "Спасибо — ответим в течение одного рабочего дня.",
  },
  "Please enter a complete and valid phone number (+998 ** *** ** **)": {
    uz: "Iltimos, to‘liq va to‘g‘ri telefon raqamini kiriting (+998 ** *** ** **)",
    ru: "Пожалуйста, введите полный и правильный номер телефона (+998 ** *** ** **)",
  },
  "Failed to send": { uz: "Yuborib bo‘lmadi", ru: "Не удалось отправить" },

  // ── About ──────────────────────────────────────────────────────────────
  "Since 2011": { uz: "2011 yildan beri", ru: "С 2011 года" },
  "Our Story": { uz: "Bizning tariximiz", ru: "Наша история" },
  "A small workshop in Tashkent making slow, warm furniture from responsibly sourced hardwood.":
    {
      uz: "Toshkentdagi kichik ustaxona: mas’uliyatli manbalardan olingan qattiq yog‘ochdan shoshilmasdan, issiq mebel yaratamiz.",
      ru: "Небольшая мастерская в Ташкенте: создаём тёплую мебель без спешки из ответственно заготовленной древесины.",
    },
  "The beginning": { uz: "Boshlanish", ru: "Начало" },
  "One table at a time": { uz: "Bir vaqtda bitta stol", ru: "Один стол за раз" },
  "Lumina Home began in a two-bench workshop with a single commission: a walnut dining table for a family of six. Fourteen years later we still build in small batches, sanding through four grits, dry-fitting every joint, and finishing with a plant-based oil that lets the grain breathe.":
    {
      uz: "Lumina Home ikki dastgohli ustaxonada bitta buyurtmadan boshlangan: olti kishilik oila uchun yong‘oq ovqat stoli. O‘n to‘rt yil o‘tib ham kichik partiyalarda ishlaymiz: to‘rt xil abraziv bilan silliqlaymiz, har bir birikmani quruq holda sinab ko‘ramiz va yog‘och teksturasi nafas olishi uchun o‘simlik asosidagi moy bilan qoplaymiz.",
      ru: "Lumina Home началась в мастерской с двумя верстаками с одного заказа: обеденного стола из ореха для семьи из шести человек. Четырнадцать лет спустя мы по-прежнему работаем небольшими партиями: шлифуем в четыре этапа, проверяем каждое соединение и покрываем маслом на растительной основе, чтобы текстура дерева дышала.",
    },
  "We source FSC-certified walnut and oak, upholster with natural bouclé and full-grain leather, and design each piece to be repaired rather than replaced.":
    {
      uz: "FSC sertifikatiga ega yong‘oq va eman ishlatamiz, tabiiy bukle va to‘liq donali charm bilan qoplaymiz, har bir buyumni almashtirish emas, ta’mirlash uchun loyihalaymiz.",
      ru: "Используем орех и дуб с сертификатом FSC, натуральное букле и кожу полного дубления, проектируем каждое изделие так, чтобы его можно было отремонтировать, а не заменить.",
    },
  "Lumina in numbers": { uz: "Lumina raqamlarda", ru: "Lumina в цифрах" },
  "Numbers that tell": { uz: "Hikoyamizni", ru: "Цифры, которые" },
  "our story": { uz: "aytadigan raqamlar", ru: "говорят о нас" },
  "Fourteen years, nine pairs of hands, and one standard: furniture worth keeping.":
    {
      uz: "O‘n to‘rt yil, to‘qqiz juft qo‘l va bitta mezon: avlodlarga qoladigan mebel.",
      ru: "Четырнадцать лет, девять пар рук и один стандарт: мебель, которую стоит сохранить.",
    },
  "Years of making": { uz: "Yillik tajriba", ru: "Лет работы" },
  "Since 2011, one bench at a time.": {
    uz: "2011 yildan beri — bir vaqtda bitta buyum.",
    ru: "С 2011 года — одно изделие за раз.",
  },
  "Craftspeople": { uz: "Hunarmandlar", ru: "Мастера" },
  "Hands that shape every joint.": {
    uz: "Har bir birikmaga shakl beradigan qo‘llar.",
    ru: "Руки, которые формируют каждое соединение.",
  },
  "Average build time": { uz: "O‘rtacha tayyorlash vaqti", ru: "Среднее время изготовления" },
  "From first cut to final oil.": {
    uz: "Birinchi kesishdan yakuniy moylashgacha.",
    ru: "От первого распила до финального масла.",
  },
  "Average rating": { uz: "O‘rtacha reyting", ru: "Средний рейтинг" },
  "From hundreds of verified reviews.": {
    uz: "Yuzlab tasdiqlangan sharhlar asosida.",
    ru: "По сотням проверенных отзывов.",
  },
  "Our journey": { uz: "Yo‘limiz", ru: "Наш путь" },
  Milestones: { uz: "Muhim bosqichlar", ru: "Этапы" },
  "Two benches, one commission, a walnut table for six.": {
    uz: "Ikki dastgoh, bitta buyurtma — olti kishilik yong‘oq stol.",
    ru: "Два верстака, один заказ — ореховый стол на шесть человек.",
  },
  "Moved to a proper workshop. Hired the first apprentice.": {
    uz: "Haqiqiy ustaxonaga ko‘chdik. Birinchi shogirdni ishga oldik.",
    ru: "Переехали в настоящую мастерскую. Наняли первого ученика.",
  },
  "Began using only FSC-certified hardwoods and plant-based oils.": {
    uz: "Faqat FSC sertifikatiga ega qattiq yog‘och va o‘simlik asosidagi moylardan foydalanishni boshladik.",
    ru: "Начали использовать только древесину с сертификатом FSC и масла на растительной основе.",
  },
  "Nine makers, a full showroom, and still one piece at a time.": {
    uz: "To‘qqiz hunarmand, to‘liq showroom — va hali ham bir vaqtda bitta buyum.",
    ru: "Девять мастеров, полноценный шоурум — и по-прежнему одно изделие за раз.",
  },
  "Meet the makers": { uz: "Hunarmandlar bilan tanishing", ru: "Познакомьтесь с мастерами" },
  "The hands behind the wood": { uz: "Yog‘och ortidagi qo‘llar", ru: "Руки, создающие дерево" },
  "Master Woodworker": { uz: "Bosh yog‘och ustasi", ru: "Мастер по дереву" },
  "Lead Designer": { uz: "Bosh dizayner", ru: "Главный дизайнер" },
  "Finishing Specialist": { uz: "Qoplama bo‘yicha mutaxassis", ru: "Специалист по отделке" },
  "Upholstery Artisan": { uz: "Mebel qoplovchi usta", ru: "Мастер по обивке" },
  "Every piece, signed by the maker who built it.": {
    uz: "Har bir buyum uni yaratgan usta imzosi bilan.",
    ru: "Каждое изделие подписано мастером, который его создал.",
  },
  "Nothing leaves the workshop until it is signed. We deliver across Uzbekistan, assemble in your home, and stand behind the joinery for two full years.":
    {
      uz: "Imzo qo‘yilmaguncha hech narsa ustaxonadan chiqmaydi. O‘zbekiston bo‘ylab yetkazamiz, uyingizda yig‘amiz va birikmalar uchun ikki yil kafolat beramiz.",
      ru: "Ничто не покидает мастерскую без подписи. Доставляем по Узбекистану, собираем у вас дома и даём два года гарантии на соединения.",
    },

  // ── Dashboard ──────────────────────────────────────────────────────────
  "My Orders": { uz: "Buyurtmalarim", ru: "Мои заказы" },
  Addresses: { uz: "Manzillar", ru: "Адреса" },
  Messages: { uz: "Xabarlar", ru: "Сообщения" },
  Profile: { uz: "Profil", ru: "Профиль" },
  "No orders yet": { uz: "Hozircha buyurtma yo‘q", ru: "Заказов пока нет" },
  "Start shopping": { uz: "Xaridni boshlash", ru: "Начать покупки" },
  "Order #{id}": { uz: "Buyurtma #{id}", ru: "Заказ #{id}" },
  "Paid:": { uz: "To‘langan:", ru: "Оплачено:" },
  "Cancel order": { uz: "Buyurtmani bekor qilish", ru: "Отменить заказ" },
  "Cancel order?": { uz: "Buyurtma bekor qilinsinmi?", ru: "Отменить заказ?" },
  "Are you sure you want to cancel this order? This cannot be undone.": {
    uz: "Bu buyurtmani bekor qilishga ishonchingiz komilmi? Buni qaytarib bo‘lmaydi.",
    ru: "Вы уверены, что хотите отменить этот заказ? Это действие нельзя отменить.",
  },
  "Order cancelled": { uz: "Buyurtma bekor qilindi", ru: "Заказ отменён" },
  "Failed to cancel order": { uz: "Buyurtmani bekor qilib bo‘lmadi", ru: "Не удалось отменить заказ" },
  "No address saved yet": { uz: "Hozircha manzil saqlanmagan", ru: "Адрес пока не сохранён" },
  DEFAULT: { uz: "ASOSIY", ru: "ОСНОВНОЙ" },
  Edit: { uz: "Tahrirlash", ru: "Изменить" },
  Delete: { uz: "O‘chirish", ru: "Удалить" },
  "Edit Address": { uz: "Manzilni tahrirlash", ru: "Изменить адрес" },
  "Add Address": { uz: "Manzil qo‘shish", ru: "Добавить адрес" },
  Label: { uz: "Nomi", ru: "Название" },
  Work: { uz: "Ish", ru: "Работа" },
  Other: { uz: "Boshqa", ru: "Другое" },
  "Home address": { uz: "Uy manzili", ru: "Домашний адрес" },
  "Work address": { uz: "Ish manzili", ru: "Рабочий адрес" },
  "Other address": { uz: "Boshqa manzil", ru: "Другой адрес" },
  "Full Name": { uz: "To‘liq ism", ru: "Полное имя" },
  "Set as default": { uz: "Asosiy qilib belgilash", ru: "Сделать основным" },
  Cancel: { uz: "Bekor qilish", ru: "Отмена" },
  "Saving...": { uz: "Saqlanmoqda…", ru: "Сохраняем…" },
  "Updating...": { uz: "Yangilanmoqda…", ru: "Обновляем…" },
  "Update Address": { uz: "Manzilni yangilash", ru: "Обновить адрес" },
  "Save Address": { uz: "Manzilni saqlash", ru: "Сохранить адрес" },
  "Full name": { uz: "To‘liq ism", ru: "Полное имя" },
  "Save Name": { uz: "Ismni saqlash", ru: "Сохранить имя" },
  "Change password": { uz: "Parolni o‘zgartirish", ru: "Изменить пароль" },
  "Current password": { uz: "Joriy parol", ru: "Текущий пароль" },
  "New password": { uz: "Yangi parol", ru: "Новый пароль" },
  "Update Password": { uz: "Parolni yangilash", ru: "Обновить пароль" },
  "Delete account": { uz: "Hisobni o‘chirish", ru: "Удалить аккаунт" },
  "This permanently removes your account, orders, addresses and chat history. This action cannot be undone.":
    {
      uz: "Bu hisobingizni, buyurtmalaringizni, manzillaringizni va yozishmalar tarixini butunlay o‘chiradi. Buni qaytarib bo‘lmaydi.",
      ru: "Это навсегда удалит аккаунт, заказы, адреса и историю переписки. Действие нельзя отменить.",
    },
  "Enter your password to confirm": {
    uz: "Tasdiqlash uchun parolingizni kiriting",
    ru: "Введите пароль для подтверждения",
  },
  "Delete my account": { uz: "Hisobimni o‘chirish", ru: "Удалить мой аккаунт" },
  "Deleting...": { uz: "O‘chirilmoqda…", ru: "Удаляем…" },
  "No notifications yet": { uz: "Hozircha bildirishnoma yo‘q", ru: "Уведомлений пока нет" },
  "Replies from Lumina will appear here": {
    uz: "Lumina javoblari shu yerda ko‘rinadi",
    ru: "Ответы Lumina будут появляться здесь",
  },
  "Delete notification": { uz: "Bildirishnomani o‘chirish", ru: "Удалить уведомление" },
  "Name updated": { uz: "Ism yangilandi", ru: "Имя обновлено" },
  "Password updated": { uz: "Parol yangilandi", ru: "Пароль обновлён" },
  "Account deleted": { uz: "Hisob o‘chirildi", ru: "Аккаунт удалён" },
  "Failed to save": { uz: "Saqlab bo‘lmadi", ru: "Не удалось сохранить" },
  "Failed to update name": { uz: "Ismni yangilab bo‘lmadi", ru: "Не удалось обновить имя" },
  "Failed to update password": { uz: "Parolni yangilab bo‘lmadi", ru: "Не удалось обновить пароль" },
  "Failed to delete account": { uz: "Hisobni o‘chirib bo‘lmadi", ru: "Не удалось удалить аккаунт" },
  "Delete account?": { uz: "Hisob o‘chirilsinmi?", ru: "Удалить аккаунт?" },
  "Are you sure you want to permanently delete your account? Your orders, addresses and chat history will be removed. This cannot be undone.":
    {
      uz: "Hisobingizni butunlay o‘chirishga ishonchingiz komilmi? Buyurtmalar, manzillar va yozishmalar tarixi o‘chiriladi. Buni qaytarib bo‘lmaydi.",
      ru: "Вы уверены, что хотите навсегда удалить аккаунт? Заказы, адреса и история переписки будут удалены. Это нельзя отменить.",
    },
  "Order status": { uz: "Buyurtma holati", ru: "Статус заказа" },
  pending: { uz: "Kutilmoqda", ru: "Ожидает" },
  confirmed: { uz: "Tasdiqlangan", ru: "Подтверждён" },
  shipped: { uz: "Yo‘lda", ru: "Отправлен" },
  delivered: { uz: "Yetkazilgan", ru: "Доставлен" },
  cancelled: { uz: "Bekor qilingan", ru: "Отменён" },
  assembly: { uz: "yig‘ish", ru: "сборка" },

  // ── Errors / empty states ──────────────────────────────────────────────
  "Page not found": { uz: "Sahifa topilmadi", ru: "Страница не найдена" },
  "The page you're looking for doesn't exist or has been moved.": {
    uz: "Siz qidirayotgan sahifa mavjud emas yoki boshqa joyga ko‘chirilgan.",
    ru: "Страница, которую вы ищете, не существует или была перемещена.",
  },
  "Go home": { uz: "Bosh sahifaga qaytish", ru: "На главную" },
  "This page didn't load": { uz: "Sahifa yuklanmadi", ru: "Страница не загрузилась" },
  "Something went wrong on our end. You can try refreshing or head back home.": {
    uz: "Bizning tomonda xatolik yuz berdi. Sahifani yangilang yoki bosh sahifaga qayting.",
    ru: "На нашей стороне произошла ошибка. Обновите страницу или вернитесь на главную.",
  },
  "Try again": { uz: "Qayta urinish", ru: "Попробовать снова" },

  // ── Phone input ────────────────────────────────────────────────────────
  Phone: { uz: "Telefon", ru: "Телефон" },
  "Enter a valid Uzbekistan number (e.g. +998 90 123 45 67)": {
    uz: "To‘g‘ri O‘zbekiston raqamini kiriting (masalan +998 90 123 45 67)",
    ru: "Введите правильный номер Узбекистана (например +998 90 123 45 67)",
  },
  "Enter the full number": { uz: "Raqamni to‘liq kiriting", ru: "Введите номер полностью" },

  // ── Product descriptions ───────────────────────────────────────────────
  "Hand-shaped solid walnut frame cradling a deep bouclé seat. Sculpted over 40 hours by our workshop in three passes of hand-sanding and oiling.":
    {
      uz: "Qo‘lda shakllantirilgan qattiq yong‘oq karkas va chuqur bukle o‘rindiq. Ustaxonamizda 40 soatdan ortiq vaqt davomida uch bosqichda qo‘lda silliqlanib, moylangan.",
      ru: "Каркас из массива ореха ручной формовки с глубоким сиденьем из букле. Создавался в мастерской более 40 часов в три этапа ручной шлифовки и покрытия маслом.",
    },
  "A low, generous three-seater in soft bouclé, raised on tapered hardwood legs for a light, breathable silhouette.":
    {
      uz: "Yumshoq bukledan keng, past uch o‘rinli divan; yengil va havodor siluet uchun ingichka qattiq yog‘och oyoqlarda.",
      ru: "Низкий просторный трёхместный диван из мягкого букле на сужающихся ножках из массива — лёгкий и воздушный силуэт.",
    },
  "An oval table cut from a single oak slab, finished with plant-based oil that deepens with every shared meal.":
    {
      uz: "Bitta eman taxtasidan kesilgan oval stol, har bir birgalikdagi ovqat bilan chuqurlashadigan o‘simlik moyi bilan qoplangan.",
      ru: "Овальный стол из цельного дубового слэба, покрытый маслом на растительной основе, которое становится глубже с каждым совместным ужином.",
    },
  "Fluted slat doors on soft-close runners, with adjustable interior shelving for tableware and linens.":
    {
      uz: "Yumshoq yopiluvchi mexanizmlarda panjarali eshiklar, idish-tovoq va matolar uchun sozlanadigan ichki javonlar.",
      ru: "Реечные дверцы на доводчиках и регулируемые полки внутри для посуды и текстиля.",
    },
  "A low walnut platform with an upholstered linen headboard, engineered to sit silently for decades.":
    {
      uz: "Past yong‘oq platforma va zig‘ir bilan qoplangan bosh tomoni — o‘nlab yillar davomida jim xizmat qilish uchun.",
      ru: "Низкая ореховая платформа с изголовьем, обитым льном, рассчитанная на десятилетия тихой службы.",
    },
  "Full-grain saddle leather over a steam-bent oak frame, on a five-star swivel base with felt-lined casters.":
    {
      uz: "Bug‘da egilgan eman karkas ustidagi to‘liq donali saddle charm, kigiz qoplangan g‘ildirakli besh nurli aylanadigan asosda.",
      ru: "Кожа полного дубления на гнутом паром дубовом каркасе, на пятилучном поворотном основании с колесиками с войлочной отделкой.",
    },
  "A lipped walnut tray top on a tripod base — small enough for city apartments, solid enough to inherit.":
    {
      uz: "Uch oyoqli asosdagi qirrali yong‘oq stolcha — shahar kvartirasi uchun kichik, avloddan-avlodga o‘tadigan darajada mustahkam.",
      ru: "Столешница-поднос из ореха с бортиком на трёхногом основании — достаточно компактная для городской квартиры и достаточно прочная, чтобы передать по наследству.",
    },
  "A slim writing desk with a hidden cable channel and one full-width drawer in dovetailed oak.":
    {
      uz: "Yashirin kabel kanali va to‘liq kenglikdagi bitta tortmasi bo‘lgan ingichka yozuv stoli, eman detallari qaldiroq birikmada.",
      ru: "Тонкий письменный стол со скрытым кабельным каналом и одним выдвижным ящиком во всю ширину из дуба с соединением «ласточкин хвост».",
    },

  // ── Product names, materials and colour options ──────────────────────
  "Halden Bouclé Sofa": { uz: "Halden bukle divani", ru: "Диван Halden из букле" },
  "Lumen Oak Dining Table": {
    uz: "Lumen eman ovqat stoli",
    ru: "Обеденный стол Lumen из дуба",
  },
  "Sera Slatted Sideboard": { uz: "Sera panjarali servant", ru: "Сервант Sera с рейками" },
  "Aalto Platform Bed": { uz: "Aalto platformali karavot", ru: "Кровать-платформа Aalto" },
  "Kori Leather Desk Chair": {
    uz: "Kori charm ish kursisi",
    ru: "Офисное кресло Kori из кожи",
  },
  "Ovi Round Coffee Table": {
    uz: "Ovi dumaloq kofe stoli",
    ru: "Круглый кофейный столик Ovi",
  },
  "Atlas Oak Writing Desk": {
    uz: "Atlas eman yozuv stoli",
    ru: "Письменный стол Atlas из дуба",
  },
  "Solid Walnut": { uz: "Qattiq yong‘oq", ru: "Массив ореха" },
  "Solid Oak": { uz: "Qattiq eman", ru: "Массив дуба" },
  "Bouclé & Oak": { uz: "Bukle va eman", ru: "Букле и дуб" },
  "Walnut Veneer": { uz: "Yong‘oq shponi", ru: "Шпон ореха" },
  "Walnut & Linen": { uz: "Yong‘oq va zig‘ir", ru: "Орех и лён" },
  "Full-grain Leather": { uz: "To‘liq donali charm", ru: "Кожа полного дубления" },
  Walnut: { uz: "Yong‘oq", ru: "Орех" },
  Oak: { uz: "Eman", ru: "Дуб" },
  Velvet: { uz: "Baxmal", ru: "Бархат" },
  Leather: { uz: "Charm", ru: "Кожа" },
  "Cream Bouclé": { uz: "Krem bukle", ru: "Кремовое букле" },
  Terracotta: { uz: "Terrakota", ru: "Терракота" },
  "Light Oak": { uz: "Ochiq eman", ru: "Светлый дуб" },
  Oatmeal: { uz: "Suli rang", ru: "Овсяный" },
  Forest: { uz: "O‘rmon yashili", ru: "Лесной зелёный" },
  "Natural Oak": { uz: "Tabiiy eman", ru: "Натуральный дуб" },
  "Honey Oak": { uz: "Asal rang eman", ru: "Медовый дуб" },
  Linen: { uz: "Zig‘ir", ru: "Лён" },
  Clay: { uz: "Loy rang", ru: "Глиняный" },
  Cream: { uz: "Krem", ru: "Кремовый" },
  Dark: { uz: "To‘q", ru: "Тёмный" },
  Natural: { uz: "Tabiiy", ru: "Натуральный" },

  // ── Payment result / misc ──────────────────────────────────────────────
  "Order not found": { uz: "Buyurtma topilmadi", ru: "Заказ не найден" },
  "Could not load payment status": {
    uz: "To‘lov holatini yuklab bo‘lmadi",
    ru: "Не удалось загрузить статус оплаты",
  },
  "Could not start payment": {
    uz: "To‘lovni boshlab bo‘lmadi",
    ru: "Не удалось начать оплату",
  },
  "Retry payment": { uz: "To‘lovni qayta urinish", ru: "Повторить оплату" },
  "Payment method": { uz: "To‘lov usuli", ru: "Способ оплаты" },
  "Secure payment": { uz: "Xavfsiz to‘lov", ru: "Безопасная оплата" },
  "Accepted cards": { uz: "Qabul qilinadigan kartalar", ru: "Принимаемые карты" },
  "Visa, UZCARD and HUMO cards are accepted through our payment partners.": {
    uz: "Visa, UZCARD va HUMO kartalari to‘lov hamkorlarimiz orqali qabul qilinadi.",
    ru: "Карты Visa, UZCARD и HUMO принимаются через наших платёжных партнёров.",
  },
  "Online payment is temporarily unavailable": {
    uz: "Onlayn to‘lov vaqtincha mavjud emas",
    ru: "Онлайн-оплата временно недоступна",
  },
  "Please choose cash on delivery or contact us.": {
    uz: "Iltimos, naqd pul bilan to‘lashni tanlang yoki biz bilan bog‘laning.",
    ru: "Пожалуйста, выберите оплату наличными или свяжитесь с нами.",
  },
  "This payment method is not configured yet": {
    uz: "Bu to‘lov usuli hali sozlanmagan",
    ru: "Этот способ оплаты пока не настроен",
  },
  "Choose another payment method": {
    uz: "Boshqa to‘lov usulini tanlang",
    ru: "Выберите другой способ оплаты",
  },
  "Home assembly included": {
    uz: "Uyda yig‘ish narxga kiritilgan",
    ru: "Сборка на дому включена",
  },
  "Pay now": { uz: "Hozir to‘lash", ru: "Оплатить сейчас" },
  "Checking payment…": { uz: "To‘lov tekshirilmoqda…", ru: "Проверяем оплату…" },
  "Sign in to view payment status": {
    uz: "To‘lov holatini ko‘rish uchun tizimga kiring",
    ru: "Войдите, чтобы увидеть статус оплаты",
  },
  paid: { uz: "To‘langan", ru: "Оплачено" },
  unpaid: { uz: "To‘lanmagan", ru: "Не оплачено" },
  failed: { uz: "Muvaffaqiyatsiz", ru: "Ошибка" },
  refunded: { uz: "Qaytarilgan", ru: "Возвращено" },
  "Subscribe": { uz: "Obuna bo‘lish", ru: "Подписаться" },
  "Newsletter subscription failed. Please try again.": {
    uz: "Yangiliklarga obuna bo‘lish amalga oshmadi. Qayta urinib ko‘ring.",
    ru: "Не удалось подписаться на рассылку. Попробуйте ещё раз.",
  },
};

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (source: string, vars?: Record<string, string | number>) => string;
}

const fallbackContext: I18nContextValue = {
  lang: "uz",
  setLang: () => {},
  t: (source) => source,
};

const I18nContext = createContext<I18nContextValue>(fallbackContext);

function interpolate(value: string, vars?: Record<string, string | number>) {
  if (!vars) return value;
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replaceAll(`{${key}}`, String(val)),
    value,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Uzbek is the primary language requested by the store owner.
  const [lang, setLangState] = useState<Lang>("uz");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lumina-lang");
      if (stored === "ru" || stored === "uz") setLangState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("lumina-lang", lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: (source, vars) => {
        const translated = translations[source]?.[lang] ?? source;
        return interpolate(translated, vars);
      },
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useTranslation() {
  return useI18n();
}
