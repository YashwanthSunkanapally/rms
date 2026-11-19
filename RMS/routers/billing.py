"""
RESTO DADDY - Billing, Payments & Invoicing Router
Split bill calculations, GST tax invoice receipts, and ReportLab PDF downloads.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from database import query_all, query_one
from services.pdf_service import generate_invoice_pdf
from typing import Dict, Any

router = APIRouter(prefix="/api/billing", tags=["Billing"])

@router.get("/invoices")
def list_invoices(limit: int = 50):
    orders = query_all("""
        SELECT id, order_number, order_type, table_number, customer_name,
               subtotal, gst_amount, discount_amount, grand_total, payment_status,
               payment_method, created_at
        FROM orders
        WHERE payment_status = 'paid'
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))
    return orders

@router.post("/split-calculator")
def calculate_split_bill(grand_total: float, split_count: int) -> Dict[str, Any]:
    if split_count <= 0:
        raise HTTPException(status_code=400, detail="Split count must be at least 1")
    
    per_person = round(grand_total / split_count, 2)
    remainder = round(grand_total - (per_person * split_count), 2)

    splits = []
    for i in range(1, split_count + 1):
        amount = per_person + (remainder if i == 1 else 0.0)
        splits.append({
            "guest_number": i,
            "label": f"Guest {i}",
            "amount": round(amount, 2),
            "status": "unpaid"
        })

    return {
        "grand_total": grand_total,
        "split_count": split_count,
        "splits": splits
    }

@router.get("/invoice/{order_id}/pdf")
def download_invoice_pdf(order_id: str):
    try:
        pdf_buffer = generate_invoice_pdf(order_id)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=invoice_{order_id[:8]}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
