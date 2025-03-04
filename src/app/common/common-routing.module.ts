import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './pages/about/about.component';
import { CompeteComponent } from './pages/compete/compete.component';
import { HomeComponent } from './pages/home/home.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileComponent } from './pages/profile/profile.component';

const routes: Routes = [
    {
        'path': '',
        'title': 'Hunter - Contest Hosting Platform',
        'component': HomeComponent,
        'pathMatch': 'full',
    },
    {
        'path': 'home',
        'title': 'Hunter - Contest Hosting Platform',
        'component': HomeComponent,
    },
    {
        'path': 'register',
        'component': RegisterComponent,
    },
    {
        'path': 'compete',
        'title': 'Public Competitions • Hunter',
        'component': CompeteComponent,
    },
    {
        'path': 'u/:user_id',
        'component': ProfileComponent,
    },
    {
        'path': 'about',
        'title': 'About • Hunter',
        'component': AboutComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class CommonRoutingModule {}
