#!/usr/bin/env python3
"""Convert the question workbook into the JSON files loaded by the quiz app.

The converter uses only Python's standard library. It supports ordinary .xlsx
workbooks with inline strings or shared strings; formulas are not evaluated.
"""

from __future__ import annotations

import argparse
import json
import os
import posixpath
import re
import sys
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_WORKBOOK = ROOT / "data" / "questions.xlsx"
DEFAULT_OUTPUT_DIR = ROOT / "data"
MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
DOC_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
XML_NS = "http://www.w3.org/XML/1998/namespace"

SHEET_ALIASES = {
    "quiz": {"quiz", "クイズ", "タイムショック・じっくり"},
    "kanji": {"kanji", "漢字"},
    "photo": {"photo", "写真", "写真クイズ"},
}

QUIZ_LEVELS = ["0", "1", "2", "3", "4", "5", "MAX"]
KANJI_LEVELS = ["beginner", "intermediate", "advanced", "hayauchi"]


class WorkbookError(Exception):
    pass


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def normalize_header(value: str) -> str:
    key = re.sub(r"[\s_-]+", "", value.strip()).lower()
    return {
        "acceptedanswers": "accepted_answers",
        "imagealt": "image_alt",
        "imagecredit": "image_credit",
        "imagesource": "image_source",
    }.get(key, key)


def column_number(reference: str) -> int:
    letters = re.match(r"[A-Z]+", reference.upper())
    if not letters:
        raise WorkbookError(f"セル番地を読み取れません: {reference}")
    result = 0
    for character in letters.group(0):
        result = result * 26 + ord(character) - ord("A") + 1
    return result


def read_shared_strings(archive: ZipFile) -> list[str]:
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    values = []
    for item in root.findall(f"{{{MAIN_NS}}}si"):
        values.append("".join(node.text or "" for node in item.iter(f"{{{MAIN_NS}}}t")))
    return values


def read_sheet_rows(archive: ZipFile, path: str, shared_strings: list[str]) -> list[tuple[int, list[str]]]:
    root = ET.fromstring(archive.read(path))
    rows: list[tuple[int, list[str]]] = []
    sheet_data = root.find(f"{{{MAIN_NS}}}sheetData")
    if sheet_data is None:
        return rows

    for row_index, row in enumerate(sheet_data.findall(f"{{{MAIN_NS}}}row"), start=1):
        values: list[str] = []
        for cell in row.findall(f"{{{MAIN_NS}}}c"):
            index = column_number(cell.attrib.get("r", "A1")) - 1
            while len(values) <= index:
                values.append("")

            cell_type = cell.attrib.get("t")
            if cell_type == "inlineStr":
                value = "".join(node.text or "" for node in cell.iter(f"{{{MAIN_NS}}}t"))
            else:
                value_node = cell.find(f"{{{MAIN_NS}}}v")
                value = value_node.text if value_node is not None and value_node.text else ""
                if cell_type == "s" and value:
                    try:
                        value = shared_strings[int(value)]
                    except (ValueError, IndexError) as error:
                        raise WorkbookError(f"共有文字列の番号が不正です: {value}") from error
                elif cell_type == "b":
                    value = "TRUE" if value == "1" else "FALSE"
            values[index] = value
        if any(value.strip() for value in values):
            rows.append((int(row.attrib.get("r", row_index)), values))
    return rows


def workbook_sheets(archive: ZipFile) -> dict[str, str]:
    try:
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    except KeyError as error:
        raise WorkbookError("有効なExcelブック（.xlsx）ではありません。") from error

    targets = {
        relationship.attrib["Id"]: relationship.attrib["Target"]
        for relationship in relationships.findall(f"{{{PKG_REL_NS}}}Relationship")
    }
    result: dict[str, str] = {}
    for sheet in workbook.iter(f"{{{MAIN_NS}}}sheet"):
        name = sheet.attrib.get("name", "")
        relationship_id = sheet.attrib.get(f"{{{DOC_REL_NS}}}id")
        target = targets.get(relationship_id or "")
        if not target:
            continue
        path = target.lstrip("/") if target.startswith("/") else posixpath.normpath(posixpath.join("xl", target))
        result[name.strip().lower()] = path
    return result


def read_tables(workbook_path: Path) -> dict[str, list[dict[str, str]]]:
    if not workbook_path.exists():
        raise WorkbookError(f"Excelファイルが見つかりません: {workbook_path}")

    with ZipFile(workbook_path) as archive:
        sheets = workbook_sheets(archive)
        shared_strings = read_shared_strings(archive)
        tables: dict[str, list[dict[str, str]]] = {}
        for table_name, aliases in SHEET_ALIASES.items():
            sheet_path = next((sheets[name.lower()] for name in aliases if name.lower() in sheets), None)
            if sheet_path is None:
                raise WorkbookError(f"シート「{table_name}」がありません。必要なシート: Quiz / Kanji / Photo")
            rows = read_sheet_rows(archive, sheet_path, shared_strings)
            if not rows:
                raise WorkbookError(f"シート「{table_name}」に見出し行がありません。")

            header_row_number, header_values = rows[0]
            headers = [normalize_header(value) for value in header_values]
            if len(headers) != len(set(header for header in headers if header)):
                raise WorkbookError(f"シート「{table_name}」の見出しが重複しています（{header_row_number}行目）。")
            table = []
            for row_number, row in rows[1:]:
                if not any(value.strip() for value in row):
                    continue
                record = {
                    header: row[index].strip() if index < len(row) else ""
                    for index, header in enumerate(headers)
                    if header
                }
                record["__row__"] = str(row_number)
                table.append(record)
            tables[table_name] = table
        return tables


def required(record: dict[str, str], field: str, sheet: str) -> str:
    value = record.get(field, "").strip()
    if not value:
        raise WorkbookError(f"{sheet}シート {record.get('__row__', '?')}行目: {field} は必須です。")
    return value


def split_list(value: str) -> list[str]:
    return [part.strip() for part in value.split("|") if part.strip()]


def split_accepted_answers(value: str) -> list[str]:
    # Pipe is the current separator. Accept comma-separated values from older
    # workbooks too, so regenerating one mode does not collapse its alternatives.
    if "|" in value:
        return split_list(value)
    return [part.strip() for part in value.split(",") if part.strip()]


def choices_from_record(record: dict[str, str], sheet: str) -> list[str]:
    choice_fields = [f"choices{index}" for index in range(1, 5)]
    if any(field in record for field in choice_fields):
        values = [record.get(field, "").strip() for field in choice_fields]
        last_filled = max((index for index, value in enumerate(values) if value), default=-1)
        if any(not value for value in values[:last_filled]):
            raise WorkbookError(f"{sheet}シート {record.get('__row__', '?')}行目: Choices1〜4の途中に空欄があります。")
        choices = values[:last_filled + 1]
    else:
        # 旧ブックからの移行用。更新後のブックではChoices1〜4を使います。
        choices = split_list(record.get("choices", ""))

    if len(choices) < 2:
        raise WorkbookError(f"{sheet}シート {record.get('__row__', '?')}行目: Choices1〜4に2つ以上の選択肢を入れてください。")
    return choices


def convert_tables(tables: dict[str, list[dict[str, str]]]) -> dict[str, object]:
    quiz: dict[str, list[dict[str, object]]] = {level: [] for level in QUIZ_LEVELS}
    kanji: dict[str, list[dict[str, object]]] = {level: [] for level in KANJI_LEVELS}
    photo: list[dict[str, object]] = []

    for record in tables["quiz"]:
        level = required(record, "level", "Quiz")
        if level.endswith(".0"):
            level = level[:-2]
        if level not in quiz:
            raise WorkbookError(f"Quizシート {record['__row__']}行目: level は0〜5またはMAXで指定してください。")
        choices = choices_from_record(record, "Quiz")
        quiz[level].append({
            "question": required(record, "question", "Quiz"),
            "choices": choices,
            "answer": required(record, "answer", "Quiz"),
            "exp": record.get("exp", ""),
        })

    for record in tables["kanji"]:
        level = required(record, "level", "Kanji").lower()
        if level not in kanji:
            allowed = ", ".join(KANJI_LEVELS)
            raise WorkbookError(f"Kanjiシート {record['__row__']}行目: level は {allowed} のいずれかで指定してください。")
        question: dict[str, object] = {
            "kanji": required(record, "kanji", "Kanji"),
            "answer": required(record, "answer", "Kanji"),
            "exp": record.get("exp", ""),
        }
        accepted = split_accepted_answers(record.get("accepted_answers", ""))
        if accepted:
            question["acceptedAnswers"] = accepted
        kanji[level].append(question)

    for record in tables["photo"]:
        # 写真を先に登録し、問題文と正解をあとから入力するためのテンプレート行は出力しない。
        if not record.get("question", "").strip() and not record.get("answer", "").strip():
            continue

        question: dict[str, object] = {
            "question": required(record, "question", "Photo"),
            "answer": required(record, "answer", "Photo"),
            "exp": record.get("exp", ""),
            "image": required(record, "image", "Photo"),
            "imageAlt": record.get("image_alt", ""),
            "imageCredit": record.get("image_credit", ""),
            "imageSource": record.get("image_source", ""),
        }
        accepted = split_accepted_answers(record.get("accepted_answers", ""))
        if accepted:
            question["acceptedAnswers"] = accepted
        photo.append(question)

    return {"quiz": quiz, "kanji": kanji, "photo": photo}


def write_json_files(payloads: dict[str, object], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    for mode, filename in (("quiz", "quiz.json"), ("kanji", "kanji.json"), ("photo", "photo.json")):
        destination = output_dir / filename
        content = json.dumps(payloads[mode], ensure_ascii=False, indent=2) + "\n"
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=output_dir, delete=False) as temporary:
            temporary.write(content)
            temporary_path = Path(temporary.name)
        temporary_path.replace(destination)
        os.chmod(destination, 0o644)


def parse_js_literal(source: str, start: int) -> tuple[object, int]:
    index = start
    decoder = json.JSONDecoder()

    def skip_space_and_comments() -> None:
        nonlocal index
        while index < len(source):
            if source[index].isspace():
                index += 1
            elif source.startswith("//", index):
                newline = source.find("\n", index)
                index = len(source) if newline < 0 else newline + 1
            else:
                break

    def parse_value() -> object:
        nonlocal index
        skip_space_and_comments()
        if index >= len(source):
            raise WorkbookError("js/data.js の値が途中で終わっています。")
        character = source[index]
        if character == '"':
            value, index_after = decoder.raw_decode(source, index)
            index = index_after
            return value
        if character == "{":
            index += 1
            result: dict[str, object] = {}
            while True:
                skip_space_and_comments()
                if index < len(source) and source[index] == "}":
                    index += 1
                    return result
                if index < len(source) and source[index] == '"':
                    key, index_after = decoder.raw_decode(source, index)
                    index = index_after
                else:
                    match = re.match(r"[A-Za-z_$][A-Za-z0-9_$]*", source[index:])
                    if not match:
                        raise WorkbookError(f"js/data.js のオブジェクトキーを解釈できません（{index}文字目）。")
                    key = match.group(0)
                    index += len(key)
                skip_space_and_comments()
                if index >= len(source) or source[index] != ":":
                    raise WorkbookError(f"js/data.js の「{key}」の後に : がありません。")
                index += 1
                result[key] = parse_value()
                skip_space_and_comments()
                if index < len(source) and source[index] == ",":
                    index += 1
                    continue
                if index < len(source) and source[index] == "}":
                    index += 1
                    return result
                raise WorkbookError(f"js/data.js のオブジェクトが閉じられていません（{index}文字目）。")
        if character == "[":
            index += 1
            result = []
            while True:
                skip_space_and_comments()
                if index < len(source) and source[index] == "]":
                    index += 1
                    return result
                result.append(parse_value())
                skip_space_and_comments()
                if index < len(source) and source[index] == ",":
                    index += 1
                    continue
                if index < len(source) and source[index] == "]":
                    index += 1
                    return result
                raise WorkbookError(f"js/data.js の配列が閉じられていません（{index}文字目）。")
        match = re.match(r"-?\d+(?:\.\d+)?", source[index:])
        if match:
            index += len(match.group(0))
            return float(match.group(0)) if "." in match.group(0) else int(match.group(0))
        identifier = re.match(r"[A-Za-z_$][A-Za-z0-9_$]*", source[index:])
        if identifier:
            index += len(identifier.group(0))
            values = {"true": True, "false": False, "null": None, "undefined": None}
            token = identifier.group(0)
            if token in values:
                return values[token]
        raise WorkbookError(f"js/data.js の値を解釈できません（{index}文字目）。")

    return parse_value(), index


def extract_legacy_data(source: str, constant_name: str) -> object:
    match = re.search(rf"\bconst\s+{re.escape(constant_name)}\s*=\s*", source)
    if not match:
        raise WorkbookError(f"js/data.js に {constant_name} がありません。")
    value, _ = parse_js_literal(source, match.end())
    return value


def excel_column(index: int) -> str:
    result = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        result = chr(65 + remainder) + result
    return result


def clean_xml_text(value: object) -> str:
    text = str(value if value is not None else "")
    return "".join(character for character in text if character in "\t\n\r" or ord(character) >= 0x20)


def make_sheet_xml(rows: list[list[object]]) -> str:
    chunks = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        f'<worksheet xmlns="{MAIN_NS}"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="18"/><sheetData>',
    ]
    for row_number, row in enumerate(rows, start=1):
        cells = []
        for column_index, value in enumerate(row, start=1):
            reference = f"{excel_column(column_index)}{row_number}"
            text = clean_xml_text(value)
            escaped = (text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
            cells.append(f'<c r="{reference}" t="inlineStr"><is><t xml:space="preserve">{escaped}</t></is></c>')
        chunks.append(f'<row r="{row_number}">{"".join(cells)}</row>')
    chunks.append("</sheetData></worksheet>")
    return "".join(chunks)


def write_workbook(path: Path, data: dict[str, object], refuse_overwrite: bool = True) -> None:
    if path.exists() and refuse_overwrite:
        raise WorkbookError(f"Excelファイルは既にあります。上書きしません: {path}")

    choice_headers = [f"Choices{index}" for index in range(1, 5)]

    def choice_cells(question: dict[str, object]) -> list[str]:
        choices = list(question["choices"])
        if len(choices) > 4:
            raise WorkbookError("Choices1〜4に収まらない5つ以上の選択肢があります。")
        return choices + [""] * (4 - len(choices))

    quiz_rows: list[list[object]] = [["level", "question", *choice_headers, "answer", "exp"]]
    for level, questions in data["quiz"].items():
        for question in questions:
            quiz_rows.append([level, question["question"], *choice_cells(question), question["answer"], question.get("exp", "")])

    kanji_rows: list[list[object]] = [["level", "kanji", "answer", "accepted_answers", "exp"]]
    for level, questions in data["kanji"].items():
        for question in questions:
            kanji_rows.append([level, question["kanji"], question["answer"], " | ".join(question.get("acceptedAnswers", [])), question.get("exp", "")])

    photo_rows: list[list[object]] = [["question", "answer", "accepted_answers", "exp", "image", "image_alt", "image_credit", "image_source"]]
    for question in data["photo"]:
        photo_rows.append([
            question["question"], question["answer"], " | ".join(question.get("acceptedAnswers", [])), question.get("exp", ""),
            question["image"], question.get("imageAlt", ""), question.get("imageCredit", ""), question.get("imageSource", ""),
        ])

    names = ["Quiz", "Kanji", "Photo"]
    sheets = [quiz_rows, kanji_rows, photo_rows]
    content_types = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
        '<Default Extension="xml" ContentType="application/xml"/>',
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    ]
    content_types.extend(
        f'<Override PartName="/xl/worksheets/sheet{index}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        for index in range(1, len(names) + 1)
    )
    content_types.append("</Types>")

    workbook_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<workbook xmlns="{MAIN_NS}" xmlns:r="{DOC_REL_NS}"><sheets>'
        + "".join(f'<sheet name="{name}" sheetId="{index}" r:id="rId{index}"/>' for index, name in enumerate(names, start=1))
        + "</sheets></workbook>"
    )
    workbook_rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<Relationships xmlns="{PKG_REL_NS}">'
        + "".join(
            f'<Relationship Id="rId{index}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{index}.xml"/>'
            for index in range(1, len(names) + 1)
        )
        + "</Relationships>"
    )
    root_rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<Relationships xmlns="{PKG_REL_NS}"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'
    )

    path.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(path, "w", ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", "".join(content_types))
        archive.writestr("_rels/.rels", root_rels)
        archive.writestr("xl/workbook.xml", workbook_xml)
        archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels)
        for index, rows in enumerate(sheets, start=1):
            archive.writestr(f"xl/worksheets/sheet{index}.xml", make_sheet_xml(rows))


def init_from_legacy(workbook_path: Path) -> None:
    legacy_path = ROOT / "js" / "data.js"
    if not legacy_path.exists():
        raise WorkbookError(f"既存データが見つかりません: {legacy_path}")
    source = legacy_path.read_text(encoding="utf-8")
    data = {
        "quiz": extract_legacy_data(source, "allQuizData"),
        "kanji": extract_legacy_data(source, "allKanjiQuizData"),
        "photo": extract_legacy_data(source, "allPhotoQuizData"),
    }
    write_workbook(workbook_path, data)


def migrate_choice_columns(workbook_path: Path) -> None:
    payloads = convert_tables(read_tables(workbook_path))
    temporary_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".xlsx", dir=workbook_path.parent, delete=False) as temporary:
            temporary_path = Path(temporary.name)
        write_workbook(temporary_path, payloads, refuse_overwrite=False)
        temporary_path.replace(workbook_path)
        os.chmod(workbook_path, 0o644)
    finally:
        if temporary_path is not None and temporary_path.exists():
            temporary_path.unlink()


def main() -> int:
    parser = argparse.ArgumentParser(description="Excelの問題表をモード別JSONへ変換します。")
    parser.add_argument("--workbook", type=Path, default=DEFAULT_WORKBOOK, help="入力する.xlsxファイル")
    parser.add_argument("--output-dir", type=Path, default=None, help="JSONの出力先（既定: Excelと同じフォルダー）")
    parser.add_argument("--init-from-legacy", action="store_true", help="旧 js/data.js を読み取り、初期Excelを作ってからJSONへ変換")
    parser.add_argument("--split-choice-columns", action="store_true", help="既存Excelの選択肢をChoices1〜4列へ移し、JSONも更新")
    args = parser.parse_args()

    workbook_path = args.workbook.resolve()
    output_dir = (args.output_dir or workbook_path.parent).resolve()
    try:
        if args.init_from_legacy:
            init_from_legacy(workbook_path)
        if args.split_choice_columns:
            migrate_choice_columns(workbook_path)
        payloads = convert_tables(read_tables(workbook_path))
        write_json_files(payloads, output_dir)
    except (WorkbookError, OSError, ET.ParseError, ValueError) as error:
        print(f"変換エラー: {error}", file=sys.stderr)
        return 1

    print(f"Excel: {workbook_path}")
    print(f"JSON: {output_dir / 'quiz.json'} / kanji.json / photo.json")
    print(f"件数: クイズ {sum(len(items) for items in payloads['quiz'].values())}問、漢字 {sum(len(items) for items in payloads['kanji'].values())}問、写真 {len(payloads['photo'])}問")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
