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
		openModal('options')
    }

    $: SCORES_player1 = $rounds.reduce((score, round) => score + SCORES__calc(round[0], round[1]), 0)
    $: SCORES_player2 = $rounds.reduce((score, round) => score + SCORES__calc(round[1], round[0]), 0)

    ///////////////////////////////////////////////////////

    const ROUNDS = rounds

    const ROUNDS_restart = () => {
        ROUNDS.update(r => [])
        ACTION1 = ACTION2 = null
		closeModals()
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
            setTimeout(() => ROUNDS_add(a1, a2), 150)
        }
    }

	///////////////////////////////////////////////////////

	const windowKeyup = (e : KeyboardEvent) => {
		const target = e.target as HTMLElement
		if(!target?.tagName || target.tagName.toUpperCase() == 'INPUT') return

		if(e.code == 'Digit1') {
			if(ACTION1 === null)
				ACTION1_toggleCoop()
			else
				ACTION2_toggleCoop()
		}
		else if(e.code == 'Digit2') {
			if(ACTION1 === null)
				ACTION1_toggleCheat()
			else
				ACTION2_toggleCheat()
		}
		else if(e.code == "Escape") {
			closeModals()
		}
	}

	const openModal = (name : 'options' | 'restart' | 'reset' | '') => {
		const target = '#' + name
		window.location.replace(target)
		if(!name) history.replaceState({}, document.title, ".")
	}

	const closeModals = () => openModal('')

</script>

<svelte:window on:keyup={windowKeyup}/>

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
			<a href="#restart">
    	        <div class="btn outline btn-danger">Restart</div>
			</a>
            <a href="#options">
                <div class="btn outline btn-info">Options</div>
            </a>
        </div>
    </div>
</div>

<div class="modal modal-animated--zoom-in" id="options" on:click|self={() => closeModals()}>
    <div class="modal-content" role="document">
        <div class="modal-header">
            <div class="modal-title u-flex u-justify-space-between">
                <div class="mr-3">Options</div>
                <a href="javascript:;" on:click={() => closeModals()} class="u-pull-right btn-close" aria-label="Close">
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
            <a href="#reset">
				<div class="btn outline btn-danger mt-2">Reset scores</div>
			</a>
			<p class="faded" style="line-height:1.33rem">
				Use keyboard 1,2 keys to click buttons.
			</p>
        </div>
    </div>
</div>

<div class="modal modal-animated--zoom-in" id="restart" on:click|self={e => closeModals()}>
    <div class="modal-content" role="document">
        <div class="modal-body">
			<h5>Are you sure?</h5>
			<div class="btn btn-danger" on:click={() => ROUNDS_restart()}>Yes</div>
			<div class="btn btn-plain" on:click={() => closeModals()}>No</div>
        </div>
    </div>
</div>

<div class="modal modal-animated--zoom-in" id="reset">
    <div class="modal-content" role="document">
        <div class="modal-body">
			<h5>Are you sure?</h5>
			<div class="btn btn-danger" on:click={() => SCORES_reset()}>Yes</div>
			<a href="#options" class="close-btn p-0" aria-label="Close">
				<div class="btn btn-plain">No</div>
			</a>
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