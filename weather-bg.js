(function () {
  const html = document.documentElement;
  const weatherMeta = document.getElementById('weather-meta');

  const WEATHER_LABELS = {
    clear: '晴',
    cloudy: '多云',
    overcast: '阴',
    fog: '雾',
    drizzle: '毛毛雨',
    rain: '雨',
    snow: '雪',
    thunder: '雷雨'
  };
  const BEIJING_LOCATION = {
    latitude: 39.9042,
    longitude: 116.4074,
    name: '北京'
  };
  const PLAYER_THEME_CLASSES = ['xf-original', 'xf-sky', 'xf-orange', 'xf-darkGreen', 'xf-wineRed', 'xf-girlPink'];

  function getPlayerThemeByWeather(scene, isDay) {
    if (scene === 'clear') return isDay ? 'xf-sky' : 'xf-darkGreen';
    if (scene === 'cloudy') return 'xf-original';
    if (scene === 'overcast') return 'xf-original';
    if (scene === 'fog') return 'xf-girlPink';
    if (scene === 'rain') return 'xf-darkGreen';
    if (scene === 'snow') return 'xf-sky';
    if (scene === 'thunder') return 'xf-wineRed';
    return 'xf-original';
  }

  function syncMusicPlayerTheme(scene, isDay) {
    const playerRoot = document.getElementById('xf-MusicPlayer');
    if (!playerRoot) return;

    const nextTheme = getPlayerThemeByWeather(scene, isDay);
    playerRoot.setAttribute('data-themeColor', nextTheme);

    const playerMain = playerRoot.querySelector('.xf-MusicPlayer-Main');
    if (!playerMain) return;

    playerMain.classList.remove(...PLAYER_THEME_CLASSES);
    playerMain.classList.add(nextTheme);
  }

  function setMetaText(text) {
    if (!weatherMeta) return;
    weatherMeta.textContent = text;
  }

  function classifyWeatherCode(code) {
    if (code === 0) return { scene: 'clear', label: WEATHER_LABELS.clear };
    if (code === 1 || code === 2) return { scene: 'cloudy', label: WEATHER_LABELS.cloudy };
    if (code === 3) return { scene: 'overcast', label: WEATHER_LABELS.overcast };
    if (code === 45 || code === 48) return { scene: 'fog', label: WEATHER_LABELS.fog };
    if ([51, 53, 55, 56, 57].includes(code)) return { scene: 'rain', label: WEATHER_LABELS.drizzle };
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { scene: 'rain', label: WEATHER_LABELS.rain };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { scene: 'snow', label: WEATHER_LABELS.snow };
    if ([95, 96, 99].includes(code)) return { scene: 'thunder', label: WEATHER_LABELS.thunder };
    return { scene: 'cloudy', label: WEATHER_LABELS.cloudy };
  }

  function applyWeatherTheme(options) {
    const { scene, isDay, cloudCover } = options;
    html.setAttribute('data-weather', scene);
    html.setAttribute('data-daypart', isDay ? 'day' : 'night');
    syncMusicPlayerTheme(scene, isDay);

    if (Number.isFinite(cloudCover)) {
      const opacity = Math.min(Math.max(cloudCover / 100, 0.15), 0.95);
      html.style.setProperty('--weather-cloud-opacity', String(opacity));
    }
  }

  function applySunnyFallback(message) {
    applyWeatherTheme({ scene: 'clear', isDay: true, cloudCover: 18 });
    setMetaText(message);
  }

  function getWallpaperLabel(scene) {
    if (scene === 'clear') return '晴天';
    if (scene === 'cloudy') return '多云';
    if (scene === 'overcast') return '阴天';
    if (scene === 'fog') return '雾天';
    if (scene === 'rain') return '雨天';
    if (scene === 'snow') return '雪天';
    if (scene === 'thunder') return '雷雨';
    return '晴天';
  }

  function getGeoErrorText(code) {
    if (code === 1) return '浏览器定位被拒绝';
    if (code === 2) return '浏览器定位不可用';
    if (code === 3) return '浏览器定位超时';
    return '浏览器定位失败';
  }

  async function getCoordsByBrowser() {
    if (!navigator.geolocation) {
      throw new Error('浏览器不支持定位');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            name: '浏览器定位',
            source: 'browser'
          }),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000
        }
      );
    });
  }

  async function fetchJsonWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchWeather(location) {
    const params = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      current: 'weather_code,is_day,cloud_cover,temperature_2m',
      timezone: 'auto'
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const data = await fetchJsonWithTimeout(url, 5000);
    if (!data || !data.current) throw new Error('Invalid weather payload');
    return data;
  }

  function summarizeWeather(weatherData) {
    const current = weatherData.current;
    const code = Number(current.weather_code);
    const isDay = Number(current.is_day) === 1;
    const cloudCover = Number(current.cloud_cover);
    const temperature = Number(current.temperature_2m);
    const type = classifyWeatherCode(code);
    const tempText = Number.isFinite(temperature) ? `${Math.round(temperature)}°C` : '--';

    return { type, isDay, cloudCover, tempText };
  }

  function renderFromWeather(locationName, weatherData) {
    const { type, isDay, cloudCover, tempText } = summarizeWeather(weatherData);
    applyWeatherTheme({ scene: type.scene, isDay, cloudCover });
    setMetaText(`${locationName} · ${type.label} · ${tempText}`);
  }

  async function updateWeatherBackground() {
    try {
      setMetaText('获取天气定位...');
      const currentLocation = await getCoordsByBrowser();
      const weatherData = await fetchWeather(currentLocation);
      renderFromWeather(currentLocation.name, weatherData);
    } catch (error) {
      const reasonText = typeof error === 'object' && error !== null && 'code' in error
        ? getGeoErrorText(error.code)
        : '天气加载失败';

      try {
        const beijingWeather = await fetchWeather(BEIJING_LOCATION);
        const { type, isDay, cloudCover, tempText } = summarizeWeather(beijingWeather);
        applyWeatherTheme({ scene: type.scene, isDay, cloudCover });
        const wallpaperText = getWallpaperLabel(type.scene);
        setMetaText(`${reasonText}·已使用北京定位（${wallpaperText}背景） · ${tempText}`);
      } catch {
        applySunnyFallback(`${reasonText}·已使用晴天背景`);
      }
    }
  }

  updateWeatherBackground();
  setInterval(updateWeatherBackground, 15 * 60 * 1000);
})();
