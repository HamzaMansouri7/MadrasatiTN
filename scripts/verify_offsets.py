import fitz

def check_book(name, path, target_book_pages):
    doc = fitz.open(path)
    print(f"\n=== {name} (total {len(doc)} pages) ===")
    for bp in target_book_pages:
        # Check bp-1, bp, bp+1, bp+2 in 0-indexed PyMuPDF
        found = []
        for offset in [-1, 0, 1, 2]:
            idx = bp - 1 + offset
            if 0 <= idx < len(doc):
                # Search for the page number or text
                txt = doc[idx].get_text()
                lines = [l.strip() for l in txt.split('\n') if l.strip()]
                found.append((idx + 1, offset, lines[:2] if lines else []))
        print(f"Target book page {bp}:")
        for pnum, off, sample in found:
            print(f"   PDF p.{pnum:3d} (offset {off:+d}): {sample}")

check_book("1ere (101110)", "_sources/101110_P00.pdf", [13, 25])
check_book("2eme (101215)", "_sources/101215_P00.pdf", [16, 29])
check_book("3eme P1 (101315_P01)", "_sources/101315_P01.pdf", [16, 36])
check_book("4eme (101410)", "_sources/101410_P00.pdf", [9, 79])
check_book("5eme (101509)", "_sources/101509_P00.pdf", [16, 36])
check_book("6eme (101611)", "_sources/101611_P00.pdf", [22, 52])
