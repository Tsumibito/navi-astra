// Content of the home page for all locales, extracted verbatim from the
// Webstudio originals (src/snapshots/_root.html, en|ua/home). Accent phrases
// use [[...]] markers rendered as orange <span class="accent"> by the page.
// \n inside strings becomes <br/>.

export const homeContent = {
  ru: {
    meta: {
      title: 'Яхтенная компания Navi.training - центр развития яхтинга',
      description: 'Navi.training - поможет вам осуществить мечту о море, научим вас управлять практически любой яхтой, организуем незабываемый отдых под парусом, доставим вашу яхту в любую точку мира и поможем сделать правильный выбор при покупке судна. ☎️ +33769958299',
    },
    hero: {
      eyebrow: 'Центр РАЗВИТИЯ ЯХТИНГА',
      title: 'Navi.training',
      lead: 'Обучение яхтингу, чартер, перегон, экспертиза.',
      cta: 'Подать заявку',
    },
    mission: {
      heading: '[[Наша миссия:]] Делаем яхтинг доступным, помогая каждому осуществить мечту о море.',
      description: "[[Navi.training]] - это ваш надежный партнер в непростом мире яхтинга. Мы поможем вам осуществить мечту о море, [[научим вас управлять практически любой яхтой]], организуем незабываемый отдых под парусом, доставим вашу яхту в любую точку мира и [[поможем сделать правильный выбор при покупке судна.]]",
      items: [
        { icon: '/cgi/asset/65f9b20c901f9928f7286d2a_online-learning_tt0JgWwNp4yadNtYoCYMj.png', text: '[[Создаем современные обучающие материалы]] по яхтингу, чтобы упростить доступ к обучению яхтсменов и подарить вам уверенность на воде.' },
        { icon: '/cgi/asset/65f9b1ff4a7f117a3441b5ea_ship_nJ_S58ya0Ots2jtZLdcJY.png', text: 'Делаем доступным [[незабываемый отдых под парусом]], помогая нашим клиентам арендовать яхту пв любом регионе мира, как со шкипером так и без.' },
        { icon: '/cgi/asset/65f9b1e971700faa5162aca0_certificate_78tZEYMTg4W8VumhYtEXH.png', text: '[[Развиваем яхтенное сообщество,]] и делаем яхтинг ближе и понятнее для широкого круга людей всех возрастов и профессий.' },
      ],
    },
    services: {
      heading: '[[Путешествия]] и яхтенный чартер',
      cards: [
        { title: 'Яхтенные путешествия', href: '/ru/charter', img: '/cgi/asset/d1_fbhg7RFOSlLE54k2Bn_10.jpg' },
        { title: 'Чартерное агентство', href: '/ru/charter', img: '/cgi/asset/charter_CaMIqlIxXrgBOs_OGlx3c.jpg' },
        { title: 'Перегон яхт', href: '/ru/yacht-delivery', img: '/cgi/asset/d3_f0m__GKS68QPwyf1hbhr_.jpg' },
        { title: 'Яхтенная экспертиза', href: '/ru/yacht-expertise', img: '/cgi/asset/d4_9OiH95C1QsgAeaZAHUIRu.jpg' },
      ],
    },
    charter: {
      heading: 'Бронирование чартера с нашими капитанами',
      body: 'Мечтаете о незабываемом путешествии на яхте? Забронируйте чартер с нашими опытными капитанами уже сегодня!\n\nПочувствуйте ветер в волосах и свободу моря с нашими профессионалами на борту!',
      cta: 'Хочу в чартер',
      href: '/ru/charter',
    },
    put: {
      heading: 'Ваша [[яхта, может работать]] у нас',
      body: "[[Ваша яхта - это возможность для всех!]]\n\n'Put your boat to work' позволяет вам делиться своей морской страстью, сдавая ее в аренду, и окупая расходы на содержание вашей яхты или даже неплохо зарабатывая на ней.",
      cta: 'Условия сотрудничества',
      href: 'mailto:alex@navi.training?subject=put+your+boat+to+work',
    },
    faq: {
      title: 'FAQs',
      subtitle: 'Часто задаваемые вопросы',
      items: [
        { q: 'Где вы находитесь?', a: 'Наш главный офис находится во франции, в городе Ля Рошель. Наш адрес вы найдете в футере сайта. Также нас есть тренировочные базы в Турции, Черногории и Испании, откуда обычно выходят наши группы морской практики.' },
        { q: 'Где можно узнать больше о яхтинге?', a: 'На сайте Navi.training есть отличный блог где публикуются статьи о яхтинге, содержащие новости, лайфхаки и учебные материалы' },
        { q: 'Какие виды оплаты вы принимаете и в какой валюте?', a: 'MON NAVI SARL французская компания, расположенная в городе Lagord в дапартаменте Charente-Maritime на Атлантическом побережье Франции. Обычно мы принимаем SEPA платежи в евро на наш IBAN счет либо оплаты картой через Stripe или Pay Pal.' },
        { q: 'Как можно попасть к вам в команду?', a: 'Да, Navi.training принимает в свою команду талантливых инструкторов и технических специалистов. Отправьте ваше резюме на alex@navi.training' },
      ],
      ctaTitle: 'Остались еще вопросы?',
      ctaBody: 'Свяжитесь снами, наши менеджеры будут рады вам помочь',
      ctaButton: 'Задать вопрос',
    },
    form: {
      title: 'Оставить заявку',
      intro: 'Пора взять курс на приключения! Расскажите, чем мы можем помочь, и мы свяжемся с вами в ближайшее время.',
      button: 'Отправить',
    },
  },

  ua: {
    meta: {
      title: 'Яхтова компанія Navi.training - центр розвитку яхтингу',
      description: 'Navi.training - допоможе вам здійснити мрію про море, навчимо вас керувати практично будь-якою яхтою, організуємо незабутній відпочинок під вітрилом, доставимо вашу яхту в будь-яку точку світу і допоможемо зробити правильний вибір під час купівлі судна. ☎️ +33769958299',
    },
    hero: {
      eyebrow: 'Центр РАЗВИТИЯ ЯХТИНГА',
      title: 'Navi.training',
      lead: 'Навчання яхтингу, чартер, перегін, експертиза.',
      cta: 'Подати заявку',
    },
    mission: {
      heading: '[[Наша місія:]] Робимо яхтинг доступним, допомагаючи кожному здійснити мрію про море.',
      description: '[[Navi.training]] - це ваш надійний партнер у непростому світі яхтингу. Ми допоможемо вам здійснити мрію про море, [[навчимо вас керувати практично будь-якою яхтою]], організуємо незабутній відпочинок під вітрилом, доставимо вашу яхту в будь-яку точку світу і [[допоможемо зробити правильний вибір під час купівлі судна.]]',
      items: [
        { icon: '/cgi/asset/65f9b20c901f9928f7286d2a_online-learning_tt0JgWwNp4yadNtYoCYMj.png', text: '[[Створюємо сучасні навчальні матеріали]] з яхтингу, щоб спростити доступ до навчання яхтсменів і подарувати вам впевненість на воді.' },
        { icon: '/cgi/asset/65f9b1ff4a7f117a3441b5ea_ship_nJ_S58ya0Ots2jtZLdcJY.png', text: 'Робимо доступним [[незабутній відпочинок під вітрилом]], допомагаючи нашим клієнтам орендувати яхту в будь-якому регіоні світу, як зі шкіпером так і без.' },
        { icon: '/cgi/asset/65f9b1e971700faa5162aca0_certificate_78tZEYMTg4W8VumhYtEXH.png', text: '[[Розвиваємо яхтове співтовариство]], і робимо яхтинг ближчим і зрозумілішим для широкого кола людей різного віку і професій.' },
      ],
    },
    services: {
      heading: '[[Наші напрямки]] діяльності',
      cards: [
        { title: 'Яхтова школа', href: '/ua/sailing-school', img: '/cgi/asset/d1_fbhg7RFOSlLE54k2Bn_10.jpg' },
        { title: 'Чартерна агенція', href: '/ua/charter', img: '/cgi/asset/charter_CaMIqlIxXrgBOs_OGlx3c.jpg' },
        { title: 'Перегін яхт', href: '/ua/yacht-delivery', img: '/cgi/asset/d3_f0m__GKS68QPwyf1hbhr_.jpg' },
        { title: 'Яхтова експертиза', href: '/ua/yacht-expertise', img: '/cgi/asset/d4_9OiH95C1QsgAeaZAHUIRu.jpg' },
      ],
    },
    charter: {
      heading: 'Бронювання чартеру з нашими капітанами',
      body: 'Мрієте про незабутню подорож на яхті? Забронюйте чартер з нашими досвідченими капітанами вже сьогодні!\n\nВідчуйте вітер у волоссі та свободу моря з нашими професіоналами на борту!',
      cta: 'Хочу у чартер',
      href: '/ua/charter',
    },
    put: {
      heading: 'Ваша [[яхта, може працювати]] у нас',
      body: "[[Ваша яхта - це можливість для всіх!]]\n\n'Put your boat to work' дає змогу вам ділитися своєю морською пристрастю, здаючи її в оренду, і окупаючи витрати на утримання вашої яхти або навіть непогано заробляючи на ній.",
      cta: 'Умови співпраці',
      href: 'mailto:alex@navi.training?subject=put+your+boat+to+work',
    },
    faq: {
      title: 'FAQs',
      subtitle: 'Поширені запитання',
      items: [
        { q: 'Де ви знаходитесь?', a: 'Наш головний офіс знаходиться у франції, в місті Ля Рошель. Нашу адресу ви знайдете у футері сайту. Також у нас є тренувальні бази в Туреччині, Чорногорії та Іспанії, звідки зазвичай виходять наші групи морської практики.' },
        { q: 'Де можна дізнатися більше про яхтинг?', a: 'На сайті Navi.training є відмінний блог, де публікуються статті про яхтинг, які містять новини, лайфхаки та навчальні матеріали' },
        { q: 'Які види оплати ви приймаєте і в якій валюті?', a: 'MON NAVI SARL французька компанія, розташована в місті Lagord у дапартаменті Charente-Maritime на Атлантичному узбережжі Франції. Зазвичай ми приймаємо SEPA платежі в євро на наш IBAN рахунок або оплати карткою через Stripe чи Pay Pal.' },
        { q: 'Як можна потрапити до вас у команду?', a: 'Так, Navi.training приймає до своєї команди талановитих інструкторів і технічних фахівців. Надішліть ваше резюме на alex@navi.training' },
      ],
      ctaTitle: 'Залишилися ще питання?',
      ctaBody: "Зв'яжіться з нами, наші менеджери будуть раді вам допомогти",
      ctaButton: 'Поставити запитання',
    },
    form: {
      title: 'Залишить заявку',
      intro: 'Час узяти курс на пригоди! Розкажіть, чим ми можемо допомогти, і ми звʼяжемося з вами найближчим часом.',
      button: 'Відправити',
    },
  },

  en: {
    meta: {
      title: 'Yacht company Navi.training - sailing development centre',
      description: 'Navi.training - will help you realise your dream of the sea, teach you how to manage almost any yacht, organise an unforgettable holiday under sail, deliver your yacht anywhere in the world and help you make the right choice when buying a vessel. ☎️ +33769958299.',
    },
    hero: {
      eyebrow: 'YACHTING DEVELOPMENT CENTRE',
      title: 'Navi.training',
      lead: 'Yacht training, charter, sailboat dekivery, expertise.',
      cta: 'Apply',
    },
    mission: {
      heading: '[[Our mission:]] To make yachting accessible by helping everyone realise their dream of sailing.',
      description: '[[Navi.training]] is your reliable partner in the challenging world of yachting. We will help you realise your dream of the sea, [[teach you how to sail almost any yacht]], organise an unforgettable sailing holiday, deliver your yacht anywhere in the world and [[help you make the right choice when buying a vessel.]]',
      items: [
        { icon: '/cgi/asset/65f9b20c901f9928f7286d2a_online-learning_tt0JgWwNp4yadNtYoCYMj.png', text: '[[We create state-of-the-art yachting training]] materials to simplify access to yachtsman training and give you confidence on the water.' },
        { icon: '/cgi/asset/65f9b1ff4a7f117a3441b5ea_ship_nJ_S58ya0Ots2jtZLdcJY.png', text: 'We make [[unforgettable sailing holidays]] affordable by helping our clients to charter a yacht in any region of the world, with or without a skipper.' },
        { icon: '/cgi/asset/65f9b1e971700faa5162aca0_certificate_78tZEYMTg4W8VumhYtEXH.png', text: 'We [[develop the yachting community]] and make yachting closer and clearer for a wide range of people of all ages and professions.' },
      ],
    },
    services: {
      heading: '[[Our business]] areas',
      cards: [
        { title: 'Sailing school', href: '/en/sailing-school', img: '/cgi/asset/d1_fbhg7RFOSlLE54k2Bn_10.jpg' },
        { title: 'Charter agency', href: '/en/charter', img: '/cgi/asset/charter_CaMIqlIxXrgBOs_OGlx3c.jpg' },
        { title: 'Sailboat delivery', href: '/en/yacht-delivery', img: '/cgi/asset/d3_f0m__GKS68QPwyf1hbhr_.jpg' },
        { title: 'Yacht expertise', href: '/en/yacht-expertise', img: '/cgi/asset/d4_9OiH95C1QsgAeaZAHUIRu.jpg' },
      ],
    },
    charter: {
      heading: 'Booking a charter with our captains',
      body: 'Dreaming of an unforgettable yacht trip? Book a charter with our experienced captains today!\n\nFeel the wind in your hair and the freedom of the sea with our professionals on board!',
      cta: 'I want to go sailing',
      href: '/en/charter',
    },
    put: {
      heading: 'Put [[your boat]] to work',
      body: "[[Your boat is an opportunity for everyone of us!]]\n\n'Put your boat to work' allows you to share your nautical passion by renting it out and recouping the costs of maintaining your yacht or even making a good living from it.",
      cta: 'Lets talk',
      href: 'mailto:alex@navi.training?subject=put+your+boat+to+work',
    },
    faq: {
      title: 'FAQs',
      subtitle: 'Frequently Asked Questions',
      items: [],
      ctaTitle: 'Any other questions?',
      ctaBody: 'Contact us, our managers will be happy to assist you',
      ctaButton: 'Ask a question',
    },
    form: {
      title: 'Submit a request',
      intro: "It's time to set a course for adventure! Tell us how we can help and we will get back to you shortly.",
      button: 'Submit',
    },
  },
};

export const homeRoutes = { ru: '/', en: '/en/home', ua: '/ua/home' };
