import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import { UserInvitesStore } from '../user-invites.store';

const httpClientMock = { get: jest.fn(), post: jest.fn(), delete: jest.fn() };

describe('UserInvitesStore', () => {
  const loadedEmail = 'anna.nowak@example.com';
  const invitedEmail = 'jan.kowalski@example.com';
  let userInvitesStore: InstanceType<typeof UserInvitesStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: httpClientMock as unknown as HttpClient }],
    });
    userInvitesStore = TestBed.inject(UserInvitesStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(userInvitesStore).toBeTruthy();
  });

  it('should store the loaded invites', () => {
    const invites$ = new Subject<string[]>();
    httpClientMock.get.mockReturnValue(invites$);

    userInvitesStore.loadInvites();
    invites$.next([loadedEmail]);
    invites$.complete();

    expect(httpClientMock.get).toHaveBeenCalledWith('api/invites');
    expect(userInvitesStore.invites()).toEqual([loadedEmail]);
    expect(userInvitesStore.loading()).toBe(false);
  });

  it('should add the sent invite', () => {
    httpClientMock.post.mockReturnValue(of(invitedEmail));

    userInvitesStore.sendInvite(invitedEmail);

    expect(httpClientMock.post).toHaveBeenCalled();
    expect(userInvitesStore.invites()).toEqual([invitedEmail]);
    expect(userInvitesStore.isSendingInvite()).toBe(false);
  });
});
