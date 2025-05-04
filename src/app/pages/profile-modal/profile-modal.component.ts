import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertService } from 'src/app/services/alerts.service';

@Component({
  selector: 'app-profile-modal',
  templateUrl: './profile-modal.component.html',
  styleUrls: ['./profile-modal.component.scss']
})
export class ProfileModalComponent implements OnInit {
  displayName: string = '';
  licensePlates: string[] = [];
  newPlate: string = '';

  userId: string | null = null;

  constructor(
    private modalCtrl: ModalController,
    private firestore: AngularFirestore,
    private authService: AuthService,
    private alertService: AlertService
  ) {}

  async ngOnInit() {
    this.userId = await this.authService.getCurrentUserId() ?? null;

    if (this.userId) {
      this.firestore.collection('users').doc(this.userId).valueChanges().subscribe((user: any) => {
        this.displayName = user?.displayName || '';
        this.licensePlates = user?.licensePlates || [];
      });
    }
  }

  addPlate() {
    const plate = this.newPlate.trim().toUpperCase();
    const pattern1 = /^[A-Z]{3}\d{3}$/;
    const pattern2 = /^[A-Z]{4}\d{3}$/;

    if (!plate || (!pattern1.test(plate) && !pattern2.test(plate))) {
      this.alertService.showError('Hibás formátum! (ABC123 vagy ABCD123)');
      return;
    }

    if (this.licensePlates.includes(plate)) {
      this.alertService.showError('Ez a rendszám már szerepel.');
      return;
    }

    if (this.licensePlates.length >= 2) {
      this.alertService.showError('Legfeljebb 2 rendszámot adhatsz meg.');
      return;
    }

    this.licensePlates.push(plate);
    this.newPlate = '';
  }

  removePlate(plate: string) {
    this.licensePlates = this.licensePlates.filter(p => p !== plate);
  }

  async save() {
    if (!this.userId) return;

    try {
      await this.firestore.collection('users').doc(this.userId).update({
        displayName: this.displayName,
        licensePlates: this.licensePlates
      });

      this.modalCtrl.dismiss({
        displayName: this.displayName,
        licensePlates: this.licensePlates
      });
    } catch (err) {
      console.error('Mentési hiba:', err);
      this.alertService.showError('Nem sikerült menteni az adatokat.');
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}