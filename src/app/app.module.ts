import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { IonicModule } from '@ionic/angular';

import { environment } from '../environments/environment';
import { AngularFireModule } from '@angular/fire/compat';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomeComponent } from './pages/home/home.component';
import { BookComponent } from './pages/book/book.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileModalComponent } from './pages/profile-modal/profile-modal.component';
import { MyBookingsComponent } from './pages/my-bookings/my-bookings.component';
import { AdminPanelComponent } from './pages/admin-panel/admin-panel.component';
import { ReportModalComponent } from './pages/report-modal/report-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    BookComponent,
    LoginComponent,
    RegisterComponent,
    ProfileModalComponent,
    MyBookingsComponent,
    AdminPanelComponent,
    ReportModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    IonicModule.forRoot({}),
    AngularFireModule.initializeApp(environment.firebaseConfig),
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
