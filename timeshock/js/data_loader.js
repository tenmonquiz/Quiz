let allQuizData = {};
let allKanjiQuizData = {};
let allPhotoQuizData = [];

async function loadQuestionData() {
    const files = ['quiz.json', 'kanji.json', 'photo.json'];
    const payloads = await Promise.all(files.map(async (file) => {
        const response = await fetch(`data/${file}`);
        if (!response.ok) {
            throw new Error(`${file} を読み込めませんでした (HTTP ${response.status})`);
        }
        return response.json();
    }));

    const [quiz, kanji, photo] = payloads;
    if (!quiz || typeof quiz !== 'object' || Array.isArray(quiz)) {
        throw new Error('quiz.json の形式が正しくありません');
    }
    if (!kanji || typeof kanji !== 'object' || Array.isArray(kanji)) {
        throw new Error('kanji.json の形式が正しくありません');
    }
    if (!Array.isArray(photo)) {
        throw new Error('photo.json は問題の配列にしてください');
    }

    allQuizData = quiz;
    allKanjiQuizData = kanji;
    allPhotoQuizData = photo;
}
