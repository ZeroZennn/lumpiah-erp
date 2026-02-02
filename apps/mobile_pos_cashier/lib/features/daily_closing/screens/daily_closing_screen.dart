import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/daily_closing_model.dart';
import '../repositories/closing_repository.dart';

class DailyClosingScreen extends StatefulWidget {
  const DailyClosingScreen({super.key});

  @override
  State<DailyClosingScreen> createState() => _DailyClosingScreenState();
}

class _DailyClosingScreenState extends State<DailyClosingScreen> {
  final ClosingRepository _repository = ClosingRepository();
  final NumberFormat _currencyFormat = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );

  bool _isLoading = true;
  bool _isAlreadyClosed = false;
  DailyClosingPreview? _preview;
  String? _errorMessage;

  final TextEditingController _cashController = TextEditingController();
  final TextEditingController _qrisController = TextEditingController();
  final TextEditingController _noteController = TextEditingController();

  double _inputCash = 0;
  double _inputQris = 0;

  @override
  void initState() {
    super.initState();
    _fetchPreview();
  }

  Future<void> _fetchPreview() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final data = await _repository.getClosingPreview();
      if (mounted) {
        setState(() {
          _preview = data;
          _isAlreadyClosed = data.isClosed;

          if (_isAlreadyClosed && data.closingData != null) {
            _cashController.text = data.closingData!.totalCashActual
                .toStringAsFixed(0);
            _qrisController.text = data.closingData!.totalQrisActual
                .toStringAsFixed(0);
            _noteController.text = data.closingData!.closingNote ?? '';
            _updateCalculations();
          }

          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  void _updateCalculations() {
    setState(() {
      _inputCash = double.tryParse(_cashController.text) ?? 0;
      _inputQris = double.tryParse(_qrisController.text) ?? 0;
    });
  }

  Future<void> _handleSubmit() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Konfirmasi Tutup Kas'),
        content: const Text(
          'Apakah Anda yakin? Transaksi hari ini akan dikunci dan tidak dapat diubah lagi.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('YA, TUTUP'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isLoading = true);

    try {
      await _repository.submitClosing(
        actualCash: _inputCash,
        actualQris: _inputQris,
        note: _noteController.text,
      );

      if (!mounted) return;

      // Show Success Dialog
      await showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          title: const Text('Tutup Kas Berhasil'),
          icon: const Icon(Icons.check_circle, color: Colors.green, size: 48),
          content: const Text(
            'Laporan harian berhasil disimpan. Anda akan kembali ke menu utama.',
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context); // Close Dialog
                Navigator.pop(context); // Close Screen
              },
              child: const Text('OK'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _buildVarianceText(String label, double system, double actual) {
    final diff = actual - system;
    Color color = Colors.green;
    String status = 'Cocok';

    if (diff < 0) {
      color = Colors.red;
      status = 'Kurang';
    } else if (diff > 0) {
      color = Colors.orange;
      status = 'Lebih';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        Text(
          '$status: ${_currencyFormat.format(diff)}',
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _preview == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Tutup Kas (End of Day)')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Tutup Kas (End of Day)')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Gagal memuat data',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(_errorMessage!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _fetchPreview,
                child: const Text('Coba Lagi'),
              ),
            ],
          ),
        ),
      );
    }

    final sysCash = _preview?.totalCashSystem ?? 0;
    final sysQris = _preview?.totalQrisSystem ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tutup Kas (End of Day)'),
        backgroundColor: const Color(0xFFFFB300),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Closed Status Banner
            if (_isAlreadyClosed)
              Container(
                margin: const EdgeInsets.only(bottom: 24),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.green),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.green, size: 32),
                    SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Kas Hari Ini Sudah Ditutup',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: Colors.green,
                            ),
                          ),
                          Text(
                            'Data di bawah ini adalah hasil rekap yang telah disimpan.',
                            style: TextStyle(color: Colors.green),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

            // Section 1: Data Sistem
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'DATA SISTEM HARI INI',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.grey,
                      ),
                    ),
                    const Divider(),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total Tunai:'),
                        Text(
                          _currencyFormat.format(sysCash),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total QRIS:'),
                        Text(
                          _currencyFormat.format(sysQris),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Section 2: Input Aktual
            const Text(
              'INPUT AKTUAL (FISIK)',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _cashController,
              keyboardType: TextInputType.number,
              readOnly: _isAlreadyClosed,
              decoration: const InputDecoration(
                labelText: 'Total Uang Tunai di Laci',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.money),
              ),
              onChanged: (_) => _updateCalculations(),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: _buildVarianceText('Selisih Tunai', sysCash, _inputCash),
            ),

            const SizedBox(height: 16),

            TextField(
              controller: _qrisController,
              keyboardType: TextInputType.number,
              readOnly: _isAlreadyClosed,
              decoration: const InputDecoration(
                labelText: 'Total QRIS di EDC/HP',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.qr_code),
              ),
              onChanged: (_) => _updateCalculations(),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: _buildVarianceText('Selisih QRIS', sysQris, _inputQris),
            ),

            const SizedBox(height: 16),

            TextField(
              controller: _noteController,
              maxLines: 3,
              readOnly: _isAlreadyClosed,
              decoration: const InputDecoration(
                labelText: 'Catatan Selisih (Opsional)',
                border: OutlineInputBorder(),
                hintText: 'Jelaskan jika ada selisih...',
              ),
            ),

            const SizedBox(height: 32),

            // Section 4: Submit Button (Hidden if closed)
            if (!_isAlreadyClosed)
              SizedBox(
                height: 56,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: _isLoading ? null : _handleSubmit,
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                          'TUTUP KAS SEKARANG',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
