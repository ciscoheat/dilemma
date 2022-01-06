<script lang="ts">
    import type { Choice } from './lib/types';

    import Player from './lib/Player.svelte';
    import Scorefield from './lib/Scorefield.svelte';

    import {initialState, name1, name2, rounds, scores} from './lib/store'

    ///////////////////////////////////////////////////////

    const SCORES = scores

    const SCORES__calc = (player : Choice, opponent : Choice) => {
        if(player == opponent) 
            return player ? $SCORES.coop : $SCORES.defect
        else
            return player ? $SCORES.lose : $SCORES.win
    }

    const SCORES_update = (e) => {
        SCORES.update(s => {
            s[e.detail.field] = e.detail.value
            return s
        })
    }

    const SCORES_reset = () => {
        SCORES.update(() => initialState.scores)
    }

    $: SCORES_player1 = $rounds.reduce((score, round) => score + SCORES__calc(round[0], round[1]), 0)
    $: SCORES_player2 = $rounds.reduce((score, round) => score + SCORES__calc(round[1], round[0]), 0)

    ///////////////////////////////////////////////////////

    const ROUNDS = rounds

    const ROUNDS_restart = () => {
        if(!window.confirm('Are you sure?')) return
        ROUNDS.update(r => [])
        ACTION1 = ACTION2 = null
    }

    const ROUNDS_add = (action1, action2) => {
        ROUNDS.update(r => [...r, [action1, action2] as const])
        ACTION1 = ACTION2 = null
    }

    ///////////////////////////////////////////////////////

    let ACTION1 : boolean | null = null
    
    const ACTION1_toggleCoop = () => ACTION1 = (ACTION1 === true ? null : true)
    const ACTION1_toggleCheat = () => ACTION1 = (ACTION1 === false ? null : false)
    
    let ACTION2 : boolean | null = null

    const ACTION2_toggleCoop = () => ACTION2 = (ACTION2 === true ? null : true)
    const ACTION2_toggleCheat = () => ACTION2 = (ACTION2 === false ? null : false)

    ///////////////////////////////////////////////////////

    $: {
        // Add a round if something changed
        if(ACTION1 !== null && ACTION2 !== null) {
            const a1 = ACTION1
            const a2 = ACTION2
            setTimeout(() => ROUNDS_add(a1, a2), 200)
        }
    }

</script>

<div class="u-flex u-justify-center">
    <div class="grid">
        <div class="grid-c-12 u-text-center">
            <h2 class="my-1">Round {$rounds.length+1}</h2>
        </div>
        <div class="grid-c-5">
            <Player bind:name={$name1} score={SCORES_player1} state={ACTION1} coop={ACTION1_toggleCoop} cheat={ACTION1_toggleCheat}></Player>
        </div>
        <div class="grid-c-2"></div>
        <div class="grid-c-5">
            <Player bind:name={$name2} score={SCORES_player2} state={ACTION2} coop={ACTION2_toggleCoop} cheat={ACTION2_toggleCheat}></Player>
        </div>
        <div class="options grid-c-12 u-flex u-justify-center mt-4">
            <div class="btn outline btn-danger" on:click={e => ROUNDS_restart()}>Restart</div>
            <a href="#options">
                <div class="btn outline btn-info">Options</div>
            </a>
        </div>
    </div>
</div>

<div class="modal  modal-animated--zoom-in" id="options">
    <div class="modal-content" role="document">
        <div class="modal-header">
            <div class="modal-title u-flex u-justify-space-between">
                <div class="mr-3">Options</div>
                <a href="#CLOSE" class="u-pull-right" aria-label="Close">
                    <span class="icon">
                        <i class="fa-wrapper fa fa-times"></i>
                    </span>
                </a>
            </div>
        </div>
        <div class="modal-body">
            <Scorefield on:input={SCORES_update} field={"coop"} title={"Coop score"} actions={[true, true]} points={$SCORES.coop}></Scorefield>
            <Scorefield on:input={SCORES_update} field={"defect"} title={"Defect score"} actions={[false, false]} points={$SCORES.defect}></Scorefield>
            <Scorefield on:input={SCORES_update} field={"win"} title={"Win score"} actions={[false, true]} points={$SCORES.win}></Scorefield>
            <Scorefield on:input={SCORES_update} field={"lose"} title={"Lose score"} actions={[true, false]} points={$SCORES.lose}></Scorefield>
            <div class="btn outline btn-danger mt-2" on:click={() => SCORES_reset()}>Reset scores</div>
        </div>
    </div>
</div>

<style lang="scss">
    .options {
        gap: 20px;
    }

    .modal {
        background-color: rgba($color: #000000, $alpha: 0.25);
    }
</style>