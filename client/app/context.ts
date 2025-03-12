"use client";

import { createContext, useContext } from "react";
import { createActor } from "xstate";
import { DEFAULT_CONTEXT, machine } from "./machines";

export const actor = createActor(machine, { input: DEFAULT_CONTEXT });
actor.start();

export const PlenifyContext = createContext(actor);

export const usePlenifyContext = () => {
  return useContext(PlenifyContext);
}
