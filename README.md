# 📸 Instagram Clone — Backend

Node.js + Express + MongoDB + Socket.io bilan yozilgan to'liq Instagram backend.

## Imkoniyatlar

- 🔐 **Auth** — ro'yxatdan o'tish, kirish (email yoki username bilan), JWT
- 👤 **Foydalanuvchilar** — profil, tahrirlash, follow/unfollow, qidiruv, tavsiyalar
- 📷 **Postlar** — yaratish (carousel — bir nechta rasm/video), feed, explore, like, save, hashtag
- 💬 **Kommentlar** — qo'shish, like, reply, o'chirish
- 📖 **Stories** — 24 soatda avtomatik o'chadi (MongoDB TTL), ko'rilganlik
- ✉️ **Direct Messages** — real-time chat (Socket.io), "yozmoqda...", o'qildi
- 🔔 **Notifications** — like/comment/follow/message uchun real-time bildirishnoma
- 🟢 **Online status** — kim onlayn ekanini real-time kuzatish

## O'rnatish

```bash
npm install

# .env faylni sozlang (.env.example dan nusxa oling)
cp .env.example .env

# Ishga tushirish
npm run dev      # nodemon (development)
npm start        # production
```

> **Eslatma:** macOS'da 5000-port AirPlay tomonidan band bo'lishi mumkin, shuning uchun default port **5001** qilingan.

## 📚 Swagger hujjati

Server ishga tushgach, brauzerda oching:

```
http://localhost:5001/api-docs
```

- Barcha **38 endpoint** interaktiv test qilinadi
- O'ng yuqoridagi **Authorize** tugmasiga token kiriting (login'dan olingan `token`) — barcha himoyalangan so'rovlar avtomatik token bilan ketadi
- Xom JSON: `http://localhost:5001/api-docs.json`

## Muhit o'zgaruvchilari (.env)

| O'zgaruvchi | Tavsif |
|---|---|
| `PORT` | Server porti (default 5001) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT maxfiy kaliti |
| `JWT_EXPIRES_IN` | Token amal qilish muddati (30d) |
| `CLIENT_URL` | Frontend URL (CORS uchun) |

---

## API Endpointlar

Barcha himoyalangan route'lar uchun header: `Authorization: Bearer <token>`

### 🔐 Auth — `/api/auth`
| Metod | Yo'l | Tavsif |
|---|---|---|
| POST | `/register` | Ro'yxatdan o'tish |
| POST | `/login` | Kirish (`identifier` = email yoki username) |
| GET | `/me` | Joriy foydalanuvchi 🔒 |

### 👤 Users — `/api/users` 🔒
| Metod | Yo'l | Tavsif |
|---|---|---|
| GET | `/?search=ali` | Qidirish |
| GET | `/suggestions` | Follow tavsiyalari |
| PUT | `/profile` | Profilni yangilash (`avatar` fayl) |
| GET | `/:username` | Profilni ko'rish |
| POST | `/:id/follow` | Follow / Unfollow |
| GET | `/:id/followers` | Followerlar |
| GET | `/:id/following` | Following |

### 📷 Posts — `/api/posts` 🔒
| Metod | Yo'l | Tavsif |
|---|---|---|
| POST | `/` | Post yaratish (`media` — 10 tagacha fayl) |
| GET | `/feed?page=1` | Feed |
| GET | `/explore` | Mashhur postlar |
| GET | `/saved` | Saqlanganlar |
| GET | `/hashtag/:tag` | Hashtag bo'yicha |
| GET | `/user/:userId` | Foydalanuvchi postlari |
| GET | `/:id` | Bitta post |
| DELETE | `/:id` | O'chirish |
| POST | `/:id/like` | Like / Unlike |
| POST | `/:id/save` | Save / Unsave |
| POST | `/:postId/comments` | Komment qo'shish |
| GET | `/:postId/comments` | Kommentlar |

### 💬 Comments — `/api/comments` 🔒
| Metod | Yo'l | Tavsif |
|---|---|---|
| POST | `/:id/like` | Komment like |
| DELETE | `/:id` | O'chirish |

### 📖 Stories — `/api/stories` 🔒
| Metod | Yo'l | Tavsif |
|---|---|---|
| POST | `/` | Story yaratish (`media` fayl) |
| GET | `/feed` | Feed storylari (guruhlangan) |
| GET | `/user/:userId` | Foydalanuvchi storylari |
| POST | `/:id/view` | Ko'rildi deb belgilash |
| DELETE | `/:id` | O'chirish |

### ✉️ Messages — `/api/messages` 🔒
| Metod | Yo'l | Tavsif |
|---|---|---|
| POST | `/conversations` | Suhbat ochish (`userId`) |
| GET | `/conversations` | Suhbatlar ro'yxati |
| GET | `/unread/count` | O'qilmagan soni |
| GET | `/:conversationId` | Xabarlar |
| POST | `/:conversationId` | Xabar yuborish (`text` yoki `media`) |

### 🔔 Notifications — `/api/notifications` 🔒
| Metod | Yo'l | Tavsif |
|---|---|---|
| GET | `/` | Bildirishnomalar |
| GET | `/unread/count` | O'qilmagan soni |
| PUT | `/read` | Barchasini o'qilgan qilish |
| DELETE | `/:id` | O'chirish |

---

## Socket.io Eventlar

**Client → Server:**
- `setup` (userId) — onlayn bo'lish
- `joinConversation` (conversationId) — suhbat xonasiga kirish
- `typing` / `stopTyping` ({ conversationId, userId })

**Server → Client:**
- `onlineUsers` (userId[]) — onlayn foydalanuvchilar
- `newMessage` (message) — yangi xabar
- `notification` (notification) — yangi bildirishnoma
- `typing` / `stopTyping`

---

## Struktura

```
src/
├── config/db.js          # MongoDB ulanish
├── models/               # Mongoose modellar
├── controllers/          # Biznes logika
├── routes/               # API route'lar
├── middleware/           # auth, upload (multer), error handler
├── socket/               # Socket.io boshqaruvi
├── utils/                # token, notification helperlari
└── app.js                # Express ilovasi
server.js                 # Kirish nuqtasi (HTTP + Socket.io)
uploads/                  # Yuklangan rasm/videolar
```
