// # DCI with Svelte
//
// If you like, open the [demo app](https://dilemma.surge.sh/) in a new tab to follow along. Source maps are included.
//
// A Svelte component can be considered a [DCI](https://en.wikipedia.org/wiki/Data,_context_and_interaction) Context,
// DCI being a very exciting programming paradigm. 
//
// It stands for *Data, Context, Interaction*, and describes a network of objects, interacting to provide functionality 
// according to a mental model, in a clear, readable way.
//
// A useful analogy for a DCI Context is a theater play, so it will be used throughout this example to explain the concepts.

// # Imports

// First, import types and components. Nothing directly DCI-related, but some of these objects will be used as *Data*, the
// first part of the DCI acronym. These are simple objects like Svelte stores and data structures.
//import { derived, Writable, writable, get } from 'svelte/store';
//import type { Updater } from 'svelte/store';

export type Choice = boolean
export type Round = Readonly<FixedLengthArray<2, Choice>>
export type Rounds = Readonly<Round[]>

///////////////////////////////////////////////////////////

// # Data

export const initialState = {
    rounds: [] as Rounds,
    rules: {
        coop: 2,
        defect: 0,
        win: 3,
        lose: -1
    } as const
}

export type Rules = typeof initialState.rules

///////////////////////////////////////////////////////////

export class Game {
    public readonly rules: Rules
    public readonly rounds: Rounds

    constructor(data = initialState) {
        this.rules = data.rules
        this.rounds = data.rounds
    }

    public get score() {
        return this.rounds.reduce((scores, round) => [
            scores[0] + this.calculateScore(round[0], round[1]),
            scores[1] + this.calculateScore(round[1], round[0])
        ] as const, [0,0] as const)
    }

    public addRound = (action1: Choice, action2: Choice) => {
        return [...this.rounds, [action1, action2] as const]
    }

    private calculateScore = (player: Choice, opponent: Choice) => {
        const r = this.rules

        if(player == opponent)
            return player ? r.coop : r.defect
        else
            return player ? r.lose : r.win
    }
}