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

    // First, import types and components. Nothing directly DCI-related, but some of these types will be used as *Data*, the
    // first part of the DCI acronym. These are simple objects like Svelte stores and data structures.
    import type { Updater } from 'svelte/store';
    import type { Choice, Rounds, Rules } from './lib/types';

    import {initialState, name1, name2, rounds, rules} from './lib/store';

    import Player from './lib/Player.svelte';
    import Scorefield from './lib/Scorefield.svelte';

    import ModalOpen from './lib/ModalOpen.svelte';
    import ModalClose from './lib/ModalClose.svelte';
    import Modal from './lib/Modal.svelte';

    // # Roles

    // Just like a character in a theater play, a **Role** is a character in a **Context**, played by an object.
    //
    // The Role itself is an identifier with a type (called **RoleObjectContract** or **contract**) 
    // that determines what objects can play this particular Role.
    //
    // The naming of Roles is convention-based. It is UPPERCASE for this project, to easily distinguish 
    // between Roles and ordinary variables when reading the code.

    // ### The 'RULES' Role

    // A Role is defined by adding a variable followed by a type, that determines what objects can play this role.
    // Here we define a Role called `RULES`, containing the rules of the game.
    const RULES : {
        // To play the `RULES` Role, we specify that an object needs a method called `update` that takes an `Updater<Rules>`:
        update: (this : void, updater: Updater<Rules>) => void
    // Lastly the assignment of the object playing the Role, the **RolePlayer**, is made.
    // This is called **Role-binding** and should only be done once in the Context, as we will see later. `const` is very useful
    // for enforcing this.
    } = rules 

    // ## RoleMethods
    // The interaction between objects in the `Context` is done through **RoleMethods**, which are basically 
    // methods related to a specific Role within a Context, never outside.
    //
    // RoleMethods should be considered like methods attached to an object whit it's playing a Role inside a Context.
    // This is similar to Neo plugging into the Matrix, suddenly being very versatile.
    //
    // Code-wise, since there is no `context` declaration like a `class` in typescript or javascript, 
    // the RoleMethods for a Role should be placed directly below its Role, to keep a sense of them belonging to their respective Role.
    //
    // The name of a RoleMethod is also convention-based, in this case we're using `ROLE_methodName`.

    // Here is the definition of a RoleMethod for `RULES` called `update`, which handles updating the rules, pretty self-explanatory.
    // The method signature should be as explicit as possible, so the compiler can catch any problems in the Context.
    const RULES_update = (e : CustomEvent<{field : string, value : number}>) => {

        // Inside this RoleMethod, the contract method `update` we defined above is called on its underlying object (the Roleplayer). 
        //
        // A very important rule is that **only the Role's own RoleMethods can call its RoleObjectContract!**
        // This restriction is very useful since it prevents other Roles from tampering directly with another RolePlayer. 
        // In the theater analogy, that would be like an actor suddenly being out of character.
        RULES.update(r => {
            r[e.detail.field] = e.detail.value
            return r
        })
    }

    // Here is the next definition of a RoleMethod for the `RULES` Role, called `calculateScore`.
    // At a glance, it seems to calculate scores based on a player and an opponent.
    // Contextualizing a method like this, connecting it to a Role, makes the code easier
    // to understand, and expresses the mental model of this part of the system very well.
    // It also helps when "rewiring" the Context, when (not if) functionality changes.
    const RULES_calculateScore = (player : Choice, opponent : Choice) => {
        // ### Data access

        // In `calculateScore`, we refer directly to a Svelte store. In general this is not best DCI practice,
        // since Roles should only communicate through their RoleMethods, but since it is
        // a Svelte standard to refer to store data like this, and also given that the accessed 
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
    // cooperating to further the purpose of the Context. No patterns, inheritance or any other engineering
    // structures obstructing what's really going on in the system.
    //
    // In the theater analogy, this would be like an actor reading a line from the script, 
    // then waiting for another actor to say the next line.
    const RULES_reset = () => {
        RULES.update(r => initialState.rules)
        MODALS_closeCurrent()
    }

    // ### The 'ROUNDS' Role

    // Next Role is called `ROUNDS`, keeping track of the number of rounds in the game.
    //
    // It has almost the same contract as the `RULES` role. This hints that there
    // should be a generic type of object that can play these two Roles - a Svelte store in this case.
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

    const ROUNDS_add = (action1, action2) => {
        ROUNDS.update(r => [...r, [action1, action2] as const])
        ACTION1_reset()
        ACTION2_reset()
    }

    // ### Role: ACTION1

    // A Role is defined with `let` this time, not `const`. It is also not best DCI practice, even
    // frowned upon, but for [primitive types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#the-primitives-string-number-and-boolean)
    // this is unfortunately needed, since it will mutate. Be extra careful that only the RoleMethods
    // of the Role are changing it!
    let ACTION1 : boolean | null = null

    const ACTION1_toggleCoop = () => ACTION1 = (ACTION1 === true ? null : true)
    const ACTION1_toggleCheat = () => ACTION1 = (ACTION1 === false ? null : false)
    const ACTION1_reset = () => ACTION1 = null

    // ### Role: ACTION2

    // Same for the action state of the other player.
    // To avoid `let`, an object could be created with methods, and specify them in the RoleObjectContract, 
    // but let's keep things simple for now and see what happens.
    let ACTION2 : boolean | null = null

    const ACTION2_toggleCoop = () => ACTION2 = (ACTION2 === true ? null : true)
    const ACTION2_toggleCheat = () => ACTION2 = (ACTION2 === false ? null : false)
    const ACTION2_reset = () => ACTION2 = null

    // ### Role: MODALS

    // Could this be a Role that handles modals? It certainly seems so, and it's quite simple -
    // just an array of strings. With DCI, data objects are allowed to be simple, 
    // since *Data* (the objects playing a Role) and *Function* (RoleMethods inside a Context) have
    // different rate of change. The Data changes very infrequently compared to the fast-moving, 
    // featured-packed functionality of an app.
    const MODALS : string[] = []

    // The contract for `MODALS` is simple since the CSS framework is using anchor tags to display modals.
    // So now we can add functionality by interacting with the `WINDOW` Role.
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

    // The WINDOW Role is played by the browser window. The DCI-purist way would be to
    // create a type with exactly what's needed to play the Role.
    //
    // The most obvious advantage with that is that we're making the Role more generic.
    // Any object fulfilling the contract type can now be a WINDOW, not just the browser, which
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
    }

    // ## Some final declarations

    // The Roles are done! Usually, there are some loose ends to tie up. For example,
    // we want to calculate and display the player scores based upon the rules. The app is simple enough
    // for there to be no `Player´ object, so this is a perfect place for a few Svelte declarations.
    $: player1score = $rounds.reduce((score, round) => score + RULES_calculateScore(round[0], round[1]), 0)
    $: player2score = $rounds.reduce((score, round) => score + RULES_calculateScore(round[1], round[0]), 0)

    // Another thing we want to do is to add a new round when both player actions are specified.
    // This check could be done in the `ACTION1` and `ACTION2` RoleMethods,
    // but hey, this is Svelte. We can make it simpler with a declaration, but beware...
    $: {
        // By comparing Roles with something, we are directly accessing the RolePlayers!
        // This is not allowed, if you remember the out of character problem, opening up for all sorts of issues. 
        // So we could very well be bitten by basically laziness in the future.
        //
        // However, it's a perfect way of getting into DCI, so if you've read this far and want to dig in,
        // clone [the repo](https://github.com/ciscoheat/dilemma) and make an attempt to fix those Roles!
        // Open an issue if you have any questions.
        if(ACTION1 !== null && ACTION2 !== null) {            
            const a1 = ACTION1
            const a2 = ACTION2
            setTimeout(() => ROUNDS_add(a1, a2), 150)
        }
    }

    // ## DCI resources

    // The rest of the component should be pretty much self-explanatory if you've done the [Svelte tutorial](https://svelte.dev/tutorial/basics).
    //
    // This has just scratched the surface of the DCI paradigm, and there are plenty of resources if you want to know more, I'll list them right below.
    //
    // The best way to ask anything is by opening an issue at [the repo](https://github.com/ciscoheat/dilemma) of this project.
    // Hope to hear from you!
    //
    // - [Official DCI website](http://fulloo.info/)
    // - [FAQ](http://fulloo.info/doku.php?id=faq)
    // - [Discussion group](https://groups.google.com/forum/?fromgroups#!forum/object-composition)
    // - [Wikipedia](http://en.wikipedia.org/wiki/Data,_Context,_and_Interaction)
    // - Tutorials in other languages: [Haxe](https://github.com/ciscoheat/haxedci) and [PHP](https://github.com/ciscoheat/dcisniffer#dci-tutorial).

</script>

<!----- HTML --------------------------------------------->

<svelte:window on:keyup={WINDOW_checkKeyboardShortcuts}/>

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
        <div class="grid-c-12 u-text-center pt-1">
            <a href="./docs/src/App.html" class="text-gray-500" target="_blank"><small>Annotated source code</small></a>
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