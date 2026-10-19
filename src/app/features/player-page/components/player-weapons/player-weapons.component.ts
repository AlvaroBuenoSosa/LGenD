import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { EMPTY, switchMap } from 'rxjs';

import { Player } from '../../../../shared/models/player.model';
import { PlayerService } from '../../../../core/services/player.service';

@Component({
  selector: 'app-player-weapons',
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './player-weapons.component.html',
  styleUrls: ['./player-weapons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerWeaponsComponent {
  readonly player = input.required<Player>();
  private readonly playerService = inject(PlayerService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly job = toSignal(
    this.isBrowser
      ? toObservable(this.player).pipe(
          switchMap(player => this.playerService.watchWeaponStats(player.steamId))
        )
      : EMPTY,
    { initialValue: null }
  );

  readonly matchmakingJob = toSignal(
    this.isBrowser
      ? toObservable(this.player).pipe(
          switchMap(player =>
            this.playerService.watchMatchmakingWeaponStats(player.steamId)
          )
        )
      : EMPTY,
    { initialValue: null }
  );

  readonly mostKills = computed(() =>
    [...(this.job()?.weaponStats.mostKills ?? [])]
      .sort((a, b) => b.kills - a.kills)
      .slice(0, 4)
  );

  readonly highestHeadshotRates = computed(() =>
    [...(this.job()?.weaponStats.hsPercent ?? [])]
      .sort((a, b) => b.hsPercent - a.hsPercent)
      .slice(0, 4)
  );

  readonly matchmakingMostKills = computed(() =>
    [...(this.matchmakingJob()?.weaponStats.mostKills ?? [])]
      .sort((a, b) => b.kills - a.kills)
      .slice(0, 4)
  );

  readonly matchmakingHighestHeadshotRates = computed(() =>
    [...(this.matchmakingJob()?.weaponStats.hsPercent ?? [])]
      .sort((a, b) => b.hsPercent - a.hsPercent)
      .slice(0, 4)
  );

}