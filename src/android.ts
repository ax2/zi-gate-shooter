import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { runtime } from './canvas-preview';

if (Capacitor.isNativePlatform()) {
  void App.addListener('pause', () => runtime.hide());
  void App.addListener('resume', () => runtime.show());
  void App.addListener('backButton', () => {
    if (runtime.back() === 'exit') void App.exitApp();
  });
}
