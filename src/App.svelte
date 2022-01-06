<script lang="ts">
    // # Svelte with DCI
    //
    // If you like, open the [demo app](https://dilemma.surge.sh/) in a new tab to follow along better.
    //
    // A Svelte component can be considered a [DCI](https://en.wikipedia.org/wiki/Data,_context_and_interaction) Context,
    // which is an exciting programming paradigm. It describes a network of objects, cooperating to provide functionality 
    // according to a mental model, in a clear, readable way.
    //
    // A useful analogy for a Context is a theater play, so it will be used throughout this example to explain the DCI concepts.

    // # Imports

    // First, import types and components. Nothing directly DCI-related.
    import type { Updater } from 'svelte/store';
    import type { Choice, Rounds, Rules } from './lib/types';

    import {initialState, name1, name2, rounds, rules} from './lib/store';

    import Player from './lib/Player.svelte';
    import Scorefield from './lib/Scorefield.svelte';

    import ModalOpen from './lib/ModalOpen.svelte';
    import ModalClose from './lib/ModalClose.svelte';
    import Modal from './lib/Modal.svelte';

    // # Roles

    // Just like a character in a theater play, a **Role** is 
    // a character in a Context, played by an object.
    //
    // The Role itself is an identifier with a type (called
    // **RoleObjectContract** or **contract**) that determines what objects can play this particular Role.
    //
    // Role naming should be made according to the mental model
    // of the users, domain experts and other people related to the project.

    // ## Defining roles
    // The naming of Roles is convention-based. It is UPPERCASE here, to easily distinguish 
    // between roles and ordinary variables when reading the code.

    // A Role is defined by adding a variable followed by a type, that determines what objects can play this role.
    const RULES : {
        // To play the `RULES` Role, an object needs a method called `update` that takes an `Updater<Rules>`.
        update: (this : void, updater: Updater<Rules>) => void
    // Lastly, the assignment of the object playing the Role, the **RolePlayer**, is made. This is called **Role-binding**.
    } = rules 

    // ## RoleMethods
    // The interaction between objects in the `Context` is done through **RoleMethods**, which are basically 
    // methods related to a Role within a Context (never outside it). They should be considered methods attached to
    // the object at runtime when the object is playing its Role, like Neo plugging into the Matrix.
    //
    // The RoleMethods for a Role should be placed directly below its Role, to keep things local and easy to overview.
    //
    // The name of a RoleMethod is also convention-based, in this case we're using `ROLE_methodName`.

    // Here is the definition of a RoleMethod for the `RULES` Role called `update`, which
    // is almost self-explanatory. It handles updating the rules.
    // The method signature should be as explicit as possible, so the compiler can
    // catch any problems in the Context.
    const RULES_update = (e : CustomEvent<{field : string, value : number}>) => {

        // In the RoleMethod, the contract method `update` is called on its underlying object (the Roleplayer). 
        // A very important rule is that **only the Role's own RoleMethods can call its RoleObjectContract!**
        // This makes the code more local, and prevents other Roles from tampering with another RolePlayer. 
        // In the theater analogy, it would be like an actor suddenly being out of character.
        RULES.update(r => {
            r[e.detail.field] = e.detail.value
            return r
        })
    }

    // Here is the definition of a RoleMethod for the `RULES` Role called `calcScore`.
    // It seems to calculate scores based on a player and an opponent.
    // Just by contextualizing a methods, connecting it to a Role, makes the code easier
    // to understand. And there are more advantages...
    const RULES_calcScore = (player : Choice, opponent : Choice) => {
        // We refer directly to a Svelte store here. In general this is not best DCI practice
        // since Roles should only communicate through their RoleMethods, but since it is
        // a Svelte practise to refer to store data like this, and also given that the accessed 
        // data is immutable, it's ok to do it.
        if(player == opponent)
            return player ? $rules.coop : $rules.defect
        else
            return player ? $rules.lose : $rules.win
    }

    // The last RoleMethod for `RULES` makes another call to `RULES.update`, but also starts
    // an interaction by calling the RoleMethod of another Role.
    //
    // This is basically describing runtime system behavior, through a network of interacting objects.
    // We can follow the message flow inside the Context, understanding how the objects are
    // cooperating to further the purpose of the Context.
    //
    // In the theater analogy, this would be like an actor reading a line from the script, 
    // then waiting for another actor to say its line.
    const RULES_reset = () => {
        RULES.update(r => initialState.rules)
        MODALS_closeCurrent()
    }

    // Next Role is called `ROUNDS`, counting the number of rounds in the game.
    //
    // It has almost the same contract as the `RULES` role. This hints that there
    // should be a general type of object that can play these two Roles - a Svelte store in this case.
    //
    // It's very convenient to add functionality to the Svelte store like this, without having to
    // extend or subclass it in any way. Things are kept where they should be, in Context.
    const ROUNDS : {
        update: (this : void, updater: Updater<Rounds>) => void
    } = rounds

    // A RoleMethod is defined that restarts the rounds in the game.
    // It interacts with other Roles, asking them to do things like resetting and closing themselves.
    // Again, it is very clear what the code does.
    const ROUNDS_restart = () => {
        ROUNDS.update(r => [])
        ACTION1_reset()
        ACTION2_reset()
        MODALS_closeAll()
    }

    // Adding a round to the game is done here.
    const ROUNDS_add = (action1, action2) => {
        ROUNDS.update(r => [...r, [action1, action2] as const])
        ACTION1_reset()
        ACTION2_reset()
    }

    // A Role is defined with `let` this time, not `const`. It is also not best DCI practice, even
    // frowned upon, but for [primitive types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#the-primitives-string-number-and-boolean)
    // this is unfortunately needed, since it will mutate. Be extra careful that only the RoleMethods
    // of the Role are changing it!
    let ACTION1 : boolean | null = null

    const ACTION1_toggleCoop = () => ACTION1 = (ACTION1 === true ? null : true)
    const ACTION1_toggleCheat = () => ACTION1 = (ACTION1 === false ? null : false)
    const ACTION1_reset = () => ACTION1 = null

    // Same for the action state of the other player.
    // To avoid `let`, an object could be created with methods, and specify them in the RoleObjectContract,
    // but let's keep things simple for now.
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

    const WINDOW = null

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

    ///// Declarations ////////////////////////////////////

    $: {
        // Add a round if both buttons are pressed
        if(ACTION1 !== null && ACTION2 !== null) {
            const a1 = ACTION1
            const a2 = ACTION2
            setTimeout(() => ROUNDS_add(a1, a2), 150)
        }
    }

    $: player1score = $rounds.reduce((score, round) => score + RULES_calcScore(round[0], round[1]), 0)
    $: player2score = $rounds.reduce((score, round) => score + RULES_calcScore(round[1], round[0]), 0)

    ///////////////////////////////////////////////////////

</script>

<!----- HTML --------------------------------------------->

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

<!----- Modals ------------------------------------------->

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
                    <Scorefield on:input={RULES_update} field={"coop"} title={"Cooperate score"} actions={[true, true]} points={$rules.coop}></Scorefield>
                    <Scorefield on:input={RULES_update} field={"defect"} title={"Defect score"} actions={[false, false]} points={$rules.defect}></Scorefield>
                    <Scorefield on:input={RULES_update} field={"win"} title={"Win score"} actions={[false, true]} points={$rules.win}></Scorefield>
                    <Scorefield on:input={RULES_update} field={"lose"} title={"Lose score"} actions={[true, false]} points={$rules.lose}></Scorefield>
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
</style>