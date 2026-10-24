import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { CreateRoom } from './pages/create-room/create-room';
import { JoinRoom } from './pages/join-room/join-room';
import { Rules } from './pages/rules/rules';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'create', component: CreateRoom },
  { path: 'join', component: JoinRoom },
  { path: 'rules', component: Rules },
  // Room pages carry socket.io, CDK drag-drop and the game UI; load them only when entering a room.
  { path: 'room/:code/lobby', loadComponent: () => import('./pages/lobby/lobby').then((m) => m.Lobby) },
  { path: 'room/:code/game', loadComponent: () => import('./pages/game/game').then((m) => m.Game) },
  { path: '**', redirectTo: '' },
];
