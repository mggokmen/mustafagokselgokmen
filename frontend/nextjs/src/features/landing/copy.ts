import type { Locale } from "@/lib/i18n/locale";

/**
 * Everything the public pages say, in both languages. The shape is one type, so a missing
 * translation is a type error rather than an English sentence appearing on the Turkish page
 * ([ADR-013](../../../../docs/decisions/013-public-pages-in-two-languages.md)).
 *
 * The Turkish is not a translation of the English. It is written for a reader who may not work in
 * software: short sentences, ordinary words, and a technical term explained the first time it is
 * used. The claims are the same; the sentences are not.
 *
 * Numbers are not translated: they come from a test runner, and a runner has no language.
 */

type Fact = { value: string; label: string; detail: string };
type Decision = { title: string; body: string; proof: string };
type Card = { title: string; body: string };
type Section = { eyebrow: string; title: string; lead?: string };

export type LandingCopy = {
  nav: {
    sections: string;
    architecture: string;
    evidence: string;
    decisions: string;
    work: string;
  };
  header: { send: string; language: string };
  hero: {
    role: string;
    lede: string;
    body: string;
    tryIt: string;
    readSource: string;
  };
  terminal: { title: string; caption: string };
  architecture: Section & { cards: [Card, Card, Card] };
  evidence: Section & { facts: [Fact, Fact, Fact, Fact] };
  decisions: Section & { items: [Decision, Decision, Decision, Decision] };
  work: Section & {
    summaries: { notorite: string; mapsstar: string };
    platforms: Record<string, string>;
  };
  stack: Section;
  contact: Section & { body: string; send: string; note?: string };
  footer: { built: string; onGitHub: string; email: string; privacy: string };
  diagram: {
    label: string;
    holdsTokens: string;
    planned: string;
    otherBackends: string;
    oneTransaction: string;
    consumer: string;
    inProduction: string;
    notDeployed: string;
  };
};

const EN: LandingCopy = {
  nav: {
    sections: "Sections",
    architecture: "Architecture",
    evidence: "Evidence",
    decisions: "Decisions",
    work: "Work",
  },
  header: { send: "Send a message", language: "Türkçe" },
  hero: {
    role: "Senior Software Developer · 20+ years",
    lede: "I build systems where the hard parts are handled rather than hoped for: identity, event delivery, concurrency and the boundary between services.",
    body: "This site is the system it describes. One API contract, implemented in Spring Boot and consumed by this web app, with an event pipeline behind it. Everything below is running or in the repository, and the parts that are not deployed say so.",
    tryIt: "Try the application",
    readSource: "Read the source",
  },
  terminal: {
    title: "the live API",
    caption:
      "Every error is a problem detail (RFC 9457) carrying a code a client can branch on, described in the contract before it was implemented.",
  },
  architecture: {
    eyebrow: "Architecture",
    title: "A contract first, then everything else",
    lead: "The specification is written before the code. Server interfaces, client types and the test suite all come from it, so a disagreement about the API surfaces at build time instead of in production.",
    cards: [
      {
        title: "Backend-for-frontend",
        body: "The browser talks only to the Next.js server, which holds the tokens and calls the API. The backend takes a bearer token and never a cookie, so it needs no CORS. The session cookies are SameSite=Lax, and every change is checked against the origin it came from.",
      },
      {
        title: "Transactional outbox",
        body: "The change and its event are committed together. Publishing happens afterwards, so a broker outage cannot roll back a request.",
      },
      {
        title: "A consumer that can fail",
        body: "Delivery is at least once, so handling is idempotent: each event id is claimed before the work, retried with a back-off, then dead-lettered.",
      },
    ],
  },
  evidence: {
    eyebrow: "Evidence",
    title: "Numbers that come from a test runner",
    lead: "Not estimates. Each of these is printed by a tool in continuous integration, on every pull request.",
    facts: [
      {
        value: "166",
        label: "automated tests",
        detail: "63 API · 7 consumer · 60 web · 36 browser",
      },
      { value: "2,889", label: "generated contract cases", detail: "every run explores new input" },
      { value: "13", label: "decision records", detail: "each one says what it costs" },
      { value: "12", label: "checks before a merge", detail: "including three image scans" },
    ],
  },
  decisions: {
    eyebrow: "Decisions",
    title: "Four problems, and what was done about them",
    lead: "Each of these is recorded as a decision record in the repository, including what it costs and what was given up.",
    items: [
      {
        title: "The browser never holds a token",
        body: "Sign-in runs as an OAuth code flow on the server. The browser gets HttpOnly cookies and nothing else. Concurrent requests share a single refresh, because refresh tokens rotate and reusing one revokes the whole family.",
        proof:
          "Found by a browser test: a prefetched link and its page refreshed at once and signed the user out.",
      },
      {
        title: "An event cannot be lost",
        body: "A message and the event it produces are written in one transaction. A publisher drains the table afterwards, so a broker being down never rolls back a request and never swallows an event.",
        proof:
          "The consumer claims each event id before acting, retries with a growing pause, and dead-letters what it cannot handle.",
      },
      {
        title: "One contract, measured not assumed",
        body: "The OpenAPI document is written first. Server interfaces and client types are generated from it, and every backend is checked against the same suite, unchanged.",
        proof:
          "Schemathesis found nine real defects, from a NUL byte crash to an empty filter becoming invalid SQL.",
      },
      {
        title: "Concurrency has an answer",
        body: "Two administrators editing one message do not overwrite each other: the version travels in the form and the backend refuses the stale one with 409.",
        proof:
          "A test drives two browsers at the same message to produce the conflict, rather than simulating it.",
      },
    ],
  },
  work: {
    eyebrow: "Other work",
    title: "Products I build and run",
    lead: "Outside this repository, and live. Each link goes to the running product.",
    summaries: {
      notorite:
        "Reads marketplace reviews and complaint history and turns them into one trust score per product, seller and brand, so a shopper gets an answer instead of a star average.",
      mapsstar:
        "A bid holds an administrative region on a world map until someone bids higher. No combat and no resources: the whole mechanic is the standing bid, settled with tokens bought in the apps.",
    },
    platforms: {
      Web: "Web",
      "Browser extension": "Browser extension",
      Android: "Android",
      iOS: "iOS",
    },
  },
  stack: { eyebrow: "Stack", title: "What it is built with" },
  contact: {
    eyebrow: "Contact",
    title: "Get in touch",
    body: "The fastest way to see how this works is to use it: sign in and send a message, then watch it move through the workflow.",
    send: "Send a message",
  },
  footer: {
    built: "Built by Mustafa Göksel Gökmen. The source is",
    onGitHub: "on GitHub",
    email: "Email",
    privacy: "Privacy",
  },
  diagram: {
    label:
      "One OpenAPI contract drives the API and its clients. A request writes a contact message and an event in one transaction; the event is published to Kafka and consumed by a separate notification service.",
    holdsTokens: "holds the tokens",
    planned: "planned",
    otherBackends: "Go · .NET · FastAPI planned",
    oneTransaction: "ONE TRANSACTION",
    consumer: "+ consumer",
    inProduction: "in production",
    notDeployed: "built and tested, not deployed",
  },
};

const TR: LandingCopy = {
  nav: {
    sections: "Bölümler",
    architecture: "Mimari",
    evidence: "Sayılar",
    decisions: "Kararlar",
    work: "Projeler",
  },
  header: { send: "Mesaj gönder", language: "English" },
  hero: {
    role: "Kıdemli Yazılım Geliştirici · 20 yılı aşkın deneyim",
    lede: "Güvenilir yazılımlar geliştiriyorum. Zor konular üzerinde çalışıyorum: kullanıcı girişi, mesajların kaybolmadan iletilmesi ve aynı anda yapılan değişiklikler.",
    body: "Bu web sitesi, geliştirdiğim sistemin bir parçasıdır. Sistemin kuralları önce bir API tanımında yazılır. Sunucu Spring Boot ile yazıldı. Bu site de o sunucuyu kullanır. Aşağıda çalışan özellikleri ve henüz yayına alınmamış çalışmaları görebilirsiniz.",
    tryIt: "Uygulamayı deneyin",
    readSource: "Kaynak kodu",
  },
  terminal: {
    title: "canlı API",
    caption:
      "Bu, sunucunun gerçek cevabıdır. Hata olduğunda cevap her zaman aynı biçimdedir. İçinde bir hata kodu bulunur. Uygulamalar bu koda bakarak ne yapacağına karar verir.",
  },
  architecture: {
    eyebrow: "Mimari",
    title: "Önce tanım, sonra kod",
    lead: "Önce sistemin nasıl çalışacağını tanımlıyorum. Sonra kodu yazıyorum. Sunucu ve istemci kodunun bir kısmı bu tanımdan otomatik üretiliyor. Böylece uyumsuzluklar yayına çıkmadan önce ortaya çıkıyor.",
    cards: [
      {
        title: "Web arayüzü için özel sunucu (BFF)",
        body: "Tarayıcı, API ile doğrudan konuşmaz. Arada bu sitenin kendi sunucusu vardır. Oturum bilgileri o sunucuda kalır. Tarayıcıdaki JavaScript bu bilgileri okuyamaz. Her değişiklik isteğinde, isteğin nereden geldiği kontrol edilir.",
      },
      {
        title: "Mesaj ve olay birlikte kaydedilir",
        body: "Sistem, mesajı ve o mesajla ilgili olayı birlikte kaydeder. Olay daha sonra gönderilir. Gönderim başarısız olsa bile kayıt kaybolmaz.",
      },
      {
        title: "Aynı mesaj iki kez gelirse",
        body: "Bir mesaj bazen iki kez gelebilir. Sistem onu yalnızca bir kez işler. Buna idempotent denir. İşlenemeyen mesajlar ayrı bir kuyruğa alınır ve kaybolmaz.",
      },
    ],
  },
  evidence: {
    eyebrow: "Sayılar",
    title: "Sayılar otomatik testlerden geliyor",
    lead: "Bu sayılar tahmin değil. Kod değişiklikleri birleştirilmeden önce testler otomatik çalışır. Testler sistemin doğru çalıştığını kontrol eder. Buradaki sayılar o testlerin sonucudur.",
    facts: [
      {
        value: "166",
        label: "otomatik test",
        detail: "63 API · 7 tüketici · 60 web · 36 tarayıcı",
      },
      {
        value: "2,889",
        label: "otomatik üretilen test senaryosu",
        detail: "her koşuda farklı veriler denenir",
      },
      { value: "13", label: "karar kaydı", detail: "her biri kararın nedenini yazar" },
      { value: "12", label: "birleştirme öncesi kontrol", detail: "üçü güvenlik taraması" },
    ],
  },
  decisions: {
    eyebrow: "Kararlar",
    title: "Dört problem ve her birine ne yapıldığı",
    lead: "Her kararı depoda ayrı bir dosyada yazıyorum. Her dosya kararın nedenini ve neyden vazgeçildiğini anlatır.",
    items: [
      {
        title: "Tarayıcıda oturum anahtarı tutulmaz",
        body: "Giriş işlemi sunucuda yapılır. Tarayıcıya yalnızca özel çerezler gönderilir. Bu çerezleri sayfadaki JavaScript okuyamaz. Oturum anahtarı her yenilemede değişir ve eski anahtar bir daha kullanılamaz.",
        proof:
          "Bu kuralın bir hatası vardı ve onu bir tarayıcı testi buldu. İki istek aynı anda yenileme yaptı ve kullanıcı sistemden çıktı. Hata giderildi.",
      },
      {
        title: "Mesajlar kaybolmaz",
        body: "Sistem, mesajı ve olayını tek bir işlemde kaydeder. İkisi birlikte kaydedilir ya da hiçbiri kaydedilmez. Olayı gönderen servis kapalı olsa bile kayıt yerinde durur.",
        proof:
          "Olaylar daha sonra sırayla gönderilir. Gönderilemeyen bir olay yeniden denenir. Yine olmazsa ayrı bir kuyruğa alınır.",
      },
      {
        title: "Tek bir API tanımı",
        body: "Tek bir API tanımı kullanıyorum ve bu tanımı test ediyorum. Sunucu kodunun bir kısmı ve istemci tipleri bu tanımdan üretiliyor. Farklı dillerde yazılacak tüm sunucular aynı testlerle kontrol ediliyor.",
        proof:
          "Testler dokuz gerçek hata buldu. Örneğin boş bırakılan bir filtre, hatalı bir veritabanı sorgusu üretiyordu.",
      },
      {
        title: "Aynı anda yapılan değişiklikler",
        body: "İki yönetici aynı mesajı aynı anda değiştirebilir. Sistem bunu fark eder ve ikinci değişikliği reddeder. Böylece kimsenin yaptığı değişiklik kaybolmaz.",
        proof:
          "Bir testte iki tarayıcı aynı mesajı aynı anda değiştirir. Sistem çakışmayı tespit eder ve ikinci isteği geri çevirir.",
      },
    ],
  },
  work: {
    eyebrow: "Projeler",
    title: "Geliştirdiğim ve işlettiğim ürünler",
    lead: "Bu projenin dışında, şu anda yayında olan ürünler. Bağlantılardan ürünleri inceleyebilirsiniz.",
    summaries: {
      notorite:
        "Pazaryerlerindeki yorumları ve şikâyetleri okur. Her ürün, satıcı ve marka için tek bir güven puanı verir. Böylece alıcı, yıldız ortalamasına bakmak yerine net bir cevap görür.",
      mapsstar:
        "Dünya haritasındaki bölgeler için teklif verilir. En yüksek teklifi veren kişi o bölgeyi elinde tutar. Daha yüksek bir teklif gelirse bölge el değiştirir. Teklifler, uygulamadan alınan jetonlarla verilir.",
    },
    platforms: {
      Web: "Web",
      "Browser extension": "Tarayıcı eklentisi",
      Android: "Android",
      iOS: "iOS",
    },
  },
  stack: { eyebrow: "Teknolojiler", title: "Neyle geliştirildi" },
  contact: {
    eyebrow: "İletişim",
    title: "İletişime geçin",
    body: "En hızlı yol uygulamayı denemek: giriş yapın ve bir mesaj gönderin. Sonra mesajınızın durumunu takip edebilirsiniz.",
    send: "Mesaj gönder",
    note: "Uygulamanın giriş sonrası ekranları şimdilik yalnızca İngilizce.",
  },
  footer: {
    built: "Mustafa Göksel Gökmen tarafından geliştirildi. Kaynak kodu",
    onGitHub: "GitHub'da",
    email: "E-posta",
    privacy: "Gizlilik",
  },
  diagram: {
    label:
      "Tek bir API tanımı hem sunucuyu hem istemcileri belirler. Bir istek, mesajı ve olayını tek işlemde kaydeder. Olay sonra gönderilir ve ayrı bir servis onu alır.",
    holdsTokens: "oturumu tutar",
    planned: "planlanan",
    otherBackends: "Go · .NET · FastAPI planlanan",
    oneTransaction: "TEK İŞLEMDE",
    consumer: "+ alıcı servis",
    inProduction: "yayında",
    notDeployed: "yazıldı ve test edildi, henüz yayında değil",
  },
};

export const LANDING_COPY: Record<Locale, LandingCopy> = { en: EN, tr: TR };
