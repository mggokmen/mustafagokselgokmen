import type { Locale } from "@/lib/i18n/locale";

/**
 * The privacy policy, in both languages. It is written from the schema and the cookie helpers
 * rather than from a template, so a change to what is stored is a change here too.
 *
 * `**bold**` and `` `code` `` are the only markup; see `inline.tsx` for why that is enough.
 */

export type PrivacySection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  /** A paragraph that ends in an email address, which has to be a link. */
  email?: { before: string; address: string; after: string };
};

export type PrivacyCopy = {
  title: string;
  intro: string;
  updated: string;
  sections: PrivacySection[];
  back: string;
};

const EN: PrivacyCopy = {
  title: "Privacy",
  intro:
    "This is a portfolio project: a small but real application, built to demonstrate how one API contract is implemented across several platforms. It holds real data about the people who sign in, so this page says exactly what that is.",
  updated: "Last updated: 11 October 2026",
  sections: [
    {
      title: "What is stored when you sign in",
      paragraphs: [
        "Signing in happens through Google. This site never sees your Google password. Google tells it:",
      ],
      bullets: [
        "an identifier Google uses for your account (the `sub` claim), which is what identifies you here — not your email address",
        "your email address",
        "your display name",
        "the address of your profile picture",
      ],
    },
    {
      title: "What is stored when you send a message",
      paragraphs: [],
      bullets: [
        "the subject and the text you wrote",
        "its status, as it moves from new to in progress to resolved",
        "when it was sent and last changed",
        "a reference to your account",
      ],
    },
    {
      title: "Cookies",
      paragraphs: [
        "Three cookies, all of them `HttpOnly`: JavaScript in your browser cannot read them, and none of them is used for advertising or analytics.",
      ],
      bullets: [
        "`access_token` — proves who you are for about 15 minutes",
        "`refresh_token` — gets a new access token for up to 30 days, and is replaced every time it is used",
        "`sign_in` — exists for ten minutes during sign-in, to verify that the response coming back from Google belongs to the request this site made",
      ],
    },
    {
      title: "Server logs",
      paragraphs: [
        "The web server records requests, including IP addresses, as web servers do. Your IP address is also counted temporarily, in memory, to limit how often sign-in and message sending can be attempted. It is not stored in the database.",
      ],
    },
    {
      title: "Who can see it",
      paragraphs: [
        "You can see your own messages. An administrator — the person who runs this site — can see every message together with the name and email address of whoever sent it, in order to work through them. Nothing is sold, and nothing is shared for advertising.",
        "Three other parties are necessarily involved:",
      ],
      bullets: [
        "**Google**, which authenticates you. Its own privacy policy applies to that step.",
        "**Cloudflare**, through which traffic to this site passes",
        "**the hosting provider** of the server the application runs on",
      ],
    },
    {
      title: "How long it is kept",
      paragraphs: [
        "Your account and your messages are kept until they are deleted. Refresh tokens expire after 30 days, and are stored hashed rather than as the value your browser holds.",
      ],
    },
    {
      title: "Having your data deleted",
      paragraphs: [],
      email: {
        before: "Write to",
        address: "mustafagokselgokmen@gmail.com",
        after:
          "from the address you signed in with, and the account and its messages will be removed. There is no self-service deletion button yet; this page would be dishonest if it claimed otherwise.",
      },
    },
  ],
  back: "Back to the home page",
};

const TR: PrivacyCopy = {
  title: "Gizlilik",
  intro:
    "Bu bir portföy projesi: tek bir API sözleşmesinin birkaç platformda nasıl uygulandığını göstermek için yazılmış, küçük ama gerçek bir uygulama. Giriş yapan kişiler hakkında gerçek veri tutuyor; bu sayfa da tam olarak neyi tuttuğunu yazıyor.",
  updated: "Son güncelleme: 12 Ekim 2026",
  sections: [
    {
      title: "Giriş yaptığınızda ne saklanıyor",
      paragraphs: [
        "Giriş Google üzerinden yapılıyor. Bu site Google parolanızı hiçbir zaman görmüyor. Google ona şunları söylüyor:",
      ],
      bullets: [
        "Google'ın hesabınız için kullandığı kimlik (`sub` değeri) — sizi burada tanımlayan şey bu, e-posta adresiniz değil",
        "e-posta adresiniz",
        "görünen adınız",
        "profil fotoğrafınızın adresi",
      ],
    },
    {
      title: "Mesaj gönderdiğinizde ne saklanıyor",
      paragraphs: [],
      bullets: [
        "yazdığınız konu ve metin",
        "durumu: yeni, işlemde ve çözüldü arasında ilerlerken",
        "ne zaman gönderildiği ve en son ne zaman değiştiği",
        "hesabınıza bir referans",
      ],
    },
    {
      title: "Çerezler",
      paragraphs: [
        "Üç çerez, üçü de `HttpOnly`: tarayıcınızdaki JavaScript bunları okuyamaz ve hiçbiri reklam veya analiz için kullanılmaz.",
      ],
      bullets: [
        "`access_token` — yaklaşık 15 dakika boyunca kim olduğunuzu kanıtlar",
        "`refresh_token` — 30 güne kadar yeni erişim token'ı alır ve her kullanıldığında yenisiyle değiştirilir",
        "`sign_in` — giriş sırasında on dakika yaşar; Google'dan dönen yanıtın bu sitenin yaptığı isteğe ait olduğunu doğrular",
      ],
    },
    {
      title: "Sunucu kayıtları",
      paragraphs: [
        "Web sunucusu, web sunucularının yaptığı gibi istekleri IP adresleriyle birlikte kaydediyor. IP adresiniz ayrıca, giriş ve mesaj gönderme denemelerini sınırlamak için bellekte geçici olarak sayılıyor. Veritabanına yazılmıyor.",
      ],
    },
    {
      title: "Kimler görebiliyor",
      paragraphs: [
        "Kendi mesajlarınızı siz görebiliyorsunuz. Bir yönetici — bu siteyi işleten kişi — mesajları ele alabilmek için her mesajı, gönderenin adı ve e-posta adresiyle birlikte görebiliyor. Hiçbir şey satılmıyor, reklam için hiçbir şey paylaşılmıyor.",
        "Zorunlu olarak işin içinde olan üç taraf var:",
      ],
      bullets: [
        "**Google**, sizi doğrulayan taraf. O adım için kendi gizlilik politikası geçerli.",
        "**Cloudflare**, bu siteye gelen trafiğin üzerinden geçtiği taraf",
        "uygulamanın çalıştığı sunucunun **barındırma sağlayıcısı**",
      ],
    },
    {
      title: "Ne kadar süre saklanıyor",
      paragraphs: [
        "Hesabınız ve mesajlarınız silinene kadar saklanıyor. Refresh token'lar 30 gün sonra geçersiz oluyor ve tarayıcınızdaki değerin kendisi yerine özetlenmiş (hash'lenmiş) hâli saklanıyor.",
      ],
    },
    {
      title: "Verilerinizin silinmesi",
      paragraphs: [],
      email: {
        before: "Giriş yaptığınız adresten",
        address: "mustafagokselgokmen@gmail.com",
        after:
          "adresine yazın; hesap ve mesajları kaldırılsın. Henüz kendi kendine silme düğmesi yok; bu sayfa aksini iddia etseydi dürüst olmazdı.",
      },
    },
  ],
  back: "Ana sayfaya dön",
};

export const PRIVACY_COPY: Record<Locale, PrivacyCopy> = { en: EN, tr: TR };
