import debug from "debug"

const d = debug('storage')

interface Integrity extends Map<string, Integrity | null> {}
type Dirty = object

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

export type Versions = {
    [key: number]: (prev: object) => object
}

export abstract class Storage<K, T extends object> {
    private readonly currentVersion : number
    private readonly versions : Map<number, (prev: object) => object>
    private readonly integrity : Integrity
    private readonly _initial : () => T
    
    protected versionProperty = '__VERSION'
    protected abstract _load(key : K) : any
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

    private checkIntegrity(obj : Dirty, structure = this.integrity) {
        //if(!this.isObject(obj)) throw new IntegrityError("Not an object", obj)

        for(const [field, nextStructure] of structure) {
            if(!(field in obj)) throw new IntegrityError("Missing field: " + field, obj)

            if(nextStructure)
                this.checkIntegrity(obj[field], nextStructure)
        }
    }

    private upgrade(obj : Dirty) : Dirty {
        if(obj == null || !obj[this.versionProperty])
            throw new UpgradeError("Missing version field", obj)

        let objVersion = obj[this.versionProperty]
        
        if(objVersion === this.currentVersion)
            return obj

        if(!Number.isInteger(objVersion))
            throw new UpgradeError("Invalid version number", obj)

        try {
            while(objVersion < this.currentVersion) {
                let next = this.versions.get(++objVersion)
                if(next) {
                    obj = next(obj)
                }
            }
            
            if(!Object.isFrozen(obj))
                obj[this.versionProperty] = objVersion
            
            d("Object upgraded to version " + objVersion)
            return obj
        } catch(e) {
            throw new UpgradeError("Upgrade to version " + objVersion + " failed", obj)
        }
    }

    ///// Public API //////////////////////////////////////

    public load(key : K) : T {
        try {
            let obj = this.upgrade(this._load(key))
            this.checkIntegrity(obj)
            d('Loaded', obj)
            return obj as T
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
        const obj = Object.isFrozen(value)
            ? Object.assign({}, value)
            : value

        obj[this.versionProperty] = this.currentVersion
        this._save(key, obj)
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

export class LocalStorage<T extends object> extends Storage<string, T> {
    protected _load(key: string) {
        return JSON.parse(window.localStorage.getItem(key) ?? "null")
    }

    protected _save(key: string, value : T): void {
        window.localStorage.setItem(key, JSON.stringify(value))
    }

    constructor(initial : () => T, versions : Versions = {}) {
        super(initial, versions)
    }
}
