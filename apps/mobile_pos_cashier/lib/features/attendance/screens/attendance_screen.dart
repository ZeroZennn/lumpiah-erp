import 'dart:async';
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
  List<AttendanceModel> _history = [];
  bool _isLoading = true;
  DateTime _currentTime = DateTime.now();
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startClock();
    _loadData();
  }

  @override
  void dispose() {
    _timer?.cancel();
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

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final todayModel = await _repository.getTodayStatus();
      final history = await _repository.getHistory();

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
          _history = history;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
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
      appBar: AppBar(title: const Text('Absensi'), centerTitle: true),
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
                                const Text(
                                  'Status: Anda sudah absen masuk',
                                  style: TextStyle(color: Colors.green),
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
