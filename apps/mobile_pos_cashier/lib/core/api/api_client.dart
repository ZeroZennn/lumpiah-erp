import 'dart:io';
import 'package:dio/dio.dart';

class ApiClient {
  // Singleton pattern
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late Dio _dio;

  ApiClient._internal() {
    // Tentukan Base URL
    // Android Emulator TIDAK BISA pakai 'localhost'. Harus '10.0.2.2'.
    // Jika pakai HP Fisik, ganti dengan IP Laptop (misal: '192.168.1.5')
    String baseUrl = Platform.isAndroid
        ? 'http://10.0.2.2:3000'
        : 'http://localhost:3000';

    BaseOptions options = BaseOptions(
      baseUrl: baseUrl,
      // KITA NAIKKAN JADI 15 DETIK (Saran Error tadi)
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    );

    _dio = Dio(options);

    // Tambahkan Log agar kita tahu apa yang terjadi (PENTING BUAT DEBUG)
    _dio.interceptors.add(
      LogInterceptor(
        request: true,
        requestBody: true,
        responseBody: true,
        error: true,
      ),
    );
  }

  Dio get dio => _dio;
}
