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

  // Unnamed constructor (required for Isar and object instantiation)
  LocalProduct();

  /// Factory constructor untuk parsing dari JSON API response
  /// Expected JSON structure:
  /// {
  ///   "id": 1,
  ///   "name": "Lumpia Goreng",
  ///   "category": "Lumpia",  // or "categoryName" or nested "category.name"
  ///   "price": 5000.0,       // final calculated price for this branch
  ///   "unit": "pcs"
  /// }
  factory LocalProduct.fromJson(Map<String, dynamic> json) {
    return LocalProduct()
      ..serverId = json['id'] as int
      ..name = json['name'] as String
      ..category = _extractCategory(json)
      ..price = _extractPrice(json)
      ..unit = json['unit'] as String? ?? 'pcs'
      ..isSynced = true;
  }

  /// Helper to extract category name from various possible JSON structures
  static String _extractCategory(Map<String, dynamic> json) {
    // Handle different possible structures:
    // 1. Direct category name: {"category": "Lumpia"}
    if (json['category'] is String) {
      return json['category'] as String;
    }
    // 2. Nested category object: {"category": {"name": "Lumpia"}}
    if (json['category'] is Map && json['category']['name'] != null) {
      return json['category']['name'] as String;
    }
    // 3. Alternative field: {"categoryName": "Lumpia"}
    if (json['categoryName'] != null) {
      return json['categoryName'] as String;
    }
    // Fallback
    return 'Unknown';
  }

  /// Helper to extract price from various possible JSON structures
  static double _extractPrice(Map<String, dynamic> json) {
    final dynamic priceValue = json['price'];

    if (priceValue is double) {
      return priceValue;
    } else if (priceValue is int) {
      return priceValue.toDouble();
    } else if (priceValue is String) {
      return double.tryParse(priceValue) ?? 0.0;
    }

    // Fallback: try basePrice if price is not available
    final dynamic basePriceValue = json['basePrice'];
    if (basePriceValue != null) {
      if (basePriceValue is double) return basePriceValue;
      if (basePriceValue is int) return basePriceValue.toDouble();
      if (basePriceValue is String) {
        return double.tryParse(basePriceValue) ?? 0.0;
      }
    }

    return 0.0;
  }

  /// Convert to JSON for debugging or API sync
  Map<String, dynamic> toJson() {
    return {
      'id': serverId,
      'name': name,
      'category': category,
      'price': price,
      'unit': unit,
      'isSynced': isSynced,
    };
  }
}
