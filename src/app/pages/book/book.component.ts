import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from 'src/app/services/auth.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AlertService } from 'src/app/services/alerts.service';
import { ModalController } from '@ionic/angular';
import { ReportModalComponent } from '../report-modal/report-modal.component';

interface ParkingSpot {
  name: string;
  top: string;
  left: string;
  type: 'normal' | 'disabled' | 'covered';
  booked: boolean;
}

@Component({
  selector: 'app-book',
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.scss']
})
export class BookComponent implements OnInit {
  /*parkingSpots: ParkingSpot[] = [
    { name: 'A1', top: '33%', left: '20%', type: 'normal', booked: false },
    { name: 'A2', top: '33%', left: '40%', type: 'disabled', booked: false },
    { name: 'A3', top: '33%', left: '60%', type: 'disabled', booked: false },
    { name: 'A4', top: '33%', left: '82%', type: 'normal', booked: false },
    { name: 'B1', top: '58%', left: '20%', type: 'normal', booked: false },
    { name: 'B2', top: '58%', left: '40%', type: 'normal', booked: false },
    { name: 'B3', top: '58%', left: '60%', type: 'normal', booked: false },
    { name: 'B4', top: '58%', left: '82%', type: 'normal', booked: false },
    { name: 'C1', top: '82%', left: '20%', type: 'normal', booked: false },
    { name: 'C2', top: '82%', left: '40%', type: 'normal', booked: false },
    { name: 'C3', top: '82%', left: '60%', type: 'normal', booked: false },
    { name: 'C4', top: '82%', left: '82%', type: 'covered', booked: false }
  ];*/

  selectedSpot: ParkingSpot | null = null;
  licensePlates: string[] = [];
  selectedPlate: string = '';
  userId: string | null = null;
  filteredSpots: ParkingSpot[] = [];

  selectedLot: any = null;
  selectedLotId: string = '';
  parkingLots: any[] = [];

  fromDate: string = '';
  toDate: string = '';

  filters = {
    normal: true,
    disabled: true,
    covered: true
  };

  constructor(
    private firestore: AngularFirestore,
    private authService: AuthService,
    private afAuth: AngularFireAuth,
    private alertService: AlertService,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.loadBookings();
    this.loadLots();
    //this.filteredSpots = [...this.parkingSpots];
    this.afAuth.authState.subscribe(user => {
      this.userId = user?.uid || null;
    });
  
    this.authService.getUserData().subscribe((data: any) => {
      this.licensePlates = data?.licensePlates || [];
      this.selectedPlate = this.licensePlates[0] || '';
    });
  }


  loadBookings() {
    if (!this.selectedLot) return;

    const now = new Date();
    this.firestore.collection('bookings', ref =>
      ref
        .where('parkingLotId', '==', this.selectedLot!.id)
        .where('to', '>=', now)
        .where('status', '==', 'active')
    ).valueChanges().subscribe((bookings: any[]) => {
      this.selectedLot!.spots.forEach((spot: { booked: boolean; name: any; }) => {
        spot.booked = bookings.some(b =>
          b.parkingId === spot.name &&
          new Date(b.from.seconds * 1000) <= now &&
          new Date(b.to.seconds * 1000) >= now
        );
      });
      this.applyFilters();
    });
  }

  selectSpot(spot: ParkingSpot, event: MouseEvent) {
    event.stopPropagation();
    if (spot.booked) return;
    this.selectedSpot = spot;
  }

  async book() {
    console.log(this.userId)
    if (!this.selectedSpot || !this.userId || !this.selectedPlate || !this.fromDate || !this.toDate) {
      this.alertService.showError('Kérlek tölts ki minden mezőt!');
      return;
    }

    const from = new Date(this.fromDate);
    const to = new Date(this.toDate);

    if (to <= from) {
      this.alertService.showError('A végdátum nem lehet korábbi, mint a kezdődátum.');
      return;
    }

    // Heti ellenőrzés (csak aktuális hét, hétfő–péntek)
    const now = new Date();
    const monday = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 4);
    sunday.setHours(23, 59, 59, 999);

    if (from < monday || to > sunday) {
      this.alertService.showError('Csak az aktuális hétfőtől péntekig lehet foglalni.');
      return;
    }

    // Felhasználó már foglalt?
    const activeBookingSnapshot = await this.firestore.collection('bookings', ref =>
      ref.where('userId', '==', this.userId!)
         .where('to', '>=', new Date())
         .where('status', '==', 'active')
    ).get().toPromise();
    
    if (!activeBookingSnapshot?.empty) {
      this.alertService.showError('Már van aktív foglalásod másik parkolóban. Előbb azt kell lemondanod.');
      return;
    }

    // Ütközés ellenőrzés a parkolóhelyen
    const overlapSnapshot = await this.firestore.collection('bookings', ref =>
      ref.where('parkingId', '==', this.selectedSpot!.name)
         .where('to', '>=', from)
         .where('from', '<=', to)
         .where('status', '==', 'active')
    ).get().toPromise();

    if (!overlapSnapshot?.empty) {
      this.alertService.showError('Ez a parkoló már foglalt a kiválasztott időben.');
      return;
    }

    const booking = {
      userId: this.userId,
      plate: this.selectedPlate,
      parkingId: this.selectedSpot.name,
      parkingLotId: this.selectedLot?.id,
      type: this.selectedSpot.type,
      from,
      to,
      status: 'active',
      createdAt: new Date()
    };

    await this.firestore.collection('bookings').add(booking);

    this.alertService.showSuccess('Foglalás sikeres!');
    this.loadBookings();

    // Reset
    this.selectedSpot = null;
    this.fromDate = '';
    this.toDate = '';
    this.selectedPlate = this.licensePlates[0] || '';
  }

  applyFilters() {
    const anySelected = Object.values(this.filters).some(Boolean);
    this.filteredSpots = anySelected
    ? this.selectedLot.spots.filter((spot: ParkingSpot) =>
        this.filters[spot.type as 'normal' | 'disabled' | 'covered']
      )
    : [];
  }

  updateSelectedLot() {
    this.selectedLot = this.parkingLots.find(lot => lot.id === this.selectedLotId) || null;
  this.selectedSpot = null;
  this.applyFilters();
  this.loadBookings();
}

  loadLots() {
    this.firestore.collection('parkings').snapshotChanges().subscribe(snapshot => {
      const lots = snapshot.map(doc => {
        const data = doc.payload.doc.data() as any;
        return {
          id: doc.payload.doc.id,
          name: data.name,
          type: data.type,
          imageUrl: data.imageUrl || '',
          spots: data.spots.map((s: any) => ({
            name: s.name,
            type: s.type,
            top: s.top,
            left: s.left,
            booked: false
          }))
        };
      });
  
      this.parkingLots = lots;
  
      if (!this.selectedLotId && lots.length) {
        this.selectedLotId = lots[0].id;
        this.updateSelectedLot();
      }
    });
  }

  onLotChange() {
    this.selectedLot = this.parkingLots.find(lot => lot.id === this.selectedLotId) || null;
    this.filteredSpots = this.selectedLot?.spots || [];
    this.loadBookings();
  }

  async openReportModal() {
    const modal = await this.modalCtrl.create({
      component: ReportModalComponent
    });
    await modal.present();
  }
}
