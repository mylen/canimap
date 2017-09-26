﻿import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MdDialogModule, MdButtonModule, MdIconModule, MdTooltipModule,
  MdInputModule, MdSliderModule, MdExpansionModule, MdTableModule } from '@angular/material';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletDrawModule } from '@asymmetrik/ngx-leaflet-draw';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AgmCoreModule } from '@agm/core';

// used to create fake backend
import { fakeBackendProvider } from './_helpers/index';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { BaseRequestOptions } from '@angular/http';

import { AppComponent } from './app.component';
import { routing } from './app.routing';

import { DialogFileSaveComponent } from './_dialogs/fileSave.component';
import { DialogFileOpenComponent } from './_dialogs/fileOpen.component';
import { DialogFilesOpenComponent } from './_dialogs/filesOpen.component';
import { DialogChooseColorComponent } from './_dialogs/chooseColor.component';
import { DialogChooseLayersComponent } from './_dialogs/chooseLayer.component';
import { DialogHelperComponent } from './_dialogs/helper.component';
import { AlertComponent } from './_directives/index';
import { AuthGuard } from './_guards/index';
import { AlertService, AuthenticationService, UserService, MenuEventService,
  CanimapService, HelperEventService, FileService } from './_services/index';
import { HomeComponent } from './home/index';
import { LocationComponent } from './_menus/location/index';
import { MenuComponent } from './_menus/menu/index';
import { ContextMenuComponent } from './_menus/contextMenu/index';
import { FileMenuComponent } from './_menus/fileMenu/index';
import { TrackMenuComponent } from './_menus/tracksMenu';
import { MenuMobileComponent } from './_menus/mobile';
import { LoginComponent } from './login/index';
import { CanimapComponent } from './map/index';
import { RegisterComponent } from './register/index';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MdTableModule,
    MdDialogModule,
    MdButtonModule,
    MdIconModule,
    MdTooltipModule,
    MdInputModule,
    MdSliderModule,
    MdExpansionModule,
    FormsModule,
    HttpModule,
    NgbModule.forRoot(),
    LeafletModule.forRoot(),
    LeafletDrawModule.forRoot(),
    ReactiveFormsModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyBb1BipElNZJQPhdkSUdX5DxZpPnQV_D3k',
      libraries: ['places']
    }),
    routing
  ],
  declarations: [
    AppComponent,
    DialogFileSaveComponent,
    DialogFileOpenComponent,
    DialogFilesOpenComponent,
    DialogChooseLayersComponent,
    DialogChooseColorComponent,
    DialogHelperComponent,
    AlertComponent,
    HomeComponent,
    LocationComponent,
    MenuComponent,
    ContextMenuComponent,
    FileMenuComponent,
    TrackMenuComponent,
    MenuMobileComponent,
    LoginComponent,
    CanimapComponent,
    RegisterComponent
  ],
  providers: [
    AuthGuard,
    AlertService,
    AuthenticationService,
    UserService,
    MenuEventService,
    HelperEventService,
    CanimapService,
    FileService,

    // providers used to create fake backend
    fakeBackendProvider,
    MockBackend,
    BaseRequestOptions
  ],
  entryComponents: [
    DialogFileSaveComponent,
    DialogFileOpenComponent,
    DialogFilesOpenComponent,
    DialogChooseLayersComponent,
    DialogChooseColorComponent,
    DialogHelperComponent
  ],
  bootstrap: [AppComponent]
})

export class AppModule {
}
