<script lang="ts">
    // # DCI with Svelte
    //
    // If you like, open the [demo app](https://dilemma.surge.sh/) in a new tab to follow along. Source maps are included.
    //
    // A Svelte component can be considered a [DCI](https://en.wikipedia.org/wiki/Data,_context_and_interaction) Context,
    // DCI being a very exciting programming paradigm. 
    //
    // It stands for *Data, Context, Interaction*, and describes a network of objects, interacting to provide functionality 
    // according to a mental model, in a clear, readable way.
    //
    // A useful analogy for a DCI Context is a theater play, so it will be used throughout this example to explain the concepts.

    // # Imports

    // First, import types and components. Nothing directly DCI-related, but some of these objects will be used as *Data*, the
    // first part of the DCI acronym. These are simple objects like Svelte stores and ./dilem./lib/dilemmaes.

    import { Choice, Dilemma, Rounds } from './lib/dilemma'

    import Player from './Player.svelte';
    import Scorefield from './Scorefield.svelte';

    import ModalOpen from './modal/ModalOpen.svelte';
    import ModalClose from './modal/ModalClose.svelte';
    import Modal from './modal/Modal.svelte';

    import { produce, castDraft } from 'immer'
    import type { WritableDraft } from 'immer/dist/internal';
    import { AppState, AppStorage } from './appStorage';
    import debug from 'debug';

    const d = debug('app')

    ///// Roles ///////////////////////////////////////////

    let PLAYER1 : string

    const PLAYER1_updateName = (name: string) => {
        update(state => state.players[0] = name)
    }

    let PLAYER2 : string

    const PLAYER2_updateName = (name: string) => {
        update(state => state.players[1] = name)
    }

    ///////////////////////////////////////////////////////

    let ROUNDS : readonly Readonly<FixedLengthArray<2,Choice>>[]

    ///////////////////////////////////////////////////////
   
    let GAME : {        
        newRound: (action1: Choice, action2: Choice) => Rounds
        score: FixedLengthArray<2, number>
    }
    
    const GAME_isOver = () => gameOver

    const GAME_addRound = (action1: boolean, action2: boolean) => {
        update(state => state.rounds = castDraft(GAME.newRound(
            action1 ? Choice.COOP : Choice.DEFECT, 
            action2 ? Choice.COOP : Choice.DEFECT
        )))
        ACTION1_reset()
        ACTION2_reset()
    }

    const GAME_restart = (_ = null) => {
        update(state => state.rounds = castDraft(storage.initial().rounds))
        ACTION1_reset()
        ACTION2_reset()
        MODALS_closeAll()
    }

    ///////////////////////////////////////////////////////

    let RULES: { 
        coop: number; defect: number; 
        win: number; lose: number; 
    }

    const RULES_update = (e : CustomEvent<{field : "coop" | "defect" | "win" | "lose", value : number}>) => {
        update(state => {
            state.rules[e.detail.field] = e.detail.value
        })
    }

    const RULES_reset = () => {
        update(state => state.rules = storage.initial().rules)
        MODALS_closeCurrent()
    }

    ///////////////////////////////////////////////////////

    // ### Role: ACTION1

    // For the game, we need a Role that indicates what action a player wants to take for the current round. 
    // It is defined with `let` this time, not `const`. That's not best DCI practice, even frowned upon, 
    // but for [primitive types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#the-primitives-string-number-and-boolean)
    // this is unfortunately needed, since it will mutate. Be extra careful that only the RoleMethods of the Role are changing it!
    let ACTION1 : boolean | null = null

    const ACTION1_toggleCoop = () => {
        if(GAME_isOver()) return
        ACTION1 = (ACTION1 === true ? null : true)
    }
    const ACTION1_toggleCheat = () => {
        if(GAME_isOver()) return
        ACTION1 = (ACTION1 === false ? null : false)
    }
    const ACTION1_reset = () => ACTION1 = null

    // ### Role: ACTION2

    // We'll do the same for the action state of the other player.
    // To avoid `let`, a kind of domain object could be created, with state and methods handling the action, 
    // then it can be bound to a Role only once with `const`. But let's keep things simple for now and see what happens.
    let ACTION2 : boolean | null = null

    const ACTION2_toggleCoop = () => {
        if(GAME_isOver()) return
        ACTION2 = (ACTION2 === true ? null : true)
    }
    const ACTION2_toggleCheat = () => {
        if(GAME_isOver()) return
        ACTION2 = (ACTION2 === false ? null : false)
    }
    const ACTION2_reset = () => ACTION2 = null

    // ### Role: MODALS

    // Could this be a Role that handles modal windows? It certainly seems so, and it's quite simple -
    // just an array of strings. With DCI, data objects are allowed to be simple, 
    // since *Data* (the objects playing a Role) and *Function* (RoleMethods inside a Context) have
    // different rate of change. The Data changes very infrequently compared to the fast-moving, 
    // featured-packed functionality of an app.
    const MODALS : string[] = []

    // The contract for `MODALS`, a string array, is that simple since the CSS framework is using anchor tags to display modals.
    // That means we can keep track of them using only the anchor - a string.
    // Now we can add functionality by interacting with the `WINDOW` Role.
    const MODALS_open = (name = '') => {
        WINDOW_goto('#' + name)

        if(!name) {
            // Remember, only call or modify the RolePlayer through its own RoleMethods!
            MODALS.length = 0
            WINDOW_removeHash()
        } else {
            MODALS.push(name)
        }
    }

    // Closing a modal can now be done by manipulating the array like a stack.
    const MODALS_closeCurrent = (_ = null) => {
        MODALS.pop() // Remove the current modal        
        MODALS_open(MODALS.pop()) // Open the previous one, if it exists
    }

    // Finally for the Role, closing all modals.
    const MODALS_closeAll = () => MODALS_open('')

    // ### The WINDOW Role

    // The `WINDOW` Role is played by the browser window. The DCI-purist way would be to
    // create a type with exactly what's needed to play the Role.
    //
    // Then, the most obvious advantage is that we're making the Role more generic.
    // Any object fulfilling the contract type can now be a `WINDOW`, not just the browser, which
    // certainly would be useful if we're porting the app to another platform.
    //
    // Another interesting advantage is that we only observe what the Roles can do in the current Context. 
    // This is called "Full OO", a powerful concept that you can 
    // [read more about here](https://groups.google.com/d/msg/object-composition/umY_w1rXBEw/hyAF-jPgFn4J), but basically, 
    // by doing this we don't need to start digging into the browser Window API, or essentially anything outside the current Context.
    //
    // This is very important for [locality](http://www.saturnflyer.com/blog/jim/2015/04/21/locality-and-cohesion/), 
    // the ability to understand code by looking at only a small portion of it.
    //
    // So, should we do it? In a large project, most likely. But this is a small one, and the browser Window interface is
    // well known to most programmers, so in this case, we can do without it.
    //
    // The `WINDOW` RoleMethods can be studied if you want to know more about the exact functionality, but in general,
    // looking at the names should be enough to understand what will happen. Naming is important, of course, and when
    // discussing with users and domain experts, a terminology should emerge that should be reflected in the Roles and RoleMethod names.
    const WINDOW = window

    const WINDOW_goto = (url : string) =>
        WINDOW.location.replace(url)

    const WINDOW_removeHash = () => 
        history.replaceState({}, WINDOW.document.title, ".")

    const WINDOW_checkKeyboardShortcuts = (e : KeyboardEvent) => {
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
        else if(e.code == "Enter") {
            const p1 = document.querySelector('input.player1') as HTMLInputElement
            const p2 = document.querySelector('input.player2') as HTMLInputElement

            if(document.activeElement == p1) {
                p2.focus()
                p2.select()
            }
            else if(document.activeElement == p2) {
                p2.blur()
            }
        }
    }

    ///// State and binding ///////////////////////////////

    const storage = new AppStorage()

    let _state = storage.load('dilemma')

    const update = (newState : (prev : WritableDraft<AppState>) => any) => {
        _state = produce(_state, (prev) => {
            newState(prev)
        })

        storage.save('dilemma', _state)
        rebind(_state)
    }

    const rebind = (state : AppState) => {
        try {
            PLAYER1 = state.players[0]
            PLAYER2 = state.players[1]
            ROUNDS = state.rounds
            GAME = new Dilemma(state)
            RULES = state.rules
            ACTION1 = ACTION1
            ACTION2 = ACTION2
            //MODALS = MODALS
            //WINDOW = WINDOW
        } catch(error) {
            rebind(storage.initial())
        }
    }

    rebind(_state)

    ///// Transient state /////////////////////////////////

    let gameRounds = 10

    $: {
        if(ACTION1 !== null && ACTION2 !== null) {
            const a1 = ACTION1
            const a2 = ACTION2
            setTimeout(() => GAME_addRound(a1, a2), 150)
        }
    }

    $: currentRound = ROUNDS.length + 1
    $: gameOver = currentRound >= gameRounds
    $: p1won = gameOver ? GAME.score[0] >= GAME.score[1] : null
    $: p2won = gameOver ? GAME.score[1] >= GAME.score[0] : null

</script>

<!----- HTML --------------------------------------------->

<svelte:window on:keyup={WINDOW_checkKeyboardShortcuts}/>

<div class="u-flex u-justify-center">
    <div class="grid">
        <div class="grid-c-12 u-text-center">
            {#if !gameOver}
                <h2 class="my-1">
                    <div>Round {currentRound} /</div>
                    {#if currentRound == 1}
                        <input bind:value={gameRounds} type="number" min="1" class="u-inline">
                    {:else}
                        <div>{gameRounds}</div>
                    {/if}
                </h2>
            {:else}
                <h2 class="my-1">Game over!</h2>
            {/if}
        </div>
        <div class="grid-c-5">
            <Player bind:name={PLAYER1} nr={1} update={PLAYER1_updateName} score={GAME.score[0]} won={p1won} state={ACTION1} coop={ACTION1_toggleCoop} cheat={ACTION1_toggleCheat}></Player>
        </div>
        <div class="grid-c-2"></div>
        <div class="grid-c-5">
            <Player bind:name={PLAYER2} nr={2} update={PLAYER2_updateName} score={GAME.score[1]} won={p2won} state={ACTION2} coop={ACTION2_toggleCoop} cheat={ACTION2_toggleCheat}></Player>
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

<!----- Modals ------------------------------------------->

<Modal name={"rules"} close={MODALS_closeCurrent}>
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
                <Scorefield on:input={RULES_update} field={"coop"} title={"Cooperate score"} actions={[true, true]} points={RULES.coop}></Scorefield>
                <Scorefield on:input={RULES_update} field={"defect"} title={"Defect score"} actions={[false, false]} points={RULES.defect}></Scorefield>
                <Scorefield on:input={RULES_update} field={"win"} title={"Win score"} actions={[false, true]} points={RULES.win}></Scorefield>
                <Scorefield on:input={RULES_update} field={"lose"} title={"Lose score"} actions={[true, false]} points={RULES.lose}></Scorefield>
            </tbody>
        </table>
        <ModalOpen name={"reset"} opener={MODALS_open}>
            <div class="btn outline btn-danger mt-2">Reset rules</div>
        </ModalOpen>
        <div class="help faded u-text-center">
            <p>Use keyboard 1,2 keys to click buttons.</p>
            <p>
                <a target="_blank" href="https://en.wikipedia.org/wiki/Prisoner%27s_dilemma">What is the Prisoner's dilemma?</a>
            </p>
        </div>
    </div>
</Modal>

<Modal name={"restart"} close={MODALS_closeCurrent}>
    <div class="modal-body">
        <h5 class="mb-3">Restart game?</h5>
        <div class="btn btn-danger" on:click={GAME_restart}>Yes</div>
        <div class="btn btn-plain" on:click={MODALS_closeCurrent}>No</div>
    </div>
</Modal>

<Modal name={"reset"} close={MODALS_closeCurrent}>
    <div class="modal-body">
        <h5 class="mb-3">Reset rules?</h5>
        <div class="btn btn-danger" on:click={() => RULES_reset()}>Yes</div>
        <div class="btn btn-plain" on:click={MODALS_closeCurrent}>No</div>
    </div>
</Modal>

<!----- STYLES ------------------------------------------->

<style lang="scss">
    .options {
        gap: 20px;
    }

    .help {
        p {
            line-height: 1.33rem;
            margin-bottom: 0.5rem;
        }
    }

    h2 {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;

        input {
            width: 80px !important;
            font-size: 2rem !important;
            padding: 0 10px !important;
            height: 2.5rem !important;
        }
    }
</style>