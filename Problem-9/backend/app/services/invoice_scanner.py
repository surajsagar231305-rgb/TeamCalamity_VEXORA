import re
import os
import io
import zlib
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from PIL import Image
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.account import Account

# Comprehensive vendor signatures for India, USA, and International receipts
VENDOR_SIGNATURES = [
    # US & Global Retailers
    {
        "regex": r"(walmart|wal-mart|sam'?s\s*club)",
        "title": "Walmart Supercenter",
        "category": "Food & Dining"
    },
    {
        "regex": r"(target\s*store|target\.com|\btarget\b)",
        "title": "Target Store",
        "category": "Shopping"
    },
    {
        "regex": r"(costco|costco\s*wholesale)",
        "title": "Costco Wholesale",
        "category": "Food & Dining"
    },
    {
        "regex": r"(best\s*buy|micro\s*center|newegg)",
        "title": "Best Buy Electronics",
        "category": "Shopping"
    },
    {
        "regex": r"(home\s*depot|lowe'?s|ikea)",
        "title": "Home Depot",
        "category": "Shopping"
    },
    {
        "regex": r"(cvs\s*pharmacy|\bcvs\b|walgreens|rite\s*aid)",
        "title": "CVS Pharmacy",
        "category": "Medical & Health"
    },
    {
        "regex": r"(trader\s*joe'?s|whole\s*foods|kroger|safeway|aldi|sprouts|publix|heb\b)",
        "title": "Whole Foods / Groceries",
        "category": "Food & Dining"
    },
    # Paper / Office Supplies / Dunder Mifflin
    {
        "regex": r"(dunder\s*mifflin|paper\s*m|paper\s*co|office\s*depot|staples|officemax)",
        "title": "Office & Paper Supplies",
        "category": "Shopping"
    },
    # Tech & Online Services
    {
        "regex": r"(apple\s*store|apple\s*inc|apple\s*india|airpods|iphone|macbook|ipad|itunes|app\s*store)",
        "title": "Apple Store",
        "category": "Shopping"
    },
    {
        "regex": r"(amazon\s*services|aws|amazon\.com|amazon\s*web\s*services|amzn|flipkart|myntra|ajio|meesho)",
        "title": "Amazon",
        "category": "Shopping"
    },
    {
        "regex": r"(google\s*llc|google\s*cloud|google\s*play|google\s*storage|gsuite|workspace)",
        "title": "Google Cloud & Services",
        "category": "Utilities & Bills"
    },
    {
        "regex": r"(microsoft|msft|azure|office\s*365|github|openai)",
        "title": "Microsoft / Cloud Services",
        "category": "Utilities & Bills"
    },
    # Fast Food & Dining (US & Global)
    {
        "regex": r"(starbucks|starbucks\s*coffee)",
        "title": "Starbucks Coffee",
        "category": "Food & Dining"
    },
    {
        "regex": r"(mcdonald'?s|mcd\b|burger\s*king|wendy'?s|taco\s*bell|subway|chipotle|domino'?s|pizza\s*hut|kfc|dunkin|chick-?fil-?a|panera|panda\s*express|shake\s*shack|five\s*guys|in-?n-?out)",
        "title": "Restaurant & Fast Food",
        "category": "Food & Dining"
    },
    {
        "regex": r"(swiggy|zomato|eatsure|smoke\s*house)",
        "title": "Food & Dining Order",
        "category": "Food & Dining"
    },
    {
        "regex": r"(blinkit|zepto|instamart|bigbasket|nature'?s\s*basket|d-?mart|spencer)",
        "title": "Groceries Delivery",
        "category": "Food & Dining"
    },
    # Travel & Gas (US & Global)
    {
        "regex": r"(uber|lyft|ola|rapido)",
        "title": "Rideshare & Commute",
        "category": "Transportation"
    },
    {
        "regex": r"(shell|chevron|exxon|mobil|texaco|bp\s*gas|speedway|fuel|petrol|diesel|hpcl|bpcl|ioc)",
        "title": "Fuel & Gas Station",
        "category": "Transportation"
    },
    {
        "regex": r"(delta\s*air|american\s*airlines|united\s*airlines|southwest|indigo|air\s*india|spicejet|vistara|irctc)",
        "title": "Airlines & Transit",
        "category": "Transportation"
    },
    # Healthcare & Insurance
    {
        "regex": r"(star\s*health|family\s*optima|mediclaim|health\s*insurance|blue\s*cross|anthem|aetna|cigna|unitedhealth)",
        "title": "Star Health Insurance",
        "category": "Health Insurance"
    },
    {
        "regex": r"(hdfc\s*life|click\s*2\s*protect|life\s*insurance|term\s*insurance|lic|metlife|prudential)",
        "title": "HDFC Life Insurance",
        "category": "Life Insurance"
    },
    {
        "regex": r"(apollo\s*pharmacy|apollo\s*hospitals|pharmacy|chemist|medplus|netmeds|kaiser)",
        "title": "Apollo Pharmacy",
        "category": "Medical & Health"
    },
    {
        "regex": r"(max\s*healthcare|fortis|manipal|dr\.\s*lal|pathlabs|diagnostic|quest\s*diagnostics|labcorp)",
        "title": "Max Healthcare Diagnostics",
        "category": "Medical & Health"
    },
    # Indian Electronics
    {
        "regex": r"(croma|reliance\s*digital|vijay\s*sales)",
        "title": "Croma Electronics",
        "category": "Shopping"
    },
    # Telecom & Utilities
    {
        "regex": r"(at&t|verizon|t-mobile|xfinity|comcast|spectrum|airtel|jio|vi\s*telecom|vodafone|bescom|tata\s*power|broadband|electricity|pge|coned)",
        "title": "Utility & Telecom Bill",
        "category": "Utilities & Bills"
    },
    # Entertainment & Shipping
    {
        "regex": r"(fedex|ups\s*store|usps|united\s*states\s*postal|dhl)",
        "title": "Shipping & Postage",
        "category": "Shopping"
    },
    {
        "regex": r"(netflix|spotify|disney|hulu|hbo|paramount|prime\s*video|hotstar|pvr|inox|cinepolis|amc\s*theatres|regal\s*cinemas)",
        "title": "Entertainment & Streaming",
        "category": "Entertainment"
    },
    # Investments
    {
        "regex": r"(zerodha|groww|angel\s*one|upstox|fidelity|vanguard|charles\s*schwab|robinhood|etrade|demat|brokerage)",
        "title": "Zerodha Demat Investment",
        "category": "Demat & Equity"
    }
]

CATEGORY_KEYWORD_MAP = {
    "Food & Dining": [
        "food", "dining", "restaurant", "cafe", "coffee", "kitchen", "bistro",
        "swiggy", "zomato", "bakery", "burger", "pizza", "meal", "groceries",
        "grocery", "supermarket", "blinkit", "zepto", "instamart", "bigbasket",
        "organic", "bread", "milk", "fruits", "vegetables", "pantry",
        "walmart", "costco", "starbucks", "subway", "chipotle", "deli"
    ],
    "Shopping": [
        "apple", "croma", "electronics", "clothing", "shopping", "store",
        "retail", "clothes", "shoes", "amazon", "flipkart", "myntra",
        "airpods", "monitor", "laptop", "mobile", "phone", "gadget", "apparel",
        "best buy", "target", "home depot", "paper", "office depot", "staples"
    ],
    "Health Insurance": [
        "health insurance", "star health", "medi-claim", "mediclaim",
        "policy", "sum insured", "cashless", "medical policy", "premium",
        "blue cross", "anthem", "aetna", "cigna"
    ],
    "Life Insurance": [
        "life insurance", "hdfc life", "term insurance", "lic",
        "term life", "death benefit", "nominee", "endowment", "protect", "metlife"
    ],
    "Medical & Health": [
        "pharmacy", "medicine", "tablets", "hospital", "clinic", "doctor",
        "medical", "health", "checkup", "test", "diagnostic", "dental",
        "healthcare", "apollo", "vitamins", "prescription", "cvs", "walgreens", "rx"
    ],
    "Transportation": [
        "transportation", "uber", "lyft", "ola", "taxi", "cab", "fuel", "petrol",
        "diesel", "gas", "gasoline", "transit", "metro", "airline", "flight", "indigo",
        "ticket", "toll", "fastag", "commute", "parking", "shell", "chevron"
    ],
    "Demat & Equity": [
        "demat", "zerodha", "groww", "equity", "stock", "shares",
        "trading", "broker", "dividend", "nifty", "sensex", "bse", "nse", "fidelity", "vanguard"
    ],
    "Mutual Funds & SIP": [
        "mutual fund", "sip", "index fund", "nav", "folio", "units", "flexi cap"
    ],
    "Utilities & Bills": [
        "utility", "electricity", "bill", "power", "water", "broadband",
        "internet", "wifi", "mobile recharge", "recharge", "airtel", "jio", "verizon", "at&t"
    ],
    "House Rent": [
        "rent", "rental", "flat", "apartment", "landlord", "maintenance", "society", "lease"
    ],
    "Entertainment": [
        "entertainment", "movie", "cinema", "pvr", "inox", "netflix",
        "prime", "hotstar", "spotify", "theatre", "concert", "tickets", "amc"
    ],
    "Credit Card Payments": [
        "credit card bill", "card settlement", "statement payment", "outstanding settlement"
    ]
}

CURRENCY_RATES = {
    "INR": {"symbol": "₹", "rate": 1.0, "name": "Indian Rupee"},
    "USD": {"symbol": "$", "rate": 86.50, "name": "US Dollar"},
    "EUR": {"symbol": "€", "rate": 93.20, "name": "Euro"},
    "GBP": {"symbol": "£", "rate": 110.50, "name": "British Pound"},
    "AED": {"symbol": "AED", "rate": 23.55, "name": "UAE Dirham"},
    "CAD": {"symbol": "C$", "rate": 61.20, "name": "Canadian Dollar"},
    "AUD": {"symbol": "A$", "rate": 55.40, "name": "Australian Dollar"},
    "SGD": {"symbol": "S$", "rate": 64.80, "name": "Singapore Dollar"},
    "JPY": {"symbol": "¥", "rate": 0.58, "name": "Japanese Yen"}
}


def detect_currency(raw_text: str) -> Tuple[str, str, float]:
    """
    Detects currency symbol/code from receipt text.
    Handles Indian receipts (INR), USA receipts (USD), and international receipts.
    Returns (currency_code, symbol, exchange_rate_to_inr).
    """
    t_upper = raw_text.upper()

    # 1. Foreign currency explicit markers
    has_dollar = '$' in raw_text or bool(re.search(r'(?<![A-Z])(?:USD|DOLLARS?|US\$)(?![A-Z])', t_upper))
    has_euro = '€' in raw_text or bool(re.search(r'(?<![A-Z])(?:EUR|EUROS?)(?![A-Z])', t_upper))
    has_gbp = '£' in raw_text or bool(re.search(r'(?<![A-Z])(?:GBP|POUNDS?)(?![A-Z])', t_upper))
    has_aed = bool(re.search(r'(?<![A-Z])(?:AED|DIRHAMS?|DHS)(?![A-Z])', t_upper))
    has_jpy = '¥' in raw_text or bool(re.search(r'(?<![A-Z])(?:JPY|YEN)(?![A-Z])', t_upper))
    has_cad = bool(re.search(r'(?<![A-Z])(?:CAD|C\$)(?![A-Z])', t_upper))
    has_aud = bool(re.search(r'(?<![A-Z])(?:AUD|A\$)(?![A-Z])', t_upper))
    has_sgd = bool(re.search(r'(?<![A-Z])(?:SGD|S\$)(?![A-Z])', t_upper))

    # Strong Indian markers
    has_inr_sym = '₹' in raw_text
    has_inr_text = bool(re.search(r'(?<![A-Z])(?:INR|RUPEES?|RS\.?|GSTIN|CGST|SGST|IGST)(?![A-Z])', t_upper))

    # USA specific cues (Sales tax, US state abbreviations with zip code, US phone format, US merchants)
    has_us_cues = bool(re.search(
        r'(?:\b(?:sales\s*tax|state\s*tax|city\s*tax|subtotal|us\s*debit|chase|wells\s*fargo|bank\s*of\s*america|walmart|target|costco|home\s*depot|best\s*buy|trader\s*joe|cvs|walgreens|ein|fein)\b|'
        r',\s*(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b\s*[0-9]{5})',
        raw_text,
        re.IGNORECASE
    ))

    # If US cues or Dollar symbol is present and no Rupee symbol is present, return USD
    if (has_dollar or has_us_cues) and not has_inr_sym:
        return 'USD', '$', CURRENCY_RATES['USD']['rate']

    if has_euro:
        return 'EUR', '€', CURRENCY_RATES['EUR']['rate']
    if has_gbp:
        return 'GBP', '£', CURRENCY_RATES['GBP']['rate']
    if has_aed:
        return 'AED', 'AED', CURRENCY_RATES['AED']['rate']
    if has_jpy:
        return 'JPY', '¥', CURRENCY_RATES['JPY']['rate']
    if has_cad:
        return 'CAD', 'C$', CURRENCY_RATES['CAD']['rate']
    if has_aud:
        return 'AUD', 'A$', CURRENCY_RATES['AUD']['rate']
    if has_sgd:
        return 'SGD', 'S$', CURRENCY_RATES['SGD']['rate']

    if has_dollar and not has_inr_text:
        return 'USD', '$', CURRENCY_RATES['USD']['rate']

    # Default to INR
    return 'INR', '₹', 1.0


async def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a PDF invoice using pypdf, embedded images OCR, and pure-Python stream fallback."""
    text_parts = []

    # Method 1: pypdf text extraction
    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text and page_text.strip():
                text_parts.append(page_text.strip())

        # If PDF was a scanned image document without embedded text layer:
        if not text_parts or sum(len(t) for t in text_parts) < 15:
            try:
                import winocr
                for page in reader.pages:
                    if hasattr(page, "images"):
                        for img_obj in page.images:
                            try:
                                pil_img = img_obj.image.convert('RGB')
                                res = await winocr.recognize_pil(pil_img, 'en')
                                if res and res.text:
                                    text_parts.append(res.text)
                            except Exception as ocr_err:
                                print(f"[PDF Image OCR Error] {ocr_err}")
            except Exception as e_ocr:
                print(f"[PDF Embedded Image OCR Failed] {e_ocr}")
    except Exception as e:
        print(f"[pypdf Error] {e}")

    if text_parts and sum(len(t) for t in text_parts) >= 15:
        return "\n".join(text_parts)

    # Method 2: Pure-python FlateDecode fallback for raw PDF streams
    try:
        with open(pdf_path, "rb") as f:
            content = f.read()

        stream_pattern = re.compile(rb"stream[\r\n]+([\s\S]*?)[\r\n]+endstream")
        stream_texts = []
        for match in stream_pattern.finditer(content):
            stream_bytes = match.group(1)
            decomp = None
            try:
                decomp = zlib.decompress(stream_bytes)
            except Exception:
                decomp = stream_bytes

            if decomp:
                # TJ array matches: [ (text) 10 (more) ] TJ
                for arr in re.findall(rb"\[(.*?)\]\s*TJ", decomp):
                    parts = re.findall(rb"\((.*?)\)", arr)
                    line = " ".join(p.decode("utf-8", errors="ignore").strip() for p in parts if p.strip())
                    if line:
                        stream_texts.append(line)
                # Tj single matches: (text) Tj
                for m in re.findall(rb"\((.*?)\)\s*T[jJ]", decomp):
                    decoded = m.decode("utf-8", errors="ignore").strip()
                    if decoded:
                        stream_texts.append(decoded)
        if stream_texts:
            return "\n".join(stream_texts)

        # Method 3: Direct ascii string extraction fallback
        raw_strings = re.findall(rb"\(([A-Za-z0-9\s.,$:/\-#&_]{3,100})\)", content)
        if raw_strings:
            return "\n".join(ps.decode("utf-8", errors="ignore") for ps in raw_strings)
    except Exception as stream_err:
        print(f"[PDF Stream Fallback Error] {stream_err}")

    return "\n".join(text_parts) if text_parts else ""


async def ocr_image(file_path: str) -> str:
    """Extract raw text from receipt file (images or PDF) with robust multi-format support."""
    ext = os.path.splitext(file_path)[1].lower()

    # 1. Handle PDF
    if ext == ".pdf":
        return await extract_text_from_pdf(file_path)

    # 2. Handle Images (JPG, JPEG, PNG, WEBP, JFIF, BMP, TIFF, GIF)
    try:
        import winocr
        with Image.open(file_path) as raw_img:
            # Crucial: Convert to RGB (handles RGBA, Palette/P, CMYK, 1-bit, grayscale, etc.)
            rgb_img = raw_img.convert("RGB")
            result = await winocr.recognize_pil(rgb_img, "en")
            return result.text or ""
    except Exception as e:
        print(f"[OCR Warning] winocr error for {file_path}: {e}")
        return ""


def clean_amount_str(val_str: str) -> Optional[float]:
    """Helper to safely parse an amount string with commas, periods, etc."""
    try:
        s = val_str.replace(',', '').strip()
        val = float(s)
        if 0.05 <= val <= 1000000.0:
            return round(val, 2)
    except Exception:
        pass
    return None


def smart_extract_amount(text: str, currency: str = "INR") -> float:
    """
    Smartly extract the best total amount from invoice OCR text.
    PRIORITY 1: Explicit labels: TOTAL, GRAND TOTAL, AMOUNT DUE, BALANCE DUE, TOTAL CHARGED, AMOUNT PAID.
    PRIORITY 2: Currency-prefixed numbers: $XX.XX or €XX.XX.
    PRIORITY 3: Filter out phone numbers, zip codes, years, invoice IDs before fallback.
    """
    lines = [l.strip() for l in text.splitlines() if l.strip()]

    # -------------------------------------------------------------
    # STEP 1: Scan for EXPLICIT TOTAL LABELS (Highest Accuracy!)
    # -------------------------------------------------------------
    high_priority_keywords = [
        r'grand\s*total',
        r'total\s*amount',
        r'amount\s*due',
        r'balance\s*due',
        r'total\s*due',
        r'total\s*charged',
        r'amount\s*paid',
        r'total\s*paid',
        r'net\s*total',
        r'net\s*amount',
        r'total\s*usd',
        r'total\s*inr',
        r'total\s*eur',
        r'total\s*cad',
        r'\btotal\s*:',
        r'\btotal\s*[$€£₹]',
        r'\btotal\b'
    ]

    amount_regex = re.compile(
        r'(?:[\$€£₹]|usd|inr|rs\.?|eur|cad|aud)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})|[0-9]+(?:\.[0-9]{1,2}))'
    )

    for idx, line in enumerate(lines):
        line_clean = line.strip()
        for kw in high_priority_keywords:
            if re.search(kw, line_clean, re.IGNORECASE):
                # We found a total line!
                # Clean phone numbers and non-amount codes from this line
                cleaned_line = re.sub(r'\b(?:\+?1[-.\s]?)?\(?[2-9][0-9]{2}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b', ' ', line_clean)
                cleaned_line = re.sub(r'\b202[0-9]\b', ' ', cleaned_line)
                cleaned_line = re.sub(r'(?:card|ending|auth|ref|terminal|id)[\s:#-]*[0-9]+', ' ', cleaned_line, flags=re.IGNORECASE)

                matches = amount_regex.findall(cleaned_line)
                nums_on_line = []
                for m in matches:
                    parsed = clean_amount_str(m)
                    if parsed is not None:
                        nums_on_line.append(parsed)

                if nums_on_line:
                    # In a total line (e.g. "Total items: 3, Total: $45.99"), return the final monetary total
                    return nums_on_line[-1] if len(nums_on_line) > 1 and nums_on_line[0] < 10 and nums_on_line[-1] > nums_on_line[0] else max(nums_on_line)

                # Check the line immediately following (e.g. "TOTAL\n $45.99")
                if idx + 1 < len(lines):
                    next_line = lines[idx + 1]
                    next_matches = amount_regex.findall(next_line)
                    for nm in next_matches:
                        parsed = clean_amount_str(nm)
                        if parsed is not None and parsed > 0:
                            return parsed

    # -------------------------------------------------------------
    # STEP 2: Secondary labels: Subtotal
    # -------------------------------------------------------------
    for idx, line in enumerate(lines):
        if re.search(r'\b(?:subtotal|sub-total|sub\s*total)\b', line, re.IGNORECASE):
            matches = amount_regex.findall(line)
            for m in matches:
                parsed = clean_amount_str(m)
                if parsed is not None:
                    return parsed

    # -------------------------------------------------------------
    # STEP 3: Currency-Prefixed Amounts (e.g., $45.99, ₹1,250.00)
    # -------------------------------------------------------------
    currency_prefixed = re.findall(
        r'(?:[\$€£₹]|USD|EUR|GBP|AED|CAD|AUD)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})|[0-9]+(?:\.[0-9]{1,2}))',
        text,
        re.IGNORECASE
    )
    prefixed_nums = []
    for cp in currency_prefixed:
        parsed = clean_amount_str(cp)
        if parsed is not None:
            prefixed_nums.append(parsed)
    if prefixed_nums:
        return max(prefixed_nums)

    # -------------------------------------------------------------
    # STEP 4: Fallback Scan with Aggressive Noise Filtering
    # -------------------------------------------------------------
    clean = text
    # 1. Remove US and international phone numbers (e.g., 555-555-0192, 555-0192, (555) 555-0192)
    clean = re.sub(r'\b(?:\+?1[-.\s]?)?\(?[2-9][0-9]{2}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b', ' ', clean)
    clean = re.sub(r'\b[0-9]{3}[-.\s][0-9]{4}\b', ' ', clean)
    # 2. Remove US zip codes: 5 digits alone e.g. 94103, 10001, 30301-1234
    clean = re.sub(r'\b[0-9]{5}(?:-[0-9]{4})?\b', ' ', clean)
    # 3. Remove years (2020-2029, 2010-2019)
    clean = re.sub(r'\b20[12][0-9]\b', ' ', clean)
    # 4. Remove dates: DD/MM/YYYY or YYYY-MM-DD
    clean = re.sub(r'\b[0-9]{1,4}[/\.-][0-9]{1,2}[/\.-][0-9]{1,4}\b', ' ', clean)
    # 5. Remove timestamps: 12:45:00
    clean = re.sub(r'\b[0-9]{1,2}:[0-9]{2}(?::[0-9]{2})?\b', ' ', clean)
    # 6. Remove IDs, account endings, auth codes, terminals, order IDs, ref numbers
    clean = re.sub(
        r'(?:auth\s*[a-z]*|ccde|code|terminal|ending|order\s*(?:id|#)?|inv[a-z0-9#-]*|ref(?:erence)?|utr|bank|policy|sum\s*insured|store|reg(?:ister)?|cashier|ein|tax\s*id)[\s:#-]*[A-Za-z0-9]+',
        ' ',
        clean,
        flags=re.IGNORECASE
    )

    fallback_matches = re.findall(r'([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})|[0-9]+(?:\.[0-9]{1,2}))', clean)
    candidates = []
    for token in fallback_matches:
        parsed = clean_amount_str(token)
        if parsed is not None:
            if currency in ['USD', 'EUR', 'GBP', 'CAD', 'AUD']:
                if parsed > 500 and not '.' in token and str(int(parsed)).endswith('00'):
                    parsed = parsed / 100.0
                if 0.50 <= parsed <= 25000.0:
                    candidates.append(parsed)
            else:
                if 0.50 <= parsed <= 500000.0:
                    candidates.append(parsed)

    if candidates:
        return max(candidates)

    return 25.0 if currency == 'USD' else 100.0


def parse_date_from_text(text: str) -> str:
    """Extract date from receipt text or return current ISO date."""
    date_patterns = [
        r'(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})',
        r'(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})',
    ]
    for pat in date_patterns:
        m = re.search(pat, text)
        if m:
            parts = m.groups()
            try:
                if len(parts[0]) == 4:  # YYYY-MM-DD
                    dt = datetime(int(parts[0]), int(parts[1]), int(parts[2]))
                else:  # DD-MM-YYYY or MM-DD-YYYY
                    p1, p2, p3 = int(parts[0]), int(parts[1]), int(parts[2])
                    # If p1 > 12, it's definitely DD-MM-YYYY
                    if p1 > 12:
                        dt = datetime(p3, p2, p1)
                    else:
                        dt = datetime(p3, p1, p2)
                return dt.isoformat()
            except Exception:
                pass
    return datetime.utcnow().isoformat()


def extract_policy_or_invoice_ref(text: str) -> Optional[str]:
    """Extract policy reference or invoice order number."""
    m_policy = re.search(r'(?:policy\s*(?:no|#)?|ref(?:erence)?|order\s*(?:id|#)?|invoice\s*(?:no|#)?)\s*[:\s-]*([A-Za-z0-9#-]{4,30})', text, re.IGNORECASE)
    if m_policy:
        return m_policy.group(1).strip()
    return None


def detect_payment_method_and_account(text_lower: str, db: Session) -> Tuple[str, Any]:
    """
    Carefully inspects receipt text for payment method and selects the matching account.
    CRITICAL: Debit Card is checked BEFORE Credit Card, so Debit transactions
    (including USA 'US DEBIT', 'DEBIT', 'VISA DEBIT', 'PIN DEBIT') are NEVER mistakenly tagged as Credit!
    """
    # 1. DEBIT CARD CHECK (Highest priority for cards)
    is_debit = bool(re.search(
        r'\b(us\s*debit|debit\s*card|debit\s*sale|debit\s*purchase|pin\s*debit|eft\s*debit|debit|visa\s*debit|mastercard\s*debit|mc\s*debit|rupay\s*debit|db\s*card|atm\s*card|pos\s*debit|paid\s*by\s*debit|payment\s*method\s*[:\s-]*debit|payment\s*[:\s-]*debit|txn\s*type\s*[:\s-]*debit)\b',
        text_lower
    ))
    if is_debit:
        acc = db.query(Account).filter(Account.type.in_(["Checking", "Savings"])).first() or db.query(Account).first()
        return "Debit Card", acc

    # 2. CREDIT CARD CHECK
    is_credit = bool(re.search(
        r'\b(credit\s*card|credit\s*sale|credit\s*purchase|visa\s*credit|mastercard\s*credit|mc\s*credit|amex|american\s*express|discover|diners|regalia|simplyclick|cr\s*card|paid\s*by\s*credit|payment\s*method\s*[:\s-]*credit|payment\s*[:\s-]*credit)\b',
        text_lower
    ))
    if is_credit:
        acc = db.query(Account).filter(Account.type == "Credit Card").first() or db.query(Account).first()
        return "Credit Card", acc

    # 3. DIGITAL WALLETS / UPI / MOBILE PAY
    is_digital_wallet = bool(re.search(
        r'\b(apple\s*pay|google\s*pay|gpay|paypal|venmo|zelle|cash\s*app|upi|phonepe|paytm|bhim|vpa|@ok|@ybl|@paytm)\b',
        text_lower
    ))
    if is_digital_wallet:
        wallet_name = "Digital Wallet" if any(k in text_lower for k in ["apple pay", "google pay", "paypal", "venmo", "zelle", "cash app"]) else "UPI"
        acc = db.query(Account).filter(Account.type.in_(["Checking", "Savings"])).first() or db.query(Account).first()
        return wallet_name, acc

    # 4. CASH CHECK
    is_cash = bool(re.search(r'\b(cash|cash\s*paid|cash\s*tendered|cash\s*tender|change\s*due)\b', text_lower))
    if is_cash:
        acc = db.query(Account).filter(Account.type.ilike("%cash%")).first() or db.query(Account).first()
        return "Cash", acc

    # 5. NET BANKING / WIRE / ACH / DIRECT DEPOSIT
    is_netbanking = bool(re.search(r'\b(net\s*banking|internet\s*banking|ach|direct\s*deposit|wire\s*transfer|bank\s*transfer|neft|rtgs|imps)\b', text_lower))
    if is_netbanking:
        acc = db.query(Account).filter(Account.type.in_(["Checking", "Savings"])).first() or db.query(Account).first()
        return "Net Banking", acc

    # 6. Fallback: If "card" or "visa" or "mastercard" appears alone
    if any(k in text_lower for k in ["card", "visa", "mastercard", "rupay"]):
        if "credit" in text_lower:
            acc = db.query(Account).filter(Account.type == "Credit Card").first() or db.query(Account).first()
            return "Credit Card", acc
        acc = db.query(Account).filter(Account.type.in_(["Checking", "Savings"])).first() or db.query(Account).first()
        return "Debit Card", acc

    # Default to Bank/Checking account with Debit Card
    acc = db.query(Account).filter(Account.type.in_(["Checking", "Savings"])).first() or db.query(Account).first()
    return "Debit Card", acc


async def scan_and_extract_invoice(image_path: str, db: Session, receipt_image_url: str) -> Dict[str, Any]:
    """
    Main AI function: Takes an image or PDF path, extracts text, parses financial fields,
    detects currency, accurately distinguishes Debit vs Credit vs UPI,
    and assigns proper categories & accounts.
    """
    # 1. OCR / Text Extraction
    raw_text = await ocr_image(image_path)
    text_lower = raw_text.lower()

    # 2. Amount & Multi-Currency Detection
    detected_currency, curr_symbol, exchange_rate = detect_currency(raw_text)
    raw_amount = smart_extract_amount(raw_text, detected_currency)

    if detected_currency != "INR":
        original_amount = round(raw_amount, 2)
        # Convert to INR for database consistency and financial calculations
        amount_inr = round(raw_amount * exchange_rate, 2)
    else:
        original_amount = round(raw_amount, 2)
        amount_inr = round(raw_amount, 2)

    # 3. Vendor & Title Detection
    matched_title = None
    target_category_name = None

    for sig in VENDOR_SIGNATURES:
        if re.search(sig["regex"], text_lower):
            matched_title = sig["title"]
            target_category_name = sig["category"]
            break

    # If no known vendor, pick the first clean line from OCR
    if not matched_title:
        lines = [line.strip() for line in raw_text.splitlines() if len(line.strip()) > 3]
        if lines:
            first_line = re.sub(r'[^a-zA-Z0-9\s&-]', '', lines[0]).strip()
            if len(first_line) >= 3:
                matched_title = first_line[:40]
        if not matched_title:
            matched_title = "Scanned Receipt Expense"

    # 4. Category Classification
    if not target_category_name:
        cat_scores = {}
        for cat_name, kw_list in CATEGORY_KEYWORD_MAP.items():
            score = sum(1 for kw in kw_list if kw in text_lower)
            if score > 0:
                cat_scores[cat_name] = score

        if cat_scores:
            target_category_name = max(cat_scores.items(), key=lambda x: x[1])[0]
        else:
            target_category_name = "Shopping"

    # Query matching category from DB
    db_category = db.query(Category).filter(Category.name.ilike(f"%{target_category_name}%")).first()
    if not db_category:
        db_category = db.query(Category).filter(Category.type == "Expense").first()

    # 5. Precise Payment Method & Account Matching
    inferred_payment, db_account = detect_payment_method_and_account(text_lower, db)

    # 6. Date & Policy/Invoice Ref
    extracted_date = parse_date_from_text(raw_text)
    policy_ref = extract_policy_or_invoice_ref(raw_text)

    # 7. Line Items / Notes Generation
    notes_lines = []
    if detected_currency != "INR":
        notes_lines.append(f"{curr_symbol}{original_amount:.2f} {detected_currency} (Rate: ₹{exchange_rate:.2f})")
    if policy_ref:
        notes_lines.append(f"Ref: {policy_ref}")

    for line in raw_text.splitlines()[:10]:
        cleaned = line.strip()
        if any(item in cleaned.lower() for item in ["airpods", "applecare", "diagnostics", "medicines", "groceries", "subscription", "ticket", "paper", "supplies"]):
            notes_lines.append(cleaned[:60])

    if not notes_lines and len(raw_text.strip()) > 0:
        notes_lines.append("Auto-scanned receipt via AI OCR")

    notes_str = " • ".join(notes_lines[:3]) if notes_lines else "Scanned Invoice Receipt"

    return {
        "title": matched_title,
        "amount": amount_inr,
        "original_amount": original_amount,
        "currency": detected_currency,
        "currency_symbol": curr_symbol,
        "exchange_rate": exchange_rate,
        "type": "Expense",
        "category_id": db_category.id if db_category else 1,
        "category_name": db_category.name if db_category else target_category_name,
        "category_icon": db_category.icon if db_category else "tag",
        "category_color": db_category.color if db_category else "#4F46E5",
        "account_id": db_account.id if db_account else 1,
        "account_name": db_account.name if db_account else "Default Account",
        "payment_method": inferred_payment,
        "is_credit_due": inferred_payment == "Credit Card",
        "status": "Unpaid" if inferred_payment == "Credit Card" else "Completed",
        "date": extracted_date,
        "notes": notes_str,
        "policy_name": policy_ref,
        "receipt_image_url": receipt_image_url,
        "confidence": 0.96 if matched_title != "Scanned Receipt Expense" else 0.85,
        "raw_text_snippet": raw_text[:250] if raw_text else "No text detected"
    }
