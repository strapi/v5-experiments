type Nullable<T> = T | null;

export interface ServerConfig {
  port: number;
  host: string;
}

export interface AdminConfig {
  url?: string;
}

export const env = {
  get(key: string): string {
    return process.env[key];
  },
};

type ContentTypeController = CollectionTypeController | SingleTypeController;

export class CollectionTypeController {
  constructor(uid: string) {
    console.log(uid);
  }
}

export class SingleTypeController {
  constructor(uid: string) {
    console.log(uid);
  }
}

interface ModuleOpts {
  controllers: Array<ContentTypeController>;
}

export class Module {
  constructor(name: string, opts: ModuleOpts) {}
}
