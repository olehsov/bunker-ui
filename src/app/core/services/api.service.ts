import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/app-config';
import {
  BunkerConfig,
  CataclysmConfig,
  CreateRoomResponse,
  JoinRoomResponse,
  RoomSnapshot,
} from '../models/room.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  createRoom(ownerName: string): Observable<CreateRoomResponse> {
    return this.http.post<CreateRoomResponse>(`${API_BASE_URL}/rooms`, { ownerName });
  }

  joinRoom(code: string, name: string): Observable<JoinRoomResponse> {
    return this.http.post<JoinRoomResponse>(`${API_BASE_URL}/rooms/${code}/join`, { name });
  }

  getRoom(code: string): Observable<RoomSnapshot> {
    return this.http.get<RoomSnapshot>(`${API_BASE_URL}/rooms/${code}`);
  }

  leaveRoom(code: string, playerId: string): Observable<RoomSnapshot> {
    return this.http.post<RoomSnapshot>(`${API_BASE_URL}/rooms/${code}/leave`, { playerId });
  }

  getBunkers(): Observable<BunkerConfig[]> {
    return this.http.get<BunkerConfig[]>(`${API_BASE_URL}/config/bunkers`);
  }

  getCataclysms(): Observable<CataclysmConfig[]> {
    return this.http.get<CataclysmConfig[]>(`${API_BASE_URL}/config/cataclysms`);
  }
}
