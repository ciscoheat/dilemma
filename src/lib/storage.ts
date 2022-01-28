import debug from "debug"

const d = debug('storage')

interface Integrity extends Map<string, Integrity | null> {}
interface Dirty extends Object {}

export class IntegrityError extends Error {
    readonly failedObject: any
    constructor(message: string, failedObject: any) {
        super(message)
        this.name = "IntegrityError"
        this.failedObject = failedObject
    }
}

export class UpgradeError extends Error {
    readonly failedObject: any
    constructor(message: string, failedObject: any) {
        super(message)
        this.name = "UpgradeError"
        this.failedObject = failedObject
    }
}

export class LoadError extends Error {
    readonly failedObject: any
    constructor(message: string, failedObject: any) {
        super(message)
        this.name = "LoadError"
        this.failedObject = failedObject
    }
}

export class SaveError extends Error {
    readonly failedObject: any
    constructor(message: string, failedObject: any) {
        super(message)
        this.name = "SaveError"
        this.failedObject = failedObject
    }
}

export type Versions = {
    [key: number]: (prev: object) => object
}

export abstract class Storage<K, T extends object> {
    private readonly versions : Map<number, (prev: object) => object>
    private readonly integrity : Integrity
    private readonly _initial : () => T
    
    protected readonly currentVersion : number

    /**
     * @param key Key of object to load
     * @returns a tuple of [object, number], where number is the version number. It should be 1 if no versioning exists yet.
     */
    protected abstract _load(key : K) : [object, number]

    /**
     * @param key Key of object to save
     * @param value Object to save
     */
    protected abstract _save(key : K, value : T) : void

    protected config = {
        throwOnIntegrityError: true,
        throwOnUpgradeError: true,
        throwOnLoadError: true
    }

    constructor(initial : () => T, versions : Versions = {}) {
        this._initial = initial
        this.versions = new Map(Object.entries(versions).map(e => [parseInt(e[0]), e[1]]))
        this.currentVersion = Array.from(this.versions.keys()).reduce((prev, next) => {
            if(next < 2) throw new Error("Invalid version in Storage: Must be above 1.")
            return Math.max(prev, next)
        }, 1)
        this.integrity = this.createIntegrity(initial())
    }

    private isObject(x : any) { return x && typeof x === 'object' && !Array.isArray(x) }
    private isFunction(x : any) { return Object.prototype.toString.call(x) == '[object Function]' }

    private createIntegrity(obj : object) : Integrity {
        return new Map(
            Object.getOwnPropertyNames(obj)
                //.filter(p => !this.isFunction(obj[p]))
                .map(p => [
                    p, this.isObject(obj[p]) ? this.createIntegrity(obj[p]) : null
                ])
        )
    }

    private checkIntegrity(obj : Dirty) : T {
        //if(!this.isObject(obj)) throw new IntegrityError("Not an object", obj)

        const _check = (obj : Dirty, integrity : Integrity) => {
            for(const [field, nextStructure] of integrity) {
                if(!(field in obj)) throw new IntegrityError("Missing field: " + field, obj)    
                if(nextStructure) _check(obj[field], nextStructure)
            }
        }

        _check(obj, this.integrity)

        return obj as T
    }

    private upgrade(obj: Dirty, objVersion: number) : Dirty {
        if(objVersion === this.currentVersion)
            return obj

        if(!Number.isInteger(objVersion))
            throw new UpgradeError("Invalid version value", obj)

        if(objVersion < 1 || objVersion > this.currentVersion)
            throw new UpgradeError("Invalid version number: " + objVersion, obj)

        try {
            while(objVersion < this.currentVersion) {
                let next = this.versions.get(++objVersion)
                if(next) obj = next(obj)
            }
            
            d("Object upgraded to version " + objVersion)
            return obj
        } catch(e) {
            throw new UpgradeError("Upgrade to version " + objVersion + " failed", obj)
        }
    }

    ///// Public API //////////////////////////////////////

    public load(key : K) : T {
        try {
            const [loaded, version] = this._load(key)
            const obj = this.upgrade(loaded, version)
            const ok = this.checkIntegrity(obj)
            d('Loaded', ok)
            return ok
        } catch(e) {
            if(e instanceof UpgradeError && !this.config.throwOnUpgradeError)
                return this.initial()
            else if(e instanceof IntegrityError && !this.config.throwOnIntegrityError)
                return this.initial()
            else if(!this.config.throwOnLoadError)
                return this.initial()
            else
                throw e
        }
    }

    public save(key : K, value : T) {
        this._save(key, value)
        d('Saved', value)
    }

    /**
     * When you want to use the default values of a state.
     * @returns a new state object.
     */
    public initial() : T {
        d('Creating initial object.')
        return this._initial()
    }
}

export class LocalStorageKeyField<T extends object> extends Storage<string, T> {
    protected keyField = '__VERSION'

    protected _load(key: string) : [object, number] {
        const obj = JSON.parse(globalThis.localStorage.getItem(key) ?? "null")
        const version = obj[this.keyField]

        if(!version)
            throw new UpgradeError("Missing version field", obj)

        if(!parseInt(version))
            throw new UpgradeError("Invalid version value", obj)

        return [obj, version]
    }

    protected _save(key: string, value : T): void {
        // Make a copy to add key field even if object is frozen
        const obj = Object.assign({}, value)
        obj[this.keyField] = this.currentVersion

        globalThis.localStorage.setItem(key, JSON.stringify(obj))
    }

    constructor(initial : () => T, versions : Versions = {}) {
        super(initial, versions)
    }
}