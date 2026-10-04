import { VerseItem, BibleBook } from '../types/bible';
import { BIBLE_BOOKS } from '../data/bibleBooks';

// 인메모리 및 로컬 캐시
const chapterCache = new Map<string, VerseItem[]>();

/**
 * rv.or.kr HTML 텍스트에서 개요 및 절 목록 파싱
 */
export function parseRecoveryHtml(html: string, book: BibleBook, chapter: number): VerseItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 개요 목록 추출
  const outlines: string[] = [];
  doc.querySelectorAll('.outline').forEach((el) => {
    const txt = el.textContent?.trim();
    if (txt) outlines.push(txt);
  });
  const mainOutline = outlines.join(' / ');

  const verses: VerseItem[] = [];
  const verseNodes = doc.querySelectorAll('.verse');

  verseNodes.forEach((node) => {
    const numEl = node.querySelector('.num');
    const textEl = node.querySelector('.text');

    if (numEl && textEl) {
      const verseNumStr = numEl.textContent?.trim();
      const verseText = textEl.textContent?.trim();

      if (verseNumStr && verseText) {
        const verseNum = parseInt(verseNumStr, 10);
        if (!isNaN(verseNum)) {
          verses.push({
            bookId: book.id,
            bookName: book.name,
            chapter,
            verse: verseNum,
            text: verseText,
            outline: mainOutline || undefined
          });
        }
      }
    }
  });

  return verses;
}

/**
 * 특정 권/장의 전체 구절 가져오기 (캐시 -> 프록시 API)
 */
export async function fetchChapterVerses(bookId: number, chapter: number): Promise<VerseItem[]> {
  const cacheKey = `${bookId}_${chapter}`;
  if (chapterCache.has(cacheKey)) {
    return chapterCache.get(cacheKey)!;
  }

  const book = BIBLE_BOOKS.find((b) => b.id === bookId);
  if (!book) throw new Error(`Book not found for ID: ${bookId}`);

  // 브라우저 로컬 스토리지 캐시 확인
  const localKey = `rv_cache_${bookId}_${chapter}`;
  try {
    const cached = localStorage.getItem(localKey);
    if (cached) {
      const parsed: VerseItem[] = JSON.parse(cached);
      chapterCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch (e) {
    // ignore
  }

  // 개발 환경에서는 Vite proxy, 배포 환경에서는 public CORS proxy 활용
  const rvPath = `read_recovery.php?bibleVer=${book.rvVer}&bibleSelOp=${book.rvBookId}&bibChapt=${chapter}`;
  const isDev = import.meta.env.DEV;
  const url = isDev 
    ? `/rv-api/${rvPath}` 
    : `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.rv.or.kr/${rvPath}`)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const html = await res.text();
    const verses = parseRecoveryHtml(html, book, chapter);

    if (verses.length > 0) {
      chapterCache.set(cacheKey, verses);
      try {
        localStorage.setItem(localKey, JSON.stringify(verses));
      } catch (e) {
        // quota exceeded 등의 경우 캐시 생략
      }
      return verses;
    }
  } catch (err) {
    console.warn(`Failed to fetch verses from rv.or.kr for ${book.name} ${chapter}장, falling back to local dataset.`, err);
  }

  // fallback: 최소 기본 구절 생성
  return [];
}
