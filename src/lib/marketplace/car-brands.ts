/**
 * LUVIPRO Marketplace make catalog. Current and historical passenger-car makes
 * encountered on German/European used-car marketplaces, plus international makes.
 * Search UI must allow custom makes so the static list never blocks a seller.
 * Data checked against ADAC and mobile.de brand directories (Nov 2026).
 * No affiliation with manufacturers is implied.
 */
export const CAR_BRANDS = [
  "Abarth",
  "AC",
  "Acura",
  "Aiways",
  "Aixam",
  "Alfa Romeo",
  "ALPINA",
  "Alpine",
  "Alvis",
  "Ariel",
  "Artega",
  "Asia Motors",
  "Aston Martin",
  "Audi",
  "Austin",
  "Austin Healey",
  "Auto Union",
  "BAIC",
  "Barkas",
  "BAW",
  "Bentley",
  "Bizzarrini",
  "BMW",
  "Boldmen",
  "Borgward",
  "Bovensiepen",
  "Brilliance",
  "Bugatti",
  "Buick",
  "BYD",
  "Cadillac",
  "Casalini",
  "Caterham",
  "Cenntro",
  "Changan",
  "Chatenet",
  "Chevrolet",
  "Chrysler",
  "Citroën",
  "Cobra",
  "Corvette",
  "CUPRA",
  "Dacia",
  "Daewoo",
  "Daihatsu",
  "Dallara",
  "Datsun",
  "De Tomaso",
  "Deepal",
  "Delahaye",
  "DeLorean",
  "Denza",
  "DFM",
  "DFSK",
  "Dodge",
  "Dongfeng",
  "Donkervoort",
  "DS Automobiles",
  "e.GO",
  "Elaris",
  "Estrima",
  "Facel Vega",
  "Ferrari",
  "Fiat",
  "Firefly",
  "Fisker",
  "Ford",
  "Foton",
  "GAC",
  "GAC Gonow",
  "Geely",
  "Gemballa",
  "Genesis",
  "Ginetta",
  "GMC",
  "Great Wall",
  "Grecav",
  "Gumpert",
  "GWM",
  "Hamann",
  "Heinkel",
  "HiPhi",
  "Holden",
  "Honda",
  "Hongqi",
  "Horch",
  "Hummer",
  "Hyundai",
  "IFA",
  "Ineos",
  "Infiniti",
  "Invicta",
  "Isdera",
  "Isuzu",
  "Iveco",
  "JAC",
  "Jaecoo",
  "Jaguar",
  "Jeep",
  "Jetour",
  "Jetta",
  "Jiayuan",
  "KGM",
  "Kia",
  "Koenigsegg",
  "KTM",
  "Lada",
  "Lamborghini",
  "Lancia",
  "Land Rover",
  "Landwind",
  "Leapmotor",
  "LEVC",
  "Lexus",
  "Li Auto",
  "Lifan",
  "Ligier",
  "Lincoln",
  "Linktour",
  "Lotus",
  "Lucid",
  "Lynk & Co",
  "M-HERO",
  "Mahindra",
  "MAN",
  "Maserati",
  "Maxus",
  "Maybach",
  "Mazda",
  "McLaren",
  "Mercedes-Benz",
  "Messerschmitt",
  "MG",
  "Microcar",
  "Microlino",
  "MINI",
  "Mitsubishi",
  "Morgan",
  "Morris",
  "Neta",
  "NIO",
  "Nissan",
  "NSU",
  "Oldsmobile",
  "Omoda",
  "Opel",
  "ORA",
  "Packard",
  "Pagani",
  "Peugeot",
  "Piaggio",
  "Plymouth",
  "Polestar",
  "Pontiac",
  "Porsche",
  "Proton",
  "Renault",
  "Riley",
  "Rimac",
  "Rolls-Royce",
  "Rover",
  "RUF",
  "Saab",
  "Santana",
  "Saturn",
  "Scion",
  "SEAT",
  "SERES",
  "Silence",
  "Simca",
  "Skoda",
  "Smart",
  "speedART",
  "Spyker",
  "SsangYong",
  "Studebaker",
  "Subaru",
  "Suzuki",
  "SWM",
  "Talbot",
  "Tank",
  "Tata",
  "TechArt",
  "Tesla",
  "Togg",
  "Toyota",
  "Trabant",
  "Triumph",
  "TVR",
  "TYN-e",
  "UAZ",
  "Venucia",
  "Vincent",
  "VinFast",
  "Volkswagen",
  "Volvo",
  "Voyah",
  "Wartburg",
  "Westfield",
  "WEY",
  "Wiesmann",
  "Wuling",
  "XEV",
  "Xiaomi",
  "XPENG",
  "Yangwang",
  "Zeekr",
  "Zhidou",
  "Zotye"
] as const;

/** Aliases only help multilingual search; UI and stored values use canonical make names. */
export const CAR_BRAND_ALIASES: Readonly<Record<string,readonly string[]>> = {
  "Volkswagen": [
    "VW",
    "فولكس فاغن",
    "فولكسفاغن",
    "фольксваген",
    "大众"
  ],
  "Mercedes-Benz": [
    "Mercedes",
    "مرسيدس",
    "мерседес",
    "奔驰"
  ],
  "Škoda": [
    "Skoda",
    "سكودا",
    "шкода"
  ],
  "Skoda": [
    "Škoda",
    "سكودا",
    "шкода"
  ],
  "BMW": [
    "بي ام دبليو",
    "بيم",
    "бмв",
    "宝马"
  ],
  "Audi": [
    "اودي",
    "أودي",
    "ауди",
    "奥迪"
  ],
  "SEAT": [
    "سيات",
    "сеат"
  ],
  "MINI": [
    "ميني"
  ],
  "Smart": [
    "سمارت"
  ],
  "Citroën": [
    "Citroen",
    "ستروين",
    "سيتروين"
  ],
  "CUPRA": [
    "Cupra",
    "كوبرا"
  ],
  "GWM": [
    "Great Wall",
    "Great Wall Motors"
  ],
  "Lynk & Co": [
    "Lynk&Co",
    "Lynk and Co"
  ],
  "MG": [
    "ام جي",
    "إم جي"
  ],
  "BYD": [
    "بي واي دي"
  ],
  "Porsche": [
    "بورش",
    "порше",
    "保时捷"
  ],
  "Hyundai": [
    "هيونداي",
    "хендай"
  ],
  "Tesla": [
    "تسلا",
    "тесла"
  ],
  "Opel": [
    "أوبل",
    "اوبل",
    "опель"
  ],
  "Ford": [
    "فورد",
    "форд"
  ],
  "Toyota": [
    "تويوتا",
    "тойота",
    "丰田"
  ],
  "Volvo": [
    "فولفو",
    "вольво"
  ],
  "Renault": [
    "رينو",
    "рено"
  ],
  "Peugeot": [
    "بيجو",
    "пежо"
  ],
  "Kia": [
    "كيا",
    "киа"
  ],
  "Nissan": [
    "نيسان",
    "ниссан"
  ],
  "Mazda": [
    "مازدا",
    "мазда"
  ],
  "Fiat": [
    "فيات",
    "фиат"
  ],
  "Dacia": [
    "داسيا"
  ],
  "Honda": [
    "هوندا",
    "хонда"
  ],
  "Alfa Romeo": [
    "الفا روميو"
  ],
  "Leapmotor": [
    "ليب موتور"
  ],
  "XPENG": [
    "اكس بينغ",
    "اكسبينغ"
  ],
  "Zeekr": [
    "زيكر"
  ],
  "Jaguar": [
    "جاكوار"
  ],
  "Land Rover": [
    "لاند روفر"
  ],
  "Jeep": [
    "جيب"
  ]
};

/** Only exact known label/alias values are canonicalized. Unknown makes are still accepted. */
export function canonicalCarBrand(input:string):string {
 const text=input.trim().normalize('NFKC').toLocaleLowerCase('de');
 for(const brand of CAR_BRANDS){
  if(brand.toLocaleLowerCase('de')===text) return brand;
  if((CAR_BRAND_ALIASES[brand]||[]).some(alias=>alias.toLocaleLowerCase('de')===text)) return brand;
 }
 return input.trim();
}
