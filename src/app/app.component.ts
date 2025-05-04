import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent {
  title = 'parkolo-app';
  constructor(private firestore: AngularFirestore) {
    this.firestore.collection('parkings').valueChanges().subscribe(data => {
      console.log('[Firestore TESZT]', data);
    });
  }
}