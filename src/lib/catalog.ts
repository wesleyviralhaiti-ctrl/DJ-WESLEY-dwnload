import type { GenreId, Track } from '../types';
import { GENRES } from './storage';

const rawThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export const BUILT_IN_CATALOG: Track[] = [
  // === KONPA (Rutshelle Guillaume, Kaï, Joé Dwèt Filé, Mass Konpa, Nu Look, Kreyol La) ===
  {
    id: '_3mBoOvnL_4',
    title: 'Rutshelle Guillaume feat. Kaï - Tolere w (Official Music Video)',
    artist: 'Rutshelle Guillaume',
    durationSeconds: 288,
    durationLabel: '4:48',
    thumbnail: rawThumb('_3mBoOvnL_4'),
    viewCount: '36.6M',
    genre: 'konpa',
    source: 'youtube',
  },
  {
    id: 'Srvt_6up-0o',
    title: 'Joé Dwèt Filé - 4 Kampé (Clip Officiel)',
    artist: 'Joé Dwèt Filé',
    durationSeconds: 215,
    durationLabel: '3:35',
    thumbnail: rawThumb('Srvt_6up-0o'),
    viewCount: '194.2M',
    genre: 'konpa',
    source: 'youtube',
  },
  {
    id: '6yLwW-Om7Sc',
    title: 'Rutshelle Guillaume x Joé Dwèt Filé - Pouki ? (Official Music)',
    artist: 'Rutshelle Guillaume',
    durationSeconds: 350,
    durationLabel: '5:50',
    thumbnail: rawThumb('6yLwW-Om7Sc'),
    viewCount: '282K',
    genre: 'konpa',
    source: 'youtube',
  },
  {
    id: 'L-8zEme_fyc',
    title: 'Mass Konpa - Sekirite (Official Music Video)',
    artist: 'Mass Konpa',
    durationSeconds: 378,
    durationLabel: '6:18',
    thumbnail: rawThumb('L-8zEme_fyc'),
    viewCount: '2.5M',
    genre: 'konpa',
    source: 'youtube',
  },
  {
    id: 'K8Stoz9n6gQ',
    title: 'Kreyol La - Mwen Poko Jwenn Li feat. Rutshelle Guillaume',
    artist: 'Kreyol La Official',
    durationSeconds: 324,
    durationLabel: '5:24',
    thumbnail: rawThumb('K8Stoz9n6gQ'),
    viewCount: '10.8M',
    genre: 'konpa',
    source: 'youtube',
  },
  {
    id: 'mfhdsuUe-Z0',
    title: 'Joé Dwèt Filé - Rihanna (Clip Officiel)',
    artist: 'Joé Dwèt Filé',
    durationSeconds: 222,
    durationLabel: '3:42',
    thumbnail: rawThumb('mfhdsuUe-Z0'),
    viewCount: '17.7M',
    genre: 'konpa',
    source: 'youtube',
  },
  {
    id: 'iW5oFcyIKMw',
    title: 'Mass Konpa - Sans Regret (Official Music Video)',
    artist: 'Mass Konpa',
    durationSeconds: 353,
    durationLabel: '5:53',
    thumbnail: rawThumb('iW5oFcyIKMw'),
    viewCount: '815K',
    genre: 'konpa',
    source: 'youtube',
  },
  {
    id: 'kg9pPYHeVzM',
    title: 'Rutshelle Guillaume - Adikte (Official Lyric Video)',
    artist: 'Rutshelle Guillaume',
    durationSeconds: 268,
    durationLabel: '4:28',
    thumbnail: rawThumb('kg9pPYHeVzM'),
    viewCount: '2.1M',
    genre: 'konpa',
    source: 'youtube',
  },
  {
    id: 'qppWww9lFfo',
    title: 'Joé Dwèt Filé - Fem Voyé (Clip Officiel)',
    artist: 'Joé Dwèt Filé',
    durationSeconds: 272,
    durationLabel: '4:32',
    thumbnail: rawThumb('qppWww9lFfo'),
    viewCount: '33.4M',
    genre: 'konpa',
    source: 'youtube',
  },
  {
    id: '-5M1gjmZS18',
    title: 'Nu Look - My Feelings (Visualizer)',
    artist: 'Arly Lariviere / Nu Look',
    durationSeconds: 386,
    durationLabel: '6:26',
    thumbnail: rawThumb('-5M1gjmZS18'),
    viewCount: '7.5M',
    genre: 'konpa',
    source: 'youtube',
  },
  {
    id: 'KMZj63l0XWY',
    title: 'Mass Konpa & Gracia Delva - Pa Banm Do (Official Video)',
    artist: 'Mass Konpa',
    durationSeconds: 302,
    durationLabel: '5:02',
    thumbnail: rawThumb('KMZj63l0XWY'),
    viewCount: '679K',
    genre: 'konpa',
    source: 'youtube',
  },
  {
    id: 'm_DhUhH5Ryk',
    title: 'Kenny Haiti - Paka Ranplasew feat. Roody Roodboy',
    artist: 'Kenny Haiti',
    durationSeconds: 272,
    durationLabel: '4:32',
    thumbnail: rawThumb('m_DhUhH5Ryk'),
    viewCount: '6.6M',
    genre: 'konpa',
    source: 'youtube',
  },
  {
    id: '07gs6NaUP7M',
    title: 'Nu Look - Mea Culpa',
    artist: 'Nu Look',
    durationSeconds: 361,
    durationLabel: '6:01',
    thumbnail: rawThumb('07gs6NaUP7M'),
    viewCount: '8.8M',
    genre: 'konpa',
    source: 'youtube',
  },
  {
    id: '1sEhLoiUKCs',
    title: 'Joé Dwèt Filé - Slowly (Full Version)',
    artist: 'Joé Dwèt Filé',
    durationSeconds: 267,
    durationLabel: '4:27',
    thumbnail: rawThumb('1sEhLoiUKCs'),
    viewCount: '21.0M',
    genre: 'konpa',
    source: 'youtube',
  },

  // === RABÒDAY (Roody Roodboy, TonyMix, DJAPOT, Pierre Jean) ===
  {
    id: 'Xps0kdhpD2c',
    title: 'Roody Roodboy - Tranble (Official Video)',
    artist: 'Roody Roodboy',
    durationSeconds: 240,
    durationLabel: '4:00',
    thumbnail: rawThumb('Xps0kdhpD2c'),
    viewCount: '41.2M',
    genre: 'raboday',
    source: 'youtube',
  },
  {
    id: '6MfAeFfMrJk',
    title: 'Tonymix - Lave Lè a feat. Ti Babas & Sweet Micky',
    artist: 'TonyMix',
    durationSeconds: 235,
    durationLabel: '3:55',
    thumbnail: rawThumb('6MfAeFfMrJk'),
    viewCount: '3.9M',
    genre: 'raboday',
    source: 'youtube',
  },
  {
    id: 'cnwu2Q_oLQQ',
    title: 'DJAPOT - Karma (Official Video)',
    artist: 'DJAPOT',
    durationSeconds: 353,
    durationLabel: '5:53',
    thumbnail: rawThumb('cnwu2Q_oLQQ'),
    viewCount: '3.8M',
    genre: 'raboday',
    source: 'youtube',
  },
  {
    id: 'JhHwokgHeTY',
    title: 'Pierre Jean feat. Tonymix - Raboday In The Air (Official Visualizer)',
    artist: 'Pierre Jean Haiti / TonyMix',
    durationSeconds: 173,
    durationLabel: '2:53',
    thumbnail: rawThumb('JhHwokgHeTY'),
    viewCount: '337K',
    genre: 'raboday',
    source: 'youtube',
  },
  {
    id: '95zruYzejgc',
    title: 'Tonymix - Pizi Pizi Pozow',
    artist: 'TonyMix',
    durationSeconds: 168,
    durationLabel: '2:48',
    thumbnail: rawThumb('95zruYzejgc'),
    viewCount: '1.0M',
    genre: 'raboday',
    source: 'youtube',
  },
  {
    id: 'uGj4hU-g-K4',
    title: 'Roody Roodboy - An Kachèt (Official Video)',
    artist: 'Roody Roodboy',
    durationSeconds: 409,
    durationLabel: '6:49',
    thumbnail: rawThumb('uGj4hU-g-K4'),
    viewCount: '19.9M',
    genre: 'raboday',
    source: 'youtube',
  },
  {
    id: 'fhieWLaZI9k',
    title: "DJAPOT - M'Kon'n Valèm (Official Video)",
    artist: 'DJAPOT',
    durationSeconds: 359,
    durationLabel: '5:59',
    thumbnail: rawThumb('fhieWLaZI9k'),
    viewCount: '1.1M',
    genre: 'raboday',
    source: 'youtube',
  },
  {
    id: 'zAep_7MxQGI',
    title: 'TonyMix x Blondedy Ferdinand - Kitem Ale (Official Video)',
    artist: 'TonyMix',
    durationSeconds: 270,
    durationLabel: '4:30',
    thumbnail: rawThumb('zAep_7MxQGI'),
    viewCount: '5.3M',
    genre: 'raboday',
    source: 'youtube',
  },
  {
    id: 'GtIh-ieo_0w',
    title: 'Roody Roodboy - Ou Mechan (Kanaval)',
    artist: 'Roody Roodboy',
    durationSeconds: 369,
    durationLabel: '6:09',
    thumbnail: rawThumb('GtIh-ieo_0w'),
    viewCount: '13.2M',
    genre: 'raboday',
    source: 'youtube',
  },
  {
    id: '84ithuFP0SI',
    title: 'DJAPOT - Lanmou A Lanvè',
    artist: 'DJAPOT',
    durationSeconds: 326,
    durationLabel: '5:26',
    thumbnail: rawThumb('84ithuFP0SI'),
    viewCount: '893K',
    genre: 'raboday',
    source: 'youtube',
  },

  // === AFROBEAT (Asake, Rema, Burna Boy, Fireboy DML) ===
  {
    id: 'CQLsdm1ZYAw',
    title: 'Rema - Calm Down (Official Music Video)',
    artist: 'Rema',
    durationSeconds: 220,
    durationLabel: '3:40',
    thumbnail: rawThumb('CQLsdm1ZYAw'),
    viewCount: '713.2M',
    genre: 'afrobeat',
    source: 'youtube',
  },
  {
    id: 'bbVZo4Yw7pI',
    title: 'Asake - Lonely At The Top (Official Video)',
    artist: 'Asake',
    durationSeconds: 204,
    durationLabel: '3:24',
    thumbnail: rawThumb('bbVZo4Yw7pI'),
    viewCount: '102.5M',
    genre: 'afrobeat',
    source: 'youtube',
  },
  {
    id: '7WU__JQuB8g',
    title: 'Asake - Sungba (Remix) feat. Burna Boy (Official Video)',
    artist: 'Asake',
    durationSeconds: 216,
    durationLabel: '3:36',
    thumbnail: rawThumb('7WU__JQuB8g'),
    viewCount: '85.8M',
    genre: 'afrobeat',
    source: 'youtube',
  },
  {
    id: 'WcIcVapfqXw',
    title: 'Rema, Selena Gomez - Calm Down (Official Music Video)',
    artist: 'Rema',
    durationSeconds: 240,
    durationLabel: '4:00',
    thumbnail: rawThumb('WcIcVapfqXw'),
    viewCount: '1.5B',
    genre: 'afrobeat',
    source: 'youtube',
  },
  {
    id: 'gCLUIzOsgGg',
    title: 'Fireboy DML & Asake - Bandana (Official Video)',
    artist: 'Fireboy DML / Asake',
    durationSeconds: 182,
    durationLabel: '3:02',
    thumbnail: rawThumb('gCLUIzOsgGg'),
    viewCount: '224.1M',
    genre: 'afrobeat',
    source: 'youtube',
  },
  {
    id: 'bWxyVF1LJAo',
    title: 'Burna Boy - Giza (feat. Seyi Vibez) [Official Music Video]',
    artist: 'Burna Boy',
    durationSeconds: 175,
    durationLabel: '2:55',
    thumbnail: rawThumb('bWxyVF1LJAo'),
    viewCount: '18.8M',
    genre: 'afrobeat',
    source: 'youtube',
  },
  {
    id: 'dPaVQ8C7KrA',
    title: 'Asake - Remember (Official Video)',
    artist: 'Asake',
    durationSeconds: 208,
    durationLabel: '3:28',
    thumbnail: rawThumb('dPaVQ8C7KrA'),
    viewCount: '34.6M',
    genre: 'afrobeat',
    source: 'youtube',
  },
  {
    id: 'sObg5b2nx44',
    title: 'Rema - FUN (Official Video)',
    artist: 'Rema',
    durationSeconds: 190,
    durationLabel: '3:10',
    thumbnail: rawThumb('sObg5b2nx44'),
    viewCount: '22.2M',
    genre: 'afrobeat',
    source: 'youtube',
  },
  {
    id: 'fXl5dPuiJa0',
    title: 'Asake - Joha (Official Video)',
    artist: 'Asake',
    durationSeconds: 153,
    durationLabel: '2:33',
    thumbnail: rawThumb('fXl5dPuiJa0'),
    viewCount: '49.9M',
    genre: 'afrobeat',
    source: 'youtube',
  },

  // === AMAPIANO (Tyla, Tyler ICU, Major League DJz, Kamo Mphela) ===
  {
    id: 'XoiOOiuH8iI',
    title: 'Tyla - Water (Official Music Video)',
    artist: 'Tyla',
    durationSeconds: 220,
    durationLabel: '3:40',
    thumbnail: rawThumb('XoiOOiuH8iI'),
    viewCount: '420.0M',
    genre: 'amapiano',
    source: 'youtube',
  },
  {
    id: 'g_hgm2Mf6Ag',
    title: 'Tyler ICU & Tumelo.za - Mnike feat. DJ Maphorisa & Ceeka RSA',
    artist: 'Tyler ICU',
    durationSeconds: 173,
    durationLabel: '2:53',
    thumbnail: rawThumb('g_hgm2Mf6Ag'),
    viewCount: '83.2M',
    genre: 'amapiano',
    source: 'youtube',
  },
  {
    id: 'aZGNpoMPZbI',
    title: 'Major League DJz x Tyla - Water Remix (Amapiano)',
    artist: 'Major League DJz',
    durationSeconds: 338,
    durationLabel: '5:38',
    thumbnail: rawThumb('aZGNpoMPZbI'),
    viewCount: '332K',
    genre: 'amapiano',
    source: 'youtube',
  },
  {
    id: 'hcqcy6cdCw8',
    title: 'Kamo Mphela, Khalil Harrison & Tyler ICU - Dalie (Official Video)',
    artist: 'Kamo Mphela',
    durationSeconds: 282,
    durationLabel: '4:42',
    thumbnail: rawThumb('hcqcy6cdCw8'),
    viewCount: '42.7M',
    genre: 'amapiano',
    source: 'youtube',
  },
  {
    id: 'eR1HWnqn-Ok',
    title: 'Tyler ICU - Ebasini feat. Leemckrazy & Tman Xpress',
    artist: 'Tyler ICU',
    durationSeconds: 343,
    durationLabel: '5:43',
    thumbnail: rawThumb('eR1HWnqn-Ok'),
    viewCount: '49.1M',
    genre: 'amapiano',
    source: 'youtube',
  },
  {
    id: 'GzOvUdYKIBQ',
    title: 'Khanyisa & Tyler ICU - SUKA (Official Music Video)',
    artist: 'Khanyisa / Tyler ICU',
    durationSeconds: 209,
    durationLabel: '3:29',
    thumbnail: rawThumb('GzOvUdYKIBQ'),
    viewCount: '5.0M',
    genre: 'amapiano',
    source: 'youtube',
  },

  // === DRILL (Central Cee, Pop Smoke) ===
  {
    id: 'Txnqzr_DZYg',
    title: 'Central Cee - Doja (Official Video)',
    artist: 'Central Cee',
    durationSeconds: 98,
    durationLabel: '1:38',
    thumbnail: rawThumb('Txnqzr_DZYg'),
    viewCount: '73.3M',
    genre: 'drill',
    source: 'youtube',
  },
  {
    id: '9dPiZwLnAMY',
    title: 'Pop Smoke - Dior (Official Lyric Video)',
    artist: 'Pop Smoke',
    durationSeconds: 217,
    durationLabel: '3:37',
    thumbnail: rawThumb('9dPiZwLnAMY'),
    viewCount: '64.0M',
    genre: 'drill',
    source: 'youtube',
  },
  {
    id: 'Q-Dx-Jdjs4Y',
    title: 'Pop Smoke feat. Central Cee - Not Alone (Drill Mix)',
    artist: 'Pop Smoke / Central Cee',
    durationSeconds: 265,
    durationLabel: '4:25',
    thumbnail: rawThumb('Q-Dx-Jdjs4Y'),
    viewCount: '2.3M',
    genre: 'drill',
    source: 'youtube',
  },
  {
    id: 'kAZCQTm8i6c',
    title: 'Central Cee - Last Night Remix (Drill)',
    artist: 'Central Cee',
    durationSeconds: 168,
    durationLabel: '2:48',
    thumbnail: rawThumb('kAZCQTm8i6c'),
    viewCount: '13.8M',
    genre: 'drill',
    source: 'youtube',
  },
  {
    id: '8A-Ox3TPFOA',
    title: 'Pop Smoke x Quavo x Central Cee - 2024',
    artist: 'Pop Smoke / Central Cee',
    durationSeconds: 250,
    durationLabel: '4:10',
    thumbnail: rawThumb('8A-Ox3TPFOA'),
    viewCount: '5.4M',
    genre: 'drill',
    source: 'youtube',
  },
  {
    id: 'goWfqQYRsU0',
    title: 'Pop Smoke feat. Central Cee & Russ Millions - Influence',
    artist: 'Pop Smoke / Central Cee',
    durationSeconds: 321,
    durationLabel: '5:21',
    thumbnail: rawThumb('goWfqQYRsU0'),
    viewCount: '10.0M',
    genre: 'drill',
    source: 'youtube',
  },

  // === RAP KREYÒL (Wendyyy, MechansT, Fantom, Baky, Roody Roodboy) ===
  {
    id: 'WtDvaBfxlJA',
    title: 'Wendyyy feat. Magic Touch - Livrezon (Official Video)',
    artist: 'Wendyyy',
    durationSeconds: 250,
    durationLabel: '4:10',
    thumbnail: rawThumb('WtDvaBfxlJA'),
    viewCount: '10.7M',
    genre: 'rap-kreyol',
    source: 'youtube',
  },
  {
    id: 'cnNYF-83o-4',
    title: 'MechansT feat. Fantom (Barikad Crew) - Boukannen (Official Video)',
    artist: 'MechansT / Fantom',
    durationSeconds: 240,
    durationLabel: '4:00',
    thumbnail: rawThumb('cnNYF-83o-4'),
    viewCount: '2.0M',
    genre: 'rap-kreyol',
    source: 'youtube',
  },
  {
    id: '2T-5vyMXOHs',
    title: 'Wendyyy - Dekontwole (Officiel Video)',
    artist: 'Wendyyy',
    durationSeconds: 304,
    durationLabel: '5:04',
    thumbnail: rawThumb('2T-5vyMXOHs'),
    viewCount: '4.9M',
    genre: 'rap-kreyol',
    source: 'youtube',
  },
  {
    id: 'SsOX4OFjGSQ',
    title: 'Wendyyy - Majeste (Official Video)',
    artist: 'Wendyyy',
    durationSeconds: 244,
    durationLabel: '4:04',
    thumbnail: rawThumb('SsOX4OFjGSQ'),
    viewCount: '6.6M',
    genre: 'rap-kreyol',
    source: 'youtube',
  },
  {
    id: 'rpDqKbnOX2Y',
    title: 'Koudeta (feat. Baky & Wendyyy)',
    artist: 'Baky / Wendyyy',
    durationSeconds: 196,
    durationLabel: '3:16',
    thumbnail: rawThumb('rpDqKbnOX2Y'),
    viewCount: '738K',
    genre: 'rap-kreyol',
    source: 'youtube',
  },
  {
    id: '74UdwVYR0Ys',
    title: 'Roody Roodboy - Apiye feat. Zile (Official Music Video)',
    artist: 'Roody Roodboy',
    durationSeconds: 227,
    durationLabel: '3:47',
    thumbnail: rawThumb('74UdwVYR0Ys'),
    viewCount: '4.7M',
    genre: 'rap-kreyol',
    source: 'youtube',
  },
  {
    id: 'OCADqDIeL-k',
    title: 'Wendyyy - Gaspiye',
    artist: 'Wendyyy',
    durationSeconds: 222,
    durationLabel: '3:42',
    thumbnail: rawThumb('OCADqDIeL-k'),
    viewCount: '1.1M',
    genre: 'rap-kreyol',
    source: 'youtube',
  },
  {
    id: 'wjqXfQwGfMM',
    title: 'Wendyyy Traka - Yo Mele (Officiel Video)',
    artist: 'Wendyyy',
    durationSeconds: 298,
    durationLabel: '4:58',
    thumbnail: rawThumb('wjqXfQwGfMM'),
    viewCount: '5.9M',
    genre: 'rap-kreyol',
    source: 'youtube',
  },

  // === REGGAE / CLASSICS (Bob Marley) ===
  {
    id: 'HNBCVM4KbUM',
    title: 'Bob Marley & The Wailers - Three Little Birds (Official Music Video)',
    artist: 'Bob Marley',
    durationSeconds: 193,
    durationLabel: '3:13',
    thumbnail: rawThumb('HNBCVM4KbUM'),
    viewCount: '245.9M',
    genre: 'tout',
    source: 'youtube',
  },
  {
    id: 'NOyRsPDPfMM',
    title: 'Bob Marley & The Wailers - Three Little Birds (1977)',
    artist: 'Bob Marley',
    durationSeconds: 181,
    durationLabel: '3:01',
    thumbnail: rawThumb('NOyRsPDPfMM'),
    viewCount: '943K',
    genre: 'tout',
    source: 'youtube',
  },
  {
    id: 'CCK3luJOHho',
    title: 'Bob Marley - One Love (Official Audio)',
    artist: 'Bob Marley',
    durationSeconds: 173,
    durationLabel: '2:53',
    thumbnail: rawThumb('CCK3luJOHho'),
    viewCount: '14.9M',
    genre: 'tout',
    source: 'youtube',
  },
];

export function normalizeSearchText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP_WORDS = new Set([
  'official',
  'audio',
  'video',
  'music',
  'mizik',
  'hits',
  'hit',
  'haiti',
  'clip',
  'officiel',
  'song',
  'songs',
  'the',
  'feat',
  'ft',
  'and',
]);

export function getCatalogByGenre(genreId: GenreId): Track[] {
  if (genreId === 'tout') {
    // Interleave tracks across genres so every featured artist & style appears near the top
    const buckets: Record<string, Track[]> = {};
    for (const track of BUILT_IN_CATALOG) {
      const key = track.genre || 'tout';
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(track);
    }
    const order = ['konpa', 'raboday', 'afrobeat', 'amapiano', 'drill', 'rap-kreyol', 'tout'];
    const interleaved: Track[] = [];
    let added = true;
    let idx = 0;
    while (added) {
      added = false;
      for (const key of order) {
        const list = buckets[key];
        if (list && idx < list.length) {
          interleaved.push(list[idx]);
          added = true;
        }
      }
      idx++;
    }
    return interleaved;
  }

  return BUILT_IN_CATALOG.filter((t) => normalizeSearchText(t.genre || '') === normalizeSearchText(genreId));
}

export function filterBuiltInCatalog(query: string, genreId?: GenreId): Track[] {
  if (genreId && genreId !== 'tout') {
    const matchedGenre = GENRES.find((g) => g.id === genreId);
    if (!query || (matchedGenre && normalizeSearchText(query) === normalizeSearchText(matchedGenre.query))) {
      return getCatalogByGenre(genreId);
    }
  }

  if (genreId === 'tout') {
    const toutGenre = GENRES.find((g) => g.id === 'tout');
    if (!query || (toutGenre && normalizeSearchText(query) === normalizeSearchText(toutGenre.query))) {
      return getCatalogByGenre('tout');
    }
  }

  const normQuery = normalizeSearchText(query);
  if (!normQuery) return getCatalogByGenre(genreId || 'tout');

  // Check if query matches one of our genre labels directly
  const exactGenre = GENRES.find(
    (g) =>
      normalizeSearchText(g.label) === normQuery ||
      normalizeSearchText(g.id) === normQuery ||
      normalizeSearchText(g.query) === normQuery
  );
  if (exactGenre) {
    return getCatalogByGenre(exactGenre.id);
  }

  const allTokens = normQuery.split(' ').filter(Boolean);
  const meaningfulTokens = allTokens.filter((tok) => !STOP_WORDS.has(tok));
  const tokens = meaningfulTokens.length > 0 ? meaningfulTokens : allTokens;

  const scored = BUILT_IN_CATALOG.map((track) => {
    const haystack = normalizeSearchText(
      `${track.title} ${track.artist} ${track.genre || ''}`
    );
    let score = 0;
    if (haystack.includes(normQuery)) score += 10;
    for (const token of tokens) {
      if (haystack.includes(token)) {
        score += 3;
      }
    }
    return { track, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.track);

  return scored;
}
