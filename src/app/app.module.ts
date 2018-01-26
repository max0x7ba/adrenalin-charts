import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ChartModule } from 'angular-highcharts';
import { HttpClientModule } from '@angular/common/http';

import { DataAccess } from './data-access.service'
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
      BrowserModule,
      ChartModule,
      HttpClientModule
  ],
  providers: [DataAccess],
  bootstrap: [AppComponent]
})
export class AppModule { }
