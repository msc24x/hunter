import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from './common/common.module';
import { NotFoundComponent } from './common/pages/not-found/not-found.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BrowserModule } from '@angular/platform-browser';

@NgModule({
    declarations: [AppComponent, NotFoundComponent],
    imports: [
        CommonModule,
        AppRoutingModule,
        HttpClientModule,
        FontAwesomeModule,
        BrowserModule,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
