import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { CommonModule } from './common/common.module';
import { NotFoundComponent } from './common/pages/not-found/not-found.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { ImpersonationInterceptor } from './interceptors/impersonation.interceptor';

@NgModule({
    declarations: [AppComponent, NotFoundComponent],
    imports: [
        CommonModule,
        AppRoutingModule,
        HttpClientModule,
        FontAwesomeModule,
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
    ],
    bootstrap: [AppComponent],
    providers: [
        {
            provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
            useValue: {
                duration: 4000,
                horizontalPosition: 'center',
                verticalPosition: 'bottom',
            },
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ImpersonationInterceptor,
            multi: true,
        },
    ],
})
export class AppModule {}
