import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../pos/repositories/transaction_repository.dart';

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

  @override
  Widget build(BuildContext context) {
    final tx = widget.transaction;
    final status = tx['status'] ?? 'UNKNOWN';
    final items = (tx['transactionItems'] as List<dynamic>?) ?? [];

    // Calculate totals if not present or just use from map
    // Items structure usually: { product: { name: ... }, quantity: ..., subtotal: ... } or flat
    // Based on API: transactions include transactionItems. transactionItems include product.

    return Scaffold(
      appBar: AppBar(title: const Text('Detail Transaksi'), centerTitle: true),
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
