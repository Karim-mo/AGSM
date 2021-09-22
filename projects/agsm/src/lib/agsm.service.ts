import { state } from '@angular/animations';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Action } from '../models/action.model';

@Injectable({
  providedIn: 'root',
})
export class AgsmService {
  private store: any = {};
  /* For future use */
  private stateMap: any = {};
  private actionMap: any = {};
  private _store = new Subject<any>();

  constructor() {}

  addReducer(
    reducerName: string,
    reducerFunc: (action: Action, initialState?: {}) => {}
  ): void {
    if (this.store[reducerName]) {
      throw new Error('Cannot have duplicate reducer names in store.');
    }

    this.store[reducerName] = {
      dispatcher: reducerFunc,
      state: reducerFunc({ type: 'AGSM_INIT', payload: {} }),
      reducer: new Subject<any>(),
    };

    // setTimeout(
    //   () => this.store[reducerName].reducer.next(this.store[reducerName].state),
    //   300
    // );

    // return this.store[reducerName].reducer.asObservable();
  }

  dispatch(actionType: string, payload?: {}): void {
    for (const key of Object.keys(this.store)) {
      const action: Action = {
        type: actionType,
        payload: payload ?? {},
      };
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
      }
    }
  }

  setReducerState(
    selector: (state: any) => any,
    state: any,
    update: boolean
  ): void {
    const currState = selector(this.store);
    if (!currState) {
      throw new Error('Reducer not found in store');
    }
    currState.state = state;
    if (update) {
      currState.reducer.next(state);
    }
  }

  stateSelector(selector: (state: any) => any): Observable<any> {
    return selector(this.store).reducer.asObservable();
  }

  getStateValue(selector: (state: any) => any): void {
    const currState = selector(this.store);
    currState.reducer.next(currState.state);
  }
}
