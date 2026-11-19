"""
RESTO DADDY - Reports & Analytics Router
Exportable CSV data, executive summaries, and top-selling item analytics.
"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse, PlainTextResponse
from database import query_all
from services.pdf_service import generate_sales_summary_pdf
import io
import csv

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/best-sellers")
def get_best_sellers():
    items = query_all("""
        SELECT oi.name, SUM(oi.quantity) as total_qty, SUM(oi.price * oi.quantity) as total_sales
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.payment_status = 'paid'
        GROUP BY oi.name
        ORDER BY total_qty DESC
        LIMIT 10
    """)
    return items

@router.get("/export/csv")
def export_orders_csv():
    orders = query_all("SELECT * FROM orders ORDER BY created_at DESC")
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Order Number", "Order Type", "Table", "Customer Name", "Phone",
        "Waiter", "Status", "Payment Status", "Payment Method",
        "Subtotal (INR)", "GST (INR)", "Discount (INR)", "Grand Total (INR)", "Created At"
    ])

    for o in orders:
        writer.writerow([
            o["order_number"], o["order_type"], o["table_number"] or "",
            o["customer_name"] or "", o["customer_phone"] or "",
            o["waiter_name"] or "", o["status"], o["payment_status"], o["payment_method"],
            f"{o['subtotal']:.2f}", f"{o['gst_amount']:.2f}", f"{o['discount_amount']:.2f}",
            f"{o['grand_total']:.2f}", o["created_at"]
        ])

    output.seek(0)
    return PlainTextResponse(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=resto_daddy_sales_report.csv"}
    )

@router.get("/export/pdf")
def export_sales_summary_pdf():
    pdf_buffer = generate_sales_summary_pdf()
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=resto_daddy_executive_report.pdf"}
    )
