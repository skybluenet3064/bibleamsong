import { VerseItem, BibleBook } from '../types/bible';
import { BIBLE_BOOKS } from '../data/bibleBooks';

// 인메모리 및 로컬 캐시
const chapterCache = new Map<string, VerseItem[]>();

/**
 * rv.or.kr HTML 텍스트에서 개요 및 절 목록 파싱
 */
export function parseRecoveryHtml(html: string, book: BibleBook, chapter: number): VerseItem[] {
  const verses: VerseItem[] = [];
  let mainOutline = '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 개요 목록 추출
    const outlines: string[] = [];
    doc.querySelectorAll('.outline').forEach((el) => {
      const txt = el.textContent?.trim();
      if (txt) outlines.push(txt);
    });
    mainOutline = outlines.join(' / ');

    const verseNodes = doc.querySelectorAll('.verse');
    verseNodes.forEach((node) => {
      const numEl = node.querySelector('.num');
      const textEl = node.querySelector('.text');
      if (!textEl) return;

      const verseNumStr = numEl?.textContent?.trim() || '';
      const verseText = textEl.textContent?.replace(/\s+/g, ' ').trim() || '';
      if (!verseText) return;

      if (verseNumStr) {
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
      } else if (verses.length > 0) {
        // 개요 등으로 분절된 구절 내용 합치기 (예: 1:2상, 1:2하)
        verses[verses.length - 1].text += ' ' + verseText;
      }
    });
  } catch (e) {
    console.warn('DOMParser failed, falling back to regex parser', e);
  }

  // Regex 폴백: DOMParser에서 추출된 결과가 없을 때 보완
  if (verses.length === 0) {
    const reg = /<div class=["']verse["']>\s*<div class=["']num["'][^>]*>(.*?)<\/div>\s*<div class=["']text["']>(.*?)<\/div>\s*<\/div>/gi;
    let m;
    while ((m = reg.exec(html)) !== null) {
      const numStr = m[1].replace(/<[^>]*>/g, '').trim();
      const text = m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      if (numStr) {
        const verseNum = parseInt(numStr, 10);
        if (!isNaN(verseNum)) {
          verses.push({
            bookId: book.id,
            bookName: book.name,
            chapter,
            verse: verseNum,
            text,
            outline: mainOutline || undefined
          });
        }
      } else if (verses.length > 0) {
        verses[verses.length - 1].text += ' ' + text;
      }
    }
  }

  return verses;
}

/**
 * 특정 권/장의 전체 구절 가져오기 (캐시 -> rv.or.kr 직접 호출 / 프록시)
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        chapterCache.set(cacheKey, parsed);
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  // rv.or.kr은 Access-Control-Allow-Origin: * 헤더를 전송하므로 브라우저에서 직접 fetch 가능
  const rvPath = `read_recovery.php?bibleVer=${book.rvVer}&bibleSelOp=${book.rvBookId}&bibChapt=${chapter}`;
  const directUrl = `https://www.rv.or.kr/${rvPath}`;
  const proxyUrl = `/rv-api/${rvPath}`;

  // 직접 호출 및 개발 프록시 순차 시도
  const candidateUrls = [directUrl, proxyUrl];

  for (const url of candidateUrls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const html = await res.text();
        const verses = parseRecoveryHtml(html, book, chapter);
        if (verses.length > 0) {
          chapterCache.set(cacheKey, verses);
          try {
            localStorage.setItem(localKey, JSON.stringify(verses));
          } catch (e) {
            // quota exceeded 시 캐시 건너뜀
          }
          return verses;
        }
      }
    } catch (err) {
      // 다음 URL 후보 시도
    }
  }

  // 오프라인 / 네트워크 오류 폴백: 로컬 대표 요절 제공
  return [];
}
