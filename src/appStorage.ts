import { LocalStorageKeyField } from "./lib/storage"
import { Choice, initialState as gameState } from "./lib/dilemma"

import debug from "debug"
import produce from "immer"

const appState = () => ({
    rounds: gameState.rounds,
    rules: gameState.rules,
    gameRounds: 10 as Readonly<number>,
    players: ['Player 1', 'Player 2'] as Readonly<string[]>
} as const)

export type AppState = ReturnType<typeof appState>

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

export class AppStorage extends LocalStorageKeyField<AppState> {
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
}
