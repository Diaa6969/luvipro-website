import { isSiteLocale, type SiteLocale } from "@/lib/site-locales";
import { westernTranslations } from "./translations-west";
import { easternTranslations } from "./translations-east";
import { northernTranslations } from "./translations-north";

/**
 * Core localized European landing/store/report/help copy, without external
 * translation APIs or transfer of customer data to third parties.
 * DE has its established full pages; EN/AR retain their full bespoke homepages.
 */
export const translationFields = [
  "navHome","navDevice","navReports","navPartners","navContact","language",
  "tagline","headline","intro","features",
  "uvTitle","uvText","vinTitle","vinText","pdfTitle","pdfText",
  "prices","priceNote","order","reportTitle","reportText","reportCta",
  "partnerTitle","partnerText","partnerCta","trustTitle","trustText",
  "legalNote","germanCheckout","app","back","vinLabel","reportLabel",
  "search","searchNotice","bundle",
] as const;
export type TranslationField = (typeof translationFields)[number];
export type SiteTranslation = Record<TranslationField,string>;

const english: SiteTranslation = {
  navHome:"Home", navDevice:"Inspection device", navReports:"Reports", navPartners:"Partner workshops", navContact:"Contact",
  language:"Language", tagline:"Every vehicle has a story. We bring the truth to light.",
  headline:"See more of a vehicle's story with LUVIPRO.",
  intro:"Professional UV inspection equipment, structured vehicle checks and digital reports for the used-car market.",
  features:"What LUVIPRO connects",
  uvTitle:"UV inspection", uvText:"365 nm UV equipment supports professional paint inspection in partner workshops.",
  vinTitle:"VIN-based identification", vinText:"Find the vehicle's inspection reference by its VIN or individual report number.",
  pdfTitle:"Digital inspection reports", pdfText:"Understand documented findings. Access to complete reports requires authorization.",
  prices:"Services and prices", priceNote:"Standard €59.99 and Premium €119.99 per vehicle including 19% German VAT. Device €3,000 net, plus delivery and applicable VAT.",
  order:"View device and ordering", reportTitle:"Find an inspection report",
  reportText:"Search by the 17-character VIN or individual report number. An identifier alone never grants private report access.",
  reportCta:"Search report", partnerTitle:"Partner workshop network",
  partnerText:"LUVIPRO is building a network of qualified inspection workshops. Check availability for your region.",
  partnerCta:"Find partner workshops",trustTitle:"Clear results. Protected data.",
  trustText:"UV-supported inspection helps document findings; it does not guarantee that a vehicle is defect-free.",
  legalNote:"Legal notices, privacy terms and binding checkout information are currently provided in German.",
  germanCheckout:"Continue to German checkout",app:"LUVIPRO App",back:"Back",
  vinLabel:"Vehicle identification number (VIN)",reportLabel:"Report number",search:"Prepare search reference",
  searchNotice:"For protected reports, open the LUVIPRO app and sign in. The website does not yet enable private PDF downloads.",
  bundle:"Included: two batteries, charger, carrying case and safety glasses.",
};
const arabic: SiteTranslation = {
  navHome:"الرئيسية",navDevice:"جهاز الفحص",navReports:"التقارير",navPartners:"الورش الشريكة",navContact:"التواصل",
  language:"اللغة",tagline:"لكل سيارة قصة. نحن نسلّط الضوء على الحقيقة.",
  headline:"اكتشف المزيد عن قصة السيارة مع LUVIPRO.",
  intro:"أجهزة فحص بالأشعة فوق البنفسجية، وفحوص منظمة للسيارات، وتقارير رقمية لسوق السيارات المستعملة.",
  features:"ما الذي تربطه LUVIPRO",
  uvTitle:"الفحص بالأشعة فوق البنفسجية",uvText:"جهاز 365 نانومتر يدعم الفحص المهني للطلاء في الورش الشريكة.",
  vinTitle:"التعريف برقم الهيكل",vinText:"ابحث عن التقرير باستخدام رقم الهيكل VIN أو رقم التقرير المستقل.",
  pdfTitle:"تقارير فحص رقمية",pdfText:"اطّلع على النتائج الموثقة. الوصول إلى التقارير الكاملة يتطلب صلاحية.",
  prices:"الخدمات والأسعار",priceNote:"Standard بسعر 59,99 € وPremium بسعر 119,99 € شامل ضريبة 19%. الجهاز 3.000 € صافي قبل الشحن والضريبة.",
  order:"الجهاز والطلب",reportTitle:"ابحث عن تقرير فحص",
  reportText:"ابحث باستخدام رقم الهيكل المكوّن من 17 خانة أو رقم التقرير. معرفة الرقم وحدها لا تمنح حق الوصول.",
  reportCta:"البحث عن تقرير",partnerTitle:"شبكة الورش الشريكة",
  partnerText:"تعمل LUVIPRO على بناء شبكة ورش متخصصة. تحقق من توافر الخدمة في منطقتك.",
  partnerCta:"ابحث عن ورش شريكة",trustTitle:"نتائج واضحة وبيانات محمية",
  trustText:"يساعد الفحص بالأشعة فوق البنفسجية على توثيق النتائج، لكنه لا يضمن خلو السيارة من العيوب.",
  legalNote:"المعلومات القانونية والخصوصية وشروط الشراء الملزمة متاحة حاليًا بالألمانية.",
  germanCheckout:"المتابعة إلى الطلب بالألمانية",app:"تطبيق LUVIPRO",back:"عودة",
  vinLabel:"رقم هيكل السيارة VIN",reportLabel:"رقم التقرير",search:"تجهيز مرجع البحث",
  searchNotice:"لعرض التقارير المحمية افتح تطبيق LUVIPRO وسجّل الدخول. تحميل PDF الخاص لم يُفعّل على الموقع بعد.",
  bundle:"يشمل بطاريتين وشاحنًا وحقيبة نقل ونظارات حماية.",
};
const raw: Record<string, SiteTranslation> = {en: english, ar: arabic, ...westernTranslations, ...easternTranslations, ...northernTranslations};
export function siteTranslation(locale: string): SiteTranslation {
  // German marketing pages remain full native-German originals.
  if (!isSiteLocale(locale)) return english;
  return raw[locale] ?? english;
}
export function translatedSiteLocales(): SiteLocale[] {
  return Object.keys(raw).filter(isSiteLocale);
}
