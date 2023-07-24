//
// Copyright 2023 DXOS.org
//

import { Thread } from '@braneframe/types';
import { FunctionContext } from '@dxos/functions';
import { PublicKey } from '@dxos/keys';
import { log } from '@dxos/log';

type HandlerProps = {
  space: string;
  objects: string[];
};

const identityKey = PublicKey.random().toHex(); // TODO(burdon): ???

export default async (event: HandlerProps, context: FunctionContext) => {
  const { space: spaceKey, objects: blockIds } = event; // TODO(burdon): Rename objects.
  const space = context.client.getSpace(PublicKey.from(spaceKey))!;
  log.info('chatgpt', { space: space.key });

  // Get active threads.
  // TODO(burdon): Handle batches with multiple block mutations per thread?
  const query = space.db.query(Thread.filter());
  const threads: Thread[] = query.objects as Thread[]; // TODO(burdon): Infer type?
  const activeThreads = blockIds.reduce((set, blockId) => {
    const thread = threads.find((thread) => thread.blocks.some((block) => block.id === blockId));
    if (thread) {
      set.add(thread);
    }
    return set;
  }, new Set<Thread>());

  // Process threads.
  activeThreads.forEach((thread) => {
    // TODO(burdon): Create set of messages.
    const block = thread.blocks[thread.blocks.length - 1];

    // TODO(burdon): Use to distinguish generated messages.
    if (!block.meta) {
      log.info('block', {
        thread: thread?.id.slice(0, 8),
        block: block.id.slice(0, 8),
        messages: block.messages.length,
        meta: block.meta, // TODO(burdon): Use to distinguish generated messages.
      });

      const response = space.db.add(
        new Thread.Block({
          identityKey,
          messages: [
            {
              timestamp: new Date().toISOString(),
              text: 'Hello from GPT!',
            },
          ],
          meta: {
            keys: [{ source: 'openai.com' }],
          },
        }),
      );

      thread.blocks.push(response);
    }
  });

  return context.status(200).succeed({ greeting: 'Hello' });
};