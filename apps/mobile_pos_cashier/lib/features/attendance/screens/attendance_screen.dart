import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/attendance_model.dart';
import '../repositories/attendance_repository.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  final AttendanceRepository _repository = AttendanceRepository();
  // We keep 'status' as an observable state derived from the model
  AttendanceStatus _derivedStatus = AttendanceStatus.notCheckedIn;
  AttendanceModel? _todayModel;
  List<AttendanceModel> _history = [];
  bool _isLoading = true;
  DateTime _currentTime = DateTime.now();
  Timer? _timer;

  int _unsyncedCount = 0;
  bool _isOffline = false;
  late StreamSubscription<List<ConnectivityResult>> _connectivitySubscription;

  @override
  void initState() {
    super.initState();
    _startClock();
    _loadData();
    _checkUnsyncedData();

    // Listen to connectivity changes
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen((
      result,
    ) {
      if (mounted) {
        setState(() {
          _isOffline = result.contains(ConnectivityResult.none);
        });
        if (!_isOffline) {
          // Auto sync or just update badge? For now let's just refresh unsynced count
          _checkUnsyncedData();
          _loadData();
        }
      }
    });

    // Handle initial connectivity state
    Connectivity().checkConnectivity().then((result) {
      if (mounted) {
        setState(() {
          _isOffline = result.contains(ConnectivityResult.none);
        });
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _connectivitySubscription.cancel();
    super.dispose();
  }

  void _startClock() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _currentTime = DateTime.now();
        });
      }
    });
  }

  Future<void> _checkUnsyncedData() async {
    final count = await _repository.getUnsyncedCount();
    if (mounted) {
      setState(() {
        _unsyncedCount = count;
      });
    }
  }

  Future<void> _handleSync() async {
    if (_isOffline) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Internet tidak terdeteksi, lakukan sinkronisasi saat kembali online',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }

    setState(() => _isLoading = true);
    try {
      final result = await _repository.syncOfflineAttendance();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Sync Selesai: ${result.success} berhasil, ${result.failed} gagal',
            ),
            backgroundColor: result.failed > 0 ? Colors.orange : Colors.green,
          ),
        );
      }
      // Refresh data
      await _checkUnsyncedData();
      await _loadData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Sync Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadData() async {
    // Only show loading indicator on initial load if needed, or keeping it makes UI jumpy?
    // Let's keep existing behavior but maybe optimize user experience later.
    setState(() => _isLoading = true);
    try {
      final todayModel = await _repository.getTodayStatus();

      // Only fetch history if online, or implement local history later.
      // Current repository getHistory() is API only.
      // If offline, list might be empty or cached (if we had caching).
      // For now, if offline, we might want to skip getHistory or just try catch it silently.
      List<AttendanceModel> history = [];
      if (!_isOffline) {
        try {
          history = await _repository.getHistory();
        } catch (e) {
          // ignore history fetch error in offline/unstable
        }
      }

      // Determine status from Model
      AttendanceStatus status = AttendanceStatus.notCheckedIn;
      if (todayModel != null) {
        if (todayModel.clockOut == null) {
          status = AttendanceStatus.checkedIn;
        } else {
          status = AttendanceStatus.checkedOut;
        }
      }

      if (mounted) {
        setState(() {
          _derivedStatus = status;
          _todayModel = todayModel;
          _history = history;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        // Don't show error snackbar on every load if offline, just log or ignore
        if (!_isOffline) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Error data: $e')));
        }
      }
    }
  }

  Future<void> _handleAction() async {
    setState(() => _isLoading = true);
    try {
      if (_derivedStatus == AttendanceStatus.notCheckedIn) {
        await _repository.clockIn();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Berhasil Absen Masuk!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else if (_derivedStatus == AttendanceStatus.checkedIn) {
        await _repository.clockOut();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Berhasil Absen Pulang!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
      await _loadData(); // Refresh status and history
      await _checkUnsyncedData(); // Update badge
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

  String _formatTime(DateTime time) {
    return DateFormat('HH:mm:ss').format(time);
  }

  String _formatDate(DateTime time) {
    return DateFormat('EEEE, d MMMM yyyy', 'id_ID').format(time);
  }

  String _getHistoryDate(DateTime date) {
    return DateFormat('d MMM yyyy', 'id_ID').format(date.toLocal());
  }

  String _getHistoryTime(DateTime? date) {
    if (date == null) return '-';
    return DateFormat('HH:mm').format(date.toLocal());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Absensi'),
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Stack(
              alignment: Alignment.topRight,
              children: [
                IconButton(
                  icon: const Icon(Icons.sync),
                  tooltip: 'Sync Offline Data',
                  onPressed: _handleSync,
                ),
                if (_unsyncedCount > 0)
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: _isOffline ? Colors.grey : Colors.red,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '$_unsyncedCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_forever, color: Colors.red),
            tooltip: 'Clear Local Data (Debug)',
            onPressed: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Hapus Data Lokal?'),
                  content: const Text(
                    'Ini akan menghapus semua data absensi yang tersimpan di HP (belum sync). Gunakan hanya untuk debugging.',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Batal'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Hapus'),
                    ),
                  ],
                ),
              );

              if (confirm == true) {
                await _repository.clearLocalAttendance();
                if (!context.mounted) return;

                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Data lokal dihapus')),
                );

                _loadData(); // Refresh UI
                _checkUnsyncedData(); // Refresh Badge
              }
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Offline Indicator
                      if (_isOffline)
                        Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.orange[100],
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.orange),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.wifi_off, color: Colors.orange),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Sistem dalam Mode Offline',
                                  style: TextStyle(
                                    color: Colors.orange,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                      // Warning Banner for Unsynced Data
                      if (_unsyncedCount > 0 || _todayModel?.isSynced == false)
                        Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50, // Light red background
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.red),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.cloud_off, color: Colors.red),
                              SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Anda memiliki data absensi offline. Pastikan internet aktif lalu tekan tombol Sync di pojok kanan atas.',
                                  style: TextStyle(
                                    color: Colors.red,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                      // 1. Current Status Card
                      Card(
                        elevation: 4,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Column(
                            children: [
                              Text(
                                _formatDate(_currentTime),
                                style: const TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _formatTime(_currentTime),
                                style: const TextStyle(
                                  fontSize: 48,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.blueAccent,
                                ),
                              ),
                              const SizedBox(height: 24),
                              if (_derivedStatus == AttendanceStatus.checkedOut)
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.grey[200],
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text(
                                    'Anda sudah selesai absensi hari ini.',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w500,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                )
                              else
                                SizedBox(
                                  width: double.infinity,
                                  height: 56,
                                  child: ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor:
                                          _derivedStatus ==
                                              AttendanceStatus.notCheckedIn
                                          ? Colors.green
                                          : Colors.red,
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                    onPressed: _handleAction,
                                    child: Text(
                                      _derivedStatus ==
                                              AttendanceStatus.notCheckedIn
                                          ? 'MASUK'
                                          : 'PULANG',
                                      style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                              const SizedBox(height: 16),
                              if (_derivedStatus == AttendanceStatus.checkedIn)
                                Column(
                                  children: [
                                    Text(
                                      _todayModel?.isSynced == false
                                          ? 'Status: MASUK (OFFLINE - BELUM SYNC)'
                                          : 'Status: SUDAH MASUK',
                                      style: TextStyle(
                                        color: _todayModel?.isSynced == false
                                            ? Colors.orange
                                            : Colors.green,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                    if (_todayModel?.isSynced == false)
                                      const Padding(
                                        padding: EdgeInsets.only(top: 8.0),
                                        child: Text(
                                          'Data tersimpan di HP. Segera lakukan Sync saat online.',
                                          style: TextStyle(
                                            color: Colors.grey,
                                            fontSize: 12,
                                            fontStyle: FontStyle.italic,
                                          ),
                                          textAlign: TextAlign.center,
                                        ),
                                      ),
                                  ],
                                ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // 2. History List Header
                      const Text(
                        'Riwayat Absensi',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),

                      // History items
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _history.length,
                        separatorBuilder: (context, index) =>
                            const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final item = _history[index];
                          return ListTile(
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.blue[50],
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(
                                Icons.access_time,
                                color: Colors.blue,
                              ),
                            ),
                            title: Text(
                              _getHistoryDate(item.date),
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            subtitle: Row(
                              children: [
                                Icon(
                                  Icons.login,
                                  size: 14,
                                  color: Colors.green[700],
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  _getHistoryTime(item.clockIn),
                                  style: TextStyle(color: Colors.green[700]),
                                ),
                                const SizedBox(width: 16),
                                Icon(
                                  Icons.logout,
                                  size: 14,
                                  color: Colors.red[700],
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  _getHistoryTime(item.clockOut),
                                  style: TextStyle(color: Colors.red[700]),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}
