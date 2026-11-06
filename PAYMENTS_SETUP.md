# Lumina Home — Payme, Click va Visa to‘lovlarini ulash

Bu hujjat biznes egasi va backend administratori uchun. Kodda to‘lov oqimi tayyor, lekin **haqiqiy pul qabul qilish uchun yuridik shaxs, bank hisob raqami va provayder shartnomalari kerak**.

## 1. Avval bajarilishi shart bo‘lgan yuridik qadamlar

1. **MChJ yoki YaTT** ro‘yxatdan o‘tkazing (agar hali bo‘lmasa).
2. Kompaniya nomiga **hisob-kitob (settlement) hisob raqami** oching. Shaxsiy karta orqali biznes to‘lovlarini qabul qilish tavsiya etilmaydi.
3. **Payme Business** kabinetida merchant shartnomasini imzolang.
4. **Click Business** kabinetida shop (do‘kon) yarating va shartnomani imzolang.
5. **Visa** — bu alohida to‘lov tizimi emas, xalqaro karta tarmog‘i. Visa kartalarini qabul qilish uchun:
   - O‘zbekistondagi **acquiring bank** bilan shartnoma tuzing, yoki
   - Payme/Click kabinetida Visa qabul qilish xizmatini yoqing.
6. Bank/provayder sizdan odatda quyidagilarni so‘raydi:
   - davlat ro‘yxatidan o‘tganlik guvohnomasi (STIR);
   - direktor pasporti va imzo namunalari;
   - hisob-kitob hisob raqami ma’lumotlari;
   - sayt domeni va saytning ishlaydigan HTTPS manzili;
   - qaytarish (refund) siyosati va yetkazib berish shartlari.

## 2. Payme Business ulash

Kabinetdan quyidagilarni oling:

- `merchant_id` — Payme merchant ID;
- `key` — Merchant API kaliti (maxfiy).

So‘ng `backend/.env` fayliga yozing:

```env
PAYME_ENABLED=true
PAYME_MERCHANT_ID=...
PAYME_KEY=...
PAYME_CHECKOUT_URL=https://checkout.paycom.uz
PUBLIC_APP_URL=https://sizning-domeningiz.uz
```

Payme kabinetida callback (Merchant API) manzili:

```text
https://api.sizning-domeningiz.uz/api/payments/payme
```

Texnik tafsilotlar:

- Payme JSON-RPC 2.0 yuboradi.
- Autentifikatsiya: `Authorization: Basic base64("Paycom:" + PAYME_KEY)`.
- Summa **tiyin**da keladi; kod uni UZS buyurtma summasiga tekshiradi.
- `account.order_id` buyurtma ID sifatida ishlatiladi.
- Buyurtma faqat `PerformTransaction` muvaffaqiyatli bo‘lgandan keyin `paid` bo‘ladi.
- `CancelTransaction` refund holatini `refunded` qiladi.

Test rejimida Payme kabineti bergan **test merchant ID va test kalitini** ishlating. Test checkout manzili kabinetda ko‘rsatiladi; u `PAYME_CHECKOUT_URL` orqali almashtiriladi.

## 3. Click Business ulash

Kabinetdan quyidagilarni oling:

- `service_id`;
- `merchant_id`;
- `secret_key` (maxfiy).

`backend/.env`:

```env
CLICK_ENABLED=true
CLICK_SERVICE_ID=...
CLICK_MERCHANT_ID=...
CLICK_SECRET_KEY=...
CLICK_CHECKOUT_URL=https://my.click.uz/services/pay
```

Click kabinetida:

- **Prepare URL**: `https://api.sizning-domeningiz.uz/api/payments/click/prepare`
- **Complete URL**: `https://api.sizning-domeningiz.uz/api/payments/click/complete`

Texnik tafsilotlar:

- Click `application/x-www-form-urlencoded` yuboradi.
- `Prepare` imzosi: `md5(click_trans_id + service_id + secret_key + merchant_trans_id + amount + action + sign_time)`.
- `Complete` imzosi: `md5(click_trans_id + service_id + secret_key + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)`. `merchant_prepare_id` faqat `Complete`da qatnashadi.
- Noto‘g‘ri imzo bilan kelgan so‘rov rad etiladi.
- `Prepare` faqat buyurtmani tekshiradi va `merchant_prepare_id` qaytaradi.
- `Complete` muvaffaqiyatli bo‘lsa, buyurtma `paid` bo‘ladi.
- Click xato qaytarsa, buyurtma to‘langan deb belgilanmaydi.

## 4. Visa va bank kartalari

Visa kartalarini qabul qilish uchun kodda alohida “Visa API” yo‘q. Variantlar:

1. **Acquiring bank** bilan shartnoma — bank sizga payment gateway va merchant ID beradi. Bu holda alohida integratsiya kerak bo‘ladi.
2. **Payme yoki Click orqali Visa** — eng tez yo‘l. Payme/Click kabinetida karta turlarini yoqing; foydalanuvchi Payme/Click sahifasida Visa kartasini kiritadi.
3. Saytda Visa logotipi faqat **qabul qilish imkoniyati mavjud bo‘lganda** ishlatilishi kerak. Logotip o‘z-o‘zidan to‘lov qabul qilishni anglatmaydi.

Karta ma’lumotlari (PAN, CVV) hech qachon backendda saqlanmaydi. To‘lov provayderning himoyalangan sahifasida amalga oshiriladi.

## 5. Sayt qanday ishlaydi

- `GET /api/payments/config` — qaysi provayder sozlanganini qaytaradi.
- Sozlanmagan provayder checkoutda ko‘rinmaydi; mijoz naqd pul (COD) bilan buyurtma qilishi mumkin.
- `POST /api/orders` — buyurtma yaratadi va online to‘lov uchun `redirectUrl` qaytaradi.
- `GET /api/payments/status/:orderId` — faqat buyurtma egasiga to‘lov holatini qaytaradi.
- `POST /api/payments/retry/:orderId` — to‘lovni qayta boshlash uchun yangi redirect beradi.
- `/payment/result?orderId=...` — natija sahifasi; u provayder callbackini kutadi va holatni avtomatik yangilaydi.

Muhim: **buyurtma “to‘langan” deb faqat provayderning imzolangan callbacki kelgandan keyin belgilanadi.** "Mock" yoki soxta muvaffaqiyat yo‘li ataylab o‘chirilgan.

## 6. Ishlab chiqish va test qilish

1. `backend/.env.example` dan nusxa olib `backend/.env` yarating.
2. Barcha maxfiy kalitlarni to‘ldiring.
3. Backendni ishga tushiring: `npm run dev` (backend papkasida). Bo‘sh bazada katalog mahsulotlari avtomatik qo‘shiladi; qo‘lda seed kerak bo‘lsa `npm run db:seed` ishlating.
4. Frontendni ishga tushiring: `npm run dev` (frontend papkasida).
5. `http://localhost:3001/api/payments/config` ni tekshiring — test kalitlari bilan `payme`/`click` `true` bo‘lishi kerak.
6. Test buyurtma yarating va provayderning test kartalari bilan to‘lang.
7. `payments` jadvalida `state`, `provider_transaction_id`, `provider_perform_time` yozuvlarini tekshiring.
8. Payme/Click kabinetidagi test callback natijalarini tekshiring.

## 7. Productionga chiqishdan oldin

- Domen va API uchun **HTTPS** ishlayotganini tekshiring.
- `PUBLIC_APP_URL` haqiqiy frontend domeniga teng bo‘lsin.
- `CORS_ORIGINS` faqat haqiqiy frontend domenlarini o‘z ichiga olsin.
- `JWT_SECRET`, `ADMIN_PASSWORD`, `PAYME_KEY`, `CLICK_SECRET_KEY` kuchli va maxfiy bo‘lsin.
- `.env` faylini gitga qo‘shmang.
- Ma’lumotlar bazasini zaxiralang.
- Refund va qaytarish siyosatini saytda ko‘rsating.
- Payme/Click bilan kunlik solishtirish (reconciliation) jarayonini belgilang.
- Test kalitlarini production kalitlari bilan almashtirgandan keyin bitta kichik real to‘lov bilan tekshiring.

## 8. Muhim cheklovlar

- Payme/Click shartnomasi tasdiqlanmaguncha haqiqiy onlayn to‘lov ishlamaydi.
- Visa qabul qilish bank/PSP shartnomasisiz mumkin emas.
- Soliq va buxgalteriya talablari bo‘yicha hisobchi yoki yuristdan maslahat oling.
- Ushbu kod to‘lov provayderlarining rasmiy hujjatlariga mos yozilgan, lekin har bir provayder kabinetidagi aniq talablar shartnoma bilan birga tekshirilishi kerak.
