import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from 'src/app/services/auth.service';

interface Booking {
  id: string;
  parkingId: string;
  plate: string;
  from: any;
  to: any;
  status?: string;
}

@Component({
  selector: 'app-my-bookings',
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.scss']
})
export class MyBookingsComponent implements OnInit {
  activeBookings: any[] = [];
  expiredBookings: any[] = [];
  cancelledBookings: any[] = [];
  userId: string | null = null;

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    console.log('[MyBookings] Komponens inicializálása...');

    // Felhasználó bejelentkezésének figyelése
    this.authService.afAuth.authState.subscribe(user => {
      if (!user) {
        console.warn('[MyBookings] Nincs bejelentkezett felhasználó');
        return;
      }

      this.userId = user.uid;
      console.log('[MyBookings] Bejelentkezett felhasználó ID:', this.userId);

      // Foglalások lekérdezése a Firestore-ból
      this.firestore.collection('bookings', ref =>
        ref.where('userId', '==', this.userId)
      ).valueChanges({ idField: 'id' }).subscribe({
        next: (data: any[]) => {
          const now = new Date();

          this.activeBookings = data.filter(b =>
            (b.status !== 'cancelled') && b.to.toDate() > now
          );

          this.expiredBookings = data.filter(b =>
            (b.status !== 'cancelled') && b.to.toDate() <= now
          );

          this.cancelledBookings = data.filter(b =>
            b.status === 'cancelled'
          );

          console.log('[MyBookings] Foglalások szétválogatva:', {
            aktiv: this.activeBookings.length,
            lejart: this.expiredBookings.length,
            torolt: this.cancelledBookings.length
          });
        },
        error: err => {
          console.error('[MyBookings] Hiba a lekérdezés során:', err);
        }
      });
    });
  }

  // Foglalás törlése (státusz módosítása "cancelled"-re)
  deleteBooking(bookingId: string) {
    this.firestore.collection('bookings').doc(bookingId).update({
      status: 'cancelled'
    }).then(() => {
      console.log('[MyBookings] Foglalás törölve (cancelled):', bookingId);
    }).catch(err => {
      console.error('[MyBookings] Hiba törlés közben:', err);
    });
  }
}