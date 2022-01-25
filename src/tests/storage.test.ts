import { IntegrityError, Storage, UpgradeError } from "../lib/storage"

const newState = () => ({
    rounds: [] as number[],
    rules: {
        coop: 2,
        defect: 0,
        win: 3,
        lose: -1
    } as const
})

const newState2 = () => ({
    players: ['A', 'B'],
    rounds: [] as number[],
    rules: {
        coop: 2,
        defect: 0,
        win: 3,
        lose: -1
    } as const
})

const initialState = newState()
const initialState2 = newState2()

class MapStorage<T extends object> extends Storage<string, T> {
    public store : Map<string, T>

    public setIntegrityThrow(state : boolean) {
        this.configuration.throwOnIntegrityError = state
    }

    public setUpgradeThrow(state : boolean) {
        this.configuration.throwOnUpgradeError = state
    }

    public storageKey() {
        return this.versionProperty
    }

    protected _load(key: string) {
        return this.store.get(key)
    }

    protected _save(key: string, value : T): void {
        this.store.set(key, value)
    }

    constructor(initial : () => T, contents = new Map(), versions = new Map()) {
        super(initial, versions)
        this.store = contents
    }
}

class Storage1 extends MapStorage<typeof initialState> {}

class Storage2 extends MapStorage<typeof initialState2> {
    constructor(initial, contents = new Map()) {
        const versions = new Map()
        versions.set(2, o => {
            o['players'] = initialState2.players
            return o
        })
        super(initial, contents, versions)
    }
}

describe("The Storage class", () => {
    let contents : Map<string, typeof initialState> = new Map()
    let storage1 : Storage1

    beforeEach(() => {
        storage1 = new Storage1(newState, contents)
        storage1.save('first', newState())
    })

    it("should save and load items correctly", () => {
        const first = storage1.load('first')

        expect(first.rounds).toHaveLength(0)
        expect(first.rules).toMatchObject(initialState.rules)
    })

    it("should save items with a version key", () => {
        const first = storage1.load('first')
        const key = storage1.storageKey()

        expect(first[key]).toBeDefined()
        expect(first[key]).toBe(1)
    })

    describe('Integrity checking', () => {        
        it("should throw an exception if properties are missing", () => {
            const badState = contents.get('first')
            delete badState['rounds']
            contents.set('first', badState)
            
            expect(() => storage1.load('first')).toThrowError(IntegrityError)
        })

        it("should not throw if throw flag is set to false", () => {
            const badState = contents.get('first')
            delete badState['rounds']
            contents.set('first', badState)
            
            storage1.setIntegrityThrow(false)
            expect(storage1.load('first')).toEqual(initialState)
        })
    })

    describe('Upgrading', () => {        
        it("should throw an exception if no version field", () => {
            const badState = contents.get('first')
            delete badState[storage1.storageKey()]
            contents.set('first', badState)
            
            expect(() => storage1.load('first')).toThrowError(UpgradeError)

            storage1.setUpgradeThrow(false)
            expect(storage1.load('first')).toEqual(initialState)
        })

        it("should throw an exception if version field isn't an integer", () => {
            const badState = contents.get('first')
            badState[storage1.storageKey()] = "a string"
            contents.set('first', badState)
            
            expect(() => storage1.load('first')).toThrowError(UpgradeError)

            storage1.setUpgradeThrow(false)
            expect(storage1.load('first')).toEqual(initialState)
        })

        it("should upgrade an object if it has a lower version", () => {
            const oldState = contents.get('first')
            expect(oldState['players']).toBeUndefined()

            const contents2 = new Map(contents)
            const storage2 = new Storage2(newState2, contents2)

            const upgraded = storage2.load('first')
            expect(upgraded.players).toEqual(initialState2.players)
        })
    })
})