import 'package:isar/isar.dart';

part 'local_product.g.dart';

@collection
class LocalProduct {
  Id id = Isar.autoIncrement; // ID lokal Isar

  @Index(unique: true)
  late int serverId; // ID dari PostgreSQL (product.id) [7]

  late String name;
  late String category; // Simpan nama kategorinya langsung biar mudah
  late double price; // Harga spesifik cabang (branch_product_prices) [8]
  late String unit;

  // Status sinkronisasi (Opsional, jika produk bisa diedit di tablet)
  bool isSynced = true;
}
