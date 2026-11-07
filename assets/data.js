/* MebelPro KG — единые демо-данные и сквозной расчёт.
   Цепочка: модули проекта → детали → гильотинный раскрой → кромка/фурнитура → себестоимость → проверки.
   Все экраны берут цифры отсюда, поэтому изменения в 3D-конструкторе видны в раскрое и смете. */
(function () {
  const MP = (window.MP = window.MP || {});
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ---------- Справочники ---------- */
  MP.company = { name: 'ОсОО «Азамат Мебель»', short: 'Азамат Мебель', city: 'Бишкек', shift: 'Смена 1', director: 'Азамат Жумабеков', phone: '+996 (555) 01-23-45' };
  MP.today = '14.04.2025';
  MP.period = 'Апрель 2025';

  MP.staff = [
    { role: 'Владелец / Директор', badge: 'Полный доступ', name: 'Азамат Жумабеков', icon: 'verified_user', tone: 'primary',
      text: 'Финансы, маржинальность, договоры, выпуск заказов в производство.', allow: ['Все разделы и финансы', 'Экспорт кассы и MBank'], deny: [] },
    { role: 'Конструктор-технолог', badge: 'Технолог', name: 'Нурлан Мамбетов', icon: 'architecture', tone: 'secondary',
      text: '3D-проекты, параметры модулей, карты раскроя, файлы для ЧПУ.', allow: ['3D, раскрой, ЧПУ'], deny: ['Касса скрыта'] },
    { role: 'Мастер распиловки / ЧПУ', badge: 'Оператор', name: 'Марат Садырбеков', icon: 'precision_manufacturing', tone: 'outline',
      text: 'Экран «Раскрой», бирки деталей со штрих-кодом, запуск программ на станке.', allow: ['Бирки и раскрой'], deny: ['Смета и цены недоступны'] },
    { role: 'Сборщик / Монтажник', badge: 'Монтаж', name: 'Тилек Абдраев (Бригада №1)', icon: 'handyman', tone: 'outline',
      text: 'Сборочные схемы, карта присадки, чек-лист фурнитуры, отметка этапа.', allow: ['Чертёж и статус сборки'], deny: ['Без доступа к стоимости'] }
  ];

  MP.settings = { kerf: 4.2, trim: 15, t: 16, facadeT: 18, gap: 2, plinth: 100, topT: 38, saw: 'Altendorf F45', blade: 'Freud LU3D 300×3.2 Z96', cnc: 'WoodTec 2030 (NCStudio)', printer: 'Xprinter XP-365B' };

  MP.materials = {
    ldsp: { key: 'ldsp', role: 'Каркас', name: 'ЛДСП 16 мм Kronospan 0190 Белый', short: 'ЛДСП 16 мм Белый', L: 2800, W: 2070, price: 4300, stock: 18, kgm2: 11.2, tone: 'primary' },
    mdf: { key: 'mdf', role: 'Фасады', name: 'МДФ 18 мм Soft-Touch Графит', short: 'МДФ 18 мм Графит', L: 2800, W: 2070, price: 14500, stock: 8, kgm2: 13.5, tone: 'secondary' },
    hdf: { key: 'hdf', role: 'Задние стенки', name: 'ХДФ 4 мм Белый', short: 'ХДФ 4 мм', L: 2800, W: 2070, price: 1100, stock: 12, kgm2: 3.4, tone: 'outline' }
  };
  MP.tops = {
    wall: { name: 'Столешница 38 мм (4100×600)', L: 4100, W: 600, price: 8900 },
    island: { name: 'Столешница 38 мм (4100×900)', L: 4100, W: 900, price: 12600 }
  };

  /* ---------- Цвета и декоры (демо-каталог; цены — за лист ЛДСП/МДФ, для столешниц — доплата за полотно) ---------- */
  MP.decors = {
    facade: [
      { key: 'graphite', name: 'Графит Soft-Touch', color: '#30353d', price: 14500 },
      { key: 'white', name: 'Белый матовый', color: '#ecebe6', price: 14500 },
      { key: 'cashmere', name: 'Кашемир', color: '#c9b9a5', price: 15000 },
      { key: 'olive', name: 'Олива', color: '#6c7356', price: 15700 },
      { key: 'navy', name: 'Тёмно-синий', color: '#263850', price: 15700 },
      { key: 'oak', name: 'Дуб натуральный (шпон)', color: '#b8895a', price: 19000, pattern: 'wood' }
    ],
    carcass: [
      { key: 'white', name: 'Kronospan 0190 Белый', short: 'Белый', color: '#f3f2ee', price: 4300 },
      { key: 'grey', name: 'Egger U763 Серый перламутр', short: 'Серый', color: '#b8b9b5', price: 4900 },
      { key: 'sonoma', name: 'Kronospan Дуб Сонома', short: 'Сонома', color: '#d0ae82', price: 4700, pattern: 'wood' },
      { key: 'graphite', name: 'Egger U961 Графит', short: 'Графит', color: '#3d4046', price: 5200 }
    ],
    top: [
      { key: 'halifax', name: 'Egger Дуб Галифакс H1180', color: '#b4824b', price: 0, pattern: 'wood' },
      { key: 'marble', name: 'Мрамор Каррара F204', color: '#e8e6e1', price: 1500, pattern: 'marble' },
      { key: 'stone', name: 'Чёрный камень F206', color: '#2c2c30', price: 1500 },
      { key: 'concrete', name: 'Бетон Чикаго F186', color: '#9b9993', price: 900 }
    ]
  };
  MP.defaultDecor = { facade: 'graphite', carcass: 'white', top: 'halifax' };
  MP.decor = (kind, key) => MP.decors[kind].find((d) => d.key === key) || MP.decors[kind][0];
  MP.decorLabels = { facade: 'Фасады', carcass: 'Корпус', top: 'Столешница' };
  // Материал раскроя по ключу: 'ldsp', 'hdf' или 'mdf-<декор>'
  MP.matInfo = function (key, decor) {
    decor = decor || MP.defaultDecor;
    if (key === 'ldsp') { const d = MP.decor('carcass', decor.carcass); return Object.assign({}, MP.materials.ldsp, { key, name: 'ЛДСП 16 мм ' + d.name, short: 'ЛДСП ' + d.short, price: d.price, color: d.color }); }
    if (key.startsWith('mdf-')) { const d = MP.decor('facade', key.slice(4)); return Object.assign({}, MP.materials.mdf, { key, name: 'МДФ 18 мм ' + d.name, short: 'МДФ ' + d.name.split(' (')[0], price: d.price, color: d.color }); }
    return Object.assign({}, MP.materials[key], { key });
  };
  MP.edges = {
    '2.0': { name: 'Кромка ПВХ 2.0 мм Белая', short: 'ПВХ 2.0', price: 45 },
    '0.4': { name: 'Кромка ПВХ 0.4 мм Белая', short: 'ПВХ 0.4', price: 18 },
    PUR: { name: 'Кромка 1.0 мм в цвет фасада, PUR-клей', short: 'PUR 1.0', price: 95 }
  };
  MP.hardwareCatalog = {
    hinge: { name: 'Петля DTC Clip-On 110° с доводчиком', unit: 'шт', price: 260 },
    runner: { name: 'Направляющие DTC Dynamic 500 мм, скрытый монтаж', unit: 'компл.', price: 3800 },
    lift: { name: 'Подъёмник Blum Aventos HK-S', unit: 'компл.', price: 6900 },
    leg: { name: 'Опора регулируемая 100 мм + клипса цоколя', unit: 'шт', price: 90 },
    plinth: { name: 'Цоколь пластиковый Rehau 100 мм, чёрный', unit: 'пог. м', price: 520 },
    confirmat: { name: 'Конфирмат 7×50 мм', unit: 'шт', price: 6 },
    dowel: { name: 'Шкант 8×30 мм', unit: 'шт', price: 2 },
    shelfPin: { name: 'Полкодержатель 5 мм', unit: 'шт', price: 8 },
    hanger: { name: 'Навес Camar 807 регулируемый', unit: 'шт', price: 180 },
    handle: { name: 'Ручка-профиль 160 мм, чёрный матовый', unit: 'шт', price: 350 },
    rod: { name: 'Штанга овальная + 2 держателя', unit: 'компл.', price: 450 },
    dryer: { name: 'Сушка для посуды двухуровневая', unit: 'шт', price: 2400 }
  };
  MP.work = { cutPerSheet: 500, edgePerM: 40, drillPerPart: 60, assembly: 9000, delivery: 9000 };

  /* ---------- Проект №2025-104 ---------- */
  MP.client = { name: 'Бакыт Токтогулов', phone: '+996 700 12-34-56', address: 'ЖК «Искендер», блок Б, Бишкек' };
  MP.project = {
    id: '2025-104', code: 'MP-104', title: 'Кухня угловая с островом', room: { L: 3400, W: 2600, H: 2750 },
    version: 'v1.2', signed: '13.04.2025', due: '25.04.2025', daysLeft: 11, price: 185000, prepaid: 110000, payMethod: 'MBank QR',
    technologist: 'Нурлан Мамбетов', operator: 'Марат Садырбеков',
    versions: [
      { v: 'v1.2', date: '13.04.2025', note: 'Добавлен остров — подписано клиентом' },
      { v: 'v1.1', date: '11.04.2025', note: 'Корректировка полок' },
      { v: 'v1.0', date: '08.04.2025', note: 'Исходный замер' }
    ]
  };
  // Инженерные коммуникации (мм; x — от стены Б, z — от стены А, y — от пола)
  // Газовый стояк — в правом углу стены А (20 мм от стены), остальное — от стены Б
  MP.utilitiesFor = (room) => Object.assign({}, MP.utilities, { gas: Object.assign({}, MP.utilities.gas, { x: (room || MP.project.room).L - 20 }) });
  MP.utilities = {
    water: [{ label: 'Холодная вода', x: 1250, y: 500, hot: false }, { label: 'Горячая вода', x: 1350, y: 500, hot: true }],
    sockets: [{ x: 1900, y: 1100 }, { x: 2000, y: 1100 }, { x: 2100, y: 1100 }],
    gas: { x: 3380, z: 30, r: 12 }
  };

  // Модули: x/z — левый-задний угол корпуса, y — низ корпуса (над цоколем 100 мм)
  MP.defaultModules = [
    { id: 'm1', code: 'НУ-900', name: 'Угловой модуль', type: 'base', front: 'corner', w: 900, h: 720, d: 560, x: 0, y: 100, z: 0, facing: '+z', shelves: 1, place: 'Угол А-Б' },
    { id: 'm2', code: 'Н-800-М', name: 'Шкаф под мойку', type: 'base', front: 'doors', doors: 2, w: 800, h: 720, d: 560, x: 900, y: 100, z: 0, facing: '+z', shelves: 0, sink: true, place: 'Стена А' },
    { id: 'm3', code: 'ПММ-450', name: 'Посудомойка (фасад)', type: 'appliance', front: 'appliance', w: 450, h: 720, d: 560, x: 1700, y: 100, z: 0, facing: '+z', shelves: 0, place: 'Стена А' },
    { id: 'm4', code: 'Н-600-Д', name: 'Шкаф под духовку', type: 'oven', front: 'oven', w: 600, h: 720, d: 560, x: 2150, y: 100, z: 0, facing: '+z', shelves: 0, place: 'Стена А' },
    { id: 'm5', code: 'П-600', name: 'Пенал: СВЧ + бакалея', type: 'tall', front: 'tall', w: 600, h: 2080, d: 560, x: 2750, y: 100, z: 0, facing: '+z', shelves: 2, place: 'Стена А' },
    { id: 'm6', code: 'В-900', name: 'Навесной шкаф', type: 'upper', front: 'doors', doors: 2, w: 900, h: 720, d: 320, x: 0, y: 1458, z: 0, facing: '+z', shelves: 1, place: 'Стена А, верх' },
    { id: 'm7', code: 'В-800-С', name: 'Навесной с сушкой', type: 'upper', front: 'doors', doors: 2, w: 800, h: 720, d: 320, x: 900, y: 1458, z: 0, facing: '+z', shelves: 0, fill: { dryer: true }, place: 'Стена А, верх' },
    { id: 'm8', code: 'В-450', name: 'Навесной узкий', type: 'upper', front: 'doors', doors: 1, w: 450, h: 720, d: 320, x: 1700, y: 1458, z: 0, facing: '+z', shelves: 1, place: 'Стена А, верх' },
    { id: 'm9', code: 'В-600-Г', name: 'Над вытяжкой (подъёмник)', type: 'upper', front: 'lift', w: 600, h: 360, d: 320, x: 2150, y: 1818, z: 0, facing: '+z', shelves: 0, place: 'Стена А, верх' },
    { id: 'm10', code: 'Н-600-Я3', name: 'Остров: 3 ящика', type: 'island', front: 'drawers3', w: 600, h: 720, d: 560, x: 1000, y: 100, z: 1540, facing: '-z', shelves: 0, place: 'Остров' },
    { id: 'm11', code: 'Н-1000-2Д', name: 'Остров: 2 двери', type: 'island', front: 'doors', doors: 2, w: 1000, h: 720, d: 560, x: 1600, y: 100, z: 1540, facing: '-z', shelves: 1, place: 'Остров' }
  ];
  MP.typeNames = { base: 'Нижние', upper: 'Верхние', tall: 'Пеналы', island: 'Остров', oven: 'Нижние', appliance: 'Техника' };

  /* ---------- Заказы мастерской (одна база для дашборда и «Моих проектов») ---------- */
  MP.stages = [
    { key: 'measure', title: 'Замер и проект', icon: 'straighten', tone: 'primary' },
    { key: 'contract', title: 'Договор и аванс', icon: 'handshake', tone: 'tertiary' },
    { key: 'purchase', title: 'Закупка материалов', icon: 'local_shipping', tone: 'primary' },
    { key: 'cutting', title: 'Раскрой и ЧПУ', icon: 'view_quilt', tone: 'secondary' },
    { key: 'assembly', title: 'Сборка в цехе', icon: 'handyman', tone: 'primary' },
    { key: 'install', title: 'Монтаж на адресе', icon: 'home_repair_service', tone: 'secondary' }
  ];
  MP.categories = { kitchen: 'Кухни', sliding: 'Шкафы-купе', dressing: 'Гардеробные', tv: 'ТВ-зоны', hallway: 'Прихожие', other: 'Другое' };
  MP.orders = [
    { id: '2025-104', title: 'Кухня угловая с островом', client: 'Бакыт Токтогулов', phone: '+996 700 12-34-56', place: 'ЖК «Искендер»', category: 'kitchen', stage: 'cutting', price: 185000, paid: 110000, pay: 'MBank QR', due: '25.04.2025', note: 'Раскрой ЛДСП и МДФ', cost: null, material: 'Kronospan 0190, МДФ Soft-Touch Графит, DTC', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlelPbrj5ovf4vH-kp8fc4_A3FKBD6bHGCyu0D0mOrMKhCKDGbv4gPiL4TKTSMTpcXUVRYIDS3qCcFld0O5luDyp1SyfJkgnnCSUdwB_78SLLC4sMcyVUOlG8Y2u8AwlZ4eLRhid-7_JEcklsq0e1n7uvJWyOgFT1CDy5QlvKPO0ekwJycRfez-FWUw_O6mDKXHuQoDj8bBO8YLm7hWbjQHRhFLhD6wvI2uOGf_g', updated: '15 мин назад' },
    { id: '2025-101', title: 'Кухня Лофт 3.6 м', client: 'Нурбек Алиев', phone: '+996 555 21-43-65', place: 'мкр. Тунгуч', category: 'kitchen', stage: 'assembly', price: 160000, paid: 96000, pay: 'Элкарт', due: '18.04.2025', note: 'Каркасы собраны, навеска фасадов', cost: 112000, material: 'Egger W980, петли DTC', updated: '2 ч назад' },
    { id: '2025-102', title: 'ТВ-зона из МДФ-реек', client: 'Жылдыз Осмонова', phone: '+996 707 33-22-11', place: 'Кок-Жар', category: 'tv', stage: 'cutting', price: 62000, paid: 31000, pay: 'Наличные', due: '22.04.2025', note: 'Очередь станка #2', cost: 41000, material: 'МДФ 19 мм под покраску', updated: 'вчера' },
    { id: '2025-103', title: 'Островная бар-стойка', client: 'Тимур Бекжанов', phone: '+996 770 55-66-77', place: 'ЖК «Ихлас»', category: 'kitchen', stage: 'contract', price: 78000, paid: 39000, pay: 'MBank QR', due: '30.04.2025', note: 'Договор подписан', cost: 52000, material: 'Egger H1180, AGT', updated: 'вчера' },
    { id: '2025-105', title: 'Кухня Акрил глянец', client: 'Айсулуу Омурбекова', phone: '+996 550 98-76-54', place: 'мкр. Асанбай', category: 'kitchen', stage: 'purchase', price: 124000, paid: 70000, pay: 'Наличные', due: '02.05.2025', note: '«АзияПлит»: AGT Белый (4 л.)', cost: 86000, material: 'AGT акрил, BLUM Tandem', updated: '3 ч назад' },
    { id: '2025-106', title: 'Шкаф-купе с зеркалом Графит', client: 'Улан Касымов', phone: '+996 772 45-67-89', place: 'ул. Боконбаева', category: 'sliding', stage: 'install', price: 68000, paid: 68000, pay: 'Элкарт', due: '14.04.2025', note: 'Сегодня сдача', cost: 44000, material: 'Профиль Aristo, зеркало Графит 4 мм', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCa3wGiuG8v56oB3SVOm_oWM5VL9TqWTGLo_Gt0zvOcZ_18Z6nMec8Y_JQRhYZahuXb-oBmog9sLX2wbiz09mUK_xDheLk9LDqToZa0JhLjUcDDt8OpuOLHxmkRuxXZ5IYKArv1sRLXOJeKLVV-kJVz7B0hm7RN3zjfOiIfhGD4tNJtdLRNhMFzMfgND7zpd4e0TK8HQr09jij5w4ohe3Tn7pNbLTSvkHhMjb066g', updated: '1 ч назад' },
    { id: '2025-107', title: 'Гардеробная Smart-MDF', client: 'Айгуль Садыкова', phone: '+996 555 32-11-90', place: 'ул. Ахунбаева', category: 'dressing', stage: 'contract', price: 90000, paid: 0, pay: 'MBank QR', due: '08.05.2025', note: 'Ждёт QR-аванс 50%', cost: 61000, material: 'Kronospan 18 мм, Hettich', updated: 'сегодня' },
    { id: '2025-108', title: 'Кухня Неоклассика', client: 'Эркин Исаев', phone: '+996 700 98-12-34', place: 'ЖК «Авангард»', category: 'kitchen', stage: 'measure', price: 195000, paid: 0, pay: '—', due: '—', note: '3D в работе', cost: 0, material: 'МДФ эмаль, патина', updated: 'сегодня' },
    { id: '2025-109', title: 'Прихожая + ТВ-зона (коттедж)', client: 'Мирлан Токтосунов', phone: '+996 709 44-55-66', place: 'Чон-Арык', category: 'hallway', stage: 'measure', price: 142000, paid: 0, pay: '—', due: '—', note: '3D готов', cost: 0, material: 'Egger, реечные панели', updated: 'вчера' },
    { id: '2025-110', title: 'Детская на 2 детей', client: 'Гульнара Асанова', phone: '+996 551 77-88-99', place: 'мкр. Джал', category: 'other', stage: 'measure', price: 95000, paid: 0, pay: '—', due: '—', note: 'Замер завтра 11:00', cost: 0, material: 'ЛДСП, МДФ', updated: '2 дня назад' },
    { id: '2025-111', title: 'Гардеробная Soft-touch', client: 'Чынгыз Турдубаев', phone: '+996 777 10-20-30', place: 'ул. Токтогула', category: 'dressing', stage: 'measure', price: 86000, paid: 0, pay: '—', due: '—', note: 'Черновик', cost: 0, material: 'Kronospan 18 мм, LED 4000K', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnAh0njBm003qRmMDqa60JxP8-CIoXwFSpKAqRGWkldmBcG7QmeeG0iNEgi90UaxX5gsXv9W1anXOQui4tNhrOY9qh6e7aOfMhABQK3v09Ck-y_N7qu2IHEcwvu9OZPhVbZahR1hzLlJtEy7tpcOaeqQZK8_vjHSMS7ggeDf6D0jzBCit1W-3E97aDKm054oxVftMPW9CKsfAnnUxjSCAtEJpRX2O4YJQKcUwDWA', updated: '3 дня назад' }
  ];
  MP.archive = [
    { id: '2025-098', title: 'Прихожая мкр. Тунгуч', price: 112000 },
    { id: '2025-097', title: 'Офисные столы (6 шт)', price: 84000 }
  ];
  MP.archiveCount = 8;

  MP.plans = [
    { key: 'start', name: 'Старт', tag: 'Для частников', monthly: 1500, annual: 1200, icon: 'straighten',
      text: 'Для частных замерщиков, сборщиков и мастеров на выезде.',
      features: [['До 10 активных проектов', true], ['1 мастер (телефон/планшет)', true], ['3D-конструктор мебели', true], ['Базовый раскрой в PDF', true], ['Экспорт на ЧПУ (DXF/CSV)', false]] },
    { key: 'pro', name: 'Мастер Pro', tag: 'Хит', monthly: 3800, annual: 3040, icon: 'precision_manufacturing', featured: true,
      text: 'Для мастерских и бригад до 3 специалистов: точный раскрой, этикетки, смета в сомах.',
      features: [['Неограниченно проектов', true], ['До 3 сотрудников с ролями', true], ['Гильотинный раскрой с учётом пропила', true], ['КП и смета в сомах', true], ['Этикетки деталей со штрих-кодом', true]] },
    { key: 'factory', name: 'Цех / Фабрика', tag: 'Производство', monthly: 7500, annual: 6000, icon: 'factory',
      text: 'Для производств со станками с ЧПУ, форматно-раскроечными центрами и сменами.',
      features: [['Безлимит сотрудников и станков', true], ['Экспорт DXF/CSV для ЧПУ', true], ['Склад плит, кромки и обрезков', true], ['QR-оплата клиентов (MBank, О!Деньги)', true], ['Инженер поддержки в Бишкеке', true]] }
  ];

  /* ---------- Состояние проекта (правки из 3D сохраняются в браузере) ---------- */
    MP.state = {
    key: 'mebelpro_state_v1',
    _s: null,
    get() {
      if (this._s) return this._s;
      let s = null;
      try { s = JSON.parse(localStorage.getItem(this.key)); } catch (e) { s = null; }
      if (!s || !Array.isArray(s.modules) || s.modules.some((m) => !m || !m.id || !m.type || !(m.w > 0))) s = { t: 16, modules: clone(MP.defaultModules) };
      s.decor = Object.assign({}, MP.defaultDecor, s.decor || {});
      this._s = s;
      return s;
    },
    set(s) { this._s = s; MP._calc = null; try { localStorage.setItem(this.key, JSON.stringify(s)); } catch (e) { /* приватный режим */ } },
    reset() { try { localStorage.removeItem(this.key); } catch (e) { /* */ } this._s = null; MP._calc = null; return this.get(); },
    isModified(s) {
      s = s || this.get();
      return this.diff(s).length > 0;
    },
    diff(s) {
      s = s || this.get();
      const out = [];
      s.modules.forEach((m) => {
        const o = MP.defaultModules.find((d) => d.id === m.id);
        if (!o) return;
        ['w', 'h', 'd', 'x', 'y', 'z'].forEach((k) => {
          if (o[k] !== m[k]) out.push({ code: m.code, field: { w: 'Ширина', h: 'Высота', d: 'Глубина', x: 'Позиция X', y: 'Позиция Y', z: 'Позиция Z' }[k], from: o[k], to: m[k] });
        });
      });
      if (s.t !== 16) out.push({ code: 'Проект', field: 'Толщина ЛДСП', from: 16, to: s.t });
      if (s.room && ['L', 'W', 'H'].some((k) => s.room[k] !== MP.project.room[k])) out.push({ code: 'Проект', field: 'Размеры комнаты', from: MP.project.room.L + '×' + MP.project.room.W + '×' + MP.project.room.H, to: s.room.L + '×' + s.room.W + '×' + s.room.H, text: true });
      const dc = s.decor || MP.defaultDecor;
      Object.keys(MP.defaultDecor).forEach((k) => { if (dc[k] !== MP.defaultDecor[k]) out.push({ code: 'Проект', field: 'Цвет: ' + MP.decorLabels[k].toLowerCase(), from: MP.decor(k, MP.defaultDecor[k]).name, to: MP.decor(k, dc[k]).name, text: true }); });
      const ids = new Set(MP.defaultModules.map((m) => m.id)), cur = new Set(s.modules.map((m) => m.id));
      s.modules.filter((m) => !ids.has(m.id)).forEach((m) => out.push({ code: m.code, field: 'Добавлен модуль', from: '—', to: m.w + '×' + m.h + '×' + m.d, text: true }));
      MP.defaultModules.filter((m) => !cur.has(m.id)).forEach((m) => out.push({ code: m.code, field: 'Удалён модуль', from: m.w + '×' + m.h + '×' + m.d, to: '—', text: true }));
      const fillTxt = (m) => (m.shelves || 0) + ' полк.' + (m.fill && m.fill.inner ? ', ' + m.fill.inner + ' вн. ящ.' : '') + (m.fill && m.fill.rod ? ', штанга' : '') + (m.fill && m.fill.dryer ? ', сушка' : '');
      s.modules.forEach((m) => { const o = MP.defaultModules.find((d) => d.id === m.id); if (o && fillTxt(o) !== fillTxt(m)) out.push({ code: m.code, field: 'Наполнение', from: fillTxt(o), to: fillTxt(m), text: true }); });
      s.modules.forEach((m) => { if (m.facade) out.push({ code: m.code, field: 'Цвет фасадов модуля', from: 'как в проекте', to: MP.decor('facade', m.facade).name, text: true }); });
      return out;
    }
  };

  /* ---------- Фасады модуля (общие для 3D и спецификации) ---------- */
  MP.frontsFor = function (m) {
    const g = MP.settings.gap, F = [];
    if (m.front === 'corner') {
      F.push({ kind: 'panel', w: Math.round(m.w / 2 - 2 * g), h: m.h - 2 * g, x: g, y: g });
      F.push({ kind: 'door', w: Math.round(m.w / 2 - 2 * g), h: m.h - 2 * g, x: m.w / 2 + g, y: g, hinge: 'R' });
    } else if (m.front === 'doors') {
      const n = m.doors || (m.w > 600 ? 2 : 1), cell = m.w / n;
      for (let i = 0; i < n; i++) F.push({ kind: 'door', w: Math.round(cell - 2 * g), h: m.h - 2 * g, x: i * cell + g, y: g, hinge: n === 1 || i === 0 ? 'L' : 'R' });
    } else if (m.front === 'drawers3') {
      const top = 176, rest = Math.round((m.h - 6 * g - top) / 2);
      let y = g;
      [rest, rest, top].forEach((h) => { F.push({ kind: 'drawer', w: m.w - 2 * g, h, x: g, y }); y += h + 2 * g; });
    } else if (m.front === 'lift') {
      F.push({ kind: 'lift', w: m.w - 2 * g, h: m.h - 2 * g, x: g, y: g });
    } else if (m.front === 'oven') {
      F.push({ kind: 'drawer', w: m.w - 2 * g, h: 116, x: g, y: g });
    } else if (m.front === 'appliance') {
      F.push({ kind: 'appl', w: m.w - 2 * g, h: m.h - 2 * g, x: g, y: g });
    } else if (m.front === 'tall') {
      const low = 716, niche = 400, topY = low + 2 * g + niche;
      F.push({ kind: 'door', w: m.w - 2 * g, h: low, x: g, y: g, hinge: 'L' });
      F.push({ kind: 'door', w: m.w - 2 * g, h: m.h - topY - g, x: g, y: topY, hinge: 'L' });
    }
    return F;
  };
  const isBaseLike = (m) => ['base', 'oven', 'island'].includes(m.type);

  /* ---------- Каталог модулей ---------- */
  const T = (group, code, name, type, front, w, h, d, extra) => Object.assign({ group, code, name, type, front, w, h, d, shelves: 0 }, extra || {});
  MP.catalog = [
    T('Нижние', 'Н-300', 'Нижний 300', 'base', 'doors', 300, 720, 560, { doors: 1, shelves: 1 }),
    T('Нижние', 'Н-400', 'Нижний 400', 'base', 'doors', 400, 720, 560, { doors: 1, shelves: 1 }),
    T('Нижние', 'Н-450', 'Нижний 450', 'base', 'doors', 450, 720, 560, { doors: 1, shelves: 1 }),
    T('Нижние', 'Н-600', 'Нижний 600', 'base', 'doors', 600, 720, 560, { doors: 1, shelves: 1 }),
    T('Нижние', 'Н-800', 'Нижний 800, 2 двери', 'base', 'doors', 800, 720, 560, { doors: 2, shelves: 1 }),
    T('Нижние', 'Н-400-Я3', 'Ящики 400', 'base', 'drawers3', 400, 720, 560),
    T('Нижние', 'Н-600-Я3', 'Ящики 600', 'base', 'drawers3', 600, 720, 560),
    T('Нижние', 'Н-800-Я3', 'Ящики 800', 'base', 'drawers3', 800, 720, 560),
    T('Нижние', 'Н-800-М', 'Под мойку 800', 'base', 'doors', 800, 720, 560, { doors: 2, sink: true }),
    T('Нижние', 'Н-600-Д', 'Под духовку 600', 'oven', 'oven', 600, 720, 560),
    T('Нижние', 'НУ-900', 'Угловой 900', 'base', 'corner', 900, 720, 560, { shelves: 1 }),
    T('Нижние', 'ПММ-450', 'Посудомойка 450', 'appliance', 'appliance', 450, 720, 560),
    T('Нижние', 'ПММ-600', 'Посудомойка 600', 'appliance', 'appliance', 600, 720, 560),
    T('Верхние', 'В-300', 'Верхний 300', 'upper', 'doors', 300, 720, 320, { doors: 1, shelves: 1 }),
    T('Верхние', 'В-400', 'Верхний 400', 'upper', 'doors', 400, 720, 320, { doors: 1, shelves: 1 }),
    T('Верхние', 'В-450', 'Верхний 450', 'upper', 'doors', 450, 720, 320, { doors: 1, shelves: 1 }),
    T('Верхние', 'В-600', 'Верхний 600', 'upper', 'doors', 600, 720, 320, { doors: 1, shelves: 1 }),
    T('Верхние', 'В-800', 'Верхний 800', 'upper', 'doors', 800, 720, 320, { doors: 2, shelves: 1 }),
    T('Верхние', 'В-900', 'Верхний 900', 'upper', 'doors', 900, 720, 320, { doors: 2, shelves: 1 }),
    T('Верхние', 'В-800-С', 'Верхний 800 с сушкой', 'upper', 'doors', 800, 720, 320, { doors: 2, fill: { dryer: true } }),
    T('Верхние', 'В-600-Г', 'Под вытяжку, подъёмник', 'upper', 'lift', 600, 360, 320),
    T('Пеналы и шкафы', 'П-600', 'Пенал: СВЧ + бакалея', 'tall', 'tall', 600, 2080, 560, { shelves: 2 }),
    T('Пеналы и шкафы', 'П-450', 'Пенал 450 с полками', 'tall', 'doors', 450, 2080, 560, { doors: 1, shelves: 4, niche: false }),
    T('Пеналы и шкафы', 'Ш-600', 'Шкаф платяной 600', 'tall', 'doors', 600, 2300, 600, { doors: 1, shelves: 2, niche: false, fill: { rod: true } }),
    T('Пеналы и шкафы', 'Ш-900', 'Шкаф платяной 900', 'tall', 'doors', 900, 2300, 600, { doors: 2, shelves: 2, niche: false, fill: { rod: true } }),
    T('Пеналы и шкафы', 'Т-800', 'Тумба-обувница 800', 'base', 'doors', 800, 450, 350, { doors: 2, shelves: 1, noTop: true }),
    T('Остров', 'О-600-Я3', 'Остров: 3 ящика', 'island', 'drawers3', 600, 720, 560),
    T('Остров', 'О-800-2Д', 'Остров: 2 двери 800', 'island', 'doors', 800, 720, 560, { doors: 2, shelves: 1 }),
    T('Остров', 'О-1000-2Д', 'Остров: 2 двери 1000', 'island', 'doors', 1000, 720, 560, { doors: 2, shelves: 1 })
  ];

  /* ---------- Расстановка: ряды, свободные места, привязка ---------- */
  MP.TOP_LINE = 2178; // верх навесных шкафов и пеналов, мм от пола
  MP.layerY = (m) => (m.type === 'upper' ? MP.TOP_LINE - m.h : 100);
  MP.placeLabel = (m) => (m.type === 'island' ? 'Остров' : m.type === 'upper' ? 'Стена А, верх' : 'Стена А');
  const sameRow = (a, b) => (a.type === 'island') === (b.type === 'island') && a.y < b.y + b.h && b.y < a.y + a.h;
  function freeSlots(mods, m, room) {
    const ints = mods.filter((o) => o.id !== m.id && sameRow(o, m)).map((o) => [o.x, o.x + o.w]).sort((a, b) => a[0] - b[0]);
    const free = [];
    let cur = 0;
    ints.forEach(([a, b]) => { if (a > cur) free.push([cur, a]); cur = Math.max(cur, b); });
    if (cur < room.L) free.push([cur, room.L]);
    return free;
  }
  let uidN = 0;
  const newId = () => 'u' + Date.now().toString(36) + (++uidN).toString(36);
  MP.placeModule = function (mods, tpl, room, prefX) {
    const m = clone(tpl);
    delete m.group;
    m.id = newId();
    m.y = MP.layerY(m);
    if (m.type === 'island') {
      const isl = mods.filter((o) => o.type === 'island');
      m.z = isl.length ? isl[0].z : 1540; m.facing = '-z';
      if (prefX == null) prefX = isl.length ? Math.max(...isl.map((o) => o.x + o.w)) + m.w / 2 : room.L / 2;
    } else { m.z = 0; m.facing = '+z'; }
    const free = freeSlots(mods, m, room).filter(([a, b]) => b - a >= m.w);
    if (!free.length) return null;
    let x = free[0][0];
    if (prefX != null) {
      let best = null;
      free.forEach(([a, b]) => { const cx = Math.min(Math.max(prefX - m.w / 2, a), b - m.w); const dist = Math.abs(cx + m.w / 2 - prefX); if (!best || dist < best.d) best = { x: cx, d: dist, a, b }; });
      x = best.x;
      if (x - best.a < 80) x = best.a; else if (best.b - (x + m.w) < 80) x = best.b - m.w;
    }
    m.x = Math.round(x);
    m.place = MP.placeLabel(m);
    return m;
  };
  // Привязка при перетаскивании: к краям соседей в том же ряду и к стенам (60 мм)
  MP.snapX = function (mods, m, x, room) {
    x = Math.max(0, Math.min(room.L - m.w, x));
    const edges = [0, room.L];
    mods.forEach((o) => { if (o.id !== m.id && sameRow(o, m)) edges.push(o.x, o.x + o.w); });
    let best = null;
    edges.forEach((e) => [e, e - m.w].forEach((cand) => { const d = Math.abs(cand - x); if (d < 60 && (!best || d < best.d)) best = { x: cand, d }; }));
    return Math.round(best ? best.x : x);
  };
  // Прижать модуль к соседу слева (-1) или справа (+1)
  MP.pushX = function (mods, m, room, dir) {
    const row = mods.filter((o) => o.id !== m.id && sameRow(o, m));
    if (dir < 0) return Math.round(row.filter((o) => o.x + o.w <= m.x + 0.5).reduce((s, o) => Math.max(s, o.x + o.w), 0));
    return Math.round(row.filter((o) => o.x >= m.x + m.w - 0.5).reduce((s, o) => Math.min(s, o.x), room.L) - m.w);
  };
  // Фальш-планки: щели 4–149 мм между модулями и до стены закрываются планкой в цвет фасадов
  MP.fillersFor = function (mods, room) {
    const out = [];
    const rows = [mods.filter((m) => m.z < 100 && m.type !== 'upper' && m.type !== 'island'), mods.filter((m) => m.z < 100 && (m.type === 'upper' || m.type === 'tall'))];
    rows.forEach((row, ri) => {
      const list = row.slice().sort((a, b) => a.x - b.x);
      if (!list.length) return;
      const seq = [{ x: 0, w: 0, wall: true }].concat(list, [{ x: room.L, w: 0, wall: true }]);
      for (let i = 0; i < seq.length - 1; i++) {
        const a = seq[i], b = seq[i + 1], gap = b.x - (a.x + a.w);
        if (gap < 4 || gap >= 150) continue;
        const nb = [a, b].filter((o) => !o.wall);
        if (!nb.length) continue;
        if (ri === 1 && !nb.some((o) => o.type === 'upper')) continue;
        const ref = ri === 1 ? nb.find((o) => o.type === 'upper') : nb.find((o) => o.type !== 'tall') || nb[0];
        out.push({ x: Math.round(a.x + a.w), w: Math.round(gap), y: ref.y, h: ref.h, d: ref.d, row: ri ? 'up' : 'low' });
      }
    });
    return out;
  };

  /* ---------- Шаблоны и автоматическая расстановка ---------- */
  const fromCat = (code, x, extra) => {
    const m = Object.assign(clone(MP.catalog.find((c) => c.code === code)), extra || {});
    delete m.group;
    m.id = newId(); m.x = Math.round(x); m.y = MP.layerY(m);
    m.z = m.type === 'island' ? 1540 : 0; m.facing = m.type === 'island' ? '-z' : '+z'; m.place = MP.placeLabel(m);
    return m;
  };
  // Ширины модулей для отрезка: остаток < 150 мм уходит под фальш-планку
  function fillRun(len) {
    const sizes = [800, 600, 450, 400, 300], out = [];
    while (len >= 300) {
      const w = sizes.find((s) => s <= len && (len - s === 0 || len - s >= 300 || len - s < 150)) || sizes.find((s) => s <= len);
      out.push(w); len -= w;
    }
    return out;
  }
  MP.autoKitchen = function (room, island) {
    const L = room.L, M = [];
    const pantry = L >= 2600;
    const endX = pantry ? L - 50 - 600 : L;
    const water = (MP.utilities.water[0].x + MP.utilities.water[1].x) / 2;
    let x = 0;
    fillRun(Math.max(0, Math.min(water - 400, endX - 1850))).forEach((w) => { M.push(fromCat(w === 600 ? 'Н-600-Я3' : 'Н-' + w, x)); x += w; });
    M.push(fromCat('Н-800-М', x)); x += 800;
    M.push(fromCat('ПММ-450', x)); x += 450;
    M.push(fromCat('Н-600-Д', x)); x += 600;
    fillRun(endX - x).forEach((w) => { M.push(fromCat(w === 800 ? 'Н-800-Я3' : 'Н-' + w, x)); x += w; });
    if (pantry) M.push(fromCat('П-600', endX));
    M.filter((m) => m.type !== 'tall').forEach((b) => M.push(fromCat(b.type === 'oven' ? 'В-600-Г' : b.sink ? 'В-800-С' : 'В-' + b.w, b.x)));
    if (island) { const ix = Math.round(L / 2 - 800); M.push(fromCat('О-600-Я3', ix)); M.push(fromCat('О-1000-2Д', ix + 600)); }
    return M;
  };
  MP.autoWardrobe = function (room) {
    const width = Math.min(room.L - 100, 2400), M = [];
    let x = 0;
    while (width - x >= 900) { M.push(fromCat('Ш-900', x)); x += 900; }
    if (width - x >= 600) { M.push(fromCat('Ш-600', x)); x += 600; }
    if (width - x >= 450) { M.push(fromCat('П-450', x, { h: 2300, d: 600, code: 'Ш-450', name: 'Шкаф 450 с полками' })); x += 450; }
    return M;
  };
  MP.templates = [
    { key: 'demo', name: 'Кухня с островом (как v1.2)', icon: 'countertops', text: 'Угловой модуль, мойка, ПММ, духовка, пенал и остров.', build: () => clone(MP.defaultModules) },
    { key: 'straight', name: 'Прямая кухня по стене', icon: 'kitchen', text: 'Мойка у вывода воды, ПММ, духовка, пенал. Верхние — над нижними.', build: (room) => MP.autoKitchen(room, false) },
    { key: 'straight-island', name: 'Прямая кухня + остров', icon: 'table_restaurant', text: 'Автораскладка по стене и остров 1600 мм.', build: (room) => MP.autoKitchen(room, true) },
    { key: 'wardrobe', name: 'Распашной шкаф до 2400 мм', icon: 'door_front', text: 'Секции 900/600 со штангой и полками, высота 2400.', build: (room) => MP.autoWardrobe(room) },
    { key: 'hallway', name: 'Прихожая', icon: 'meeting_room', text: 'Шкаф со штангой, обувница и навесной шкаф.', build: () => [fromCat('Ш-600', 0), fromCat('Т-800', 600), fromCat('В-800', 600, { name: 'Навесной над обувницей' })] },
    { key: 'empty', name: 'Пустая комната', icon: 'crop_free', text: 'Расставьте модули из каталога сами.', build: () => [] }
  ];

  /* ---------- Деталировка ---------- */
  function partsForModule(m, t, decor) {
    const fmat = 'mdf-' + (m.facade || decor.facade);
    const P = [], iw = m.w - 2 * t;
    const E = (a, b, c, d) => ({ L1: a || '', L2: b || '', W1: c || '', W2: d || '' });
    const add = (name, mat, L, W, qty, edge, group, drill, groove) =>
      qty > 0 && P.push({ name, mat, L: Math.round(L), W: Math.round(W), qty, edge, group, drill: drill || '—', groove: !!groove, module: m.code, mid: m.id });
    if (isBaseLike(m)) {
      add('Боковина', 'ldsp', m.h, m.d, 2, E('2.0', '0.4', '0.4'), 'carcass', 'Петли/направляющие, конфирмат', true);
      add('Дно', 'ldsp', iw, m.d, 1, E('2.0'), 'carcass', 'Шкант + конфирмат', true);
      add('Царга', 'ldsp', iw, 80, 2, E('0.4'), 'carcass', 'Конфирмат');
      add('Полка', 'ldsp', iw - 2, m.d - 20, m.shelves || 0, E('2.0', '0.4', '0.4', '0.4'), 'carcass', 'Полкодержатели');
      if (!m.sink) add('Задняя стенка', 'hdf', m.h - 20, iw + 14, 1, E(), 'back');
      if (m.front === 'drawers3') {
        add('Дно ящика', 'ldsp', iw - 75, 476, 3, E('0.4'), 'drawers', 'Крепление к Tandembox');
        add('Задняя стенка ящика', 'ldsp', iw - 87, 140, 3, E('0.4'), 'drawers', 'Кронштейн задней стенки');
      }
    } else if (m.type === 'upper') {
      add('Боковина', 'ldsp', m.h, m.d, 2, E('2.0', '0.4', '0.4', '0.4'), 'carcass', 'Петли, навесы Camar', true);
      add('Дно', 'ldsp', iw, m.d, 1, E('2.0'), 'carcass', 'Шкант + конфирмат', true);
      add('Крыша', 'ldsp', iw, m.d, 1, E('2.0'), 'carcass', 'Шкант + конфирмат');
      add('Полка', 'ldsp', iw - 2, m.d - 20, m.shelves || 0, E('2.0', '0.4', '0.4', '0.4'), 'carcass', 'Полкодержатели');
      add('Задняя стенка', 'hdf', m.h - 20, iw + 14, 1, E(), 'back');
    } else if (m.type === 'tall') {
      add('Боковина', 'ldsp', m.h, m.d, 2, E('2.0', '0.4', '0.4', '0.4'), 'carcass', 'Петли, конфирмат', true);
      add('Дно', 'ldsp', iw, m.d, 1, E('2.0'), 'carcass', 'Шкант + конфирмат', true);
      add('Крыша', 'ldsp', iw, m.d, 1, E('2.0'), 'carcass', 'Шкант + конфирмат');
      if (m.niche !== false) add('Полка ниши СВЧ', 'ldsp', iw, m.d, 2, E('2.0'), 'carcass', 'Конфирмат');
      add('Полка', 'ldsp', iw - 2, m.d - 20, m.shelves || 0, E('2.0', '0.4', '0.4', '0.4'), 'carcass', 'Полкодержатели');
      add('Задняя стенка', 'hdf', m.h - 20, iw + 14, 1, E(), 'back');
    }
    const inner = (m.fill && m.fill.inner) || 0;
    if (inner && m.type !== 'upper' && m.type !== 'appliance') {
      add('Фасад внутреннего ящика', 'ldsp', iw - 4, 150, inner, E('2.0', '0.4', '0.4', '0.4'), 'drawers', 'Крепление к Tandembox');
      add('Дно ящика', 'ldsp', iw - 75, Math.min(476, m.d - 84), inner, E('0.4'), 'drawers', 'Крепление к Tandembox');
      add('Задняя стенка ящика', 'ldsp', iw - 87, 110, inner, E('0.4'), 'drawers', 'Кронштейн задней стенки');
    }
    MP.frontsFor(m).forEach((f) => {
      const nm = { door: 'Фасад двери', drawer: 'Фасад ящика', lift: 'Фасад подъёмный', appl: 'Фасад ПММ', panel: 'Глухая панель' }[f.kind];
      add(nm, fmat, f.h, f.w, 1, E('PUR', 'PUR', 'PUR', 'PUR'), 'facades', f.kind === 'door' ? 'Чашка петли Ø35' : f.kind === 'panel' ? 'Конфирмат' : 'Ручка');
    });
    return P;
  }

  function hardwareForModule(m) {
    const H = {}, inc = (k, n) => { if (n > 0) H[k] = (H[k] || 0) + n; };
    const fronts = MP.frontsFor(m);
    fronts.forEach((f) => {
      if (f.kind === 'door') inc('hinge', f.h <= 900 ? 2 : f.h <= 1600 ? 3 : 4);
      if (f.kind === 'drawer') inc('runner', 1);
      if (f.kind === 'lift') inc('lift', 1);
      if (f.kind !== 'panel') inc('handle', 1);
    });
    if (m.type !== 'appliance') {
      const fix = m.type === 'tall' ? 16 : 8;
      inc('confirmat', fix); inc('dowel', fix);
      inc('shelfPin', (m.shelves || 0) * 4);
    }
    if (m.type === 'upper') inc('hanger', 2);
    const fill = m.fill || {};
    if (fill.rod) inc('rod', 1);
    if (fill.dryer) inc('dryer', 1);
    if (fill.inner && m.type !== 'upper' && m.type !== 'appliance') inc('runner', fill.inner);
    if (isBaseLike(m) || m.type === 'tall') inc('leg', m.w > 800 ? 6 : 4);
    return H;
  }

  MP.hardwareFor = hardwareForModule;

  function aggregate(parts) {
    const map = new Map();
    parts.forEach((p) => {
      const k = [p.mid, p.name, p.mat, p.L, p.W, JSON.stringify(p.edge)].join('|');
      if (map.has(k)) map.get(k).qty += p.qty; else map.set(k, Object.assign({}, p));
    });
    const out = [...map.values()];
    const order = { carcass: 0, drawers: 1, facades: 2, back: 3 };
    out.sort((a, b) => order[a.group] - order[b.group] || a.mid.localeCompare(b.mid, 'ru', { numeric: true }));
    out.forEach((p, i) => { p.pos = i + 1; p.code = 'MP104-' + String(i + 1).padStart(2, '0'); p.cnc = (p.module + '_' + (i + 1)).replace(/[^A-Za-z0-9_]/g, (c) => ({ 'Н': 'N', 'В': 'V', 'П': 'P', 'У': 'U', 'М': 'M', 'Д': 'D', 'Я': 'Y', 'Г': 'G', 'С': 'S', 'Ж': 'Z' }[c] || '')) + '.nc'; });
    return out;
  }

  /* ---------- Гильотинный раскрой (подходит для форматно-раскроечного станка) ---------- */
  MP.pack = function (items, opt) {
    const K = opt.kerf, UW = opt.L - 2 * opt.trim + K, UH = opt.W - 2 * opt.trim + K;
    function run(list) {
      const sheets = [];
      for (const it of list) {
        const w = it.w + K, h = it.h + K;
        let placed = false;
        for (const s of sheets) if (insert(s, it, w, h)) { placed = true; break; }
        if (!placed) {
          const s = { free: [{ x: 0, y: 0, w: UW, h: UH }], parts: [] };
          sheets.push(s);
          if (!insert(s, it, w, h)) s.parts.push({ x: 0, y: 0, w: it.w, h: it.h, ref: it.ref, oversize: true });
        }
      }
      return sheets;
    }
    function insert(s, it, w, h) {
      let best = null;
      s.free.forEach((f, i) => {
        [[w, h, false], [h, w, true]].forEach(([ww, hh, rot]) => {
          if (rot && !it.rotate) return;
          if (ww <= f.w && hh <= f.h) {
            const ss = Math.min(f.w - ww, f.h - hh), ls = Math.max(f.w - ww, f.h - hh);
            if (!best || ss < best.ss || (ss === best.ss && ls < best.ls)) best = { i, f, ww, hh, rot, ss, ls };
          }
        });
      });
      if (!best) return false;
      const { f, ww, hh } = best;
      s.free.splice(best.i, 1);
      const rw = f.w - ww, rh = f.h - hh;
      let a, b;
      if (rw < rh) { a = { x: f.x + ww, y: f.y, w: rw, h: hh }; b = { x: f.x, y: f.y + hh, w: f.w, h: rh }; }
      else { a = { x: f.x + ww, y: f.y, w: rw, h: f.h }; b = { x: f.x, y: f.y + hh, w: ww, h: rh }; }
      [a, b].forEach((r) => { if (r.w > K && r.h > K) s.free.push(r); });
      s.parts.push({ x: f.x, y: f.y, w: ww - K, h: hh - K, rot: best.rot, ref: it.ref });
      return true;
    }
    const orders = [
      (a, b) => b.w * b.h - a.w * a.h,
      (a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h),
      (a, b) => Math.min(b.w, b.h) - Math.min(a.w, a.h) || Math.max(b.w, b.h) - Math.max(a.w, a.h)
    ];
    const area = (s) => s.parts.reduce((t, p) => t + p.w * p.h, 0);
    let best = null;
    orders.forEach((o) => {
      const r = run(items.slice().sort(o));
      if (!best || r.length < best.length || (r.length === best.length && area(r[r.length - 1]) < area(best[best.length - 1]))) best = r;
    });
    return best.map((s, i) => {
      const used = area(s);
      const rem = s.free.map((f) => ({ x: f.x, y: f.y, w: f.w - K, h: f.h - K })).filter((f) => f.w >= 200 && f.h >= 200).sort((p, q) => q.w * q.h - p.w * p.h)[0] || null;
      return { n: i + 1, parts: s.parts, util: used / (opt.L * opt.W), used, remnant: rem, trim: opt.trim, L: opt.L, W: opt.W };
    });
  };

  /* ---------- Проверки перед производством ---------- */
  function checks(mods, room) {
    const out = [], box = (m) => ({ x0: m.x, x1: m.x + m.w, y0: m.y, y1: m.y + m.h, z0: m.z, z1: m.z + m.d });
    const ov = (a, b) => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 0.5 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 0.5 && Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0) > 0.5;
    const clashes = [];
    for (let i = 0; i < mods.length; i++) for (let j = i + 1; j < mods.length; j++) if (ov(box(mods[i]), box(mods[j]))) clashes.push(mods[i].code + ' ↔ ' + mods[j].code);
    const outside = mods.filter((m) => m.x < 0 || m.z < 0 || m.x + m.w > room.L || m.z + m.d > room.W || m.y + m.h > room.H).map((m) => m.code);
    out.push({ key: 'collide', title: 'Пересечения модулей', status: clashes.length || outside.length ? 'error' : 'ok',
      text: clashes.length ? 'Пересекаются: ' + clashes.join(', ') : outside.length ? 'Выходят за стены: ' + outside.join(', ') : 'Модули не пересекаются и помещаются в комнату ' + room.L + '×' + room.W + ' мм.' });

    const U = MP.utilitiesFor(room), sockBad = [];
    U.sockets.forEach((s) => { const b = { x0: s.x - 40, x1: s.x + 40, y0: s.y - 40, y1: s.y + 40, z0: 0, z1: 20 }; mods.forEach((m) => { if (ov(b, box(m))) sockBad.push(m.code); }); });
    let gasGap = Infinity;
    mods.forEach((m) => {
      const dx = Math.max(m.x - (U.gas.x + U.gas.r), (U.gas.x - U.gas.r) - (m.x + m.w), 0);
      const dz = Math.max(m.z - (U.gas.z + U.gas.r), (U.gas.z - U.gas.r) - (m.z + m.d), 0);
      gasGap = Math.min(gasGap, Math.hypot(dx, dz));
    });
    const sink = mods.find((m) => m.sink);
    const waterOk = !sink || U.water.every((w) => w.x > sink.x && w.x < sink.x + sink.w);
    out.push({ key: 'utils', title: 'Коммуникации', status: sockBad.length || gasGap < 5 ? 'error' : !waterOk || gasGap < 15 ? 'warn' : 'ok',
      text: (sockBad.length ? 'Розетки перекрыты: ' + [...new Set(sockBad)].join(', ') + '. ' : '3 розетки 220V свободны. ') +
        'Зазор до газового стояка ' + Math.round(gasGap) + ' мм. ' + (!sink ? 'Мойки в проекте нет.' : waterOk ? 'Выводы воды в зоне мойки.' : 'Выводы воды вне шкафа под мойку!') });

    const shallow = mods.filter((m) => (m.front === 'drawers3' || m.front === 'oven') && m.d < 510).map((m) => m.code);
    const wide = mods.filter((m) => MP.frontsFor(m).some((f) => f.kind === 'door' && f.w > 600)).map((m) => m.code);
    out.push({ key: 'hardware', title: 'Фурнитура', status: shallow.length ? 'error' : wide.length ? 'warn' : 'ok',
      text: shallow.length ? 'Глубина < 510 мм — не встанут направляющие 500 мм: ' + shallow.join(', ') : wide.length ? 'Двери шире 600 мм (нагрузка на петли): ' + wide.join(', ') : 'Петли 110° и направляющие 500 мм подходят по размерам.' });

    const wallTop = mods.filter((m) => m.z < 100 && isBaseLike(m)).reduce((z, m) => Math.max(z, m.z + m.d + 40), 0);
    const isl = mods.filter((m) => m.type === 'island');
    const pass = isl.length ? Math.min(...isl.map((m) => m.z)) - 40 - wallTop : null;
    out.push({ key: 'passage', title: 'Проход до острова', status: pass === null ? 'ok' : pass >= 900 ? 'ok' : pass >= 800 ? 'warn' : 'error',
      text: pass === null ? 'Острова нет.' : 'Проход ' + Math.round(pass) + ' мм (норма от 900 мм).' });

    const oven = mods.find((m) => m.type === 'oven');
    const hood = oven && mods.find((m) => m.type === 'upper' && m.x < oven.x + oven.w && m.x + m.w > oven.x);
    const hob = hood ? hood.y - (oven.y + oven.h + MP.settings.topT) : null;
    out.push({ key: 'hob', title: 'Над варочной панелью', status: hob === null || hob >= 650 ? 'ok' : 'error',
      text: hob === null ? 'Над варочной панелью шкафов нет.' : 'От варочной панели до шкафа ' + Math.round(hob) + ' мм (норма от 650 мм).' });

    const holes = [];
    [mods.filter((m) => m.z < 100 && m.type !== 'upper' && m.type !== 'island'), mods.filter((m) => m.z < 100 && m.type === 'upper'), mods.filter((m) => m.type === 'island')].forEach((row) => {
      const l = row.slice().sort((a, b) => a.x - b.x);
      for (let i = 0; i < l.length - 1; i++) { const g = l[i + 1].x - (l[i].x + l[i].w); if (g >= 150) holes.push(l[i].code + ' … ' + l[i + 1].code + ': ' + Math.round(g) + ' мм'); }
    });
    const fil = MP.fillersFor(mods, room);
    out.push({ key: 'gaps', title: 'Щели и фальш-планки', status: holes.length ? 'warn' : 'ok',
      text: holes.length ? 'Пустое место: ' + holes.join('; ') + '. Добавьте модуль из каталога или сдвиньте соседей.' : fil.length ? 'Фальш-планки ' + fil.map((f) => f.w + ' мм').join(', ') + ' добавлены в раскрой.' : 'Щелей между модулями нет.' });

    out.push({ key: 'edge', title: 'Кромление и зазоры', status: 'ok', text: 'Зазор фасадов 2 мм по периметру. Видимые торцы — ПВХ 2.0, фасады — PUR.' });
    return out;
  }

  /* ---------- Главный расчёт ---------- */
  MP.calc = function (state, opts) {
    if (!state && !opts && MP._calc) return MP._calc;
    state = state || MP.state.get();
    const t = state.t || 16, mods = state.modules, st = Object.assign({}, MP.settings, opts || {}), room = state.room || MP.project.room;
    const decor = Object.assign({}, MP.defaultDecor, state.decor || {});
    const fillers = MP.fillersFor(mods, room);
    const fillerParts = fillers.map((f, i) => ({ name: 'Фальш-планка', mat: 'mdf-' + decor.facade, L: f.h - 4, W: f.w + 20, qty: 1, edge: { L1: 'PUR', L2: '', W1: '', W2: '' }, group: 'facades', drill: 'Подрезка по месту, крепление к боковине', groove: false, module: 'Фальш-' + (i + 1), mid: 'zf' + i }));
    const parts = aggregate(mods.flatMap((m) => partsForModule(m, t, decor)).concat(fillerParts));
    const matKeys = [...new Set(parts.map((p) => p.mat))].sort((a, b) => (a === 'ldsp' ? -1 : b === 'ldsp' ? 1 : a === 'hdf' ? 1 : b === 'hdf' ? -1 : a.localeCompare(b)));
    const mats = {};
    matKeys.forEach((k) => (mats[k] = MP.matInfo(k, decor)));
    const layouts = {}, sheets = {}, util = {}, area = {};
    matKeys.forEach((k) => {
      const mat = mats[k], items = [];
      parts.filter((p) => p.mat === k).forEach((p) => { for (let i = 0; i < p.qty; i++) items.push({ w: p.L, h: p.W, ref: p.pos, rotate: true }); });
      layouts[k] = items.length ? MP.pack(items, { L: mat.L, W: mat.W, kerf: st.kerf, trim: st.trim }) : [];
      sheets[k] = layouts[k].length;
      area[k] = items.reduce((s, i) => s + i.w * i.h, 0) / 1e6;
      util[k] = sheets[k] ? area[k] / (sheets[k] * mat.L * mat.W / 1e6) : 0;
    });
    // Сводно по типам (все декоры МДФ вместе) — для KPI и сравнения версий
    const mdfKeys = matKeys.filter((k) => k.startsWith('mdf-'));
    sheets.mdf = mdfKeys.reduce((s, k) => s + sheets[k], 0);
    area.mdf = mdfKeys.reduce((s, k) => s + area[k], 0);
    util.mdf = sheets.mdf ? area.mdf / (sheets.mdf * 2.8 * 2.07) : 0;
    ['ldsp', 'hdf'].forEach((k) => { if (!(k in sheets)) { sheets[k] = 0; area[k] = 0; util[k] = 0; layouts[k] = []; } });
    const topDecor = MP.decor('top', decor.top);
    // Кромка (+8% на подрезку)
    const edges = { '2.0': 0, '0.4': 0, PUR: 0 };
    parts.forEach((p) => { ['L1', 'L2'].forEach((s) => { if (p.edge[s]) edges[p.edge[s]] += p.L * p.qty; }); ['W1', 'W2'].forEach((s) => { if (p.edge[s]) edges[p.edge[s]] += p.W * p.qty; }); });
    Object.keys(edges).forEach((k) => (edges[k] = Math.round(edges[k] / 1000 * 1.08 * 10) / 10));
    const edgeTotal = Object.values(edges).reduce((a, b) => a + b, 0);
    // Столешницы
    const wallRun = mods.filter((m) => m.z < 100 && !m.noTop && (isBaseLike(m) || m.type === 'appliance'));
    const isl = mods.filter((m) => m.type === 'island');
    const span = (list) => (list.length ? Math.max(...list.map((m) => m.x + m.w)) - Math.min(...list.map((m) => m.x)) : 0);
    const tops = [];
    if (wallRun.length) tops.push({ key: 'wall', len: span(wallRun), depth: 600, qty: Math.ceil(span(wallRun) / MP.tops.wall.L) });
    if (isl.length) tops.push({ key: 'island', len: span(isl), depth: 900, qty: Math.ceil(span(isl) / MP.tops.island.L) });
    // Фурнитура
    const hw = {};
    mods.forEach((m) => { const h = hardwareForModule(m); Object.keys(h).forEach((k) => (hw[k] = (hw[k] || 0) + h[k])); });
    const plinthLen = Math.round(mods.filter((m) => isBaseLike(m) || m.type === 'appliance' || m.type === 'tall').reduce((s, m) => s + m.w, 0) / 100) / 10;
    hw.plinth = plinthLen;
    const hardware = Object.keys(MP.hardwareCatalog).filter((k) => hw[k]).map((k) => {
      const c = MP.hardwareCatalog[k];
      return { key: k, name: c.name, unit: c.unit, qty: hw[k], price: c.price, sum: Math.round(hw[k] * c.price) };
    });
    const pieces = parts.reduce((s, p) => s + p.qty, 0);
    // Себестоимость
    const matLines = matKeys.map((k) => ({ name: mats[k].name, qty: sheets[k], unit: 'лист', price: mats[k].price, sum: sheets[k] * mats[k].price }));
    tops.forEach((tp) => { const pr = MP.tops[tp.key].price + topDecor.price; tp.name = 'Столешница 38 мм ' + topDecor.name + ' (' + MP.tops[tp.key].L + '×' + MP.tops[tp.key].W + ')'; matLines.push({ name: tp.name, qty: tp.qty, unit: 'шт', price: pr, sum: tp.qty * pr }); });
    Object.keys(edges).forEach((k) => matLines.push({ name: MP.edges[k].name, qty: edges[k], unit: 'пог. м', price: MP.edges[k].price, sum: Math.round(edges[k] * MP.edges[k].price) }));
    const W = MP.work, totalSheets = sheets.ldsp + sheets.mdf + sheets.hdf;
    const workLines = [
      { name: 'Распил на форматно-раскроечном станке', qty: totalSheets, unit: 'лист', price: W.cutPerSheet, sum: totalSheets * W.cutPerSheet },
      { name: 'Кромкооблицовка', qty: Math.round(edgeTotal), unit: 'пог. м', price: W.edgePerM, sum: Math.round(edgeTotal) * W.edgePerM },
      { name: 'Присадка ЧПУ', qty: pieces, unit: 'дет.', price: W.drillPerPart, sum: pieces * W.drillPerPart },
      { name: 'Сборка в цехе', qty: 1, unit: 'компл.', price: W.assembly, sum: W.assembly },
      { name: 'Доставка и монтаж', qty: 1, unit: 'выезд', price: W.delivery, sum: W.delivery }
    ];
    const sum = (l) => l.reduce((s, x) => s + x.sum, 0);
    const cost = { materials: sum(matLines), hardware: sum(hardware), work: sum(workLines) };
    cost.total = cost.materials + cost.hardware + cost.work;
    const price = MP.project.price, margin = price - cost.total;
    // Коммерческое предложение: статьи пропорционально себестоимости, итог = цене договора
    const prod = workLines[0].sum + workLines[1].sum + workLines[2].sum, inst = workLines[3].sum + workLines[4].sum;
    const raw = [['Материалы (ЛДСП, МДФ, ХДФ, столешницы, кромка)', cost.materials], ['Фурнитура (петли, направляющие, подъёмник, ручки)', cost.hardware], ['Распил, кромкование и ЧПУ-присадка', prod], ['Сборка, доставка и монтаж', inst]];
    let acc = 0;
    const quote = raw.map(([n, v], i) => { const s = i < raw.length - 1 ? Math.round(v / cost.total * price / 100) * 100 : price - acc; acc += s; return { name: n, sum: s }; });
    // Деловые обрезки
    const remnants = [];
    matKeys.filter((k) => k !== 'hdf').forEach((k) => layouts[k].forEach((s) => { if (s.remnant && s.remnant.w >= 300) remnants.push({ code: 'OBS-104-' + String(remnants.length + 1).padStart(2, '0'), mat: k, sheet: s.n, w: Math.round(s.remnant.w), h: Math.round(s.remnant.h), area: s.remnant.w * s.remnant.h / 1e6 }); }));
    const cutLen = Object.values(layouts).flat().reduce((s, sh) => s + sh.parts.reduce((a, p) => a + p.w + p.h, 0), 0) / 1000;
    const weight = matKeys.reduce((s, k) => s + area[k] * mats[k].kgm2, 0) + tops.reduce((s, tp) => s + tp.len * tp.depth / 1e6 * 26, 0);
    const res = {
      t, mods, decor, mats, matKeys, parts, layouts, sheets, util, area, edges, edgeTotal, tops, hardware, pieces, matLines, workLines, cost, price, margin,
      marginPct: margin / price, recommended: Math.round(cost.total * 1.45 / 500) * 500, quote, remnants, cutLen,
      weight: Math.round(weight), hours: Math.round(pieces * 0.25 + totalSheets * 0.6 + 14), checks: checks(mods, room), fillers, room,
      modified: MP.state.isModified(state)
    };
    if (!opts && state === MP.state.get()) MP._calc = res;
    return res;
  };

  /* ---------- Сводка заказов ---------- */
  MP.orderStats = function () {
    const c = MP.calc();
    const list = MP.orders.map((o) => Object.assign({}, o, { cost: o.id === MP.project.id ? c.cost.total : o.cost }));
    const signed = list.filter((o) => o.stage !== 'measure');
    const s = (arr, f) => arr.reduce((a, o) => a + f(o), 0);
    const inWork = s(signed, (o) => o.price), paid = s(signed, (o) => o.paid), costSum = s(signed, (o) => o.cost);
    return { list, signed, measure: list.filter((o) => o.stage === 'measure'), inWork, paid, rest: inWork - paid, costSum, profit: inWork - costSum, marginPct: (inWork - costSum) / inWork, prepayPct: paid / inWork };
  };

  /* ---------- Форматирование и утилиты ---------- */
  MP.fmt = (n, d = 0) => Number(n).toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/ /g, ' ');
  MP.pct = (x, d = 1) => MP.fmt(x * 100, d) + '%';
  MP.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  MP.plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c; };

  /* Значения для разметки data-mp="ключ" */
  MP.view = function () {
    const c = MP.calc(), o = MP.orderStats(), f = MP.fmt;
    return {
      'project.title': MP.state.get().title || MP.project.title, 'decor.facade': MP.decor('facade', c.decor.facade).name, 'decor.carcass': MP.decor('carcass', c.decor.carcass).name, 'decor.top': MP.decor('top', c.decor.top).name, 'project.id': MP.project.id, 'project.due': MP.project.due, 'project.version': MP.project.version,
      'project.room': c.room.L + ' × ' + c.room.W + ' × ' + c.room.H + ' мм',
      'client.name': MP.client.name, 'client.phone': MP.client.phone, 'client.address': MP.client.address,
      'company.name': MP.company.name, 'company.phone': MP.company.phone, 'today': MP.today, 'period': MP.period,
      price: f(c.price), cost: f(c.cost.total), margin: f(c.margin), marginPct: MP.pct(c.marginPct), recommended: f(c.recommended),
      'sheets.ldsp': c.sheets.ldsp, 'sheets.mdf': c.sheets.mdf, 'sheets.hdf': c.sheets.hdf,
      'util.ldsp': MP.pct(c.util.ldsp), 'waste.ldsp': MP.pct(1 - c.util.ldsp), 'edge.20': f(c.edges['2.0'], 1), 'edge.04': f(c.edges['0.4'], 1), 'edge.pur': f(c.edges.PUR, 1),
      pieces: c.pieces, modules: c.mods.length, hours: c.hours, weight: c.weight, prepaid: f(MP.project.prepaid), rest: f(c.price - MP.project.prepaid),
      'orders.inWork': f(o.inWork), 'orders.paid': f(o.paid), 'orders.rest': f(o.rest), 'orders.profit': f(o.profit), 'orders.margin': MP.pct(o.marginPct),
      'orders.prepay': MP.pct(o.prepayPct, 0), 'orders.signed': o.signed.length, 'orders.measure': o.measure.length, 'orders.total': o.list.length
    };
  };
  MP.bind = function (root) {
    const v = MP.view();
    (root || document).querySelectorAll('[data-mp]').forEach((el) => { const k = el.getAttribute('data-mp'); if (k in v) el.textContent = v[k]; });
  };

  /* ---------- Штрих-код Code 128 (набор B) — сканируется ручным сканером ---------- */
  const C128 = '212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 114131 311141 411131 211412 211214 211232'.split(' ');
  MP.code128 = function (text, opt) {
    opt = Object.assign({ height: 40, cls: '', color: '#131B2E' }, opt || {});
    const vals = [104];
    for (const ch of String(text)) { const v = ch.charCodeAt(0) - 32; vals.push(v >= 0 && v < 95 ? v : 0); }
    let sum = 104;
    for (let i = 1; i < vals.length; i++) sum += vals[i] * i;
    vals.push(sum % 103);
    const pats = vals.map((v) => C128[v]).concat(['2331112']);
    let x = 10, rects = '';
    pats.forEach((p) => { for (let i = 0; i < p.length; i++) { const w = +p[i]; if (i % 2 === 0) rects += `<rect x="${x}" y="0" width="${w}" height="${opt.height}"/>`; x += w; } });
    return `<svg class="${opt.cls}" viewBox="0 0 ${x + 10} ${opt.height}" preserveAspectRatio="none" fill="${opt.color}" role="img" aria-label="Штрих-код ${MP.esc(text)}">${rects}</svg>`;
  };

  /* ---------- SVG карты раскроя (общая для экрана, печати и дашборда) ---------- */
  MP.sheetSVG = function (sheet, c, opt) {
    opt = Object.assign({ labels: true, selected: null, cls: 'w-full h-auto' }, opt || {});
    const byPos = {};
    c.parts.forEach((p) => (byPos[p.pos] = p));
    const tr = sheet.trim;
    let g = `<rect x="0" y="0" width="${sheet.L}" height="${sheet.W}" fill="#ffd9c9" opacity=".55"/>`;
    g += `<rect x="${tr}" y="${tr}" width="${sheet.L - 2 * tr}" height="${sheet.W - 2 * tr}" fill="#faf8ff"/>`;
    if (sheet.remnant) {
      const r = sheet.remnant;
      g += `<rect x="${r.x + tr}" y="${r.y + tr}" width="${r.w}" height="${r.h}" fill="#89f5e7" opacity=".45" stroke="#006a61" stroke-dasharray="18 10" stroke-width="4"/>`;
      if (opt.labels && r.w > 380 && r.h > 160) g += `<text x="${r.x + tr + r.w / 2}" y="${r.y + tr + r.h / 2}" font-size="60" text-anchor="middle" dominant-baseline="middle" fill="#005049" font-family="JetBrains Mono" font-weight="700">ОБРЕЗОК ${Math.round(r.w)}×${Math.round(r.h)}</text>`;
    }
    sheet.parts.forEach((p) => {
      const part = byPos[p.ref] || {}, sel = opt.selected === p.ref;
      const fill = part.group === 'facades' ? '#cce5ff' : part.group === 'back' ? '#eaedff' : part.group === 'drawers' ? '#dae2fd' : '#e2e7ff';
      g += `<g class="sheet-part" data-pos="${p.ref}" style="cursor:pointer"><rect x="${p.x + tr}" y="${p.y + tr}" width="${p.w}" height="${p.h}" fill="${sel ? '#93ccff' : fill}" stroke="${sel ? '#006194' : '#707881'}" stroke-width="${sel ? 10 : 3}"/>`;
      if (opt.labels) {
        const fs = Math.max(26, Math.min(64, Math.min(p.w, p.h) / 4.2));
        const cx = p.x + tr + p.w / 2, cy = p.y + tr + p.h / 2;
        if (p.w > 150 && p.h > 90) {
          g += `<text x="${cx}" y="${cy - fs * 0.15}" font-size="${fs}" text-anchor="middle" fill="#006194" font-family="JetBrains Mono" font-weight="700">#${String(p.ref).padStart(2, '0')}</text>`;
          g += `<text x="${cx}" y="${cy + fs * 0.95}" font-size="${fs * 0.72}" text-anchor="middle" fill="#3f4850" font-family="JetBrains Mono">${Math.round(p.rot ? p.h : p.w)}×${Math.round(p.rot ? p.w : p.h)}</text>`;
        }
      }
      g += '</g>';
    });
    return `<svg class="${opt.cls}" viewBox="0 0 ${sheet.L} ${sheet.W}" xmlns="http://www.w3.org/2000/svg">${g}<rect x="1" y="1" width="${sheet.L - 2}" height="${sheet.W - 2}" fill="none" stroke="#3f4850" stroke-width="4"/></svg>`;
  };

  /* ---------- Монтажные чертежи: развёртка стены А и план сверху (SVG, мм) ---------- */
  MP.drawings = function (c) {
    const room = c.room, L = room.L, H = room.H, W = room.W, mods = c.mods, esc = MP.esc;
    const css = '<style>.w{fill:none;stroke:#707881;stroke-width:4}.m{fill:#f2f3ff;stroke:#131b2e;stroke-width:4}.f{fill:#eaedff;stroke:#3f4850;stroke-width:2.5}.fl{fill:url(#hatch);stroke:#3f4850;stroke-width:2.5}.pl{fill:#3f4850}.tp{fill:#d9c3a5;stroke:#7f5b33;stroke-width:3}.d{stroke:#006194;stroke-width:2.5}.t{font:600 46px "JetBrains Mono",monospace;fill:#006194;text-anchor:middle}.lb{font:700 50px "JetBrains Mono",monospace;fill:#131b2e;text-anchor:middle}.sm{font:500 38px "JetBrains Mono",monospace;fill:#3f4850;text-anchor:middle}.u{stroke-width:3}</style><defs><pattern id="hatch" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="24" height="24" fill="#fff"/><line x1="0" y1="0" x2="0" y2="24" stroke="#93ccff" stroke-width="8"/></pattern></defs>';
    const dimH = (x1, x2, y, label) => `<g><line class="d" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/><line class="d" x1="${x1}" y1="${y - 28}" x2="${x1}" y2="${y + 28}"/><line class="d" x1="${x2}" y1="${y - 28}" x2="${x2}" y2="${y + 28}"/>${x2 - x1 >= 120 ? `<text class="t" x="${(x1 + x2) / 2}" y="${y - 16}">${label}</text>` : `<text class="t" x="${(x1 + x2) / 2}" y="${y + 70}">${label}</text>`}</g>`;
    const dimV = (y1, y2, x, label) => `<g><line class="d" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/><line class="d" x1="${x - 28}" y1="${y1}" x2="${x + 28}" y2="${y1}"/><line class="d" x1="${x - 28}" y1="${y2}" x2="${x + 28}" y2="${y2}"/><text class="t" transform="translate(${x - 18},${(y1 + y2) / 2}) rotate(-90)">${label}</text></g>`;
    const Y = (y) => H - y; // в SVG ось Y вниз
    const UT = MP.utilitiesFor(room);

    /* --- Развёртка стены А --- */
    const wallMods = mods.filter((m) => m.z < 100);
    let e = `<rect class="w" x="0" y="0" width="${L}" height="${H}"/>`;
    const low = wallMods.filter((m) => m.type !== 'upper');
    const baseRun = low.filter((m) => !m.noTop && m.type !== 'tall');
    if (baseRun.length) {
      const x0 = Math.min(...baseRun.map((m) => m.x)), x1 = Math.max(...baseRun.map((m) => m.x + m.w)), top = Math.max(...baseRun.map((m) => m.y + m.h));
      e += `<rect class="tp" x="${x0}" y="${Y(top + MP.settings.topT)}" width="${x1 - x0}" height="${MP.settings.topT}"/>`;
    }
    wallMods.forEach((m) => {
      if (m.type !== 'upper') e += `<rect class="pl" x="${m.x}" y="${Y(m.y)}" width="${m.w}" height="${m.y}"/>`;
      e += `<rect class="m" x="${m.x}" y="${Y(m.y + m.h)}" width="${m.w}" height="${m.h}"/>`;
      MP.frontsFor(m).forEach((f) => {
        e += `<rect class="f" x="${m.x + f.x}" y="${Y(m.y + f.y + f.h)}" width="${f.w}" height="${f.h}"/>`;
        if (f.kind === 'door') { const hx = f.hinge === 'R' ? m.x + f.x + f.w : m.x + f.x, ox = f.hinge === 'R' ? m.x + f.x : m.x + f.x + f.w; e += `<polyline points="${ox},${Y(m.y + f.y + f.h)} ${hx},${Y(m.y + f.y + f.h / 2)} ${ox},${Y(m.y + f.y)}" fill="none" stroke="#93ccff" stroke-width="3" stroke-dasharray="20 14"/>`; }
      });
      e += `<text class="lb" x="${m.x + m.w / 2}" y="${Y(m.y + m.h / 2) + 16}">${esc(m.code)}</text>`;
    });
    c.fillers.forEach((f) => { e += `<rect class="fl" x="${f.x}" y="${Y(f.y + f.h)}" width="${f.w}" height="${f.h}"/>`; });
    UT.water.forEach((w) => { e += `<circle cx="${w.x}" cy="${Y(w.y)}" r="26" fill="${w.hot ? '#ef4444' : '#0284c7'}" class="u"/>`; });
    UT.sockets.forEach((s) => { e += `<rect x="${s.x - 35}" y="${Y(s.y) - 35}" width="70" height="70" fill="#fff" stroke="#131b2e" class="u"/>`; });
    e += `<line x1="${UT.gas.x}" y1="0" x2="${UT.gas.x}" y2="${H}" stroke="#eab308" stroke-width="10"/>`;
    // Цепочки размеров
    const chain = (list, y) => list.slice().sort((a, b) => a.x - b.x).map((o) => dimH(o.x, o.x + o.w, y, o.w)).join('');
    e += chain(low.concat(c.fillers.filter((f) => f.row === 'low')), H + 140);
    if (low.length) { const x0 = Math.min(...low.map((m) => m.x)), x1 = Math.max(...low.map((m) => m.x + m.w)); e += dimH(x0, x1, H + 300, 'Итого ' + (x1 - x0)); if (x0 > 0) e += dimH(0, x0, H + 140, x0); }
    const ups = wallMods.filter((m) => m.type === 'upper');
    e += chain(ups.concat(c.fillers.filter((f) => f.row === 'up')), -110);
    e += dimH(0, L, H + 460, 'Стена А ' + L);
    // Высоты
    const levels = [0, 100];
    if (baseRun.length) { const top = Math.max(...baseRun.map((m) => m.y + m.h)); levels.push(top, top + MP.settings.topT); }
    if (ups.length) { levels.push(Math.min(...ups.map((m) => m.y)), Math.max(...ups.map((m) => m.y + m.h))); }
    low.filter((m) => m.type === 'tall').forEach((m) => levels.push(m.y + m.h));
    levels.push(H);
    const lv = [...new Set(levels.map(Math.round))].sort((a, b) => a - b);
    for (let i = 0; i < lv.length - 1; i++) e += dimV(Y(lv[i]), Y(lv[i + 1]), -140, lv[i + 1] - lv[i]);
    const elevation = `<svg viewBox="-330 -260 ${L + 480} ${H + 820}" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">${css}${e}<text class="sm" x="${L / 2}" y="${-190}">Развёртка стены А • вид спереди • ${MP.esc(MP.project.title)}</text></svg>`;

    /* --- План сверху --- */
    let p = `<rect class="w" x="0" y="0" width="${L}" height="${W}"/><line x1="0" y1="0" x2="${L}" y2="0" stroke="#131b2e" stroke-width="14"/><line x1="0" y1="0" x2="0" y2="${W}" stroke="#131b2e" stroke-width="14"/>`;
    p += `<text class="sm" x="${L / 2}" y="-40">Стена А</text><text class="sm" transform="translate(-40,${W / 2}) rotate(-90)">Стена Б</text>`;
    c.tops.forEach((tp) => {
      const list = tp.key === 'wall' ? mods.filter((m) => m.z < 100 && !m.noTop && m.type !== 'upper' && m.type !== 'tall') : mods.filter((m) => m.type === 'island');
      if (!list.length) return;
      const x0 = Math.min(...list.map((m) => m.x)), x1 = Math.max(...list.map((m) => m.x + m.w));
      const z0 = tp.key === 'wall' ? 0 : Math.min(...list.map((m) => m.z)) - 40;
      p += `<rect class="tp" x="${x0}" y="${z0}" width="${x1 - x0}" height="${tp.depth}" opacity=".55"/>`;
    });
    mods.filter((m) => m.type !== 'upper').forEach((m) => { p += `<rect class="m" x="${m.x}" y="${m.z}" width="${m.w}" height="${m.d}" fill-opacity=".7"/><text class="lb" x="${m.x + m.w / 2}" y="${m.z + m.d / 2 + 16}">${esc(m.code)}</text>`; });
    mods.filter((m) => m.type === 'upper').forEach((m) => { p += `<rect x="${m.x}" y="${m.z}" width="${m.w}" height="${m.d}" fill="none" stroke="#006194" stroke-width="3" stroke-dasharray="18 12"/>`; });
    c.fillers.filter((f) => f.row === 'low').forEach((f) => { p += `<rect class="fl" x="${f.x}" y="0" width="${f.w}" height="${f.d}"/>`; });
    const isl = mods.filter((m) => m.type === 'island');
    if (isl.length) {
      const zf = Math.min(...isl.map((m) => m.z)) - 40, xc = (Math.min(...isl.map((m) => m.x)) + Math.max(...isl.map((m) => m.x + m.w))) / 2;
      p += dimV(zf, 600, xc, 'Проход ' + Math.round(zf - 600));
      p += dimH(Math.min(...isl.map((m) => m.x)), Math.max(...isl.map((m) => m.x + m.w)), Math.max(...isl.map((m) => m.z + m.d)) + 520, 'Остров ' + (Math.max(...isl.map((m) => m.x + m.w)) - Math.min(...isl.map((m) => m.x))));
    }
    p += dimH(0, L, W + 160, L) + dimV(W, 0, L + 160, W);
    UT.water.forEach((w) => { p += `<circle cx="${w.x}" cy="40" r="26" fill="${w.hot ? '#ef4444' : '#0284c7'}"/>`; });
    p += `<circle cx="${UT.gas.x}" cy="${UT.gas.z}" r="30" fill="#eab308"/>`;
    const plan = `<svg viewBox="-260 -260 ${L + 560} ${W + 560}" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">${css}${p}</svg>`;
    return { elevation, plan };
  };
})();
