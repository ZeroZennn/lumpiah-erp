import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../pos/repositories/transaction_repository.dart';
import '../../../../core/services/printer_service.dart';
import '../../../../core/services/digital_receipt_service.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

class TransactionDetailScreen extends StatefulWidget {
  final Map<String, dynamic> transaction;

  const TransactionDetailScreen({super.key, required this.transaction});

  @override
  State<TransactionDetailScreen> createState() =>
      _TransactionDetailScreenState();
}

class _TransactionDetailScreenState extends State<TransactionDetailScreen> {
  final TransactionRepository _repository = TransactionRepository();
  bool _isLoading = false;

  // Format currency helper
  String _formatCurrency(dynamic amount) {
    // Handle both int (from quantity) and double or String
    double numericAmount = 0;
    if (amount is int || amount is double) {
      numericAmount = amount.toDouble();
    } else if (amount is String) {
      numericAmount = double.tryParse(amount) ?? 0;
    }

    final format = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp',
      decimalDigits: 0,
    );
    return format.format(numericAmount);
  }

  // Format date helper
  String _formatDate(String isoString) {
    final date = DateTime.parse(isoString).toLocal();
    return DateFormat('dd MMM yyyy, HH:mm').format(date);
  }

  void _showVoidDialog() {
    final usernameController = TextEditingController();
    final passwordController = TextEditingController();
    final reasonController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Batalkan Transaksi (VOID)'),
          content: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Masukkan kredensial Admin untuk membatalkan transaksi ini.',
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: usernameController,
                    decoration: const InputDecoration(
                      labelText: 'Admin Email/Username',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) => value == null || value.isEmpty
                        ? 'Harap isi username'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: passwordController,
                    decoration: const InputDecoration(
                      labelText: 'Admin Password',
                      border: OutlineInputBorder(),
                    ),
                    obscureText: true,
                    validator: (value) => value == null || value.isEmpty
                        ? 'Harap isi password'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: reasonController,
                    decoration: const InputDecoration(
                      labelText: 'Alasan Pembatalan',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 2,
                    validator: (value) => value == null || value.isEmpty
                        ? 'Harap isi alasan'
                        : null,
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Batal'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
              onPressed: () async {
                if (formKey.currentState!.validate()) {
                  // Close dialog first or handle inside?
                  // Usually better to show loading state inside dialog or close and show loading overlay.
                  // Req says: "On Submit: Call... Show Loading..."
                  // I'll close dialog then show loading overlay or set state.
                  // Let's keep dialog open but disabled? simpler is to pop and show loading indicator on screen or use a stateful dialog.
                  // I will pop and run a method that shows a loading indicator.

                  // Capture values before pop
                  final username = usernameController.text;
                  final password = passwordController.text;
                  final reason = reasonController.text;

                  Navigator.pop(context); // Close dialog
                  _processVoid(username, password, reason);
                }
              },
              child: const Text('Proses Void'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _processVoid(
    String username,
    String password,
    String reason,
  ) async {
    setState(() => _isLoading = true);

    try {
      final success = await _repository.voidTransaction(
        transactionId: widget.transaction['id'],
        adminUsername: username,
        adminPassword: password,
        reason: reason,
      );

      if (success) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Transaksi berhasil dibatalkan (VOID).'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true); // Return true to refresh history
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleReprint() async {
    setState(() => _isLoading = true);
    try {
      final tx = widget.transaction;
      // Convert Transaction items to format expected by PrinterService
      final items = (tx['transactionItems'] as List<dynamic>).map((item) {
        return {
          'quantity': item['quantity'],
          'productName': item['product']['name'],
          'price': item['priceAtTransaction'],
        };
      }).toList();

      final transactionData = {
        'branchName': tx['branch']?['name'] ?? 'Cabang Utama',
        'date': DateTime.parse(tx['transactionDate']).toLocal(),
        'totalAmount': tx['totalAmount'],
        'paymentMethod': tx['paymentMethod'],
        'cashReceived': tx['cashReceived'],
        'change': tx['changeAmount'],
      };

      await PrinterService().printReceipt(
        transactionData: transactionData,
        items: items.cast<Map<String, dynamic>>(),
        isReprint: true,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Struk berhasil dicetak ulang'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Gagal mencetak struk: Pastikan printer terhubung'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleShare() async {
    print('Share button clicked'); // Debug print
    final tx = widget.transaction;

    // Convert Items
    final rawItems = (tx['transactionItems'] as List<dynamic>?) ?? [];
    final items = rawItems.map((item) {
      return {
        'quantity': item['quantity'],
        'productName': item['product']?['name'] ?? 'Unknown',
        'price':
            double.tryParse((item['priceAtTransaction'] ?? 0).toString()) ?? 0,
      };
    }).toList();

    // Convert Transaction Data
    final transactionData = {
      'transactionId': tx['id'],
      'branchName': tx['branch']?['name'] ?? 'Cabang Utama',
      'date': DateTime.parse(tx['transactionDate']).toLocal(),
      'totalAmount': double.tryParse(tx['totalAmount'].toString()) ?? 0,
      'paymentMethod': tx['paymentMethod'],
      'cashReceived':
          double.tryParse((tx['cashReceived'] ?? 0).toString()) ?? 0,
      'change': double.tryParse((tx['changeAmount'] ?? 0).toString()) ?? 0,
    };

    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Bagikan Struk',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.picture_as_pdf, color: Colors.red),
              title: const Text('Kirim PDF'),
              onTap: () async {
                Navigator.pop(context); // Close bottom sheet
                _handleSharePdf(transactionData, items);
              },
            ),
            ListTile(
              leading: const Icon(Icons.chat, color: Colors.green),
              title: const Text('Kirim WhatsApp'),
              onTap: () {
                Navigator.pop(context); // Close bottom sheet
                _showWhatsAppDialog(transactionData, items);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleSharePdf(
    Map<String, dynamic> transactionData,
    List<Map<String, dynamic>> items,
  ) async {
    print('DEBUG: Share PDF clicked');
    // Show loading indicator
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      print('DEBUG: Generating PDF...');
      final pdfBytes = await DigitalReceiptService().generatePdfReceipt(
        transactionData: transactionData,
        items: items,
      );

      print('DEBUG: Sharing PDF...');
      await DigitalReceiptService().sharePdf(
        pdfBytes,
        transactionData['transactionId'].toString(),
      );

      // Dismiss loading before sharing
      if (mounted) Navigator.pop(context);
    } catch (e) {
      // Ensure loading is dismissed on error
      if (mounted && Navigator.canPop(context)) {
        Navigator.pop(context);
      }

      print('DEBUG ERROR: $e');
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error sharing PDF: $e')));
      }
    }
  }

  void _showWhatsAppDialog(
    Map<String, dynamic> transactionData,
    List<Map<String, dynamic>> items,
  ) {
    final phoneController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Kirim ke WhatsApp'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Masukkan nomor WhatsApp tujuan (contoh: 08123456789).',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Nomor WhatsApp',
                border: OutlineInputBorder(),
                prefixText: '+62 ',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () async {
              final phone = phoneController.text.trim();
              if (phone.isEmpty) return;

              // Format number: remove leading 0 if present
              final formattedPhone = phone.startsWith('0')
                  ? phone.substring(1)
                  : phone;
              final fullPhone = '62$formattedPhone';

              final message = DigitalReceiptService().generateReceiptText(
                transactionData: transactionData,
                items: items,
              );

              final url = Uri.parse(
                'https://wa.me/$fullPhone?text=${Uri.encodeComponent(message)}',
              );

              Navigator.pop(context); // Close dialog

              try {
                if (await canLaunchUrl(url)) {
                  await launchUrl(url, mode: LaunchMode.externalApplication);
                } else {
                  throw 'Could not launch WhatsApp';
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error launching WhatsApp: $e')),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
            child: const Text('Kirim'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tx = widget.transaction;
    final status = tx['status'] ?? 'UNKNOWN';
    final items = (tx['transactionItems'] as List<dynamic>?) ?? [];

    // Calculate totals if not present or just use from map
    // Items structure usually: { product: { name: ... }, quantity: ..., subtotal: ... } or flat
    // Based on API: transactions include transactionItems. transactionItems include product.

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detail Transaksi'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            tooltip: 'Bagikan Struk',
            onPressed: status == 'PAID' ? _handleShare : null,
          ),
          IconButton(
            icon: const Icon(Icons.print),
            tooltip: 'Cetak Ulang Struk',
            onPressed: status == 'PAID' ? _handleReprint : null,
          ),
        ],
      ),
      body: Stack(
        children: [
          Column(
            children: [
              // 1. Header
              Container(
                padding: const EdgeInsets.all(16),
                color: Colors.grey[100],
                width: double.infinity,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'ID: ${tx['id']}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatDate(tx['transactionDate']),
                      style: TextStyle(color: Colors.grey[700]),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Text('Status: '),
                        Chip(
                          label: Text(
                            status,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          backgroundColor: status == 'PAID'
                              ? Colors.green
                              : (status == 'VOID' ? Colors.red : Colors.grey),
                          visualDensity: VisualDensity.compact,
                        ),
                      ],
                    ),
                    if (status == 'VOID' && tx['voidReason'] != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8.0),
                        child: Text(
                          'Alasan Void: ${tx['voidReason']}',
                          style: const TextStyle(
                            color: Colors.red,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              const Divider(height: 1),

              // 2. List of Items
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  itemBuilder: (context, index) {
                    final item = items[index];
                    final productName =
                        item['product']?['name'] ?? 'Unknown Product';
                    final qty = item['quantity'] ?? 0;
                    final price = item['priceAtTransaction'] ?? 0;
                    final subtotal = item['subtotal'] ?? 0;

                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 4,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  productName,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                Text(
                                  '$qty x ${_formatCurrency(price)}',
                                  style: const TextStyle(
                                    color: Colors.grey,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            flex: 2,
                            child: Text(
                              _formatCurrency(subtotal),
                              textAlign: TextAlign.right,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),

              const Divider(height: 1),

              // 3. Footer
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -5),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Metode Pembayaran'),
                        Text(tx['paymentMethod'] ?? '-'),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          _formatCurrency(tx['totalAmount']),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // VOID Button
                    if (status == 'PAID')
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _showVoidDialog,
                          icon: const Icon(Icons.cancel_presentation),
                          label: const Text('BATALKAN TRANSAKSI (VOID)'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),

          // Loading Overlay
          if (_isLoading)
            Container(
              color: Colors.black.withOpacity(0.5),
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}
