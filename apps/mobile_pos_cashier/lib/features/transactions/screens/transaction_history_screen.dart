import 'package:flutter/material.dart';
import '../../pos/repositories/transaction_repository.dart';
import 'package:intl/intl.dart';
import 'transaction_detail_screen.dart';

class TransactionHistoryScreen extends StatefulWidget {
  const TransactionHistoryScreen({super.key});

  @override
  State<TransactionHistoryScreen> createState() =>
      _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen> {
  final TransactionRepository _transactionRepository = TransactionRepository();
  late Future<List<Map<String, dynamic>>> _transactionsFuture;

  @override
  void initState() {
    super.initState();
    _transactionsFuture = _transactionRepository.getTransactions(
      date: DateTime.now(),
    );
  }

  // Format currency helper
  String _formatCurrency(double amount) {
    final format = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp',
      decimalDigits: 0,
    );
    return format.format(amount);
  }

  // Format time helper
  String _formatTime(String isoString) {
    final date = DateTime.parse(isoString).toLocal();
    return DateFormat('HH:mm').format(date);
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PAID':
        return Colors.green;
      case 'VOID':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Riwayat Transaksi Hari Ini'),
        centerTitle: true,
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _transactionsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 16),
                  Text('Terjadi kesalahan: ${snapshot.error}'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _transactionsFuture = _transactionRepository
                            .getTransactions(date: DateTime.now());
                      });
                    },
                    child: const Text('Coba Lagi'),
                  ),
                ],
              ),
            );
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(
              child: Text(
                'Belum ada transaksi hari ini',
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
            );
          }

          final transactions = snapshot.data!;

          return RefreshIndicator(
            onRefresh: () async {
              setState(() {
                _transactionsFuture = _transactionRepository.getTransactions(
                  date: DateTime.now(),
                );
              });
              await _transactionsFuture;
            },
            child: ListView.separated(
              itemCount: transactions.length,
              separatorBuilder: (context, index) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final tx = transactions[index];
                final status = tx['status'] ?? 'UNKNOWN';
                final isPaid = status == 'PAID';
                final totalAmount =
                    double.tryParse(tx['totalAmount'].toString()) ?? 0;

                // Truncate ID for display
                final displayId = (tx['id'] as String).length > 8
                    ? 'TRX-...${(tx['id'] as String).substring((tx['id'] as String).length - 6)}'
                    : 'TRX-${tx['id']}';

                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: isPaid
                        ? Colors.green.withOpacity(0.1)
                        : Colors.red.withOpacity(0.1),
                    child: Icon(
                      isPaid ? Icons.check : Icons.close,
                      color: isPaid ? Colors.green : Colors.red,
                    ),
                  ),
                  title: Text(
                    '$displayId • ${_formatTime(tx['transactionDate'])}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    _formatCurrency(totalAmount),
                    style: const TextStyle(fontSize: 14, color: Colors.black87),
                  ),
                  trailing: Chip(
                    label: Text(
                      status,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    backgroundColor: _getStatusColor(status),
                    padding: EdgeInsets.zero,
                    visualDensity: VisualDensity.compact,
                  ),
                  onTap: () async {
                    final result = await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            TransactionDetailScreen(transaction: tx),
                      ),
                    );

                    // If result is true (voided), refresh history
                    if (result == true) {
                      setState(() {
                        _transactionsFuture = _transactionRepository
                            .getTransactions(date: DateTime.now());
                      });
                    }
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}
