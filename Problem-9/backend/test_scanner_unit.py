import asyncio
from app.services.invoice_scanner import detect_currency, smart_extract_amount, ocr_image

def test_usa_receipt():
    sample_usa_text = """
    DUNDER MIFFLIN PAPER CO.
    1725 Slough Avenue, Scranton, PA 18504
    Tel: (555) 555-0192
    Date: 10/14/2024  Time: 14:22
    Invoice #: INV-98421
    Cashier: Dwight S.

    Ream of 20lb Paper         $12.50
    Desk Organizers            $24.99
    Subtotal                   $37.49
    Sales Tax (6.0%)            $2.25
    TOTAL                      $39.74

    PAYMENT METHOD: US DEBIT
    Card Ending: 4412
    Auth Code: 098124
    Status: Approved
    """
    curr, sym, rate = detect_currency(sample_usa_text)
    amt = smart_extract_amount(sample_usa_text, curr)
    print(f"USA Receipt Test: Currency={curr} ({sym}), Amount={amt}")
    assert curr == "USD", f"Expected USD, got {curr}"
    assert amt == 39.74, f"Expected 39.74, got {amt}"
    print("✓ USA Receipt test passed!")

def test_usa_receipt_with_comma():
    sample_text = """
    APPLE STORE #R102
    SAN FRANCISCO, CA 94103
    Order ID: W10294821
    1x MacBook Pro 14"         $1,999.00
    1x AppleCare+               $279.00
    Subtotal:                 $2,278.00
    Sales Tax:                  $193.63
    GRAND TOTAL:              $2,471.63
    VISA DEBIT
    """
    curr, sym, rate = detect_currency(sample_text)
    amt = smart_extract_amount(sample_text, curr)
    print(f"Apple Store USA Test: Currency={curr}, Amount={amt}")
    assert curr == "USD", f"Expected USD, got {curr}"
    assert amt == 2471.63, f"Expected 2471.63, got {amt}"
    print("✓ Apple Store USA test passed!")

def test_indian_receipt():
    sample_inr_text = """
    STAR HEALTH AND ALLIED INSURANCE CO. LTD.
    GSTIN: 33AABCS1234F1Z5
    Policy No: 01/2024/091283
    Gross Premium: Rs. 14,000.00
    CGST 9%: Rs. 1,260.00
    SGST 9%: Rs. 1,260.00
    TOTAL AMOUNT DUE: Rs. 16,520.00
    Payment Method: Net Banking
    """
    curr, sym, rate = detect_currency(sample_inr_text)
    amt = smart_extract_amount(sample_inr_text, curr)
    print(f"Indian Receipt Test: Currency={curr} ({sym}), Amount={amt}")
    assert curr == "INR", f"Expected INR, got {curr}"
    assert amt == 16520.0, f"Expected 16520.0, got {amt}"
    print("✓ Indian Receipt test passed!")

def test_paper_phone_receipt():
    # Exactly simulating user's receipt where phone number was 555-555-0192 or 555 5550192
    sample_text = """
    Paper M 555 5550192
    Office Supplies Store
    CA 90210
    Item 1: Notebook $4.50
    Item 2: Pen Set $8.00
    TOTAL: $12.50
    """
    curr, sym, rate = detect_currency(sample_text)
    amt = smart_extract_amount(sample_text, curr)
    print(f"Paper M Test: Currency={curr}, Amount={amt}")
    assert amt == 12.50, f"Expected 12.50, got {amt}"
    assert curr == "USD", f"Expected USD, got {curr}"
    print("✓ Paper M test passed!")

def test_bundled_receipt_ocr_amount():
    import os
    path = os.path.join(os.path.dirname(__file__), "uploads", "sample_usd_debit_receipt.png")
    if not os.path.exists(path):
        return
    text = asyncio.run(ocr_image(path))
    assert smart_extract_amount(text, "USD") == 49.0
    print("✓ Bundled USD receipt OCR amount test passed!")

if __name__ == "__main__":
    test_usa_receipt()
    test_usa_receipt_with_comma()
    test_indian_receipt()
    test_paper_phone_receipt()
    test_bundled_receipt_ocr_amount()
    print("\nALL UNIT TESTS PASSED!")
