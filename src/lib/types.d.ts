interface FixedLengthArray<L extends number, T> extends ArrayLike<T> {
    length: L
}

export type Choice = boolean

export type Round = FixedLengthArray<2, Choice>

export type Rounds = Round[]

export interface Match {
    names: FixedLengthArray<2, string>
    rounds: Rounds,
    rules: Rules,
    __VERSION: number
}

export interface Rules {
    coop: number,
    defect: number,
    win: number,
    lose: number
}