import {electionContext} from '../lib/election-context';
import {scopedDatabase,scopedBucket} from '../lib/round-storage';
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}

export function getStorage(){
 if(!env.DB||!env.BUCKET)throw Error('Armazenamento persistente indisponível. A atualização não pôde ser arquivada.');
 return electionContext().round===2?{db:scopedDatabase(env.DB),bucket:scopedBucket(env.BUCKET)}:{db:env.DB,bucket:env.BUCKET};
}
