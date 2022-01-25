import { LocalStorage } from "./storage"
import { initialState as gameState } from "../game"

export const newState = () => ({
    rounds: gameState.rounds,
    rules: gameState.rules,
    players: ['', '']
})

const state = newState()

export class AppStorage extends LocalStorage<typeof state> {
    constructor() {
        super(newState)
        this.throwOnIntegrityError = false
        this.throwOnUpgradeError = false
    }

    protected _load(key: string): typeof state {
        const v = super._load(key)
        //console.log('Loaded', key, v)
        return v
    }

    protected _save(key: string, value: typeof state): void {
        super._save(key, value)
        //console.log('Saved', key, value)
    }
}
