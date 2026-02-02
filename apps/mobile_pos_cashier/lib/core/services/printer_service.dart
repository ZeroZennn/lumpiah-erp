import 'dart:async';
import 'package:blue_thermal_printer/blue_thermal_printer.dart';
import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/services.dart';
import '../../features/pos/models/transaction_model.dart';

class PrinterService {
  static final PrinterService _instance = PrinterService._internal();
  factory PrinterService() => _instance;
  PrinterService._internal();

  final BlueThermalPrinter _bluetooth = BlueThermalPrinter.instance;

  // Track connection status
  final StreamController<bool> _connectionStatusController =
      StreamController<bool>.broadcast();
  Stream<bool> get connectionStatusStream => _connectionStatusController.stream;

  BluetoothDevice? _connectedDevice;
  BluetoothDevice? get connectedDevice => _connectedDevice;

  CapabilityProfile? _profile;

  static const String _prefKeyName = 'printer_name';
  static const String _prefKeyAddress = 'printer_address';

  Future<void> init() async {
    try {
      _profile = await CapabilityProfile.load();

      _bluetooth.onStateChanged().listen((state) {
        if (state == BlueThermalPrinter.CONNECTED) {
          _connectionStatusController.add(true);
        } else if (state == BlueThermalPrinter.DISCONNECTED) {
          _connectionStatusController.add(false);
          _connectedDevice = null;
        }
      });

      await autoConnect();
    } catch (e) {
      print('PrinterService init error: $e');
    }
  }

  Future<List<BluetoothDevice>> getBondedDevices() async {
    try {
      return await _bluetooth.getBondedDevices() ?? [];
    } catch (e) {
      print('Error getting devices: $e');
      return [];
    }
  }

  Future<void> connect(BluetoothDevice device) async {
    if (device.address == null) throw Exception('Device has no address');

    try {
      final isConnected = await _bluetooth.isConnected;
      if (isConnected == true) {
        await _bluetooth.disconnect();
      }

      await _bluetooth.connect(device);
      _connectedDevice = device;
      _connectionStatusController.add(true);

      await _saveLastPrinter(device);
    } catch (e) {
      _connectedDevice = null;
      _connectionStatusController.add(false);
      throw Exception('Failed to connect: $e');
    }
  }

  Future<void> disconnect() async {
    await _bluetooth.disconnect();
    _connectedDevice = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_prefKeyName);
    await prefs.remove(_prefKeyAddress);

    _connectionStatusController.add(false);
  }

  Future<bool> isConnected() async {
    return (await _bluetooth.isConnected) ?? false;
  }

  Future<void> autoConnect() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final name = prefs.getString(_prefKeyName);
      final address = prefs.getString(_prefKeyAddress);

      if (name != null && address != null) {
        final device = BluetoothDevice(name, address);
        await connect(device);
      }
    } catch (e) {
      print('Auto-connect failed: $e');
    }
  }

  Future<void> _saveLastPrinter(BluetoothDevice device) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKeyName, device.name ?? 'Unknown');
    if (device.address != null) {
      await prefs.setString(_prefKeyAddress, device.address!);
    }
  }

  // ===================================
  // PRINTING LOGIC
  // ===================================

  Future<void> _sendBytes(List<int> bytes) async {
    final isConnected = await _bluetooth.isConnected;
    if (isConnected == true) {
      await _bluetooth.writeBytes(Uint8List.fromList(bytes));
    } else {
      throw Exception('Printer not connected');
    }
  }

  Future<void> printTest() async {
    final profile = _profile ?? await CapabilityProfile.load();
    final generator = Generator(PaperSize.mm58, profile);
    List<int> bytes = [];

    bytes += generator.text(
      'Bluetooth Printer Test',
      styles: const PosStyles(align: PosAlign.center, bold: true),
    );
    bytes += generator.text(
      'Success!',
      styles: const PosStyles(align: PosAlign.center),
    );
    bytes += generator.feed(2);

    await _sendBytes(bytes);
  }

  Future<void> printTransaction(TransactionModel transaction) async {
    // Ensure profile loaded
    final profile = _profile ?? await CapabilityProfile.load();
    final generator = Generator(PaperSize.mm58, profile);
    List<int> bytes = [];

    // Formatters
    final currencyFormatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );
    final dateFormatter = DateFormat('dd/MM/yyyy HH:mm');

    // ==================== HEADER ====================
    bytes += generator.text(
      'LUMPIA SEMARANG',
      styles: const PosStyles(
        align: PosAlign.center,
        bold: true,
        height: PosTextSize.size2,
        width: PosTextSize.size2,
      ),
    );

    bytes += generator.text(
      transaction.branchName,
      styles: const PosStyles(align: PosAlign.center),
    );

    bytes += generator.text(
      dateFormatter.format(transaction.date),
      styles: const PosStyles(align: PosAlign.center),
    );
    bytes += generator.hr();

    // ==================== BODY ====================
    for (final item in transaction.items) {
      bytes += generator.text(
        '${item.quantity} x ${item.name}',
        styles: const PosStyles(align: PosAlign.left),
      );
      bytes += generator.text(
        currencyFormatter.format(item.total),
        styles: const PosStyles(align: PosAlign.right),
      );
    }

    bytes += generator.hr(ch: '-');

    // ==================== FOOTER ====================
    bytes += generator.row([
      PosColumn(text: 'TOTAL', width: 6, styles: const PosStyles(bold: true)),
      PosColumn(
        text: currencyFormatter.format(transaction.totalAmount),
        width: 6,
        styles: const PosStyles(align: PosAlign.right, bold: true),
      ),
    ]);

    bytes += generator.text(
      'Payment: ${transaction.paymentMethod}',
      styles: const PosStyles(align: PosAlign.left),
    );

    if (transaction.paymentMethod == 'CASH') {
      if (transaction.cashReceived != null) {
        bytes += generator.row([
          PosColumn(text: 'Tunai', width: 6),
          PosColumn(
            text: currencyFormatter.format(transaction.cashReceived),
            width: 6,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]);
      }
      if (transaction.change != null) {
        bytes += generator.row([
          PosColumn(text: 'Kembalian', width: 6),
          PosColumn(
            text: currencyFormatter.format(transaction.change),
            width: 6,
            styles: const PosStyles(align: PosAlign.right),
          ),
        ]);
      }
    }

    bytes += generator.feed(1);
    bytes += generator.text(
      'Terima Kasih',
      styles: const PosStyles(align: PosAlign.center, bold: true),
    );
    bytes += generator.feed(1);

    await _sendBytes(bytes);
  }

  // Legacy support method
  Future<void> printReceipt({
    required Map<String, dynamic> transactionData,
    required List<Map<String, dynamic>> items,
    bool isReprint = false,
  }) async {
    final transaction = TransactionModel.fromMap({
      ...transactionData,
      'items': items,
    });
    await printTransaction(transaction);
  }
}
