class AttendanceModel {
  final int id;
  final int userId;
  final int branchId;
  final DateTime date;
  final DateTime clockIn;
  final DateTime? clockOut;
  final int? shiftId;
  final String? correctionNote;

  AttendanceModel({
    required this.id,
    required this.userId,
    required this.branchId,
    required this.date,
    required this.clockIn,
    this.clockOut,
    this.shiftId,
    this.correctionNote,
  });

  factory AttendanceModel.fromJson(Map<String, dynamic> json) {
    return AttendanceModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      userId: json['userId'],
      branchId: json['branchId'],
      date: DateTime.parse(json['date']),
      clockIn: DateTime.parse(json['clockIn']),
      clockOut: json['clockOut'] != null
          ? DateTime.parse(json['clockOut'])
          : null,
      shiftId: json['shiftId'],
      correctionNote: json['correctionNote'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'branchId': branchId,
      'date': date.toIso8601String(),
      'clockIn': clockIn.toIso8601String(),
      'clockOut': clockOut?.toIso8601String(),
      'shiftId': shiftId,
      'correctionNote': correctionNote,
    };
  }
}
