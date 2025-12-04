declare global {
  var gameOngoing: {
    [channelId: string]: boolean;
  };
  var testing: boolean;
  var greeting: boolean;
}

export {};