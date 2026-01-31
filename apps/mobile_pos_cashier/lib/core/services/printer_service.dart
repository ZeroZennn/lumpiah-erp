import 'package:blue_thermal_printer/blue_thermal_printer.dart';
import 'package:intl/intl.dart';

/// Service for managing thermal printer connections and printing receipts
class PrinterService {
  // Singleton instance
  static final PrinterService _instance = PrinterService._internal();
  factory PrinterService() => _instance;
  PrinterService._internal();

  // Bluetooth printer instance
  final BlueThermalPrinter _bluetooth = BlueThermalPrinter.instance;

  // Size constants for printing
  static const int SIZE_NORMAL = 0;
  static const int SIZE_MEDIUM = 1;
  static const int SIZE_LARGE = 2;
  static const int SIZE_EXTRA_LARGE = 3;

  // Alignment constants
  static const int ALIGN_LEFT = 0;
  static const int ALIGN_CENTER = 1;
  static const int ALIGN_RIGHT = 2;

  /// Initialize the bluetooth instance
  void init() {
    // Initialization is handled internally by blue_thermal_printer
    // This method can be used for future setup if needed
  }

  /// Get list of bonded/paired bluetooth devices
  Future<List<BluetoothDevice>> getBondedDevices() async {
    try {
      return await _bluetooth.getBondedDevices();
    } catch (e) {
      throw Exception('Failed to get bonded devices: $e');
    }
  }

  /// Connect to a specific bluetooth printer device
  Future<void> connect(BluetoothDevice device) async {
    try {
      await _bluetooth.connect(device);
    } catch (e) {
      throw Exception('Failed to connect to printer: $e');
    }
  }

  /// Disconnect from the connected printer
  Future<void> disconnect() async {
    try {
      await _bluetooth.disconnect();
    } catch (e) {
      throw Exception('Failed to disconnect: $e');
    }
  }

  /// Check if printer is currently connected
  Future<bool> isConnected() async {
    try {
      return await _bluetooth.isConnected ?? false;
    } catch (e) {
      return false;
    }
  }

  /// Print receipt with transaction data
  ///
  /// Parameters:
  /// - transactionData: Map containing transaction details (branch, date, total, paymentMethod, cashReceived, change)
  /// - items: List of cart items with product details
  Future<void> printReceipt({
    required Map<String, dynamic> transactionData,
    required List<Map<String, dynamic>> items,
    bool isReprint = false,
  }) async {
    final connected = await isConnected();
    if (!connected) {
      throw Exception('Printer not connected');
    }

    try {
      final formatter = NumberFormat.currency(
        locale: 'id_ID',
        symbol: 'Rp ',
        decimalDigits: 0,
      );

      final dateFormatter = DateFormat('dd/MM/yyyy HH:mm');

      // ==================== HEADER ====================
      if (isReprint) {
        _bluetooth.printCustom(
          '* DUPLICATE / COPY *',
          SIZE_LARGE,
          ALIGN_CENTER,
        );
        _bluetooth.printNewLine();
      }

      // Shop name - Bold, Center, Large
      // Shop name - Bold, Center, Large
      _bluetooth.printCustom('LUMPIA SEMARANG', SIZE_EXTRA_LARGE, ALIGN_CENTER);
      _bluetooth.printNewLine();

      // Branch name
      final branchName = transactionData['branchName'] ?? 'Cabang Utama';
      _bluetooth.printCustom(branchName, SIZE_MEDIUM, ALIGN_CENTER);

      // Date and time
      final date = transactionData['date'] != null
          ? dateFormatter.format(transactionData['date'])
          : dateFormatter.format(DateTime.now());
      _bluetooth.printCustom(date, SIZE_MEDIUM, ALIGN_CENTER);
      _bluetooth.printNewLine();

      // Divider
      _bluetooth.printCustom(
        '--------------------------------',
        SIZE_MEDIUM,
        ALIGN_CENTER,
      );
      _bluetooth.printNewLine();

      // ==================== BODY - ITEMS ====================
      for (final item in items) {
        final qty = item['quantity'] ?? 0;
        final productName = item['productName'] ?? item['name'] ?? 'Unknown';
        final price = item['price'] ?? 0;
        final total = qty * price;

        // Item line: "Qty x Product Name"
        _bluetooth.printLeftRight(
          '$qty x $productName',
          formatter.format(total),
          SIZE_MEDIUM,
        );
      }

      _bluetooth.printNewLine();

      // ==================== FOOTER ====================
      // Divider
      _bluetooth.printCustom(
        '--------------------------------',
        SIZE_MEDIUM,
        ALIGN_CENTER,
      );

      // Total amount
      final totalAmount = transactionData['totalAmount'] ?? 0;
      _bluetooth.printLeftRight(
        'TOTAL',
        formatter.format(totalAmount),
        SIZE_LARGE,
      );
      _bluetooth.printNewLine();

      // Payment method
      final paymentMethod = transactionData['paymentMethod'] ?? 'CASH';
      _bluetooth.printLeftRight('Metode Bayar', paymentMethod, SIZE_MEDIUM);

      // Cash received and change (only for CASH payment)
      if (paymentMethod == 'CASH') {
        final cashReceived = transactionData['cashReceived'] ?? 0;
        final change = transactionData['change'] ?? 0;

        _bluetooth.printLeftRight(
          'Tunai',
          formatter.format(cashReceived),
          SIZE_MEDIUM,
        );

        _bluetooth.printLeftRight(
          'Kembalian',
          formatter.format(change),
          SIZE_MEDIUM,
        );
      }

      _bluetooth.printNewLine();

      // ==================== CLOSING ====================
      // Divider
      _bluetooth.printCustom(
        '--------------------------------',
        SIZE_MEDIUM,
        ALIGN_CENTER,
      );
      _bluetooth.printNewLine();

      // Thank you message
      _bluetooth.printCustom('Terima Kasih', SIZE_MEDIUM, ALIGN_CENTER);
      _bluetooth.printCustom('Atas Kunjungan Anda', SIZE_MEDIUM, ALIGN_CENTER);
      _bluetooth.printNewLine();
      _bluetooth.printNewLine();
      _bluetooth.printNewLine();

      // Feed paper
      _bluetooth.paperCut();
    } catch (e) {
      throw Exception('Failed to print receipt: $e');
    }
  }
}
