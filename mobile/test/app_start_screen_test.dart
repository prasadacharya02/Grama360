import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:grama360/app/app.dart';

void main() {
  testWidgets('first launch asks the user to choose English or Kannada', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: Grama360App(),
      ),
    );

    expect(find.text('Select your language\nಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ'), findsOneWidget);
    expect(find.text('ಕನ್ನಡ'), findsOneWidget);
    expect(find.text('English'), findsOneWidget);
  });
}
