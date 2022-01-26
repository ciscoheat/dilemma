import { LocalStorage } from "./lib/storage"
import { initialState as gameState } from "./lib/dilemma"
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

export class AppStorage extends LocalStorage<AppState> {
    constructor() {
        super(appState)
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
