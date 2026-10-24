/**
 * Node-side "bot" players for multiplayer e2e scenarios. Cypress drives a single
 * real browser, so the other 3+ players a game needs are simulated here via raw
 * socket.io-client connections talking to the same backend the real player's UI
 * would — not through the UI at all. Registered as Cypress tasks (see
 * cypress.config.ts) and callable from specs via cy.task('bot:...', ...).
 */
import { io, Socket } from 'socket.io-client';
import {
  PlayerView,
  RoomPhase,
  RoomSnapshot,
  TraitCategory,
  TRAIT_CATEGORY_ORDER,
} from '../../src/app/core/models/room.models';

interface Bot {
  playerId: string;
  code: string;
  socket: Socket;
  latestState: RoomSnapshot | null;
  lastError: string | null;
}

const bots = new Map<string, Bot>();

function apiUrl(config: Cypress.PluginConfigOptions): string {
  return (config.env['apiUrl'] as string) ?? 'http://localhost:3000';
}

async function restPost<T>(base: string, path: string, body: unknown): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.message ?? `Request to ${path} failed with ${res.status}`);
  }
  return json as T;
}

function connectSocket(base: string, code: string, playerId: string): Socket {
  return io(`${base}/game`, {
    query: { code, playerId },
    transports: ['websocket'],
  });
}

function registerBot(playerId: string, code: string, socket: Socket): void {
  const bot: Bot = { playerId, code, socket, latestState: null, lastError: null };
  socket.on('room:state', (state: RoomSnapshot) => {
    bot.latestState = state;
  });
  socket.on('room:error', (payload: { message: string }) => {
    bot.lastError = payload.message;
  });
  bots.set(playerId, bot);
}

function requireBot(playerId: string): Bot {
  const bot = bots.get(playerId);
  if (!bot) {
    throw new Error(`No bot registered for playerId ${playerId}`);
  }
  return bot;
}

/** Picks the category a player must/should reveal next, mirroring the frontend's own rule. */
function nextRevealCategory(me: PlayerView, round: number): TraitCategory | null {
  if (round === 1) {
    return me.publiclyRevealedCategories.includes(TraitCategory.PROFESSION)
      ? null
      : TraitCategory.PROFESSION;
  }
  const hidden = TRAIT_CATEGORY_ORDER.find((c) => !me.publiclyRevealedCategories.includes(c));
  return hidden ?? null;
}

export function registerBotTasks(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
): void {
  on('task', {
    'env:apiUrl'() {
      return apiUrl(config);
    },

    async 'bot:createRoom'({ ownerName }: { ownerName: string }) {
      const base = apiUrl(config);
      const { playerId, room } = await restPost<{ playerId: string; room: RoomSnapshot }>(
        base,
        '/rooms',
        { ownerName },
      );
      const socket = connectSocket(base, room.code, playerId);
      registerBot(playerId, room.code, socket);
      return { playerId, code: room.code, room };
    },

    async 'bot:joinRoom'({ code, name }: { code: string; name: string }) {
      const base = apiUrl(config);
      const { playerId, room } = await restPost<{ playerId: string; room: RoomSnapshot }>(
        base,
        `/rooms/${code}/join`,
        { name },
      );
      const socket = connectSocket(base, code, playerId);
      registerBot(playerId, code, socket);
      return { playerId, code, room };
    },

    'bot:getState'({ playerId }: { playerId: string }) {
      const bot = requireBot(playerId);
      return bot.latestState;
    },

    'bot:getLastError'({ playerId }: { playerId: string }) {
      return requireBot(playerId).lastError;
    },

    'bot:emit'({
      playerId,
      event,
      payload,
    }: {
      playerId: string;
      event: string;
      payload?: unknown;
    }) {
      const bot = requireBot(playerId);
      bot.socket.emit(event, payload ?? {});
      return null;
    },

    /** No-ops (returns revealed:false) if it isn't this bot's turn yet — safe to poll from a spec. */
    'bot:revealTurn'({ playerId }: { playerId: string }) {
      const bot = requireBot(playerId);
      const room = bot.latestState;
      if (!room || room.phase !== RoomPhase.REVEAL || room.activePlayerId !== playerId) {
        return { revealed: false };
      }
      const me = room.players.find((p) => p.id === playerId);
      if (!me) {
        return { revealed: false };
      }
      const category = nextRevealCategory(me, room.round);
      if (!category) {
        return { revealed: false };
      }
      bot.socket.emit('player:revealTrait', { category });
      return { revealed: true, category };
    },

    /** No-op (returns voted:false) once this bot has already voted this session — safe to poll. */
    'bot:voteRandom'({ playerId }: { playerId: string }) {
      const bot = requireBot(playerId);
      const room = bot.latestState;
      if (!room || room.phase !== RoomPhase.VOTING || !room.voting || room.voting.lastResult) {
        return { voted: false };
      }
      if (room.voting.votes[playerId] !== undefined) {
        return { voted: false };
      }
      const candidates = room.players.filter((p) => !p.eliminated && p.id !== playerId);
      if (candidates.length === 0) {
        return { voted: false };
      }
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      bot.socket.emit('player:castVote', { targetPlayerId: target.id });
      return { voted: true, targetId: target.id };
    },

    'bot:disconnect'({ playerId }: { playerId: string }) {
      const bot = bots.get(playerId);
      bot?.socket.disconnect();
      bots.delete(playerId);
      return null;
    },

    'bot:disconnectAll'() {
      for (const bot of bots.values()) {
        bot.socket.disconnect();
      }
      bots.clear();
      return null;
    },
  });
}
