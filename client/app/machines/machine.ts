import { assign, fromPromise, setup } from "xstate";
import {
  ControllerContext,
  ControllerEvent,
  isActiveDateEvent,
  TransactionEvent,
  WithActiveDateRange,
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
    updateTransaction: fromPromise(
      async ({
        input: { transaction },
      }: {
        input: { transaction: Transaction };
      }) => {
        return plenifyService.updateTransaction(transaction);
      }
    ),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAcA2YB2BLAZgTwGIBBAERIH0AVAJSIDkBlIgYUoEkB5OgbQAYBdRCgD2sLABcswjEJAAPRABYATABoQeRMoDsARgB0AVgAcAZm0A2ZaeMWAnKd53tAXxfq0mXIQCqABRIiSgBRKlpGFnYuPkEkEGRRCSkZOIUEXUMjHV1eQ10rXl5jXW11TQRFU0yLRUtFOwzDXmUdQzcPdGx8AmpghmDKGNkEsUlpWTTFRX1tWyttFsddUzsLCzLEQztjfWN65XtnPVNdXXb4zu8CfspySLYANVDAkKG4kaTx1KU1DUR85T6exrHIZcxVRQWc6eLp4fRYbCSACGqCwAC8EVACBBpGB4RgAG7CADWeJh3nxSRR6MxCARRIAxkixhgYm8RKNkhNNnY7DMGg0plNjHkNghtLxtPpeJDeBCRRY9lD3BcvPhKcjUWjINjcfpYOJmWTLuqEVStZB2fFEizueljNpMtp6nZDOZtoo3boxctAc7TIpjMVVstbMZoSa4WbNejIPpxAAnJEYWBIhks2D6NOSAlgEhG2C6jB4+kk41qqOIrDU7UQeNJlPZ5KZpu5-PiOB0wnCJkstkCYY2rnfdItTKGCynWyKEqQnRi7QLaUWPTGBzWcw1CMVjXVi11xPJ1Pp5v6VDCJEQTFFkvd0n6cmmqs1uOHxsn6SZ8+X2ml3vJftYg5T4UlANJ8kMKVihsOVjF4XQZ1dBdbH0ZQzEsEMHBlcMVUfStzVjA8G2PDMzwvK8MCxMAEwTYQEwfVBmRwOiAFsGJ3aM90I+sjybT8yJ-Siu0ZZkAIEK0PltEcIKg0NYPgxDDAXFZ9FqOwikKEpdGsRRt1hXcXzrXswCgOisDgASKKxHFi3xIl7zwgz930YzTITcyv3I39u3-aRAMHTkvjA-5rAsXZLGUFQ7EDXI0LFFoDF5NTlBMNZA20vSKTfEjkizCAIBvOyy3Y-Tsr4jA8ogYSe1EvzxIHd4hyC+REF4MVeEy9Uyo-CqAFdkAgI1CtLBzIx498WX0frBo7arfNZeqgOtQLQJahA2r+dbOrhBM4DAcRhrvct9N22B9rm2qFv4CSmtWtILHg1TTBSlZDEqaLzDFB7eH0KoTksf7VisNwVQwYQIDgYZIwCkC7QAWkDMU4YdX6WgaSxF1MANDGUbanJpSiYak4KEHMH71O0Xl8kqGxSk2xUDEp2wVhWNc7DxzjDKJ4cSfU6Z-VqSVeTdZoxU9VHlDsA4120RwAzOXCxs55zuozbnmrSV0-UqQXKddRxfnKCwcf0DJJwaGUckXXHFY458VeI8qWxPNsC3Vu7-kKH6BYlPWRcNxBFx+y2EKsZ7IIODn7e41XT2-Kz3btBCdCBMwTFmKxJxxhcJWlGdQ+sFKFmVDo7YI2txpy-j48gRPpNsTJIpFbZHS2BCF22GYJxURQnFWWoFdL-Tle41yzMhxqVrtZxg8nFo9m2AMbB9Z6gU9Mxg2N2WzCj8u4zH9yLPjzE65J0Edl4Oe0PqMxKmMeLdD5VYHXqeoTCmSPbeH6OK4PjzLNrpPWG0lKiAl5A9AMi5rbKG9JtSKgJljNElGuLOhRXBfyyo7Hqp81pelUs6YonpTAPRnKYH0S4TBoUcDKZwpwVx41jtISqOC0gmB2KsGUrde5NADPFLY+h1KQQsMQhYyhL66QwV1LBk1ppGhYZsSm+D0pEJIcsMUIjfpbD2GYA4K5lgSKHhSGuEB5HpG2HyBYywraujgnFTaVjVLwRlBpFYCxTB41OvtUxVQwrY0frYCCkFFBignJkKoKUjiXxFE4EGLggA */
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
                    fromDate: (context as WithActiveDateRange).activeFromDate,
                    toDate: (context as WithActiveDateRange).activeToDate,
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
      initial: "add",
      states: {
        add: {
          invoke: {
            src: "addTransaction",
            input: ({ event }) => {
              const { transaction } = event as TransactionEvent;
              return {
                transaction,
              };
            },
            onDone: {
              target: "#plenify.initialized.transactions",
            },
          },
        },
        update: {
          invoke: {
            src: "updateTransaction",
            input: ({ event }) => {
              const { transaction } = event as TransactionEvent;
              return {
                transaction,
              };
            },
            onDone: {
              actions: [
                assign({
                  currentTransaction: ({ event }) => {
                    console.log("currentTransaction", event);
                    return {};
                  },
                }),
              ],
              target: "#plenify.initialized.transactions",
            },
          },
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
      target: ".transaction.add",
    },
    UPDATE_TRANSACTION: {
      target: ".transaction.update",
    },
    RESET: {
      target: ".reset",
    },
    SET_ACTIVE_DATE: {
      target: "#plenify.initialized.transactions",
    },
  },
});
