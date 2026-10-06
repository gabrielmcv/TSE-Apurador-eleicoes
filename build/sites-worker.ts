import {env as runtimeEnv} from 'cloudflare:workers';
import {runElection,firstElection} from '../lib/election-context';
import {loadSecondContext} from '../lib/second-round-config';
import {initializeSecondStorage} from '../lib/round-storage';
import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const url=new URL(request.url);const second=url.searchParams.get('eleicao')==='2026-2'||url.pathname.startsWith('/segundo-turno');
    if(second){if(url.pathname==='/api/acervo/encerrar')return new Response('Operação não disponível neste turno',{status:403});if(!runtimeEnv.DB)return new Response('Armazenamento indisponível',{status:503});await initializeSecondStorage(runtimeEnv.DB);}
    const election=second?await loadSecondContext():firstElection;
    return runElection(election,()=>runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx)));
  },
};
