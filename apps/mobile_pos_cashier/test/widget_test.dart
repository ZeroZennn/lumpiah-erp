// Widget tests for Lumpia POS application

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_pos_cashier/features/pos/bloc/cart_cubit.dart';
import 'package:mobile_pos_cashier/local_db/entities/local_product.dart';

void main() {
  group('CartCubit Unit Tests', () {
    late CartCubit cubit;

    setUp(() {
      cubit = CartCubit();
    });

    tearDown(() {
      cubit.close();
    });

    test('Initial state should have empty items and zero totals', () {
      expect(cubit.state.items, isEmpty);
      expect(cubit.state.totalAmount, 0.0);
      expect(cubit.state.totalQty, 0);
    });

    test('addToCart should add a new item to cart', () {
      final product = LocalProduct()
        ..serverId = 1
        ..name = 'Lumpia Ayam'
        ..category = 'Lumpia'
        ..price = 5000
        ..unit = 'pcs';

      cubit.addToCart(product);

      expect(cubit.state.items.length, 1);
      expect(cubit.state.items.first.product.name, 'Lumpia Ayam');
      expect(cubit.state.items.first.quantity, 1);
      expect(cubit.state.items.first.subtotal, 5000);
      expect(cubit.state.totalAmount, 5000);
      expect(cubit.state.totalQty, 1);
    });

    test('addToCart should increment quantity if product already exists', () {
      final product = LocalProduct()
        ..serverId = 1
        ..name = 'Lumpia Ayam'
        ..category = 'Lumpia'
        ..price = 5000
        ..unit = 'pcs';

      cubit.addToCart(product);
      cubit.addToCart(product);

      expect(cubit.state.items.length, 1);
      expect(cubit.state.items.first.quantity, 2);
      expect(cubit.state.items.first.subtotal, 10000);
      expect(cubit.state.totalAmount, 10000);
      expect(cubit.state.totalQty, 2);
    });

    test('addToCart should add multiple different products', () {
      final product1 = LocalProduct()
        ..serverId = 1
        ..name = 'Lumpia Ayam'
        ..category = 'Lumpia'
        ..price = 5000
        ..unit = 'pcs';

      final product2 = LocalProduct()
        ..serverId = 2
        ..name = 'Es Teh'
        ..category = 'Minuman'
        ..price = 3000
        ..unit = 'gelas';

      cubit.addToCart(product1);
      cubit.addToCart(product2);

      expect(cubit.state.items.length, 2);
      expect(cubit.state.totalAmount, 8000);
      expect(cubit.state.totalQty, 2);
    });

    test('removeFromCart should remove item by product serverId', () {
      final product = LocalProduct()
        ..serverId = 1
        ..name = 'Lumpia Ayam'
        ..category = 'Lumpia'
        ..price = 5000
        ..unit = 'pcs';

      cubit.addToCart(product);
      expect(cubit.state.items.length, 1);

      cubit.removeFromCart(1);
      expect(cubit.state.items, isEmpty);
      expect(cubit.state.totalAmount, 0.0);
      expect(cubit.state.totalQty, 0);
    });

    test('clearCart should reset state to initial values', () {
      final product = LocalProduct()
        ..serverId = 1
        ..name = 'Lumpia Ayam'
        ..category = 'Lumpia'
        ..price = 5000
        ..unit = 'pcs';

      cubit.addToCart(product);
      cubit.addToCart(product);
      expect(cubit.state.items.length, 1);
      expect(cubit.state.totalQty, 2);

      cubit.clearCart();

      expect(cubit.state.items, isEmpty);
      expect(cubit.state.totalAmount, 0.0);
      expect(cubit.state.totalQty, 0);
    });
  });
}
