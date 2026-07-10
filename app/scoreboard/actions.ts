'use server';

import { updateTag } from 'next/cache';

/*
  R RESYNC — expires the hour-cached GitHub fetches (tagged 'github' in
  lib/api/github.ts) so the next render refetches live. `updateTag` is the
  Next 16 read-your-own-writes expiration (the one-arg successor to the old
  revalidateTag(tag) call). Invoked from the scoreboard's resync control.
*/
export async function resyncGitHub(): Promise<void> {
  updateTag('github');
}
