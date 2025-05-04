import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    public afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private router: Router
  ) {}

  //Regisztráció
  async register(email: string, password: string) {
    const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    if (user) {
      await this.firestore.collection('users').doc(user.uid).set({
        email,
        createdAt: new Date()
      });
    }

    return user;
  }

  //Bejelentkezés
  async login(email: string, password: string) {
    return await this.afAuth.signInWithEmailAndPassword(email, password);
  }

  //Kijelentkezés
  async logout() {
    await this.afAuth.signOut();
    this.router.navigate(['/login']);
  }

  //Felhasználó adatainak lekérése
  getUserData(): Observable<any> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.firestore.collection('users').doc(user.uid).valueChanges();
        } else {
          return new Observable(sub => sub.next(null));
        }
      })
    );
  }
  getCurrentUserId(): Promise<string | null> {
    return new Promise(resolve => {
      this.afAuth.authState.subscribe(user => {
        resolve(user?.uid || null);
      });
    });
  }
  updateUserProfile(displayName: string, licensePlates: string[]) {
    return this.getCurrentUserId().then(uid => {
      if (!uid) throw new Error('Nem vagy bejelentkezve');
      return this.firestore.collection('users').doc(uid).update({
        displayName,
        licensePlates
      });
    });
  }
}