// Per-page SEO copy: title, meta description, H1, intro, H2 sections and a page FAQ.
// One file per language (pl.ts, en.ts, ...), each written natively for that language.

export interface Section {
  h2: string;
  body: string[]; // paragraphs
  list?: string[]; // optional bullet list shown after the paragraphs
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface PageCopy {
  title: string; // under 60 characters
  desc: string; // 140–160 characters
  h1: string;
  intro: string; // first paragraph under the H1, carries the primary keyword
  sections: Section[];
  faq: FaqItem[]; // 3–5 questions, rendered with FAQPage schema; [] for none
}

export interface HomeCopy {
  title: string;
  desc: string;
  aboutH2: string;
  about: string[]; // paragraphs in the "about" block under the hero
}

export interface SiteCopy {
  home: HomeCopy;
  recording: PageCopy;
  rehearsals: PageCopy;
  rent: PageCopy;
  price: PageCopy;
  contact: PageCopy;
  voucher: PageCopy;
  podcast: PageCopy;
  ui: {
    nav_voucher: string; // menu label for /voucher/
    nav_podcast: string; // menu label for /podcast/
    directions_link: string; // "Plan your route on Google Maps"-style link text
    faq_page_title: string; // heading above a page's FAQ, e.g. "Pytania i odpowiedzi"
  };
}
