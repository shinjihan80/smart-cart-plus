export interface OrderItem {
  id:     string;
  name:   string;
  store:  string;
  mallBg: string;
  price:  number;
  date:   string;
}

export interface MonthBucket {
  month:  number;
  label:  string;
  total:  number;
  orders: OrderItem[];
}

export const MONTHLY_DATA: MonthBucket[] = [
  {
    month: 1, label: '1월', total: 187400,
    orders: [
      { id: 'm1-1', name: '유기농 바나나',       store: '마켓컬리', mallBg: 'bg-mall-kurly',   price: 5900, date: '01.08' },
      { id: 'm1-2', name: '울 코트',            store: '무신사',   mallBg: 'bg-mall-musinsa', price: 139000, date: '01.15' },
      { id: 'm1-3', name: '세탁세제 대용량',      store: '쿠팡',    mallBg: 'bg-mall-coupang', price: 22500, date: '01.22' },
      { id: 'm1-4', name: '비타민C',            store: '올리브영', mallBg: 'bg-mall-oliveyoung', price: 20000, date: '01.28' },
    ],
  },
  {
    month: 2, label: '2월', total: 156200,
    orders: [
      { id: 'm2-1', name: '딸기 1kg',           store: '마켓컬리', mallBg: 'bg-mall-kurly',   price: 12900, date: '02.03' },
      { id: 'm2-2', name: '봄 가디건',           store: '무신사',   mallBg: 'bg-mall-musinsa', price: 49900, date: '02.10' },
      { id: 'm2-3', name: '샴푸 리필팩',         store: '올리브영', mallBg: 'bg-mall-oliveyoung', price: 8900, date: '02.14' },
      { id: 'm2-4', name: '냉동 만두',           store: '쿠팡',    mallBg: 'bg-mall-coupang', price: 7500, date: '02.20' },
      { id: 'm2-5', name: '런닝화',             store: '네이버',   mallBg: 'bg-mall-naver',   price: 77000, date: '02.25' },
    ],
  },
  {
    month: 3, label: '3월', total: 203800,
    orders: [
      { id: 'm3-1', name: '유기농 두부',         store: '마켓컬리', mallBg: 'bg-mall-kurly',   price: 3200, date: '03.05' },
      { id: 'm3-2', name: '리넨 원피스',         store: '무신사',   mallBg: 'bg-mall-musinsa', price: 59000, date: '03.12' },
      { id: 'm3-3', name: '한우 불고기',         store: '쿠팡',    mallBg: 'bg-mall-coupang', price: 15900, date: '03.15' },
      { id: 'm3-4', name: '선크림 SPF50',       store: '올리브영', mallBg: 'bg-mall-oliveyoung', price: 18700, date: '03.20' },
      { id: 'm3-5', name: '에어포스 1',          store: '네이버',   mallBg: 'bg-mall-naver',   price: 107000, date: '03.28' },
    ],
  },
  {
    month: 4, label: '4월', total: 384300,
    orders: [
      { id: 'f6',  name: '노르웨이 생연어',       store: '마켓컬리', mallBg: 'bg-mall-kurly',      price: 18900, date: '04.16' },
      { id: 'c10', name: 'Ray-Ban 웨이페어러',   store: '무신사',   mallBg: 'bg-mall-musinsa',    price: 185000, date: '04.12' },
      { id: 'f1',  name: '친환경 샐러드 믹스',    store: '마켓컬리', mallBg: 'bg-mall-kurly',      price: 4900, date: '04.14' },
      { id: 'f2',  name: '아이용 한우 불고기',    store: '쿠팡',    mallBg: 'bg-mall-coupang',    price: 15900, date: '04.10' },
      { id: 'f8',  name: '서울우유 1L',          store: '쿠팡',    mallBg: 'bg-mall-coupang',    price: 2800, date: '04.11' },
      { id: 'c7',  name: '버켄스탁 아리조나',     store: '네이버',   mallBg: 'bg-mall-naver',      price: 89000, date: '04.08' },
      { id: 'f9',  name: '오리온 초코파이',       store: '쿠팡',    mallBg: 'bg-mall-coupang',    price: 4800, date: '04.07' },
      { id: 'c8',  name: '캉골 미니 크로스백',    store: '무신사',   mallBg: 'bg-mall-musinsa',    price: 45000, date: '04.05' },
      { id: 'f7',  name: '무항생제 달걀',         store: '마켓컬리', mallBg: 'bg-mall-kurly',      price: 8500, date: '04.03' },
      { id: 'c9',  name: 'New Era 볼캡',        store: '네이버',   mallBg: 'bg-mall-naver',      price: 9500, date: '04.02' },
    ],
  },
];
