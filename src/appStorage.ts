import { LocalStorage } from "./lib/storage"
import { Choice, initialState as gameState } from "./lib/dilemma"

import debug from "debug"
import produce from "immer"

export interface AppState {
    readonly rounds: typeof gameState.rounds
    readonly gameRounds: number
    readonly rules: typeof gameState.rules
    readonly players: Readonly<FixedLengthArray<2, string>>
}

const appState = () => ({
    rounds: gameState.rounds,
    gameRounds: 10,
    rules: gameState.rules,
    players: ['Player 1', 'Player 2'] as const
})

const state = appState()

const d = debug('appstorage')

///// Versioning //////////////////////////////////////////

enum V2Choice {
    COOP = 1,
    DEFECT = 0
}

type V2 = { 
    // Convert rounds from boolean to Enum
    rounds: FixedLengthArray<2, boolean|V2Choice>[] 
}

/////////////////////////////

type V3Choice = "coop" | "defect"

type V3 = {
    // From enum to union
    rounds: FixedLengthArray<2, V2Choice|V3Choice>[] 
}

/////////////////////////////

type V4 = {
    // From enum to union
    rounds: FixedLengthArray<2, V3Choice|Choice>[] 
}

///////////////////////////////////////////////////////////

export class AppStorage extends LocalStorage<AppState> {
    constructor() {
        const versions = {
            2: (o : V2) => {
                o.rounds = o.rounds.map(r => [
                    r[0] ? V2Choice.COOP : V2Choice.DEFECT,
                    r[1] ? V2Choice.COOP : V2Choice.DEFECT
                ] as const)
                return o
            },
            3: (o : V3) => {
                o.rounds = o.rounds.map(r => [
                    r[0] == V2Choice.COOP ? "coop" : "defect",
                    r[1] == V2Choice.COOP ? "coop" : "defect"
                ] as const)
                return o
            },
            4: (o : V4) => {
                o.rounds = o.rounds.map(r => [
                    r[0] == "coop" ? "C" : "D",
                    r[1] == "coop" ? "C" : "D"
                ] as const)
                return o
            },
            5: (o : AppState) => produce(o, next => {
                next.gameRounds = state.gameRounds
            })
        }

        super(appState, versions)
        this.config.throwOnIntegrityError = false
        this.config.throwOnUpgradeError = false
    }

    protected _load(key: string): AppState {
        const value = super._load(key)
        d("Loaded", value)
        return value
    }

    protected _save(key: string, value: AppState): void {
        super._save(key, value)
        d("Saved", value)
    }
}
