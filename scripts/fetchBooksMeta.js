import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, url).toString();
        }
        return resolve(fetchUrl(redirectUrl));
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// 구약 39권 정보 (이름, 약어, 영문명, 장수)
const otBooksInfo = [
  { name: '창세기', abbr: '창', engName: 'Genesis', chapters: 50 },
  { name: '출애굽기', abbr: '출', engName: 'Exodus', chapters: 40 },
  { name: '레위기', abbr: '레', engName: 'Leviticus', chapters: 27 },
  { name: '민수기', abbr: '민', engName: 'Numbers', chapters: 36 },
  { name: '신명기', abbr: '신', engName: 'Deuteronomy', chapters: 34 },
  { name: '여호수아기', abbr: '수', engName: 'Joshua', chapters: 24 },
  { name: '사사기', abbr: '삿', engName: 'Judges', chapters: 21 },
  { name: '룻기', abbr: '룻', engName: 'Ruth', chapters: 4 },
  { name: '사무엘기상', abbr: '삼상', engName: '1 Samuel', chapters: 31 },
  { name: '사무엘기하', abbr: '삼하', engName: '2 Samuel', chapters: 24 },
  { name: '열왕기상', abbr: '왕상', engName: '1 Kings', chapters: 22 },
  { name: '열왕기하', abbr: '왕하', engName: '2 Kings', chapters: 25 },
  { name: '역대기상', abbr: '대상', engName: '1 Chronicles', chapters: 29 },
  { name: '역대기하', abbr: '대하', engName: '2 Chronicles', chapters: 36 },
  { name: '에스라기', abbr: '스', engName: 'Ezra', chapters: 10 },
  { name: '느헤미야기', abbr: '느', engName: 'Nehemiah', chapters: 13 },
  { name: '에스더기', abbr: '에', engName: 'Esther', chapters: 10 },
  { name: '욥기', abbr: '욥', engName: 'Job', chapters: 42 },
  { name: '시편', abbr: '시', engName: 'Psalms', chapters: 150 },
  { name: '잠언', abbr: '잠', engName: 'Proverbs', chapters: 31 },
  { name: '전도서', abbr: '전', engName: 'Ecclesiastes', chapters: 12 },
  { name: '아가', abbr: '아', engName: 'Song of Songs', chapters: 8 },
  { name: '이사야서', abbr: '사', engName: 'Isaiah', chapters: 66 },
  { name: '예레미야서', abbr: '렘', engName: 'Jeremiah', chapters: 52 },
  { name: '예레미야애가', abbr: '애', engName: 'Lamentations', chapters: 5 },
  { name: '에스겔서', abbr: '겔', engName: 'Ezekiel', chapters: 48 },
  { name: '다니엘서', abbr: '단', engName: 'Daniel', chapters: 12 },
  { name: '호세아서', abbr: '호', engName: 'Hosea', chapters: 14 },
  { name: '요엘서', abbr: '욜', engName: 'Joel', chapters: 3 },
  { name: '아모스서', abbr: '암', engName: 'Amos', chapters: 9 },
  { name: '오바댜서', abbr: '옵', engName: 'Obadiah', chapters: 1 },
  { name: '요나서', abbr: '욘', engName: 'Jonah', chapters: 4 },
  { name: '미가서', abbr: '미', engName: 'Micah', chapters: 7 },
  { name: '나훔서', abbr: '나', engName: 'Nahum', chapters: 3 },
  { name: '하박국서', abbr: '합', engName: 'Habakkuk', chapters: 3 },
  { name: '스바냐서', abbr: '습', engName: 'Zephaniah', chapters: 3 },
  { name: '학개서', abbr: '학', engName: 'Haggai', chapters: 2 },
  { name: '스가랴서', abbr: '슥', engName: 'Zechariah', chapters: 14 },
  { name: '말라기서', abbr: '말', engName: 'Malachi', chapters: 4 }
];

// 신약 27권 정보
const ntBooksInfo = [
  { name: '마태복음', abbr: '마', engName: 'Matthew', chapters: 28 },
  { name: '마가복음', abbr: '막', engName: 'Mark', chapters: 16 },
  { name: '누가복음', abbr: '눅', engName: 'Luke', chapters: 24 },
  { name: '요한복음', abbr: '요', engName: 'John', chapters: 21 },
  { name: '사도행전', abbr: '행', engName: 'Acts', chapters: 28 },
  { name: '로마서', abbr: '롬', engName: 'Romans', chapters: 16 },
  { name: '고린도전서', abbr: '고전', engName: '1 Corinthians', chapters: 16 },
  { name: '고린도후서', abbr: '고후', engName: '2 Corinthians', chapters: 13 },
  { name: '갈라디아서', abbr: '갈', engName: 'Galatians', chapters: 6 },
  { name: '에베소서', abbr: '엡', engName: 'Ephesians', chapters: 6 },
  { name: '빌립보서', abbr: '빌', engName: 'Philippians', chapters: 4 },
  { name: '골로새서', abbr: '골', engName: 'Colossians', chapters: 4 },
  { name: '데살로니가전서', abbr: '살전', engName: '1 Thessalonians', chapters: 5 },
  { name: '데살로니가후서', abbr: '살후', engName: '2 Thessalonians', chapters: 3 },
  { name: '디모데전서', abbr: '딤전', engName: '1 Timothy', chapters: 6 },
  { name: '디모데후서', abbr: '딤후', engName: '2 Timothy', chapters: 4 },
  { name: '디도서', abbr: '딛', engName: 'Titus', chapters: 3 },
  { name: '빌레몬서', abbr: '몬', engName: 'Philemon', chapters: 1 },
  { name: '히브리서', abbr: '히', engName: 'Hebrews', chapters: 13 },
  { name: '야고보서', abbr: '약', engName: 'James', chapters: 5 },
  { name: '베드로전서', abbr: '벧전', engName: '1 Peter', chapters: 5 },
  { name: '베드로후서', abbr: '벧후', engName: '2 Peter', chapters: 3 },
  { name: '요한일서', abbr: '요일', engName: '1 John', chapters: 5 },
  { name: '요한이서', abbr: '요이', engName: '2 John', chapters: 1 },
  { name: '요한삼서', abbr: '요삼', engName: '3 John', chapters: 1 },
  { name: '유다서', abbr: '유', engName: 'Jude', chapters: 1 },
  { name: '요한계시록', abbr: '계', engName: 'Revelation', chapters: 22 }
];

async function main() {
  console.log('Fetching themes from rv.or.kr...');
  const otHtml = await fetchUrl('http://www.rv.or.kr/ajax/uses_subject_old.php');
  const ntHtml = await fetchUrl('http://www.rv.or.kr/ajax/uses_subject_new.php');

  function parseTable(html) {
    const map = {};
    const trRegex = /<tr>\s*<td class="book_name">(.*?)<\/td>\s*<td class="book_subj">(.*?)<\/td>\s*<\/tr>/gs;
    let match;
    while ((match = trRegex.exec(html)) !== null) {
      const bookName = match[1].replace(/<[^>]+>/g, '').trim();
      const subj = match[2].replace(/<[^>]+>/g, '').trim();
      map[bookName] = subj;
    }
    return map;
  }

  const otThemes = parseTable(otHtml);
  const ntThemes = parseTable(ntHtml);

  const books = [];

  // 구약
  otBooksInfo.forEach((b, index) => {
    let theme = otThemes[b.name] || '';
    if (!theme) {
      // e.g. 사무엘기상,하 등 결합된 케이스 대응
      for (const [key, val] of Object.entries(otThemes)) {
        if (key.includes(b.name) || b.name.includes(key.replace(/,/g, ''))) {
          theme = val;
          break;
        }
        if (b.name.startsWith('사무엘기') && key.includes('사무엘기')) theme = val;
        if (b.name.startsWith('열왕기') && key.includes('열왕기')) theme = val;
        if (b.name.startsWith('역대기') && key.includes('역대기')) theme = val;
      }
    }
    books.push({
      id: index + 1,
      testament: 'OT',
      name: b.name,
      abbr: b.abbr,
      engName: b.engName,
      totalChapters: b.chapters,
      rvVer: 0,
      rvBookId: index + 1,
      theme: theme || `${b.name} 주제`
    });
  });

  // 신약
  ntBooksInfo.forEach((b, index) => {
    let theme = ntThemes[b.name] || '';
    if (!theme) {
      for (const [key, val] of Object.entries(ntThemes)) {
        if (key.includes(b.name) || b.name.includes(key.replace(/,/g, ''))) {
          theme = val;
          break;
        }
      }
    }
    books.push({
      id: index + 40,
      testament: 'NT',
      name: b.name,
      abbr: b.abbr,
      engName: b.engName,
      totalChapters: b.chapters,
      rvVer: 1,
      rvBookId: index + 1,
      theme: theme || `${b.name} 주제`
    });
  });

  const outPath = path.resolve(__dirname, '../src/data/bibleBooks.ts');
  const fileContent = `import { BibleBook } from '../types/bible';\n\nexport const BIBLE_BOOKS: BibleBook[] = ${JSON.stringify(books, null, 2)};\n\nexport const OT_BOOKS = BIBLE_BOOKS.filter(b => b.testament === 'OT');\nexport const NT_BOOKS = BIBLE_BOOKS.filter(b => b.testament === 'NT');\nexport const TOTAL_CHAPTERS = BIBLE_BOOKS.reduce((acc, b) => acc + b.totalChapters, 0); // 1189\n`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, fileContent, 'utf-8');
  console.log(`Saved ${books.length} books to ${outPath}`);
}

main().catch(console.error);
