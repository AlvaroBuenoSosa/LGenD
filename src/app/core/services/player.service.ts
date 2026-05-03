import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, tap } from 'rxjs';
import { Player } from '../../shared/models/player.model';
import { PlayerMapper } from '../mappers/player.mapper';

@Injectable({ providedIn: 'root' })
export class PlayerService {

  private playerSubject = new BehaviorSubject<Player | null>(null);
  player$ = this.playerSubject.asObservable();

  constructor(private http: HttpClient) {}

  getPlayer(steamId: string) {
    return this.http.get<unknown>(`/api/player/${steamId}`).pipe(
      map(PlayerMapper.toDomain),
      tap(player => this.playerSubject.next(player))
    );
  }
}

