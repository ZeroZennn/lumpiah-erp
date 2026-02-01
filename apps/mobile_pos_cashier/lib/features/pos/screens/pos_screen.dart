import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:mobile_pos_cashier/features/pos/bloc/cart_cubit.dart';
import 'package:mobile_pos_cashier/local_db/entities/local_product.dart';
import 'package:mobile_pos_cashier/features/pos/repositories/product_repository.dart';
import 'package:mobile_pos_cashier/features/pos/repositories/transaction_repository.dart';
import 'package:intl/intl.dart';
import 'package:mobile_pos_cashier/features/auth/services/auth_service.dart';
import 'package:mobile_pos_cashier/features/auth/screens/login_screen.dart';
import 'package:mobile_pos_cashier/core/services/printer_service.dart';
import 'package:blue_thermal_printer/blue_thermal_printer.dart';
import 'package:mobile_pos_cashier/core/services/digital_receipt_service.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mobile_pos_cashier/features/attendance/screens/attendance_screen.dart';
import '../../attendance/repositories/attendance_repository.dart';
import '../../transactions/screens/transaction_history_screen.dart';
import '../../daily_closing/screens/daily_closing_screen.dart';
import '../../daily_closing/repositories/closing_repository.dart';

/// High-fidelity Modern POS Screen with Responsive Layout
/// - Tablet: Side-by-side layout (Product Catalog | Cart Panel)
/// - Phone: Stacked layout with bottom sheet cart
class PosScreen extends StatefulWidget {
  const PosScreen({super.key});

  @override
  State<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends State<PosScreen> {
  String _selectedCategory = 'Semua';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  // Payment modal state
  final TextEditingController _cashInputController = TextEditingController();
  bool _isProcessing = false;

  // Printer state
  bool _isPrinterConnected = false;

  // Connectivity State
  bool _isOffline = false;
  int _unsyncedCount = 0;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  // Category list
  final List<String> _categories = ['Semua', 'Lumpia', 'Minuman', 'Paket'];

  // Attendance State
  bool _hasCheckedIn = true; // Default to true to hide badge initially
  final AttendanceRepository _attendanceRepository = AttendanceRepository();

  // Closing State
  bool _isStoreClosed = false;
  bool _isLoadingStatus = true;
  final ClosingRepository _closingRepository = ClosingRepository();

  @override
  void initState() {
    super.initState();
    _checkInitialConnectivity();
    _updateUnsyncedCount(); // Initial sync count check
    _checkAttendanceStatus();
    _checkStoreStatus();
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen(
      _updateConnectivityStatus,
    );
  }

  Future<void> _checkStoreStatus() async {
    try {
      final preview = await _closingRepository.getClosingPreview();
      if (mounted) {
        setState(() {
          _isStoreClosed = preview.isClosed;
          _isLoadingStatus = false;
        });
      }
    } catch (e) {
      debugPrint('Error checking store status: $e');
      if (mounted) {
        setState(() {
          _isLoadingStatus = false;
        });
      }
    }
  }

  Future<void> _checkAttendanceStatus() async {
    try {
      final todayStatus = await _attendanceRepository.getTodayStatus();
      if (mounted) {
        setState(() {
          // If null, hasn't checked in. If not null, checked in (regardless if checked out or not, main goal is to remind check in)
          // User said "penanda kalau belum absen" -> if todayStatus is null
          _hasCheckedIn = todayStatus != null;
        });
      }
    } catch (e) {
      debugPrint('Error checking attendance status: $e');
    }
  }

  Future<void> _checkInitialConnectivity() async {
    final result = await Connectivity().checkConnectivity();
    _updateConnectivityStatus(result);
  }

  Future<void> _updateUnsyncedCount() async {
    try {
      final count = await TransactionRepository().getUnsyncedCount();
      if (mounted) {
        setState(() {
          _unsyncedCount = count;
        });
      }
    } catch (e) {
      debugPrint('Error updating unsynced count: $e');
    }
  }

  void _updateConnectivityStatus(List<ConnectivityResult> result) {
    setState(() {
      _isOffline = result.contains(ConnectivityResult.none);
    });

    // If we just went online, check for unsynced data
    if (!_isOffline) {
      _updateUnsyncedCount();
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _cashInputController.dispose();
    _connectivitySubscription?.cancel();
    super.dispose();
  }

  // Determine if we're on a tablet based on screen width
  bool _isTablet(BuildContext context) {
    return MediaQuery.of(context).size.width >= 600;
  }

  /// Handles the checkout process
  Future<void> _handleCheckout(BuildContext context) async {
    final cartCubit = context.read<CartCubit>();
    final cartState = cartCubit.state;

    // 0. Validation: Check if store is closed
    if (_isStoreClosed) {
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Toko sudah tutup kas. Tidak bisa melakukan transaksi.',
          ),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // 1. Validation: Check if cart is empty
    if (cartState.items.isEmpty) {
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Keranjang kosong'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // 2. Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(color: Color(0xFFFFB300)),
                SizedBox(height: 16),
                Text('Memproses transaksi...'),
              ],
            ),
          ),
        ),
      ),
    );

    try {
      // 3. Prepare cart items for API
      final cartItems = cartState.items.map((item) {
        return {
          'productId': item.product.serverId,
          'quantity': item.quantity,
          'price': item.product.price,
        };
      }).toList();

      // Calculate total (including tax)
      final subtotal = cartState.totalAmount;
      final tax = subtotal * 0.1;
      final total = subtotal + tax;

      // 4. Call TransactionRepository to create transaction
      final success = await TransactionRepository().createTransaction(
        cartItems: cartItems,
        totalAmount: total,
        paymentMethod: 'CASH',
      );

      // Dismiss loading dialog
      if (context.mounted) Navigator.of(context).pop();

      // 5. Success handling
      if (success) {
        // Clear the cart
        cartCubit.clearCart();

        // Show success message
        if (context.mounted) {
          ScaffoldMessenger.of(context).clearSnackBars();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Transaksi Berhasil'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
      }
    } catch (e) {
      // Dismiss loading dialog
      if (context.mounted) Navigator.of(context).pop();

      // 6. Error handling
      if (context.mounted) {
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  /// Shows logout confirmation dialog
  Future<void> _showLogoutConfirmation(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Konfirmasi Logout'),
        content: const Text('Apakah anda yakin ingin keluar?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFFB300),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text('Ya', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      // Show loading indicator
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: Card(
            child: Padding(
              padding: EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: Color(0xFFFFB300)),
                  SizedBox(height: 16),
                  Text('Logging out...'),
                ],
              ),
            ),
          ),
        ),
      );

      try {
        // Call AuthService logout
        await AuthService().logout();

        if (context.mounted) {
          // Dismiss loading dialog first
          Navigator.of(context).pop();

          // Small delay to ensure dialog is dismissed
          await Future.delayed(const Duration(milliseconds: 100));

          if (context.mounted) {
            // Navigate to LoginScreen and remove all previous routes
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (context) => const LoginScreen()),
              (route) => false,
            );
          }
        }
      } catch (e) {
        if (context.mounted) {
          // Dismiss loading dialog
          Navigator.of(context).pop();

          // Show error message
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Logout failed: ${e.toString()}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  /// Shows printer settings dialog
  void _showPrinterSettings(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text('Pengaturan Printer'),
          content: SizedBox(
            width: double.maxFinite,
            child: FutureBuilder<List<BluetoothDevice>>(
              future: PrinterService().getBondedDevices(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const SizedBox(
                    height: 100,
                    child: Center(
                      child: CircularProgressIndicator(
                        color: Color(0xFFFFB300),
                      ),
                    ),
                  );
                }

                if (snapshot.hasError) {
                  return Text('Error: ${snapshot.error}');
                }

                if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return const Text(
                    'Tidak ada printer yang terhubung (paired).',
                  );
                }

                return ListView.builder(
                  shrinkWrap: true,
                  itemCount: snapshot.data!.length,
                  itemBuilder: (context, index) {
                    final device = snapshot.data![index];
                    return ListTile(
                      leading: const Icon(Icons.print, color: Colors.grey),
                      title: Text(device.name ?? 'Unknown Device'),
                      subtitle: Text(device.address ?? ''),
                      onTap: () => _connectToPrinter(context, device),
                    );
                  },
                );
              },
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Tutup'),
            ),
          ],
        );
      },
    );
  }

  /// Connects to selected printer
  Future<void> _connectToPrinter(
    BuildContext context,
    BluetoothDevice device,
  ) async {
    // Close the list dialog first
    Navigator.of(context).pop();

    // Show connecting loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(color: Color(0xFFFFB300)),
                SizedBox(height: 16),
                Text('Menghubungkan printer...'),
              ],
            ),
          ),
        ),
      ),
    );

    try {
      await PrinterService().connect(device);

      if (mounted) {
        setState(() {
          _isPrinterConnected = true;
        });
      }

      if (context.mounted) {
        Navigator.of(context).pop(); // Dismiss loading
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Printer Terhubung'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.of(context).pop(); // Dismiss loading
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal menghubungkan: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  /// Shows dialog to input WhatsApp number and send receipt
  void _showWhatsAppDialog(
    BuildContext context,
    Map<String, dynamic> transactionData,
    List<Map<String, dynamic>> items,
  ) {
    final phoneController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text('Kirim Struk via WhatsApp'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Masukkan nomor WhatsApp pelanggan (contoh: 08123456789)',
              ),
              const SizedBox(height: 16),
              TextField(
                controller: phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Nomor WhatsApp',
                  prefixIcon: Icon(Icons.phone),
                  border: OutlineInputBorder(),
                  hintText: '08xxxxxxxxxx',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Batal'),
            ),
            ElevatedButton(
              onPressed: () async {
                final input = phoneController.text.trim();
                if (input.isEmpty) return;

                // Format number: replace leading 0 with 62
                String phoneNumber = input;
                if (phoneNumber.startsWith('0')) {
                  phoneNumber = '62${phoneNumber.substring(1)}';
                }

                Navigator.of(context).pop(); // Close dialog

                try {
                  // Generate text
                  final text = DigitalReceiptService().generateWhatsAppText(
                    transactionData: transactionData,
                    items: items,
                  );

                  // Create WhatsApp URL
                  final url = Uri.parse(
                    'https://wa.me/$phoneNumber?text=${Uri.encodeComponent(text)}',
                  );

                  if (await canLaunchUrl(url)) {
                    await launchUrl(url, mode: LaunchMode.externalApplication);
                  } else {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Tidak dapat membuka WhatsApp'),
                        ),
                      );
                    }
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Gagal mengirim WA: $e')),
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
        );
      },
    );
  }

  /// Shows the comprehensive payment modal with Cash and QRIS options
  void _showPaymentModal(BuildContext context) {
    final cartCubit = context.read<CartCubit>();
    final cartState = cartCubit.state;

    // Calculate total with tax
    final subtotal = cartState.totalAmount;
    final tax = subtotal * 0.1;
    final total = subtotal + tax;

    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DefaultTabController(
        length: 2,
        child: Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              // Header - Total to Pay
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    Text(
                      'Total Pembayaran',
                      style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      formatter.format(total),
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFFFB300),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              // Tab Bar - Full Width 50/50 Split
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 24),
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TabBar(
                  indicator: BoxDecoration(
                    color: const Color(0xFFFFB300),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  indicatorSize: TabBarIndicatorSize.tab,
                  dividerColor: Colors.transparent,
                  labelColor: Colors.white,
                  unselectedLabelColor: Colors.grey[600],
                  labelStyle: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                  tabs: const [
                    Tab(height: 48, child: Center(child: Text('TUNAI'))),
                    Tab(height: 48, child: Center(child: Text('QRIS'))),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // Tab Views
              Expanded(
                child: TabBarView(
                  children: [
                    _buildCashPaymentTab(context, total, formatter),
                    _buildQrisPaymentTab(context, total, formatter),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Build Cash Payment Tab
  Widget _buildCashPaymentTab(
    BuildContext context,
    double total,
    NumberFormat formatter,
  ) {
    return StatefulBuilder(
      builder: (context, setModalState) {
        final cashInput = double.tryParse(_cashInputController.text) ?? 0;
        final change = cashInput - total;
        final isValid = cashInput >= total;

        return Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Cash Input Field
                    const Text(
                      'Uang Diterima',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF2D2D2D),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _cashInputController,
                      keyboardType: TextInputType.number,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                      decoration: InputDecoration(
                        hintText: '0',
                        prefixText: 'Rp ',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: Color(0xFFFFB300),
                            width: 2,
                          ),
                        ),
                      ),
                      onChanged: (_) => setModalState(() {}),
                    ),
                    const SizedBox(height: 16),
                    // Quick Amount Buttons
                    const Text(
                      'Nominal Cepat',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF2D2D2D),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _buildQuickAmountButton(
                          'Uang Pas',
                          total,
                          setModalState,
                        ),
                        _buildQuickAmountButton('10k', 10000, setModalState),
                        _buildQuickAmountButton('20k', 20000, setModalState),
                        _buildQuickAmountButton('50k', 50000, setModalState),
                        _buildQuickAmountButton('100k', 100000, setModalState),
                      ],
                    ),
                    const SizedBox(height: 24),
                    // Change Display
                    if (cashInput > 0)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isValid
                              ? const Color(0xFFF0F9FF)
                              : const Color(0xFFFFF3E0),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isValid
                                ? const Color(0xFF2196F3)
                                : const Color(0xFFFFB300),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              isValid ? 'Kembalian' : 'Kurang',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: isValid
                                    ? const Color(0xFF2196F3)
                                    : const Color(0xFFFFB300),
                              ),
                            ),
                            Text(
                              formatter.format(change.abs()),
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: isValid
                                    ? const Color(0xFF2196F3)
                                    : const Color(0xFFFFB300),
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
            // Payment Button Area
            Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: isValid && !_isProcessing
                      ? () => _processPayment(
                          context,
                          'CASH',
                          total,
                          cashReceived: cashInput,
                        )
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFFB300),
                    disabledBackgroundColor: Colors.grey[300],
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isProcessing
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                          'BAYAR SEKARANG',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  /// Build QRIS Payment Tab
  Widget _buildQrisPaymentTab(
    BuildContext context,
    double total,
    NumberFormat formatter,
  ) {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const SizedBox(height: 10),
                // QR Code Placeholder
                Container(
                  width: 200, // Reduced from 250 to fit better
                  height: 200,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey[300]!, width: 2),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.qr_code_2, size: 140, color: Colors.grey[300]),
                      Text(
                        'QR Code Placeholder',
                        style: TextStyle(fontSize: 12, color: Colors.grey[400]),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Scan QRIS di atas',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[700],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Total: ${formatter.format(total)}',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFFFB300),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
        // Status Check Button Area
        Padding(
          padding: const EdgeInsets.all(24),
          child: SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _isProcessing
                  ? null
                  : () => _processPayment(context, 'QRIS', total),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFFB300),
                disabledBackgroundColor: Colors.grey[300],
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isProcessing
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12),
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.center,
                        child: Text(
                          'KONFIRMASI STATUS PEMBAYARAN',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                          maxLines: 1,
                        ),
                      ),
                    ),
            ),
          ),
        ),
      ],
    );
  }

  /// Build Quick Amount Button
  Widget _buildQuickAmountButton(
    String label,
    double amount,
    StateSetter setModalState,
  ) {
    return ElevatedButton(
      onPressed: () {
        setModalState(() {
          _cashInputController.text = amount.toStringAsFixed(0);
        });
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF2D2D2D),
        side: BorderSide(color: Colors.grey[300]!),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
    );
  }

  /// Process payment transaction
  Future<void> _processPayment(
    BuildContext context,
    String paymentMethod,
    double totalAmount, {
    double? cashReceived,
  }) async {
    setState(() => _isProcessing = true);

    try {
      final cartCubit = context.read<CartCubit>();
      final cartState = cartCubit.state;

      // Prepare cart items for API
      final cartItems = cartState.items.map((item) {
        return {
          'productId': item.product.serverId,
          'quantity': item.quantity,
          'price': item.product.price,
        };
      }).toList();

      // Call TransactionRepository
      final success = await TransactionRepository().createTransaction(
        cartItems: cartItems,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod,
        cashReceived: cashReceived,
      );

      setState(() => _isProcessing = false);

      // Update unsynced count regardless of online/offline status
      await _updateUnsyncedCount();

      if (success && context.mounted) {
        // Prepare items for receipt (printer & digital)
        final printItems = cartState.items.map((item) {
          return {
            'quantity': item.quantity,
            'productName': item.product.name,
            'price': item.product.price,
          };
        }).toList();

        // Prepare transaction data
        final transactionData = {
          'branchName': await AuthService().getBranchName(),
          'date': DateTime.now(),
          'totalAmount': totalAmount,
          'paymentMethod': paymentMethod,
          'cashReceived': cashReceived ?? 0,
          'change': cashReceived != null ? cashReceived - totalAmount : 0,
          'transactionId': 'TRX-${DateTime.now().millisecondsSinceEpoch}',
        };

        // Auto-print receipt logic
        final isConnected = await PrinterService().isConnected();

        if (isConnected) {
          try {
            // Print receipt
            await PrinterService().printReceipt(
              transactionData: transactionData,
              items: printItems,
            );
          } catch (e) {
            debugPrint('Auto-print error: $e');
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Gagal mencetak struk'),
                  backgroundColor: Colors.orange,
                  duration: Duration(seconds: 2),
                ),
              );
            }
          }
        } else {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Transaksi sukses, tapi printer tidak terhubung'),
                backgroundColor: Colors.orange,
                duration: Duration(seconds: 3),
              ),
            );
          }
        }

        if (!context.mounted) return;

        // Close payment modal
        Navigator.of(context).pop();

        // Clear cart
        cartCubit.clearCart();

        // Clear cash input
        _cashInputController.clear();

        // Show success dialog
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.check_circle, color: Colors.green, size: 64),
                const SizedBox(height: 16),
                const Text(
                  'Transaksi Berhasil',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Pembayaran via $paymentMethod berhasil',
                  style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                  textAlign: TextAlign.center,
                ),
                Text(
                  'Kembalian: ${NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(cashReceived != null ? cashReceived - totalAmount : 0)}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.green,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),

                // Digital Receipt Buttons
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      try {
                        // Show loading
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Memproses PDF...')),
                        );

                        final pdfBytes = await DigitalReceiptService()
                            .generatePdfReceipt(
                              transactionData: transactionData,
                              items: printItems,
                            );

                        await DigitalReceiptService().sharePdf(
                          pdfBytes,
                          transactionData['transactionId'] as String,
                        );
                      } catch (e) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Gagal membagikan PDF: $e')),
                        );
                      }
                    },
                    icon: const Icon(Icons.share),
                    label: const Text('Bagikan Struk (PDF)'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      _showWhatsAppDialog(context, transactionData, printItems);
                    },
                    icon: const Icon(Icons.chat),
                    label: const Text('Kirim via WhatsApp'),
                  ),
                ),
                const SizedBox(height: 8),
                // Manual Print Button (Fallback)
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      try {
                        await PrinterService().printReceipt(
                          transactionData: transactionData,
                          items: printItems,
                        );
                      } catch (e) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Gagal mencetak: $e')),
                        );
                      }
                    },
                    icon: const Icon(Icons.print),
                    label: const Text('Cetak Struk'),
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Tutup / Transaksi Baru'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      setState(() => _isProcessing = false);

      if (context.mounted) {
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  /// Handle Manual Sync
  Future<void> _handleSync(BuildContext context) async {
    if (_isOffline) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Tidak ada koneksi internet. Cek kembali koneksi Anda.',
          ),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Sedang menyinkronkan data...'),
        duration: Duration(seconds: 1),
      ),
    );

    try {
      final result = await TransactionRepository().syncOfflineData();

      if (!context.mounted) return;

      ScaffoldMessenger.of(context).hideCurrentSnackBar();

      if (result.containsKey('message') &&
          result['message'] == 'No data to sync') {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Semua data sudah tersinkronisasi.'),
            backgroundColor: Colors.blue,
          ),
        );
        return;
      }

      final syncedCount = result['syncedCount'] as int? ?? 0;
      final duplicatesSkipped = result['duplicatesSkipped'] as int? ?? 0;

      if (syncedCount > 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Sukses! $syncedCount transaksi tersinkronisasi.'),
            backgroundColor: Colors.green,
          ),
        );
      } else if (duplicatesSkipped > 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Data sudah ada di server (Duplikat).'),
            backgroundColor: Colors.blue,
          ),
        );
      } else {
        // Fallback for 0 synced 0 duplicates?
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Sinkronisasi selesai.'),
            backgroundColor: Colors.blue,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Gagal sinkronisasi: ${e.toString().replaceAll('Exception: ', '')}',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      _updateUnsyncedCount();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isTablet = _isTablet(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        iconTheme: const IconThemeData(color: Colors.black),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFFB300).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.store, color: Color(0xFFFFB300)),
            ),
            const SizedBox(width: 12),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Lumpiah ERP',
                  style: TextStyle(
                    color: Colors.black,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
                Text(
                  'Cashier Mode',
                  style: TextStyle(
                    color: Colors.grey,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          // Network Connectivity Status
          if (_isOffline)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.redAccent,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'OFFLINE',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            )
          else
            Container(
              margin: const EdgeInsets.only(right: 16),
              width: 12,
              height: 12,
              decoration: const BoxDecoration(
                color: Colors.green,
                shape: BoxShape.circle,
              ),
            ),

          // Attendance Button with Text & Badge
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const AttendanceScreen(),
                ),
              ).then((_) => _checkAttendanceStatus()); // Refresh on return
            },
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFFFB300).withOpacity(0.1),
                borderRadius: BorderRadius.circular(10), // Rounded pill shape
                border: Border.all(
                  color: const Color(0xFFFFB300).withOpacity(0.3),
                ),
              ),
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.access_time,
                        size: 20,
                        color: Color(0xFFFFB300),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Absensi',
                        style: TextStyle(
                          color: const Color(0xFFFFB300).withOpacity(1),
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  if (!_hasCheckedIn)
                    Positioned(
                      top: -10,
                      right: -10,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 10,
                          minHeight: 10,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // History Button
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 4),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: IconButton(
              icon: const Icon(Icons.history, color: Colors.blue),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const TransactionHistoryScreen(),
                  ),
                );
              },
              tooltip: 'Riwayat Transaksi',
            ),
          ),

          // Sync Button with Badge
          Stack(
            children: [
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: _unsyncedCount > 0
                      ? const Color(0xFFFFB300).withOpacity(0.1)
                      : Colors
                            .transparent, // Less prominent if nothing to sync? Or keep consistent.
                  // User said "If _unsyncedCount == 0: Show only the Sync Icon (maybe greyed out or standard color)."
                  // Let's keep the background consistent or maybe remove it if 0.
                  // I'll keep the decoration consistent for now to match other buttons.
                  borderRadius: BorderRadius.circular(8),
                ),
                child: IconButton(
                  icon: Icon(
                    Icons.sync,
                    color: _unsyncedCount > 0
                        ? const Color(0xFFFFB300)
                        : Colors.grey,
                  ),
                  onPressed: () => _handleSync(context),
                  tooltip: 'Sinkronisasi Data',
                ),
              ),
              if (_unsyncedCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      _unsyncedCount.toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),

          // Printer Status
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 8),
            decoration: BoxDecoration(
              color: _isPrinterConnected
                  ? Colors.green.withOpacity(0.1)
                  : Colors.red.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: IconButton(
              icon: Icon(
                _isPrinterConnected ? Icons.print : Icons.print_disabled,
                color: _isPrinterConnected ? Colors.green : Colors.red,
              ),
              onPressed: () => _showPrinterSettings(context),
              tooltip: 'Status Printer',
            ),
          ),

          // Logout Button
          Container(
            margin: const EdgeInsets.only(right: 16),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: IconButton(
              icon: const Icon(Icons.logout, color: Colors.red),
              onPressed: () => _showLogoutConfirmation(context),
              tooltip: 'Keluar',
            ),
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            UserAccountsDrawerHeader(
              decoration: const BoxDecoration(color: Color(0xFFFFB300)),
              accountName: const Text(
                'Kasir',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              // Ideally fetch logic username from generic user profile if available,
              // for now static 'Kasir' is fine or updated later.
              accountEmail: const Text('Lumpiah Cashier System'),
              currentAccountPicture: CircleAvatar(
                backgroundColor: Colors.white,
                child: const Icon(
                  Icons.person,
                  size: 40,
                  color: Color(0xFFFFB300),
                ),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.point_of_sale),
              title: const Text('POS / Kasir'),
              onTap: () {
                Navigator.pop(context); // Close drawer
              },
            ),
            ListTile(
              leading: const Icon(Icons.history),
              title: const Text('Riwayat Transaksi'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const TransactionHistoryScreen(),
                  ),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.access_time),
              title: const Text('Absensi Pegawai'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const AttendanceScreen(),
                  ),
                );
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.lock_clock, color: Colors.orange),
              title: const Text('Tutup Kas (EOD)'),
              subtitle: const Text('Rekap Harian & Closing'),
              onTap: () async {
                Navigator.pop(context);
                await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const DailyClosingScreen(),
                  ),
                );

                // Refresh status regardless of result, just in case
                if (mounted) {
                  _checkStoreStatus();
                }
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.print),
              title: const Text('Pengaturan Printer'),
              onTap: () {
                Navigator.pop(context);
                _showPrinterSettings(context);
              },
            ),
            const Spacer(),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text('Keluar', style: TextStyle(color: Colors.red)),
              onTap: () {
                Navigator.pop(context);
                _showLogoutConfirmation(context);
              },
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (_isStoreClosed)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade100,
                  border: Border(
                    bottom: BorderSide(color: Colors.red.shade700, width: 1),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.lock, color: Colors.red.shade900),
                    const SizedBox(width: 12),
                    Text(
                      'TOKO SUDAH TUTUP. Transaksi dikunci.',
                      style: TextStyle(
                        color: Colors.red.shade900,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            Expanded(
              child: isTablet ? _buildTabletLayout() : _buildPhoneLayout(),
            ),
          ],
        ),
      ),
      // Show FAB only on phone to open cart
      floatingActionButton: isTablet ? null : _buildCartFab(),
    );
  }

  // ============================================================================
  // TABLET LAYOUT - Side by side
  // ============================================================================
  Widget _buildTabletLayout() {
    return Row(
      children: [
        // LEFT SIDE - Product Catalog (Flex 7)
        Expanded(flex: 7, child: _buildProductCatalog(isTablet: true)),
        // RIGHT SIDE - Cart Panel (Flex 3)
        Expanded(flex: 3, child: _buildCartPanel()),
      ],
    );
  }

  // ============================================================================
  // PHONE LAYOUT - Full screen catalog with bottom sheet cart
  // ============================================================================
  Widget _buildPhoneLayout() {
    return _buildProductCatalog(isTablet: false);
  }

  Widget _buildCartFab() {
    return BlocBuilder<CartCubit, CartState>(
      builder: (context, state) {
        return FloatingActionButton.extended(
          onPressed: () => _showCartBottomSheet(context),
          backgroundColor: const Color(0xFFFFB300),
          icon: Badge(
            label: Text('${state.totalQty}'),
            isLabelVisible: state.totalQty > 0,
            child: const Icon(Icons.shopping_cart, color: Colors.white),
          ),
          label: Text(
            state.items.isEmpty
                ? 'Cart'
                : NumberFormat.currency(
                    locale: 'id_ID',
                    symbol: 'Rp ',
                    decimalDigits: 0,
                  ).format(state.totalAmount),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        );
      },
    );
  }

  void _showCartBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Cart content
              Expanded(
                child: _buildCartPanelContent(
                  scrollController: scrollController,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ============================================================================
  // Product Catalog Section
  // ============================================================================
  Widget _buildProductCatalog({required bool isTablet}) {
    return Container(
      color: const Color(0xFFF5F5F5),
      child: Column(
        children: [
          // Header with search and categories
          _buildCatalogHeader(isTablet: isTablet),
          // Product Grid with FutureBuilder
          Expanded(
            child: FutureBuilder<List<LocalProduct>>(
              future: ProductRepository().fetchProducts(),
              builder: (context, snapshot) {
                // Loading State
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: CircularProgressIndicator(color: Color(0xFFFFB300)),
                  );
                }

                // Error State
                if (snapshot.hasError) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Error loading menu',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          snapshot.error.toString(),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  );
                }

                // Success State - Filter products
                final allProducts = snapshot.data ?? [];
                final filteredProducts = allProducts.where((product) {
                  final matchesCategory =
                      _selectedCategory == 'Semua' ||
                      product.category == _selectedCategory;
                  final matchesSearch = product.name.toLowerCase().contains(
                    _searchQuery.toLowerCase(),
                  );
                  return matchesCategory && matchesSearch;
                }).toList();

                // Empty state
                if (filteredProducts.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.search_off,
                          size: 64,
                          color: Colors.grey[300],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No products found',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  );
                }

                // GridView with real data
                return LayoutBuilder(
                  builder: (context, constraints) {
                    final int crossAxisCount = constraints.maxWidth > 600
                        ? 4
                        : 2;
                    final double childAspectRatio = constraints.maxWidth > 600
                        ? 0.85
                        : 0.75;

                    return Padding(
                      padding: EdgeInsets.fromLTRB(
                        isTablet ? 20 : 12,
                        0,
                        isTablet ? 12 : 12,
                        isTablet ? 20 : 80, // Extra padding for FAB on phone
                      ),
                      child: GridView.builder(
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: crossAxisCount,
                          childAspectRatio: childAspectRatio,
                          crossAxisSpacing: isTablet ? 16 : 10,
                          mainAxisSpacing: isTablet ? 16 : 10,
                        ),
                        itemCount: filteredProducts.length,
                        itemBuilder: (context, index) {
                          return _ProductCard(
                            product: filteredProducts[index],
                            isCompact: constraints.maxWidth <= 600,
                          );
                        },
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCatalogHeader({required bool isTablet}) {
    return Padding(
      padding: EdgeInsets.all(isTablet ? 20 : 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title and Search Row
          if (isTablet)
            Row(
              children: [
                const Text(
                  'Menu',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2D2D2D),
                  ),
                ),
                const SizedBox(width: 24),
                Expanded(child: _buildSearchBar()),
                const SizedBox(width: 16),
                // Printer setup button
                // REMOVING DUPLICATE BUTTON
                // Logout button
                // REMOVING DUPLICATE BUTTON
              ],
            )
          else
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Menu',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2D2D2D),
                      ),
                    ),
                    // Action buttons (Printer + Logout)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.print),
                          onPressed: () => _showPrinterSettings(context),
                          tooltip: 'Pengaturan Printer',
                          color: _isPrinterConnected
                              ? Colors.green
                              : const Color(0xFF2D2D2D),
                        ),
                        IconButton(
                          icon: const Icon(Icons.logout),
                          onPressed: () => _showLogoutConfirmation(context),
                          tooltip: 'Keluar',
                          color: const Color(0xFF2D2D2D),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildSearchBar(),
              ],
            ),
          SizedBox(height: isTablet ? 20 : 12),
          // Category Chips
          SizedBox(
            height: 40,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _categories.length,
              itemBuilder: (context, index) {
                final category = _categories[index];
                final isSelected = _selectedCategory == category;
                return Padding(
                  padding: EdgeInsets.only(right: isTablet ? 12 : 8),
                  child: _CategoryChip(
                    label: category,
                    isSelected: isSelected,
                    isCompact: !isTablet,
                    onTap: () => setState(() => _selectedCategory = category),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(15),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (value) => setState(() => _searchQuery = value),
        decoration: InputDecoration(
          hintText: 'Cari produk...',
          hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
          prefixIcon: Icon(Icons.search, color: Colors.grey[400], size: 20),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear, size: 18),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => _searchQuery = '');
                  },
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
        ),
      ),
    );
  }

  // ============================================================================
  // Cart Panel Section
  // ============================================================================
  Widget _buildCartPanel() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(20),
            blurRadius: 20,
            offset: const Offset(-4, 0),
          ),
        ],
      ),
      child: _buildCartPanelContent(),
    );
  }

  Widget _buildCartPanelContent({ScrollController? scrollController}) {
    return Column(
      children: [
        // Cart Header
        _buildCartHeader(),
        // Cart Items List
        Expanded(child: _buildCartItems(scrollController: scrollController)),
        // Cart Footer with totals and checkout
        _buildCartFooter(),
      ],
    );
  }

  Widget _buildCartHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'Current Order',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D2D2D),
            ),
          ),
          BlocBuilder<CartCubit, CartState>(
            builder: (context, state) {
              if (state.items.isEmpty) return const SizedBox.shrink();
              return TextButton.icon(
                onPressed: () => context.read<CartCubit>().clearCart(),
                icon: const Icon(Icons.delete_outline, size: 16),
                label: const Text('Clear'),
                style: TextButton.styleFrom(foregroundColor: Colors.red[400]),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCartItems({ScrollController? scrollController}) {
    return BlocBuilder<CartCubit, CartState>(
      builder: (context, state) {
        if (state.items.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.shopping_basket_outlined,
                  size: 64,
                  color: Colors.grey[300],
                ),
                const SizedBox(height: 12),
                Text(
                  'Keranjang kosong',
                  style: TextStyle(fontSize: 14, color: Colors.grey[400]),
                ),
                const SizedBox(height: 4),
                Text(
                  'Pilih produk untuk memulai',
                  style: TextStyle(fontSize: 12, color: Colors.grey[400]),
                ),
              ],
            ),
          );
        }

        return ListView.separated(
          controller: scrollController,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          itemCount: state.items.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, index) =>
              _CartItemTile(item: state.items[index]),
        );
      },
    );
  }

  Widget _buildCartFooter() {
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    return BlocBuilder<CartCubit, CartState>(
      builder: (context, state) {
        final subtotal = state.totalAmount;
        final tax = subtotal * 0.1;
        final total = subtotal + tax;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(15),
                blurRadius: 10,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildSummaryRow('Subtotal', formatter.format(subtotal)),
                const SizedBox(height: 4),
                _buildSummaryRow('Tax (10%)', formatter.format(tax)),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Divider(),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Total',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2D2D2D),
                      ),
                    ),
                    Text(
                      formatter.format(total),
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFFFB300),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed:
                        (_isStoreClosed ||
                            state.items.isEmpty ||
                            _isLoadingStatus)
                        ? null
                        : () {
                            // Close bottom sheet if open (for phone layout)
                            if (!_isTablet(context)) {
                              Navigator.of(context).pop();
                            }
                            // Show payment modal
                            _showPaymentModal(context);
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFFB300),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.grey[300],
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isLoadingStatus
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(
                            state.items.isEmpty
                                ? 'Select Items'
                                : 'Charge - ${formatter.format(total)}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 13, color: Colors.grey[600])),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Color(0xFF2D2D2D),
          ),
        ),
      ],
    );
  }
}

// ============================================================================
// Category Chip Widget
// ============================================================================
class _CategoryChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final bool isCompact;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.isCompact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isSelected ? const Color(0xFFFFB300) : Colors.white,
      borderRadius: BorderRadius.circular(20),
      elevation: isSelected ? 2 : 0,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: EdgeInsets.symmetric(
            horizontal: isCompact ? 16 : 24,
            vertical: isCompact ? 8 : 10,
          ),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? Colors.transparent : Colors.grey[300]!,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: isCompact ? 13 : 14,
              color: isSelected ? Colors.white : Colors.grey[600],
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// Product Card Widget
// ============================================================================
class _ProductCard extends StatelessWidget {
  final LocalProduct product;
  final bool isCompact;

  const _ProductCard({required this.product, this.isCompact = false});

  void _handleAddToCart(BuildContext context) {
    context.read<CartCubit>().addToCart(product);

    // Custom "Add to Cart" Notification
    ScaffoldMessenger.of(context).clearSnackBars();
    final screenWidth = MediaQuery.of(context).size.width;
    final isTablet = screenWidth >= 600;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: Colors.green,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check, size: 12, color: Colors.white),
            ),
            const SizedBox(width: 10),
            Flexible(
              child: Text(
                '${product.name} (+1)',
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                  color: Colors.white,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF323232),
        behavior: SnackBarBehavior.floating,
        elevation: 6,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        // Position: Bottom Left on Tablet, Center on Phone
        margin: isTablet
            ? EdgeInsets.only(
                bottom: 24,
                left: 24,
                right:
                    screenWidth - 300, // Forces approx 276px width aligned left
              )
            : const EdgeInsets.fromLTRB(20, 0, 20, 20),
        duration: const Duration(milliseconds: 1000),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(isCompact ? 12 : 16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(20),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(isCompact ? 12 : 16),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => _handleAddToCart(context),
            child: Padding(
              padding: EdgeInsets.all(isCompact ? 10 : 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product Image Placeholder
                  Expanded(
                    flex: 3,
                    child: Center(
                      child: Container(
                        width: isCompact ? 60 : 90,
                        height: isCompact ? 60 : 90,
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF8E1),
                          borderRadius: BorderRadius.circular(
                            isCompact ? 12 : 16,
                          ),
                        ),
                        child: Icon(
                          _getCategoryIcon(product.category),
                          size: isCompact ? 32 : 48,
                          color: const Color(0xFFFFB300),
                        ),
                      ),
                    ),
                  ),
                  SizedBox(height: isCompact ? 8 : 12),
                  // Product Info
                  Expanded(
                    flex: 2,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Product Name
                        Text(
                          product.name,
                          style: TextStyle(
                            fontSize: isCompact ? 12 : 15,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF2D2D2D),
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const Spacer(),
                        // Price and Add Button Row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            // Price
                            Expanded(
                              child: Text(
                                formatter.format(product.price),
                                style: TextStyle(
                                  fontSize: isCompact ? 13 : 16,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFFFFB300),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Add Button
                            Container(
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFB300),
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(
                                      0xFFFFB300,
                                    ).withAlpha(80),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  onTap: () => _handleAddToCart(context),
                                  borderRadius: BorderRadius.circular(8),
                                  child: SizedBox(
                                    width: isCompact ? 28 : 32,
                                    height: isCompact ? 28 : 32,
                                    child: Icon(
                                      Icons.add,
                                      size: isCompact ? 18 : 20,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'lumpia':
        return Icons.restaurant;
      case 'minuman':
        return Icons.local_cafe;
      case 'paket':
        return Icons.lunch_dining;
      default:
        return Icons.fastfood;
    }
  }
}

// ============================================================================
// Cart Item Tile Widget
// ============================================================================
class _CartItemTile extends StatelessWidget {
  final CartItem item;

  const _CartItemTile({required this.item});

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F9F9),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          // Product Icon
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFFFF8E1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.restaurant,
              color: Color(0xFFFFB300),
              size: 20,
            ),
          ),
          const SizedBox(width: 10),
          // Product Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.product.name,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF2D2D2D),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  formatter.format(item.subtotal),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFFFB300),
                  ),
                ),
              ],
            ),
          ),
          // Quantity Controls
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _QuantityButton(
                icon: Icons.remove,
                onTap: () {
                  if (item.quantity > 1) {
                    context.read<CartCubit>().decrementItem(item.product);
                  } else {
                    context.read<CartCubit>().removeFromCart(
                      item.product.serverId,
                    );
                  }
                },
              ),
              Container(
                width: 28,
                alignment: Alignment.center,
                child: Text(
                  '${item.quantity}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2D2D2D),
                  ),
                ),
              ),
              _QuantityButton(
                icon: Icons.add,
                isPrimary: true,
                onTap: () => context.read<CartCubit>().addToCart(item.product),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// Quantity Button Widget
// ============================================================================
class _QuantityButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool isPrimary;

  const _QuantityButton({
    required this.icon,
    required this.onTap,
    this.isPrimary = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isPrimary ? const Color(0xFFFFB300) : Colors.grey[200],
      borderRadius: BorderRadius.circular(6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(6),
        child: SizedBox(
          width: 28,
          height: 28,
          child: Icon(
            icon,
            size: 16,
            color: isPrimary ? Colors.white : Colors.grey[600],
          ),
        ),
      ),
    );
  }
}
