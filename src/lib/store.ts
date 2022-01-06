import { derived, Writable, writable } from 'svelte/store'
import type { Match, Rounds, Rules } from './types'

export const initialState = ({
    names: ['Player 1', 'Player 2'] as const,
    rounds: [],
    rules: {
        coop: 2,
        defect: 0,
        win: 3,
        lose: -1
    },
    __VERSION: 2
} as Match)

// Loading 
let gameState = JSON.parse(window.localStorage.getItem('dilemma')) ?? initialState

if(gameState.__VERSION != initialState.__VERSION)
    gameState = initialState

///// Stores //////////////////////////////////////////////

export const name1 : Writable<string> = writable(gameState.names[0])
export const name2 : Writable<string> = writable(gameState.names[1])
export const rounds : Writable<Rounds> = writable(gameState.rounds)
export const rules : Writable<Rules> = writable(gameState.rules)

///////////////////////////////////////////////////////////

// Saving
derived(
    [name1, name2, rounds, rules],
    ([$name1, $name2, $rounds, $rules]) => ({
        names: [$name1, $name2],
        rounds: $rounds,
        rules: $rules,
        __VERSION: initialState.__VERSION
    } as Match)
).subscribe(g => {
    window.localStorage.setItem('dilemma', JSON.stringify(g))
})
