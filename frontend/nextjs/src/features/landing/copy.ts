import type { Locale } from "@/lib/i18n/locale";

/**
 * Everything the public pages say, in both languages. The shape is one type, so a missing
 * translation is a type error rather than an English sentence appearing on the Turkish page
 * ([ADR-013](../../../../docs/decisions/013-public-pages-in-two-languages.md)).
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
        body: "The browser talks only to the Next.js server, which keeps the tokens and calls the API. No CORS, no CSRF handling, and nothing in browser storage to steal.",
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
        value: "160",
        label: "automated tests",
        detail: "63 API · 7 consumer · 57 web · 33 browser",
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
    evidence: "Kanıt",
    decisions: "Kararlar",
    work: "Projeler",
  },
  header: { send: "Mesaj gönder", language: "English" },
  hero: {
    role: "Kıdemli Yazılım Geliştirici · 20+ yıl",
    lede: "Zor kısımları şansa bırakmayan sistemler kuruyorum: kimlik, olay teslimi, eşzamanlılık ve servisler arasındaki sınır.",
    body: "Bu site, anlattığı sistemin kendisi. Tek bir API sözleşmesi, Spring Boot ile yazılmış bir sunucu, onu tüketen bu web uygulaması ve arkasında bir olay hattı. Aşağıdaki her şey ya çalışıyor ya da depoda duruyor; yayında olmayan parçalar bunu kendisi söylüyor.",
    tryIt: "Uygulamayı dene",
    readSource: "Kaynak kodu",
  },
  terminal: {
    title: "canlı API",
    caption:
      "Her hata, istemcinin üzerinde dallanabileceği bir code taşıyan bir problem detail (RFC 9457). Yazılmadan önce sözleşmede tanımlandı.",
  },
  architecture: {
    eyebrow: "Mimari",
    title: "Önce sözleşme, sonra gerisi",
    lead: "Şartname koddan önce yazılıyor. Sunucu arayüzleri, istemci tipleri ve test takımı ondan üretiliyor; böylece API üzerindeki bir anlaşmazlık üretimde değil, derleme anında ortaya çıkıyor.",
    cards: [
      {
        title: "Önyüz için arka uç (BFF)",
        body: "Tarayıcı yalnızca Next.js sunucusuyla konuşuyor; token'ları o tutuyor ve API'yi o çağırıyor. CORS yok, CSRF uğraşı yok, tarayıcı deposunda çalınacak bir şey yok.",
      },
      {
        title: "Transaction'lı outbox",
        body: "Değişiklik ve onun olayı birlikte commit ediliyor. Yayımlama sonradan yapılıyor; böylece broker'ın çökmesi bir isteği geri almıyor.",
      },
      {
        title: "Hata yapabilen bir tüketici",
        body: "Teslim en az bir kez, o yüzden işleme idempotent: her olay kimliği işten önce sahipleniliyor, artan beklemeyle yeniden deneniyor, sonra ölü mektup kuyruğuna gidiyor.",
      },
    ],
  },
  evidence: {
    eyebrow: "Kanıt",
    title: "Sayılar bir test koşucusundan geliyor",
    lead: "Tahmin değil. Buradaki her sayı, her pull request'te sürekli entegrasyonda bir aracın ekrana yazdığı sayı.",
    facts: [
      {
        value: "160",
        label: "otomatik test",
        detail: "63 API · 7 tüketici · 57 web · 33 tarayıcı",
      },
      {
        value: "2,889",
        label: "üretilmiş sözleşme senaryosu",
        detail: "her koşu yeni girdi deniyor",
      },
      { value: "13", label: "karar kaydı", detail: "her biri neye mal olduğunu yazıyor" },
      { value: "12", label: "merge öncesi kontrol", detail: "üçü imaj güvenlik taraması" },
    ],
  },
  decisions: {
    eyebrow: "Kararlar",
    title: "Dört problem ve her birine ne yapıldığı",
    lead: "Her biri depoda bir karar kaydı olarak duruyor; neye mal olduğu ve neyden vazgeçildiği dahil.",
    items: [
      {
        title: "Tarayıcı hiçbir zaman token tutmaz",
        body: "Giriş, sunucuda çalışan bir OAuth code flow. Tarayıcıya yalnızca HttpOnly çerezler gidiyor. Eşzamanlı istekler tek bir yenilemeyi paylaşıyor; çünkü refresh token'lar dönüyor ve birini ikinci kez kullanmak tüm aileyi iptal ediyor.",
        proof:
          "Bir tarayıcı testi buldu: önceden getirilen bir bağlantı ile sayfası aynı anda yenilendi ve kullanıcıyı sistemden attı.",
      },
      {
        title: "Bir olay kaybolamaz",
        body: "Mesaj ve ürettiği olay tek bir transaction'da yazılıyor. Bir yayımcı tabloyu sonradan boşaltıyor; böylece broker'ın kapalı olması ne isteği geri alıyor ne de olayı yutuyor.",
        proof:
          "Tüketici her olay kimliğini iş yapmadan önce sahipleniyor, artan beklemeyle yeniden deniyor ve başaramadığını ölü mektup kuyruğuna koyuyor.",
      },
      {
        title: "Tek sözleşme, varsayılan değil ölçülen",
        body: "Önce OpenAPI belgesi yazılıyor. Sunucu arayüzleri ve istemci tipleri ondan üretiliyor; her arka uç aynı takımla, hiç değiştirilmeden sınanıyor.",
        proof:
          "Schemathesis dokuz gerçek hata buldu: NUL baytının çökerttiği uçtan, boş bir filtrenin geçersiz SQL'e dönüşmesine kadar.",
      },
      {
        title: "Eşzamanlılığın bir cevabı var",
        body: "Aynı mesajı düzenleyen iki yönetici birbirinin üzerine yazmıyor: sürüm numarası formla birlikte gidiyor ve arka uç eski olanı 409 ile reddediyor.",
        proof:
          "Bir test, çakışmayı taklit etmek yerine iki tarayıcıyı aynı mesajın üstüne sürerek gerçekten oluşturuyor.",
      },
    ],
  },
  work: {
    eyebrow: "Diğer işler",
    title: "Geliştirdiğim ve işlettiğim ürünler",
    lead: "Bu deponun dışında ve yayında. Her bağlantı çalışan ürüne gidiyor.",
    summaries: {
      notorite:
        "Pazaryeri yorumlarını ve şikâyet geçmişini okuyup her ürün, satıcı ve marka için tek bir güven puanına çeviriyor; böylece alıcı yıldız ortalaması yerine bir cevap alıyor.",
      mapsstar:
        "Bir teklif, dünya haritasındaki idari bir bölgeyi daha yükseğini veren çıkana kadar elinde tutuyor. Savaş yok, kaynak toplama yok: mekaniğin tamamı, uygulamalardan alınan jetonlarla verilen o teklif.",
    },
    platforms: {
      Web: "Web",
      "Browser extension": "Tarayıcı eklentisi",
      Android: "Android",
      iOS: "iOS",
    },
  },
  stack: { eyebrow: "Teknolojiler", title: "Neyle inşa edildi" },
  contact: {
    eyebrow: "İletişim",
    title: "İletişime geç",
    body: "Nasıl çalıştığını görmenin en hızlı yolu kullanmak: giriş yap, bir mesaj gönder ve iş akışında ilerleyişini izle.",
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
      "Tek bir OpenAPI sözleşmesi API'yi ve istemcilerini sürüyor. Bir istek, iletişim mesajını ve olayını tek transaction'da yazıyor; olay Kafka'ya yayımlanıyor ve ayrı bir bildirim servisi tarafından tüketiliyor.",
    holdsTokens: "token'ları tutar",
    planned: "planlanan",
    otherBackends: "Go · .NET · FastAPI planlanan",
    oneTransaction: "TEK TRANSACTION",
    consumer: "+ tüketici",
    inProduction: "yayında",
    notDeployed: "yazıldı ve test edildi, yayında değil",
  },
};

export const LANDING_COPY: Record<Locale, LandingCopy> = { en: EN, tr: TR };
