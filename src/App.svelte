<script lang="ts">
    import type { Choice } from './lib/types';
    import {initialState, name1, name2, rounds, rules} from './lib/store'

    import Player from './lib/Player.svelte';
    import Scorefield from './lib/Scorefield.svelte';

	import ModalOpen from './lib/ModalOpen.svelte';
	import ModalClose from './lib/ModalClose.svelte';
	import Modal from './lib/Modal.svelte';

    ///////////////////////////////////////////////////////

    const RULES = rules

    const RULES__calcScore = (player : Choice, opponent : Choice) => {
        if(player == opponent) 
            return player ? $RULES.coop : $RULES.defect
        else
            return player ? $RULES.lose : $RULES.win
    }

    const RULES_update = (e) => {
        RULES.update(s => {
            s[e.detail.field] = e.detail.value
            return s
        })
    }

    const RULES_reset = () => {
        RULES.update(() => initialState.rules)
		MODALS_closeCurrent()
    }

    ///////////////////////////////////////////////////////

    const ROUNDS = rounds

    const ROUNDS_restart = () => {
        ROUNDS.update(r => [])
        ACTION1_reset()
		ACTION2_reset()
		MODALS_closeAll()
    }

    const ROUNDS_add = (action1, action2) => {
        ROUNDS.update(r => [...r, [action1, action2] as const])
        ACTION1_reset()
		ACTION2_reset()
    }

    ///////////////////////////////////////////////////////

    let ACTION1 : boolean | null = null
    
    const ACTION1_toggleCoop = () => ACTION1 = (ACTION1 === true ? null : true)
    const ACTION1_toggleCheat = () => ACTION1 = (ACTION1 === false ? null : false)
	const ACTION1_reset = () => ACTION1 = null
    
    let ACTION2 : boolean | null = null

    const ACTION2_toggleCoop = () => ACTION2 = (ACTION2 === true ? null : true)
    const ACTION2_toggleCheat = () => ACTION2 = (ACTION2 === false ? null : false)
	const ACTION2_reset = () => ACTION2 = null

	///////////////////////////////////////////////////////

	const MODALS : string[] = []

	const MODALS_open = (name = '') => {
		const target = '#' + name
		window.location.replace(target)

		if(!name) {
			MODALS.length = 0
			history.replaceState({}, document.title, ".")
		} else {
			MODALS.push(name)
		}
	}

	const MODALS_closeCurrent = (_ = null) => {
		// Remove the current one
		MODALS.pop()
		// Open the previous one, if it exists
		MODALS_open(MODALS.pop())
	}

	const MODALS_closeAll = () => MODALS_open('')

	///////////////////////////////////////////////////////

	const WINDOW = window

	const WINDOW_keyup = (e : KeyboardEvent) => {
		const target = e.target as HTMLElement
		const isInput = !!(target?.tagName.toUpperCase() == 'INPUT')

		if(e.code == 'Digit1' && !isInput) {
			if(ACTION1 === null)
				ACTION1_toggleCoop()
			else
				ACTION2_toggleCoop()
		}
		else if(e.code == 'Digit2' && !isInput) {
			if(ACTION1 === null)
				ACTION1_toggleCheat()
			else
				ACTION2_toggleCheat()
		}
		else if(e.code == "Escape") {
			MODALS_closeCurrent()
		}
	}

	$: {
        // Add a round if both buttons are pressed
        if(ACTION1 !== null && ACTION2 !== null) {
            const a1 = ACTION1
            const a2 = ACTION2
            setTimeout(() => ROUNDS_add(a1, a2), 150)
        }
    }

	$: player1score = $rounds.reduce((score, round) => score + RULES__calcScore(round[0], round[1]), 0)
    $: player2score = $rounds.reduce((score, round) => score + RULES__calcScore(round[1], round[0]), 0)

	///////////////////////////////////////////////////////

</script>

<!-- HTML -->

<svelte:window on:keyup={WINDOW_keyup}/>

<div class="u-flex u-justify-center">
    <div class="grid">
        <div class="grid-c-12 u-text-center">
            <h2 class="my-1">Round {$rounds.length+1}</h2>
        </div>
        <div class="grid-c-5">
            <Player bind:name={$name1} score={player1score} state={ACTION1} coop={ACTION1_toggleCoop} cheat={ACTION1_toggleCheat}></Player>
        </div>
        <div class="grid-c-2"></div>
        <div class="grid-c-5">
            <Player bind:name={$name2} score={player2score} state={ACTION2} coop={ACTION2_toggleCoop} cheat={ACTION2_toggleCheat}></Player>
        </div>
        <div class="options grid-c-12 u-flex u-justify-center mt-4">
			<ModalOpen name={"restart"} opener={MODALS_open}>
    	        <div class="btn outline btn-danger">Restart</div>
			</ModalOpen>
            <ModalOpen name={"rules"} opener={MODALS_open}>
                <div class="btn outline btn-info">Change rules</div>
            </ModalOpen>
        </div>
    </div>
</div>

<!-- Modals -->

<Modal name={"rules"} closer={MODALS_closeCurrent}>
    <div class="modal-content" role="document">
        <div class="modal-header">
            <div class="modal-title u-flex u-justify-space-between">
                <div class="mr-3">Rules</div>
				<ModalClose closer={MODALS_closeCurrent}>
                    <span class="icon">
                        <i class="fa-wrapper fa fa-times"></i>
                    </span>
                </ModalClose>
            </div>
        </div>
        <div class="modal-body">
			<table class="table mb-0">
				<tbody>
					<Scorefield on:input={RULES_update} field={"coop"} title={"Cooperate score"} actions={[true, true]} points={$RULES.coop}></Scorefield>
					<Scorefield on:input={RULES_update} field={"defect"} title={"Defect score"} actions={[false, false]} points={$RULES.defect}></Scorefield>
					<Scorefield on:input={RULES_update} field={"win"} title={"Win score"} actions={[false, true]} points={$RULES.win}></Scorefield>
					<Scorefield on:input={RULES_update} field={"lose"} title={"Lose score"} actions={[true, false]} points={$RULES.lose}></Scorefield>
				</tbody>
			</table>
			<ModalOpen name={"reset"} opener={MODALS_open}>
				<div class="btn outline btn-danger mt-2">Reset rules</div>
			</ModalOpen>
			<p class="faded" style="line-height:1.33rem">
				Use keyboard 1,2 keys to click buttons.
			</p>
        </div>
    </div>
</Modal>

<Modal name={"restart"} closer={MODALS_closeCurrent}>
    <div class="modal-content" role="document">
        <div class="modal-body">
			<h5 class="mb-3">Restart game?</h5>
			<div class="btn btn-danger" on:click={() => ROUNDS_restart()}>Yes</div>
			<div class="btn btn-plain" on:click={MODALS_closeCurrent}>No</div>
        </div>
    </div>
</Modal>

<Modal name={"reset"} closer={MODALS_closeCurrent}>
    <div class="modal-content" role="document">
        <div class="modal-body">
			<h5 class="mb-3">Reset rules?</h5>
			<div class="btn btn-danger" on:click={() => RULES_reset()}>Yes</div>
			<div class="btn btn-plain" on:click={MODALS_closeCurrent}>No</div>
        </div>
    </div>
</Modal>

<!-- STYLE -->

<style lang="scss">
    .options {
        gap: 20px;
    }
</style>