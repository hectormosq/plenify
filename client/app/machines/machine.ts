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
  /** @xstate-layout N4IgpgJg5mDOIC5QAcA2YB2BLAZgTwGIBBAERIH0AVAJSIDkBlIgYUoEkB5OgbQAYBdRCgD2sLABcswjEJAAPRABYATABoQeRAFZFigHSKtAZgCMygJw7T53gHYAvvfVpMuQtQCiDD5T6CkIMiiElIyAQoIKuqaCEZxegAcOna2CQBsaeYJloqOzujY+ATelOQs7ABqHuQkRJQefrJBYpLSshFRGogmNnrKvIpGqSa8aco9Wml5gQVueljYkgCGqFgAXgtQBBDSYPMYAG7CANZ7LoV4+yEr65sIC0cAxkutGH6NAc0hbeFKqXrmRS8EyKWzKRQJQa2LTRJRAvRpLTQwZGNJGXi8LTmBxOGaufBXZarNaQba7PSwcQvM6zAkLa7EyAfEQtULtboJIwJPpaDE9ZQJBImEy2IywhAmIzKPS2QYQpHKIbZZTTc5zelE9aQPTiABOSwwsCWj1esD0xskBzAJGpsDJGD2DxONPxlw1WBuJIgOv1hotoTN-qtNvEcHuh2Ez1e7wETWCr3ZEt4Fj6WUlWh0kNBaXFyQRvC5ZhMCQxtnMJlVtLdiw9jO9eoNRpNAb0qGESwgm3tjojpz0arpNc92obfub0jNbY7dydUdCMf8LO+YVAERBaRMegzdiMWQ3kLUXQQGf0CX6XMUaRUPRBlddhNrWvrvqbptb7c7GC2YF1uuEuv7VAXhwf8AFtAPvd1h2fRt-Qnd9py-cMnheecBGZQJ4zZX4JUvTdt1FPdi06GJeW5YFJmyXQ7EvFVcQHasGSfPQozAKB-ywOAEM-LYdgdfYjj7BiH2gljqXY3VOMnD8ZwjOdpAXONWR+Vduh6cw9CGNEtEVMYtGI8VlHGAFAVsMZL0FUxb3oqsfVg8cMG7ATnQgi47LHV5kMjVCFPQ2NPiwlT5D+blAWBUFwUhIYYSPHQtABJFk3GcxLEsHF8nvXU4DAcQnKdITbKy2Acq8+S3j8xdMOUldgsif4wpBMEIShGKYjieKjC0EteASWwiyM0ZHFxDBhAgOAmirJTl0TABaHMjxmxRNxSlbslSQFeoSO83Kg4lNimhMcNMaVoR05QMxGEFsnFJb4vLDFAWUMYjBUOiMp2oc6wO7DVIQWweoMEsVH+3hLAem6OqM8s+rBYZFHMbb1U+5jR1fANvqCiJoTSQGBmUEGwdBm7+gRcx8dFAUbBMLFEcHJivXctH4KDa1bQxmqIiB3HgYe3kidirkt1sYXZTBSExgRmzIORhnUbgw1uP2gLqsTMxTAMfodJGUFZTSWxc0FpFhcsCwTGeyX3qR+mRxfeXpI7SB2dVjJQqSbS0TGbIxVivXU3RSZjDMAPacYzUGdYiSpKdnDzClLcN3ROxITsOxxUlaUry6uIpUMYUzJDkS6zE0NI64qceOj36sl4ePJVLZP-v1o9koBNJesMLqC2hSwC925iI44suP0d5XppwyVLAMcw0h60HgWsExDJUPQ65vfTgQxUEC7lhzK9q87lp63qbB00Uz3m0jjP6afhQFMysS0Avy5HpdDt+iZpSMyVG6MjJJjT9WQJtYZhsGfYwBcio5T3hEAUm4IqZF6n1JamdxSmBrhuUYxZURxC3kNIAA */
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
