#!/bin/zsh

PROJECT_DIR="${0:A:h}"
cd "$PROJECT_DIR" || exit 1

print "クイズデータをJSONに変換します..."
if ! command -v python3 >/dev/null 2>&1; then
    print "Python 3 が見つかりません。Python 3 をインストールしてから、もう一度実行してください。"
    conversion_exit_code=127
else
    python3 scripts/excel_to_json.py
    conversion_exit_code=$?
fi

if [[ $conversion_exit_code -eq 0 ]]; then
    print ""
    print "変換できました。data/quiz.json、data/kanji.json、data/photo.json が更新されています。"
    print "GitHubで使う場合は、この3つのJSONもアップロードしてください。"
else
    print ""
    print "変換に失敗しました。上のエラーを確認してください。"
fi

print ""
print "Returnキーを押すと閉じます。"
read _
exit $conversion_exit_code
