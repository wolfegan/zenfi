import { DataModel } from "./dataModel";

export interface QueryCtx {
  auth: {
    getUserIdentity: () => Promise<{ email?: string; subject: string; tokenIdentifier?: string } | null>;
  };
  db: {
    query: (table: string) => any;
    get: (id: any) => Promise<any>;
    insert: (table: string, doc: any) => Promise<any>;
    patch: (id: any, doc: any) => Promise<void>;
    delete: (id: any) => Promise<void>;
  };
}

export interface MutationCtx extends QueryCtx {}

export declare function query<Args extends Record<string, any>, Returns>(config: {
  args: Args;
  handler: (ctx: QueryCtx, args: any) => Promise<Returns>;
}): any;

export declare function mutation<Args extends Record<string, any>, Returns>(config: {
  args: Args;
  handler: (ctx: MutationCtx, args: any) => Promise<Returns>;
}): any;

export declare function action<Args extends Record<string, any>, Returns>(config: {
  args: Args;
  handler: (ctx: any, args: any) => Promise<Returns>;
}): any;
