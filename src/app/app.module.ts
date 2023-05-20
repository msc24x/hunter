import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EditorModule } from './editor/editor.module';
import { CompeteModule } from './compete/compete.module';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from './common/common.module';
import { NotFoundComponent } from './common/pages/not-found/not-found.component';
import { BrowserModule } from '@angular/platform-browser';

@NgModule({
  declarations: [
    AppComponent,
    NotFoundComponent
  ],
  imports: [
    CommonModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
