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
        "an identifier Google uses for your account (the `sub` claim), which is what identifies you here â not your email address",
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
        "`access_token` â proves who you are for about 15 minutes",
        "`refresh_token` â gets a new access token for up to 30 days, and is replaced every time it is used",
        "`sign_in` â exists for ten minutes during sign-in, to verify that the response coming back from Google belongs to the request this site made",
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
        "You can see your own messages. An administrator â the person who runs this site â can see every message together with the name and email address of whoever sent it, in order to work through them. Nothing is sold, and nothing is shared for advertising.",
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
        address: "iletisim@mustafagokselgokmen.com.tr",
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
    "Bu bir portföy projesidir. Küçük ama gerçek bir uygulamadır. Giriş yapan kişiler hakkında gerçek veri tutar. Bu sayfa, tam olarak hangi verilerin tutulduğunu anlatır.",
  updated: "Son güncelleme: 12 Ekim 2026",
  sections: [
    {
      title: "Giriş yaptığınızda ne saklanır",
      paragraphs: [
        "Giriş Google ile yapılır. Bu site Google parolanızı görmez. Google şu bilgileri verir:",
      ],
      bullets: [
        "Google hesabınızın kimlik numarası (`sub` değeri). Sizi burada bu numara tanımlar, e-posta adresiniz değil.",
        "e-posta adresiniz",
        "adınız",
        "profil fotoğrafınızın adresi",
      ],
    },
    {
      title: "Mesaj gönderdiğinizde ne saklanır",
      paragraphs: [],
      bullets: [
        "yazdığınız konu ve mesaj",
        "mesajın durumu: yeni, işlemde veya çözüldü",
        "mesajın gönderilme ve son değişiklik zamanı",
        "mesajın hangi hesaba ait olduğu",
      ],
    },
    {
      title: "Çerezler",
      paragraphs: [
        "Üç çerez kullanılır. Üçü de `HttpOnly` işaretlidir. Yani sayfadaki JavaScript bunları okuyamaz. Hiçbiri reklam veya takip için kullanılmaz.",
      ],
      bullets: [
        "`access_token` — yaklaşık 15 dakika boyunca kim olduğunuzu doğrular",
        "`refresh_token` — 30 güne kadar yeni giriş anahtarı alır. Her kullanımda yenisiyle değişir.",
        "`sign_in` — giriş sırasında on dakika yaşar. Google'dan gelen cevabın doğru olduğunu kontrol eder.",
      ],
    },
    {
      title: "Sunucu kayıtları",
      paragraphs: [
        "Sunucu, gelen istekleri IP adresiyle birlikte kaydeder. IP adresiniz ayrıca kısa süre bellekte tutulur. Bunun tek amacı çok sık giriş ve mesaj denemesini engellemektir. Bu bilgi veritabanına yazılmaz.",
      ],
    },
    {
      title: "Kimler görebilir",
      paragraphs: [
        "Kendi mesajlarınızı siz görürsünüz. Yönetici — yani bu siteyi işleten kişi — tüm mesajları görür. Mesajla birlikte gönderenin adını ve e-posta adresini de görür. Bunun amacı mesajları yanıtlayabilmektir. Hiçbir veri satılmaz ve reklam için paylaşılmaz.",
        "Üç kuruluş zorunlu olarak işin içindedir:",
      ],
      bullets: [
        "**Google**: girişinizi doğrular. O adım için Google'ın gizlilik politikası geçerlidir.",
        "**Cloudflare**: siteye gelen trafik buradan geçer.",
        "**Barındırma sağlayıcısı**: uygulamanın çalıştığı sunucuyu sağlar.",
      ],
    },
    {
      title: "Ne kadar süre saklanır",
      paragraphs: [
        "Hesabınız ve mesajlarınız silinene kadar saklanır. Giriş anahtarları 30 gün sonra geçersiz olur. Anahtarın kendisi saklanmaz; yalnızca şifrelenmiş bir özeti saklanır.",
      ],
    },
    {
      title: "Verilerinizi sildirmek",
      paragraphs: [],
      email: {
        before: "Giriş yaptığınız adresten",
        address: "iletisim@mustafagokselgokmen.com.tr",
        after:
          "adresine yazın. Hesabınız ve mesajlarınız silinir. Şu an uygulamada silme düğmesi yok. Bu sayfa aksini söyleseydi doğru olmazdı.",
      },
    },
  ],
  back: "Ana sayfaya dön",
};

export const PRIVACY_COPY: Record<Locale, PrivacyCopy> = { en: EN, tr: TR };
