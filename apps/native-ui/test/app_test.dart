import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:native_ui/app/app.dart';
import 'package:native_ui/core/networking/api_client.dart';
import 'package:native_ui/core/storage/token_storage.dart';

void main() {
  testWidgets('renders sign in shell', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          apiClientProvider.overrideWithValue(
            ApiClient(
              baseUrl: 'http://localhost:3000',
              clientType: 'native',
              httpClient: MockClient(
                (_) async => http.Response('{}', 200),
              ),
            ),
          ),
          tokenStorageProvider.overrideWithValue(MemoryTokenStorage()),
        ],
        child: CreatorFlowApp(),
      ),
    );
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.text('Sign In'), findsOneWidget);
    expect(find.text('Enter Workspace'), findsOneWidget);
  });
}
