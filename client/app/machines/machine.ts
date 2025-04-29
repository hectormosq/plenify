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
          initial: "loading",
          states: {
            loading: {
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
                  target: "loadTransactions",
                  actions: assign({
                    activeFromDate: ({ event }) => {
                      return event.output.activeFromDate;
                    },
                    activeToDate: ({ event }) => {
                      return event.output.activeToDate;
                    },
                  }),
                },
              },
            },
            loadTransactions: {
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
    SET_ACTIVE_DATE: {
      target: "#plenify.initialized.transactions",
    },
    ADD_TRANSACTION: {
      target: ".transaction",
    },
    RESET: {
      target: ".reset",
    },
  },
});
