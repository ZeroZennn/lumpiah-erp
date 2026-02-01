class DailyClosingPreview {
  final double totalCashSystem;
  final double totalQrisSystem;
  final DateTime date;
  final bool isClosed;
  final DailyClosingResult? closingData;

  DailyClosingPreview({
    required this.totalCashSystem,
    required this.totalQrisSystem,
    required this.date,
    this.isClosed = false,
    this.closingData,
  });

  factory DailyClosingPreview.fromJson(Map<String, dynamic> json) {
    return DailyClosingPreview(
      totalCashSystem:
          double.tryParse(json['systemCash']?.toString() ?? '0') ?? 0.0,
      totalQrisSystem:
          double.tryParse(json['systemQris']?.toString() ?? '0') ?? 0.0,
      date: DateTime.now(),
      isClosed: json['isClosed'] as bool? ?? false,
      closingData: json['closingData'] != null
          ? DailyClosingResult.fromJson(json['closingData'])
          : null,
    );
  }
}

class DailyClosingResult {
  final int id;
  final double totalCashActual;
  final double totalQrisActual;
  final String? closingNote;
  final String status;

  DailyClosingResult({
    required this.id,
    required this.totalCashActual,
    required this.totalQrisActual,
    this.closingNote,
    required this.status,
  });

  factory DailyClosingResult.fromJson(Map<String, dynamic> json) {
    return DailyClosingResult(
      id: json['id'] as int,
      totalCashActual:
          double.tryParse(json['totalCashActual']?.toString() ?? '0') ?? 0.0,
      totalQrisActual:
          double.tryParse(json['totalQrisActual']?.toString() ?? '0') ?? 0.0,
      closingNote: json['closingNote'] as String?,
      status: json['status'] as String? ?? 'CLOSED',
    );
  }
}
