/// <reference types="chrome"/>

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Action } from '../models/action.model';

@Injectable({
  providedIn: 'root',
})
export class AgsmService {
  private store: any = {};
  private id: number = 0;
  private devToolsId = () =>
    `agsm${
      Date.now().toString(36) + Math.random().toString(36).substr(2)
    }-dispatch${this.id++}`;
  private devToolsLink: boolean = false;
  /* For future use */
  private stateMap: any = {};
  private actionMap: any = {};
  private _store = new BehaviorSubject<any>({});

  constructor() {}

  /**
   * Adds a new reducer to the store
   * @param  {string} reducerName
   * @param  {(action:Action,initialState?:any)=>{}} reducerFunc
   * @returns void
   */
  addReducer(
    reducerName: string,
    reducerFunc: (action: Action, initialState?: any) => {}
  ): void {
    if (this.store[reducerName]) {
      throw new Error('Cannot have duplicate reducer names in store.');
    }

    const initialState = reducerFunc({ type: 'AGSM_INIT', payload: {} });
    if (typeof initialState !== 'object') {
      throw new Error('Initial state must be an object');
    }

    this.store[reducerName] = {
      dispatcher: reducerFunc,
      state: initialState,
      reducer: new BehaviorSubject<any>(initialState),
    };
  }

  /**
   * Dispatches actions to the store for reducers to change the state accordingly
   * @param  {string} actionType
   * @param  {any} payload?
   * @returns void
   */
  dispatch(actionType: string, payload?: any): void {
    const action: Action = {
      type: actionType,
      payload: payload ?? {},
    };

    if (this.devToolsLink && Object.keys(action.payload).length <= 0) {
      try {
        chrome.runtime.sendMessage('ejpcjcmhahncbieoipffmamnedfhghld', {
          type: 'agsm_event',
          agsmEvent: actionType,
          id: this.devToolsId(),
          content: {},
        });
      } catch (e: any) {
        throw new Error(
          'Make sure AGSM Dev Tools extension is installed or pass a false boolean to linkDevTools() to de-activate debugging'
        );
      }
    }

    // Begin dispatching to all reducers & check for changes before broadcasting
    for (const key of Object.keys(this.store)) {
      const oldState = this.store[key].state; // For performance reasons
      this.store[key].state = this.store[key].dispatcher(
        action,
        this.store[key].state
      );

      // Check for object equality so we don't broadcast all the time
      let equals = true;
      for (const _key of Object.keys(this.store[key].state)) {
        if (_key in oldState && _key in this.store[key].state) {
          if (oldState[_key] !== this.store[key].state[_key]) {
            equals = false;
            break;
          }
        } else {
          equals = false;
          break;
        }
      }

      if (!equals) {
        this.store[key].reducer.next(this.store[key].state);

        if (this.devToolsLink) {
          try {
            chrome.runtime.sendMessage('ejpcjcmhahncbieoipffmamnedfhghld', {
              type: 'agsm_event',
              agsmEvent: actionType,
              id: this.devToolsId(),
              content:
                Object.keys(this.store[key].state).length > 0
                  ? { state: this.store[key].state }
                  : {},
            });
          } catch (e: any) {
            throw new Error(
              'Make sure AGSM Dev Tools extension is installed or pass a false boolean to linkDevTools() to de-activate debugging'
            );
          }
        }
      }
    }
  }

  /**
   * Selects a state from the store using a selector function (e.g. (state) => state.myState)
   * @param  {(state:any)=>any} selector
   * @returns Observable
   */
  stateSelector(selector: (state: any) => any): Observable<any> {
    return selector(this.store).reducer.asObservable();
  }

  /**
   * Sets the initial state of the store with a custom state
   *
   * NOTE: Any state attributes provided in the state object parameter should be identical to the reducer names that were set in addReducer()
   *
   * addReducer has to be used to initialise the reducers before using this function
   * @param  {any} state
   * @returns void
   */
  setStoreInitialState(state: any): void {
    if (Object.keys(state).length <= 0) return;

    for (const key of Object.keys(state)) {
      if (!(key in this.store)) {
        throw new Error(
          'Cannot set state for states outside of the store object'
        );
      }

      const newReducerState = state[key];
      if (typeof newReducerState !== 'object') {
        throw new Error('Initial states must be objects');
      }

      this.store[key].state = newReducerState;
      this.store[key].reducer.next(this.store[key].state);
    }
  }

  /**
   * Links AGSM to the AGSM Dev Tools extension to debug application's state
   * @param  {boolean} activate
   * @returns void
   */
  linkDevTools(activate: boolean): void {
    this.devToolsLink = activate;
  }

  /* DEPRECATED */

  //   setReducerState(
  //     selector: (state: any) => any,
  //     state: any,
  //     update: boolean
  //   ): void {
  //     const currState = selector(this.store);
  //     if (!currState) {
  //       throw new Error('Reducer not found in store');
  //     }
  //     currState.state = state;
  //     if (update) {
  //       currState.reducer.next(state);
  //     }
  //   }

  //   getStateValue(selector: (state: any) => any): void {
  //     const currState = selector(this.store);
  //     currState.reducer.next(currState.state);
  //   }
}
