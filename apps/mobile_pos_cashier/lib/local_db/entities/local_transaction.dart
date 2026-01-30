import 'package:isar/isar.dart';

part 'local_transaction.g.dart';

/// Represents a transaction stored locally for offline-first capability.
@collection
class LocalTransaction {
  Id id = Isar.autoIncrement;

  @Index(unique: true)
  late String transactionId;

  late String payload;

  late DateTime createdAt;

  bool isSynced = false;

  /// Creates a LocalTransaction instance.
  LocalTransaction({
    required this.transactionId,
    required this.payload,
    required this.createdAt,
    this.isSynced = false,
  });

  /// Factory to create from Map (useful when reading raw JSON if needed, though Isar handles object storage).
  factory LocalTransaction.fromMap(Map<String, dynamic> map) {
    return LocalTransaction(
      transactionId: map['transactionId'] as String,
      payload: map['payload'] as String,
      createdAt: DateTime.parse(map['createdAt'] as String),
      isSynced: map['isSynced'] as bool? ?? false,
    );
  }

  /// Converts to Map.
  Map<String, dynamic> toMap() {
    return {
      'transactionId': transactionId,
      'payload': payload,
      'createdAt': createdAt.toIso8601String(),
      'isSynced': isSynced,
    };
  }
}
