export type PilotLocale = 'ru' | 'ua' | 'en';

export type MapPoint = {
  id: string;
  lon: number;
  lat: number;
  kind: 'marina' | 'island' | 'city';
  labels: Record<PilotLocale, string>;
  href?: Record<PilotLocale, string>;
};

export const saronicPoints: MapPoint[] = [
  { id: 'alimos', lon: 23.69997, lat: 37.91401, kind: 'marina', labels: { ru: 'Марина Алимос', ua: 'Марина Алімос', en: 'Alimos Marina' }, href: { ru: '/ru/yacht-charter/greece/athens/alimos-marina/', ua: '/ua/yacht-charter/greece/athens/alimos-marina/', en: '/en/yacht-charter/greece/athens/alimos-marina/' } },
  { id: 'aegina', lon: 23.4285, lat: 37.7467, kind: 'island', labels: { ru: 'Эгина', ua: 'Егіна', en: 'Aegina' }, href: { ru: '/ru/yacht-charter/greece/saronic-gulf/aegina/', ua: '/ua/yacht-charter/greece/saronic-gulf/aegina/', en: '/en/yacht-charter/greece/saronic-gulf/aegina/' } },
  { id: 'poros', lon: 23.4536, lat: 37.4992, kind: 'island', labels: { ru: 'Порос', ua: 'Порос', en: 'Poros' }, href: { ru: '/ru/yacht-charter/greece/saronic-gulf/poros/', ua: '/ua/yacht-charter/greece/saronic-gulf/poros/', en: '/en/yacht-charter/greece/saronic-gulf/poros/' } },
  { id: 'hydra', lon: 23.4669, lat: 37.3507, kind: 'island', labels: { ru: 'Идра', ua: 'Ідра', en: 'Hydra' }, href: { ru: '/ru/yacht-charter/greece/saronic-gulf/hydra/', ua: '/ua/yacht-charter/greece/saronic-gulf/hydra/', en: '/en/yacht-charter/greece/saronic-gulf/hydra/' } },
];

// Editorial line with sea waypoints. It is illustrative and must not be used
// for navigation, collision avoidance or passage planning.
export const saronicRoute: Array<[number, number]> = [
  [23.69997, 37.91401], [23.621, 37.866], [23.515, 37.81], [23.4285, 37.7467],
  [23.39, 37.665], [23.405, 37.575], [23.4536, 37.4992], [23.455, 37.43],
  [23.4669, 37.3507], [23.505, 37.43], [23.56, 37.56], [23.625, 37.7],
  [23.69997, 37.91401],
];

export const routeLegs = [
  { from: 'alimos', to: 'aegina', nm: 18 },
  { from: 'aegina', to: 'poros', nm: 16 },
  { from: 'poros', to: 'hydra', nm: 13 },
  { from: 'hydra', to: 'alimos', nm: 39 },
];

export const geographyCopy = {
  ru: {
    region: {
      eyebrow: 'Греция · Саронический залив', title: 'Яхтенный чартер в Сароническом заливе',
      lead: 'Острова рядом с Афинами, короткие переходы и большой выбор яхт из Алимоса — удобный регион для первой самостоятельной недели и спокойного семейного маршрута.',
      intro: 'Саронический залив начинается буквально у Афин. От крупной чартерной базы в Алимосе до Эгины — один дневной переход, а Порос и Идра позволяют собрать насыщенную неделю без длинных ночных участков. Это не означает одинаково простую погоду каждый день: решение о выходе принимают по актуальному прогнозу, состоянию экипажа и ограничениям конкретной яхты.',
      characterTitle: 'Почему этот регион удобен для первой недели', character: 'Короткий первый переход оставляет время на приёмку яхты и знакомство экипажа с лодкой. Дальше можно чередовать городские порты Эгины и Пороса с более открытыми участками у Идры, а при изменении прогноза — сократить плечо или выбрать запасную стоянку. Это не «лёгкий маршрут по умолчанию»: летом учитывают жару, дневное усиление ветра и занятость популярных портов.',
      yachts: 'Яхты для чартера в Сароническом заливе', routeTitle: 'Маршрут недели из Алимоса', routeText: 'Эгина, Порос и Идра — четыре перехода и около 86 морских миль по редакционной линии.',
      cta: 'Найти яхту в Сароническом заливе', disclaimer: 'Описание предназначено для выбора региона. Оно не заменяет прогноз, актуальные карты, лоцию, Notices to Mariners и решение ответственного шкипера.',
    },
    marina: { mapTitle: 'Алимос на карте Саронического залива', mapIntro: 'Стартовая точка рядом с Афинами и островами маршрута.' },
    route: {
      eyebrow: 'Маршрут на 7 дней', title: 'Алимос — Эгина — Порос — Идра — Алимос',
      lead: 'Редакционный план яхтенной недели по Сароническому заливу: короткий первый переход, три острова и возврат к главной чартерной базе Афин.',
      intro: 'Маршрут рассчитан как основа для обсуждения с экипажем и чартерной компанией. Дни, стоянки и порядок островов меняются по погоде, свободным местам, скорости яхты и опыту команды.',
      itinerary: ['Приёмка яхты и подготовка в Алимосе', 'Переход на Эгину', 'Эгина — Порос', 'Порос и берег Пелопоннеса', 'Переход на Идру', 'Возвращение в сторону Афин', 'Алимос: топливо, сдача яхты и резерв времени'],
      yachts: 'Яхты для старта из Алимоса', cta: 'Запросить яхту и маршрут',
      disclaimer: 'Линия на карте иллюстративна и не предназначена для навигации. Не используйте её для прокладки курса, обхода опасностей или выбора места стоянки.',
    },
  },
  ua: {
    region: {
      eyebrow: 'Греція · Саронічна затока', title: 'Яхтовий чартер у Саронічній затоці',
      lead: 'Острови поруч з Афінами, короткі переходи та великий вибір яхт з Алімоса — зручний регіон для першого самостійного тижня й сімейного маршруту.',
      intro: 'Саронічна затока починається біля Афін. Від великої чартерної бази в Алімосі до Егіни — один денний перехід, а Порос та Ідра дають змогу скласти насичений тиждень без довгих нічних ділянок. Рішення про вихід завжди залежить від актуального прогнозу, екіпажу та конкретної яхти.',
      characterTitle: 'Чому регіон зручний для першого тижня', character: 'Короткий перший перехід залишає час на приймання яхти й знайомство екіпажу з човном. Далі можна чергувати міські порти Егіни та Пороса з відкритішими ділянками біля Ідри, а за зміни прогнозу — скоротити плече або обрати запасну стоянку. Це не «легкий маршрут за замовчуванням»: улітку враховують спеку, денне посилення вітру та завантаженість портів.',
      yachts: 'Яхти для чартеру в Саронічній затоці', routeTitle: 'Тижневий маршрут з Алімоса', routeText: 'Егіна, Порос та Ідра — чотири переходи й близько 86 морських миль за редакційною лінією.',
      cta: 'Знайти яхту в Саронічній затоці', disclaimer: 'Опис допомагає обрати регіон, але не замінює прогноз, актуальні карти, лоцію, Notices to Mariners і рішення відповідального шкіпера.',
    },
    marina: { mapTitle: 'Алімос на карті Саронічної затоки', mapIntro: 'Стартова точка поруч з Афінами та островами маршруту.' },
    route: {
      eyebrow: 'Маршрут на 7 днів', title: 'Алімос — Егіна — Порос — Ідра — Алімос',
      lead: 'Редакційний план яхтового тижня Саронічною затокою: короткий перший перехід, три острови й повернення до головної чартерної бази Афін.',
      intro: 'Маршрут є основою для обговорення з екіпажем і чартерною компанією. Дні, стоянки та порядок островів змінюються за погодою, місцями, швидкістю яхти й досвідом команди.',
      itinerary: ['Приймання яхти та підготовка в Алімосі', 'Перехід на Егіну', 'Егіна — Порос', 'Порос і узбережжя Пелопоннесу', 'Перехід на Ідру', 'Повернення в бік Афін', 'Алімос: паливо, здача яхти та резерв часу'],
      yachts: 'Яхти для старту з Алімоса', cta: 'Запросити яхту й маршрут',
      disclaimer: 'Лінія на карті ілюстративна й не призначена для навігації. Не використовуйте її для прокладання курсу, обходу небезпек або вибору стоянки.',
    },
  },
  en: {
    region: {
      eyebrow: 'Greece · Saronic Gulf', title: 'Yacht charter in the Saronic Gulf',
      lead: 'Islands close to Athens, manageable passages and a large fleet from Alimos make this a practical area for a first independent week or a relaxed family itinerary.',
      intro: 'The Saronic Gulf begins at Athens. Aegina is a day sail from the major charter base at Alimos, while Poros and Hydra make a varied week possible without planning long overnight legs. That does not make every day easy: departure decisions still depend on the current forecast, the crew and the limits of the yacht.',
      characterTitle: 'Why the area works for a first week', character: 'A short opening passage leaves time for handover and for the crew to learn the yacht. Later days can alternate the town harbours of Aegina and Poros with more exposed water near Hydra; when the forecast changes, a leg can be shortened or an alternative berth chosen. It is not an “easy route” by default: summer heat, strengthening afternoon wind and crowded harbours still shape each decision.',
      yachts: 'Yachts for charter in the Saronic Gulf', routeTitle: 'A week from Alimos', routeText: 'Aegina, Poros and Hydra: four passages and about 86 nautical miles along the editorial line.',
      cta: 'Find a yacht in the Saronic Gulf', disclaimer: 'This overview helps compare regions. It does not replace a forecast, current charts, pilot books, Notices to Mariners or the responsible skipper’s decision.',
    },
    marina: { mapTitle: 'Alimos in the Saronic Gulf', mapIntro: 'A departure point close to Athens and the islands on this route.' },
    route: {
      eyebrow: 'Seven-day itinerary', title: 'Alimos — Aegina — Poros — Hydra — Alimos',
      lead: 'An editorial outline for a week in the Saronic Gulf: a short first passage, three islands and a return to Athens’ principal charter base.',
      intro: 'Use this route as a basis for a crew and charter-company briefing. Days, berths and island order must change with weather, space, yacht speed and crew experience.',
      itinerary: ['Yacht handover and preparation in Alimos', 'Passage to Aegina', 'Aegina to Poros', 'Poros and the Peloponnese shore', 'Passage to Hydra', 'Return towards Athens', 'Alimos: fuel, handback and time reserve'],
      yachts: 'Yachts departing from Alimos', cta: 'Request a yacht and route',
      disclaimer: 'The map line is illustrative and is not intended for navigation. Do not use it to set a course, avoid hazards or choose a berth.',
    },
  },
} as const;
