import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertService } from 'src/app/services/alerts.service';


@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent {


  constructor(
    private firestore: AngularFirestore,
    private alertService: AlertService
  ){}

  bookings: any[] = [];
  users: any[] = [];
  reports: any[] = [];

ngOnInit() {
  this.loadBookings();
  this.firestore.collection('users').valueChanges({ idField: 'id' }).subscribe(data => {
    this.users = data;
  });

  this.firestore.collection('reports').valueChanges({ idField: 'id' }).subscribe(res => {
    this.reports = res;
  });

}

loadBookings() {
  this.firestore.collection('bookings', ref =>
    ref.where('status', 'in', ['active', null]) // akkor is listáz ha nincs status mező
  ).snapshotChanges().subscribe(snapshot => {
    this.bookings = snapshot.map(doc => ({
      id: doc.payload.doc.id,
      ...doc.payload.doc.data() as any
    }));
  });
}

formatDate(date: any): string {
  return new Date(date.seconds * 1000).toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

async cancelBooking(bookingId: string) {
  const confirm = await this.alertService.showConfirm(
    'Biztosan törölni szeretnéd ezt a foglalást?',
    async () => {
      await this.firestore.collection('bookings').doc(bookingId).update({ status: 'cancelled' });
      this.alertService.showSuccess('Foglalás törölve.');
    }
  );
}

warnUser(user: any) {
  const now = new Date();
  const warns = user.warns || [];

  warns.push({ date: now.toISOString(), reason: 'Admin figyelmeztetés' });

  const banUntil = warns.length >= 3 ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : null;

  const updateData: any = { warns };
  if (banUntil) {
    updateData.banUntil = banUntil;
  }

  this.firestore.collection('users').doc(user.id).set(updateData, { merge: true })
    .then(() => {
      this.alertService.showError(warns.length >= 3 ? '⚠️ Figyelmeztetés mentve! A felhasználó 1 hétre tiltva.' : '⚠️ Figyelmeztetés mentve.');
    })
    .catch(err => {
      console.error('Warn mentési hiba:', err);
      this.alertService.showError('Hiba történt a figyelmeztetés mentése közben.');
    });
}

deleteReport(reportId: string) {
  this.firestore.collection('reports').doc(reportId).delete().then(() => {
    this.alertService.showSuccess('Bejelentés törölve.');
  }).catch(err => {
    console.error('Hiba történt a törlésnél:', err);
    this.alertService.showError('Nem sikerült törölni a bejelentést.');
  });
}

}