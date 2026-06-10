// To'liq OpenAPI 3.0 spetsifikatsiyasi — barcha endpointlar qamrab olingan
const PORT = process.env.PORT || 5001;

// Qisqartmalar — qayta-qayta yozmaslik uchun
const auth = [{ bearerAuth: [] }];
const idParam = (name = "id", desc = "Resurs ID") => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string" },
  description: desc,
});
const ok = (desc = "Muvaffaqiyatli") => ({ description: desc });
const errs = {
  401: { description: "Avtorizatsiya yo'q / token noto'g'ri" },
  404: { description: "Topilmadi" },
  500: { description: "Server xatosi" },
};

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "📸 Instagram Clone API",
    version: "1.0.0",
    description:
      "Node + Express + MongoDB + Socket.io bilan yozilgan to'liq Instagram backend. Himoyalangan endpointlar uchun **Authorize** tugmasidan token kiriting.",
  },
  servers: [
    {
      url: process.env.PUBLIC_URL || "https://adetal-ff-production.up.railway.app",
      description: "Production (Railway)",
    },
    { url: `http://localhost:${PORT}`, description: "Local server" },
  ],
  tags: [
    { name: "Auth", description: "Ro'yxatdan o'tish va kirish" },
    { name: "Users", description: "Foydalanuvchilar va follow tizimi" },
    { name: "Posts", description: "Postlar, like, save, hashtag" },
    { name: "Comments", description: "Kommentlar" },
    { name: "Stories", description: "24 soatlik storylar" },
    { name: "Messages", description: "Direct chat (real-time)" },
    { name: "Notifications", description: "Bildirishnomalar" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          username: { type: "string" },
          fullName: { type: "string" },
          email: { type: "string" },
          avatar: { type: "string" },
          bio: { type: "string" },
          website: { type: "string" },
          gender: { type: "string", enum: ["male", "female", "other", ""] },
          followers: { type: "array", items: { type: "string" } },
          following: { type: "array", items: { type: "string" } },
          isPrivate: { type: "boolean" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          _id: { type: "string" },
          username: { type: "string" },
          fullName: { type: "string" },
          email: { type: "string" },
          avatar: { type: "string" },
          bio: { type: "string" },
          token: { type: "string", description: "JWT token" },
        },
      },
      Post: {
        type: "object",
        properties: {
          _id: { type: "string" },
          author: { $ref: "#/components/schemas/User" },
          caption: { type: "string" },
          location: { type: "string" },
          media: {
            type: "array",
            items: {
              type: "object",
              properties: {
                url: { type: "string" },
                type: { type: "string", enum: ["image", "video"] },
              },
            },
          },
          likes: { type: "array", items: { type: "string" } },
          hashtags: { type: "array", items: { type: "string" } },
          likesCount: { type: "integer" },
          isLiked: { type: "boolean" },
          isSaved: { type: "boolean" },
        },
      },
      Comment: {
        type: "object",
        properties: {
          _id: { type: "string" },
          post: { type: "string" },
          author: { $ref: "#/components/schemas/User" },
          text: { type: "string" },
          likes: { type: "array", items: { type: "string" } },
          parentComment: { type: "string", nullable: true },
        },
      },
      Story: {
        type: "object",
        properties: {
          _id: { type: "string" },
          author: { $ref: "#/components/schemas/User" },
          media: {
            type: "object",
            properties: {
              url: { type: "string" },
              type: { type: "string", enum: ["image", "video"] },
            },
          },
          caption: { type: "string" },
          viewers: { type: "array", items: { type: "string" } },
          expiresAt: { type: "string", format: "date-time" },
        },
      },
      Conversation: {
        type: "object",
        properties: {
          _id: { type: "string" },
          participants: {
            type: "array",
            items: { $ref: "#/components/schemas/User" },
          },
          lastMessage: { type: "string", nullable: true },
        },
      },
      Message: {
        type: "object",
        properties: {
          _id: { type: "string" },
          conversation: { type: "string" },
          sender: { $ref: "#/components/schemas/User" },
          text: { type: "string" },
          media: { type: "string" },
          isRead: { type: "boolean" },
        },
      },
      Notification: {
        type: "object",
        properties: {
          _id: { type: "string" },
          recipient: { type: "string" },
          sender: { $ref: "#/components/schemas/User" },
          type: {
            type: "string",
            enum: ["like", "comment", "follow", "mention", "message"],
          },
          post: { type: "string", nullable: true },
          text: { type: "string" },
          isRead: { type: "boolean" },
        },
      },
      Error: {
        type: "object",
        properties: { message: { type: "string" } },
      },
    },
  },
  paths: {
    // ====================== AUTH ======================
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Ro'yxatdan o'tish",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "fullName", "email", "password"],
                properties: {
                  username: { type: "string", example: "ali_dev" },
                  fullName: { type: "string", example: "Ali Valiyev" },
                  email: { type: "string", example: "ali@mail.com" },
                  password: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Yaratildi",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          400: { description: "Validatsiya xatosi yoki band" },
          500: errs[500],
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Tizimga kirish (email yoki username)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["identifier", "password"],
                properties: {
                  identifier: {
                    type: "string",
                    example: "ali_dev",
                    description: "Email yoki username",
                  },
                  password: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          401: { description: "Login yoki parol noto'g'ri" },
          500: errs[500],
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Joriy foydalanuvchi",
        security: auth,
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          401: errs[401],
        },
      },
    },

    // ====================== USERS ======================
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "Foydalanuvchilarni qidirish",
        security: auth,
        parameters: [
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Username yoki ism",
          },
        ],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
          401: errs[401],
        },
      },
    },
    "/api/users/suggestions": {
      get: {
        tags: ["Users"],
        summary: "Follow uchun tavsiyalar",
        security: auth,
        responses: { 200: ok(), 401: errs[401] },
      },
    },
    "/api/users/profile": {
      put: {
        tags: ["Users"],
        summary: "Profilni yangilash (avatar bilan)",
        security: auth,
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  fullName: { type: "string" },
                  bio: { type: "string" },
                  website: { type: "string" },
                  gender: { type: "string" },
                  username: { type: "string" },
                  isPrivate: { type: "boolean" },
                  avatar: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: { 200: ok("Yangilandi"), 400: ok("Username band"), 401: errs[401] },
      },
    },
    "/api/users/{username}": {
      get: {
        tags: ["Users"],
        summary: "Profilni username bo'yicha olish",
        security: auth,
        parameters: [idParam("username", "Foydalanuvchi username")],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          404: errs[404],
          401: errs[401],
        },
      },
    },
    "/api/users/{id}/follow": {
      post: {
        tags: ["Users"],
        summary: "Follow / Unfollow",
        security: auth,
        parameters: [idParam("id", "Foydalanuvchi ID")],
        responses: { 200: ok("Holat o'zgardi"), 400: ok("O'zini follow"), 404: errs[404] },
      },
    },
    "/api/users/{id}/followers": {
      get: {
        tags: ["Users"],
        summary: "Followerlar ro'yxati",
        security: auth,
        parameters: [idParam("id", "Foydalanuvchi ID")],
        responses: { 200: ok(), 404: errs[404] },
      },
    },
    "/api/users/{id}/following": {
      get: {
        tags: ["Users"],
        summary: "Following ro'yxati",
        security: auth,
        parameters: [idParam("id", "Foydalanuvchi ID")],
        responses: { 200: ok(), 404: errs[404] },
      },
    },

    // ====================== POSTS ======================
    "/api/posts": {
      post: {
        tags: ["Posts"],
        summary: "Post yaratish (1-10 ta media)",
        security: auth,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["media"],
                properties: {
                  media: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                    description: "Rasm/video fayllar (10 tagacha)",
                  },
                  caption: { type: "string", example: "Salom #dunyo" },
                  location: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Yaratildi",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Post" },
              },
            },
          },
          400: { description: "Media yuklanmadi" },
          401: errs[401],
        },
      },
    },
    "/api/posts/feed": {
      get: {
        tags: ["Posts"],
        summary: "Feed (o'zim + follow qilganlarim)",
        security: auth,
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: { 200: ok(), 401: errs[401] },
      },
    },
    "/api/posts/explore": {
      get: {
        tags: ["Posts"],
        summary: "Explore (mashhur postlar)",
        security: auth,
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 12 } },
        ],
        responses: { 200: ok(), 401: errs[401] },
      },
    },
    "/api/posts/saved": {
      get: {
        tags: ["Posts"],
        summary: "Saqlangan postlar",
        security: auth,
        responses: { 200: ok(), 401: errs[401] },
      },
    },
    "/api/posts/hashtag/{tag}": {
      get: {
        tags: ["Posts"],
        summary: "Hashtag bo'yicha postlar",
        security: auth,
        parameters: [idParam("tag", "Hashtag (# siz)")],
        responses: { 200: ok(), 401: errs[401] },
      },
    },
    "/api/posts/user/{userId}": {
      get: {
        tags: ["Posts"],
        summary: "Foydalanuvchining postlari",
        security: auth,
        parameters: [idParam("userId", "Foydalanuvchi ID")],
        responses: { 200: ok(), 401: errs[401] },
      },
    },
    "/api/posts/{id}": {
      get: {
        tags: ["Posts"],
        summary: "Bitta postni olish",
        security: auth,
        parameters: [idParam("id", "Post ID")],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Post" },
              },
            },
          },
          404: errs[404],
        },
      },
      delete: {
        tags: ["Posts"],
        summary: "Postni o'chirish (faqat egasi)",
        security: auth,
        parameters: [idParam("id", "Post ID")],
        responses: { 200: ok("O'chirildi"), 403: ok("Ruxsat yo'q"), 404: errs[404] },
      },
    },
    "/api/posts/{id}/like": {
      post: {
        tags: ["Posts"],
        summary: "Like / Unlike",
        security: auth,
        parameters: [idParam("id", "Post ID")],
        responses: { 200: ok("Holat o'zgardi"), 404: errs[404] },
      },
    },
    "/api/posts/{id}/save": {
      post: {
        tags: ["Posts"],
        summary: "Save / Unsave",
        security: auth,
        parameters: [idParam("id", "Post ID")],
        responses: { 200: ok("Holat o'zgardi"), 404: errs[404] },
      },
    },
    "/api/posts/{postId}/comments": {
      get: {
        tags: ["Comments"],
        summary: "Postning kommentlari",
        security: auth,
        parameters: [idParam("postId", "Post ID")],
        responses: { 200: ok(), 401: errs[401] },
      },
      post: {
        tags: ["Comments"],
        summary: "Komment qo'shish",
        security: auth,
        parameters: [idParam("postId", "Post ID")],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["text"],
                properties: {
                  text: { type: "string", example: "Zo'r post!" },
                  parentComment: {
                    type: "string",
                    nullable: true,
                    description: "Reply uchun ota-komment ID",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Yaratildi",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Comment" },
              },
            },
          },
          400: { description: "Matn bo'sh" },
          404: errs[404],
        },
      },
    },

    // ====================== COMMENTS ======================
    "/api/comments/{id}/like": {
      post: {
        tags: ["Comments"],
        summary: "Komment like / unlike",
        security: auth,
        parameters: [idParam("id", "Komment ID")],
        responses: { 200: ok("Holat o'zgardi"), 404: errs[404] },
      },
    },
    "/api/comments/{id}": {
      delete: {
        tags: ["Comments"],
        summary: "Kommentni o'chirish (komment yoki post egasi)",
        security: auth,
        parameters: [idParam("id", "Komment ID")],
        responses: { 200: ok("O'chirildi"), 403: ok("Ruxsat yo'q"), 404: errs[404] },
      },
    },

    // ====================== STORIES ======================
    "/api/stories": {
      post: {
        tags: ["Stories"],
        summary: "Story yaratish",
        security: auth,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["media"],
                properties: {
                  media: { type: "string", format: "binary" },
                  caption: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Yaratildi",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Story" },
              },
            },
          },
          400: { description: "Media yuklanmadi" },
        },
      },
    },
    "/api/stories/feed": {
      get: {
        tags: ["Stories"],
        summary: "Feed storylari (foydalanuvchi bo'yicha guruhlangan)",
        security: auth,
        responses: { 200: ok(), 401: errs[401] },
      },
    },
    "/api/stories/user/{userId}": {
      get: {
        tags: ["Stories"],
        summary: "Foydalanuvchining storylari",
        security: auth,
        parameters: [idParam("userId", "Foydalanuvchi ID")],
        responses: { 200: ok(), 401: errs[401] },
      },
    },
    "/api/stories/{id}/view": {
      post: {
        tags: ["Stories"],
        summary: "Story'ni ko'rilgan deb belgilash",
        security: auth,
        parameters: [idParam("id", "Story ID")],
        responses: { 200: ok(), 404: errs[404] },
      },
    },
    "/api/stories/{id}": {
      delete: {
        tags: ["Stories"],
        summary: "Story'ni o'chirish (egasi)",
        security: auth,
        parameters: [idParam("id", "Story ID")],
        responses: { 200: ok("O'chirildi"), 403: ok("Ruxsat yo'q"), 404: errs[404] },
      },
    },

    // ====================== MESSAGES ======================
    "/api/messages/conversations": {
      get: {
        tags: ["Messages"],
        summary: "Mening suhbatlarim",
        security: auth,
        responses: { 200: ok(), 401: errs[401] },
      },
      post: {
        tags: ["Messages"],
        summary: "Suhbat ochish yoki mavjudini olish",
        security: auth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId"],
                properties: {
                  userId: {
                    type: "string",
                    description: "Kim bilan suhbatlashish",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Conversation" },
              },
            },
          },
          400: { description: "userId yo'q" },
        },
      },
    },
    "/api/messages/unread/count": {
      get: {
        tags: ["Messages"],
        summary: "O'qilmagan xabarlar soni",
        security: auth,
        responses: { 200: ok(), 401: errs[401] },
      },
    },
    "/api/messages/{conversationId}": {
      get: {
        tags: ["Messages"],
        summary: "Suhbatdagi xabarlar",
        security: auth,
        parameters: [idParam("conversationId", "Suhbat ID")],
        responses: { 200: ok(), 403: ok("Ruxsat yo'q"), 404: errs[404] },
      },
      post: {
        tags: ["Messages"],
        summary: "Xabar yuborish (matn yoki media)",
        security: auth,
        parameters: [idParam("conversationId", "Suhbat ID")],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  media: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Yuborildi",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Message" },
              },
            },
          },
          400: { description: "Bo'sh xabar" },
          403: ok("Ruxsat yo'q"),
        },
      },
    },

    // ====================== NOTIFICATIONS ======================
    "/api/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Bildirishnomalar",
        security: auth,
        responses: { 200: ok(), 401: errs[401] },
      },
    },
    "/api/notifications/unread/count": {
      get: {
        tags: ["Notifications"],
        summary: "O'qilmagan bildirishnomalar soni",
        security: auth,
        responses: { 200: ok(), 401: errs[401] },
      },
    },
    "/api/notifications/read": {
      put: {
        tags: ["Notifications"],
        summary: "Barchasini o'qilgan deb belgilash",
        security: auth,
        responses: { 200: ok(), 401: errs[401] },
      },
    },
    "/api/notifications/{id}": {
      delete: {
        tags: ["Notifications"],
        summary: "Bildirishnomani o'chirish",
        security: auth,
        parameters: [idParam("id", "Bildirishnoma ID")],
        responses: { 200: ok("O'chirildi"), 404: errs[404] },
      },
    },
  },
};

export default swaggerSpec;
