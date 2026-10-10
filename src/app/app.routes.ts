import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './login/login';
import { Cadastro } from './cadastro/cadastro';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'cadastro', component: Cadastro },
  { path: 'home', component: Home }
];

