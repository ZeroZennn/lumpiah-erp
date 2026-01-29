import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile_pos_cashier/features/pos/bloc/cart_cubit.dart';
import 'package:mobile_pos_cashier/local_db/entities/local_product.dart';
import 'package:mobile_pos_cashier/features/pos/repositories/product_repository.dart';
import 'package:intl/intl.dart';

/// High-fidelity Modern POS Screen with Responsive Layout
/// - Tablet: Side-by-side layout (Product Catalog | Cart Panel)
/// - Phone: Stacked layout with bottom sheet cart
class PosScreen extends StatefulWidget {
  const PosScreen({super.key});

  @override
  State<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends State<PosScreen> {
  String _selectedCategory = 'Semua';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  // Category list
  final List<String> _categories = ['Semua', 'Lumpia', 'Minuman', 'Paket'];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // Determine if we're on a tablet based on screen width
  bool _isTablet(BuildContext context) {
    return MediaQuery.of(context).size.width >= 600;
  }

  @override
  Widget build(BuildContext context) {
    final isTablet = _isTablet(context);

    return Scaffold(
      body: SafeArea(
        child: isTablet ? _buildTabletLayout() : _buildPhoneLayout(),
      ),
      // Show FAB only on phone to open cart
      floatingActionButton: isTablet ? null : _buildCartFab(),
    );
  }

  // ============================================================================
  // TABLET LAYOUT - Side by side
  // ============================================================================
  Widget _buildTabletLayout() {
    return Row(
      children: [
        // LEFT SIDE - Product Catalog (Flex 7)
        Expanded(flex: 7, child: _buildProductCatalog(isTablet: true)),
        // RIGHT SIDE - Cart Panel (Flex 3)
        Expanded(flex: 3, child: _buildCartPanel()),
      ],
    );
  }

  // ============================================================================
  // PHONE LAYOUT - Full screen catalog with bottom sheet cart
  // ============================================================================
  Widget _buildPhoneLayout() {
    return _buildProductCatalog(isTablet: false);
  }

  Widget _buildCartFab() {
    return BlocBuilder<CartCubit, CartState>(
      builder: (context, state) {
        return FloatingActionButton.extended(
          onPressed: () => _showCartBottomSheet(context),
          backgroundColor: const Color(0xFFFFB300),
          icon: Badge(
            label: Text('${state.totalQty}'),
            isLabelVisible: state.totalQty > 0,
            child: const Icon(Icons.shopping_cart, color: Colors.white),
          ),
          label: Text(
            state.items.isEmpty
                ? 'Cart'
                : NumberFormat.currency(
                    locale: 'id_ID',
                    symbol: 'Rp ',
                    decimalDigits: 0,
                  ).format(state.totalAmount),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        );
      },
    );
  }

  void _showCartBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Cart content
              Expanded(
                child: _buildCartPanelContent(
                  scrollController: scrollController,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ============================================================================
  // Product Catalog Section
  // ============================================================================
  Widget _buildProductCatalog({required bool isTablet}) {
    final crossAxisCount = isTablet ? 4 : 2;
    final childAspectRatio = isTablet ? 0.85 : 0.75;

    return Container(
      color: const Color(0xFFF5F5F5),
      child: Column(
        children: [
          // Header with search and categories
          _buildCatalogHeader(isTablet: isTablet),
          // Product Grid with FutureBuilder
          Expanded(
            child: FutureBuilder<List<LocalProduct>>(
              future: ProductRepository().fetchProducts(),
              builder: (context, snapshot) {
                // Loading State
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: CircularProgressIndicator(color: Color(0xFFFFB300)),
                  );
                }

                // Error State
                if (snapshot.hasError) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Error loading menu',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          snapshot.error.toString(),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  );
                }

                // Success State - Filter products
                final allProducts = snapshot.data ?? [];
                final filteredProducts = allProducts.where((product) {
                  final matchesCategory =
                      _selectedCategory == 'Semua' ||
                      product.category == _selectedCategory;
                  final matchesSearch = product.name.toLowerCase().contains(
                    _searchQuery.toLowerCase(),
                  );
                  return matchesCategory && matchesSearch;
                }).toList();

                // Empty state
                if (filteredProducts.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.search_off,
                          size: 64,
                          color: Colors.grey[300],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No products found',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  );
                }

                // GridView with real data
                return Padding(
                  padding: EdgeInsets.fromLTRB(
                    isTablet ? 20 : 12,
                    0,
                    isTablet ? 12 : 12,
                    isTablet ? 20 : 80, // Extra padding for FAB on phone
                  ),
                  child: GridView.builder(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: crossAxisCount,
                      childAspectRatio: childAspectRatio,
                      crossAxisSpacing: isTablet ? 16 : 10,
                      mainAxisSpacing: isTablet ? 16 : 10,
                    ),
                    itemCount: filteredProducts.length,
                    itemBuilder: (context, index) {
                      return _ProductCard(
                        product: filteredProducts[index],
                        isCompact: !isTablet,
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCatalogHeader({required bool isTablet}) {
    return Padding(
      padding: EdgeInsets.all(isTablet ? 20 : 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title and Search Row
          if (isTablet)
            Row(
              children: [
                const Text(
                  'Menu',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2D2D2D),
                  ),
                ),
                const SizedBox(width: 24),
                Expanded(child: _buildSearchBar()),
              ],
            )
          else
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Menu',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2D2D2D),
                  ),
                ),
                const SizedBox(height: 12),
                _buildSearchBar(),
              ],
            ),
          SizedBox(height: isTablet ? 20 : 12),
          // Category Chips
          SizedBox(
            height: 40,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _categories.length,
              itemBuilder: (context, index) {
                final category = _categories[index];
                final isSelected = _selectedCategory == category;
                return Padding(
                  padding: EdgeInsets.only(right: isTablet ? 12 : 8),
                  child: _CategoryChip(
                    label: category,
                    isSelected: isSelected,
                    isCompact: !isTablet,
                    onTap: () => setState(() => _selectedCategory = category),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(15),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (value) => setState(() => _searchQuery = value),
        decoration: InputDecoration(
          hintText: 'Cari produk...',
          hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
          prefixIcon: Icon(Icons.search, color: Colors.grey[400], size: 20),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear, size: 18),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => _searchQuery = '');
                  },
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
        ),
      ),
    );
  }

  // ============================================================================
  // Cart Panel Section
  // ============================================================================
  Widget _buildCartPanel() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(20),
            blurRadius: 20,
            offset: const Offset(-4, 0),
          ),
        ],
      ),
      child: _buildCartPanelContent(),
    );
  }

  Widget _buildCartPanelContent({ScrollController? scrollController}) {
    return Column(
      children: [
        // Cart Header
        _buildCartHeader(),
        // Cart Items List
        Expanded(child: _buildCartItems(scrollController: scrollController)),
        // Cart Footer with totals and checkout
        _buildCartFooter(),
      ],
    );
  }

  Widget _buildCartHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'Current Order',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D2D2D),
            ),
          ),
          BlocBuilder<CartCubit, CartState>(
            builder: (context, state) {
              if (state.items.isEmpty) return const SizedBox.shrink();
              return TextButton.icon(
                onPressed: () => context.read<CartCubit>().clearCart(),
                icon: const Icon(Icons.delete_outline, size: 16),
                label: const Text('Clear'),
                style: TextButton.styleFrom(foregroundColor: Colors.red[400]),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCartItems({ScrollController? scrollController}) {
    return BlocBuilder<CartCubit, CartState>(
      builder: (context, state) {
        if (state.items.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.shopping_basket_outlined,
                  size: 64,
                  color: Colors.grey[300],
                ),
                const SizedBox(height: 12),
                Text(
                  'Keranjang kosong',
                  style: TextStyle(fontSize: 14, color: Colors.grey[400]),
                ),
                const SizedBox(height: 4),
                Text(
                  'Pilih produk untuk memulai',
                  style: TextStyle(fontSize: 12, color: Colors.grey[400]),
                ),
              ],
            ),
          );
        }

        return ListView.separated(
          controller: scrollController,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          itemCount: state.items.length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, index) =>
              _CartItemTile(item: state.items[index]),
        );
      },
    );
  }

  Widget _buildCartFooter() {
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    return BlocBuilder<CartCubit, CartState>(
      builder: (context, state) {
        final subtotal = state.totalAmount;
        final tax = subtotal * 0.1;
        final total = subtotal + tax;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(15),
                blurRadius: 10,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildSummaryRow('Subtotal', formatter.format(subtotal)),
                const SizedBox(height: 4),
                _buildSummaryRow('Tax (10%)', formatter.format(tax)),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Divider(),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Total',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2D2D2D),
                      ),
                    ),
                    Text(
                      formatter.format(total),
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFFFB300),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: state.items.isEmpty
                        ? null
                        : () {
                            Navigator.of(
                              context,
                            ).pop(); // Close bottom sheet if open
                            ScaffoldMessenger.of(context).clearSnackBars();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Processing: ${formatter.format(total)}',
                                ),
                                backgroundColor: const Color(0xFFFFB300),
                              ),
                            );
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFFB300),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.grey[300],
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      state.items.isEmpty
                          ? 'Select Items'
                          : 'Charge - ${formatter.format(total)}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 13, color: Colors.grey[600])),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Color(0xFF2D2D2D),
          ),
        ),
      ],
    );
  }
}

// ============================================================================
// Category Chip Widget
// ============================================================================
class _CategoryChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final bool isCompact;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.isCompact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isSelected ? const Color(0xFFFFB300) : Colors.white,
      borderRadius: BorderRadius.circular(20),
      elevation: isSelected ? 2 : 0,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: EdgeInsets.symmetric(
            horizontal: isCompact ? 16 : 24,
            vertical: isCompact ? 8 : 10,
          ),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? Colors.transparent : Colors.grey[300]!,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: isCompact ? 13 : 14,
              color: isSelected ? Colors.white : Colors.grey[600],
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }
}

// ============================================================================
// Product Card Widget
// ============================================================================
class _ProductCard extends StatelessWidget {
  final LocalProduct product;
  final bool isCompact;

  const _ProductCard({required this.product, this.isCompact = false});

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    return Card(
      elevation: 2,
      shadowColor: Colors.black.withAlpha(20),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(isCompact ? 12 : 16),
      ),
      child: InkWell(
        onTap: () {
          context.read<CartCubit>().addToCart(product);
          ScaffoldMessenger.of(context).clearSnackBars();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${product.name} added'),
              duration: const Duration(milliseconds: 500),
              behavior: SnackBarBehavior.floating,
            ),
          );
        },
        borderRadius: BorderRadius.circular(isCompact ? 12 : 16),
        child: Padding(
          padding: EdgeInsets.all(isCompact ? 10 : 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product Image Placeholder
              Expanded(
                child: Center(
                  child: Container(
                    width: isCompact ? 50 : 80,
                    height: isCompact ? 50 : 80,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF8E1),
                      borderRadius: BorderRadius.circular(isCompact ? 10 : 16),
                    ),
                    child: Icon(
                      _getCategoryIcon(product.category),
                      size: isCompact ? 28 : 40,
                      color: const Color(0xFFFFB300),
                    ),
                  ),
                ),
              ),
              SizedBox(height: isCompact ? 6 : 12),
              // Product Name
              Text(
                product.name,
                style: TextStyle(
                  fontSize: isCompact ? 12 : 15,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF2D2D2D),
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              SizedBox(height: isCompact ? 2 : 4),
              // Price
              Text(
                formatter.format(product.price),
                style: TextStyle(
                  fontSize: isCompact ? 13 : 16,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFFFFB300),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'lumpia':
        return Icons.restaurant;
      case 'minuman':
        return Icons.local_cafe;
      case 'paket':
        return Icons.lunch_dining;
      default:
        return Icons.fastfood;
    }
  }
}

// ============================================================================
// Cart Item Tile Widget
// ============================================================================
class _CartItemTile extends StatelessWidget {
  final CartItem item;

  const _CartItemTile({required this.item});

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    );

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F9F9),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          // Product Icon
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFFFF8E1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.restaurant,
              color: Color(0xFFFFB300),
              size: 20,
            ),
          ),
          const SizedBox(width: 10),
          // Product Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.product.name,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF2D2D2D),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  formatter.format(item.subtotal),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFFFB300),
                  ),
                ),
              ],
            ),
          ),
          // Quantity Controls
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _QuantityButton(
                icon: Icons.remove,
                onTap: () {
                  if (item.quantity > 1) {
                    // TODO: Implement decrease quantity
                  } else {
                    context.read<CartCubit>().removeFromCart(
                      item.product.serverId,
                    );
                  }
                },
              ),
              Container(
                width: 28,
                alignment: Alignment.center,
                child: Text(
                  '${item.quantity}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2D2D2D),
                  ),
                ),
              ),
              _QuantityButton(
                icon: Icons.add,
                isPrimary: true,
                onTap: () => context.read<CartCubit>().addToCart(item.product),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// Quantity Button Widget
// ============================================================================
class _QuantityButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool isPrimary;

  const _QuantityButton({
    required this.icon,
    required this.onTap,
    this.isPrimary = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isPrimary ? const Color(0xFFFFB300) : Colors.grey[200],
      borderRadius: BorderRadius.circular(6),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(6),
        child: SizedBox(
          width: 28,
          height: 28,
          child: Icon(
            icon,
            size: 16,
            color: isPrimary ? Colors.white : Colors.grey[600],
          ),
        ),
      ),
    );
  }
}
