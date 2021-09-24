# AGSM

AGSM stands for Angular Global State Management and is a RxJs implementation of Redux concepts for Angular applications.

## Table of Contents

- [Features](#features)
- [Installing](#installing)
- [Example](#example)
- [AGSM API](#agsm-api)
- [Contribution](#contribution)
- [Credits](#credits)
- [License](#license)

## Features

- All application states stored in one global store
- Read-only states (Can only be modified using pre-defined actions describing the change of events)
- All changes are done with pure functions (reducers)
- Clean code and a trackable file hierarchy consisting of actions, reducers and action types

## Installing

```bash
npm install agsm
```

## Example

We're going to use [JSON Placeholder](https://jsonplaceholder.typicode.com/guide/) as a quick backend to serve data about posts/articles.

#### **_Directory tree_**

```bash
│   app.component.css
│   app.component.html
│   app.component.spec.ts
│   app.component.ts
│   app.module.ts
│
└───agsm
    │   store.service.ts
    │   types.ts
    │
    ├───actions
    │       post-actions.service.ts
    │
    └───reducers
            postsReducer.ts
```

#### **_store.service.ts_**

```typescript
import { Injectable } from "@angular/core";
import { AgsmService } from "agsm";
import { postsReducer } from "./reducers/postsReducer";

// Store is better as a standalone service containing
// all the reducers you want to add to the tree

@Injectable({
  providedIn: "root",
})
export class StoreService {
  constructor(private agsm: AgsmService) {
    // Add reducer takes in a string for the reducer name and the reducer pure function as a 2nd parameter
    this.agsm.addReducer("postsList", postsReducer);
  }
}
```

#### **_types.ts_**

```typescript
export const POSTS_REQUEST = "POSTS_REQUEST";
export const POSTS_SUCCESS = "POSTS_SUCCESS";
export const POSTS_FAIL = "POSTS_FAIL";
```

#### **_post-actions.service.ts_**

```typescript
import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { POSTS_FAIL, POSTS_SUCCESS, POSTS_REQUEST } from "../types";
import { AgsmService } from "agsm";

const httpOptions = {
  headers: new HttpHeaders({
    "Content-Type": "application/json",
  }),
};

@Injectable({
  providedIn: "root",
})
export class PostActionsService {
  // agsm will need to be injected in every action that depends on the global store for altering/retrieving states
  constructor(private http: HttpClient, private agsm: AgsmService) {}

  async getPosts() {
    // Dispatching an event is as simple as sending the UNIQUE event name as a string for the first parameter
    // and an optional payload as the second parameter
    this.agsm.dispatch(POSTS_REQUEST);

    try {
      const posts = await this.http
        .get<any>("https://jsonplaceholder.typicode.com/posts", httpOptions)
        .toPromise();

      this.agsm.dispatch(POSTS_SUCCESS, posts);
    } catch (e: any) {
      // Handled depending on backend or general error handlers.
      this.agsm.dispatch(POSTS_FAIL, e.message);
    }
  }
}
```

#### **_postsReducer.ts_**

```typescript
import { POSTS_FAIL, POSTS_SUCCESS, POSTS_REQUEST } from "../types";

// Reducers are pure functions that take in an action object containing a type and a payload as a first parameter
// and the previous state of the reducer as a second parameter to return a brand new state
export const postsReducer = (
  action: any,
  state: any = {
    loading: true,
    posts: null,
    error: null,
  }
) => {
  // Switch statement to determine which state to return based on UNIQUE action types
  switch (action.type) {
    case POSTS_REQUEST:
      return { ...state, loading: true };
    case POSTS_SUCCESS:
      return {
        loading: false,
        posts: action.payload,
        error: null,
      };
    case POSTS_FAIL:
      return {
        loading: false,
        posts: null,
        error: action.payload,
      };
    default:
      return state;
  }
};
```

#### **_app.component.ts_**

```typescript
import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { AgsmService } from "agsm";
import { PostActionsService } from "./agsm/actions/post-actions.service";
import { StoreService } from "./agsm/store.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit, OnDestroy {
  postsListSubscription: Subscription;
  postsList: [] = [];

  constructor(
    private store: StoreService, // This needs to be injected first and once only in app.component.ts
    private agsm: AgsmService, // This will be injected in every component that needs the agsm store and its functionality
    private postActions: PostActionsService
  ) {}

  ngOnInit(): void {
    // Subscribing to a reducer to retrieve latest updates from actions/dispatches
    this.postsListSubscription = this.agsm
      .stateSelector((state) => state.postsList)
      .subscribe((posts) => (this.postsList = posts));

    // Use our getPosts action to call our backend and update the postsList reducer/state
    // which will then emit an event to our subscriber(s) of that reducer to handle the returned data
    this.postActions.getPosts();
  }

  ngOnDestroy(): void {
    this.postsListSubscription.unsubscribe(); // To avoid memory leaks
  }
}
```

## AGSM API

### addReducer

```typescript
addReducer(reducerName: string, reducerFunc: (action: Action, initialState?: any) => {}): void
```

### dispatch

```typescript
dispatch(actionType: string, payload?: any): void
```

### stateSelector

```typescript
stateSelector(selector: (state: any) => any): Observable<any>
```

## Contribution

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Credits

AGSM is heavily inspired by React Redux as an architecture/concept and is based on a RxJs implementation.

## License

[MIT](https://github.com/Karim-mo/AGSM/blob/master/LICENSE)
