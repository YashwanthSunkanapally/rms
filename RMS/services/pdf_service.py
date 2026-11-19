"""
RESTO DADDY - PDF Generation Service (GST Invoices & Sales Reports)
Generates high-fidelity PDF receipts and daily executive sales summaries using ReportLab.
"""

import io
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from database import query_one, query_all

def generate_invoice_pdf(order_id: str) -> io.BytesIO:
    order = query_one("SELECT * FROM orders WHERE id = ?", (order_id,))
    if not order:
        raise ValueError("Order not found")

    items = query_all("SELECT * FROM order_items WHERE order_id = ?", (order_id,))
    restaurant_name = query_one("SELECT value FROM settings WHERE key = 'restaurant_name'")
    restaurant_name = restaurant_name["value"] if restaurant_name else "Spicehollic"
    gstin = query_one("SELECT value FROM settings WHERE key = 'gstin'")
    gstin = gstin["value"] if gstin else "07AAAAA0000A1Z5"
    address = query_one("SELECT value FROM settings WHERE key = 'restaurant_address'")
    address = address["value"] if address else "Plot 42, Gourmet Boulevard, Connaught Place, New Delhi"

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    elements = []
    styles = getSampleStyleSheet()

    # Brand Title
    title_style = ParagraphStyle(
        'BrandTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#EA580C'),
        alignment=1,
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#64748B'),
        alignment=1,
        spaceAfter=15
    )

    elements.append(Paragraph(f"<b>{restaurant_name.upper()}</b>", title_style))
    elements.append(Paragraph(f"{address}<br/>GSTIN: {gstin} • Tel: +91 98765 43210", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#EA580C'), spaceAfter=15))

    # Meta Info Table
    meta_data = [
        [
            Paragraph(f"<b>Invoice #:</b> {order['order_number']}", styles['Normal']),
            Paragraph(f"<b>Date:</b> {order['created_at'][:16].replace('T', ' ')}", styles['Normal'])
        ],
        [
            Paragraph(f"<b>Table/Type:</b> {order['table_number'] or order['order_type'].upper()}", styles['Normal']),
            Paragraph(f"<b>Customer:</b> {order['customer_name'] or 'Guest'}", styles['Normal'])
        ],
        [
            Paragraph(f"<b>Server:</b> {order['waiter_name'] or 'Staff'}", styles['Normal']),
            Paragraph(f"<b>Payment:</b> {order['payment_method'].upper()} ({order['payment_status'].upper()})", styles['Normal'])
        ]
    ]
    meta_table = Table(meta_data, colWidths=[260, 260])
    meta_table.setStyle(TableStyle([
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#1E293B')),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 15))

    # Order Items Table
    headers = [Paragraph("<b>Item Description</b>", styles['Normal']),
               Paragraph("<b>Qty</b>", styles['Normal']),
               Paragraph("<b>Price (INR)</b>", styles['Normal']),
               Paragraph("<b>Total (INR)</b>", styles['Normal'])]
    table_data = [headers]

    for item in items:
        item_total = item['price'] * item['quantity']
        table_data.append([
            Paragraph(f"{item['name']}{'<br/><font size=8 color=gray>' + item['customizations'] + '</font>' if item['customizations'] else ''}", styles['Normal']),
            str(item['quantity']),
            f"{item['price']:.2f}",
            f"{item_total:.2f}"
        ])

    cgst = order['gst_amount'] / 2.0
    sgst = order['gst_amount'] / 2.0

    table_data.append(["", "", Paragraph("<b>Subtotal:</b>", styles['Normal']), f"{order['subtotal']:.2f}"])
    table_data.append(["", "", Paragraph("CGST (2.5%):", styles['Normal']), f"{cgst:.2f}"])
    table_data.append(["", "", Paragraph("SGST (2.5%):", styles['Normal']), f"{sgst:.2f}"])
    if order['discount_amount'] > 0:
        table_data.append(["", "", Paragraph("Discount:", styles['Normal']), f"-{order['discount_amount']:.2f}"])
    table_data.append(["", "", Paragraph("<b>GRAND TOTAL:</b>", styles['Normal']), Paragraph(f"<b>INR {order['grand_total']:.2f}</b>", styles['Normal'])])

    item_table = Table(table_data, colWidths=[280, 50, 95, 95])
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('GRID', (0,0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (2, -1), (-1, -1), colors.HexColor('#FFF7ED')),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('ALIGN', (2,0), (-1,-1), 'RIGHT'),
        ('ALIGN', (3,0), (-1,-1), 'RIGHT'),
    ]))
    elements.append(item_table)
    elements.append(Spacer(1, 25))

    footer_text = Paragraph(
        "<b>Thank you for dining with SPICEHOLLIC!</b><br/>"
        "FSSAI Lic No: 13322000000123 • GST Registered<br/>"
        "For catering & party reservations, visit spicehollic.com",
        subtitle_style
    )
    elements.append(footer_text)

    doc.build(elements)
    buffer.seek(0)
    return buffer

def generate_sales_summary_pdf() -> io.BytesIO:
    orders = query_all("SELECT * FROM orders WHERE payment_status = 'paid' ORDER BY created_at DESC LIMIT 50")
    total_sales = sum(o["grand_total"] for o in orders)
    total_gst = sum(o["gst_amount"] for o in orders)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = []
    styles = getSampleStyleSheet()

    elements.append(Paragraph("<b>SPICEHOLLIC - EXECUTIVE SALES REPORT</b>", styles['Heading1']))
    elements.append(Paragraph(f"Generated on {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    elements.append(Spacer(1, 15))

    elements.append(Paragraph(f"<b>Total Settled Orders:</b> {len(orders)} | <b>Total Revenue:</b> INR {total_sales:,.2f} | <b>Total GST Collected:</b> INR {total_gst:,.2f}", styles['Normal']))
    elements.append(Spacer(1, 15))

    headers = [Paragraph("<b>Order #</b>", styles['Normal']),
               Paragraph("<b>Type</b>", styles['Normal']),
               Paragraph("<b>Customer</b>", styles['Normal']),
               Paragraph("<b>Time</b>", styles['Normal']),
               Paragraph("<b>Total (INR)</b>", styles['Normal'])]
    rows = [headers]

    for o in orders[:25]:
        rows.append([
            o["order_number"],
            o["order_type"].upper(),
            o["customer_name"] or "Guest",
            o["created_at"][11:16],
            f"{o['grand_total']:.2f}"
        ])

    table = Table(rows, colWidths=[90, 80, 150, 80, 120])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    return buffer
