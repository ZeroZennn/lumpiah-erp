import 'package:isar/isar.dart';

part 'local_transaction.g.dart';

@collection
class LocalTransaction {
  Id id = Isar.autoIncrement;

  @Index(unique: true)
  late String uuid; // Generate pakai package 'uuid' [2]

  late int branchId;
  late int userId;
  late DateTime transactionDate;

  late double totalAmount;
  late String paymentMethod; // 'CASH' or 'QRIS'
  late String status; // 'DRAFT', 'PAID' [2]

  // Relasi ke Item (Isar Links)
  final items = IsarLinks<LocalTransactionItem>();

  // KUNCI OFFLINE MODE [9]
  // 0 = Belum dikirim ke server, 1 = Sudah
  @Index()
  int syncStatus = 0;
}

@collection
class LocalTransactionItem {
  Id id = Isar.autoIncrement;

  late int productId;
  late String productName;
  late int quantity;
  late double priceAtTransaction; // Snapshot harga [10]
  late double subtotal;
}
