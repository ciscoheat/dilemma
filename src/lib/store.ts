import { derived, writable } from 'svelte/store'
import type { Match } from './types'

export const initialState = ({
    names: ['Player 1', 'Player 2'] as const,
    rounds: [],
    scores: {
        coop: 2,
        defect: 0,
        win: 3,
        lose: -1
    },
    __VERSION: 1
} as Match)

let gameState = JSON.parse(window.localStorage.getItem('dilemma')) ?? initialState

if(gameState.__VERSION != initialState.__VERSION)
    gameState = initialState

export const name1 = writable(gameState.names[0])
export const name2 = writable(gameState.names[1])
export const rounds = writable(gameState.rounds)
export const scores = writable(gameState.scores)

///////////////////////////////////////////////

const game = derived(
    [name1, name2, rounds, scores],
    ([$name1, $name2, $rounds, $scores]) => ({
        names: [$name1, $name2],
        rounds: $rounds,
        scores: $scores,
        __VERSION: initialState.__VERSION
    })
)

game.subscribe(g => {
    window.localStorage.setItem('dilemma', JSON.stringify(g))
})
