import 'package:flutter_riverpod/flutter_riverpod.dart';

class AppShellController extends Notifier<int> {
  @override
  int build() => 0;

  void selectIndex(int index) {
    state = index;
  }
}

final appShellIndexProvider = NotifierProvider<AppShellController, int>(
  AppShellController.new,
);
