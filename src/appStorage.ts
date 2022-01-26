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

type V2 = { 
    // Convert rounds from boolean to Enum
    rounds: FixedLengthArray<2, boolean|Choice>[] 
}

export class AppStorage extends LocalStorage<AppState> {
    constructor() {
        const versions = new Map([
            [2, (o : V2) => {
                o.rounds = o.rounds.map(r => [
                    r[0] ? Choice.COOP : Choice.DEFECT,
                    r[1] ? Choice.COOP : Choice.DEFECT
                ] as const)
                return o
            }]
        ])

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
