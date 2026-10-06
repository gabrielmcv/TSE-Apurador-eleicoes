declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    COLLECTOR_KEY?: string;
    BUCKET?: R2Bucket;
  }
}
