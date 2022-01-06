import { derived, writable } from 'svelte/store'
import type { Match } from './types'

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

let gameState = JSON.parse(window.localStorage.getItem('dilemma')) ?? initialState

if(gameState.__VERSION != initialState.__VERSION)
    gameState = initialState

export const name1 = writable(gameState.names[0])
export const name2 = writable(gameState.names[1])
export const rounds = writable(gameState.rounds)
export const rules = writable(gameState.rules)

///////////////////////////////////////////////

const game = derived(
    [name1, name2, rounds, rules],
    ([$name1, $name2, $rounds, $rules]) => ({
        names: [$name1, $name2],
        rounds: $rounds,
        rules: $rules,
        __VERSION: initialState.__VERSION
    } as Match)
)

game.subscribe(g => {
    window.localStorage.setItem('dilemma', JSON.stringify(g))
})
