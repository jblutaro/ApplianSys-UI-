import {
  type Action,
  configureStore,
  type ThunkAction,
} from "@reduxjs/toolkit";

function placeholderReducer(state = {}) {
  return state;
}

export const store = configureStore({
  reducer: placeholderReducer,
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export { useAppDispatch, useAppSelector } from "./hooks";
