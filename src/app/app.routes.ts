import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { CreateRoom } from './pages/create-room/create-room';
import { JoinRoom } from './pages/join-room/join-room';
import { Lobby } from './pages/lobby/lobby';
import { Game } from './pages/game/game';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'create', component: CreateRoom },
  { path: 'join', component: JoinRoom },
  { path: 'room/:code/lobby', component: Lobby },
  { path: 'room/:code/game', component: Game },
  { path: '**', redirectTo: '' },
];
