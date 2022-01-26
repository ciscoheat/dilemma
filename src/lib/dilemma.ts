export type Choice = boolean
export type Round = Readonly<FixedLengthArray<2, Choice>>
export type Rounds = Readonly<Round[]>

///////////////////////////////////////////////////////////

export interface DilemmaState {
    readonly rounds : Rounds
    readonly rules : {
        readonly coop : number,
        readonly defect : number,
        readonly win : number,
        readonly lose : number
    }
}

export const initialState : DilemmaState = {
    rounds: [],
    rules: {
        coop: 2,
        defect: 0,
        win: 3,
        lose: -1
    }
}

///////////////////////////////////////////////////////////

export class Dilemma {
    constructor(data = initialState) {
        this.RULES = data.rules
        this.ROUNDS = data.rounds
    }

    /**
     * The current score for the game, in the format [p1, p2].
     */
    public get score() {
        return this.ROUNDS_score()
    }

    /**
     * @param action1 true for cooperate, false for cheat/defect.
     * @param action2 true for cooperate, false for cheat/defect.
     * @returns an array with a new round appended.
     */
    public newRound(action1: Choice, action2: Choice) {
        return this.ROUNDS_add(action1, action2)
    }
    
    ///// Roles ///////////////////////////////////////////
    
    private readonly RULES: { 
        readonly coop: number
        readonly defect: number
        readonly win: number 
        readonly lose: number
    }

    protected RULES_score(player: Choice, opponent: Choice) {
        const r = this.RULES

        if(player == opponent)
            return player ? r.coop : r.defect
        else
            return player ? r.lose : r.win
    }

    ///////////////////////////////////////////////////////

    private readonly ROUNDS: Readonly<Rounds>

    protected ROUNDS_score() : FixedLengthArray<2, number> {
        return this.ROUNDS.reduce((scores, round) => [
            scores[0] + this.RULES_score(round[0], round[1]),
            scores[1] + this.RULES_score(round[1], round[0])
        ] as const, [0,0] as const)
    }

    protected ROUNDS_add(action1: Choice, action2: Choice) : Rounds {
        return [...this.ROUNDS, [action1, action2] as const]
    }
}