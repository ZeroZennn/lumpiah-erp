import 'dart:io';
import 'dart:typed_data';

import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:share_plus/share_plus.dart';

/// Service for generating and sharing digital receipts (PDF & Text)
class DigitalReceiptService {
  // Singleton instance
  static final DigitalReceiptService _instance =
      DigitalReceiptService._internal();
  factory DigitalReceiptService() => _instance;
  DigitalReceiptService._internal();

  /// Generate PDF Receipt
  ///
  /// Returns the PDF bytes as Uint8List
  Future<Uint8List> generatePdfReceipt({
    required Map<String, dynamic> transactionData,
    required List<Map<String, dynamic>> items,
  }) async {
    final pdf = pw.Document();

    // Formatters
    final currencyFormatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );
    final dateFormatter = DateFormat('dd MMM yyyy, HH:mm');

    // Data extraction
    final date = transactionData['date'] as DateTime? ?? DateTime.now();
    final branchName = transactionData['branchName'] ?? 'Cabang Utama';
    final totalAmount = transactionData['totalAmount'] ?? 0.0;
    final paymentMethod = transactionData['paymentMethod'] ?? 'CASH';
    final cashReceived = transactionData['cashReceived'] ?? 0.0;
    final change = transactionData['change'] ?? 0.0;
    final transactionId =
        transactionData['transactionId'] ??
        'TRX-${DateTime.now().millisecondsSinceEpoch}';

    // Build PDF
    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.roll80,
        margin: const pw.EdgeInsets.all(16),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.center,
            children: [
              // ================= HEADER =================
              pw.Text(
                'LUMPIA SEMARANG',
                style: pw.TextStyle(
                  fontSize: 18,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
              pw.SizedBox(height: 4),
              pw.Text(branchName, style: const pw.TextStyle(fontSize: 12)),
              pw.SizedBox(height: 4),
              pw.Text(
                dateFormatter.format(date),
                style: const pw.TextStyle(
                  fontSize: 10,
                  color: PdfColors.grey700,
                ),
              ),
              pw.Text(
                'ID: $transactionId',
                style: const pw.TextStyle(
                  fontSize: 10,
                  color: PdfColors.grey700,
                ),
              ),
              pw.Divider(thickness: 0.5),
              pw.SizedBox(height: 8),

              // ================= BODY (ITEMS) =================
              pw.Column(
                children: items.map((item) {
                  final qty = item['quantity'] ?? 0;
                  final name = item['productName'] ?? 'Unknown';
                  final price = item['price'] ?? 0.0;
                  final subtotal = qty * price;

                  return pw.Padding(
                    padding: const pw.EdgeInsets.symmetric(vertical: 2),
                    child: pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Expanded(
                          flex: 2,
                          child: pw.Text(
                            '$qty x $name',
                            style: const pw.TextStyle(fontSize: 10),
                          ),
                        ),
                        pw.Text(
                          currencyFormatter.format(subtotal),
                          style: const pw.TextStyle(fontSize: 10),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
              pw.SizedBox(height: 8),
              pw.Divider(thickness: 0.5),
              pw.SizedBox(height: 8),

              // ================= FOOTER =================
              // Total
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text(
                    'TOTAL',
                    style: pw.TextStyle(
                      fontWeight: pw.FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                  pw.Text(
                    currencyFormatter.format(totalAmount),
                    style: pw.TextStyle(
                      fontWeight: pw.FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              pw.SizedBox(height: 4),

              // Payment Method
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text(
                    'Metode Bayar',
                    style: const pw.TextStyle(fontSize: 10),
                  ),
                  pw.Text(
                    paymentMethod,
                    style: const pw.TextStyle(fontSize: 10),
                  ),
                ],
              ),

              // Cash Details (if Cash)
              if (paymentMethod == 'CASH') ...[
                pw.SizedBox(height: 2),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Tunai', style: const pw.TextStyle(fontSize: 10)),
                    pw.Text(
                      currencyFormatter.format(cashReceived),
                      style: const pw.TextStyle(fontSize: 10),
                    ),
                  ],
                ),
                pw.SizedBox(height: 2),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text(
                      'Kembalian',
                      style: const pw.TextStyle(fontSize: 10),
                    ),
                    pw.Text(
                      currencyFormatter.format(change),
                      style: const pw.TextStyle(fontSize: 10),
                    ),
                  ],
                ),
              ],

              pw.SizedBox(height: 16),
              pw.Text(
                'Terima Kasih',
                style: pw.TextStyle(
                  fontWeight: pw.FontWeight.bold,
                  fontSize: 12,
                ),
              ),
              pw.Text(
                'Simpan struk ini sebagai bukti pembayaran',
                style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey),
                textAlign: pw.TextAlign.center,
              ),
            ],
          );
        },
      ),
    );

    return pdf.save();
  }

  /// Save PDF bytes to file and open share dialog
  Future<void> sharePdf(Uint8List pdfBytes, String transactionId) async {
    try {
      final directory = await getTemporaryDirectory();
      final fileName = 'struk_$transactionId.pdf';
      final file = File('${directory.path}/$fileName');

      await file.writeAsBytes(pdfBytes);

      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'Struk Belanja - $transactionId',
        subject: 'Struk Belanja',
      );
    } catch (e) {
      throw Exception('Failed to share PDF: $e');
    }
  }

  /// Generate WhatsApp formatted text receipt
  String generateWhatsAppText({
    required Map<String, dynamic> transactionData,
    required List<Map<String, dynamic>> items,
  }) {
    final currencyFormatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );
    final dateFormatter = DateFormat('dd/MM/yyyy HH:mm');

    final date = transactionData['date'] as DateTime? ?? DateTime.now();
    final branchName = transactionData['branchName'] ?? 'Cabang Utama';
    final totalAmount = transactionData['totalAmount'] ?? 0.0;
    final transactionId = transactionData['transactionId'] ?? '-';

    final buffer = StringBuffer();
    buffer.writeln('*LUMPIA SEMARANG*');
    buffer.writeln('Cabang: $branchName');
    buffer.writeln('Tanggal: ${dateFormatter.format(date)}');
    buffer.writeln('ID: $transactionId');
    buffer.writeln('--------------------------------');

    for (final item in items) {
      final qty = item['quantity'] ?? 0;
      final name = item['productName'] ?? 'Unknown';
      final price = item['price'] ?? 0.0;
      final subtotal = qty * price;

      buffer.writeln('$qty x $name @ ${currencyFormatter.format(price)}');
      buffer.writeln('   = ${currencyFormatter.format(subtotal)}');
    }

    buffer.writeln('--------------------------------');
    buffer.writeln('*TOTAL: ${currencyFormatter.format(totalAmount)}*');
    buffer.writeln('Terima Kasih!');

    return buffer.toString();
  }

  /// Generate simple text receipt
  String generateReceiptText({
    required Map<String, dynamic> transactionData,
    required List<Map<String, dynamic>> items,
  }) {
    final currencyFormatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );
    final dateFormatter = DateFormat('dd/MM/yyyy HH:mm');

    final date = transactionData['date'] as DateTime? ?? DateTime.now();
    final branchName = transactionData['branchName'] ?? 'Cabang Utama';
    final totalAmount = transactionData['totalAmount'] ?? 0.0;
    final transactionId = transactionData['transactionId'] ?? '-';
    final paymentMethod = transactionData['paymentMethod'] ?? 'CASH';

    final buffer = StringBuffer();
    buffer.writeln('--- STRUK PEMBELIAN ---');
    buffer.writeln('Toko: $branchName');
    buffer.writeln('Tanggal: ${dateFormatter.format(date)}');
    buffer.writeln('ID: $transactionId');
    buffer.writeln('--- ITEM ---');

    for (final item in items) {
      final qty = item['quantity'] ?? 0;
      final name = item['productName'] ?? 'Unknown';
      final subtotal = (qty * (item['price'] ?? 0));
      buffer.writeln('$name x$qty = ${currencyFormatter.format(subtotal)}');
    }

    buffer.writeln('--- TOTAL ---');
    buffer.writeln('Total: ${currencyFormatter.format(totalAmount)}');
    buffer.writeln('Pembayaran: $paymentMethod');
    buffer.writeln('Terima Kasih!');

    return buffer.toString();
  }
}
