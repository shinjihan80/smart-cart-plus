// Open-Meteo 무료 날씨 API 연동 (API 키 불필요)
// https://open-meteo.com/en/docs

const CACHE_KEY = 'nemoa-weather-cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30분
const SEOUL = { lat: 37.5665, lon: 126.9780 } as const;

export type WeatherCondition = '맑음' | '구름조금' | '흐림' | '비' | '눈' | '안개';

export interface WeatherSnapshot {
  tempC:        number;
  feelsLikeC:   number;
  condition:    WeatherCondition;
  conditionRaw: number;  // WMO 코드 원본
  humidity:     number;
  windKph:      number;
  isDay:        boolean;
  fetchedAt:    number;
}

interface CachedWeather {
  data:      WeatherSnapshot;
  expiresAt: number;
}

// WMO Weather interpretation codes → 한국어
// https://open-meteo.com/en/docs#weathervariables
function mapWmoCode(code: number): WeatherCondition {
  if (code === 0) return '맑음';
  if (code === 1 || code === 2) return '구름조금';
  if (code === 3) return '흐림';
  if (code >= 45 && code <= 48) return '안개';
  if (code >= 51 && code <= 67) return '비';
  if (code >= 71 && code <= 77) return '눈';
  if (code >= 80 && code <= 82) return '비';
  if (code >= 85 && code <= 86) return '눈';
  if (code >= 95) return '비';
  return '흐림';
}

function readCache(): WeatherSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedWeather;
    if (parsed.expiresAt < Date.now()) return null;
    return parsed.data;
  } catch { return null; }
}

function writeCache(data: WeatherSnapshot) {
  if (typeof window === 'undefined') return;
  try {
    const payload: CachedWeather = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch { /* ignore quota */ }
}

/**
 * 현재 날씨를 가져온다. 30분 캐시 히트 시 네트워크 호출 없음.
 * 실패 시 null 반환 — 호출자는 폴백 UI를 결정한다.
 */
export async function fetchWeather(
  coords: { lat: number; lon: number } = SEOUL,
): Promise<WeatherSnapshot | null> {
  const cached = readCache();
  if (cached) return cached;

  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude',   String(coords.lat));
    url.searchParams.set('longitude',  String(coords.lon));
    url.searchParams.set('current',    'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day');
    url.searchParams.set('timezone',   'Asia/Seoul');
    url.searchParams.set('wind_speed_unit', 'kmh');

    // AbortSignal.timeout이 없는 환경(구 브라우저·Node < 17.3)에선 수동 AbortController로 폴백.
    let signal: AbortSignal | undefined;
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      signal = AbortSignal.timeout(6000);
    } else if (typeof AbortController !== 'undefined') {
      const ac = new AbortController();
      setTimeout(() => ac.abort(), 6000);
      signal = ac.signal;
    }

    const res = await fetch(url.toString(), signal ? { signal } : undefined);
    if (!res.ok) return null;

    const json = await res.json() as {
      current?: {
        temperature_2m?:        number;
        apparent_temperature?:  number;
        relative_humidity_2m?:  number;
        weather_code?:          number;
        wind_speed_10m?:        number;
        is_day?:                number;
      };
    };
    const c = json.current;
    if (!c || typeof c.temperature_2m !== 'number') return null;

    const snap: WeatherSnapshot = {
      tempC:        Math.round(c.temperature_2m),
      feelsLikeC:   Math.round(c.apparent_temperature  ?? c.temperature_2m),
      condition:    mapWmoCode(c.weather_code ?? 3),
      conditionRaw: c.weather_code ?? 3,
      humidity:     Math.round(c.relative_humidity_2m  ?? 0),
      windKph:      Math.round(c.wind_speed_10m        ?? 0),
      isDay:        (c.is_day ?? 1) === 1,
      fetchedAt:    Date.now(),
    };
    writeCache(snap);
    return snap;
  } catch {
    return null;
  }
}

/** 이모지 + 간단 라벨로 표현. */
export function weatherEmoji(condition: WeatherCondition, isDay: boolean): string {
  switch (condition) {
    case '맑음':     return isDay ? '☀️' : '🌙';
    case '구름조금': return isDay ? '🌤️' : '🌥️';
    case '흐림':     return '☁️';
    case '비':       return '🌧️';
    case '눈':       return '❄️';
    case '안개':     return '🌫️';
  }
}

/** 온도 기반 간단 코디 힌트 (네모아 화자 톤). */
export function dressingTip(tempC: number, condition: WeatherCondition): string {
  if (condition === '비')  return '우산 챙기는 걸 잊지 마세요.';
  if (condition === '눈')  return '미끄럼 방지 신발이 좋겠어요.';
  if (tempC >= 28)         return '얇고 통기성 좋은 옷을 추천해요.';
  if (tempC >= 22)         return '반팔에 얇은 겉옷이면 충분해요.';
  if (tempC >= 16)         return '얇은 가디건을 챙겨보세요.';
  if (tempC >= 10)         return '자켓이나 니트가 좋겠어요.';
  if (tempC >= 5)          return '두꺼운 외투가 필요해요.';
  return '따뜻하게 껴입으세요.';
}
