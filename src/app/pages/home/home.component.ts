import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from 'src/app/services/auth.service';
import { ProfileModalComponent } from '../profile-modal/profile-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  displayName = '';
  licensePlates: string[] = [];
  remainingTime: string | null = null;
  private refreshInterval: any;
  isAdmin: boolean = false;
  banCountdown: number = 0;
  intervalRef: any = null;

  constructor(
    public authService: AuthService,
    private modalCtrl: ModalController,
    private firestore: AngularFirestore
  ) {}

  async openProfile() {
    const modal = await this.modalCtrl.create({
      component: ProfileModalComponent,
      componentProps: {
        displayName: this.displayName,
        licensePlates: [...this.licensePlates]
      }
    });

    modal.onDidDismiss().then(result => {
      const data = result.data;
      if (data) {
        this.displayName = data.displayName;
        this.licensePlates = data.licensePlates;
      }
    });

    return await modal.present();
  }

  ngOnInit() {
    this.authService.getUserData().subscribe((userData: any) => {
      this.displayName = userData?.displayName || '';
      this.isAdmin = userData?.role === 'admin';
    });
    this.authService.getUserData().subscribe((userData: any) => {
      this.displayName = userData?.displayName || '';
    });

    this.authService.getUserData().subscribe((user: any) => {
      if (user?.banUntil) {
        const now = new Date().getTime();
        const banEnd = new Date(user.banUntil.seconds * 1000).getTime(); // Firestore timestamp
        const diff = Math.floor((banEnd - now) / 1000);
        this.banCountdown = diff > 0 ? diff : 0;
  
        if (this.banCountdown > 0) {
          this.startCountdown();
        }
      }
    });

    this.authService.afAuth.authState.subscribe(async user => {
      if (!user) return;

      const updateRemainingTime = async () => {
        const now = new Date();
      
        try {
          const snapshot = await this.firestore.collection('bookings', ref =>
            ref
              .where('userId', '==', user.uid)
              .where('to', '>', now)
          ).get().toPromise();
      
          const allBookings = snapshot?.docs.map(doc => doc.data() as any);
      
          if (!allBookings || allBookings.length === 0) {
            console.log('Nincs aktív foglalás (nincs találat)');
            this.remainingTime = null;
            return;
          }
      
          // Szűrés frontend oldalon a töröltekre
          const validBookings = allBookings.filter(b => b.status !== 'cancelled');
      
          if (validBookings.length === 0) {
            console.log('Csak törölt foglalások vannak');
            this.remainingTime = null;
            return;
          }
      
          const booking = validBookings[0]; // az első aktív foglalás
      
          if (!booking.to?.toDate) {
            console.warn('Hiányzó vagy hibás to mező:', booking.to);
            this.remainingTime = null;
            return;
          }
      
          const toDate = booking.to.toDate();
          const diffMs = toDate.getTime() - now.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
          this.remainingTime = `${diffHours} óra ${diffMinutes} perc`;
      
          console.log('Fennmaradt idő:', this.remainingTime);
      
        } catch (err) {
          console.error('Hiba a foglalás lekérdezésekor:', err);
          this.remainingTime = null;
        }
      };

      await updateRemainingTime();
      this.refreshInterval = setInterval(updateRemainingTime, 60 * 1000);
    });
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  startCountdown() {
    this.intervalRef = setInterval(() => {
      this.banCountdown--;
      if (this.banCountdown <= 0 && this.intervalRef) {
        clearInterval(this.intervalRef);
        this.intervalRef = null;
      }
    }, 1000);
  }
  
  formatCountdown(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h} óra ${m} perc ${s} másodperc`;
  }

}