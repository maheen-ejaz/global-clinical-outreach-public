"""Build the isolated static review page. No credentials, backend or network."""
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "marketing/clinical-partnerships"


def scoped_tokens(source: str) -> str:
    """Scope v2 token selectors, including grouped and nested media rules."""
    namespace = ".gc-clinical-partnerships"

    def consume_trivia(text: str, position: int) -> int:
        while position < len(text):
            if text[position].isspace():
                position += 1
            elif text.startswith("/*", position):
                end = text.find("*/", position + 2)
                return len(text) if end < 0 else consume_trivia(text, end + 2)
            else:
                break
        return position

    def delimiter(text: str, position: int) -> tuple[int, str | None]:
        """Find the next top-level block/statement delimiter."""
        quote = None
        parens = brackets = 0
        while position < len(text):
            if text.startswith("/*", position):
                end = text.find("*/", position + 2)
                position = len(text) if end < 0 else end + 2
                continue
            char = text[position]
            if quote:
                if char == "\\":
                    position += 2
                    continue
                if char == quote:
                    quote = None
            elif char in "\"'":
                quote = char
            elif char == "(":
                parens += 1
            elif char == ")":
                parens = max(0, parens - 1)
            elif char == "[":
                brackets += 1
            elif char == "]":
                brackets = max(0, brackets - 1)
            elif not parens and not brackets and char in "{;}":
                return position, char
            position += 1
        return len(text), None

    def matching_brace(text: str, opening: int) -> int:
        depth = 1
        position = opening + 1
        quote = None
        while position < len(text):
            if text.startswith("/*", position):
                end = text.find("*/", position + 2)
                position = len(text) if end < 0 else end + 2
                continue
            char = text[position]
            if quote:
                if char == "\\":
                    position += 2
                    continue
                if char == quote:
                    quote = None
            elif char in "\"'":
                quote = char
            elif char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    return position
            position += 1
        raise ValueError("Unclosed CSS block in Attio Mono token source")

    def split_selectors(prelude: str) -> list[str]:
        selectors = []
        start = 0
        position = 0
        quote = None
        parens = brackets = 0
        while position < len(prelude):
            if prelude.startswith("/*", position):
                end = prelude.find("*/", position + 2)
                position = len(prelude) if end < 0 else end + 2
                continue
            char = prelude[position]
            if quote:
                if char == "\\":
                    position += 2
                    continue
                if char == quote:
                    quote = None
            elif char in "\"'":
                quote = char
            elif char == "(":
                parens += 1
            elif char == ")":
                parens = max(0, parens - 1)
            elif char == "[":
                brackets += 1
            elif char == "]":
                brackets = max(0, brackets - 1)
            elif char == "," and not parens and not brackets:
                selectors.append(prelude[start:position].strip())
                start = position + 1
            position += 1
        selectors.append(prelude[start:].strip())
        return selectors

    def scope_selector(selector: str) -> str:
        if selector.startswith(":root"):
            return re.sub(r":root(?![-\w])", namespace, selector)
        if re.match(r"^body(?:$|[.#:\[\s>+~])", selector):
            return re.sub(r"^body", namespace, selector, count=1)
        if selector.startswith('[data-accent="on"]'):
            # Support the documented accent attribute on either the page root or a child.
            return f":is({namespace}, {namespace} *){selector}"
        if selector == namespace or selector.startswith((namespace + " ", namespace + ":", namespace + "[")):
            return selector
        return f"{namespace} {selector}"

    def scope_stylesheet(text: str) -> str:
        output = []
        position = 0
        grouping_rules = ("@media", "@supports", "@container", "@layer", "@document")
        while position < len(text):
            trivia_end = consume_trivia(text, position)
            output.append(text[position:trivia_end])
            position = trivia_end
            if position >= len(text):
                break
            split, token = delimiter(text, position)
            if token in (";", "}") or token is None:
                output.append(text[position:split + (token == ";" or token == "}")])
                position = split + (1 if token in (";", "}") else 0)
                continue

            prelude = text[position:split]
            close = matching_brace(text, split)
            content = text[split + 1:close]
            at_rule = prelude.lstrip().startswith("@")
            if at_rule:
                rule_name = prelude.lstrip().split(None, 1)[0].lower()
                if rule_name.startswith(grouping_rules):
                    content = scope_stylesheet(content)
                output.extend((prelude, "{", content, "}"))
            else:
                scoped = ", ".join(scope_selector(selector) for selector in split_selectors(prelude))
                output.extend((scoped, " {", content, "}"))
            position = close + 1
        return "".join(output)

    scoped = scope_stylesheet(source)
    return "/* Generated from vendor/attio-mono-v2/tokens.css; do not edit. */\n" + scoped


def build() -> None:
    css = PAGE / "assets/css/attio-mono-scoped.css"
    css.write_text(scoped_tokens((PAGE / "vendor/attio-mono-v2/tokens.css").read_text()))
    dist = PAGE / "dist"
    if dist.exists():
        shutil.rmtree(dist)
    dist.mkdir()
    for name in ("index.html", "_headers", "robots.txt"):
        shutil.copy2(PAGE / name, dist / name)
    shutil.copytree(PAGE / "assets", dist / "assets")
    total = sum(p.stat().st_size for p in dist.rglob("*") if p.is_file())
    print(f"Partnership page: {dist.relative_to(ROOT)} ({total:,} bytes uncompressed)")


if __name__ == "__main__":
    build()
