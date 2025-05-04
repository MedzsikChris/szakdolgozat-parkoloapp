import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertService } from 'src/app/services/alerts.service';

@Component({
  selector: 'app-report-modal',
  templateUrl: './report-modal.component.html',
})
export class ReportModalComponent {
  licensePlate: string = '';
  reason: string = '';

  reasons = [
    'Rossz helyen parkolás',
    'Szabálytalan parkolás',
    'Más helyre állt',
    'Érvénytelen foglalás'
  ];


  constructor(
    private modalCtrl: ModalController,
    private firestore: AngularFirestore,
    private alertService: AlertService
  ) {}
  

  async submitReport() {
    if (!this.licensePlate || !this.reason) {
      this.alertService.showError('Tölts ki minden mezőt!');
      return;
    }

    await this.firestore.collection('reports').add({
      licensePlate: this.licensePlate,
      reason: this.reason,
      date: new Date()
    });

    this.modalCtrl.dismiss();
    this.alertService.showSuccess('Köszönjük a bejelentést!');
  }

  close() {
    this.modalCtrl.dismiss();
  }
}