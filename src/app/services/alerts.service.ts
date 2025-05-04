import { Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  async showError(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Hiba',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async showSuccess(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    toast.present();
  }

  async showConfirm(message: string, handler: () => void) {
    const alert = await this.alertCtrl.create({
      header: 'Megerősítés',
      message,
      buttons: [
        { text: 'Mégse', role: 'cancel' },
        { text: 'Igen', handler }
      ]
    });
    await alert.present();
  }
}