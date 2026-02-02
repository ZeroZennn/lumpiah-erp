import 'dart:async';
import 'package:blue_thermal_printer/blue_thermal_printer.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../core/services/printer_service.dart';

class PrinterSettingsScreen extends StatefulWidget {
  const PrinterSettingsScreen({super.key});

  @override
  State<PrinterSettingsScreen> createState() => _PrinterSettingsScreenState();
}

class _PrinterSettingsScreenState extends State<PrinterSettingsScreen> {
  final PrinterService _printerService = PrinterService();

  // State
  List<BluetoothDevice> _devices = [];
  bool _isLoading = false;
  bool _isConnected = false;

  StreamSubscription<bool>? _connectionSubscription;

  @override
  void initState() {
    super.initState();
    _checkPermissions();
    _refreshDevices();

    // Listen to status
    _connectionSubscription = _printerService.connectionStatusStream.listen((
      connected,
    ) {
      if (mounted) setState(() => _isConnected = connected);
    });

    // Initial check
    _printerService.isConnected().then((val) {
      if (mounted) setState(() => _isConnected = val);
    });
  }

  @override
  void dispose() {
    _connectionSubscription?.cancel();
    super.dispose();
  }

  Future<void> _checkPermissions() async {
    // Android 12+ requires explicit Bluetooth Connect/Scan
    Map<Permission, PermissionStatus> statuses = await [
      Permission.bluetooth,
      Permission.bluetoothScan,
      Permission.bluetoothConnect,
      Permission.location,
    ].request();

    if (statuses.values.any((status) => status.isDenied)) {
      // Optional: Show dialog
    }
  }

  Future<void> _refreshDevices() async {
    setState(() => _isLoading = true);
    try {
      final devices = await _printerService.getBondedDevices();
      setState(() => _devices = devices);
    } catch (e) {
      // ignore
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _connect(BluetoothDevice device) async {
    setState(() => _isLoading = true);
    try {
      await _printerService.connect(device);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Terhubung ke ${device.name}'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _disconnect() async {
    await _printerService.disconnect();
  }

  Future<void> _testPrint() async {
    try {
      await _printerService.printTest();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal Print: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text(
          'Pengaturan Printer',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: Column(
        children: [
          _buildStatusCard(),
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 24, 16, 8),
            child: Row(
              children: [
                Icon(Icons.devices, size: 18, color: Colors.blueGrey),
                SizedBox(width: 8),
                Text(
                  'PERANGKAT TERSEDIA',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.blueGrey,
                    letterSpacing: 1.2,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading && _devices.isEmpty
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFFFFB300)),
                  )
                : RefreshIndicator(
                    onRefresh: _refreshDevices,
                    color: const Color(0xFFFFB300),
                    child: _devices.isEmpty
                        ? _buildEmptyState()
                        : _buildDeviceList(),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusCard() {
    final bool hasDevice =
        _isConnected && _printerService.connectedDevice != null;

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: _isConnected
              ? [const Color(0xFF43A047), const Color(0xFF66BB6A)]
              : [const Color(0xFF757575), const Color(0xFF9E9E9E)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: (_isConnected ? Colors.green : Colors.grey).withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.print, color: Colors.white, size: 32),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _isConnected ? 'Status: Terhubung' : 'Status: Terputus',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (hasDevice)
                        Text(
                          _printerService.connectedDevice!.name ??
                              'Unknown Device',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.9),
                            fontSize: 14,
                          ),
                        ),
                    ],
                  ),
                ),
                if (_isConnected)
                  IconButton(
                    onPressed: _disconnect,
                    icon: const Icon(Icons.link_off, color: Colors.white),
                    tooltip: 'Putuskan',
                  ),
              ],
            ),
            if (_isConnected) ...[
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: _testPrint,
                  icon: const Icon(
                    Icons.playlist_add_check,
                    color: Colors.white,
                  ),
                  label: const Text(
                    'TEST PRINT',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.white, width: 1.5),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDeviceList() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: _devices.length,
      itemBuilder: (context, index) {
        final device = _devices[index];
        final bool isThisConnected =
            _isConnected &&
            _printerService.connectedDevice?.address == device.address;

        return Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(
              color: isThisConnected
                  ? const Color(0xFF43A047)
                  : Colors.grey.shade200,
              width: isThisConnected ? 2 : 1,
            ),
          ),
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 8,
            ),
            leading: CircleAvatar(
              backgroundColor: isThisConnected
                  ? const Color(0xFFE8F5E9)
                  : const Color(0xFFF0F2F5),
              child: Icon(
                Icons.bluetooth,
                color: isThisConnected
                    ? const Color(0xFF43A047)
                    : Colors.blueAccent,
              ),
            ),
            title: Text(
              device.name ?? 'Unknown Device',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            subtitle: Text(
              device.address ?? 'No Address',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
            ),
            trailing: isThisConnected
                ? const Icon(Icons.check_circle, color: Color(0xFF43A047))
                : ElevatedButton(
                    onPressed: _isLoading ? null : () => _connect(device),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFFB300),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text('Sambungkan'),
                  ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return ListView(
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.15),
        const Icon(Icons.bluetooth_searching, size: 80, color: Colors.grey),
        const SizedBox(height: 24),
        const Text(
          'Belum ada perangkat ditemukan',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.black54,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Pastikan printer sudah dipairing di pengaturan\nBluetooth HP, lalu tarik ke bawah untuk refresh.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey),
        ),
      ],
    );
  }
}
