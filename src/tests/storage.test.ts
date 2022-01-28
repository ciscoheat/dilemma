import { IntegrityError, LocalStorageKeyField, Storage, UpgradeError } from "../lib/storage"

class LocalStorageMock {
    store: object

    constructor() {
        this.store = {}
    }

    clear() {
        this.store = {};
    }
    
    getItem(key) {
        return this.store[key] || null;
    }
    
    setItem(key, value) {
        this.store[key] = String(value);
    }
    
    removeItem(key) {
        delete this.store[key];
    }

    key(index: number): string | null {
        return Object.keys(this.store)[index]
    }

    get length() {
        return Object.keys(this.store).length
    }
}

const newState = () => ({
    rounds: [] as number[],
    rules: {
        coop: 2,
        defect: 0,
        win: 3,
        lose: -1
    }
})

const newState2 = () => ({
    players: ['A', 'B'],
    rounds: [] as number[],
    rules: {
        coop: 2,
        defect: 0,
        win: 3,
        lose: -1
    }
})

const initialState = newState()
const initialState2 = newState2()

class MapStorage<T extends object> extends Storage<string, T> {
    public store : Map<string, T>

    public setIntegrityThrow(state : boolean) {
        this.config.throwOnIntegrityError = state
    }

    public setUpgradeThrow(state : boolean) {
        this.config.throwOnUpgradeError = state
    }

    protected _load(key: string, version = 1) : [object, number] {
        const obj = this.store.get(key)
        if(obj == null) throw new Error("Object was null")
        return [obj, 1]
    }

    protected _save(key: string, value : T): void {
        this.store.set(key, value)
    }

    constructor(initial : () => T, contents = new Map(), versions = {}) {
        super(initial, versions)
        this.store = contents
    }
}

class Storage1 extends MapStorage<typeof initialState> {}

class Storage2 extends MapStorage<typeof initialState2> {
    constructor(initial, contents = new Map()) {
        const versions = {
            2: o => {
                o['players'] = initialState2.players
                return o
            }
        }
        super(initial, contents, versions)
    }
}

describe("The Storage class", () => {
    let contents : Map<string, typeof initialState> = new Map()
    let storage1 : Storage1

    beforeEach(() => {
        storage1 = new Storage1(newState, contents)
        
        const state = newState()
        state.rules.coop = 10

        storage1.save('first', state)
    })

    it("should save and load items correctly", () => {
        const first = storage1.load('first')

        expect(first.rounds).toHaveLength(0)
        expect(first.rules.coop).toBe(10)
    })

    describe('Integrity checking', () => {        
        it("should throw an exception if properties are missing", () => {
            const badState = contents.get('first') as any
            delete badState['rounds']
            contents.set('first', badState)
            
            expect(() => storage1.load('first')).toThrowError(IntegrityError)
        })

        it("should not throw if throw flag is set to false", () => {
            const badState = contents.get('first') as any
            delete badState['rounds']
            contents.set('first', badState)
            
            storage1.setIntegrityThrow(false)
            expect(storage1.load('first')).toEqual(initialState)
        })
    })

    describe('Upgrading', () => {
        it("should upgrade an object if it has a lower version", () => {
            const oldState = contents.get('first') as any
            expect(oldState['players']).toBeUndefined()

            const contents2 = new Map(contents)
            const storage2 = new Storage2(newState2, contents2)

            const upgraded = storage2.load('first')
            expect(upgraded.players).toEqual(initialState2.players)
        })
    })
})

class LocalStore extends LocalStorageKeyField<typeof initialState2> {
    constructor(newState) {
        const versions = {
            2: o => {
                o['players'] = initialState2.players
                return o
            }
        }
        super(newState, versions)
    }

    public setUpgradeThrow(state) {
        this.config.throwOnUpgradeError = state
    }
}

describe("The LocalStorageKeyField class", () => {
    const key = '__VERSION'
    
    let storage1 : LocalStore
    
    beforeEach(() => {
        globalThis.localStorage = new LocalStorageMock()
        storage1 = new LocalStore(newState2)

        const state = newState2()
        state.rules.coop = 10

        storage1.save('first', state)
    })

    it("should save and load items correctly", () => {
        const first = storage1.load('first')

        expect(first.rounds).toHaveLength(0)
        expect(first.rules.coop).toBe(10)
    })

    it("should save items with a version key", () => {
        const first = storage1.load('first')
        expect(first[key]).toBe(2)
    })

    describe('Upgrading', () => {        
        it("should throw an exception if no version field", () => {
            const badState = newState()
            delete badState[key]
            localStorage.setItem('first', JSON.stringify(badState))
            
            expect(() => storage1.load('first')).toThrowError(UpgradeError)

            storage1.setUpgradeThrow(false)
            expect(storage1.load('first')).toEqual(initialState2)
        })

        it("should throw an exception if version field isn't an integer", () => {
            const badState = newState()
            badState[key] = "a string"
            localStorage.setItem('first', JSON.stringify(badState))
            
            expect(() => storage1.load('first')).toThrowError(UpgradeError)

            storage1.setUpgradeThrow(false)
            expect(storage1.load('first')).toEqual(initialState2)
        })

        it("should upgrade an object if it has a lower version", () => {
            const state = newState()
            state[key] = 1
            localStorage.setItem('first', JSON.stringify(state))

            const upgraded = storage1.load('first')
            expect(upgraded.players).toEqual(initialState2.players)
        })
    })
})