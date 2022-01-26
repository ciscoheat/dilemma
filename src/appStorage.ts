import { LocalStorage } from "./lib/storage"
import { Choice, initialState as gameState } from "./lib/dilemma"
import { debug } from "debug"

export interface AppState {
    readonly rounds: typeof gameState.rounds
    readonly rules: typeof gameState.rules
    readonly players: Readonly<FixedLengthArray<2, string>>
}

const appState = () => ({
    rounds: gameState.rounds,
    rules: gameState.rules,
    players: ['Player 1', 'Player 2'] as const
})

const d = debug('storage')

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

type V3 = {
    // From enum to union
    rounds: FixedLengthArray<2, V2Choice|Choice>[] 
}

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
            }
        }

        super(appState, versions)
        this.config.throwOnIntegrityError = false
        this.config.throwOnUpgradeError = false
    }

    protected _load(key: string): AppState {
        const value = super._load(key)
        d("Loading", value)
        return value
    }

    protected _save(key: string, value: AppState): void {
        super._save(key, value)
        d("Saving", value)
    }
}
