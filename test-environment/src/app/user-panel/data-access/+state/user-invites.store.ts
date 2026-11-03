import { HttpClient } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, filter, pipe, switchMap, tap } from 'rxjs';

const invitesEndpoint = 'api/invites';

export interface UserInvitesState {
  invites?: string[];
  loading: boolean;
  isSendingInvite: boolean;
  inviteCount: number;
  lastError?: unknown;
}

export const UserInvitesStore = signalStore(
  { providedIn: 'root', protectedState: false },
  withState<UserInvitesState>({ invites: [], loading: false, isSendingInvite: false, inviteCount: 0 }),
  withProps(() => ({ httpClient: inject(HttpClient) })),
  withComputed((store) => ({
    hasInvites: computed(() => (store.invites() ?? []).length > 0),
  })),
  withMethods((store) => ({
    loadInvites(): void {
      patchState(store, { loading: true });
      store.httpClient.get<string[]>(invitesEndpoint).subscribe({
        next: (invites) => patchState(store, { invites, inviteCount: invites.length, loading: false }),
        error: () => {},
      });
    },
    sendInvite: rxMethod<string>(
      pipe(
        filter(() => !store.isSendingInvite()),
        tap(() => patchState(store, { isSendingInvite: true })),
        exhaustMap((email) =>
          store.httpClient.post<string>(invitesEndpoint, { email }).pipe(
            tapResponse({
              next: (invite) =>
                patchState(store, {
                  invites: [...(store.invites() ?? []), invite],
                  inviteCount: store.inviteCount() + 1,
                  isSendingInvite: false,
                }),
              error: (error) => patchState(store, { lastError: error, isSendingInvite: false }),
            }),
          ),
        ),
      ),
    ),
    removeInvite: rxMethod<string>(
      pipe(
        switchMap((email) => store.httpClient.delete<void>(`${invitesEndpoint}/${email}`)),
        tapResponse({
          next: () => patchState(store, { inviteCount: store.inviteCount() - 1 }),
          error: (error) => patchState(store, { lastError: error }),
        }),
      ),
    ),
  })),
);
