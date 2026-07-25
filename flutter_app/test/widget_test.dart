import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ez_workspace/theme/app_theme.dart';

void main() {
  testWidgets('App theme builds', (WidgetTester tester) async {
    await tester.pumpWidget(MaterialApp(
      theme: AppTheme.light(),
      home: const Scaffold(body: Center(child: Text('EZ-Workspace'))),
    ));
    expect(find.text('EZ-Workspace'), findsOneWidget);
  });
}
