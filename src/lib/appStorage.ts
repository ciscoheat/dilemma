import { LocalStorage } from "./storage"
import { initialState as gameState } from "../game"

export interface AppState {
    readonly rounds: typeof gameState.rounds,
    readonly rules: typeof gameState.rules,
    readonly players: Readonly<FixedLengthArray<2, string>>
}

const appState = () => ({
    rounds: gameState.rounds,
    rules: gameState.rules,
    players: ['', ''] as const
}) as const

export class AppStorage extends LocalStorage<AppState> {
    constructor() {
        super(appState)
        this.configuration.throwOnIntegrityError = false
        this.configuration.throwOnUpgradeError = false
    }

    protected _load(key: string): AppState {
        const v = super._load(key)
        //console.log('Loaded', key, v)
        return v
    }

    protected _save(key: string, value: AppState): void {
        super._save(key, value)
        //console.log('Saved', key, value)
    }
}
