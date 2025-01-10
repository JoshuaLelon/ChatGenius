import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import { sampleApi } from "./features/services/apiSlices/sample.api";

import storageSession from "redux-persist/lib/storage/session";
import { counterReducer } from "./features/counter";

const rootReducer = combineReducers({
  [sampleApi.reducerPath]: sampleApi.reducer,
  counter: counterReducer,
});

const createNoopStorage = () => {
  return {
    getItem(_key: unknown) {
      return Promise.resolve(null);
    },
    setItem(_key: unknown, value: unknown) {
      return Promise.resolve(value);
    },
    removeItem(_key: unknown) {
      return Promise.resolve();
    },
  };
};

const storage =
  typeof window !== "undefined" ? storageSession : createNoopStorage();

const persistConfig = {
  key: "root",
  storage: storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makeStore = () =>
  configureStore({
    reducer: persistedReducer,
    middleware: (gDM) =>
      gDM({ serializableCheck: false }).concat(sampleApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
