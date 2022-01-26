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

export type Versions = Map<number, (prev: object) => object>

export abstract class Storage<K, T extends object> {
    private readonly currentVersion : number
    private readonly versions : Versions
    private readonly integrity : Integrity
    private readonly _initial : () => T
    
    protected versionProperty = '__VERSION'
    protected abstract _load(key : K) : any
    protected abstract _save(key : K, value : T) : void

    protected config = {
        throwOnIntegrityError: true,
        throwOnUpgradeError: true
    }

    constructor(initial : () => T, versions : Versions = new Map()) {
        this._initial = initial
        this.versions = versions
        this.currentVersion = Array.from(versions.keys()).reduce((prev, next) => {
            if(next < 2) throw new Error("Invalid version in Storage: Must be above 1.")
            return Math.max(prev, next)
        }, 1)
        this.integrity = this.createIntegrity(initial())
        //console.dir(this.integrity)
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
        try {
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
                        //console.log("Object upgraded to version " + objVersion)
                    }
                }

                if(!Object.isFrozen(obj))
                    obj[this.versionProperty] = objVersion

                return obj
            } catch(e) {
                throw new UpgradeError("Upgrade to version " + objVersion + " failed", obj)
            }
        } catch(e) {
            if(e instanceof UpgradeError && !this.config.throwOnUpgradeError)
                return this.initial()
            else
                throw e
        }
    }

    ///// Public API //////////////////////////////////////

    public load(key : K) : T {
        let obj = this.upgrade(this._load(key))
        try {
            this.checkIntegrity(obj)
        } catch(e) {
            if(e instanceof IntegrityError && !this.config.throwOnIntegrityError)
                return this.initial()
            else
                throw e
        }
        return obj as T
    }

    public save(key : K, value : T) {
        const obj = Object.isFrozen(value)
            ? Object.assign({}, value)
            : value

        obj[this.versionProperty] = this.currentVersion
        this._save(key, obj)
        //console.log('Saved', value)
    }

    /**
     * When you want to use the default values of a state.
     * @returns a new state object.
     */
    public initial() : T {
        //console.log('Creating initial object.')
        return this._initial()
    }
}

export class LocalStorage<T extends object> extends Storage<string, T> {
    protected _load(key: string) {
        return JSON.parse(window.localStorage.getItem(key))
    }

    protected _save(key: string, value : T): void {
        window.localStorage.setItem(key, JSON.stringify(value))
    }

    constructor(initial : () => T, versions : Versions = new Map()) {
        super(initial, versions)
    }
}
