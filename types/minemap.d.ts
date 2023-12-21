/*ACCESS_TOKEN*/
export class ACCESS_TOKEN {
}

/*APP_KEY*/
export class APP_KEY {
}

/*KEY*/
export class KEY {
}

/*SOLU*/
export class SOLU {
}

/*SpriteUrl*/
export class SpriteUrl {
}

/*FontsUrl*/
export class FontsUrl {
}

/*DATA_VERSION*/
export class DATA_VERSION {
}

/*EVENTS_URL*/
export class EVENTS_URL {
}

/*FEEDBACK_URL*/
export class FEEDBACK_URL {
}

/*Config*/
export class Config {
  MAX_PARALLEL_IMAGE_REQUESTS: number;
  DOMAIN: string;
  DATA_DOMAIN: string;
  SERVER_DOMAIN: string;
  API_BASE: string;
  API_URL: string;
  DYN_BASE: string;
  DYN_URL: string;
  MERGE_BASE: string;
  MERGE_URL: string;
  OTHER_BASE: string;
  OTHER_URL: string;
  SERVER_URL: string;
  SRC_BASE: string;
  SRC_URL: string;
  SERVICE_BASE: string;
  SERVICE_URL: string;
  REQUIRE_ACCESS_TOKEN: boolean;
  ACCESS_TOKEN: ACCESS_TOKEN;
  APP_KEY: APP_KEY;
  KEY: KEY;
  OFFLINE: boolean;
  SOLU: SOLU;
  spriteUrl: SpriteUrl;
  fontsUrl: FontsUrl;
  DATA_VERSION: DATA_VERSION;
  EVENTS_URL: EVENTS_URL;
  FEEDBACK_URL: FEEDBACK_URL;
}

/*Util*/
export class Util {
}

/*ProjectionType*/
export class ProjectionType {
  LATLON: string;
  MERCATOR: string;
}

/*AccessToken*/
export class AccessToken {
}

/*AppKey*/
export class AppKey {
}

/*Key*/
export class Key {
}

/*Solution*/
export class Solution {
}

/*DataVersion*/
export class DataVersion {
}

/*SpriteUrl*/
export class SpriteUrl {
}

/*FontsUrl*/
export class FontsUrl {
}

interface MapConstructor {
  new(options: any): Map;
}

/*MineMap*/
export class MineMap {
  version: string;
  config: Config;
  util: Util;
  Map: MapConstructor;
  ProjectionType: ProjectionType;
  accessToken: AccessToken;
  appKey: AppKey;
  key: Key;
  solution: Solution;
  dataVersion: DataVersion;
  spriteUrl: SpriteUrl;
  fontsUrl: FontsUrl;
  serviceUrl: string;
  domainUrl: string;
  dataDomainUrl: string;
  serverDomainUrl: string;
  workerCount: number;
  maxParallelImageRequests: number;
  workerUrl: string;
}

