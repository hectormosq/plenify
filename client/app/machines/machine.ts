import { assign, fromPromise, setup } from "xstate";
import {
  ControllerContext,
  ControllerEvent,
  isActiveDateEvent,
  TransactionEvent,
} from "./types";
import { DEFAULT_CONTEXT } from "./defaults";
import { plenifyService } from "../services";
import {
  Transaction,
  TransactionByType,
  TransactionType,
  UtilsType,
} from "../models/transaction";
import dayjs from "dayjs";

export const machine = setup({
  types: {
    context: {} as ControllerContext,
    events: {} as ControllerEvent,
    input: DEFAULT_CONTEXT,
  },
  actors: {
    setup: fromPromise(async () => {
      return plenifyService.setup();
    }),
    reset: fromPromise(async () => {
      return plenifyService.reset();
    }),
    setActiveDates: fromPromise(
      async ({ input }: { input: ControllerContext }) => {
        return {
          activeFromDate: input.activeFromDate,
          activeToDate: input.activeToDate,
        };
      }
    ),
    getCategories: fromPromise(async () => {
      return plenifyService.getCategories();
    }),
    getTransactions: fromPromise(
      async ({ input }: { input: { fromDate: string; toDate: string } }) => {
        return plenifyService.getTransactions(input.fromDate, input.toDate);
      }
    ),
    addTransaction: fromPromise(
      async ({
        input: { transaction },
      }: {
        input: { transaction: Transaction };
      }) => {
        return plenifyService.addTransaction(transaction);
      }
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAcA2YB2BLAZgTwGIBlAUQBUB9AQQGEyBJANRIoBEqySBtABgF1EKAPawsAFyxCMgkAA9EAFgBMAGhB5EAVgBs2gHQAOHgGZjATmM8A7DoVmFAXwdq0mXISqtWFMgCUqAHJEtAwA8gG8AkggyCLiktLR8gjKahoIxgCMBoaaCpmZmjyaVjxmVvZOLujY+AS+JKRkkTKxohJSMsmp6ohKmcZ6mnnaxjY8CsYG2ppVMTXueljYEgCGqFgAXstQBBBSYEsYAG5CANaHrrV4R-HrWzsIy6cAxqsdGJEt0W3xnUmKKw5ew8HgGSYKBRAsZpRRKTR6GY2BTDTLaYo2OZXRbLO4bTaQPYHPSwMTvS4LfC3Nb4yDfYTtBJdRDZKZ6JR2MwGMzw4wKAxWVS9DLlPSFZGo9ElWbOeZuKm4mlbSB6MQAJ1WGFgqxeH1gelQQlWEB2RIwh2e5wp8puiqw9wJEFVGq1Or1BqNJowUCeJyEbw+X34rTiH2ZCC5gzKYxR-KskwMsJSJTFFSU5mKmiyUyxlNtK3ttKd6s12t1CX1huNZBdZb1ZotfouemxCoLDpVJdd5aklc9NdLborvte7wSQaiDL+iVAyUy+QRfNGpiMQMySiF6ShmT05k0BnhRWymTMOlzNupheVxdrQ97Hurt57WoIYDVaqEapbqHeOE-AFtvwvO0OxvQdnz7R9wL1Ed-THKQJxDRl-lnFkF13BRlymawDHXTc4QUIYzAKKYE3MSwZWqYD2yLPQAzAKBPywOAHy9XZ9nNI5TmbVt8zxa86PJRi1WYyC2NggNx34ekYlDJkAQQAozDMXcrG0JQDG5bRCmsTQkw3HdlKhYiOWMdMimMc9rmdaCEgbLirSA6yuzrBIJPgz5pODH45JQuRAWBBRQXBPkoQMGFhTMnhd33HglG0cLSnTJQrMWNU4DAMR7MtHi8z0dLYEy9zAy8ydZOQmd-JSIE9BBMEITCiL0n6BFigMPIeRCgorCsJxZQwIQIDgVo8yQ6dwwAWm0JMJuUPRQQWxbFss2VeMvB0djGsMFKyJQ9BsTRWSUKxsx64wkyC6LiJ4ddyjBXltFStt+MdLb5NQhBdD2470TM8o1KzabhRRXcN2Iyxsg3FFMievilUdGzuz1N6-OSKxMmin6TCUf6ZmMIH0lMKx2QSjc8iUG6EsouVrJA2iXLvLVWM2nyKvDGwcixv6erxgnFGGMUsxPHQKizTQzFh9b6afd0qwgAckYrFHKrnbIEX6bTQop7Qgr55MEUKLIbAKUZ4zySW6YEhmINYyBlfDNEN323D0yyE9xUTYHwsMBK7EyNTzFJi2aIE+jhNE+2FIsPadAKaZNGO+qrCTAY9p1-c+XBHkzKzYOXpVMOmJYuWWanbaPq5aLY+yGZE-BZPhX6FSzAS+MgW0M30bz+GC6EouxLt1nxoUgZTz0Ox0VF7RynivWOT2gY4vnIFlLMMpHtWvLrfL8rh4++FDLBdrwd98wG+asftJ4bSMZxpu+UluXB7L96quF77+j5DlbvIpM90MHSuFwR43XBvKi1kCqZUjvvXC49BQzBujdCmkwU5r13AUf2mE4rhWsH1BwQA */
  id: "plenify",
  initial: "initializing",
  context: ({ input }) => ({
    ...input,
  }),
  states: {
    initializing: {
      invoke: {
        src: "setup",
        onDone: {
          target: "initialized",
        },
      },
    },

    initialized: {
      type: "parallel",
      states: {
        transactions: {
          initial: "activeDates",
          states: {
            activeDates: {
              invoke: {
                src: "setActiveDates",
                input: ({
                  event,
                }): { activeFromDate: string; activeToDate: string } => {
                  if (isActiveDateEvent(event)) {
                    return {
                      activeFromDate: dayjs(event.activeDate)
                        .startOf("month")
                        .toISOString(),
                      activeToDate: dayjs(event.activeDate)
                        .endOf("month")
                        .toISOString(),
                    };
                  }
                  return {
                    activeFromDate: dayjs().startOf("month").toISOString(),
                    activeToDate: dayjs().endOf("month").toISOString(),
                  };
                },
                onDone: {
                  actions: assign({
                    activeFromDate: ({ event }) => {
                      return event.output.activeFromDate;
                    },
                    activeToDate: ({ event }) => {
                      return event.output.activeToDate;
                    },
                  }),
                  target: "loading",
                },
              },
            },
            loading: {
              invoke: {
                src: "getTransactions",
                input: ({ context }) => {
                  return {
                    fromDate: context.activeFromDate,
                    toDate: context.activeToDate,
                  };
                },
                onDone: {
                  target: "loaded",
                  actions: assign({
                    transactions: ({ event }) => {
                      return "output" in event
                        ? (event.output as TransactionByType)
                        : {
                            [TransactionType.EXPENSE]: [] as Transaction[],
                            [TransactionType.INCOME]: [] as Transaction[],
                            [UtilsType.ALL]: [] as Transaction[],
                          };
                    },
                  }),
                },
                onError: "loaded",
              },
            },

            loaded: {
              type: "final",
            },
          },
        },

        categories: {
          initial: "loading",
          states: {
            loading: {
              invoke: {
                src: "getCategories",
                onDone: {
                  target: "loaded",
                  actions: assign({
                    categories: ({ event }) => {
                      return "output" in event ? event.output : {};
                    },
                  }),
                },
              },
            },
            loaded: {
              type: "final",
            },
          },
        },
      },
      onDone: {
        target: "#plenify.loaded",
      },
    },

    transaction: {
      invoke: {
        src: "addTransaction",
        input: ({ event }) => {
          const { transaction } = event as TransactionEvent;
          return {
            transaction: {
              date: transaction.date,
              description: transaction.description,
              amount: transaction.amount,
              transactionType: transaction.transactionType,
              tags: transaction.tags,
            },
          };
        },
        onDone: {
          target: "#plenify.initialized.transactions",
        },
      },
    },

    loaded: {},

    reset: {
      invoke: {
        src: "reset",
        onDone: {
          target: "#plenify.initialized",
        },
      },
    },
  },
  on: {
    ADD_TRANSACTION: {
      target: ".transaction",
    },
    RESET: {
      target: ".reset",
    },

    SET_ACTIVE_DATE: {
      target: "#plenify.initialized.transactions",
    },
  },
});
